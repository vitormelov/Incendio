import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { getObraById } from '../config/setores';
import { getObraNotes, getObraServices, updateObraNote } from '../services/firestore';
import { ObraNote, ObraService } from '../types';
import { getCurrentUser, isAdmin } from '../services/auth';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ObraGastosPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const userIsAdmin = useMemo(() => isAdmin(getCurrentUser()), []);

  const [services, setServices] = useState<ObraService[]>([]);
  const [notes, setNotes] = useState<ObraNote[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(() => new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(() => new Set());

  const serviceById = useMemo(() => {
    const map = new Map<string, ObraService>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const effectiveServiceIdByNoteId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const n of notes) {
      const linked = (links[n.id] ?? '').trim();
      map.set(n.id, linked ? linked : null);
    }
    return map;
  }, [links, notes]);

  const notesByServiceId = useMemo(() => {
    const map = new Map<string, ObraNote[]>();
    for (const n of notes) {
      const serviceId = effectiveServiceIdByNoteId.get(n.id) ?? null;
      if (!serviceId) continue;
      const current = map.get(serviceId) || [];
      current.push(n);
      map.set(serviceId, current);
    }
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }
    return map;
  }, [effectiveServiceIdByNoteId, notes]);

  const unlinkedNotes = useMemo(() => {
    const list = notes.filter((n) => !(effectiveServiceIdByNoteId.get(n.id) ?? null));
    list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return list;
  }, [effectiveServiceIdByNoteId, notes]);

  const spentByServiceId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const note of notes) {
      const serviceId = effectiveServiceIdByNoteId.get(note.id) ?? null;
      if (!serviceId) continue;
      totals.set(serviceId, (totals.get(serviceId) ?? 0) + (note.valor || 0));
    }
    return totals;
  }, [effectiveServiceIdByNoteId, notes]);

  const groupedByPackage = useMemo(() => {
    const map = new Map<string, ObraService[]>();
    for (const s of services) {
      const pacote = (s.pacote || '').trim() || 'Sem pacote';
      const current = map.get(pacote) || [];
      current.push(s);
      map.set(pacote, current);
    }

    const entries = Array.from(map.entries()).map(([pacote, pacoteServices]) => {
      pacoteServices.sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));
      const verbaSubtotal = pacoteServices.reduce((sum, s) => sum + (s.verba || 0), 0);
      const gastoSubtotal = pacoteServices.reduce((sum, s) => sum + (spentByServiceId.get(s.id) ?? 0), 0);
      return { pacote, services: pacoteServices, verbaSubtotal, gastoSubtotal };
    });

    entries.sort((a, b) => a.pacote.localeCompare(b.pacote, 'pt-BR'));
    return entries;
  }, [services, spentByServiceId]);

  const totals = useMemo(() => {
    const totalVerba = services.reduce((sum, s) => sum + (s.verba || 0), 0);
    const totalGasto = notes.reduce((sum, n) => {
      const serviceId = effectiveServiceIdByNoteId.get(n.id) ?? null;
      return sum + (serviceId ? (n.valor || 0) : 0);
    }, 0);
    return { totalVerba, totalGasto };
  }, [effectiveServiceIdByNoteId, notes, services]);

  const load = async () => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      const [servicesData, notesData] = await Promise.all([getObraServices(obraId), getObraNotes(obraId)]);
      setServices(servicesData);
      setNotes(notesData);
      const initial: Record<string, string> = {};
      for (const n of notesData) {
        initial[n.id] = n.serviceId ?? '';
      }
      setLinks(initial);
      setExpandedPackages(new Set(servicesData.map((s) => (s.pacote || '').trim() || 'Sem pacote')));
      setExpandedServices(new Set(servicesData.map((s) => s.id)));
    } catch (err) {
      console.error('Erro ao carregar gastos:', err);
      setError('Não foi possível carregar os gastos da obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const togglePackage = (pacote: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pacote)) next.delete(pacote);
      else next.add(pacote);
      return next;
    });
  };

  const toggleService = (serviceId: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPackages(new Set(groupedByPackage.map((g) => g.pacote)));
    setExpandedServices(new Set(services.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedPackages(new Set());
    setExpandedServices(new Set());
  };

  const handleSaveAll = async () => {
    if (!userIsAdmin) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates = notes.map((note) => {
        const nextServiceId = links[note.id] || null;
        const current = note.serviceId ?? null;
        if (nextServiceId === current) return null;
        return updateObraNote(note.id, {
          serviceId: nextServiceId,
          numero: note.numero,
          data: note.data,
          empresa: note.empresa,
          descricao: note.descricao,
          valor: note.valor,
        });
      }).filter(Boolean) as Promise<void>[];

      await Promise.all(updates);
      setSuccess('Vínculos salvos com sucesso.');
      await load();
    } catch (err) {
      console.error('Erro ao salvar vínculos:', err);
      setError('Não foi possível salvar os vínculos.');
    } finally {
      setSaving(false);
    }
  };

  const serviceLabel = (s: ObraService) => `${s.pacote} — ${s.descricao}`;

  if (!obraId || !obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full">
                <Banknote className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gastos</h1>
            <p className="text-gray-600">
              {obra.nome} • Vincule notas aos serviços e acompanhe consumo de verba.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => void handleSaveAll()}
                disabled={saving}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Salvando...' : 'Salvar vínculos'}
              </button>
            )}
          </div>
        </div>

        {!userIsAdmin && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar os gastos, mas apenas o admin pode alterar os vínculos.
          </div>
        )}

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando...</div>
        ) : (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                {services.length} serviço(s) • {notes.length} nota(s) • Verba total {currencyFormatter.format(totals.totalVerba)} •
                Gasto vinculado {currencyFormatter.format(totals.totalGasto)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Expandir tudo
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Recolher tudo
                </button>
              </div>
            </div>

            {services.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                Nenhum serviço cadastrado.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <div className="text-sm font-bold text-gray-900">Notas sem vínculo</div>
                    <div className="text-sm text-gray-600">{unlinkedNotes.length} nota(s)</div>
                  </div>
                  {unlinkedNotes.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">Nenhuma nota sem vínculo.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vincular em</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {unlinkedNotes.map((n) => (
                            <tr key={n.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{n.numero}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{n.data}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">{n.empresa}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {currencyFormatter.format(n.valor || 0)}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={links[n.id] ?? ''}
                                  onChange={(e) => setLinks((c) => ({ ...c, [n.id]: e.target.value }))}
                                  disabled={!userIsAdmin || saving}
                                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                >
                                  <option value="">Sem vínculo</option>
                                  {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {serviceLabel(s)}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {groupedByPackage.map((pkg) => {
                  const isPkgExpanded = expandedPackages.has(pkg.pacote);
                  const pkgSaldo = pkg.verbaSubtotal - pkg.gastoSubtotal;

                  return (
                    <div key={pkg.pacote} className="rounded-lg border border-gray-200 bg-white">
                      <button
                        type="button"
                        onClick={() => togglePackage(pkg.pacote)}
                        className="flex w-full items-center justify-between gap-3 border-b px-4 py-3 text-left hover:bg-gray-50"
                        title={isPkgExpanded ? 'Recolher pacote' : 'Expandir pacote'}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {isPkgExpanded ? (
                            <ChevronDown size={18} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-600" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-gray-900">{pkg.pacote}</div>
                            <div className="text-xs text-gray-500">{pkg.services.length} serviço(s)</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-right text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Verba</div>
                            <div className="font-semibold text-gray-900">{currencyFormatter.format(pkg.verbaSubtotal)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Gasto</div>
                            <div className="font-semibold text-gray-900">{currencyFormatter.format(pkg.gastoSubtotal)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Saldo</div>
                            <div className={`font-semibold ${pkgSaldo < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                              {currencyFormatter.format(pkgSaldo)}
                            </div>
                          </div>
                        </div>
                      </button>

                      {isPkgExpanded && (
                        <div className="divide-y divide-gray-200">
                          {pkg.services.map((s) => {
                            const isServiceExpanded = expandedServices.has(s.id);
                            const spent = spentByServiceId.get(s.id) ?? 0;
                            const saldo = (s.verba || 0) - spent;
                            const serviceNotes = notesByServiceId.get(s.id) || [];

                            return (
                              <div key={s.id}>
                                <button
                                  type="button"
                                  onClick={() => toggleService(s.id)}
                                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                                  title={isServiceExpanded ? 'Recolher serviço' : 'Expandir serviço'}
                                >
                                  <div className="flex min-w-0 items-start gap-2">
                                    {isServiceExpanded ? (
                                      <ChevronDown size={18} className="mt-0.5 text-gray-600" />
                                    ) : (
                                      <ChevronRight size={18} className="mt-0.5 text-gray-600" />
                                    )}
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-gray-900">{s.descricao}</div>
                                      <div className="text-xs text-gray-500">{serviceNotes.length} nota(s) vinculada(s)</div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-right text-sm">
                                    <div>
                                      <div className="text-xs text-gray-500">Verba</div>
                                      <div className="font-semibold text-gray-900">{currencyFormatter.format(s.verba || 0)}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Gasto</div>
                                      <div className="font-semibold text-gray-900">{currencyFormatter.format(spent)}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-gray-500">Saldo</div>
                                      <div className={`font-semibold ${saldo < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {currencyFormatter.format(saldo)}
                                      </div>
                                    </div>
                                  </div>
                                </button>

                                {isServiceExpanded && (
                                  <div className="pb-4">
                                    {serviceNotes.length === 0 ? (
                                      <div className="px-4 py-3 text-sm text-gray-500">Nenhuma nota vinculada a este serviço.</div>
                                    ) : (
                                      <div className="overflow-x-auto px-4">
                                        <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Nota
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Data
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Empresa
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Valor
                                              </th>
                                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Serviço
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-200 bg-white">
                                            {serviceNotes.map((n) => (
                                              <tr key={n.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{n.numero}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{n.data}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{n.empresa}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                  {currencyFormatter.format(n.valor || 0)}
                                                </td>
                                                <td className="px-4 py-3">
                                                  <select
                                                    value={links[n.id] ?? ''}
                                                    onChange={(e) => setLinks((c) => ({ ...c, [n.id]: e.target.value }))}
                                                    disabled={!userIsAdmin || saving}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                                  >
                                                    <option value="">Sem vínculo</option>
                                                    {services.map((opt) => (
                                                      <option key={opt.id} value={opt.id}>
                                                        {serviceLabel(opt)}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  {links[n.id] && serviceById.get(links[n.id]) && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                      {currencyFormatter.format(serviceById.get(links[n.id])!.verba || 0)} de verba
                                                    </div>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

