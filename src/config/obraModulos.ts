import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Flame,
  Receipt,
  Scale,
  Wrench,
} from 'lucide-react';

/** Seções do menu dentro de uma obra. */
export type ObraModuloId =
  | 'dashboard'
  | 'incendios'
  | 'administrativo'
  | 'servicos'
  | 'notas'
  | 'gastos'
  | 'planejamento'
  | 'medicao'
  | 'rdo';

export const ALL_OBRA_MODULO_IDS: ObraModuloId[] = [
  'dashboard',
  'incendios',
  'administrativo',
  'servicos',
  'notas',
  'gastos',
  'planejamento',
  'medicao',
  'rdo',
];

export type ObraNavItemDef = {
  modulo: ObraModuloId;
  segment: string;
  label: string;
  icon: LucideIcon;
  matchPaths?: string[];
};

export const OBRA_NAV_ITEMS: ObraNavItemDef[] = [
  { modulo: 'dashboard', segment: '', label: 'Dashboard', icon: BarChart3, matchPaths: ['', '/dashboard'] },
  { modulo: 'incendios', segment: 'incendios', label: 'Incêndios', icon: Flame },
  { modulo: 'administrativo', segment: 'administrativo', label: 'Administrativo', icon: Briefcase, matchPaths: ['/administrativo'] },
  { modulo: 'servicos', segment: 'servicos', label: 'Serviços', icon: Wrench },
  { modulo: 'notas', segment: 'notas', label: 'Notas', icon: Receipt },
  { modulo: 'gastos', segment: 'gastos', label: 'Gastos', icon: Banknote },
  { modulo: 'planejamento', segment: 'planejamento', label: 'Planejamento', icon: CalendarDays },
  { modulo: 'medicao', segment: 'medicao', label: 'Medição', icon: Scale },
  { modulo: 'rdo', segment: 'rdo/lista', label: 'RDO', icon: ClipboardList, matchPaths: ['/rdo'] },
];

/** `null` no Firestore = todas as opções (retrocompatível e colaborador). */
export function parseObraModulosPermitidosDoUsuario(data: Record<string, unknown>): ObraModuloId[] | null {
  const valid = new Set(ALL_OBRA_MODULO_IDS);
  if (!('obraModulosPermitidos' in data)) return null;
  const raw = data.obraModulosPermitidos;
  if (!Array.isArray(raw)) return null;
  return raw.filter((id): id is ObraModuloId => typeof id === 'string' && valid.has(id as ObraModuloId));
}

export function isObraNavActive(
  item: ObraNavItemDef,
  pathname: string,
  obraBase: string
): boolean {
  const rel = pathname.slice(obraBase.length) || '';
  const matchers = item.matchPaths ?? [item.segment ? `/${item.segment}` : ''];
  return matchers.some((m) => {
    if (m === '' || m === '/dashboard') {
      return rel === '' || rel === '/dashboard';
    }
    if (m === '/rdo') {
      return rel.startsWith('/rdo');
    }
    if (m === '/administrativo') {
      return rel.startsWith('/administrativo');
    }
    return rel === m || rel.startsWith(`${m}/`);
  });
}

/** Módulo correspondente ao caminho relativo dentro de `/obra/:obraId`. */
export function obraModuloFromPath(pathname: string, obraBase: string): ObraModuloId | null {
  const item = OBRA_NAV_ITEMS.find((nav) => isObraNavActive(nav, pathname, obraBase));
  return item?.modulo ?? null;
}

export function obraPathForModulo(obraId: string, modulo: ObraModuloId): string {
  const base = `/obra/${obraId}`;
  const nav = OBRA_NAV_ITEMS.find((n) => n.modulo === modulo);
  if (!nav || !nav.segment) return base;
  return `${base}/${nav.segment}`;
}

/** Primeira opção permitida na ordem do menu lateral. */
export function firstObraPathForModulos(obraId: string, modulos: ObraModuloId[]): string {
  const pick = OBRA_NAV_ITEMS.find((n) => modulos.includes(n.modulo));
  if (!pick) return `/obra/${obraId}`;
  return obraPathForModulo(obraId, pick.modulo);
}
