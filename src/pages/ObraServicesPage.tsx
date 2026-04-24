import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Save, Trash2, Wrench, X } from 'lucide-react';
import Logo from '../components/Logo';
import { getObraById } from '../config/setores';
import { createObraService, deleteObraService, getObraServices, updateObraService } from '../services/firestore';
import { ObraService } from '../types';
import { getCurrentUser, isAdmin } from '../services/auth';

type ServiceDraft = Pick<ObraService, 'pacote' | 'descricao' | 'verba'>;

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const emptyDraft: ServiceDraft = {
  pacote: '',
  descricao: '',
  verba: 0,
};

type ModalMode = 'create' | 'edit';

export default function ObraServicesPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const userIsAdmin = useMemo(() => isAdmin(getCurrentUser()), []);

  const [services, setServices] = useState<ObraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);

  const load = async () => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getObraServices(obraId);
      setServices(data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      setError('Não foi possível carregar os serviços da obra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const validateDraft = (draft: ServiceDraft): string | null => {
    if (!draft.pacote.trim()) return 'O pacote do serviço é obrigatório.';
    if (!draft.descricao.trim()) return 'A descrição do serviço é obrigatória.';
    if (!Number.isFinite(draft.verba) || draft.verba < 0) return 'A verba deve ser um número válido (maior ou igual a 0).';
    return null;
  };

  const openCreateModal = () => {
    setModalMode('create');
    setActiveServiceId(null);
    setDraft(emptyDraft);
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (service: ObraService) => {
    setModalMode('edit');
    setActiveServiceId(service.id);
    setDraft({ pacote: service.pacote, descricao: service.descricao, verba: service.verba });
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

    const savingKey = modalMode === 'create' ? 'new' : activeServiceId;
    setSavingId(savingKey || 'edit');
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'create') {
        await createObraService({
          obraId,
          pacote: draft.pacote.trim(),
          descricao: draft.descricao.trim(),
          verba: draft.verba,
        });
        setSuccess('Serviço criado com sucesso.');
      } else if (activeServiceId) {
        await updateObraService(activeServiceId, {
          pacote: draft.pacote.trim(),
          descricao: draft.descricao.trim(),
          verba: draft.verba,
        });
        setSuccess('Serviço atualizado com sucesso.');
      }
      await load();
      setModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      setError(modalMode === 'create' ? 'Não foi possível criar o serviço.' : 'Não foi possível salvar as alterações do serviço.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (service: ObraService) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o serviço "${service.pacote}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingId(service.id);
    setError('');
    setSuccess('');

    try {
      await deleteObraService(service.id);
      setSuccess('Serviço excluído com sucesso.');
      await load();
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      setError('Não foi possível excluir o serviço.');
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                <Wrench className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Serviços da obra</h1>
            <p className="text-gray-600">
              {obra.nome} • Cadastre pacotes, descrições e verba disponível para vincular com notas futuramente.
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
          </div>
        </div>

        {!userIsAdmin && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar os serviços, mas apenas o admin pode criar/editar/excluir.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {loading ? 'Carregando...' : `${services.length} serviço(s) cadastrado(s)`}
          </div>

          {userIsAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Novo serviço
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacote</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verba</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{service.pacote}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{service.descricao}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {currencyFormatter.format(service.verba || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          disabled={!userIsAdmin}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          title={userIsAdmin ? 'Editar' : 'Apenas admin'}
                        >
                          <Pencil size={16} className="mr-2" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(service)}
                          disabled={!userIsAdmin || deletingId === service.id}
                          className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          title={userIsAdmin ? 'Excluir' : 'Apenas admin'}
                        >
                          <Trash2 size={16} className="mr-2" />
                          {deletingId === service.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'Novo serviço' : 'Editar serviço'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded p-2 hover:bg-gray-100"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pacote</label>
                  <input
                    type="text"
                    value={draft.pacote}
                    onChange={(e) => setDraft((c) => ({ ...c, pacote: e.target.value }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={draft.descricao}
                    onChange={(e) => setDraft((c) => ({ ...c, descricao: e.target.value }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verba (R$)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(draft.verba) ? draft.verba : 0}
                    onChange={(e) => setDraft((c) => ({ ...c, verba: Number(e.target.value || 0) }))}
                    disabled={!userIsAdmin || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  <div className="mt-1 text-xs text-gray-500">{currencyFormatter.format(draft.verba || 0)}</div>
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
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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

