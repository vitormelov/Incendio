import {
  format,
  startOfWeek,
  startOfMonth,
  startOfYear,
  getMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  ClienteAdministrativoSnapshot,
  ClienteAdministrativoSnapshotItem,
  ClienteAdministrativoStatus,
} from '../types';

export type SnapshotPeriod = 'diario' | 'semanal' | 'mensal' | 'semestral' | 'anual';
export type SnapshotScope = 'todos' | 'cliente' | 'loja' | 'setor';

export interface SnapshotStatusCounts {
  disponivel: number;
  aberto: number;
  fechado: number;
  emReforma: number;
  inadimplentes: number;
  total: number;
}

export interface AggregateChartPoint {
  key: string;
  label: string;
  timestamp: number;
  counts: SnapshotStatusCounts;
}

export interface EntityChartPoint {
  key: string;
  label: string;
  timestamp: number;
  status: ClienteAdministrativoStatus;
  statusLabel: string;
  inadimplencia: boolean;
  processoJudicial: boolean;
}

function effectiveStatus(item: ClienteAdministrativoSnapshotItem): ClienteAdministrativoStatus {
  if (item.status === 'disponivel' || !item.nomeCliente.trim()) return 'disponivel';
  return item.status;
}

function statusLabel(status: ClienteAdministrativoStatus): string {
  if (status === 'disponivel') return 'Disponível';
  if (status === 'fechado') return 'Fechado';
  if (status === 'em_reforma') return 'Em reforma';
  return 'Aberto';
}

export function countSnapshotStatuses(
  items: ClienteAdministrativoSnapshotItem[]
): SnapshotStatusCounts {
  let disponivel = 0;
  let aberto = 0;
  let fechado = 0;
  let emReforma = 0;
  let inadimplentes = 0;

  for (const item of items) {
    const st = effectiveStatus(item);
    if (st === 'disponivel') disponivel += 1;
    else if (st === 'fechado') fechado += 1;
    else if (st === 'em_reforma') emReforma += 1;
    else aberto += 1;
    if (item.inadimplencia) inadimplentes += 1;
  }

  return {
    disponivel,
    aberto,
    fechado,
    emReforma,
    inadimplentes,
    total: items.length,
  };
}

function bucketKey(date: Date, period: SnapshotPeriod, snapshotId: string): string {
  switch (period) {
    case 'diario':
      return snapshotId;
    case 'semanal':
      return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    case 'mensal':
      return format(startOfMonth(date), 'yyyy-MM');
    case 'semestral': {
      const semester = getMonth(date) < 6 ? '1' : '2';
      return `${format(date, 'yyyy')}-S${semester}`;
    }
    case 'anual':
      return format(startOfYear(date), 'yyyy');
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

function bucketLabel(key: string, period: SnapshotPeriod, date: Date): string {
  switch (period) {
    case 'diario':
      return format(date, 'dd/MM/yy HH:mm', { locale: ptBR });
    case 'semanal':
      return `Sem. ${format(date, 'dd/MM', { locale: ptBR })}`;
    case 'mensal':
      return format(date, 'MMM/yy', { locale: ptBR });
    case 'semestral':
      return key.endsWith('-S1') ? `${format(date, 'yyyy')} • 1º sem.` : `${format(date, 'yyyy')} • 2º sem.`;
    case 'anual':
      return format(date, 'yyyy');
    default:
      return key;
  }
}

function filterSnapshotItems(
  items: ClienteAdministrativoSnapshotItem[],
  scope: SnapshotScope,
  clienteId?: string,
  lojaKey?: string,
  setorLocal?: string
): ClienteAdministrativoSnapshotItem[] {
  if (scope === 'todos') return items;
  if (scope === 'cliente' && clienteId) {
    return items.filter((i) => i.clienteId === clienteId);
  }
  if (scope === 'loja' && lojaKey) {
    return items.filter((i) => lojaKeyFromItem(i) === lojaKey);
  }
  if (scope === 'setor' && setorLocal) {
    return items.filter((i) => i.setorLocal.trim() === setorLocal);
  }
  return items;
}

export function lojaKeyFromItem(item: ClienteAdministrativoSnapshotItem): string {
  return `${item.setorLocal.trim()}|${item.corredor.trim()}|${item.box.trim()}`;
}

export function lojaLabelFromKey(key: string): string {
  const [setorLocal, corredor, box] = key.split('|');
  const parts = [setorLocal, corredor, box ? `Box ${box}` : ''].filter(Boolean);
  return parts.join(' • ');
}

function bucketSnapshots(
  snapshots: ClienteAdministrativoSnapshot[],
  period: SnapshotPeriod
): Map<string, { label: string; timestamp: number; snapshot: ClienteAdministrativoSnapshot }> {
  const buckets = new Map<
    string,
    { label: string; timestamp: number; snapshot: ClienteAdministrativoSnapshot }
  >();

  for (const snapshot of snapshots) {
    const date = new Date(snapshot.savedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = bucketKey(date, period, snapshot.id);
    const existing = buckets.get(key);
    if (!existing || date.getTime() >= existing.timestamp) {
      buckets.set(key, {
        label: bucketLabel(key, period, date),
        timestamp: date.getTime(),
        snapshot,
      });
    }
  }

  return buckets;
}

export function buildAggregateChartData(
  snapshots: ClienteAdministrativoSnapshot[],
  period: SnapshotPeriod,
  scope: SnapshotScope,
  clienteId?: string,
  lojaKey?: string,
  setorLocal?: string
): AggregateChartPoint[] {
  const buckets = bucketSnapshots(snapshots, period);
  const points: AggregateChartPoint[] = [];

  for (const [key, bucket] of buckets) {
    const filtered = filterSnapshotItems(
      bucket.snapshot.clientes,
      scope,
      clienteId,
      lojaKey,
      setorLocal
    );
    points.push({
      key,
      label: bucket.label,
      timestamp: bucket.timestamp,
      counts: countSnapshotStatuses(filtered),
    });
  }

  points.sort((a, b) => a.timestamp - b.timestamp);
  return points;
}

export function buildEntityChartData(
  snapshots: ClienteAdministrativoSnapshot[],
  period: SnapshotPeriod,
  scope: Extract<SnapshotScope, 'cliente' | 'loja'>,
  entityId: string
): EntityChartPoint[] {
  const buckets = bucketSnapshots(snapshots, period);
  const points: EntityChartPoint[] = [];

  for (const [key, bucket] of buckets) {
    const filtered =
      scope === 'cliente'
        ? bucket.snapshot.clientes.filter((i) => i.clienteId === entityId)
        : bucket.snapshot.clientes.filter((i) => lojaKeyFromItem(i) === entityId);

    if (filtered.length === 0) continue;

    const item = filtered[0];
    const status = effectiveStatus(item);
    points.push({
      key,
      label: bucket.label,
      timestamp: bucket.timestamp,
      status,
      statusLabel: statusLabel(status),
      inadimplencia: item.inadimplencia,
      processoJudicial: item.processoJudicial,
    });
  }

  points.sort((a, b) => a.timestamp - b.timestamp);
  return points;
}

export function collectLojaOptions(
  snapshots: ClienteAdministrativoSnapshot[]
): { key: string; label: string }[] {
  const map = new Map<string, string>();
  for (const snapshot of snapshots) {
    for (const item of snapshot.clientes) {
      const key = lojaKeyFromItem(item);
      if (!key.replace(/\|/g, '').trim()) continue;
      const label = lojaLabelFromKey(key);
      if (!map.has(key)) map.set(key, label);
    }
  }
  return Array.from(map.entries())
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function collectClienteOptions(
  snapshots: ClienteAdministrativoSnapshot[]
): { id: string; label: string }[] {
  const map = new Map<string, string>();
  for (const snapshot of snapshots) {
    for (const item of snapshot.clientes) {
      const nome = item.nomeCliente.trim();
      if (!nome || !item.clienteId) continue;
      if (!map.has(item.clienteId)) {
        map.set(item.clienteId, nome);
      }
    }
  }
  return Array.from(map.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function collectSetorOptions(
  snapshots: ClienteAdministrativoSnapshot[]
): string[] {
  const set = new Set<string>();
  for (const snapshot of snapshots) {
    for (const item of snapshot.clientes) {
      const s = item.setorLocal.trim();
      if (s) set.add(s);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const STATUS_CHART_COLORS = {
  disponivel: '#3B82F6',
  aberto: '#22C55E',
  fechado: '#EF4444',
  emReforma: '#FFBF00',
} as const;

export const STATUS_Y_ORDER: ClienteAdministrativoStatus[] = [
  'disponivel',
  'aberto',
  'em_reforma',
  'fechado',
];

export function statusToYIndex(status: ClienteAdministrativoStatus): number {
  const idx = STATUS_Y_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}
