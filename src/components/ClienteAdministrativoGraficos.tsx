import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { SETOR_LOCAL_OPCOES } from '../config/clienteAdministrativoSetores';
import type { ClienteAdministrativoSnapshot } from '../types';
import {
  STATUS_CHART_COLORS,
  STATUS_Y_ORDER,
  buildAggregateChartData,
  buildEntityChartData,
  collectClienteOptions,
  collectLojaOptions,
  collectSetorOptions,
  statusToYIndex,
  type SnapshotPeriod,
  type SnapshotScope,
} from '../utils/clienteAdministrativoSnapshotChart';

interface ClienteAdministrativoGraficosProps {
  snapshots: ClienteAdministrativoSnapshot[];
  loading: boolean;
  obraNome: string;
  onTvModeChange?: (active: boolean) => void;
}

const PERIOD_OPTIONS: { value: SnapshotPeriod; label: string }[] = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

const SCOPE_OPTIONS: { value: SnapshotScope; label: string }[] = [
  { value: 'todos', label: 'Todos os clientes' },
  { value: 'cliente', label: 'Um cliente' },
  { value: 'loja', label: 'Uma loja (box)' },
  { value: 'setor', label: 'Um setor' },
];

const STATUS_LABELS: Record<(typeof STATUS_Y_ORDER)[number], string> = {
  disponivel: 'Disponível',
  aberto: 'Aberto',
  em_reforma: 'Em reforma',
  fechado: 'Fechado',
};

const DEFAULT_CHART_HEIGHT = 320;
const POINT_STEP = 84;
const PAD_TOP = 20;
const PAD_BOTTOM = 56;
const AGG_PAD_LEFT = 56;
const AGG_PAD_RIGHT = 32;
/** Margem extra à esquerda para caber rótulos como "Em reforma" e "Disponível". */
const ENTITY_PAD_LEFT = 100;
const ENTITY_PAD_RIGHT = 40;
const MIN_CHART_WIDTH = 480;

const LEGEND_HEIGHT = 40;

function chartWrapperClass(fillHeight: boolean): string {
  if (!fillHeight) return 'overflow-x-auto rounded-lg border border-gray-200 bg-white px-4 sm:px-6';
  return 'h-full min-h-0 overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white px-4 sm:px-6 flex flex-col';
}

const AGGREGATE_SERIES = [
  { key: 'disponivel', label: 'Disponível', color: STATUS_CHART_COLORS.disponivel },
  { key: 'aberto', label: 'Aberto', color: STATUS_CHART_COLORS.aberto },
  { key: 'emReforma', label: 'Em reforma', color: STATUS_CHART_COLORS.emReforma },
  { key: 'fechado', label: 'Fechado', color: STATUS_CHART_COLORS.fechado },
] as const;

function getSeriesValue(
  point: ReturnType<typeof buildAggregateChartData>[number],
  key: (typeof AGGREGATE_SERIES)[number]['key']
): number {
  return point.counts[key];
}

function AggregateChart({
  points,
  height = DEFAULT_CHART_HEIGHT,
  fillHeight = false,
}: {
  points: ReturnType<typeof buildAggregateChartData>;
  height?: number;
  fillHeight?: boolean;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">Sem dados para o período selecionado.</p>;
  }

  const chartHeight = height;
  const plotHeight = chartHeight - PAD_TOP - PAD_BOTTOM;
  const chartWidth = Math.max(points.length * POINT_STEP + AGG_PAD_LEFT + AGG_PAD_RIGHT, MIN_CHART_WIDTH);

  const maxY = Math.max(
    1,
    ...points.flatMap((p) => AGGREGATE_SERIES.map((s) => getSeriesValue(p, s.key)))
  );

  const xAt = (idx: number) => AGG_PAD_LEFT + idx * POINT_STEP + POINT_STEP / 2;
  const yAt = (value: number) => PAD_TOP + plotHeight - (value / maxY) * plotHeight;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: Math.round(maxY * ratio),
    y: yAt(maxY * ratio),
  }));

  return (
    <div className={chartWrapperClass(fillHeight)}>
      <svg width={chartWidth} height={chartHeight} className="shrink-0 block" style={{ minWidth: chartWidth }}>
        <text
          x={20}
          y={PAD_TOP + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${PAD_TOP + plotHeight / 2})`}
          className="fill-gray-500 text-[11px]"
        >
          Quantidade
        </text>

        {yTicks.map(({ ratio, value, y }) => (
          <g key={ratio}>
            <line x1={AGG_PAD_LEFT} y1={y} x2={chartWidth - AGG_PAD_RIGHT} y2={y} stroke="#E5E7EB" strokeWidth={1} />
            <text x={AGG_PAD_LEFT - 10} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
              {value}
            </text>
          </g>
        ))}

        {AGGREGATE_SERIES.map((series) => {
          const coords = points.map((point, idx) => ({
            x: xAt(idx),
            y: yAt(getSeriesValue(point, series.key)),
            point,
          }));

          const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

          return (
            <g key={series.key}>
              <path
                d={linePath}
                fill="none"
                stroke={series.color}
                strokeWidth={fillHeight ? 3 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {coords.map(({ x, y, point }) => (
                <circle
                  key={point.key}
                  cx={x}
                  cy={y}
                  r={fillHeight ? 5 : 4}
                  fill={series.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                >
                  <title>
                    {`${point.label} — ${series.label}: ${getSeriesValue(point, series.key)}`}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}

        {points.map((point, idx) => (
          <text
            key={point.key}
            x={xAt(idx)}
            y={chartHeight - PAD_BOTTOM + 18}
            textAnchor="middle"
            className={`fill-gray-600 ${fillHeight ? 'text-[11px]' : 'text-[10px]'}`}
          >
            {point.label}
          </text>
        ))}
      </svg>

      <div
        className={`flex flex-wrap gap-x-5 gap-y-2 px-4 pb-4 pt-1 text-gray-600 shrink-0 ${
          fillHeight ? 'text-sm' : 'text-xs'
        }`}
      >
        {AGGREGATE_SERIES.map((series) => (
          <span key={series.key} className="inline-flex items-center gap-2">
            <span className="inline-block w-5 h-0.5 rounded" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EntityChart({
  points,
  height = DEFAULT_CHART_HEIGHT,
  fillHeight = false,
}: {
  points: ReturnType<typeof buildEntityChartData>;
  height?: number;
  fillHeight?: boolean;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">Sem dados para o período selecionado.</p>;
  }

  const chartHeight = height;
  const plotHeight = chartHeight - PAD_TOP - PAD_BOTTOM;
  const chartWidth = Math.max(points.length * POINT_STEP + ENTITY_PAD_LEFT + ENTITY_PAD_RIGHT, MIN_CHART_WIDTH);
  const ySteps = STATUS_Y_ORDER.length - 1 || 1;

  const coords = points.map((point, idx) => {
    const x = ENTITY_PAD_LEFT + idx * POINT_STEP + POINT_STEP / 2;
    const y = PAD_TOP + plotHeight - (statusToYIndex(point.status) / ySteps) * plotHeight;
    return { x, y, point };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <div className={chartWrapperClass(fillHeight)}>
      <svg width={chartWidth} height={chartHeight} className="shrink-0 block" style={{ minWidth: chartWidth }}>
        {STATUS_Y_ORDER.map((status, idx) => {
          const y = PAD_TOP + plotHeight - (idx / ySteps) * plotHeight;
          return (
            <g key={status}>
              <line
                x1={ENTITY_PAD_LEFT}
                y1={y}
                x2={chartWidth - ENTITY_PAD_RIGHT}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
              />
              <text
                x={ENTITY_PAD_LEFT - 12}
                y={y + 4}
                textAnchor="end"
                className={`fill-gray-500 ${fillHeight ? 'text-[11px]' : 'text-[10px]'}`}
              >
                {STATUS_LABELS[status]}
              </text>
            </g>
          );
        })}

        <path d={linePath} fill="none" stroke="#6B7280" strokeWidth={fillHeight ? 3 : 2} strokeLinejoin="round" />

        {coords.map(({ x, y, point }) => (
          <g key={point.key}>
            <circle
              cx={x}
              cy={y}
              r={fillHeight ? 7 : 6}
              fill={STATUS_CHART_COLORS[point.status === 'em_reforma' ? 'emReforma' : point.status]}
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={x}
              y={chartHeight - PAD_BOTTOM + 20}
              textAnchor="middle"
              className={`fill-gray-600 ${fillHeight ? 'text-[11px]' : 'text-[10px]'}`}
            >
              {point.label}
            </text>
            <title>
              {`${point.label}: ${point.statusLabel}${point.inadimplencia ? ' • Inadimplente' : ''}${point.processoJudicial ? ' • Processo judicial' : ''}`}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface GraficosFiltersProps {
  period: SnapshotPeriod;
  scope: SnapshotScope;
  clienteId: string;
  lojaKey: string;
  setorLocal: string;
  clienteOptions: { id: string; label: string }[];
  lojaOptions: { key: string; label: string }[];
  setorOptions: string[];
  onPeriodChange: (period: SnapshotPeriod) => void;
  onScopeChange: (scope: SnapshotScope) => void;
  onClienteIdChange: (id: string) => void;
  onLojaKeyChange: (key: string) => void;
  onSetorLocalChange: (setor: string) => void;
  compact?: boolean;
}

function GraficosFilters({
  period,
  scope,
  clienteId,
  lojaKey,
  setorLocal,
  clienteOptions,
  lojaOptions,
  setorOptions,
  onPeriodChange,
  onScopeChange,
  onClienteIdChange,
  onLojaKeyChange,
  onSetorLocalChange,
  compact = false,
}: GraficosFiltersProps) {
  const btnClass = (active: boolean) =>
    `rounded-md font-medium border ${
      compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
    } ${
      active
        ? 'bg-violet-600 text-white border-violet-600'
        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
    }`;

  const scopeBtnClass = (active: boolean) =>
    `rounded-md font-medium border ${
      compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
    } ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
    }`;

  const selectClass = compact
    ? 'rounded-md border border-gray-300 bg-white px-2 py-1 text-xs min-w-[140px]'
    : 'w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm';

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50/80 ${compact ? 'p-3 space-y-2' : 'p-4 space-y-4'}`}>
      <div className={compact ? 'flex flex-wrap items-end gap-4' : 'space-y-4'}>
        <div className={compact ? 'min-w-0' : ''}>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Período</p>
          <div className="flex flex-wrap gap-1.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPeriodChange(opt.value)}
                className={btnClass(period === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={compact ? 'min-w-0' : ''}>
          <p className="text-xs font-medium text-gray-600 mb-1.5">Análise</p>
          <div className="flex flex-wrap gap-1.5">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onScopeChange(opt.value)}
                className={scopeBtnClass(scope === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {scope === 'cliente' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cliente</label>
            <select value={clienteId} onChange={(e) => onClienteIdChange(e.target.value)} className={selectClass}>
              <option value="">Selecione...</option>
              {clienteOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {scope === 'loja' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Loja (box)</label>
            <select value={lojaKey} onChange={(e) => onLojaKeyChange(e.target.value)} className={selectClass}>
              <option value="">Selecione...</option>
              {lojaOptions.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {scope === 'setor' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Setor</label>
            <select value={setorLocal} onChange={(e) => onSetorLocalChange(e.target.value)} className={selectClass}>
              <option value="">Selecione...</option>
              {setorOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!compact && (
        <p className="text-xs text-gray-500">
          {period === 'diario'
            ? 'Diário: cada salvamento aparece como um ponto (com data e hora).'
            : 'Semanal, mensal e demais: agrupam vários salvamentos — fica o último de cada período.'}
        </p>
      )}
    </div>
  );
}

interface GraficosChartProps {
  showEntityChart: boolean;
  scope: SnapshotScope;
  clienteId: string;
  lojaKey: string;
  setorLocal: string;
  entityData: ReturnType<typeof buildEntityChartData>;
  aggregateData: ReturnType<typeof buildAggregateChartData>;
  chartHeight?: number;
  fillHeight?: boolean;
}

function GraficosChart({
  showEntityChart,
  scope,
  clienteId,
  lojaKey,
  setorLocal,
  entityData,
  aggregateData,
  chartHeight,
  fillHeight = false,
}: GraficosChartProps) {
  const wrapperClass = fillHeight ? 'h-full min-h-0' : '';

  if (showEntityChart) {
    if (!clienteId && scope === 'cliente') {
      return <p className="text-sm text-gray-500 text-center py-6">Selecione um cliente para ver o gráfico.</p>;
    }
    if (!lojaKey && scope === 'loja') {
      return <p className="text-sm text-gray-500 text-center py-6">Selecione uma loja para ver o gráfico.</p>;
    }
    return (
      <div className={wrapperClass}>
        <EntityChart points={entityData} height={chartHeight} fillHeight={fillHeight} />
      </div>
    );
  }

  if (scope === 'setor' && !setorLocal) {
    return <p className="text-sm text-gray-500 text-center py-6">Selecione um setor para ver o gráfico.</p>;
  }

  return (
    <div className={wrapperClass}>
      <AggregateChart points={aggregateData} height={chartHeight} fillHeight={fillHeight} />
    </div>
  );
}

export default function ClienteAdministrativoGraficos({
  snapshots,
  loading,
  obraNome,
  onTvModeChange,
}: ClienteAdministrativoGraficosProps) {
  const [period, setPeriod] = useState<SnapshotPeriod>('diario');
  const [scope, setScope] = useState<SnapshotScope>('todos');
  const [clienteId, setClienteId] = useState('');
  const [lojaKey, setLojaKey] = useState('');
  const [setorLocal, setSetorLocal] = useState('');
  const [tvMode, setTvMode] = useState(false);
  const [tvChartHeight, setTvChartHeight] = useState(480);
  const tvChartAreaRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(() => new Date());

  const clienteOptions = useMemo(() => collectClienteOptions(snapshots), [snapshots]);
  const lojaOptions = useMemo(() => collectLojaOptions(snapshots), [snapshots]);
  const setorFromSnapshots = useMemo(() => collectSetorOptions(snapshots), [snapshots]);
  const setorOptions = useMemo(() => {
    const known = new Set<string>(SETOR_LOCAL_OPCOES);
    const extras = setorFromSnapshots.filter((s) => !known.has(s));
    return [...SETOR_LOCAL_OPCOES, ...extras];
  }, [setorFromSnapshots]);

  const aggregateData = useMemo(() => {
    if (scope === 'cliente' || scope === 'loja') return [];
    return buildAggregateChartData(snapshots, period, scope, clienteId, lojaKey, setorLocal);
  }, [snapshots, period, scope, clienteId, lojaKey, setorLocal]);

  const entityData = useMemo(() => {
    if (scope === 'cliente' && clienteId) {
      return buildEntityChartData(snapshots, period, 'cliente', clienteId);
    }
    if (scope === 'loja' && lojaKey) {
      return buildEntityChartData(snapshots, period, 'loja', lojaKey);
    }
    return [];
  }, [snapshots, period, scope, clienteId, lojaKey]);

  const showEntityChart = scope === 'cliente' || scope === 'loja';

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
    const area = tvChartAreaRef.current;
    if (!area) return;

    const updateHeight = () => {
      const legendReserve = showEntityChart ? 0 : LEGEND_HEIGHT;
      setTvChartHeight(Math.max(180, area.clientHeight - legendReserve));
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(area);
    setClock(new Date());
    const clockId = window.setInterval(() => setClock(new Date()), 30_000);
    return () => {
      ro.disconnect();
      window.clearInterval(clockId);
    };
  }, [tvMode, showEntityChart, scope, clienteId, lojaKey, setorLocal]);

  const clockLabel = clock.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const filterProps = {
    period,
    scope,
    clienteId,
    lojaKey,
    setorLocal,
    clienteOptions,
    lojaOptions,
    setorOptions,
    onPeriodChange: setPeriod,
    onScopeChange: setScope,
    onClienteIdChange: setClienteId,
    onLojaKeyChange: setLojaKey,
    onSetorLocalChange: setSetorLocal,
  };

  const chartProps = {
    showEntityChart,
    scope,
    clienteId,
    lojaKey,
    setorLocal,
    entityData,
    aggregateData,
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Carregando histórico...</div>;
  }

  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
        <p className="font-medium text-gray-800">Nenhuma situação salva ainda</p>
        <p className="text-sm mt-2">
          Use o botão &quot;Salvar situação atual&quot; na aba Clientes para registrar o estado da lista e
          visualizar a evolução aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Evolução da situação</h2>
            <p className="text-sm text-gray-600 mt-1">
              {obraNome} — {snapshots.length} registro(s) salvos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTvMode(true)}
            className="inline-flex items-center gap-2 rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 shrink-0"
            title="Modo TV — gráfico em tela cheia (use F11 no navegador)"
          >
            <Maximize2 size={18} />
            Modo TV
          </button>
        </div>

        <GraficosFilters {...filterProps} />
        <GraficosChart {...chartProps} />
      </div>

      {tvMode && (
        <div className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-gray-50 p-3 sm:p-4">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-violet-700">
                Gráficos · Administrativo{obraNome ? ` · ${obraNome}` : ''}
              </p>
              <p className="text-sm text-gray-500">
                {snapshots.length} registro(s) · Atualizado: {clockLabel}
              </p>
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

          <div className="mb-2 shrink-0">
            <GraficosFilters {...filterProps} compact />
          </div>

          <div ref={tvChartAreaRef} className="min-h-0 flex-1 overflow-hidden">
            <GraficosChart {...chartProps} chartHeight={tvChartHeight} fillHeight />
          </div>
        </div>
      )}
    </>
  );
}
