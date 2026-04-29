import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Pencil, Plus, Save, Trash2, Wrench, X } from 'lucide-react';
import { getObraById } from '../config/setores';
import { createObraService, deleteObraService, getObraServices, updateObraService } from '../services/firestore';
import { ObraService } from '../types';
import { canManageObraData } from '../services/auth';

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
  const [canManage, setCanManage] = useState(false);

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
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(() => new Set());

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

  const validateDraft = (draft: ServiceDraft): string | null => {
    if (!draft.pacote.trim()) return 'O pacote do serviço é obrigatório.';
    if (!draft.descricao.trim()) return 'A descrição do serviço é obrigatória.';
    if (!Number.isFinite(draft.verba) || draft.verba < 0) return 'A verba deve ser um número válido (maior ou igual a 0).';
    return null;
  };

  const openCreateModal = (prefill?: Partial<ServiceDraft>) => {
    setModalMode('create');
    setActiveServiceId(null);
    setDraft({ ...emptyDraft, ...prefill });
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

  const groupedByPackage = useMemo(() => {
    const map = new Map<string, ObraService[]>();
    for (const service of services) {
      const pacote = (service.pacote || '').trim() || 'Sem pacote';
      const current = map.get(pacote) || [];
      current.push(service);
      map.set(pacote, current);
    }

    const entries = Array.from(map.entries()).map(([pacote, items]) => {
      items.sort((a, b) => {
        const byDesc = a.descricao.localeCompare(b.descricao, 'pt-BR');
        if (byDesc !== 0) return byDesc;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const subtotal = items.reduce((sum, s) => sum + (Number.isFinite(s.verba) ? s.verba : 0), 0);
      return { pacote, items, subtotal };
    });

    entries.sort((a, b) => a.pacote.localeCompare(b.pacote, 'pt-BR'));
    return entries;
  }, [services]);

  const totalVerba = useMemo(() => {
    return services.reduce((sum, s) => sum + (Number.isFinite(s.verba) ? s.verba : 0), 0);
  }, [services]);

  const togglePackage = (pacote: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pacote)) next.delete(pacote);
      else next.add(pacote);
      return next;
    });
  };

  const expandAll = () => setExpandedPackages(new Set(groupedByPackage.map((g) => g.pacote)));
  const collapseAll = () => setExpandedPackages(new Set());

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
        setSuccess('Item criado com sucesso.');
      } else if (activeServiceId) {
        await updateObraService(activeServiceId, {
          pacote: draft.pacote.trim(),
          descricao: draft.descricao.trim(),
          verba: draft.verba,
        });
        setSuccess('Item atualizado com sucesso.');
      }
      await load();
      setExpandedPackages((prev) => {
        const pacote = draft.pacote.trim() || 'Sem pacote';
        const next = new Set(prev);
        next.add(pacote);
        return next;
      });
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
      `Tem certeza que deseja excluir o item "${service.descricao}" do pacote "${service.pacote}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingId(service.id);
    setError('');
    setSuccess('');

    try {
      await deleteObraService(service.id);
      setSuccess('Item excluído com sucesso.');
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

        {!canManage && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar os serviços, mas não tem permissão para criar/editar/excluir.
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
            {loading ? 'Carregando...' : `${services.length} item(ns) • Total ${currencyFormatter.format(totalVerba)}`}
          </div>

          <div className="flex items-center gap-2">
            {!loading && services.length > 0 && (
              <>
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
              </>
            )}

          {canManage && (
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Novo item
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando serviços...</div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum serviço cadastrado.</div>
        ) : (
          <div className="space-y-4">
            {groupedByPackage.map((group) => {
              const isExpanded = expandedPackages.has(group.pacote);
              return (
                <div key={group.pacote} className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePackage(group.pacote)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      title={isExpanded ? 'Recolher pacote' : 'Expandir pacote'}
                    >
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-gray-600" />
                      ) : (
                        <ChevronRight size={18} className="text-gray-600" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-gray-900">{group.pacote}</div>
                        <div className="text-xs text-gray-500">
                          {group.items.length} item(ns) • Subtotal {currencyFormatter.format(group.subtotal)}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openCreateModal({ pacote: group.pacote })}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <Plus size={16} className="mr-2" />
                          Novo item
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verba</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {group.items.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-700">{service.descricao}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                {currencyFormatter.format(service.verba || 0)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(service)}
                                      disabled={!canManage}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                      title={canManage ? 'Editar' : 'Sem permissão'}
                                  >
                                    <Pencil size={16} className="mr-2" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(service)}
                                      disabled={!canManage || deletingId === service.id}
                                    className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                      title={canManage ? 'Excluir' : 'Sem permissão'}
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
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'Novo item de serviço' : 'Editar item de serviço'}
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
                      disabled={!canManage || !!savingId}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <input
                    type="text"
                    value={draft.descricao}
                    onChange={(e) => setDraft((c) => ({ ...c, descricao: e.target.value }))}
                      disabled={!canManage || !!savingId}
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
                      disabled={!canManage || !!savingId}
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
                  disabled={!canManage || !!savingId}
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

