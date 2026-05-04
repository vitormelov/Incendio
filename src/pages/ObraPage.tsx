import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Banknote, BarChart3, CalendarDays, ClipboardList, FileText, Receipt, Wrench } from 'lucide-react';
import { getObraById, getSetoresByObraId } from '../config/setores';

export default function ObraPage() {
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
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{obra.nome}</h1>
              <p className="text-gray-600">Escolha o setor que deseja visualizar</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/obra/${obraId}/dashboard`}
              className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              <BarChart3 size={18} className="mr-2" />
              Dashboard
            </Link>
            <Link
              to={`/obra/${obraId}/planejamento`}
              className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              <CalendarDays size={18} className="mr-2" />
              Planejamento
            </Link>
            <Link
              to={`/obra/${obraId}/servicos`}
              className="inline-flex items-center px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <Wrench size={18} className="mr-2" />
              Serviços
            </Link>
            <Link
              to={`/obra/${obraId}/notas`}
              className="inline-flex items-center px-4 py-2 border border-emerald-200 rounded-md text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <Receipt size={18} className="mr-2" />
              Notas
            </Link>
            <Link
              to={`/obra/${obraId}/gastos`}
              className="inline-flex items-center px-4 py-2 border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <Banknote size={18} className="mr-2" />
              Gastos
            </Link>
            <Link
              to={`/obra/${obraId}/rdo?modo=editar`}
              className="inline-flex items-center px-4 py-2 border border-violet-200 rounded-md text-sm font-medium text-violet-700 hover:bg-violet-50"
            >
              <ClipboardList size={18} className="mr-2" />
              RDO
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Trocar obra
            </Link>
          </div>
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

