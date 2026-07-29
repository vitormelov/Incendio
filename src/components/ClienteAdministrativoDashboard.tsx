import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { ClienteAdministrativoMetricas, ClienteAdministrativoSetorStats } from '../utils/clienteAdministrativoStats';

interface ClienteAdministrativoDashboardProps {
  geral: ClienteAdministrativoMetricas;
  porSetor: ClienteAdministrativoSetorStats[];
  loading?: boolean;
  obraNome?: string;
  /** Chamado ao entrar/sair do modo TV (útil para autoatualização). */
  onTvModeChange?: (active: boolean) => void;
}

function MetricBar({
  label,
  count,
  pct,
  color,
  compact = false,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={`flex items-center justify-between mb-1 ${compact ? 'text-sm' : 'text-sm'}`}>
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">
          {count} <span className="text-gray-500 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className={`rounded-full bg-gray-100 overflow-hidden ${compact ? 'h-2' : 'h-2'}`}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SetorCard({ stats, compact = false }: { stats: ClienteAdministrativoSetorStats; compact?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <h3 className={`font-bold text-gray-900 mb-0.5 ${compact ? 'text-lg' : 'text-lg'}`}>{stats.setorNome}</h3>
      <p className={`font-bold text-violet-700 ${compact ? 'text-3xl mb-1' : 'text-3xl mb-4'}`}>{stats.totalBoxes}</p>
      <p className={`font-medium uppercase tracking-wide text-gray-500 ${compact ? 'text-xs mb-2' : 'text-xs mb-3'}`}>
        Boxes no setor
      </p>

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        <MetricBar label="Disponíveis" count={stats.disponiveis} pct={stats.disponiveisPct} color="#3B82F6" compact={compact} />
        <MetricBar label="Abertos" count={stats.abertos} pct={stats.abertosPct} color="#22C55E" compact={compact} />
        <MetricBar label="Fechados" count={stats.fechados} pct={stats.fechadosPct} color="#EF4444" compact={compact} />
        <MetricBar label="Em reforma" count={stats.emReforma} pct={stats.emReformaPct} color="#FFBF00" compact={compact} />
        <MetricBar
          label="Inadimplentes"
          count={stats.inadimplentes}
          pct={stats.inadimplentesPct}
          color="#64748B"
          compact={compact}
        />
        <MetricBar
          label="Processo judicial"
          count={stats.processoJudicial}
          pct={stats.processoJudicialPct}
          color="#94A3B8"
          compact={compact}
        />
      </div>
    </div>
  );
}

function SummaryCards({ geral, compact = false }: { geral: ClienteAdministrativoMetricas; compact?: boolean }) {
  const cardPad = compact ? 'p-4' : 'p-4';
  const titleClass = compact ? 'text-xs mb-1' : 'text-xs mb-2';
  const valueClass = compact ? 'text-2xl' : 'text-2xl';
  const pctClass = compact ? 'text-sm' : 'text-sm';

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ${compact ? 'gap-2' : 'gap-4'}`}>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Disponíveis</p>
        <p className={`font-bold text-blue-600 ${valueClass}`}>{geral.disponiveis}</p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.disponiveisPct}% do total</p>
      </div>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Status — abertos</p>
        <p className={`font-bold text-green-600 ${valueClass}`}>{geral.abertos}</p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.abertosPct}% do total</p>
      </div>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Status — fechados</p>
        <p className={`font-bold text-red-600 ${valueClass}`}>{geral.fechados}</p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.fechadosPct}% do total</p>
      </div>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Status — em reforma</p>
        <p className={`font-bold ${valueClass}`} style={{ color: '#FFBF00' }}>
          {geral.emReforma}
        </p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.emReformaPct}% do total</p>
      </div>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Inadimplência</p>
        <p className={`font-bold text-slate-600 ${valueClass}`}>{geral.inadimplentes}</p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.inadimplentesPct}% do total</p>
      </div>
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${cardPad}`}>
        <p className={`font-medium uppercase text-gray-500 ${titleClass}`}>Processo judicial</p>
        <p className={`font-bold text-slate-500 ${valueClass}`}>{geral.processoJudicial}</p>
        <p className={`text-gray-600 ${pctClass}`}>{geral.processoJudicialPct}% do total</p>
      </div>
    </div>
  );
}

function DashboardBody({
  geral,
  porSetor,
  compact = false,
}: {
  geral: ClienteAdministrativoMetricas;
  porSetor: ClienteAdministrativoSetorStats[];
  compact?: boolean;
}) {
  return (
    <>
      <SummaryCards geral={geral} compact={compact} />

      {porSetor.length > 0 && (
        <div>
          <h2 className={`font-semibold text-gray-900 ${compact ? 'text-base mb-2' : 'text-lg mb-4'}`}>
            Por setor
          </h2>
          {compact ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {porSetor.slice(0, 4).map((stats) => (
                  <SetorCard key={stats.setorId} stats={stats} compact />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-[75%] mx-auto">
                {porSetor.slice(4).map((stats) => (
                  <SetorCard key={stats.setorId} stats={stats} compact />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {porSetor.map((stats) => (
                <SetorCard key={stats.setorId} stats={stats} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function ClienteAdministrativoDashboard({
  geral,
  porSetor,
  loading = false,
  obraNome,
  onTvModeChange,
}: ClienteAdministrativoDashboardProps) {
  const [tvMode, setTvMode] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    onTvModeChange?.(tvMode);
  }, [tvMode, onTvModeChange]);

  useEffect(() => {
    if (!tvMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTvMode(false);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [tvMode]);

  useEffect(() => {
    if (!tvMode) return;
    setClock(new Date());
    const id = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [tvMode]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Carregando dashboard...</div>;
  }

  const clockLabel = clock.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-violet-200 bg-violet-50 p-6">
          <div>
            <p className="text-sm font-medium text-violet-800 mb-1">Total de boxes</p>
            <p className="text-4xl font-bold text-violet-900">{geral.totalBoxes}</p>
          </div>
          <button
            type="button"
            onClick={() => setTvMode(true)}
            className="inline-flex items-center gap-2 rounded-md border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 shrink-0"
            title="Modo TV — dashboard em tela cheia (use F11 no navegador)"
          >
            <Maximize2 size={18} />
            Modo TV
          </button>
        </div>

        <DashboardBody geral={geral} porSetor={porSetor} />
      </div>

      {tvMode && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-gray-50 p-3 sm:p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-end gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-violet-700">
                  Administrativo{obraNome ? ` · ${obraNome}` : ''}
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-base font-medium text-gray-600">Total de boxes</p>
                  <p className="text-4xl font-bold text-violet-900">{geral.totalBoxes}</p>
                </div>
              </div>
              <p className="hidden sm:block text-sm text-gray-500 pb-1">Atualizado: {clockLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="hidden md:block text-xs text-gray-500">F11 para tela cheia · Esc para sair</p>
              <button
                type="button"
                onClick={() => setTvMode(false)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                title="Sair do modo TV"
              >
                <Minimize2 size={16} />
                Sair
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
            <DashboardBody geral={geral} porSetor={porSetor} compact />
          </div>
        </div>
      )}
    </>
  );
}
