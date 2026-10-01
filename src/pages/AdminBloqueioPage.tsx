import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { Collaborator, UserBloqueio } from '../types';
import { getCollaborators, setCollaboratorBloqueio } from '../services/firestore';
import { isAdminEmail } from '../services/auth';

const OPCOES: { value: UserBloqueio | null; label: string; activeClass: string }[] = [
  { value: null, label: 'Liberado', activeClass: 'bg-green-600 text-white border-green-600' },
  { value: 'bloqueado', label: 'Usuário bloqueado', activeClass: 'bg-red-600 text-white border-red-600' },
  { value: 'fora_do_ar', label: 'Site fora do ar', activeClass: 'bg-gray-800 text-white border-gray-800' },
];

export default function AdminBloqueioPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCollaborators();
        setCollaborators(data.filter((c) => !isAdminEmail(c.email)));
      } catch (err) {
        console.error('Erro ao carregar colaboradores:', err);
        setError('Não foi possível carregar os colaboradores.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleChange = async (collaborator: Collaborator, bloqueio: UserBloqueio | null) => {
    if (collaborator.bloqueio === bloqueio) return;
    setSavingId(collaborator.id);
    setError('');
    try {
      await setCollaboratorBloqueio(collaborator.id, collaborator.nome.trim() || collaborator.email, bloqueio);
      setCollaborators((current) =>
        current.map((c) => (c.id === collaborator.id ? { ...c, bloqueio } : c))
      );
    } catch (err) {
      console.error('Erro ao alterar bloqueio:', err);
      setError(`Não foi possível alterar o acesso de ${collaborator.nome || collaborator.email}.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full">
                <Ban className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bloquear site</h1>
            <p className="text-gray-600">
              Escolha o acesso de cada colaborador. A mudança vale na hora, mesmo para quem já está no site.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 space-y-1">
          <p>
            <strong>Usuário bloqueado:</strong> ao entrar, vê a mensagem “Usuário bloqueado, verifique seu acesso com o
            administrador”.
          </p>
          <p>
            <strong>Site fora do ar:</strong> ao entrar, vê uma página de erro como se o site estivesse fora do ar.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando colaboradores...</div>
        ) : collaborators.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum colaborador cadastrado.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
            {collaborators.map((collaborator) => {
              const saving = savingId === collaborator.id;
              return (
                <div
                  key={collaborator.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{collaborator.nome.trim() || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500 truncate">{collaborator.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {OPCOES.map((opcao) => {
                      const active = collaborator.bloqueio === opcao.value;
                      return (
                        <button
                          key={opcao.label}
                          type="button"
                          onClick={() => void handleChange(collaborator, opcao.value)}
                          disabled={saving}
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            active ? opcao.activeClass : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {opcao.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
