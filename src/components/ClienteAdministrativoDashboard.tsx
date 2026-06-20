import type { ClienteAdministrativoMetricas, ClienteAdministrativoSetorStats } from '../utils/clienteAdministrativoStats';

interface ClienteAdministrativoDashboardProps {
  geral: ClienteAdministrativoMetricas;
  porSetor: ClienteAdministrativoSetorStats[];
  loading?: boolean;
}

function MetricBar({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">
          {count} <span className="text-gray-500 font-normal">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function SetorCard({ stats }: { stats: ClienteAdministrativoSetorStats }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-1">{stats.setorNome}</h3>
      <p className="text-3xl font-bold text-violet-700 mb-4">{stats.totalBoxes}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Boxes no setor</p>

      <div className="space-y-3">
        <MetricBar label="Abertos" count={stats.abertos} pct={stats.abertosPct} color="#22C55E" />
        <MetricBar label="Fechados" count={stats.fechados} pct={stats.fechadosPct} color="#EF4444" />
        <MetricBar
          label="Inadimplentes"
          count={stats.inadimplentes}
          pct={stats.inadimplentesPct}
          color="#FF6D00"
        />
        <MetricBar
          label="Processo judicial"
          count={stats.processoJudicial}
          pct={stats.processoJudicialPct}
          color="#FFBF00"
        />
      </div>
    </div>
  );
}

export default function ClienteAdministrativoDashboard({
  geral,
  porSetor,
  loading = false,
}: ClienteAdministrativoDashboardProps) {
  if (loading) {
    return <div className="py-12 text-center text-gray-500">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-6">
        <p className="text-sm font-medium text-violet-800 mb-1">Total de boxes</p>
        <p className="text-4xl font-bold text-violet-900">{geral.totalBoxes}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500 mb-2">Status — abertos</p>
          <p className="text-2xl font-bold text-green-600">{geral.abertos}</p>
          <p className="text-sm text-gray-600">{geral.abertosPct}% do total</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500 mb-2">Status — fechados</p>
          <p className="text-2xl font-bold text-red-600">{geral.fechados}</p>
          <p className="text-sm text-gray-600">{geral.fechadosPct}% do total</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500 mb-2">Inadimplência</p>
          <p className="text-2xl font-bold" style={{ color: '#FF6D00' }}>
            {geral.inadimplentes}
          </p>
          <p className="text-sm text-gray-600">{geral.inadimplentesPct}% do total</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-500 mb-2">Processo judicial</p>
          <p className="text-2xl font-bold" style={{ color: '#FFBF00' }}>
            {geral.processoJudicial}
          </p>
          <p className="text-sm text-gray-600">{geral.processoJudicialPct}% do total</p>
        </div>
      </div>

      {porSetor.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Por setor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {porSetor.map((stats) => (
              <SetorCard key={stats.setorId} stats={stats} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
