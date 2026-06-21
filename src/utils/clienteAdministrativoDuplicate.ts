import type { ClienteAdministrativo } from '../types';

export function normalizeClienteLocalKey(
  setorLocal: string,
  corredor: string,
  box: string
): string {
  return [setorLocal, corredor, box].map((v) => v.trim().toLowerCase()).join('\0');
}

export function findClienteDuplicado(
  clientes: ClienteAdministrativo[],
  setorLocal: string,
  corredor: string,
  box: string,
  excludeId?: string
): ClienteAdministrativo | undefined {
  const key = normalizeClienteLocalKey(setorLocal, corredor, box);
  return clientes.find(
    (c) => c.id !== excludeId && normalizeClienteLocalKey(c.setorLocal, c.corredor, c.box) === key
  );
}

export function getClienteDuplicadoMensagem(setorLocal: string, corredor: string, box: string): string {
  const parts = [`Setor ${setorLocal.trim() || '—'}`];
  if (corredor.trim()) parts.push(`Corredor ${corredor.trim()}`);
  if (box.trim()) parts.push(`Box ${box.trim()}`);
  return `Já existe um cliente com ${parts.join(', ')}.`;
}
