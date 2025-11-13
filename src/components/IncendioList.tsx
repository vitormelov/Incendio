import { useState } from 'react';
import { Edit, Filter, Eye, Check, Trash2 } from 'lucide-react';
import { Incendio, Disciplina, Severidade } from '../types';
import { getDisciplinaName, getSeveridadeName, getDisciplinaColor } from '../utils/colors';
import { getSetorById, setores } from '../config/setores';
import { format, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import IncendioDetails from './IncendioDetails';
import { getCurrentUser, isAdmin } from '../services/auth';

interface IncendioListProps {
  incendios: Incendio[];
  onEdit: (incendio: Incendio) => void;
  onDelete: (id: string) => void;
  onResolve?: (id: string) => void;
  setor?: string;
  showResolveButton?: boolean; // Para controlar se mostra o botão de resolver
  showStatusFilter?: boolean; // Para controlar se mostra o filtro de status
  showEditButton?: boolean; // Para controlar se mostra o botão de editar
  showDeleteButton?: boolean; // Para controlar se mostra o botão de deletar (apenas admin)
}

type StatusFilter = '' | 'aberto' | 'atrasado';

export default function IncendioList({ 
  incendios, 
  onEdit, 
  onDelete, 
  onResolve, 
  setor, 
  showResolveButton = false,
  showStatusFilter = true,
  showEditButton = false,
  showDeleteButton = false
}: IncendioListProps) {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const [filters, setFilters] = useState({
    setor: '' as string | '',
    disciplina: '' as Disciplina | '',
    severidade: '' as Severidade | '',
    isGargalo: '' as boolean | '',
    status: '' as StatusFilter,
  });
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Função para calcular atraso (precisa estar antes de getIncendioStatus)
  const calcularAtraso = (incendio: Incendio): number | null => {
    // Calcular atraso apenas para incêndios abertos com data de apagar
    if (!incendio.dataPretendeApagar || incendio.dataFoiApagada) return null;
    
    // Parse da data no formato YYYY-MM-DD no fuso local
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Se dataPretendeApagar está no formato YYYY-MM-DD, parsear corretamente
    const [year, month, day] = incendio.dataPretendeApagar.split('T')[0].split('-').map(Number);
    const dataApagar = new Date(year, month - 1, day);
    dataApagar.setHours(0, 0, 0, 0);
    
    return differenceInDays(hoje, dataApagar);
  };

  // Função para calcular status de um incêndio
  const getIncendioStatus = (inc: Incendio): 'aberto' | 'atrasado' | 'fechado' => {
    if (inc.dataFoiApagada) return 'fechado';
    const atraso = calcularAtraso(inc);
    if (atraso !== null && atraso > 0) return 'atrasado';
    return 'aberto';
  };

  const filteredIncendios = incendios.filter(inc => {
    // Filtro por setor (se vier da prop ou do filtro)
    if (setor && inc.setor !== setor) return false;
    if (!setor && filters.setor && inc.setor !== filters.setor) return false;
    
    // Filtro por disciplina
    if (filters.disciplina && inc.disciplina !== filters.disciplina) return false;
    
    // Filtro por severidade
    if (filters.severidade && inc.severidade !== filters.severidade) return false;
    
    // Filtro por gargalo
    if (filters.isGargalo !== '' && inc.isGargalo !== filters.isGargalo) return false;
    
    // Filtro por status
    if (filters.status) {
      const status = getIncendioStatus(inc);
      if (status !== filters.status) return false;
    }
    
    return true;
  });

  const getStatus = (incendio: Incendio): { texto: string; cor: string } => {
    if (incendio.dataFoiApagada) {
      return { texto: 'Fechado', cor: 'bg-green-100 text-green-800' };
    }
    const atraso = calcularAtraso(incendio);
    // Se atraso > 0 = Atrasado, se atraso <= 0 = Aberto
    if (atraso !== null && atraso > 0) {
      return { texto: 'Atrasado', cor: 'bg-red-100 text-red-800' };
    }
    return { texto: 'Aberto', cor: 'bg-yellow-100 text-yellow-800' };
  };

  const handleView = (incendio: Incendio) => {
    setSelectedIncendio(incendio);
    setShowDetails(true);
  };

  const handleEditFromDetails = () => {
    if (selectedIncendio) {
      setShowDetails(false);
      onEdit(selectedIncendio);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Lista de Incêndios</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter size={16} />
            <span>Filtros</span>
          </div>
        </div>

        {/* Filtros */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${showStatusFilter ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
          {/* Filtro por Setor */}
          {!setor && (
            <select
              value={filters.setor}
              onChange={(e) => setFilters({ ...filters, setor: e.target.value })}
              className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Setores</option>
              {setores.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          )}

          {/* Filtro por Disciplina */}
          <select
            value={filters.disciplina}
            onChange={(e) => setFilters({ ...filters, disciplina: e.target.value as Disciplina | '' })}
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Disciplinas</option>
            <option value="civil">{getDisciplinaName('civil')}</option>
            <option value="instalacoes">{getDisciplinaName('instalacoes')}</option>
            <option value="equipamentos">{getDisciplinaName('equipamentos')}</option>
            <option value="estrutural">{getDisciplinaName('estrutural')}</option>
            <option value="impermeabilizacao">{getDisciplinaName('impermeabilizacao')}</option>
            <option value="ambientacao">{getDisciplinaName('ambientacao')}</option>
          </select>

          {/* Filtro por Severidade */}
          <select
            value={filters.severidade}
            onChange={(e) => setFilters({ ...filters, severidade: e.target.value as Severidade | '' })}
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Severidades</option>
            <option value={1}>1 - Pequeno</option>
            <option value={2}>2 - Médio</option>
            <option value={3}>3 - Grande</option>
          </select>

          {/* Filtro por Gargalo */}
          <select
            value={filters.isGargalo === '' ? '' : filters.isGargalo.toString()}
            onChange={(e) => setFilters({ ...filters, isGargalo: e.target.value === '' ? '' : e.target.value === 'true' })}
            className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Com/Sem Gargalo</option>
            <option value="true">Apenas Gargalos</option>
            <option value="false">Sem Gargalos</option>
          </select>

          {/* Filtro por Status - apenas se showStatusFilter for true */}
          {showStatusFilter && (
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as StatusFilter })}
              className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="atrasado">Atrasado</option>
            </select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disciplina</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severidade</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Incêndio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atraso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredIncendios.map((incendio) => {
              const color = getDisciplinaColor(incendio.disciplina);
              const setor = getSetorById(incendio.setor);
              const atraso = calcularAtraso(incendio);
              const status = getStatus(incendio);
              
              return (
                <tr key={incendio.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {setor?.nome || incendio.setor}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: color }}
                      >
                        {getDisciplinaName(incendio.disciplina)}
                      </span>
                      {incendio.isGargalo && (
                        <span className="px-2 py-1 bg-black text-white text-xs rounded">Gargalo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm">{incendio.severidade} - {getSeveridadeName(incendio.severidade)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{incendio.responsavel}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {(() => {
                      const dateStr = incendio.dataAconteceu.split('T')[0];
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return format(date, 'dd/MM/yyyy', { locale: ptBR });
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {atraso !== null ? (
                      <span className={`font-medium ${atraso > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {atraso > 0 ? '+' : ''}{atraso} dia(s)
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${status.cor}`}>
                      {status.texto}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(incendio)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </button>
                      {showEditButton && (
                        <button
                          onClick={() => onEdit(incendio)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                      )}
                      {showDeleteButton && userIsAdmin && (
                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir este incêndio?')) {
                              onDelete(incendio.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Excluir (Apenas Admin)"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      {showResolveButton && !incendio.dataFoiApagada && onResolve && (
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja marcar este incêndio como resolvido?')) {
                              onResolve(incendio.id);
                            }
                          }}
                          className="p-1.5 text-green-700 hover:bg-green-100 rounded"
                          title="Marcar como Resolvido"
                        >
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredIncendios.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Nenhum incêndio encontrado com os filtros selecionados.
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showDetails && selectedIncendio && (
        <IncendioDetails
          incendio={selectedIncendio}
          onClose={() => {
            setShowDetails(false);
            setSelectedIncendio(null);
          }}
          onEdit={handleEditFromDetails}
        />
      )}
    </div>
  );
}

