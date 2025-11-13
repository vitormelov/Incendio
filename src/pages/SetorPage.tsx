import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import IncendioForm from '../components/IncendioForm';
import IncendioList from '../components/IncendioList';
import { Incendio } from '../types';
import { getSetorById } from '../config/setores';
import { getIncendios, createIncendio, updateIncendio, deleteIncendio } from '../services/firestore';
import { getCurrentUser } from '../services/auth';
import { List, Layout } from 'lucide-react';

export default function SetorPage() {
  const { setorId } = useParams<{ setorId: string }>();
  const [incendios, setIncendios] = useState<Incendio[]>([]);
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formCoordenadas, setFormCoordenadas] = useState<{ x: number; y: number; page: number } | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'list'>('pdf');

  const setor = setorId ? getSetorById(setorId) : null;

  useEffect(() => {
    if (setorId) {
      loadIncendios();
    }
  }, [setorId]);

  const loadIncendios = async () => {
    if (!setorId) return;
    try {
      const data = await getIncendios(setorId);
      setIncendios(data);
    } catch (error) {
      console.error('Erro ao carregar incêndios:', error);
      alert('Erro ao carregar incêndios');
    }
  };

  const handleAddMark = (x: number, y: number, page: number) => {
    setFormCoordenadas({ x, y, page });
    setSelectedIncendio(null);
    setShowForm(true);
  };

  const handleMarkClick = (incendio: Incendio) => {
    setSelectedIncendio(incendio);
    setFormCoordenadas(null);
    setShowForm(true);
  };

  const handleSave = async (incendioData: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const user = getCurrentUser();
      const dataToSave = {
        ...incendioData,
        // Ao criar, adiciona o UID do usuário que criou. Ao editar, mantém o criadoPor original
        ...(selectedIncendio ? {} : { criadoPor: user?.uid || null }),
      };

      if (selectedIncendio) {
        await updateIncendio(selectedIncendio.id, dataToSave);
      } else {
        await createIncendio(dataToSave);
      }
      await loadIncendios();
      setShowForm(false);
      setSelectedIncendio(null);
      setFormCoordenadas(null);
    } catch (error) {
      console.error('Erro ao salvar incêndio:', error);
      alert('Erro ao salvar incêndio');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIncendio(id);
      await loadIncendios();
      if (selectedIncendio?.id === id) {
        setSelectedIncendio(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Erro ao excluir incêndio:', error);
      alert('Erro ao excluir incêndio');
    }
  };

  if (!setor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Setor não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{setor.nome}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('pdf')}
              className={`p-2 rounded ${viewMode === 'pdf' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              title="Visualizar PDF"
            >
              <Layout size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              title="Lista de Incêndios"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'pdf' ? (
          <PDFViewer
            pdfPath={setor.pdfPath}
            incendios={incendios}
            onAddMark={handleAddMark}
            onMarkClick={handleMarkClick}
            selectedIncendio={selectedIncendio}
          />
        ) : (
          <div className="h-full overflow-auto p-4">
            <IncendioList
              incendios={incendios}
              onEdit={(inc) => {
                setSelectedIncendio(inc);
                setFormCoordenadas(null);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              setor={setorId}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <IncendioForm
          incendio={selectedIncendio}
          coordenadas={formCoordenadas}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => {
            setShowForm(false);
            setSelectedIncendio(null);
            setFormCoordenadas(null);
          }}
          setor={setorId!}
        />
      )}
    </div>
  );
}

