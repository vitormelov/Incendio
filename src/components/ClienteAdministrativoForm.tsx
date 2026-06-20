import { useEffect, useMemo, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { ClienteAdministrativo, ClienteAdministrativoStatus } from '../types';
import {
  getSetorLocalOpcoesParaPlanta,
  getSetorLocalPadraoParaPlanta,
  type SetorLocalOpcao,
} from '../config/clienteAdministrativoSetores';
import { getClienteAdministrativoPinColor } from '../utils/clienteAdministrativoPinColor';

interface ClienteAdministrativoFormProps {
  cliente?: ClienteAdministrativo | null;
  coordenadas?: { x: number; y: number; page: number } | null;
  setorPlanta: string;
  obraId: string;
  onSave: (data: Omit<ClienteAdministrativo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const emptyForm = () => ({
  setorLocal: '',
  corredor: '',
  box: '',
  nomeCliente: '',
  status: 'aberto' as ClienteAdministrativoStatus,
  inadimplencia: false,
  processoJudicial: false,
});

export default function ClienteAdministrativoForm({
  cliente,
  coordenadas,
  setorPlanta,
  obraId,
  onSave,
  onCancel,
  onDelete,
  readOnly = false,
}: ClienteAdministrativoFormProps) {
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (cliente) {
      setFormData({
        setorLocal: cliente.setorLocal,
        corredor: cliente.corredor,
        box: cliente.box,
        nomeCliente: cliente.nomeCliente,
        status: cliente.status,
        inadimplencia: cliente.inadimplencia,
        processoJudicial: cliente.processoJudicial,
      });
    } else {
      setFormData({
        ...emptyForm(),
        setorLocal: getSetorLocalPadraoParaPlanta(setorPlanta),
      });
    }
  }, [cliente, setorPlanta]);

  const preview: ClienteAdministrativo = {
    id: cliente?.id ?? 'preview',
    setor: setorPlanta,
    obraId,
    ...formData,
    criadoPor: cliente?.criadoPor,
    coordenadas: coordenadas ?? cliente?.coordenadas ?? { x: 0, y: 0, page: 1 },
    createdAt: cliente?.createdAt ?? '',
    updatedAt: cliente?.updatedAt ?? '',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const coords = coordenadas ?? cliente?.coordenadas;
    if (!coords) {
      alert('Coordenadas da marcação não encontradas.');
      return;
    }

    if (!formData.setorLocal.trim()) {
      alert('Selecione o setor.');
      return;
    }

    onSave({
      setor: setorPlanta,
      obraId,
      setorLocal: formData.setorLocal.trim(),
      corredor: formData.corredor.trim(),
      box: formData.box.trim(),
      nomeCliente: formData.nomeCliente.trim(),
      status: formData.status,
      inadimplencia: formData.inadimplencia,
      processoJudicial: formData.processoJudicial,
      criadoPor: cliente?.criadoPor,
      coordenadas: coords,
    });
  };

  const pinColor = getClienteAdministrativoPinColor(preview);

  const setorOptions = useMemo(() => {
    const base = [...getSetorLocalOpcoesParaPlanta(setorPlanta)];
    const atual = formData.setorLocal.trim();
    if (atual && !base.includes(atual as SetorLocalOpcao)) {
      return [atual, ...base];
    }
    return base;
  }, [formData.setorLocal, setorPlanta]);

  const setorUnico = setorOptions.length === 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
              style={{ backgroundColor: pinColor }}
            >
              {(formData.nomeCliente || '?').charAt(0).toUpperCase() || '?'}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {readOnly ? 'Cliente' : cliente ? 'Editar cliente' : 'Novo cliente'}
            </h2>
          </div>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
            <select
              value={formData.setorLocal}
              onChange={(e) => setFormData((p) => ({ ...p, setorLocal: e.target.value }))}
              disabled={readOnly || setorUnico}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
            >
              {!setorUnico && <option value="">Selecione o setor</option>}
              {setorOptions.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corredor</label>
            <input
              type="text"
              value={formData.corredor}
              onChange={(e) => setFormData((p) => ({ ...p, corredor: e.target.value }))}
              disabled={readOnly}
              className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
              placeholder="Ex.: Corredor 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Box</label>
            <input
              type="text"
              value={formData.box}
              onChange={(e) => setFormData((p) => ({ ...p, box: e.target.value }))}
              disabled={readOnly}
              className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
              placeholder="Ex.: 12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do cliente</label>
            <input
              type="text"
              value={formData.nomeCliente}
              onChange={(e) => setFormData((p) => ({ ...p, nomeCliente: e.target.value }))}
              disabled={readOnly}
              className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50"
              placeholder="Opcional — sem nome o pino fica azul"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-4">
              {(['aberto', 'fechado'] as const).map((s) => (
                <label key={s} className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === s}
                    onChange={() => setFormData((p) => ({ ...p, status: s }))}
                    disabled={readOnly}
                    className="text-violet-600"
                  />
                  {s === 'aberto' ? 'Aberto' : 'Fechado'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inadimplência</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!formData.inadimplencia}
                  onChange={() => setFormData((p) => ({ ...p, inadimplencia: false }))}
                  disabled={readOnly}
                />
                Não
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={formData.inadimplencia}
                  onChange={() => setFormData((p) => ({ ...p, inadimplencia: true }))}
                  disabled={readOnly}
                />
                Sim
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Processo judicial</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!formData.processoJudicial}
                  onChange={() => setFormData((p) => ({ ...p, processoJudicial: false }))}
                  disabled={readOnly}
                />
                Não
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={formData.processoJudicial}
                  onChange={() => setFormData((p) => ({ ...p, processoJudicial: true }))}
                  disabled={readOnly}
                />
                Sim
              </label>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
            <strong>Legenda do pino:</strong> azul = sem cliente; amarelo = processo judicial (prevalece);
            laranja = inadimplência; vermelho = fechado; verde = aberto sem pendências.
          </div>

          {!readOnly && (
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {cliente && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Excluir este cliente?')) onDelete(cliente.id);
                  }}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 mr-auto"
                >
                  <Trash2 size={16} className="mr-2" />
                  Excluir
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
              >
                Salvar
              </button>
            </div>
          )}

          {readOnly && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
