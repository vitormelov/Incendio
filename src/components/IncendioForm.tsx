import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Incendio, Disciplina, Severidade } from '../types';
import { getDisciplinaName, getDisciplinaColor } from '../utils/colors';
import { getCurrentUser, isAdmin } from '../services/auth';
import { getUserName } from '../services/firestore';

interface IncendioFormProps {
  incendio?: Incendio | null;
  coordenadas?: { x: number; y: number; page: number } | null;
  onSave: (incendio: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  setor: string;
}

export default function IncendioForm({ 
  incendio, 
  coordenadas, 
  onSave, 
  onCancel,
  onDelete,
  setor 
}: IncendioFormProps) {
  const [formData, setFormData] = useState({
    disciplina: 'civil' as Disciplina,
    severidade: 1 as Severidade,
    isGargalo: false,
    descricao: '',
    responsavel: '',
    dataAconteceu: new Date().toISOString().split('T')[0],
    dataPretendeApagar: '',
  });
  const [criadorNome, setCriadorNome] = useState<string>('');

  useEffect(() => {
    // Buscar nome do usuário atual ou do criador
    const loadCriadorNome = async () => {
      if (!incendio) {
        // Nova marcação - mostrar nome do usuário atual
        const user = getCurrentUser();
        if (user) {
          const nome = await getUserName(user.uid);
          setCriadorNome(nome || user.email || 'Usuário desconhecido');
        }
      } else {
        // Editar marcação - buscar nome do criador se houver criadoPor (uid)
        if (incendio.criadoPor) {
          // Verificar se é um UID (geralmente mais longo) ou email
          if (incendio.criadoPor.includes('@')) {
            // É email, mostrar diretamente
            setCriadorNome(incendio.criadoPor);
          } else {
            // É UID, buscar nome no Firestore
            const nome = await getUserName(incendio.criadoPor);
            setCriadorNome(nome || incendio.criadoPor);
          }
        }
      }
    };

    loadCriadorNome();

    if (incendio) {
      setFormData({
        disciplina: incendio.disciplina,
        severidade: incendio.severidade,
        isGargalo: incendio.isGargalo,
        descricao: incendio.descricao,
        responsavel: incendio.responsavel,
        dataAconteceu: incendio.dataAconteceu.split('T')[0],
        dataPretendeApagar: incendio.dataPretendeApagar?.split('T')[0] || '',
      });
    }
  }, [incendio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coordenadas && !incendio) {
      alert('Coordenadas são necessárias para criar um novo incêndio');
      return;
    }

    onSave({
      setor,
      disciplina: formData.disciplina,
      severidade: formData.severidade,
      isGargalo: formData.isGargalo,
      descricao: formData.descricao,
      responsavel: formData.responsavel,
      dataAconteceu: formData.dataAconteceu,
      dataPretendeApagar: formData.dataPretendeApagar || null,
      dataFoiApagada: null, // Removido do formulário
      coordenadas: coordenadas || incendio!.coordenadas,
    });
  };

  const handleDelete = () => {
    if (incendio && onDelete) {
      if (window.confirm('Tem certeza que deseja excluir esta marcação?')) {
        onDelete(incendio.id);
      }
    }
  };

  const user = getCurrentUser();
  const showDeleteButton = incendio && onDelete && isAdmin(user);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {incendio ? 'Editar Marcação' : 'Nova Marcação'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Criador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criador
            </label>
            <div className="w-full p-3 border border-gray-300 rounded bg-gray-50 text-gray-700">
              {criadorNome || 'Carregando...'}
            </div>
          </div>

          {/* Disciplina com cores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disciplina
            </label>
            <select
              value={formData.disciplina}
              onChange={(e) => setFormData({ ...formData, disciplina: e.target.value as Disciplina })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderLeft: `4px solid ${getDisciplinaColor(formData.disciplina)}`
              }}
              required
            >
              <option value="civil">{getDisciplinaName('civil')}</option>
              <option value="instalacoes">{getDisciplinaName('instalacoes')}</option>
              <option value="equipamentos">{getDisciplinaName('equipamentos')}</option>
              <option value="estrutural">{getDisciplinaName('estrutural')}</option>
              <option value="impermeabilizacao">{getDisciplinaName('impermeabilizacao')}</option>
              <option value="ambientacao">{getDisciplinaName('ambientacao')}</option>
            </select>
            <div className="mt-1 flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getDisciplinaColor(formData.disciplina) }}
              ></div>
              <span className="text-xs text-gray-500">Cor da disciplina</span>
            </div>
          </div>

          {/* Severidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severidade
            </label>
            <select
              value={formData.severidade}
              onChange={(e) => setFormData({ ...formData, severidade: parseInt(e.target.value) as Severidade })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={1}>1 - Pequeno</option>
              <option value={2}>2 - Médio</option>
              <option value={3}>3 - Grande</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável
            </label>
            <input
              type="text"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do responsável"
              required
            />
          </div>

          {/* Data do Incêndio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data do Incêndio
            </label>
            <input
              type="date"
              value={formData.dataAconteceu}
              onChange={(e) => setFormData({ ...formData, dataAconteceu: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Data a ser Apagada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data a ser Apagada
            </label>
            <input
              type="date"
              value={formData.dataPretendeApagar}
              onChange={(e) => setFormData({ ...formData, dataPretendeApagar: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* É Gargalo */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGargalo}
                onChange={(e) => setFormData({ ...formData, isGargalo: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                É gargalo para outra atividade?
              </span>
            </label>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Descreva o problema..."
              required
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            {showDeleteButton && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Excluir
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
