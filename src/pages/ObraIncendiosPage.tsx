import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Flame } from 'lucide-react';
import { getObraById, getSetoresByObraId } from '../config/setores';

export default function ObraIncendiosPage() {
  const { obraId } = useParams<{ obraId: string }>();

  if (!obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

  const obra = getObraById(obraId);
  const setores = getSetoresByObraId(obraId);

  if (!obra) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-10">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 shrink-0">
              <Flame className="text-orange-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incêndios</h1>
              <p className="text-gray-600">{obra.nome} • Escolha o projeto (setor) para abrir a planta e as marcações.</p>
            </div>
          </div>
          <Link
            to={`/obra/${obraId}`}
            className="inline-flex items-center self-start px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar ao menu da obra
          </Link>
        </div>

        {setores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            Nenhum setor cadastrado para esta obra ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {setores.map((setor) => (
              <Link
                key={setor.id}
                to={`/setor/${encodeURIComponent(setor.id)}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{setor.nome}</h2>
                    <p className="text-sm text-gray-600">
                      {setor.pdfPath ? 'Visualizar planta e incêndios' : 'Setor cadastrado (PDF pendente)'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
