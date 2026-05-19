import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Banknote, CalendarDays, ClipboardList, FileText, Wrench } from 'lucide-react';
import { getObraById, getSetoresByObraId } from '../config/setores';
import { getIncendios, getObraNotes, getObraRDOs, getObraServices } from '../services/firestore';
import { Incendio, ObraNote, ObraRDO, ObraService } from '../types';
import Dashboard from '../components/Dashboard';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const parseISODateLocal = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const chipClasses = (tone: 'gray' | 'blue' | 'emerald' | 'red' | 'indigo' | 'violet') => {
  switch (tone) {
    case 'blue':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'emerald':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'red':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'indigo':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'violet':
      return 'bg-violet-50 text-violet-800 border-violet-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
};

export default function ObraDashboardPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const setores = useMemo(() => (obraId ? getSetoresByObraId(obraId) : []), [obraId]);

  const [incendios, setIncendios] = useState<Incendio[]>([]);
  const [services, setServices] = useState<ObraService[]>([]);
  const [notes, setNotes] = useState<ObraNote[]>([]);
  const [rdos, setRdos] = useState<ObraRDO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!obraId) return;
      try {
        setLoading(true);
        setError('');

        const [incendiosBySetor, servicesData, notesData, rdosData] = await Promise.all([
          Promise.all(setores.map((s) => getIncendios(s.id))),
          getObraServices(obraId),
          getObraNotes(obraId),
          getObraRDOs(obraId),
        ]);

        const merged = incendiosBySetor.flat();

        const map = new Map<string, Incendio>();
        for (const inc of merged) map.set(inc.id, inc);

        const unique = Array.from(map.values());
        unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIncendios(unique);
        setServices(servicesData);
        setNotes(notesData);
        setRdos(rdosData);
      } catch (err) {
        console.error('Erro ao carregar dashboard da obra:', err);
        setError('Não foi possível carregar o dashboard desta obra.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [obraId, setores]);

  const serviceSummary = useMemo(() => {
    const byPackage = new Map<string, ObraService[]>();
    for (const s of services) {
      const pacote = (s.pacote || '').trim() || 'Sem pacote';
      const list = byPackage.get(pacote) || [];
      list.push(s);
      byPackage.set(pacote, list);
    }

    const packages = Array.from(byPackage.entries()).map(([pacote, items]) => {
      const verba = items.reduce((sum, s) => sum + (Number.isFinite(s.verba) ? s.verba : 0), 0);
      return { pacote, verba, count: items.length };
    });
    packages.sort((a, b) => a.pacote.localeCompare(b.pacote, 'pt-BR'));

    const totalVerba = services.reduce((sum, s) => sum + (Number.isFinite(s.verba) ? s.verba : 0), 0);
    return { totalVerba, packages };
  }, [services]);

  const notesSummary = useMemo(() => {
    const total = notes.reduce((sum, n) => sum + (Number.isFinite(n.valor) ? n.valor : 0), 0);
    return { count: notes.length, total };
  }, [notes]);

  const gastosSummary = useMemo(() => {
    const linked = notes.filter((n) => !!(n.serviceId ?? '').trim());
    const unlinked = notes.length - linked.length;
    const totalVerba = services.reduce((sum, s) => sum + (Number.isFinite(s.verba) ? s.verba : 0), 0);
    const gastoVinculado = linked.reduce((sum, n) => sum + (Number.isFinite(n.valor) ? n.valor : 0), 0);
    return { linked: linked.length, unlinked, totalVerba, gastoVinculado };
  }, [notes, services]);

  const planejamentoSummary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minStart: Date | null = null;
    let maxEnd: Date | null = null;

    let finalizadas = 0;
    let emExecucao = 0;
    let emAtraso = 0;
    let planejadas = 0;

    for (const s of services) {
      const start = s.dataInicio ? parseISODateLocal(s.dataInicio) : null;
      const end = s.dataTermino ? parseISODateLocal(s.dataTermino) : null;
      const finalizado = !!s.finalizado;

      if (start) {
        if (!minStart || start.getTime() < minStart.getTime()) minStart = start;
      }
      if (end) {
        if (!maxEnd || end.getTime() > maxEnd.getTime()) maxEnd = end;
      }

      if (finalizado) {
        finalizadas += 1;
        continue;
      }

      const hasRange = !!(start && end);
      if (hasRange && today >= start! && today <= end!) {
        emExecucao += 1;
        continue;
      }
      if (end && today > end) {
        emAtraso += 1;
        continue;
      }
      planejadas += 1;
    }

    const formatBR = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR') : '—');
    return {
      inicio: formatBR(minStart),
      fim: formatBR(maxEnd),
      finalizadas,
      emExecucao,
      emAtraso,
      planejadas,
    };
  }, [services]);

  if (!obraId || !obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
        <div className="mt-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard da obra</h1>
            <p className="text-gray-600">{obra.nome} • Visão geral dos incêndios por setor, disciplina e severidade.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando dashboard...</div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Serviços</p>
                      <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${chipClasses('indigo')}`}>
                          {serviceSummary.packages.length} pacote(s)
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${chipClasses('gray')}`}>
                          Total {currencyFormatter.format(serviceSummary.totalVerba)}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full shrink-0">
                      <Wrench className="text-blue-600" size={28} />
                    </div>
                  </div>

                  {serviceSummary.packages.length > 0 && (
                    <div className="mt-5 grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                      {serviceSummary.packages.map((p) => (
                        <div key={p.pacote} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-gray-900" title={p.pacote}>
                                {p.pacote}
                              </div>
                              <div className="text-xs text-gray-500">{p.count} serviço(s)</div>
                            </div>
                            <div className="whitespace-nowrap text-sm font-bold text-gray-900">{currencyFormatter.format(p.verba)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Planejamento</p>
                      <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                      <p className="text-sm text-gray-600 mt-1">atividades (serviços)</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-full shrink-0">
                      <CalendarDays className="text-slate-900" size={28} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Início</div>
                      <div className="text-sm font-semibold text-gray-900">{planejamentoSummary.inicio}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Fim</div>
                      <div className="text-sm font-semibold text-gray-900">{planejamentoSummary.fim}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${chipClasses('emerald')}`}>
                      Finalizadas: {planejamentoSummary.finalizadas}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${chipClasses('blue')}`}>
                      Em execução: {planejamentoSummary.emExecucao}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${chipClasses('red')}`}>
                      Em atraso: {planejamentoSummary.emAtraso}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${chipClasses('gray')}`}>
                      Planejadas: {planejamentoSummary.planejadas}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Notas</p>
                      <p className="text-3xl font-bold text-gray-900">{notesSummary.count}</p>
                      <div className="mt-2 text-sm text-gray-700">
                        Total <span className="font-semibold text-gray-900">{currencyFormatter.format(notesSummary.total)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${chipClasses('indigo')}`}>
                          Vinculadas: {gastosSummary.linked}
                        </span>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${chipClasses('gray')}`}>
                          Sem vínculo: {gastosSummary.unlinked}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full shrink-0">
                      <FileText className="text-emerald-600" size={28} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">Gastos</p>
                      <p className="text-3xl font-bold text-gray-900">{currencyFormatter.format(gastosSummary.gastoVinculado)}</p>
                      <p className="text-sm text-gray-600 mt-1">gasto vinculado</p>
                    </div>
                    <div className="p-3 bg-indigo-100 rounded-full shrink-0">
                      <Banknote className="text-indigo-600" size={28} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Verba total</div>
                      <div className="text-sm font-semibold text-gray-900">{currencyFormatter.format(gastosSummary.totalVerba)}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Notas vinculadas</div>
                      <div className="text-sm font-semibold text-gray-900">{gastosSummary.linked}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Notas sem vínculo</div>
                      <div className="text-sm font-semibold text-gray-900">{gastosSummary.unlinked}</div>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-xs text-gray-500">Total notas</div>
                      <div className="text-sm font-semibold text-gray-900">{notesSummary.count}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100 lg:col-span-2">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-600 mb-1">RDO</p>
                      <p className="text-3xl font-bold text-gray-900">{rdos.length}</p>
                      <p className="text-sm text-gray-600 mt-1">registro(s) cadastrado(s)</p>
                    </div>
                    <div className="p-3 bg-violet-100 rounded-full shrink-0">
                      <ClipboardList className="text-violet-600" size={28} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Dashboard incendios={incendios} setores={setores.map((s) => ({ id: s.id, nome: s.nome }))} />
          </div>
        )}
      </div>
    </div>
  );
}

