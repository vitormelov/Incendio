import type { ClienteAdministrativo } from '../types';

/** Cores dos pinos (prioridade: disponível → processo judicial → inadimplência → fechado → verde). */
export function isClienteAdministrativoDisponivel(cliente: ClienteAdministrativo): boolean {
  return cliente.status === 'disponivel' || !(cliente.nomeCliente || '').trim();
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
  return { ...data, nomeCliente, status: data.status === 'fechado' ? 'fechado' : 'aberto' };
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
  return cliente;
}

export function getClienteAdministrativoStatusLabel(cliente: ClienteAdministrativo): string {
  if (isClienteAdministrativoDisponivel(cliente)) return 'Disponível';
  if (cliente.status === 'fechado') return 'Fechado';
  return 'Aberto';
}

export function getClienteAdministrativoPinColor(cliente: ClienteAdministrativo): string {
  if (isClienteAdministrativoDisponivel(cliente)) return '#3B82F6'; // azul — disponível
  if (cliente.processoJudicial) return '#FFBF00'; // amarelo forte — prevalece sobre inadimplência
  if (cliente.inadimplencia) return '#FF6D00'; // laranja forte
  if (cliente.status === 'fechado') return '#EF4444'; // vermelho
  return '#22C55E'; // verde — aberto, sem pendências
}
export function getClienteAdministrativoPinLabel(cliente: ClienteAdministrativo): string {
  const nome = (cliente.nomeCliente || '').trim();
  if (!nome) return '?';
  return nome.charAt(0).toUpperCase();
}
