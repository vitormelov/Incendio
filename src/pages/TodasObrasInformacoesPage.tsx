import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Info,
  Layers,
  MapPin,
  Wallet,
} from 'lucide-react';
import { useVisibleObras } from '../hooks/useVisibleObras';
import { getObraInformacoes } from '../services/firestore';
import type { Obra, ObraInformacoes, ObraStatus } from '../types';

const STATUS_LABELS: Record<ObraStatus, string> = {
  em_execucao: 'Em execução',
  parada: 'Parada',
  nao_iniciada: 'Não iniciada',
  concluida: 'Concluída',
};

const STATUS_BADGE_CLASS: Record<ObraStatus, string> = {
  em_execucao: 'bg-green-100 text-green-800',
  parada: 'bg-amber-100 text-amber-900',
  nao_iniciada: 'bg-slate-100 text-slate-700',
  concluida: 'bg-violet-100 text-violet-800',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const formatDateBR = (iso: string) => {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

type ObraComInformacoes = {
  obra: Obra;
  info: ObraInformacoes | null;
};

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-0.5 text-sm text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );
}

function ObraInfoCard({ obra, info }: ObraComInformacoes) {
  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{obra.nome}</h2>
        {info ? (
          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[info.status]}`}
          >
            {STATUS_LABELS[info.status]}
          </span>
        ) : (
          <span className="mt-2 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            Sem informações
          </span>
        )}
      </div>

      {info ? (
        <div className="space-y-4">
          <InfoField icon={MapPin} label="Endereço" value={info.endereco || '—'} />

          <div className="grid grid-cols-2 gap-4">
            <InfoField icon={Calendar} label="Início" value={formatDateBR(info.dataInicio)} />
            <InfoField icon={Calendar} label="Término previsto" value={formatDateBR(info.dataPrevistaTermino)} />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl bg-violet-50 px-4 py-3 ring-1 ring-violet-100">
              <div className="flex items-center gap-2 text-violet-700">
                <Wallet size={15} />
                <span className="text-[11px] font-medium leading-tight">Orçamento base</span>
              </div>
              <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(info.orcamentoBase)}</p>
            </div>
            <div className="rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
              <div className="flex items-center gap-2 text-sky-700">
                <Wallet size={15} />
                <span className="text-[11px] font-medium leading-tight">Orçamento dinâmico</span>
              </div>
              <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(info.orcamentoDinamico)}</p>
            </div>
          </div>

          <InfoField icon={Layers} label="Etapa da obra" value={info.etapaObra || '—'} />
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-500">
          As informações desta obra ainda não foram cadastradas.
        </p>
      )}
    </article>
  );
}

export default function TodasObrasInformacoesPage() {
  const visibleObras = useVisibleObras();
  const [rows, setRows] = useState<ObraComInformacoes[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visibleObras === null) return;

    let cancelled = false;
    void (async () => {
      try {
        setError('');
        const loaded = await Promise.all(
          visibleObras.map(async (obra) => ({
            obra,
            info: await getObraInformacoes(obra.id),
          }))
        );
        if (!cancelled) setRows(loaded);
      } catch (err) {
        console.error('Erro ao carregar informações das obras:', err);
        if (!cancelled) {
          setError('Não foi possível carregar as informações das obras.');
          setRows([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visibleObras]);

  const loading = visibleObras === null || rows === null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-3" />
          <p>Carregando informações das obras…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para Home
        </Link>

        <div className="flex items-start gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 shrink-0">
            <Info className="text-violet-700" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Informações das obras</h1>
            <p className="text-gray-600 mt-1">
              Resumo geral de {rows.length} obra{rows.length === 1 ? '' : 's'}.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900">
            Nenhuma obra está liberada para sua conta.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <ObraInfoCard key={row.obra.id} {...row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
