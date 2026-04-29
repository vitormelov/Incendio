import { Link } from 'react-router-dom';
import { ChevronRight, Shield, UserCog, UserPlus } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Área Administrativa</h1>
          <p className="text-gray-600">Gerencie colaboradores e cadastros do sistema</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/admin/colaboradores"
            className="flex items-center justify-between rounded-lg border border-gray-200 p-5 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <UserCog className="text-purple-700" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Colaboradores cadastrados</h2>
                <p className="text-sm text-gray-600">
                  Veja as contas criadas e edite nome e permissões de cada colaborador.
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={22} />
          </Link>

          <Link
            to="/admin/novo-colaborador"
            className="flex items-center justify-between rounded-lg border border-gray-200 p-5 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <UserPlus className="text-purple-700" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Cadastrar novo colaborador</h2>
                <p className="text-sm text-gray-600">
                  Crie uma nova conta para um funcionário acessar o sistema.
                </p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={22} />
          </Link>
        </div>
      </div>
    </div>
  );
}

