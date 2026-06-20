import { Pencil, Trash2 } from 'lucide-react';
import type { ClienteAdministrativo } from '../types';
import { getClienteAdministrativoPinColor } from '../utils/clienteAdministrativoPinColor';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';

interface ClienteAdministrativoListProps {
  clientes: ClienteAdministrativo[];
  onEdit: (cliente: ClienteAdministrativo) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  showPlantaColumn?: boolean;
  emptyMessage?: string;
}

const statusLabel = (s: ClienteAdministrativo['status']) => (s === 'fechado' ? 'Fechado' : 'Aberto');

export default function ClienteAdministrativoList({
  clientes,
  onEdit,
  onDelete,
  showActions = true,
  showPlantaColumn = true,
  emptyMessage = 'Nenhum cliente cadastrado.',
}: ClienteAdministrativoListProps) {
  if (clientes.length === 0) {
    return <div className="py-12 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 w-10" />
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
            {showPlantaColumn && (
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Planta</th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Setor</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Corredor</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Box</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Inadimp.</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Processo</th>
            {showActions && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {clientes.map((c) => {
            const color = getClienteAdministrativoPinColor(c);
            const plantaNome = getSetorAdministrativoById(c.setor)?.nome ?? c.setor;
            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {(c.nomeCliente || '?').charAt(0).toUpperCase()}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {c.nomeCliente.trim() || <span className="text-gray-400 italic">Sem cliente</span>}
                </td>
                {showPlantaColumn && (
                  <td className="px-4 py-3 text-sm text-gray-700">{plantaNome}</td>
                )}
                <td className="px-4 py-3 text-sm text-gray-700">{c.setorLocal || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.corredor || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.box || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{statusLabel(c.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.inadimplencia ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{c.processoJudicial ? 'Sim' : 'Não'}</td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="inline-flex items-center justify-center rounded-md border border-indigo-300 bg-indigo-50 p-2 text-indigo-800 hover:bg-indigo-100"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
