import { useState } from 'react';
import { Edit, Filter, Eye } from 'lucide-react';
import { Incendio, Disciplina, Severidade } from '../types';
import { getDisciplinaName, getSeveridadeName, getDisciplinaColor } from '../utils/colors';
import { getSetorById } from '../config/setores';
import { format, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import IncendioDetails from './IncendioDetails';

interface IncendioListProps {
  incendios: Incendio[];
  onEdit: (incendio: Incendio) => void;
  onDelete: (id: string) => void;
  setor?: string;
}

export default function IncendioList({ incendios, onEdit, onDelete, setor }: IncendioListProps) {
  const [filters, setFilters] = useState({
    disciplina: '' as Disciplina | '',
    severidade: '' as Severidade | '',
    isGargalo: '' as boolean | '',
    apenasAbertos: false,
  });
  const [selectedIncendio, setSelectedIncendio] = useState<Incendio | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredIncendios = incendios.filter(inc => {
    if (setor && inc.setor !== setor) return false;
    if (filters.disciplina && inc.disciplina !== filters.disciplina) return false;
    if (filters.severidade && inc.severidade !== filters.severidade) return false;
    if (filters.isGargalo !== '' && inc.isGargalo !== filters.isGargalo) return false;
    if (filters.apenasAbertos && inc.dataFoiApagada) return false;
    return true;
  });

  const calcularAtraso = (incendio: Incendio): number | null => {
    // Calcular atraso apenas para incêndios abertos com data de apagar
    if (!incendio.dataPretendeApagar || incendio.dataFoiApagada) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalizar para comparar apenas datas
    const dataApagar = new Date(incendio.dataPretendeApagar);
    dataApagar.setHours(0, 0, 0, 0);
    return differenceInDays(hoje, dataApagar);
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            value={filters.disciplina}
            onChange={(e) => setFilters({ ...filters, disciplina: e.target.value as Disciplina | '' })}
            className="p-2 border rounded text-sm"
          >
            <option value="">Todas as Disciplinas</option>
            <option value="civil">{getDisciplinaName('civil')}</option>
            <option value="instalacoes">{getDisciplinaName('instalacoes')}</option>
            <option value="equipamentos">{getDisciplinaName('equipamentos')}</option>
            <option value="estrutural">{getDisciplinaName('estrutural')}</option>
            <option value="impermeabilizacao">{getDisciplinaName('impermeabilizacao')}</option>
            <option value="ambientacao">{getDisciplinaName('ambientacao')}</option>
          </select>

          <select
            value={filters.severidade}
            onChange={(e) => setFilters({ ...filters, severidade: e.target.value as Severidade | '' })}
            className="p-2 border rounded text-sm"
          >
            <option value="">Todas as Severidades</option>
            <option value={1}>1 - Pequeno</option>
            <option value={2}>2 - Médio</option>
            <option value={3}>3 - Grande</option>
          </select>

          <select
            value={filters.isGargalo === '' ? '' : filters.isGargalo.toString()}
            onChange={(e) => setFilters({ ...filters, isGargalo: e.target.value === '' ? '' : e.target.value === 'true' })}
            className="p-2 border rounded text-sm"
          >
            <option value="">Todos</option>
            <option value="true">Apenas Gargalos</option>
            <option value="false">Sem Gargalos</option>
          </select>

          <label className="flex items-center gap-2 p-2 border rounded text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.apenasAbertos}
              onChange={(e) => setFilters({ ...filters, apenasAbertos: e.target.checked })}
            />
            <span>Apenas Abertos</span>
          </label>
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
                    {format(new Date(incendio.dataAconteceu), 'dd/MM/yyyy', { locale: ptBR })}
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
                      <button
                        onClick={() => onEdit(incendio)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
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

