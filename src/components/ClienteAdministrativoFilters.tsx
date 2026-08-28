import { FileDown, FileSpreadsheet, Save } from 'lucide-react';
import { SETOR_LOCAL_OPCOES } from '../config/clienteAdministrativoSetores';
import type { ClienteAdminListFilters } from '../utils/filterClientesAdministrativos';
import { emptyClienteAdminFilters } from '../utils/filterClientesAdministrativos';

interface ClienteAdministrativoFiltersProps {
  filters: ClienteAdminListFilters;
  onChange: (filters: ClienteAdminListFilters) => void;
  totalCount: number;
  filteredCount: number;
  onExportPdf?: () => void;
  exportingPdf?: boolean;
  onExportExcel?: () => void;
  exportingExcel?: boolean;
  onSaveSnapshot?: () => void;
  savingSnapshot?: boolean;
  /** Quantidade usada para habilitar "Salvar situação" (padrão: totalCount). */
  saveSnapshotCount?: number;
}

const selectClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500';

export default function ClienteAdministrativoFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
  onExportPdf,
  exportingPdf = false,
  onExportExcel,
  exportingExcel = false,
  onSaveSnapshot,
  savingSnapshot = false,
  saveSnapshotCount,
}: ClienteAdministrativoFiltersProps) {
  const patch = (partial: Partial<ClienteAdminListFilters>) => onChange({ ...filters, ...partial });
  const snapshotTotal = saveSnapshotCount ?? totalCount;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">Filtros</p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-gray-500">
            {filteredCount} de {totalCount} cliente(s)
          </p>
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              disabled={filteredCount === 0 || exportingPdf || exportingExcel}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              title="Exportar lista filtrada em PDF"
            >
              <FileDown size={14} className="mr-1.5" />
              {exportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
          )}
          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              disabled={filteredCount === 0 || exportingPdf || exportingExcel || savingSnapshot}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              title="Exportar lista filtrada em Excel"
            >
              <FileSpreadsheet size={14} className="mr-1.5" />
              {exportingExcel ? 'Gerando Excel...' : 'Exportar Excel'}
            </button>
          )}
          {onSaveSnapshot && (
            <button
              type="button"
              onClick={onSaveSnapshot}
              disabled={snapshotTotal === 0 || exportingPdf || exportingExcel || savingSnapshot}
              className="inline-flex items-center rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50"
              title="Salvar situação atual de todos os clientes da obra"
            >
              <Save size={14} className="mr-1.5" />
              {savingSnapshot ? 'Salvando...' : 'Salvar situação atual'}
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Nome do cliente</label>
        <input
          type="search"
          value={filters.nomeCliente}
          onChange={(e) => patch({ nomeCliente: e.target.value })}
          placeholder="Buscar por nome..."
          className={selectClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Setor</label>
          <select
            value={filters.setorLocal}
            onChange={(e) => patch({ setorLocal: e.target.value })}
            className={selectClass}
          >
            <option value="">Todos</option>
            {SETOR_LOCAL_OPCOES.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => patch({ status: e.target.value as ClienteAdminListFilters['status'] })}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="aberto">Aberto</option>
            <option value="fechado">Fechado</option>
            <option value="em_reforma">Em reforma</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Inadimplência</label>
          <select
            value={filters.inadimplencia}
            onChange={(e) => patch({ inadimplencia: e.target.value as ClienteAdminListFilters['inadimplencia'] })}
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Processo judicial</label>
          <select
            value={filters.processoJudicial}
            onChange={(e) =>
              patch({ processoJudicial: e.target.value as ClienteAdminListFilters['processoJudicial'] })
            }
            className={selectClass}
          >
            <option value="">Todos</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(emptyClienteAdminFilters())}
        className="text-xs font-medium text-violet-700 hover:underline"
      >
        Limpar filtros
      </button>
    </div>
  );
}
