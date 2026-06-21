import type { ClienteAdministrativo } from '../types';

/** Cores dos pinos (prioridade: disponível → processo judicial → inadimplência → fechado → verde). */
export function isClienteAdministrativoDisponivel(cliente: ClienteAdministrativo): boolean {
  return !(cliente.nomeCliente || '').trim();
}

export function normalizeClienteAdministrativoFields<
  T extends Pick<ClienteAdministrativo, 'nomeCliente' | 'status'>
>(data: T): T {
  const nomeCliente = data.nomeCliente.trim();
  if (!nomeCliente) {
    return { ...data, nomeCliente: '', status: 'fechado' };
  }
  return { ...data, nomeCliente };
}

export function normalizeClienteAdministrativoPartial(
  cliente: Partial<Omit<ClienteAdministrativo, 'id' | 'createdAt'>>
): Partial<Omit<ClienteAdministrativo, 'id' | 'createdAt'>> {
  if ('nomeCliente' in cliente && !(cliente.nomeCliente ?? '').trim()) {
    return { ...cliente, nomeCliente: '', status: 'fechado' };
  }
  return cliente;
}

export function getClienteAdministrativoPinColor(cliente: ClienteAdministrativo): string {
  const nome = (cliente.nomeCliente || '').trim();
  if (!nome) return '#3B82F6'; // azul — disponível
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
