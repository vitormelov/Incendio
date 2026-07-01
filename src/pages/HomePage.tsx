import { Link } from 'react-router-dom';
import { Building2, Info } from 'lucide-react';
import { isDemoMode } from '../services/auth';
import { useVisibleObras } from '../hooks/useVisibleObras';

export default function HomePage() {
  const visibleObras = useVisibleObras();

  if (visibleObras === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-3" />
          <p>Carregando obras…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <p className="text-xl text-gray-600">Sistema de Gestão de Problemas em Obra</p>
          {isDemoMode() && (
            <p className="mt-2 text-sm text-gray-500">
              Modo demonstração — visualização da obra Hotel Central (somente leitura).
            </p>
          )}
        </div>

        {visibleObras.length === 0 && (
          <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
            Nenhuma obra está liberada para sua conta. Peça ao administrador para marcar ao menos uma obra com acesso
            para o seu usuário na página de Colaboradores.
          </div>
        )}

        {visibleObras.length > 0 && (
          <div className="text-center mb-8">
            <Link
              to="/obras/informacoes"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Info size={16} />
              Informações das obras
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleObras.map((obra) => (
            <Link
              key={obra.id}
              to={`/obra/${obra.id}`}
              className="group overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/5 transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[16/9] w-full bg-gray-100">
                {obra.imageUrl ? (
                  <img
                    src={obra.imageUrl}
                    alt={obra.nome}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="relative h-full w-full grid place-items-center">
                      <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-white/95 ring-1 ring-white/20 backdrop-blur">
                        <Building2 size={18} />
                        <span className="text-sm font-semibold">Obra</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{obra.nome}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
