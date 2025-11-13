import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Incendio, Disciplina, Severidade } from '../types';
import { getDisciplinaName } from '../utils/colors';

interface IncendioFormProps {
  incendio?: Incendio | null;
  coordenadas?: { x: number; y: number; page: number } | null;
  onSave: (incendio: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  setor: string;
}

export default function IncendioForm({ 
  incendio, 
  coordenadas, 
  onSave, 
  onCancel,
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
    dataFoiApagada: '',
  });

  useEffect(() => {
    if (incendio) {
      setFormData({
        disciplina: incendio.disciplina,
        severidade: incendio.severidade,
        isGargalo: incendio.isGargalo,
        descricao: incendio.descricao,
        responsavel: incendio.responsavel,
        dataAconteceu: incendio.dataAconteceu.split('T')[0],
        dataPretendeApagar: incendio.dataPretendeApagar?.split('T')[0] || '',
        dataFoiApagada: incendio.dataFoiApagada?.split('T')[0] || '',
      });
    } else if (coordenadas) {
      setFormData(prev => ({ ...prev }));
    }
  }, [incendio, coordenadas]);

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
      dataFoiApagada: formData.dataFoiApagada || null,
      coordenadas: coordenadas || incendio!.coordenadas,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {incendio ? 'Editar Incêndio' : 'Novo Incêndio'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Disciplina</label>
              <select
                value={formData.disciplina}
                onChange={(e) => setFormData({ ...formData, disciplina: e.target.value as Disciplina })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="civil">{getDisciplinaName('civil')}</option>
                <option value="eletrica">{getDisciplinaName('eletrica')}</option>
                <option value="combate">{getDisciplinaName('combate')}</option>
                <option value="climatizacao">{getDisciplinaName('climatizacao')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Severidade</label>
              <select
                value={formData.severidade}
                onChange={(e) => setFormData({ ...formData, severidade: parseInt(e.target.value) as Severidade })}
                className="w-full p-2 border rounded"
                required
              >
                <option value={1}>1 - Pequeno</option>
                <option value={2}>2 - Médio</option>
                <option value={3}>3 - Grande</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data que Aconteceu</label>
              <input
                type="date"
                value={formData.dataAconteceu}
                onChange={(e) => setFormData({ ...formData, dataAconteceu: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Pretende Apagar</label>
              <input
                type="date"
                value={formData.dataPretendeApagar}
                onChange={(e) => setFormData({ ...formData, dataPretendeApagar: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Foi Apagada</label>
              <input
                type="date"
                value={formData.dataFoiApagada}
                onChange={(e) => setFormData({ ...formData, dataFoiApagada: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isGargalo}
                onChange={(e) => setFormData({ ...formData, isGargalo: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">É Gargalo</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full p-2 border rounded"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
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

