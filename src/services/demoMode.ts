import { ALL_OBRA_MODULO_IDS } from '../config/obraModulos';
import { UserPermission } from '../types';
import type { ObraModuloId } from '../config/obraModulos';

/** Obra exibida no modo demonstração (somente leitura, sem colaborador). */
export const DEMO_OBRA_ID = 'hotel-central';

/** Conta Firebase dedicada à demonstração (pode sobrescrever via .env). */
export const DEMO_LOGIN_EMAIL =
  (import.meta.env.VITE_DEMO_EMAIL as string | undefined)?.trim() || 'demo@demo.com.br';
export const DEMO_LOGIN_PASSWORD =
  (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) || 'Facil123';

const DEMO_SESSION_KEY = 'incendio_demo_mode';

export type DemoUserProfile = {
  permissions: UserPermission[];
  obraIdsPermitidos: string[];
  obraModulosPermitidos: ObraModuloId[] | null;
};

export function isDemoMode(): boolean {
  return sessionStorage.getItem(DEMO_SESSION_KEY) === '1';
}

export function setDemoMode(): void {
  sessionStorage.setItem(DEMO_SESSION_KEY, '1');
}

export function clearDemoMode(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}

/** Perfil fixo: não colaborador, apenas Hotel Central. */
export function getDemoUserProfile(): DemoUserProfile {
  return {
    permissions: [],
    obraIdsPermitidos: [DEMO_OBRA_ID],
    obraModulosPermitidos: [...ALL_OBRA_MODULO_IDS],
  };
}
