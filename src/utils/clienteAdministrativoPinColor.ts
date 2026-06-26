import type { ClienteAdministrativo, ClienteAdministrativoStatus } from '../types';

export const CLIENTE_ADMIN_PIN_COLORS = {
  disponivel: '#3B82F6',
  aberto: '#22C55E',
  fechado: '#EF4444',
  em_reforma: '#FFBF00',
} as const;

export function isClienteAdministrativoDisponivel(cliente: ClienteAdministrativo): boolean {
  return cliente.status === 'disponivel' || !(cliente.nomeCliente || '').trim();
}

function normalizeStatusWithClient(
  status: ClienteAdministrativoStatus
): Exclude<ClienteAdministrativoStatus, 'disponivel'> {
  if (status === 'fechado') return 'fechado';
  if (status === 'em_reforma') return 'em_reforma';
  return 'aberto';
}

export function normalizeClienteAdministrativoFields<
  T extends Pick<ClienteAdministrativo, 'nomeCliente' | 'status'>
>(data: T): T {
  const nomeCliente = data.nomeCliente.trim();
  if (!nomeCliente) {
    return { ...data, nomeCliente: '', status: 'disponivel' };
  }
  if (data.status === 'disponivel') {
    return { ...data, nomeCliente, status: 'aberto' };
  }
  return { ...data, nomeCliente, status: normalizeStatusWithClient(data.status) };
}

export function normalizeClienteAdministrativoPartial(
  cliente: Partial<Omit<ClienteAdministrativo, 'id' | 'createdAt'>>
): Partial<Omit<ClienteAdministrativo, 'id' | 'createdAt'>> {
  if ('nomeCliente' in cliente && !(cliente.nomeCliente ?? '').trim()) {
    return { ...cliente, nomeCliente: '', status: 'disponivel' };
  }
  if (cliente.nomeCliente?.trim() && cliente.status === 'disponivel') {
    return { ...cliente, status: 'aberto' };
  }
  if (cliente.nomeCliente?.trim() && cliente.status) {
    return { ...cliente, status: normalizeStatusWithClient(cliente.status) };
  }
  return cliente;
}

export function getClienteAdministrativoStatusLabel(cliente: ClienteAdministrativo): string {
  if (isClienteAdministrativoDisponivel(cliente)) return 'Disponível';
  if (cliente.status === 'fechado') return 'Fechado';
  if (cliente.status === 'em_reforma') return 'Em reforma';
  return 'Aberto';
}

export function getClienteAdministrativoStatusOptions(): {
  value: Exclude<ClienteAdministrativoStatus, 'disponivel'>;
  label: string;
}[] {
  return [
    { value: 'aberto', label: 'Aberto' },
    { value: 'fechado', label: 'Fechado' },
    { value: 'em_reforma', label: 'Em reforma' },
  ];
}

export function getClienteAdministrativoPinColor(cliente: ClienteAdministrativo): string {
  if (isClienteAdministrativoDisponivel(cliente)) return CLIENTE_ADMIN_PIN_COLORS.disponivel;
  if (cliente.status === 'em_reforma') return CLIENTE_ADMIN_PIN_COLORS.em_reforma;
  if (cliente.status === 'fechado') return CLIENTE_ADMIN_PIN_COLORS.fechado;
  return CLIENTE_ADMIN_PIN_COLORS.aberto;
}

export function getClienteAdministrativoPinLabel(cliente: ClienteAdministrativo): string {
  const nome = (cliente.nomeCliente || '').trim();
  if (!nome) return '?';
  return nome.charAt(0).toUpperCase();
}
