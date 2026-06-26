import { useState } from 'react';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import type { ClienteAdministrativo, ClienteAdministrativoStatus } from '../types';
import {
  cycleClienteAdministrativoStatus,
  getClienteAdministrativoPinColor,
  getClienteAdministrativoStatusLabel,
  isClienteAdministrativoDisponivel,
} from '../utils/clienteAdministrativoPinColor';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';

interface ClienteAdministrativoListProps {
  clientes: ClienteAdministrativo[];
  onEdit: (cliente: ClienteAdministrativo) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (
    cliente: ClienteAdministrativo,
    status: Exclude<ClienteAdministrativoStatus, 'disponivel'>
  ) => void | Promise<void>;
  showActions?: boolean;
  showPlantaColumn?: boolean;
  emptyMessage?: string;
}

function ObservacaoModal({
  cliente,
  onClose,
}: {
  cliente: ClienteAdministrativo;
  onClose: () => void;
}) {
  const nome = cliente.nomeCliente.trim() || 'Disponível';
  const texto = cliente.observacao?.trim() || 'Sem observação registrada.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Observação</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">{nome}</span>
            {' · '}
            Box {cliente.box || '—'} · Corredor {cliente.corredor || '—'}
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{texto}</p>
        </div>
        <div className="flex justify-end border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClienteAdministrativoList({
  clientes,
  onEdit,
  onDelete,
  onStatusChange,
  showActions = true,
  showPlantaColumn = true,
  emptyMessage = 'Nenhum cliente cadastrado.',
}: ClienteAdministrativoListProps) {
  const [observacaoCliente, setObservacaoCliente] = useState<ClienteAdministrativo | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  const handlePinClick = async (cliente: ClienteAdministrativo) => {
    if (!onStatusChange || isClienteAdministrativoDisponivel(cliente)) return;
    const nextStatus = cycleClienteAdministrativoStatus(cliente);
    if (!nextStatus) return;

    setStatusChangingId(cliente.id);
    try {
      await onStatusChange(cliente, nextStatus);
    } finally {
      setStatusChangingId(null);
    }
  };

  if (clientes.length === 0) {
    return <div className="py-12 text-center text-gray-500">{emptyMessage}</div>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-14 px-3 py-3 text-left text-xs font-medium uppercase text-gray-500" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
              {showPlantaColumn && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Planta</th>
              )}
              <th className="w-36 min-w-[9rem] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Setor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Corredor</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Box</th>
              <th className="w-36 min-w-[9rem] px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Inadimp.</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Processo</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.map((c) => {
              const color = getClienteAdministrativoPinColor(c);
              const plantaNome = getSetorAdministrativoById(c.setor)?.nome ?? c.setor;
              const disponivel = isClienteAdministrativoDisponivel(c);
              const canCycleStatus = !disponivel && Boolean(onStatusChange);
              const isChangingStatus = statusChangingId === c.id;

              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    {canCycleStatus ? (
                      <button
                        type="button"
                        onClick={() => void handlePinClick(c)}
                        disabled={isChangingStatus}
                        className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-60"
                        title={`Clique para alterar status (atual: ${getClienteAdministrativoStatusLabel(c)})`}
                      >
                        <span
                          className="h-6 w-6 rounded-full shadow-sm ring-1 ring-gray-200 transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                        />
                      </button>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center" title="Disponível — edite para alterar">
                        <span
                          className="h-6 w-6 rounded-full shadow-sm ring-1 ring-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate">
                    {c.nomeCliente.trim() || <span className="text-gray-400 italic">Disponível</span>}
                  </td>
                  {showPlantaColumn && (
                    <td className="px-4 py-3 text-sm text-gray-700">{plantaNome}</td>
                  )}
                  <td className="w-36 min-w-[9rem] px-4 py-3 text-sm text-gray-700">{c.setorLocal || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.corredor || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.box || '—'}</td>
                  <td className="w-36 min-w-[9rem] px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {getClienteAdministrativoStatusLabel(c)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.inadimplencia ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.processoJudicial ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setObservacaoCliente(c)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                        title="Ver observação"
                      >
                        <Eye size={16} />
                      </button>
                      {showActions && (
                        <>
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
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
                                  onDelete(c.id);
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {observacaoCliente && (
        <ObservacaoModal cliente={observacaoCliente} onClose={() => setObservacaoCliente(null)} />
      )}
    </>
  );
}
