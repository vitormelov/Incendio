import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import Logo from '../components/Logo';
import { getObraById } from '../config/setores';
import { createObraNote, deleteObraNote, getObraNotes, getObraServices, updateObraNote } from '../services/firestore';
import { ObraNote, ObraService } from '../types';
import { getCurrentUser, isAdmin } from '../services/auth';

type NoteDraft = Pick<ObraNote, 'serviceId' | 'numero' | 'data' | 'empresa' | 'descricao' | 'valor'>;
type ModalMode = 'create' | 'edit';

const emptyDraft: NoteDraft = {
  serviceId: null,
  numero: '',
  data: '',
  empresa: '',
  descricao: '',
  valor: 0,
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export default function ObraNotesPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const userIsAdmin = useMemo(() => isAdmin(getCurrentUser()), []);

  const [services, setServices] = useState<ObraService[]>([]);
  const [notes, setNotes] = useState<ObraNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(emptyDraft);

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
    } catch (err) {
      console.error('Erro ao carregar notas/serviços:', err);
      setError('Não foi possível carregar as notas desta obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const validateDraft = (draft: NoteDraft): string | null => {
    if (!draft.numero.trim()) return 'O número da nota é obrigatório.';
    if (!draft.data.trim()) return 'A data é obrigatória.';
    if (!draft.empresa.trim()) return 'A empresa é obrigatória.';
    if (!draft.descricao.trim()) return 'A descrição é obrigatória.';
    if (!Number.isFinite(draft.valor) || draft.valor < 0) return 'O valor deve ser um número válido (maior ou igual a 0).';
    return null;
  };

  const openCreateModal = () => {
    setModalMode('create');
    setActiveNoteId(null);
    setDraft(emptyDraft);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (note: ObraNote) => {
    setModalMode('edit');
    setActiveNoteId(note.id);
    setDraft({
      serviceId: note.serviceId,
      numero: note.numero,
      data: note.data,
      empresa: note.empresa,
      descricao: note.descricao,
      valor: note.valor,
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (savingId) return;
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!obraId) return;

    const validation = validateDraft(draft);
    if (validation) {
      setError(validation);
      setSuccess('');
      return;
    }

    const savingKey = modalMode === 'create' ? 'new' : activeNoteId;
    setSavingId(savingKey || 'edit');
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'create') {
        await createObraNote({
          obraId,
          serviceId: draft.serviceId ?? null,
          numero: draft.numero.trim(),
          data: draft.data.trim(),
          empresa: draft.empresa.trim(),
          descricao: draft.descricao.trim(),
          valor: draft.valor,
        });
        setSuccess('Nota criada com sucesso.');
      } else if (activeNoteId) {
        await updateObraNote(activeNoteId, {
          serviceId: draft.serviceId ?? null,
          numero: draft.numero.trim(),
          data: draft.data.trim(),
          empresa: draft.empresa.trim(),
          descricao: draft.descricao.trim(),
          valor: draft.valor,
        });
        setSuccess('Nota atualizada com sucesso.');
      }

      await load();
      setModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      setError(modalMode === 'create' ? 'Não foi possível criar a nota.' : 'Não foi possível salvar as alterações da nota.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (note: ObraNote) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir a nota "${note.numero}"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeletingId(note.id);
    setError('');
    setSuccess('');

    try {
      await deleteObraNote(note.id);
      setSuccess('Nota excluída com sucesso.');
      await load();
    } catch (err) {
      console.error('Erro ao excluir nota:', err);
      setError('Não foi possível excluir a nota.');
    } finally {
      setDeletingId(null);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Logo size="sm" />
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-full">
                <FileText className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notas da obra</h1>
            <p className="text-gray-600">{obra.nome} • Vincule notas aos serviços para acompanhar a verba.</p>
          </div>

          <Link
            to={`/obra/${obraId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </Link>
        </div>

        {!userIsAdmin && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar as notas, mas apenas o admin pode criar/editar/excluir.
          </div>
        )}

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">{loading ? 'Carregando...' : `${notes.length} nota(s)`}</div>
          {userIsAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus size={18} className="mr-2" />
              Nova nota
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando notas...</div>
        ) : notes.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhuma nota cadastrada.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo (serviço)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {notes.map((note) => {
                  const service = note.serviceId ? serviceById.get(note.serviceId) : undefined;
                  const spent = note.serviceId ? spentByServiceId.get(note.serviceId) ?? 0 : 0;
                  const budget = service?.verba ?? null;
                  const saldo = budget === null ? null : budget - spent;

                  return (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{note.numero}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{note.data}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{note.empresa}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {service ? (
                          <div>
                            <div className="font-medium text-gray-900">{service.pacote}</div>
                            <div className="text-xs text-gray-500">{service.descricao}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {currencyFormatter.format(note.valor || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {saldo === null ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <span className={saldo < 0 ? 'text-red-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                            {currencyFormatter.format(saldo)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(note)}
                            disabled={!userIsAdmin}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Pencil size={16} className="mr-2" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(note)}
                            disabled={!userIsAdmin || deletingId === note.id}
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Trash2 size={16} className="mr-2" />
                            {deletingId === note.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">{modalMode === 'create' ? 'Nova nota' : 'Editar nota'}</h2>
              <button type="button" onClick={closeModal} className="rounded p-2 hover:bg-gray-100" title="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número da nota</label>
                    <input
                      type="text"
                      value={draft.numero}
                      onChange={(e) => setDraft((c) => ({ ...c, numero: e.target.value }))}
                      disabled={!userIsAdmin || !!savingId}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                    <input
                      type="date"
                      value={draft.data}
                      onChange={(e) => setDraft((c) => ({ ...c, data: e.target.value }))}
                      disabled={!userIsAdmin || !!savingId}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                  <input
                    type="text"
                    value={draft.empresa}
                    onChange={(e) => setDraft((c) => ({ ...c, empresa: e.target.value }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serviço (opcional)</label>
                  <select
                    value={draft.serviceId ?? ''}
                    onChange={(e) => setDraft((c) => ({ ...c, serviceId: e.target.value ? e.target.value : null }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                  >
                    <option value="">Sem vínculo</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.pacote} — {s.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={draft.descricao}
                    onChange={(e) => setDraft((c) => ({ ...c, descricao: e.target.value }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(draft.valor) ? draft.valor : 0}
                    onChange={(e) => setDraft((c) => ({ ...c, valor: Number(e.target.value || 0) }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
                  />
                  <div className="mt-1 text-xs text-gray-500">{currencyFormatter.format(draft.valor || 0)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={!!savingId}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!userIsAdmin || !!savingId}
                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {savingId ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

