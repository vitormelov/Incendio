import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ObraRDO, RDOAtividadeSituacao, Turno } from '../types';

type RdoDraft = Omit<ObraRDO, 'id' | 'createdAt' | 'updatedAt' | 'obraId'>;

export type RdoPdfInput = {
  obraNome: string;
  dataIso: string;
  draft: RdoDraft;
};

const TURNO_LABELS: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

const SITUACAO_LABELS: Record<RDOAtividadeSituacao, string> = {
  iniciada: 'Iniciada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
};

const formatDataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const mark = (checked: boolean) => (checked ? 'X' : '');

const safeFileName = (obraNome: string, dataIso: string) => {
  const base = obraNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48);
  return `RDO_${base || 'obra'}_${dataIso}.pdf`;
};

const getLastTableY = (doc: jsPDF, fallback: number) => {
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
  return typeof finalY === 'number' ? finalY : fallback;
};

const ensureSpace = (doc: jsPDF, y: number, needed: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 14) {
    doc.addPage();
    return 14;
  }
  return y;
};

export function downloadRdoPdf({ obraNome, dataIso, draft }: RdoPdfInput): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Relatório Diário de Obra (RDO)', pageWidth / 2, y, { align: 'center' });
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Obra: ${obraNome}`, margin, y);
  y += 6;
  doc.text(`Data: ${formatDataBR(dataIso)}`, margin, y);
  y += 10;

  const sectionTitle = (title: string) => {
    y = ensureSpace(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
  };

  sectionTitle('1) Clima');
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Turno', 'Limpo', 'Nublado', 'Chuvoso']],
    body: (['manha', 'tarde', 'noite'] as const).map((t) => [
      TURNO_LABELS[t],
      mark(draft.clima[t].limpo),
      mark(draft.clima[t].nublado),
      mark(draft.clima[t].chuvoso),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    theme: 'grid',
  });
  y = getLastTableY(doc, y) + 8;

  sectionTitle('2) Condição');
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Turno', 'Produtivo', 'Improdutivo']],
    body: (['manha', 'tarde', 'noite'] as const).map((t) => [
      TURNO_LABELS[t],
      mark(draft.condicao[t].produtivo),
      mark(draft.condicao[t].improdutivo),
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    theme: 'grid',
  });
  y = getLastTableY(doc, y) + 8;

  sectionTitle('3) Atividades');
  if (draft.atividades.length === 0) {
    y = ensureSpace(doc, y, 6);
    doc.setFontSize(10);
    doc.text('Nenhuma atividade registrada.', margin, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Atividade', 'Local', 'Situação']],
      body: draft.atividades.map((a) => [
        a.atividade || '—',
        a.local || '—',
        SITUACAO_LABELS[a.situacao] ?? a.situacao,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      theme: 'grid',
    });
    y = getLastTableY(doc, y) + 8;
  }

  sectionTitle('4) Efetivo');
  if (draft.efetivo.length === 0) {
    y = ensureSpace(doc, y, 6);
    doc.setFontSize(10);
    doc.text('Nenhum efetivo registrado.', margin, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Função', 'Empreiteiro', 'Quantidade']],
      body: draft.efetivo.map((e) => [e.funcao || '—', e.empreiteiro || '—', String(e.quantidade ?? 0)]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      theme: 'grid',
    });
    y = getLastTableY(doc, y) + 8;
  }

  sectionTitle('5) Equipamentos');
  if (draft.equipamentos.length === 0) {
    y = ensureSpace(doc, y, 6);
    doc.setFontSize(10);
    doc.text('Nenhum equipamento registrado.', margin, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Nome', 'Proprietário', 'Status', 'Quantidade']],
      body: draft.equipamentos.map((e) => [
        e.nome || '—',
        e.proprietario || '—',
        e.status === 'ativo' ? 'Ativo' : 'Inativo',
        String(e.quantidade ?? 0),
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      theme: 'grid',
    });
    y = getLastTableY(doc, y) + 8;
  }

  sectionTitle('6) Observações');
  y = ensureSpace(doc, y, 10);
  doc.setFontSize(10);
  const obs = draft.observacoes.trim() || '—';
  const lines = doc.splitTextToSize(obs, contentWidth);
  doc.text(lines, margin, y);

  doc.save(safeFileName(obraNome, dataIso));
}
