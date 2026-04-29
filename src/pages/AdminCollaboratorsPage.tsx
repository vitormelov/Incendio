import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, UserCog } from 'lucide-react';
import { Collaborator, UserPermission } from '../types';
import { deleteCollaborator, getCollaborators, updateCollaborator } from '../services/firestore';

const ALL_PERMISSIONS: { label: string; value: UserPermission }[] = [
  { label: 'Colaborador', value: 'colaborador' },
];

export default function AdminCollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
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
      current.map((collaborator) =>
        collaborator.id === id ? { ...collaborator, nome } : collaborator
      )
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

        return {
          ...collaborator,
          permissions,
        };
      })
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

  const handleSave = async (collaborator: Collaborator) => {
    if (!collaborator.nome.trim()) {
      setError('O nome do colaborador é obrigatório.');
      setSuccess('');
      return;
    }

    setSavingId(collaborator.id);
    setError('');
    setSuccess('');

    try {
      await updateCollaborator(collaborator.id, {
        nome: collaborator.nome.trim(),
        permissions: collaborator.permissions,
      });
      setSuccess(`Dados de ${collaborator.nome} atualizados com sucesso.`);
      await loadCollaborators();
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSavingId(null);
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
              Edite o nome e deixe as permissões preparadas para a evolução da área administrativa.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
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
                      onClick={() => void handleSave(collaborator)}
                      disabled={savingId === collaborator.id || deletingId === collaborator.id}
                      className="inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Save size={18} className="mr-2" />
                      {savingId === collaborator.id ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(collaborator)}
                      disabled={deletingId === collaborator.id || savingId === collaborator.id}
                      className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={18} className="mr-2" />
                      {deletingId === collaborator.id ? 'Excluindo...' : 'Excluir'}
                    </button>
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
