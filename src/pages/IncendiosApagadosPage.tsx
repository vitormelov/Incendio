import { useState, useEffect } from 'react';
import IncendioList from '../components/IncendioList';
import { Incendio } from '../types';
import { getIncendios, deleteIncendio } from '../services/firestore';
import { CheckCircle } from 'lucide-react';

export default function IncendiosApagadosPage() {
  const [incendiosApagados, setIncendiosApagados] = useState<Incendio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncendiosApagados();
  }, []);

  const loadIncendiosApagados = async () => {
    try {
      setLoading(true);
      const allIncendios = await getIncendios();
      // Filtrar apenas os incêndios que foram apagados
      const apagados = allIncendios.filter(inc => inc.dataFoiApagada !== null);
      setIncendiosApagados(apagados);
    } catch (error) {
      console.error('Erro ao carregar incêndios apagados:', error);
      alert('Erro ao carregar incêndios apagados');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIncendio = async (id: string) => {
    try {
      await deleteIncendio(id);
      await loadIncendiosApagados();
    } catch (error) {
      console.error('Erro ao excluir incêndio:', error);
      alert('Erro ao excluir incêndio');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
            <CheckCircle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incêndios Resolvidos</h1>
            <p className="text-gray-600 mt-1">
              {incendiosApagados.length} incêndio(s) resolvido(s)
            </p>
          </div>
        </div>
      </div>

      {incendiosApagados.length > 0 ? (
        <IncendioList
          incendios={incendiosApagados}
          onEdit={() => {}} // Não permite editar incêndios apagados
          onDelete={handleDeleteIncendio}
          showResolveButton={false}
          showStatusFilter={false}
          showEditButton={false}
          showDeleteButton={true}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CheckCircle className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum incêndio resolvido
          </h2>
          <p className="text-gray-500">
            Quando você marcar incêndios como resolvidos, eles aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
}

