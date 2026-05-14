import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Trash2,
} from 'lucide-react';
import { getObraById } from '../config/setores';
import { getObraMedicao, getObraServices, upsertObraMedicao } from '../services/firestore';
import { canManageObraData } from '../services/auth';
import type { MedicaoCelula, MedicaoLinha, ObraMedicaoBloco, ObraMedicaoPrestadorSheet, ObraService } from '../types';
import { OBRA_MEDICAO_PRESTADOR_SLOTS } from '../types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const IMPLICIT_ORDER_BASE = 1_000_000;

/** Ordenação igual à página Serviços: pacotes e itens na mesma ordem de exibição. */
function sortObraServicesForMedicao(services: ObraService[]): ObraService[] {
  const map = new Map<string, ObraService[]>();
  for (const service of services) {
    const pacote = (service.pacote || '').trim() || 'Sem pacote';
    const current = map.get(pacote) || [];
    current.push(service);
    map.set(pacote, current);
  }

  const entries = Array.from(map.entries()).map(([pacote, items]) => {
    const withOrder = items.filter((s) => typeof s.serviceOrder === 'number') as Array<
      ObraService & { serviceOrder: number }
    >;
    const withoutOrder = items.filter((s) => typeof s.serviceOrder !== 'number');

    withOrder.sort((a, b) => {
      if (a.serviceOrder !== b.serviceOrder) return a.serviceOrder - b.serviceOrder;
      const byDesc = a.descricao.localeCompare(b.descricao, 'pt-BR');
      if (byDesc !== 0) return byDesc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    withoutOrder.sort((a, b) => {
      const byDesc = a.descricao.localeCompare(b.descricao, 'pt-BR');
      if (byDesc !== 0) return byDesc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const orderedItems = [...withOrder, ...withoutOrder].map((s, idx) => {
      const effectiveOrder = typeof s.serviceOrder === 'number' ? s.serviceOrder : IMPLICIT_ORDER_BASE + idx;
      return { ...s, serviceOrder: effectiveOrder } as ObraService & { serviceOrder: number };
    });

    const orderCandidates = items
      .map((s) => (typeof s.pacoteOrder === 'number' ? s.pacoteOrder : Number.POSITIVE_INFINITY))
      .filter((n) => Number.isFinite(n));
    const pacoteOrder = orderCandidates.length > 0 ? Math.min(...orderCandidates) : Number.POSITIVE_INFINITY;
    return { pacote, items: orderedItems, pacoteOrder };
  });

  const implicitPackages = entries
    .filter((e) => !Number.isFinite(e.pacoteOrder))
    .map((e) => e.pacote)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const withDisplayOrder = entries.map((e) => {
    const implicitIdx = !Number.isFinite(e.pacoteOrder) ? implicitPackages.indexOf(e.pacote) : -1;
    const displayOrder = Number.isFinite(e.pacoteOrder) ? e.pacoteOrder : IMPLICIT_ORDER_BASE + Math.max(0, implicitIdx);
    return { ...e, displayOrder };
  });

  withDisplayOrder.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.pacote.localeCompare(b.pacote, 'pt-BR');
  });

  const out: ObraService[] = [];
  for (const g of withDisplayOrder) {
    for (const s of g.items) out.push(s);
  }
  return out;
}

const emptyBloco = (): ObraMedicaoBloco => ({
  colunas: [],
  linhas: [],
  descontoSinalPercent: 0,
  descontoFinalizacaoPercent: 0,
});

const emptyPrestadoresMedicoes = (): ObraMedicaoPrestadorSheet[] =>
  Array.from({ length: OBRA_MEDICAO_PRESTADOR_SLOTS }, () => ({
    nomePrestador: '',
    bloco: emptyBloco(),
  }));

const newColumnId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `col_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emptyCelula = (): MedicaoCelula => ({
  percentualExecutado: 0,
  abatimentoValor: 0,
});

const clampPct = (p: number) => Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));

/** Abatimento (R$) = valor fechado × (% ÷ 100). Ex.: 10% de R$ 6.000 = R$ 600. */
function abatimentoPercentDoValorFechado(valorFechado: number, percentual: number): number {
  const v = Number.isFinite(valorFechado) ? valorFechado : 0;
  const p = clampPct(percentual);
  const raw = (v * p) / 100;
  return Math.round(raw * 100) / 100;
}

function recalcCelula(valorFechado: number, cel: MedicaoCelula): MedicaoCelula {
  const pMed = clampPct(cel.percentualExecutado);
  const abatimentoValor = abatimentoPercentDoValorFechado(valorFechado, pMed);
  return {
    percentualExecutado: pMed,
    abatimentoValor,
  };
}

function recalcAbatimentosBloco(bloco: ObraMedicaoBloco): ObraMedicaoBloco {
  return {
    ...bloco,
    linhas: bloco.linhas.map((l) => {
      const vf = Number.isFinite(l.valorFechado) ? l.valorFechado : 0;
      const celulas: Record<string, MedicaoCelula> = {};
      for (const c of bloco.colunas) {
        celulas[c.id] = recalcCelula(vf, l.celulas[c.id] ?? emptyCelula());
      }
      return { ...l, celulas };
    }),
  };
}

const repairBloco = (bloco: ObraMedicaoBloco): ObraMedicaoBloco => {
  const colIds = new Set(bloco.colunas.map((c) => c.id));
  const linhas = bloco.linhas.map((linha) => {
    const celulas = { ...linha.celulas };
    for (const c of bloco.colunas) {
      if (!celulas[c.id]) celulas[c.id] = emptyCelula();
    }
    for (const key of Object.keys(celulas)) {
      if (!colIds.has(key)) delete celulas[key];
    }
    return { ...linha, celulas };
  });
  return recalcAbatimentosBloco({ ...bloco, linhas });
};

function orderLinhasPorServicos(bloco: ObraMedicaoBloco, sorted: ObraService[]): ObraMedicaoBloco {
  const byId = new Map(bloco.linhas.filter((l) => l.serviceId).map((l) => [l.serviceId as string, l]));
  const out: typeof bloco.linhas = [];
  const seen = new Set<string>();
  for (const s of sorted) {
    const got = byId.get(s.id);
    if (got) {
      out.push({
        ...got,
        pacote: s.pacote,
        descricao: s.descricao,
      });
      seen.add(got.id);
    }
  }
  for (const l of bloco.linhas) {
    if (!seen.has(l.id)) out.push(l);
  }
  return { ...bloco, linhas: out };
}

function normalizeBlocoFromApi(bloco: ObraMedicaoBloco, sorted: ObraService[]): ObraMedicaoBloco {
  return repairBloco(orderLinhasPorServicos(bloco, sorted));
}

const syncLinhasComServicos = (bloco: ObraMedicaoBloco, services: ObraService[]): ObraMedicaoBloco => {
  const repaired = repairBloco(bloco);
  const sorted = sortObraServicesForMedicao(services);
  const byServiceId = new Map(repaired.linhas.filter((l) => l.serviceId).map((l) => [l.serviceId as string, l]));

  const nextLinhas = sorted.map((s) => {
    const existing = byServiceId.get(s.id);
    const celulas: Record<string, MedicaoCelula> = {};
    for (const c of repaired.colunas) {
      celulas[c.id] = existing?.celulas[c.id] ?? emptyCelula();
    }
    const valorFechado =
      existing && Number.isFinite(existing.valorFechado) ? existing.valorFechado : s.verba || 0;
    return {
      id: s.id,
      serviceId: s.id,
      pacote: s.pacote,
      descricao: s.descricao,
      valorFechado,
      celulas,
    };
  });

  return repairBloco({ ...repaired, linhas: nextLinhas });
};

type MedicaoTab = 'cliente' | number;

type FlatRow =
  | { kind: 'pacote'; pacote: string; subtotalFechado: number }
  | { kind: 'linha'; linha: MedicaoLinha; pacoteGrupo: string };

function buildFlatRows(sorted: ObraService[], bloco: ObraMedicaoBloco): FlatRow[] {
  const byId = new Map(bloco.linhas.map((l) => [l.serviceId || l.id, l]));
  const rows: FlatRow[] = [];
  let prevPacote: string | null = null;

  for (const s of sorted) {
    const linha = byId.get(s.id);
    if (!linha) continue;
    const p = (s.pacote || '').trim() || 'Sem pacote';
    if (p !== prevPacote) {
      const subtotal = sorted
        .filter((x) => ((x.pacote || '').trim() || 'Sem pacote') === p)
        .reduce((acc, x) => {
          const l = byId.get(x.id);
          return acc + (l && Number.isFinite(l.valorFechado) ? l.valorFechado : 0);
        }, 0);
      rows.push({ kind: 'pacote', pacote: p, subtotalFechado: subtotal });
      prevPacote = p;
    }
    rows.push({ kind: 'linha', linha, pacoteGrupo: p });
  }

  const shown = new Set(
    rows.filter((r): r is Extract<FlatRow, { kind: 'linha' }> => r.kind === 'linha').map((r) => r.linha.id)
  );
  const orphans = bloco.linhas.filter((l) => !shown.has(l.id));
  if (orphans.length > 0) {
    const sub = orphans.reduce((acc, l) => acc + (Number.isFinite(l.valorFechado) ? l.valorFechado : 0), 0);
    rows.push({ kind: 'pacote', pacote: 'Demais linhas', subtotalFechado: sub });
    for (const l of orphans) {
      rows.push({ kind: 'linha', linha: l, pacoteGrupo: 'Demais linhas' });
    }
  }

  return rows;
}

export default function ObraMedicaoPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;

  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [services, setServices] = useState<ObraService[]>([]);
  const [clienteObra, setClienteObra] = useState<ObraMedicaoBloco>(emptyBloco());
  const [prestadoresMedicoes, setPrestadoresMedicoes] = useState<ObraMedicaoPrestadorSheet[]>(() =>
    emptyPrestadoresMedicoes()
  );
  const [activeTab, setActiveTab] = useState<MedicaoTab>('cliente');
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const run = async () => {
      try {
        setCanManage(await canManageObraData());
      } catch {
        setCanManage(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    if (!canManage && typeof activeTab === 'number') {
      setActiveTab('cliente');
    }
  }, [canManage, activeTab]);

  const load = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    setError('');
    try {
      const [svc, med] = await Promise.all([getObraServices(obraId), getObraMedicao(obraId)]);
      setServices(svc);
      const sorted = sortObraServicesForMedicao(svc);
      if (med) {
        setClienteObra(normalizeBlocoFromApi(med.clienteObra, sorted));
        setPrestadoresMedicoes(
          med.prestadoresMedicoes.map((s) => ({
            nomePrestador: s.nomePrestador,
            bloco: normalizeBlocoFromApi(s.bloco, sorted),
          }))
        );
      } else {
        setClienteObra(emptyBloco());
        setPrestadoresMedicoes(emptyPrestadoresMedicoes());
      }
    } catch (e) {
      console.error(e);
      setError('Não foi possível carregar a medição.');
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    void load();
  }, [load]);

  const blocoAtual = activeTab === 'cliente' ? clienteObra : prestadoresMedicoes[activeTab as number].bloco;

  const setBlocoAtual = (updater: SetStateAction<ObraMedicaoBloco>) => {
    if (activeTab === 'cliente') {
      setClienteObra(updater);
      return;
    }
    const idx = activeTab as number;
    setPrestadoresMedicoes((prev) =>
      prev.map((s, i) => {
        if (i !== idx) return s;
        const next =
          typeof updater === 'function'
            ? (updater as (b: ObraMedicaoBloco) => ObraMedicaoBloco)(s.bloco)
            : updater;
        return { ...s, bloco: next };
      })
    );
  };

  const handleNomePrestador = (idx: number, nomePrestador: string) => {
    if (!canManage) return;
    setPrestadoresMedicoes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, nomePrestador } : s))
    );
  };

  const sortedServices = useMemo(() => sortObraServicesForMedicao(services), [services]);

  const flatRows = useMemo(() => buildFlatRows(sortedServices, blocoAtual), [sortedServices, blocoAtual]);

  useEffect(() => {
    const keys = flatRows.filter((r) => r.kind === 'pacote').map((r) => r.pacote);
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
  }, [flatRows]);

  const togglePackage = (pacote: string) => {
    setExpandedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pacote)) next.delete(pacote);
      else next.add(pacote);
      return next;
    });
  };

  const totais = useMemo(() => {
    const b = blocoAtual;
    const totalContrato = b.linhas.reduce((s, l) => s + (Number.isFinite(l.valorFechado) ? l.valorFechado : 0), 0);
    const abatimentoPorColuna = new Map<string, number>();
    let totalAbatimentos = 0;
    for (const linha of b.linhas) {
      for (const col of b.colunas) {
        const cel = linha.celulas[col.id] ?? emptyCelula();
        const v = Number.isFinite(cel.abatimentoValor) ? cel.abatimentoValor : 0;
        totalAbatimentos += v;
        abatimentoPorColuna.set(col.id, (abatimentoPorColuna.get(col.id) ?? 0) + v);
      }
    }

    const pS = clampPct(b.descontoSinalPercent);
    const pF = clampPct(b.descontoFinalizacaoPercent);

    const descontoSinalReaisPorColuna = new Map<string, number>();
    const descontoFinalizacaoReaisPorColuna = new Map<string, number>();
    const valorRealPorColuna = new Map<string, number>();
    let somaValorRealPago = 0;
    for (const col of b.colunas) {
      const Ti = abatimentoPorColuna.get(col.id) ?? 0;
      const sinalR = Math.round(((Ti * pS) / 100) * 100) / 100;
      const finalR = Math.round(((Ti * pF) / 100) * 100) / 100;
      descontoSinalReaisPorColuna.set(col.id, sinalR);
      descontoFinalizacaoReaisPorColuna.set(col.id, finalR);
      const vr = Math.max(0, Math.round((Ti - sinalR - finalR) * 100) / 100);
      valorRealPorColuna.set(col.id, vr);
      somaValorRealPago += vr;
    }
    somaValorRealPago = Math.round(somaValorRealPago * 100) / 100;

    const liquido = totalContrato - totalAbatimentos;
    return {
      totalContrato,
      totalAbatimentos,
      abatimentoPorColuna,
      liquido,
      descontoSinalPercent: pS,
      descontoFinalizacaoPercent: pF,
      descontoSinalReaisPorColuna,
      descontoFinalizacaoReaisPorColuna,
      valorRealPorColuna,
      somaValorRealPago,
    };
  }, [blocoAtual]);

  const colCount = 2 + blocoAtual.colunas.length + 1;

  const handleAddColuna = () => {
    if (!canManage) return;
    const id = newColumnId();
    const titulo = `Medição ${blocoAtual.colunas.length + 1}`;
    setBlocoAtual((prev) => {
      const colunas = [...prev.colunas, { id, titulo }];
      const linhas = prev.linhas.map((l) => ({
        ...l,
        celulas: { ...l.celulas, [id]: emptyCelula() },
      }));
      return repairBloco({ ...prev, colunas, linhas });
    });
  };

  const handleRemoveColuna = (colId: string) => {
    if (!canManage) return;
    const ok = window.confirm('Remover esta coluna de medição? Os valores digitados nela serão perdidos.');
    if (!ok) return;
    setBlocoAtual((prev) => {
      const colunas = prev.colunas.filter((c) => c.id !== colId);
      const linhas = prev.linhas.map((l) => {
        const celulas = { ...l.celulas };
        delete celulas[colId];
        return { ...l, celulas };
      });
      return repairBloco({ ...prev, colunas, linhas });
    });
  };

  const handleTituloColuna = (colId: string, titulo: string) => {
    if (!canManage) return;
    setBlocoAtual((prev) => ({
      ...prev,
      colunas: prev.colunas.map((c) => (c.id === colId ? { ...c, titulo } : c)),
    }));
  };

  const handleDescontoResumo = (campo: 'descontoSinalPercent' | 'descontoFinalizacaoPercent', valor: number) => {
    if (!canManage) return;
    setBlocoAtual((prev) => ({ ...prev, [campo]: clampPct(valor) }));
  };

  const handleSyncServicos = () => {
    if (!canManage || !obraId) return;
    if (services.length === 0) {
      setError('Cadastre serviços na obra antes de sincronizar.');
      return;
    }
    setBlocoAtual((prev) => syncLinhasComServicos(prev, services));
    setSuccess('Linhas alinhadas aos serviços cadastrados (mesma ordem e pacotes da página Serviços).');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleValorFechado = (linhaId: string, valor: number) => {
    if (!canManage) return;
    setBlocoAtual((prev) => {
      const linhas = prev.linhas.map((l) => {
        if (l.id !== linhaId) return l;
        const valorFechado = Math.max(0, Number.isFinite(valor) ? valor : 0);
        const celulas: Record<string, MedicaoCelula> = { ...l.celulas };
        for (const c of prev.colunas) {
          const old = celulas[c.id] ?? emptyCelula();
          celulas[c.id] = recalcCelula(valorFechado, old);
        }
        return { ...l, valorFechado, celulas };
      });
      return repairBloco({ ...prev, linhas });
    });
  };

  const handlePercentualCelula = (linhaId: string, colId: string, percentual: number) => {
    if (!canManage) return;
    setBlocoAtual((prev) => ({
      ...prev,
      linhas: prev.linhas.map((l) => {
        if (l.id !== linhaId) return l;
        const vf = Number.isFinite(l.valorFechado) ? l.valorFechado : 0;
        const prevCel = l.celulas[colId] ?? emptyCelula();
        const nextCel = recalcCelula(vf, { ...prevCel, percentualExecutado: percentual });
        return {
          ...l,
          celulas: { ...l.celulas, [colId]: nextCel },
        };
      }),
    }));
  };

  const handleSave = async () => {
    if (!obraId || !canManage) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const sorted = sortObraServicesForMedicao(services);
      const cliente = normalizeBlocoFromApi(clienteObra, sorted);
      const prestadoresPayload = prestadoresMedicoes.map((s) => ({
        nomePrestador: s.nomePrestador.trim(),
        bloco: normalizeBlocoFromApi(s.bloco, sorted),
      }));
      await upsertObraMedicao(obraId, { clienteObra: cliente, prestadoresMedicoes: prestadoresPayload });
      setClienteObra(cliente);
      setPrestadoresMedicoes(prestadoresPayload);
      setSuccess('Medição salva com sucesso.');
    } catch (e) {
      console.error(e);
      setError('Não foi possível salvar a medição.');
    } finally {
      setSaving(false);
    }
  };

  if (!obraId || !obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
        <div className="mt-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  const readOnly = !canManage;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
              <Scale className="text-violet-700" size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Medição</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              {obra.nome} — Descontos de sinal e de finalização são informados <strong>uma vez</strong> no resumo
              financeiro (em <strong>%</strong>) e o valor em R$ de cada desconto é calculado sobre o total abatido de
              cada coluna no rodapé da tabela.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
            {canManage && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || loading}
                className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                Salvar
              </button>
            )}
          </div>
        </div>

        {readOnly && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            Visualização da medição <strong>cliente × obra</strong>. Apenas colaboradores editam e visualizam a medição
            com prestadores de serviço.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {canManage && (
          <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('cliente')}
              className={[
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors shrink-0',
                activeTab === 'cliente'
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900',
              ].join(' ')}
            >
              Cliente × obra
            </button>
            {Array.from({ length: OBRA_MEDICAO_PRESTADOR_SLOTS }, (_, i) => {
              const nome = (prestadoresMedicoes[i]?.nomePrestador ?? '').trim();
              const tabLabel = nome ? `Obra × ${nome}` : `Obra × Prestador ${i + 1}`;
              return (
                <button
                  key={`prest-${i}`}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={[
                    'border-b-2 px-3 py-2 text-sm font-medium transition-colors shrink-0 max-w-[14rem] truncate',
                    activeTab === i
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900',
                  ].join(' ')}
                  title={tabLabel}
                >
                  {tabLabel}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-gray-500">Carregando medição...</div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={handleAddColuna}
                    className="inline-flex items-center rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
                  >
                    <Plus size={18} className="mr-2" />
                    Adicionar coluna de medição
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncServicos}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw size={18} className="mr-2" />
                    Sincronizar linhas com serviços
                  </button>
                </>
              )}
              <span className="text-sm text-gray-500">
                {services.length} serviço(s) cadastrado(s) na obra
                {blocoAtual.linhas.length > 0 ? ` • ${blocoAtual.linhas.length} linha(s) nesta visão` : ''}
              </span>
            </div>

            {typeof activeTab === 'number' && canManage && (
              <div className="mb-4 max-w-xl rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3">
                <label htmlFor={`nome-prestador-${activeTab}`} className="block text-sm font-medium text-gray-800">
                  Nome do prestador
                </label>
                <p className="mt-0.5 text-xs text-gray-500">
                  O título da aba fica <strong>Obra ×</strong> seguido deste nome (cada prestador tem a própria
                  planilha).
                </p>
                <input
                  id={`nome-prestador-${activeTab}`}
                  type="text"
                  value={prestadoresMedicoes[activeTab]?.nomePrestador ?? ''}
                  onChange={(e) => handleNomePrestador(activeTab, e.target.value)}
                  placeholder={`Ex.: Empresa ${activeTab + 1}`}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-xs font-semibold uppercase text-gray-600 min-w-[12rem]">
                      Serviço
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-600 whitespace-nowrap">
                      Valor fechado
                    </th>
                    {blocoAtual.colunas.map((col) => (
                      <th
                        key={col.id}
                        className="px-2 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-l border-gray-200 bg-gray-50 align-top"
                      >
                        <div className="flex flex-col items-stretch gap-2 min-w-[130px]">
                          <input
                            type="text"
                            value={col.titulo}
                            onChange={(e) => handleTituloColuna(col.id, e.target.value)}
                            disabled={readOnly}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-900 disabled:bg-gray-100"
                          />
                          <div className="grid grid-cols-2 gap-1 text-[10px] font-medium text-gray-500">
                            <span>Medição %</span>
                            <span>Abat. (R$)</span>
                          </div>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColuna(col.id)}
                              className="inline-flex items-center justify-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                            >
                              <Trash2 size={12} />
                              Remover
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-gray-600 whitespace-nowrap bg-gray-50 border-l border-gray-200">
                      Total medições (linha)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {flatRows.length === 0 ? (
                    <tr>
                      <td colSpan={colCount} className="px-4 py-10 text-center text-gray-500">
                        {canManage
                          ? 'Nenhuma linha ainda. Use “Sincronizar linhas com serviços” para puxar os itens da página de Serviços.'
                          : 'Nenhuma medição cadastrada para esta obra.'}
                      </td>
                    </tr>
                  ) : (
                    flatRows.map((row, idx) => {
                      if (row.kind === 'pacote') {
                        const isOpen = expandedPackages.has(row.pacote);
                        return (
                          <tr key={`pkg-${row.pacote}-${idx}`} className="bg-gray-100">
                            <td colSpan={colCount} className="px-0 py-0">
                              <button
                                type="button"
                                onClick={() => togglePackage(row.pacote)}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-bold text-gray-900 hover:bg-gray-200/60"
                              >
                                {isOpen ? (
                                  <ChevronDown size={18} className="shrink-0 text-gray-600" />
                                ) : (
                                  <ChevronRight size={18} className="shrink-0 text-gray-600" />
                                )}
                                <span className="min-w-0 truncate">{row.pacote}</span>
                                <span className="ml-auto shrink-0 text-xs font-semibold text-gray-600">
                                  Subtotal fechado {currencyFormatter.format(row.subtotalFechado)}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      if (!expandedPackages.has(row.pacoteGrupo)) return null;

                      const linha = row.linha;
                      const abatLinha = blocoAtual.colunas.reduce((acc, col) => {
                        const c = linha.celulas[col.id] ?? emptyCelula();
                        return acc + (Number.isFinite(c.abatimentoValor) ? c.abatimentoValor : 0);
                      }, 0);

                      return (
                        <tr key={linha.id} className="hover:bg-gray-50/80">
                          <td className="sticky left-0 z-[1] bg-white px-3 py-2 text-gray-800 max-w-[18rem] truncate">
                            {linha.descricao}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {readOnly ? (
                              <span className="text-gray-900">{currencyFormatter.format(linha.valorFechado || 0)}</span>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={Number.isFinite(linha.valorFechado) ? linha.valorFechado : 0}
                                onChange={(e) => handleValorFechado(linha.id, Number(e.target.value || 0))}
                                className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            )}
                          </td>
                          {blocoAtual.colunas.map((col) => {
                            const cel = linha.celulas[col.id] ?? emptyCelula();
                            return (
                              <td key={col.id} className="px-2 py-2 border-l border-gray-100 align-top">
                                <div className="grid grid-cols-2 gap-1 min-w-[110px]">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    disabled={readOnly}
                                    value={Number.isFinite(cel.percentualExecutado) ? cel.percentualExecutado : 0}
                                    onChange={(e) =>
                                      handlePercentualCelula(
                                        linha.id,
                                        col.id,
                                        Math.min(100, Math.max(0, Number(e.target.value || 0)))
                                      )
                                    }
                                    className="w-full rounded border border-gray-200 px-1 py-1 text-xs disabled:bg-gray-50"
                                  />
                                  <div className="flex items-center rounded border border-gray-100 bg-gray-50 px-1 py-1 text-xs text-gray-800 tabular-nums">
                                    {currencyFormatter.format(
                                      Number.isFinite(cel.abatimentoValor) ? cel.abatimentoValor : 0
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right text-gray-900 font-medium border-l border-gray-100 whitespace-nowrap">
                            {currencyFormatter.format(abatLinha)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {blocoAtual.linhas.length > 0 && (
                  <tfoot className="border-t-2 border-gray-200 text-sm">
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-[1] bg-gray-50 px-3 py-3 font-semibold text-gray-800"
                      >
                        Total abatido da coluna
                      </td>
                      {blocoAtual.colunas.map((col) => (
                        <td
                          key={col.id}
                          className="px-2 py-3 text-center font-medium text-gray-900 border-l border-gray-200"
                        >
                          {currencyFormatter.format(totais.abatimentoPorColuna.get(col.id) ?? 0)}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-right font-bold text-gray-900 border-l border-gray-200 whitespace-nowrap">
                        {currencyFormatter.format(totais.totalAbatimentos)}
                      </td>
                    </tr>
                    <tr className="bg-white text-xs">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-[1] bg-white px-3 py-2 font-medium text-gray-700 border-t border-gray-100"
                      >
                        Desconto do sinal ({totais.descontoSinalPercent.toFixed(2)}% s/ total abatido da coluna)
                      </td>
                      {blocoAtual.colunas.map((col) => (
                        <td
                          key={col.id}
                          className="px-2 py-2 text-center text-gray-800 border-l border-t border-gray-100 tabular-nums"
                        >
                          {currencyFormatter.format(totais.descontoSinalReaisPorColuna.get(col.id) ?? 0)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right text-gray-400 border-l border-t border-gray-100">—</td>
                    </tr>
                    <tr className="bg-white text-xs">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-[1] bg-white px-3 py-2 font-medium text-gray-700 border-t border-gray-100"
                      >
                        Desconto de finalização ({totais.descontoFinalizacaoPercent.toFixed(2)}% s/ total abatido da coluna)
                      </td>
                      {blocoAtual.colunas.map((col) => (
                        <td
                          key={col.id}
                          className="px-2 py-2 text-center text-gray-800 border-l border-t border-gray-100 tabular-nums"
                        >
                          {currencyFormatter.format(totais.descontoFinalizacaoReaisPorColuna.get(col.id) ?? 0)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right text-gray-400 border-l border-t border-gray-100">—</td>
                    </tr>
                    <tr className="bg-violet-50/80 text-xs font-semibold">
                      <td
                        colSpan={2}
                        className="sticky left-0 z-[1] bg-violet-50/80 px-3 py-2.5 text-violet-950 border-t border-violet-100"
                      >
                        Valor real a ser pago
                      </td>
                      {blocoAtual.colunas.map((col) => (
                        <td
                          key={col.id}
                          className="px-2 py-2.5 text-center text-violet-950 border-l border-t border-violet-100 tabular-nums"
                        >
                          {currencyFormatter.format(totais.valorRealPorColuna.get(col.id) ?? 0)}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right text-violet-950 border-l border-t border-violet-100 whitespace-nowrap tabular-nums">
                        {currencyFormatter.format(totais.somaValorRealPago)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Abatimento da célula = valor fechado × (medição % ÷ 100). Sinal e finalização são <strong>%</strong>{' '}
              informados no resumo; no rodapé, o R$ de cada desconto = total abatido da coluna × (% ÷ 100). Valor real =
              total abatido − esses dois valores em R$.
            </p>

            <div className="mt-6 rounded-lg border border-violet-100 bg-violet-50/60 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
                Resumo financeiro (esta visão)
              </h2>
              <p className="mt-2 text-xs text-violet-900/90">
                Informe os descontos em % uma vez aqui; no rodapé da tabela, cada coluna mostra o R$ correspondente
                sobre o total abatido daquela medição.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Desconto do sinal (% sobre o total abatido de cada coluna)
                  </label>
                  {readOnly ? (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900">
                      {clampPct(blocoAtual.descontoSinalPercent).toFixed(2)}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={
                          Number.isFinite(blocoAtual.descontoSinalPercent) ? blocoAtual.descontoSinalPercent : 0
                        }
                        onChange={(e) =>
                          handleDescontoResumo('descontoSinalPercent', Number(e.target.value || 0))
                        }
                        className="w-full max-w-[8rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                      <span className="text-xs text-gray-600">% (0 a 100)</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Desconto de finalização (% sobre o total abatido de cada coluna)
                  </label>
                  {readOnly ? (
                    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-900">
                      {clampPct(blocoAtual.descontoFinalizacaoPercent).toFixed(2)}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={
                          Number.isFinite(blocoAtual.descontoFinalizacaoPercent)
                            ? blocoAtual.descontoFinalizacaoPercent
                            : 0
                        }
                        onChange={(e) =>
                          handleDescontoResumo('descontoFinalizacaoPercent', Number(e.target.value || 0))
                        }
                        className="w-full max-w-[8rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                      <span className="text-xs text-gray-600">% (0 a 100)</span>
                    </div>
                  )}
                </div>
              </div>

              <dl className="mt-6 grid gap-2 text-sm text-gray-800 md:grid-cols-2">
                <div className="flex justify-between gap-3 border-b border-violet-100 pb-2">
                  <dt>Total contratado (soma dos valores fechados)</dt>
                  <dd className="font-semibold whitespace-nowrap">{currencyFormatter.format(totais.totalContrato)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-violet-100 pb-2">
                  <dt>Total abatido (soma das colunas de medição)</dt>
                  <dd className="font-semibold whitespace-nowrap">{currencyFormatter.format(totais.totalAbatimentos)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-violet-100 pb-2">
                  <dt>Soma valor real a pagar (por medição)</dt>
                  <dd className="font-semibold whitespace-nowrap">
                    {currencyFormatter.format(totais.somaValorRealPago)}
                  </dd>
                </div>
                <div className="md:col-span-2 flex justify-between gap-3 pt-1 text-base">
                  <dt className="font-bold text-gray-900">Valor líquido (contratado − abatimentos brutos)</dt>
                  <dd className="font-bold text-violet-900 whitespace-nowrap">{currencyFormatter.format(totais.liquido)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-gray-600">
                O valor líquido usa só os abatimentos das células. Os % de sinal e finalização reduzem o total abatido de
                cada coluna no rodapé (valor real a ser pago).
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
