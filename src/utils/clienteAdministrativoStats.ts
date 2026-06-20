import type { ClienteAdministrativo } from '../types';
import { SETOR_LOCAL_OPCOES } from '../config/clienteAdministrativoSetores';

export interface ClienteAdministrativoMetricas {
  totalBoxes: number;
  abertos: number;
  fechados: number;
  abertosPct: number;
  fechadosPct: number;
  inadimplentes: number;
  inadimplentesPct: number;
  processoJudicial: number;
  processoJudicialPct: number;
}

export interface ClienteAdministrativoSetorStats extends ClienteAdministrativoMetricas {
  setorId: string;
  setorNome: string;
}

function pct(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function computeMetricas(clientes: ClienteAdministrativo[]): ClienteAdministrativoMetricas {
  const totalBoxes = clientes.length;
  const abertos = clientes.filter((c) => c.status === 'aberto').length;
  const fechados = clientes.filter((c) => c.status === 'fechado').length;
  const inadimplentes = clientes.filter((c) => c.inadimplencia).length;
  const processoJudicial = clientes.filter((c) => c.processoJudicial).length;

  return {
    totalBoxes,
    abertos,
    fechados,
    abertosPct: pct(abertos, totalBoxes),
    fechadosPct: pct(fechados, totalBoxes),
    inadimplentes,
    inadimplentesPct: pct(inadimplentes, totalBoxes),
    processoJudicial,
    processoJudicialPct: pct(processoJudicial, totalBoxes),
  };
}

export function computeClienteAdministrativoStats(clientes: ClienteAdministrativo[]): {
  geral: ClienteAdministrativoMetricas;
  porSetor: ClienteAdministrativoSetorStats[];
} {
  const known = new Set<string>(SETOR_LOCAL_OPCOES);

  const porSetor: ClienteAdministrativoSetorStats[] = SETOR_LOCAL_OPCOES.map((setorLocal) => {
    const doSetor = clientes.filter((c) => c.setorLocal.trim() === setorLocal);
    return {
      setorId: setorLocal,
      setorNome: setorLocal,
      ...computeMetricas(doSetor),
    };
  });

  const setoresExtras = [
    ...new Set(
      clientes
        .map((c) => c.setorLocal.trim())
        .filter((setorLocal) => setorLocal && !known.has(setorLocal))
    ),
  ];

  for (const setorLocal of setoresExtras) {
    const doSetor = clientes.filter((c) => c.setorLocal.trim() === setorLocal);
    porSetor.push({
      setorId: setorLocal,
      setorNome: setorLocal,
      ...computeMetricas(doSetor),
    });
  }

  return {
    geral: computeMetricas(clientes),
    porSetor,
  };
}
