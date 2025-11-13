import { Link } from 'react-router-dom';
import { setores } from '../config/setores';
import { FileText } from 'lucide-react';
import { useEffect } from 'react';
import Logo from '../components/Logo';

export default function HomePage() {
  useEffect(() => {
    console.log('Setores carregados:', setores);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-xl text-gray-600">Sistema de Gestão de Problemas em Obra</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setores.map((setor) => (
            <Link
              key={setor.id}
              to={`/setor/${setor.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="text-blue-600" size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{setor.nome}</h2>
                  <p className="text-sm text-gray-600">Visualizar plantas e incêndios</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

