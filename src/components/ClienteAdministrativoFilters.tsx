import { SETOR_LOCAL_OPCOES } from '../config/clienteAdministrativoSetores';
import type { ClienteAdminListFilters } from '../utils/filterClientesAdministrativos';
import { emptyClienteAdminFilters } from '../utils/filterClientesAdministrativos';

interface ClienteAdministrativoFiltersProps {
  filters: ClienteAdminListFilters;
  onChange: (filters: ClienteAdminListFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const selectClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500';

export default function ClienteAdministrativoFilters({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: ClienteAdministrativoFiltersProps) {
  const patch = (partial: Partial<ClienteAdminListFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">Filtros</p>
        <p className="text-xs text-gray-500">
          {filteredCount} de {totalCount} cliente(s)
        </p>
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
            <option value="aberto">Aberto</option>
            <option value="fechado">Fechado</option>
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
