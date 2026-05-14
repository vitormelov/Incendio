import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserCog } from 'lucide-react';
import { obras } from '../config/setores';
import { Collaborator, UserPermission } from '../types';
import { deleteCollaborator, getCollaborators, updateCollaborator } from '../services/firestore';

const ALL_PERMISSIONS: { label: string; value: UserPermission }[] = [
  { label: 'Colaborador', value: 'colaborador' },
];

const allObraIds = () => obras.map((o) => o.id);

/** IDs marcados na UI. `null` só para colaborador = “todas as obras” no Firestore; leitores nunca ficam com `null`. */
const effectiveSelectedObraIds = (c: Collaborator): string[] => {
  if (c.obraIdsPermitidos === null) {
    return c.permissions.includes('colaborador') ? allObraIds() : [];
  }
  return c.obraIdsPermitidos;
};

const toggleObraAccess = (c: Collaborator, obraId: string, checked: boolean): Collaborator => {
  const current = new Set(effectiveSelectedObraIds(c));
  if (checked) current.add(obraId);
  else current.delete(obraId);
  const next = allObraIds().filter((id) => current.has(id));
  const every = allObraIds();
  const isFull = next.length === every.length && every.every((id) => next.includes(id));
  const useNullForAll = isFull && c.permissions.includes('colaborador');
  return { ...c, obraIdsPermitidos: useNullForAll ? null : next };
};

export default function AdminCollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCollaborators();
      setCollaborators(data);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setError('Não foi possível carregar os colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCollaborators();
  }, []);

  const handleNameChange = (id: string, nome: string) => {
    setCollaborators((current) =>
      current.map((collaborator) => (collaborator.id === id ? { ...collaborator, nome } : collaborator))
    );
  };

  const handlePermissionChange = (id: string, permission: UserPermission, checked: boolean) => {
    setCollaborators((current) =>
      current.map((collaborator) => {
        if (collaborator.id !== id) {
          return collaborator;
        }

        const permissions = checked
          ? Array.from(new Set([...collaborator.permissions, permission]))
          : collaborator.permissions.filter((item) => item !== permission);

        let obraIdsPermitidos = collaborator.obraIdsPermitidos;
        if (!checked && permission === 'colaborador' && collaborator.obraIdsPermitidos === null) {
          obraIdsPermitidos = allObraIds();
        }

        return {
          ...collaborator,
          permissions,
          obraIdsPermitidos,
        };
      })
    );
  };

  const handleObraAccessChange = (id: string, obraId: string, checked: boolean) => {
    setCollaborators((current) =>
      current.map((c) => (c.id === id ? toggleObraAccess(c, obraId, checked) : c))
    );
  };

  const handleSelectAllObras = (id: string) => {
    setCollaborators((current) =>
      current.map((c) =>
        c.id === id
          ? { ...c, obraIdsPermitidos: c.permissions.includes('colaborador') ? null : allObraIds() }
          : c
      )
    );
  };

  const handleClearAllObras = (id: string) => {
    setCollaborators((current) =>
      current.map((c) => (c.id === id ? { ...c, obraIdsPermitidos: [] } : c))
    );
  };

  const handleDelete = async (collaborator: Collaborator) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o colaborador "${collaborator.nome || collaborator.email}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setDeletingId(collaborator.id);
    setError('');
    setSuccess('');

    try {
      await deleteCollaborator(collaborator.id);
      setSuccess(`Colaborador ${collaborator.nome || collaborator.email} excluído com sucesso.`);
      await loadCollaborators();
    } catch (err) {
      console.error('Erro ao excluir colaborador:', err);
      setError('Não foi possível excluir o colaborador.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveAll = async () => {
    const invalid = collaborators.find((c) => !c.nome.trim());
    if (invalid) {
      setError('O nome do colaborador é obrigatório.');
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await Promise.all(
        collaborators.map((collaborator) =>
          updateCollaborator(collaborator.id, {
            nome: collaborator.nome.trim(),
            permissions: collaborator.permissions,
            obraIdsPermitidos: collaborator.obraIdsPermitidos,
          })
        )
      );

      setSuccess('Alterações salvas com sucesso.');
      await loadCollaborators();
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full">
                <UserCog className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Colaboradores cadastrados</h1>
            <p className="text-gray-600">
              <strong>Colaborador</strong> habilita <strong>edição</strong> nas obras em que o usuário também tiver
              acesso. <strong>Obras marcadas</strong> definem o acesso (visualização para todos; edição só com
              Colaborador). Colaborador com todas as obras marcadas grava sem lista no Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} />
              Voltar
            </Link>
            <button
              type="button"
              onClick={() => void handleSaveAll()}
              disabled={saving || loading || !!deletingId}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-purple-600 px-4 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando colaboradores...</div>
        ) : collaborators.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum colaborador cadastrado.</div>
        ) : (
          <div className="space-y-4">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="rounded-lg border border-gray-200 p-5">
                <div className="grid gap-5 md:grid-cols-[2fr_2fr_2fr_auto] md:items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={collaborator.nome}
                      onChange={(e) => handleNameChange(collaborator.id, e.target.value)}
                      disabled={saving || deletingId === collaborator.id}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="text"
                      value={collaborator.email}
                      disabled
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
                    <div className="flex flex-wrap gap-3 rounded-md border border-gray-300 px-3 py-2">
                      {ALL_PERMISSIONS.map((permission) => (
                        <label key={permission.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={collaborator.permissions.includes(permission.value)}
                            onChange={(e) =>
                              handlePermissionChange(collaborator.id, permission.value, e.target.checked)
                            }
                            disabled={saving || deletingId === collaborator.id}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          {permission.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDelete(collaborator)}
                      disabled={deletingId === collaborator.id || saving}
                      className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={18} className="mr-2" />
                      {deletingId === collaborator.id ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">Obras com acesso</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllObras(collaborator.id)}
                        disabled={saving || deletingId === collaborator.id}
                        className="text-xs font-medium text-purple-700 hover:underline disabled:opacity-50"
                      >
                        Marcar todas
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleClearAllObras(collaborator.id)}
                        disabled={saving || deletingId === collaborator.id}
                        className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
                      >
                        Desmarcar todas
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Obras marcadas: acesso à obra (visualização). Com <strong>Colaborador</strong>, também edição
                    nessas obras. “Todas” com colaborador remove a lista no Firestore (novas obras entram
                    automaticamente); sem colaborador, “todas” grava cada obra na lista.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3">
                    {obras.map((obra) => (
                      <label
                        key={obra.id}
                        className="inline-flex min-w-[10rem] cursor-pointer items-center gap-2 text-sm text-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={effectiveSelectedObraIds(collaborator).includes(obra.id)}
                          onChange={(e) =>
                            handleObraAccessChange(collaborator.id, obra.id, e.target.checked)
                          }
                          disabled={saving || deletingId === collaborator.id}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="truncate" title={obra.nome}>
                          {obra.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
