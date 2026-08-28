interface SaveSnapshotConfirmModalProps {
  open: boolean;
  timestampLabel: string;
  clientCount: number;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SaveSnapshotConfirmModal({
  open,
  timestampLabel,
  clientCount,
  saving,
  onConfirm,
  onCancel,
}: SaveSnapshotConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Salvar situação atual</h3>
        <p className="mt-3 text-sm text-gray-600">
          Deseja registrar a situação de{' '}
          <strong className="text-gray-900">{clientCount} cliente(s)</strong> neste momento?
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Data e hora: <strong className="text-gray-900">{timestampLabel}</strong>
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Este registro poderá ser consultado na aba Gráficos para acompanhar mudanças ao longo do tempo.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
