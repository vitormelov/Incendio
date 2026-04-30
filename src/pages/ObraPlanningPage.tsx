import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Save, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { getObraById } from '../config/setores';
import { getObraServices, updateObraServicePlanning } from '../services/firestore';
import { ObraService } from '../types';
import { canManageObraData } from '../services/auth';

const pad2 = (n: number) => String(n).padStart(2, '0');
const formatISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const parseISODateLocal = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const diffDaysInclusive = (start: Date, end: Date) => {
  const ms = end.getTime() - start.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return days + 1;
};

export default function ObraPlanningPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;

  const [canManage, setCanManage] = useState(false);
  const [services, setServices] = useState<ObraService[]>([]);
  const [draft, setDraft] = useState<Record<string, { dataInicio: string; dataTermino: string; finalizado: boolean }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [refDate, setRefDate] = useState(() => formatISODate(new Date()));

  useEffect(() => {
    const run = async () => {
      try {
        setCanManage(await canManageObraData());
      } catch {
        setCanManage(false);
      }
    };
    void run();
  }, []);

  const load = async () => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getObraServices(obraId);
      setServices(data);
      const nextDraft: Record<string, { dataInicio: string; dataTermino: string; finalizado: boolean }> = {};
      for (const s of data) {
        nextDraft[s.id] = {
          dataInicio: s.dataInicio ?? '',
          dataTermino: s.dataTermino ?? '',
          finalizado: !!s.finalizado,
        };
      }
      setDraft(nextDraft);
    } catch (err) {
      console.error('Erro ao carregar planejamento:', err);
      setError('Não foi possível carregar o planejamento desta obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const ref = useMemo(() => parseISODateLocal(refDate), [refDate]);

  const normalizedRows = useMemo(() => {
    return services
      .map((s) => {
        const d = draft[s.id];
        const start = d?.dataInicio ? parseISODateLocal(d.dataInicio) : null;
        const end = d?.dataTermino ? parseISODateLocal(d.dataTermino) : null;
        const duration = start && end ? diffDaysInclusive(start, end) : null;
        const finalizado = !!d?.finalizado;
        const inProgress = !!(start && end && ref >= start && ref <= end && !finalizado);
        const overdue = !!(end && ref > end && !finalizado);
        return { service: s, draft: d, start, end, duration, finalizado, inProgress, overdue };
      })
      .sort((a, b) => {
        const pa = (a.service.pacote || '').localeCompare(b.service.pacote || '', 'pt-BR');
        if (pa !== 0) return pa;
        return a.service.descricao.localeCompare(b.service.descricao, 'pt-BR');
      });
  }, [draft, ref, services]);

  const inProgressList = useMemo(
    () => normalizedRows.filter((r) => r.inProgress).map((r) => r.service),
    [normalizedRows]
  );

  const overdueList = useMemo(
    () => normalizedRows.filter((r) => r.overdue).map((r) => r.service),
    [normalizedRows]
  );

  const ganttRange = useMemo(() => {
    const starts = normalizedRows.map((r) => r.start).filter(Boolean) as Date[];
    const ends = normalizedRows.map((r) => r.end).filter(Boolean) as Date[];
    if (starts.length === 0 || ends.length === 0) return null;
    const minStart = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
    minStart.setHours(0, 0, 0, 0);
    maxEnd.setHours(0, 0, 0, 0);
    const totalDays = diffDaysInclusive(minStart, maxEnd);
    return { minStart, maxEnd, totalDays };
  }, [normalizedRows]);

  const handleSaveAll = async () => {
    if (!canManage) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await Promise.all(
        services.map((s) =>
          updateObraServicePlanning(s.id, {
            dataInicio: draft[s.id]?.dataInicio ? draft[s.id].dataInicio : null,
            dataTermino: draft[s.id]?.dataTermino ? draft[s.id].dataTermino : null,
            finalizado: !!draft[s.id]?.finalizado,
          })
        )
      );
      setSuccess('Planejamento salvo com sucesso.');
      await load();
    } catch (err) {
      console.error('Erro ao salvar planejamento:', err);
      setError('Não foi possível salvar o planejamento.');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-full">
                <CalendarDays className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Planejamento</h1>
            <p className="text-gray-600">{obra.nome} • Datas por atividade e gráfico de Gantt.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700 whitespace-nowrap">Data de referência</span>
              <input
                type="date"
                value={refDate}
                onChange={(e) => setRefDate(e.target.value)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
              />
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => void handleSaveAll()}
                disabled={saving || loading}
                className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar planejamento'}
              </button>
            )}
          </div>
        </div>

        {!canManage && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar o planejamento, mas não tem permissão para editar datas ou finalizar atividades.
          </div>
        )}

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        {!loading && (inProgressList.length > 0 || overdueList.length > 0) && (
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            {inProgressList.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Clock size={18} />
                  Atividades em execução (na data de referência)
                </div>
                <div className="text-sm text-blue-900/90">
                  {inProgressList.map((s) => `${s.pacote} — ${s.descricao}`).join(' • ')}
                </div>
              </div>
            )}

            {overdueList.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-900">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <AlertTriangle size={18} />
                  Atividades em atraso
                </div>
                <div className="text-sm text-red-900/90">
                  {overdueList.map((s) => `${s.pacote} — ${s.descricao}`).join(' • ')}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando planejamento...</div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum serviço cadastrado nesta obra.</div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900">Atividades</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacote</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Início</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Término</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração (dias)</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Finalizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {normalizedRows.map((row) => (
                      <tr key={row.service.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{row.service.pacote}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.service.descricao}</td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.draft?.dataInicio ?? ''}
                            onChange={(e) =>
                              setDraft((c) => ({
                                ...c,
                                [row.service.id]: {
                                  ...(c[row.service.id] ?? { dataInicio: '', dataTermino: '', finalizado: false }),
                                  dataInicio: e.target.value,
                                },
                              }))
                            }
                            disabled={!canManage || saving}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.draft?.dataTermino ?? ''}
                            onChange={(e) =>
                              setDraft((c) => ({
                                ...c,
                                [row.service.id]: {
                                  ...(c[row.service.id] ?? { dataInicio: '', dataTermino: '', finalizado: false }),
                                  dataTermino: e.target.value,
                                },
                              }))
                            }
                            disabled={!canManage || saving}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {row.duration !== null ? row.duration : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex items-center justify-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={!!row.draft?.finalizado}
                              onChange={(e) =>
                                setDraft((c) => ({
                                  ...c,
                                  [row.service.id]: {
                                    ...(c[row.service.id] ?? { dataInicio: '', dataTermino: '', finalizado: false }),
                                    finalizado: e.target.checked,
                                  },
                                }))
                              }
                              disabled={!canManage || saving}
                              className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="sr-only">Finalizado</span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-slate-900" />
                Gantt
              </div>

              {!ganttRange ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500">
                  Defina datas de início e término para ver o gráfico de Gantt.
                </div>
              ) : (
                <div className="p-4 overflow-x-auto">
                  <div className="min-w-[900px]">
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-600">
                      <div>
                        {ganttRange.minStart.toLocaleDateString('pt-BR')} → {ganttRange.maxEnd.toLocaleDateString('pt-BR')} (
                        {ganttRange.totalDays} dias)
                      </div>
                      <div>Ref.: {ref.toLocaleDateString('pt-BR')}</div>
                    </div>

                    <div className="relative rounded-md border border-gray-200 bg-white">
                      {/* Reference line */}
                      {(() => {
                        const delta = Math.floor((ref.getTime() - ganttRange.minStart.getTime()) / (1000 * 60 * 60 * 24));
                        if (delta < 0 || delta > ganttRange.totalDays) return null;
                        const left = (delta / ganttRange.totalDays) * 100;
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-600/60"
                            style={{ left: `${left}%` }}
                            title="Data de referência"
                          />
                        );
                      })()}

                      <div className="divide-y divide-gray-100">
                        {normalizedRows.map((row) => {
                          const label = `${row.service.pacote} : ${row.service.descricao}`;
                          const start = row.start;
                          const end = row.end;
                          if (!start || !end) {
                            return (
                              <div key={row.service.id} className="flex items-center gap-3 px-3 py-2">
                                <div className="w-72 text-xs text-gray-700 truncate" title={label}>
                                  {label}
                                </div>
                                <div className="relative flex-1 h-6 rounded bg-gray-50 border border-gray-100" />
                              </div>
                            );
                          }

                          const startOffset = Math.floor((start.getTime() - ganttRange.minStart.getTime()) / (1000 * 60 * 60 * 24));
                          const widthDays = diffDaysInclusive(start, end);
                          const leftPct = (startOffset / ganttRange.totalDays) * 100;
                          const widthPct = (widthDays / ganttRange.totalDays) * 100;

                          const color =
                            row.finalizado
                              ? 'bg-emerald-600'
                              : row.overdue
                                ? 'bg-red-600'
                                : row.inProgress
                                  ? 'bg-blue-600'
                                  : 'bg-slate-700';

                          return (
                            <div key={row.service.id} className="flex items-center gap-3 px-3 py-2">
                              <div className="w-72 text-xs text-gray-700 truncate" title={label}>
                                {label}
                              </div>
                              <div className="relative flex-1 h-6 rounded bg-gray-50 border border-gray-100">
                                <div
                                  className={`absolute top-0.5 bottom-0.5 rounded ${color}`}
                                  style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                                  title={`${label}\n${start.toLocaleDateString('pt-BR')} → ${end.toLocaleDateString('pt-BR')} (${widthDays} dias)`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-600" /> Finalizado
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-blue-600" /> Em execução
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-red-600" /> Em atraso
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-slate-700" /> Planejado
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

