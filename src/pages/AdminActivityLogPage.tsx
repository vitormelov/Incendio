import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { getSiteActivityLogs, purgeOldSiteActivityLogs } from '../services/activityLog';
import type { SiteActivityAcao, SiteActivityLog, SiteActivityModulo } from '../types';

const MODULO_LABEL: Record<SiteActivityModulo, string> = {
  incendios: 'Incêndios',
  administrativo: 'Administrativo',
  servicos: 'Serviços',
  notas: 'Notas',
  planejamento: 'Planejamento',
  rdo: 'RDO',
  medicao: 'Medição',
  informacoes: 'Informações',
  colaboradores: 'Colaboradores',
  acesso: 'Acesso',
};

const ACAO_LABEL: Record<SiteActivityAcao, string> = {
  criou: 'Criou',
  editou: 'Editou',
  excluiu: 'Excluiu',
  entrou: 'Entrou',
  saiu: 'Saiu',
};

const ACAO_CLASS: Record<SiteActivityAcao, string> = {
  criou: 'bg-green-100 text-green-800',
  editou: 'bg-blue-100 text-blue-800',
  excluiu: 'bg-red-100 text-red-800',
  entrou: 'bg-emerald-100 text-emerald-800',
  saiu: 'bg-slate-100 text-slate-700',
};

const ACAO_OPTIONS: SiteActivityAcao[] = ['criou', 'editou', 'excluiu', 'entrou', 'saiu'];

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const dayKey = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return format(date, 'yyyy-MM-dd');
};

const dayLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

const selectClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500';

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState<SiteActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acaoFilter, setAcaoFilter] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        await purgeOldSiteActivityLogs();
        const data = await getSiteActivityLogs();
        if (!cancelled) setLogs(data);
      } catch (err) {
        console.error('Erro ao carregar log:', err);
        if (!cancelled) setError('Não foi possível carregar o log de ações.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usuarios = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of logs) {
      const key = log.usuarioId || log.usuarioEmail || log.usuarioNome;
      if (!key || map.has(key)) continue;
      map.set(key, log.usuarioNome || log.usuarioEmail || 'Usuário');
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (acaoFilter && log.acao !== acaoFilter) return false;
      if (usuarioFilter) {
        const key = log.usuarioId || log.usuarioEmail || log.usuarioNome;
        if (key !== usuarioFilter) return false;
      }
      return true;
    });
  }, [logs, acaoFilter, usuarioFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SiteActivityLog[]>();
    for (const log of filtered) {
      const key = dayKey(log.createdAt);
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const hasFilters = Boolean(acaoFilter || usuarioFilter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full shrink-0">
              <ScrollText className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Log do site</h1>
              <p className="text-gray-600">Ações dos usuários nos últimos 7 dias. Registros mais antigos são apagados automaticamente.</p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shrink-0"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {!loading && logs.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Usuário</label>
                <select
                  value={usuarioFilter}
                  onChange={(e) => setUsuarioFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {usuarios.map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ação</label>
                <select
                  value={acaoFilter}
                  onChange={(e) => setAcaoFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Todas</option>
                  {ACAO_OPTIONS.map((acao) => (
                    <option key={acao} value={acao}>
                      {ACAO_LABEL[acao]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-500">
                {filtered.length} de {logs.length} registro(s)
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setAcaoFilter('');
                    setUsuarioFilter('');
                  }}
                  className="text-xs font-medium text-purple-700 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando log...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhuma ação registrada nos últimos 7 dias.</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum registro corresponde aos filtros.</div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([key, items]) => (
              <section key={key}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3 capitalize">
                  {dayLabel(items[0].createdAt)}
                </h2>
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {items.map((log) => (
                    <li key={log.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ACAO_CLASS[log.acao]}`}>
                          {ACAO_LABEL[log.acao]}
                        </span>
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 rounded-full px-2 py-0.5">
                          {MODULO_LABEL[log.modulo] ?? log.modulo}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-900">{log.descricao}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.usuarioNome}
                        {log.obraNome ? ` · ${log.obraNome}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
