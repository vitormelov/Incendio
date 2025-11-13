import { X } from 'lucide-react';
import { Incendio } from '../types';
import { getDisciplinaName, getDisciplinaColor, getSeveridadeName } from '../utils/colors';
import { getSetorById } from '../config/setores';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { differenceInDays } from 'date-fns';

interface IncendioDetailsProps {
  incendio: Incendio;
  onClose: () => void;
  onEdit: () => void;
}

export default function IncendioDetails({ incendio, onClose, onEdit }: IncendioDetailsProps) {
  const setor = getSetorById(incendio.setor);
  const color = getDisciplinaColor(incendio.disciplina);
  
  // Calcular atraso (apenas para incêndios abertos com data de apagar)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Normalizar para comparar apenas datas
  
  let dataApagar: Date | null = null;
  if (incendio.dataPretendeApagar && !incendio.dataFoiApagada) {
    // Parse da data no formato YYYY-MM-DD no fuso local
    const dateString = incendio.dataPretendeApagar.split('T')[0];
    const [year, month, day] = dateString.split('-').map(Number);
    dataApagar = new Date(year, month - 1, day);
    dataApagar.setHours(0, 0, 0, 0);
  }
  
  const atraso = dataApagar ? differenceInDays(hoje, dataApagar) : null;
  // Se atraso > 0 = Atrasado, se atraso <= 0 ou null = Aberto
  const status = !incendio.dataFoiApagada 
    ? (atraso !== null && atraso > 0 ? 'Atrasado' : 'Aberto')
    : 'Fechado';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Detalhes da Marcação</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Setor</label>
              <p className="text-base font-medium text-gray-900">{setor?.nome || incendio.setor}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Disciplina</label>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-base font-medium text-gray-900">
                  {getDisciplinaName(incendio.disciplina)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Severidade</label>
              <p className="text-base font-medium text-gray-900">
                {incendio.severidade} - {getSeveridadeName(incendio.severidade)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                status === 'Fechado' 
                  ? 'bg-green-100 text-green-800'
                  : status === 'Atrasado'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Responsável</label>
              <p className="text-base text-gray-900">{incendio.responsavel}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Data do Incêndio</label>
              <p className="text-base text-gray-900">
                {(() => {
                  const dateStr = incendio.dataAconteceu.split('T')[0];
                  const [year, month, day] = dateStr.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return format(date, 'dd/MM/yyyy', { locale: ptBR });
                })()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Data a ser Apagada</label>
              <p className="text-base text-gray-900">
                {incendio.dataPretendeApagar
                  ? (() => {
                      const dateStr = incendio.dataPretendeApagar.split('T')[0];
                      const [year, month, day] = dateStr.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return format(date, 'dd/MM/yyyy', { locale: ptBR });
                    })()
                  : 'Não informado'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Atraso</label>
              <p className="text-base text-gray-900">
                {atraso !== null
                  ? `${atraso > 0 ? '+' : ''}${atraso} dia(s) ${atraso > 0 ? 'de atraso' : ''}`
                  : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">É Gargalo</label>
              <p className="text-base text-gray-900">
                {incendio.isGargalo ? 'Sim' : 'Não'}
              </p>
            </div>

            {incendio.dataFoiApagada && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Data Foi Apagada</label>
                <p className="text-base text-gray-900">
                  {(() => {
                    const dateStr = incendio.dataFoiApagada.split('T')[0];
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return format(date, 'dd/MM/yyyy', { locale: ptBR });
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Descrição</label>
            <div className="p-4 bg-gray-50 rounded border border-gray-200">
              <p className="text-base text-gray-900 whitespace-pre-wrap">{incendio.descricao}</p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Coordenadas</label>
              <p className="text-sm text-gray-600">
                X: {incendio.coordenadas.x.toFixed(2)}%, Y: {incendio.coordenadas.y.toFixed(2)}%, Página: {incendio.coordenadas.page}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Criado em</label>
              <p className="text-sm text-gray-600">
                {format(new Date(incendio.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Última atualização</label>
              <p className="text-sm text-gray-600">
                {format(new Date(incendio.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Fechar
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

