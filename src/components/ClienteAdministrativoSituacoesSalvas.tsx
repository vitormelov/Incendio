import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Trash2, X } from 'lucide-react';
import type { ClienteAdministrativoSnapshot, ClienteAdministrativoSnapshotItem } from '../types';
import { countSnapshotStatuses } from '../utils/clienteAdministrativoSnapshotChart';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';

interface ClienteAdministrativoSituacoesSalvasProps {
  snapshots: ClienteAdministrativoSnapshot[];
  loading: boolean;
  obraNome: string;
  onDelete: (id: string) => Promise<void>;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function statusLabel(item: ClienteAdministrativoSnapshotItem): string {
  if (item.status === 'disponivel' || !item.nomeCliente.trim()) return 'Disponível';
  if (item.status === 'fechado') return 'Fechado';
  if (item.status === 'em_reforma') return 'Em reforma';
  return 'Aberto';
}

function statusBadgeClass(item: ClienteAdministrativoSnapshotItem): string {
  if (item.status === 'disponivel' || !item.nomeCliente.trim()) return 'bg-blue-100 text-blue-800';
  if (item.status === 'fechado') return 'bg-red-100 text-red-800';
  if (item.status === 'em_reforma') return 'bg-yellow-100 text-yellow-900';
  return 'bg-green-100 text-green-800';
}

function SnapshotDetailModal({
  snapshot,
  obraNome,
  onClose,
}: {
  snapshot: ClienteAdministrativoSnapshot;
  obraNome: string;
  onClose: () => void;
}) {
  const counts = countSnapshotStatuses(snapshot.clientes);
  const sorted = useMemo(
    () =>
      [...snapshot.clientes].sort((a, b) =>
        (a.nomeCliente || a.box).localeCompare(b.nomeCliente || b.box, 'pt-BR', {
          numeric: true,
          sensitivity: 'base',
        })
      ),
    [snapshot.clientes]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Situação salva</h3>
            <p className="mt-1 text-sm text-gray-600">
              {obraNome} · {formatSavedAt(snapshot.savedAt)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Salvo por {snapshot.savedByNome || '—'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b bg-gray-50 px-5 py-3 text-center text-xs">
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-bold text-gray-900">{counts.total}</p>
          </div>
          <div>
            <p className="text-gray-500">Disponível</p>
            <p className="font-bold text-blue-600">{counts.disponivel}</p>
          </div>
          <div>
            <p className="text-gray-500">Aberto</p>
            <p className="font-bold text-green-600">{counts.aberto}</p>
          </div>
          <div>
            <p className="text-gray-500">Fechado</p>
            <p className="font-bold text-red-600">{counts.fechado}</p>
          </div>
          <div>
            <p className="text-gray-500">Em reforma</p>
            <p className="font-bold text-yellow-600">{counts.emReforma}</p>
          </div>
          <div>
            <p className="text-gray-500">Inadimplentes</p>
            <p className="font-bold text-slate-600">{counts.inadimplentes}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="pb-2 pr-3">Cliente</th>
                <th className="pb-2 pr-3">Planta</th>
                <th className="pb-2 pr-3">Setor</th>
                <th className="pb-2 pr-3">Corredor</th>
                <th className="pb-2 pr-3">Box</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3 text-center">Inad.</th>
                <th className="pb-2 text-center">Proc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((item) => (
                <tr key={item.clienteId || `${item.setorLocal}-${item.box}`} className="text-gray-800">
                  <td className="py-2 pr-3">{item.nomeCliente.trim() || '—'}</td>
                  <td className="py-2 pr-3">{getSetorAdministrativoById(item.setor)?.nome ?? item.setor}</td>
                  <td className="py-2 pr-3">{item.setorLocal || '—'}</td>
                  <td className="py-2 pr-3">{item.corredor || '—'}</td>
                  <td className="py-2 pr-3">{item.box || '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item)}`}>
                      {statusLabel(item)}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-center">{item.inadimplencia ? 'Sim' : 'Não'}</td>
                  <td className="py-2 text-center">{item.processoJudicial ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t px-5 py-3 flex justify-end">
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

function DeleteConfirmModal({
  snapshot,
  deleting,
  onConfirm,
  onCancel,
}: {
  snapshot: ClienteAdministrativoSnapshot;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Excluir situação salva</h3>
        <p className="mt-3 text-sm text-gray-600">
          Deseja excluir o registro de{' '}
          <strong className="text-gray-900">{formatSavedAt(snapshot.savedAt)}</strong>?
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {snapshot.clientes.length} cliente(s) · Salvo por {snapshot.savedByNome || '—'}. Esta ação não pode ser
          desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClienteAdministrativoSituacoesSalvas({
  snapshots,
  loading,
  obraNome,
  onDelete,
}: ClienteAdministrativoSituacoesSalvasProps) {
  const [viewSnapshot, setViewSnapshot] = useState<ClienteAdministrativoSnapshot | null>(null);
  const [deleteSnapshot, setDeleteSnapshot] = useState<ClienteAdministrativoSnapshot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
    [snapshots]
  );

  const handleConfirmDelete = async () => {
    if (!deleteSnapshot) return;
    try {
      setDeleting(true);
      await onDelete(deleteSnapshot.id);
      setDeleteSnapshot(null);
    } catch {
      alert('Erro ao excluir situação salva.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Carregando situações salvas...</div>;
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        <p className="font-medium text-gray-800">Nenhuma situação salva ainda</p>
        <p className="text-sm mt-2">
          Use o botão &quot;Salvar situação atual&quot; na aba Clientes para registrar o estado da lista.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="border-b px-4 py-3 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Situações salvas</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            {obraNome} · {sorted.length} registro(s)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-white text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Data e hora</th>
                <th className="px-4 py-3">Salvo por</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Disp.</th>
                <th className="px-4 py-3 text-center">Aberto</th>
                <th className="px-4 py-3 text-center">Fechado</th>
                <th className="px-4 py-3 text-center">Reforma</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((snapshot) => {
                const counts = countSnapshotStatuses(snapshot.clientes);
                return (
                  <tr key={snapshot.id} className="text-gray-800 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{formatSavedAt(snapshot.savedAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{snapshot.savedByNome || '—'}</td>
                    <td className="px-4 py-3 text-center font-medium">{counts.total}</td>
                    <td className="px-4 py-3 text-center text-blue-600">{counts.disponivel}</td>
                    <td className="px-4 py-3 text-center text-green-600">{counts.aberto}</td>
                    <td className="px-4 py-3 text-center text-red-600">{counts.fechado}</td>
                    <td className="px-4 py-3 text-center text-yellow-600">{counts.emReforma}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewSnapshot(snapshot)}
                          className="inline-flex items-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50"
                          title="Analisar"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteSnapshot(snapshot)}
                          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
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
        </div>
      </div>

      {viewSnapshot && (
        <SnapshotDetailModal snapshot={viewSnapshot} obraNome={obraNome} onClose={() => setViewSnapshot(null)} />
      )}

      {deleteSnapshot && (
        <DeleteConfirmModal
          snapshot={deleteSnapshot}
          deleting={deleting}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => {
            if (!deleting) setDeleteSnapshot(null);
          }}
        />
      )}
    </>
  );
}
