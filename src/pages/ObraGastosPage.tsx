import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, Save } from 'lucide-react';
import Logo from '../components/Logo';
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

  const serviceById = useMemo(() => {
    const map = new Map<string, ObraService>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const spentByServiceId = useMemo(() => {
    const totals = new Map<string, number>();
    for (const note of notes) {
      if (!note.serviceId) continue;
      totals.set(note.serviceId, (totals.get(note.serviceId) ?? 0) + (note.valor || 0));
    }
    return totals;
  }, [notes]);

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
              <Logo size="sm" />
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
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900">Serviços</div>
              <div className="divide-y divide-gray-200">
                {services.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">Nenhum serviço cadastrado.</div>
                ) : (
                  services.map((s) => {
                    const spent = spentByServiceId.get(s.id) ?? 0;
                    const saldo = (s.verba || 0) - spent;
                    return (
                      <div key={s.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">{s.pacote}</div>
                            <div className="text-sm text-gray-600">{s.descricao}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Verba</div>
                            <div className="font-semibold text-gray-900">{currencyFormatter.format(s.verba || 0)}</div>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">Gasto (notas)</div>
                            <div className="font-semibold text-gray-900">{currencyFormatter.format(spent)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600">Saldo</div>
                            <div className={`font-semibold ${saldo < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                              {currencyFormatter.format(saldo)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900">Notas → Serviço</div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {notes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          Nenhuma nota cadastrada.
                        </td>
                      </tr>
                    ) : (
                      notes.map((n) => (
                        <tr key={n.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{n.numero}</td>
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
                                  {s.pacote} — {s.descricao}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

