import { useState } from 'react';
import { Trash2, Edit, Filter } from 'lucide-react';
import { Incendio, Disciplina, Severidade } from '../types';
import { getDisciplinaName, getSeveridadeName, getDisciplinaColor } from '../utils/colors';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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

  const filteredIncendios = incendios.filter(inc => {
    if (setor && inc.setor !== setor) return false;
    if (filters.disciplina && inc.disciplina !== filters.disciplina) return false;
    if (filters.severidade && inc.severidade !== filters.severidade) return false;
    if (filters.isGargalo !== '' && inc.isGargalo !== filters.isGargalo) return false;
    if (filters.apenasAbertos && inc.dataFoiApagada) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este incêndio?')) {
      onDelete(id);
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
            <option value="eletrica">{getDisciplinaName('eletrica')}</option>
            <option value="combate">{getDisciplinaName('combate')}</option>
            <option value="climatizacao">{getDisciplinaName('climatizacao')}</option>
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disciplina</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Severidade</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredIncendios.map((incendio) => {
              const color = getDisciplinaColor(incendio.disciplina);
              const isAberto = !incendio.dataFoiApagada;
              
              return (
                <tr key={incendio.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      {getDisciplinaName(incendio.disciplina)}
                    </span>
                    {incendio.isGargalo && (
                      <span className="ml-2 px-2 py-1 bg-black text-white text-xs rounded">Gargalo</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-medium">{incendio.severidade} - {getSeveridadeName(incendio.severidade)}</span>
                  </td>
                  <td className="px-4 py-2 text-sm">{incendio.descricao}</td>
                  <td className="px-4 py-2 text-sm">{incendio.responsavel}</td>
                  <td className="px-4 py-2 text-sm">
                    {format(new Date(incendio.dataAconteceu), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-2">
                    {isAberto ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Aberto</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Fechado em {format(new Date(incendio.dataFoiApagada!), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(incendio)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(incendio.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
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
    </div>
  );
}

