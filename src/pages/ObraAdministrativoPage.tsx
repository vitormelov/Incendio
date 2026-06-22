import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, FileText, LayoutDashboard, List } from 'lucide-react';
import { getObraById } from '../config/setores';
import { getSetoresAdministrativosByObraId } from '../config/setoresAdministrativo';
import ClienteAdministrativoList from '../components/ClienteAdministrativoList';
import ClienteAdministrativoForm from '../components/ClienteAdministrativoForm';
import ClienteAdministrativoFilters from '../components/ClienteAdministrativoFilters';
import ClienteAdministrativoDashboard from '../components/ClienteAdministrativoDashboard';
import type { ClienteAdministrativo } from '../types';
import {
  emptyClienteAdminFilters,
  filterClientesAdministrativos,
  type ClienteAdminListFilters,
} from '../utils/filterClientesAdministrativos';
import { computeClienteAdministrativoStats } from '../utils/clienteAdministrativoStats';
import { downloadClientesAdministrativosPdf } from '../utils/exportClientesAdministrativosPdf';
import { downloadClientesAdministrativosExcel } from '../utils/exportClientesAdministrativosExcel';
import {
  findClienteDuplicado,
  getClienteDuplicadoMensagem,
} from '../utils/clienteAdministrativoDuplicate';
import {
  deleteClienteAdministrativo,
  getClientesAdministrativos,
  updateClienteAdministrativo,
} from '../services/firestore';
import { canManageObraData } from '../services/auth';

export default function ObraAdministrativoPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const [tab, setTab] = useState<'projetos' | 'clientes' | 'dashboard'>('projetos');
  const [allClientes, setAllClientes] = useState<ClienteAdministrativo[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteAdministrativo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [listFilters, setListFilters] = useState<ClienteAdminListFilters>(emptyClienteAdminFilters);

  const obra = obraId ? getObraById(obraId) : undefined;
  const setores = obraId ? getSetoresAdministrativosByObraId(obraId) : [];

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
      const results = await Promise.all(setores.map((s) => getClientesAdministrativos(s.id)));
      const merged = results.flat().filter((c) => c.obraId === obraId);
      const map = new Map<string, ClienteAdministrativo>();
      for (const c of merged) map.set(c.id, c);
      const unique = Array.from(map.values());
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllClientes(unique);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setErrorList('Não foi possível carregar os clientes desta obra.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const filtered = useMemo(
    () => filterClientesAdministrativos(allClientes, listFilters),
    [allClientes, listFilters]
  );

  const dashboardStats = useMemo(
    () => computeClienteAdministrativoStats(allClientes),
    [allClientes]
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteClienteAdministrativo(id);
      await loadAll();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      alert('Erro ao excluir cliente');
    }
  };

  const handleSaveEdit = async (data: Omit<ClienteAdministrativo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedCliente) return;
    const duplicado = findClienteDuplicado(
      allClientes,
      data.setorLocal,
      data.corredor,
      data.box,
      selectedCliente.id
    );
    if (duplicado) {
      alert(getClienteDuplicadoMensagem(data.setorLocal, data.corredor, data.box));
      return;
    }
    try {
      await updateClienteAdministrativo(selectedCliente.id, data);
      await loadAll();
      setShowForm(false);
      setSelectedCliente(null);
    } catch (err) {
      console.error('Erro ao editar cliente:', err);
      alert('Erro ao salvar cliente');
    }
  };

  const handleExportPdf = () => {
    if (!obra) return;
    downloadClientesAdministrativosPdf({
      clientes: filtered,
      title: obra.nome,
      subtitle: 'Todos os setores da obra',
      showPlantaColumn: true,
      filteredCount: filtered.length,
      totalCount: allClientes.length,
    });
  };

  const handleExportExcel = () => {
    if (!obra) return;
    downloadClientesAdministrativosExcel({
      clientes: filtered,
      title: obra.nome,
      subtitle: 'Todos os setores da obra',
      showPlantaColumn: true,
      filteredCount: filtered.length,
      totalCount: allClientes.length,
    });
  };

  if (!obraId || !obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 shrink-0">
            <Briefcase className="text-violet-700" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administrativo</h1>
            <p className="text-gray-600">
              {obra.nome} • Plantas e clientes do empreendimento.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('projetos')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'projetos'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} className="mr-2" />
            Projetos
          </button>
          <button
            type="button"
            onClick={() => setTab('clientes')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'clientes'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <List size={18} className="mr-2" />
            Clientes ({filtered.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('dashboard')}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium border ${
              tab === 'dashboard'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={18} className="mr-2" />
            Dashboard
          </button>
        </div>

        {tab === 'projetos' && (
          <>
            {setores.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
                Nenhum setor cadastrado para esta obra.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {setores.map((setor) => (
                  <Link
                    key={setor.id}
                    to={`/obra/${obraId}/administrativo/setor/${encodeURIComponent(setor.id)}`}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-violet-100 p-3 rounded-lg">
                        <FileText className="text-violet-700" size={32} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{setor.nome}</h2>
                        <p className="text-sm text-gray-600">
                          {setor.pdfPath ? 'Visualizar planta e clientes' : 'Setor cadastrado (PDF pendente)'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <strong>Legenda dos pinos:</strong>{' '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> disponível
              </span>
              {' • '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#FFBF00' }} /> processo judicial (prevalece)
              </span>
              {' • '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#FF6D00' }} /> inadimplência
              </span>
              {' • '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> fechado
              </span>
              {' • '}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> aberto sem pendências
              </span>
            </div>
          </>
        )}

        {tab === 'dashboard' && (
          <div className="space-y-4">
            {errorList && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{errorList}</div>
            )}
            <ClienteAdministrativoDashboard
              geral={dashboardStats.geral}
              porSetor={dashboardStats.porSetor}
              loading={loadingList}
            />
          </div>
        )}

        {tab === 'clientes' && (
          <div className="space-y-4">
            {errorList && (
              <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{errorList}</div>
            )}
            <ClienteAdministrativoFilters
              filters={listFilters}
              onChange={setListFilters}
              totalCount={allClientes.length}
              filteredCount={filtered.length}
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
            />
            {loadingList ? (
              <div className="py-12 text-center text-gray-500">Carregando clientes...</div>
            ) : (
              <ClienteAdministrativoList
                clientes={filtered}
                onEdit={(c) => {
                  setSelectedCliente(c);
                  setShowForm(true);
                }}
                onDelete={canManage ? handleDelete : undefined}
                showActions={canManage}
                showPlantaColumn={false}
                emptyMessage={
                  allClientes.length > 0
                    ? 'Nenhum cliente corresponde aos filtros.'
                    : 'Nenhum cliente cadastrado.'
                }
              />
            )}
          </div>
        )}
      </div>

      {showForm && selectedCliente && obraId && (
        <ClienteAdministrativoForm
          cliente={selectedCliente}
          coordenadas={null}
          setorPlanta={selectedCliente.setor}
          obraId={obraId}
          clientesObra={allClientes}
          onSave={handleSaveEdit}
          onDelete={canManage ? handleDelete : undefined}
          onCancel={() => {
            setShowForm(false);
            setSelectedCliente(null);
          }}
        />
      )}
    </div>
  );
}
