import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClienteAdministrativo } from '../types';
import { getClienteAdministrativoStatusLabel } from './clienteAdministrativoPinColor';
import { getSetorAdministrativoById } from '../config/setoresAdministrativo';

export type ClientesAdministrativosPdfInput = {
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
  return `Clientes_${base || 'administrativo'}_${date}.pdf`;
};

const simNao = (value: boolean) => (value ? 'Sim' : 'Não');

const clienteNome = (c: ClienteAdministrativo) => c.nomeCliente.trim() || 'Disponível';

export function downloadClientesAdministrativosPdf({
  clientes,
  title,
  subtitle,
  showPlantaColumn = false,
  filteredCount,
  totalCount,
}: ClientesAdministrativosPdfInput): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Lista de clientes — Administrativo', pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(title, margin, y);
  y += 5;

  if (subtitle) {
    doc.text(subtitle, margin, y);
    y += 5;
  }

  const geradoEm = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${geradoEm}`, margin, y);
  y += 5;

  if (
    typeof filteredCount === 'number' &&
    typeof totalCount === 'number' &&
    filteredCount !== totalCount
  ) {
    doc.text(`Filtros aplicados: ${filteredCount} de ${totalCount} registro(s)`, margin, y);
    y += 5;
  } else {
    doc.text(`Total: ${clientes.length} registro(s)`, margin, y);
    y += 5;
  }

  y += 2;

  const head = [
    'Cliente',
    ...(showPlantaColumn ? ['Planta'] : []),
    'Setor',
    'Corredor',
    'Box',
    'Status',
    'Inadimplência',
    'Processo judicial',
  ];

  const body =
    clientes.length === 0
      ? []
      : clientes.map((c) => [
          clienteNome(c),
          ...(showPlantaColumn
            ? [getSetorAdministrativoById(c.setor)?.nome ?? c.setor]
            : []),
          c.setorLocal || '—',
          c.corredor || '—',
          c.box || '—',
          getClienteAdministrativoStatusLabel(c),
          simNao(c.inadimplencia),
          simNao(c.processoJudicial),
        ]);

  if (body.length === 0) {
    doc.setFontSize(10);
    doc.text('Nenhum cliente para exportar.', margin, y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [head],
      body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      theme: 'grid',
    });
  }

  doc.save(safeFileName(title));
}
