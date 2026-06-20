import type { ClienteAdministrativo } from '../types';

/** Cores dos pinos (prioridade: sem cliente → processo judicial → inadimplência → fechado → verde). */
export function getClienteAdministrativoPinColor(cliente: ClienteAdministrativo): string {
  const nome = (cliente.nomeCliente || '').trim();
  if (!nome) return '#3B82F6'; // azul — sem cliente
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
