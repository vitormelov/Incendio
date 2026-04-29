import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup } from '../services/auth';
import { ArrowLeft, CheckCircle, Lock, Mail, User as UserIcon, UserPlus, XCircle } from 'lucide-react';

export default function AdminNewCollaboratorPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nome.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, nome.trim());
      setSuccess(`Conta criada com sucesso para ${nome}!`);
      setNome('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full">
                <UserPlus className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastrar novo colaborador</h1>
            <p className="text-gray-600">Crie contas para novos usuários sem sair da sessão do admin.</p>
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
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center gap-2">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Funcionário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Nome completo"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email do Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="usuario@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus size={20} className="mr-2" />
                Criar Conta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
