import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Flame, List } from 'lucide-react';
import { getObraById, getSetoresByObraId } from '../config/setores';
import IncendioList from '../components/IncendioList';
import IncendioForm from '../components/IncendioForm';
import { Incendio } from '../types';
import { deleteIncendio, formatLocalDate, getIncendios, updateIncendio } from '../services/firestore';
import { getCurrentUser, canManageObraData } from '../services/auth';

export default function ObraIncendiosPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const [tab, setTab] = useState<'projetos' | 'incendios' | 'resolvidos'>('projetos');
  const [allIncendios, setAllIncendios] = useState<Incendio[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState('');
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const obra = obraId ? getObraById(obraId) : undefined;
  const setores = obraId ? getSetoresByObraId(obraId) : [];

  useEffect(() => {
    const run = async () => {
      if (!obraId) {
        setCanManage(false);
        return;
      }
      try {
        setCanManage(await canManageObraData(obraId));
      } catch {
        setCanManage(false);
      }
    };
    void run();
  }, [obraId]);

  const loadAll = async () => {
    try {
      setLoadingList(true);
      setErrorList('');
      const results = await Promise.all(setores.map((s) => getIncendios(s.id)));
      const merged = results.flat();
      const map = new Map<string, Incendio>();
      for (const inc of merged) map.set(inc.id, inc);
      const unique = Array.from(map.values());
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllIncendios(unique);
    } catch (err) {
      console.error('Erro ao carregar incêndios da obra:', err);
      setErrorList('Não foi possível carregar os incêndios desta obra.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const incendiosAbertos = useMemo(() => allIncendios.filter((i) => !i.dataFoiApagada), [allIncendios]);
  const incendiosResolvidos = useMemo(() => allIncendios.filter((i) => !!i.dataFoiApagada), [allIncendios]);

  const handleResolve = async (id: string) => {
    try {
      const hoje = new Date();
      const dataFoiApagada = formatLocalDate(hoje);
      await updateIncendio(id, { dataFoiApagada });
      await loadAll();
    } catch (err) {
      console.error('Erro ao marcar incêndio como resolvido:', err);
      alert('Erro ao marcar incêndio como resolvido');
    }
  };

  const handleDeleteIncendio = async (id: string) => {
    try {
      await deleteIncendio(id);
      await loadAll();
    } catch (err) {
      console.error('Erro ao excluir incêndio:', err);
      alert('Erro ao excluir incêndio');
    }
  };

  const handleSaveEdit = async (incendioData: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedIncendio) return;

    try {
      const user = getCurrentUser();

      // Mantém o criador original; se não existir, usa o usuário atual.
      const criadoPorValue =
        selectedIncendio.criadoPor ?? (user?.uid ? user.uid : undefined);

      const { criadoPor: _, ...dataWithoutCriadoPor } = incendioData;
      const dataToSave = {
        ...dataWithoutCriadoPor,
        criadoPor: criadoPorValue,
      };

      await updateIncendio(selectedIncendio.id, dataToSave);
      await loadAll();
      setShowForm(false);
      setSelectedIncendio(null);
    } catch (err) {
      console.error('Erro ao editar incêndio:', err);
      alert('Erro ao editar incêndio');
    }
  };

  if (!obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

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
              <p className="text-gray-600">
                {obra.nome} • Projetos (setores), lista de incêndios e resolvidos desta obra.
              </p>
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

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('projetos')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'projetos'
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} className="mr-2" />
            Projetos
          </button>
          <button
            type="button"
            onClick={() => setTab('incendios')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'incendios'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <List size={18} className="mr-2" />
            Incêndios ({incendiosAbertos.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('resolvidos')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'resolvidos'
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CheckCircle size={18} className="mr-2" />
            Resolvidos ({incendiosResolvidos.length})
          </button>
        </div>

        {tab === 'projetos' && (
          <>
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
          </>
        )}

        {tab !== 'projetos' && (
          <div className="space-y-4">
            {errorList && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{errorList}</div>
            )}
            {loadingList ? (
              <div className="py-12 text-center text-gray-500">Carregando incêndios...</div>
            ) : (
              <IncendioList
                incendios={tab === 'incendios' ? incendiosAbertos : incendiosResolvidos}
                onEdit={(inc) => {
                  setSelectedIncendio(inc);
                  setShowForm(true);
                }}
                onDelete={tab === 'resolvidos' && canManage ? handleDeleteIncendio : () => {}}
                onResolve={tab === 'incendios' && canManage ? handleResolve : undefined}
                showResolveButton={tab === 'incendios' && canManage}
                showStatusFilter={tab === 'incendios'}
                showEditButton={tab === 'incendios' && canManage}
                showDeleteButton={tab === 'resolvidos' && canManage}
                allowDelete={tab === 'resolvidos' && canManage}
                hideObraSetorFilters={true}
              />
            )}
          </div>
        )}
      </div>

      {canManage && showForm && selectedIncendio && (
        <IncendioForm
          incendio={selectedIncendio}
          coordenadas={null}
          onSave={handleSaveEdit}
          onCancel={() => {
            setShowForm(false);
            setSelectedIncendio(null);
          }}
          setor={selectedIncendio.setor}
        />
      )}
    </div>
  );
}
