import type { ClienteAdministrativo, ClienteAdministrativoStatus } from '../types';
import { isClienteAdministrativoDisponivel } from './clienteAdministrativoPinColor';

export type ClienteAdminListFilters = {
  nomeCliente: string;
  setorLocal: string;
  status: '' | ClienteAdministrativoStatus;
  inadimplencia: '' | 'sim' | 'nao';
  processoJudicial: '' | 'sim' | 'nao';
};

export const emptyClienteAdminFilters = (): ClienteAdminListFilters => ({
  nomeCliente: '',
  setorLocal: '',
  status: '',
  inadimplencia: '',
  processoJudicial: '',
});

export function filterClientesAdministrativos(
  clientes: ClienteAdministrativo[],
  filters: ClienteAdminListFilters
): ClienteAdministrativo[] {
  const nomeQ = filters.nomeCliente.trim().toLowerCase();

  return clientes.filter((c) => {
    if (nomeQ && !(c.nomeCliente || '').toLowerCase().includes(nomeQ)) return false;
    if (filters.setorLocal && c.setorLocal !== filters.setorLocal) return false;
    if (filters.status === 'disponivel') {
      if (!isClienteAdministrativoDisponivel(c)) return false;
    } else if (
      filters.status === 'aberto' ||
      filters.status === 'fechado' ||
      filters.status === 'em_reforma'
    ) {
      if (isClienteAdministrativoDisponivel(c) || c.status !== filters.status) return false;
    }
    if (filters.inadimplencia === 'sim' && !c.inadimplencia) return false;
    if (filters.inadimplencia === 'nao' && c.inadimplencia) return false;
    if (filters.processoJudicial === 'sim' && !c.processoJudicial) return false;
    if (filters.processoJudicial === 'nao' && c.processoJudicial) return false;
    return true;
  });
}

export function hasActiveClienteAdminFilters(filters: ClienteAdminListFilters): boolean {
  return Boolean(
    filters.nomeCliente.trim() ||
      filters.setorLocal ||
      filters.status ||
      filters.inadimplencia ||
      filters.processoJudicial
  );
}
