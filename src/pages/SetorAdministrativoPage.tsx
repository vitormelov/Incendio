import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layout, List } from 'lucide-react';
import ClienteAdministrativoPDFViewer from '../components/ClienteAdministrativoPDFViewer';
import ClienteAdministrativoForm from '../components/ClienteAdministrativoForm';
import ClienteAdministrativoList from '../components/ClienteAdministrativoList';
import ClienteAdministrativoFilters from '../components/ClienteAdministrativoFilters';
import type { ClienteAdministrativo } from '../types';
import {
  emptyClienteAdminFilters,
  filterClientesAdministrativos,
  type ClienteAdminListFilters,
} from '../utils/filterClientesAdministrativos';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';
import {
  createClienteAdministrativo,
  deleteClienteAdministrativo,
  getClientesAdministrativos,
  updateClienteAdministrativo,
} from '../services/firestore';
import { getCurrentUser, canManageObraData } from '../services/auth';

export default function SetorAdministrativoPage() {
  const { obraId, setorId } = useParams<{ obraId: string; setorId: string }>();
  const [clientes, setClientes] = useState<ClienteAdministrativo[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteAdministrativo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formCoordenadas, setFormCoordenadas] = useState<{ x: number; y: number; page: number } | null>(null);
  const [viewMode, setViewMode] = useState<'pdf' | 'list'>('pdf');
  const [canManage, setCanManage] = useState(false);
  const [readOnlyView, setReadOnlyView] = useState(false);
  const [listFilters, setListFilters] = useState<ClienteAdminListFilters>(emptyClienteAdminFilters);

  const clientesFiltrados = useMemo(
    () => filterClientesAdministrativos(clientes, listFilters),
    [clientes, listFilters]
  );

  const setor = setorId ? getSetorAdministrativoById(setorId) : null;
  const voltarHref = obraId ? `/obra/${obraId}/administrativo` : '/';

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

  useEffect(() => {
    if (setorId) void loadClientes();
  }, [setorId]);

  const loadClientes = async () => {
    if (!setorId) return;
    try {
      const data = await getClientesAdministrativos(setorId);
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      alert('Erro ao carregar clientes');
    }
  };

  const handleAddMark = (x: number, y: number, page: number) => {
    setFormCoordenadas({ x, y, page });
    setSelectedCliente(null);
    setReadOnlyView(false);
    setShowForm(true);
  };

  const handlePdfMarkClick = (cliente: ClienteAdministrativo) => {
    setSelectedCliente(cliente);
    setFormCoordenadas(null);
    if (canManage) {
      setReadOnlyView(false);
      setShowForm(true);
    } else {
      setReadOnlyView(true);
      setShowForm(true);
    }
  };

  const handleMarkMove = async (
    cliente: ClienteAdministrativo,
    coordenadas: { x: number; y: number; page: number }
  ) => {
    try {
      await updateClienteAdministrativo(cliente.id, { coordenadas });
      setClientes((prev) =>
        prev.map((c) => (c.id === cliente.id ? { ...c, coordenadas } : c))
      );
    } catch (error) {
      console.error('Erro ao mover pino:', error);
      alert('Erro ao mover o pino');
      await loadClientes();
    }
  };

  const handleSave = async (data: Omit<ClienteAdministrativo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!obraId) return;
    try {
      const user = getCurrentUser();
      const criadoPor = selectedCliente?.criadoPor ?? user?.uid ?? undefined;

      if (selectedCliente) {
        await updateClienteAdministrativo(selectedCliente.id, { ...data, criadoPor });
      } else {
        await createClienteAdministrativo({ ...data, obraId, criadoPor });
      }
      await loadClientes();
      setShowForm(false);
      setSelectedCliente(null);
      setFormCoordenadas(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClienteAdministrativo(id);
      await loadClientes();
      setShowForm(false);
      setSelectedCliente(null);
      setFormCoordenadas(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      alert('Erro ao excluir cliente');
    }
  };

  if (!setor || !obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Setor não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="bg-white border-b shadow-sm p-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold truncate min-w-0">{setor.nome}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={voltarHref}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
            <button
              type="button"
              onClick={() => setViewMode('pdf')}
              className={`p-2 rounded ${viewMode === 'pdf' ? 'bg-violet-600 text-white' : 'bg-gray-200'}`}
              title="Visualizar PDF"
            >
              <Layout size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'bg-gray-200'}`}
              title="Lista de clientes"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'pdf' ? (
          <ClienteAdministrativoPDFViewer
            pdfPath={setor.pdfPath}
            clientes={clientes}
            onAddMark={handleAddMark}
            onMarkClick={handlePdfMarkClick}
            onMarkMove={canManage ? handleMarkMove : undefined}
            selectedCliente={selectedCliente}
            allowCreateMarks={canManage}
          />
        ) : (
          <div className="h-full overflow-auto p-4 space-y-4">
            <ClienteAdministrativoFilters
              filters={listFilters}
              onChange={setListFilters}
              totalCount={clientes.length}
              filteredCount={clientesFiltrados.length}
            />
            <ClienteAdministrativoList
              clientes={clientesFiltrados}
              onEdit={(c) => {
                setSelectedCliente(c);
                setFormCoordenadas(null);
                setReadOnlyView(!canManage);
                setShowForm(true);
              }}
              onDelete={canManage ? handleDelete : undefined}
              showActions={canManage}
              showPlantaColumn={false}
              emptyMessage={
                clientes.length > 0
                  ? 'Nenhum cliente corresponde aos filtros.'
                  : 'Nenhum cliente cadastrado.'
              }
            />
          </div>
        )}
      </div>

      {showForm && (
        <ClienteAdministrativoForm
          cliente={selectedCliente}
          coordenadas={formCoordenadas}
          setorPlanta={setorId!}
          obraId={obraId}
          onSave={handleSave}
          onDelete={canManage ? handleDelete : undefined}
          onCancel={() => {
            setShowForm(false);
            setSelectedCliente(null);
            setFormCoordenadas(null);
            setReadOnlyView(false);
          }}
          readOnly={readOnlyView}
        />
      )}
    </div>
  );
}
