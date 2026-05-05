import { Link } from 'react-router-dom';
import { obras } from '../config/setores';
import { Building2 } from 'lucide-react';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <p className="text-xl text-gray-600">Sistema de Gestão de Problemas em Obra</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {obras.map((obra) => (
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

