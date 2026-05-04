import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, List, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { getObraById } from '../config/setores';
import { canManageObraData } from '../services/auth';
import { deleteObraRDO, getObraRDOs } from '../services/firestore';
import { ObraRDO } from '../types';

const formatDataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const formatDateTimeBR = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

export default function ObraRDOListPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;
  const [canManage, setCanManage] = useState(false);

  const [items, setItems] = useState<ObraRDO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      const list = await getObraRDOs(obraId);
      setItems(list);
    } catch (err) {
      console.error('Erro ao carregar RDOs:', err);
      setError('Não foi possível carregar a lista de RDOs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const data = (r.data || '').toLowerCase();
      const obs = (r.observacoes || '').toLowerCase();
      return data.includes(q) || obs.includes(q) || formatDataBR(r.data).includes(q);
    });
  }, [items, query]);

  const handleDelete = async (r: ObraRDO) => {
    if (!obraId) return;
    const confirmed = window.confirm(
      `Excluir o RDO do dia ${formatDataBR(r.data)}? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeletingId(r.id);
    setError('');
    setSuccess('');
    try {
      await deleteObraRDO(obraId, r.data);
      setSuccess('RDO excluído com sucesso.');
      await load();
    } catch (err) {
      console.error('Erro ao excluir RDO:', err);
      setError('Não foi possível excluir este RDO.');
    } finally {
      setDeletingId(null);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-600 rounded-full">
                <List className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de RDOs</h1>
            <p className="text-gray-600">{obra.nome} • {items.length} registro(s)</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManage && (
              <Link
                to={`/obra/${obraId}/rdo?modo=editar`}
                className="inline-flex items-center px-4 py-2 border border-indigo-200 rounded-md text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
              >
                <ClipboardList size={18} className="mr-2" />
                Preencher RDO
              </Link>
            )}
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || !!deletingId}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={18} className="mr-2" />
              Atualizar
            </button>
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Obra
            </Link>
          </div>
        </div>

        {!canManage && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode visualizar a lista e abrir cada RDO em modo leitura. Apenas colaboradores autorizados podem editar ou excluir.
          </div>
        )}

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            {loading ? 'Carregando...' : `${filtered.length} de ${items.length} exibido(s)`}
          </div>
          {canManage && (
            <Link
              to={`/obra/${obraId}/rdo?modo=editar`}
              className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 sm:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Novo RDO (escolher data)
            </Link>
          )}
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por data ou observações..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {loading && items.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Carregando RDOs...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            {items.length === 0 ? 'Nenhum RDO cadastrado ainda.' : 'Nenhum resultado para o filtro.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Resumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Atualizado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((r) => {
                  const nAt = r.atividades?.length ?? 0;
                  const nEf = r.efetivo?.length ?? 0;
                  const nEq = r.equipamentos?.length ?? 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{formatDataBR(r.data)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {nAt} atividade(s) • {nEf} efetivo • {nEq} equip.
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{formatDateTimeBR(r.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link
                            to={`/obra/${obraId}/rdo?data=${encodeURIComponent(r.data)}&modo=visualizar`}
                            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-800 hover:bg-slate-50"
                            title="Abrir (somente leitura)"
                            aria-label="Abrir RDO em modo visualização"
                          >
                            <Eye size={18} />
                          </Link>
                          {canManage && (
                            <Link
                              to={`/obra/${obraId}/rdo?data=${encodeURIComponent(r.data)}&modo=editar`}
                              className="inline-flex items-center justify-center rounded-md border border-indigo-300 bg-indigo-50 p-2 text-indigo-800 hover:bg-indigo-100"
                              title="Editar RDO"
                              aria-label="Editar RDO"
                            >
                              <Pencil size={18} />
                            </Link>
                          )}
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(r)}
                              disabled={deletingId === r.id}
                              className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white hover:bg-red-700 disabled:opacity-50"
                              title={deletingId === r.id ? 'Excluindo…' : 'Excluir RDO'}
                              aria-label={deletingId === r.id ? 'Excluindo' : 'Excluir RDO'}
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {canManage && (
          <p className="mt-6 text-xs text-gray-500">
            Para criar um RDO em uma data nova, use <strong>Preencher RDO</strong> ou <strong>Novo RDO</strong>, escolha a data e salve.
          </p>
        )}
      </div>
    </div>
  );
}
