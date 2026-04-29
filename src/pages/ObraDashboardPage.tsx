import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { getObraById, getSetoresByObraId } from '../config/setores';
import { getIncendios } from '../services/firestore';
import { Incendio } from '../types';
import Dashboard from '../components/Dashboard';

export default function ObraDashboardPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const setores = useMemo(() => (obraId ? getSetoresByObraId(obraId) : []), [obraId]);

  const [incendios, setIncendios] = useState<Incendio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!obraId) return;
      try {
        setLoading(true);
        setError('');

        const results = await Promise.all(setores.map((s) => getIncendios(s.id)));
        const merged = results.flat();

        const map = new Map<string, Incendio>();
        for (const inc of merged) map.set(inc.id, inc);

        const unique = Array.from(map.values());
        unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setIncendios(unique);
      } catch (err) {
        console.error('Erro ao carregar dashboard da obra:', err);
        setError('Não foi possível carregar o dashboard desta obra.');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [obraId, setores]);

  if (!obraId || !obra) {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full">
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard da obra</h1>
            <p className="text-gray-600">{obra.nome} • Visão geral dos incêndios por setor, disciplina e severidade.</p>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
          </div>
        </div>

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando dashboard...</div>
        ) : (
          <Dashboard incendios={incendios} setores={setores.map((s) => ({ id: s.id, nome: s.nome }))} />
        )}
      </div>
    </div>
  );
}

