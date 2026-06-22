import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import type { ClienteAdministrativo } from '../types';
import { getClienteAdministrativoStatusLabel } from './clienteAdministrativoPinColor';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';

export type ClientesAdministrativosExcelInput = {
  clientes: ClienteAdministrativo[];
  title: string;
  subtitle?: string;
  showPlantaColumn?: boolean;
  filteredCount?: number;
  totalCount?: number;
};

const safeFileName = (title: string) => {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48);
  const date = format(new Date(), 'yyyy-MM-dd');
  return `Clientes_${base || 'administrativo'}_${date}.xlsx`;
};

const simNao = (value: boolean) => (value ? 'Sim' : 'Não');

const clienteNome = (c: ClienteAdministrativo) => c.nomeCliente.trim() || 'Disponível';

export function downloadClientesAdministrativosExcel({
  clientes,
  title,
  subtitle,
  showPlantaColumn = false,
  filteredCount,
  totalCount,
}: ClientesAdministrativosExcelInput): void {
  const geradoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const meta: string[][] = [
    ['Lista de clientes — Administrativo'],
    [title],
  ];

  if (subtitle) meta.push([subtitle]);
  meta.push([`Gerado em: ${geradoEm}`]);

  if (
    typeof filteredCount === 'number' &&
    typeof totalCount === 'number' &&
    filteredCount !== totalCount
  ) {
    meta.push([`Filtros aplicados: ${filteredCount} de ${totalCount} registro(s)`]);
  } else {
    meta.push([`Total: ${clientes.length} registro(s)`]);
  }

  const headers = [
    'Cliente',
    ...(showPlantaColumn ? ['Planta'] : []),
    'Setor',
    'Corredor',
    'Box',
    'Status',
    'Inadimplência',
    'Processo judicial',
  ];

  const rows = clientes.map((c) => [
    clienteNome(c),
    ...(showPlantaColumn ? [getSetorAdministrativoById(c.setor)?.nome ?? c.setor] : []),
    c.setorLocal || '—',
    c.corredor || '—',
    c.box || '—',
    getClienteAdministrativoStatusLabel(c),
    simNao(c.inadimplencia),
    simNao(c.processoJudicial),
  ]);

  const sheetData = [...meta, [], headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
  XLSX.writeFile(workbook, safeFileName(title));
}
