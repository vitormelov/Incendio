import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Eye, List, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { getObraById } from '../config/setores';
import { canManageObraData } from '../services/auth';
import { deleteObraRDO, getObraRDOByDate, upsertObraRDO } from '../services/firestore';
import {
  ObraRDO,
  RDOAtividade,
  RDOAtividadeSituacao,
  RDOClimaOpcao,
  RDOCondicaoOpcao,
  RDOEfetivo,
  RDOEquipamento,
  Turno,
} from '../types';

const todayLocalISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const defaultTurnoMap = <T extends string>(options: readonly T[]) => {
  const blank = options.reduce((acc, opt) => {
    acc[opt] = false;
    return acc;
  }, {} as Record<T, boolean>);

  return {
    manha: { ...blank },
    tarde: { ...blank },
    noite: { ...blank },
  } as Record<Turno, Record<T, boolean>>;
};

const newDraft = (obraId: string, data: string): Omit<ObraRDO, 'id' | 'createdAt' | 'updatedAt'> => ({
  obraId,
  data,
  clima: defaultTurnoMap<RDOClimaOpcao>(['limpo', 'nublado', 'chuvoso'] as const),
  condicao: defaultTurnoMap<RDOCondicaoOpcao>(['produtivo', 'improdutivo'] as const),
  atividades: [],
  efetivo: [],
  equipamentos: [],
  observacoes: '',
});

const turnos: { key: Turno; label: string }[] = [
  { key: 'manha', label: 'Manhã' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noite', label: 'Noite' },
];

const climaOptions: { key: RDOClimaOpcao; label: string }[] = [
  { key: 'limpo', label: 'Limpo' },
  { key: 'nublado', label: 'Nublado' },
  { key: 'chuvoso', label: 'Chuvoso' },
];

const condicaoOptions: { key: RDOCondicaoOpcao; label: string }[] = [
  { key: 'produtivo', label: 'Produtivo' },
  { key: 'improdutivo', label: 'Improdutivo' },
];

const situacaoOptions: { key: RDOAtividadeSituacao; label: string }[] = [
  { key: 'iniciada', label: 'Iniciada' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'finalizada', label: 'Finalizada' },
];

export default function ObraRDOPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const obra = obraId ? getObraById(obraId) : undefined;
  const [canManage, setCanManage] = useState(false);

  const [date, setDate] = useState<string>(() => {
    if (typeof window === 'undefined') return todayLocalISO();
    const params = new URLSearchParams(window.location.search);
    const d = params.get('data');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return todayLocalISO();
  });
  const [draft, setDraft] = useState<Omit<ObraRDO, 'id' | 'createdAt' | 'updatedAt'>>(
    () => newDraft(obraId || '', todayLocalISO())
  );
  const [existingId, setExistingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadByDate = async (targetDate: string) => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const rdo = await getObraRDOByDate(obraId, targetDate);
      if (!rdo) {
        setExistingId(null);
        setDraft(newDraft(obraId, targetDate));
      } else {
        setExistingId(rdo.id);
        setDraft({
          obraId: rdo.obraId,
          data: rdo.data,
          clima: rdo.clima,
          condicao: rdo.condicao,
          atividades: rdo.atividades,
          efetivo: rdo.efetivo,
          equipamentos: rdo.equipamentos,
          observacoes: rdo.observacoes,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar RDO:', err);
      setError('Não foi possível carregar o RDO para esta data.');
    } finally {
      setLoading(false);
    }
  };

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
    if (!obraId) return;
    const d = searchParams.get('data');
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setDate(d);
      const next = new URLSearchParams(searchParams);
      next.delete('data');
      setSearchParams(next, { replace: true });
    }
  }, [obraId, searchParams, setSearchParams]);

  useEffect(() => {
    if (!obraId) return;
    void loadByDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, date]);

  const modoUrl = searchParams.get('modo');
  const isReadOnly = useMemo(() => {
    if (!canManage) return true;
    return modoUrl === 'visualizar';
  }, [canManage, modoUrl]);

  const toggleExclusive = useMemo(() => {
    return <T extends string>(
      group: 'clima' | 'condicao',
      turno: Turno,
      opt: T
    ) => {
      setDraft((prev) => {
        const current = prev[group][turno] as Record<T, boolean>;
        const isChecked = !!current[opt];

        const nextTurno = Object.keys(current).reduce((acc, key) => {
          acc[key as T] = false;
          return acc;
        }, {} as Record<T, boolean>);

        nextTurno[opt] = !isChecked;

        return {
          ...prev,
          [group]: {
            ...prev[group],
            [turno]: nextTurno,
          },
        };
      });
    };
  }, []);

  const addAtividade = () => {
    const item: RDOAtividade = { atividade: '', local: '', situacao: 'iniciada' };
    setDraft((prev) => ({ ...prev, atividades: [...prev.atividades, item] }));
  };
  const updateAtividade = (idx: number, patch: Partial<RDOAtividade>) => {
    setDraft((prev) => ({
      ...prev,
      atividades: prev.atividades.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    }));
  };
  const removeAtividade = (idx: number) => {
    setDraft((prev) => ({ ...prev, atividades: prev.atividades.filter((_, i) => i !== idx) }));
  };

  const addEfetivo = () => {
    const item: RDOEfetivo = { funcao: '', empreiteiro: '', quantidade: 0 };
    setDraft((prev) => ({ ...prev, efetivo: [...prev.efetivo, item] }));
  };
  const updateEfetivo = (idx: number, patch: Partial<RDOEfetivo>) => {
    setDraft((prev) => ({
      ...prev,
      efetivo: prev.efetivo.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  };
  const removeEfetivo = (idx: number) => {
    setDraft((prev) => ({ ...prev, efetivo: prev.efetivo.filter((_, i) => i !== idx) }));
  };

  const addEquipamento = () => {
    const item: RDOEquipamento = { nome: '', proprietario: '', status: 'ativo', quantidade: 0 };
    setDraft((prev) => ({ ...prev, equipamentos: [...prev.equipamentos, item] }));
  };
  const updateEquipamento = (idx: number, patch: Partial<RDOEquipamento>) => {
    setDraft((prev) => ({
      ...prev,
      equipamentos: prev.equipamentos.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  };
  const removeEquipamento = (idx: number) => {
    setDraft((prev) => ({ ...prev, equipamentos: prev.equipamentos.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    for (const [i, a] of draft.atividades.entries()) {
      if (!a.atividade.trim()) return `Atividade #${i + 1}: informe a atividade.`;
      if (!a.local.trim()) return `Atividade #${i + 1}: informe o local.`;
    }
    for (const [i, e] of draft.efetivo.entries()) {
      if (!e.funcao.trim()) return `Efetivo #${i + 1}: informe a função.`;
      if (!e.empreiteiro.trim()) return `Efetivo #${i + 1}: informe o empreiteiro.`;
      if (!Number.isFinite(e.quantidade) || e.quantidade < 0) return `Efetivo #${i + 1}: quantidade inválida.`;
    }
    for (const [i, e] of draft.equipamentos.entries()) {
      if (!e.nome.trim()) return `Equipamento #${i + 1}: informe o nome.`;
      if (!e.proprietario.trim()) return `Equipamento #${i + 1}: informe o proprietário.`;
      if (!Number.isFinite(e.quantidade) || e.quantidade < 0) return `Equipamento #${i + 1}: quantidade inválida.`;
    }
    return null;
  };

  const handleSave = async () => {
    if (!obraId) return;
    if (isReadOnly) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const id = await upsertObraRDO(obraId, date, {
        clima: draft.clima,
        condicao: draft.condicao,
        atividades: draft.atividades,
        efetivo: draft.efetivo,
        equipamentos: draft.equipamentos,
        observacoes: draft.observacoes,
      });
      setExistingId(id);
      setSuccess('RDO salvo com sucesso.');
    } catch (err) {
      console.error('Erro ao salvar RDO:', err);
      setError('Não foi possível salvar o RDO.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!obraId) return;
    if (isReadOnly) return;
    if (!existingId) return;
    const confirmed = window.confirm(`Tem certeza que deseja excluir o RDO do dia ${date}? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      await deleteObraRDO(obraId, date);
      setExistingId(null);
      setDraft(newDraft(obraId, date));
      setSuccess('RDO excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir RDO:', err);
      setError('Não foi possível excluir o RDO.');
    } finally {
      setDeleting(false);
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-full">
                <ClipboardList className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RDO (Relatório Diário de Obra)</h1>
            <p className="text-gray-600">
              {obra.nome} • {isReadOnly ? 'Visualização dos dados registrados.' : 'Registre o que foi feito em cada dia.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManage && isReadOnly && (
              <Link
                to={`/obra/${obraId}/rdo?data=${encodeURIComponent(date)}&modo=editar`}
                className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
              >
                <Pencil size={18} className="mr-2" />
                Editar
              </Link>
            )}
            <Link
              to={`/obra/${obraId}/rdo/lista`}
              className="inline-flex items-center px-4 py-2 border border-violet-300 rounded-md text-sm font-medium text-violet-800 bg-violet-50 hover:bg-violet-100"
            >
              <List size={18} className="mr-2" />
              Lista
            </Link>
            <Link
              to={`/obra/${obraId}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </Link>
          </div>
        </div>

        {!canManage && (
          <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800">
            Você pode apenas visualizar os RDOs. Colaboradores autorizados podem editar e excluir.
          </div>
        )}

        {canManage && isReadOnly && (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800">
            <span className="inline-flex items-center gap-2 font-medium text-slate-900">
              <Eye size={18} className="shrink-0" />
              Modo visualização
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Os dados exibidos não podem ser alterados nesta tela. Use o botão <strong>Editar</strong> acima para passar ao modo de edição.
            </span>
          </div>
        )}

        {error && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        <div className={`mb-8 grid gap-4 ${isReadOnly ? '' : 'md:grid-cols-3'}`}>
          <div className={isReadOnly ? '' : 'md:col-span-2'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data do RDO</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isReadOnly || loading || saving || deleting}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setDate(todayLocalISO())}
                  disabled={loading || saving || deleting}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hoje
                </button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">{existingId ? 'RDO existente' : 'RDO ainda não salvo para esta data'}</div>
          </div>

          {!isReadOnly && (
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ações</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canManage || loading || saving || deleting}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  title={canManage ? 'Salvar' : 'Sem permissão'}
                >
                  <Save size={18} className="mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={!canManage || !existingId || loading || saving || deleting}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  title={!existingId ? 'Nada para excluir' : canManage ? 'Excluir' : 'Sem permissão'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Carregando RDO...</div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">1) Clima</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                      {climaOptions.map((o) => (
                        <th key={o.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {o.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {turnos.map((t) => (
                      <tr key={t.key}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{t.label}</td>
                        {climaOptions.map((o) => (
                          <td key={o.key} className="px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={!!draft.clima[t.key]?.[o.key]}
                                onChange={() => toggleExclusive('clima', t.key, o.key)}
                                disabled={isReadOnly || saving || deleting}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="md:hidden">{o.label}</span>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-gray-500">Obs.: apesar de ser checkbox, o sistema marca no máximo 1 opção por turno.</div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">2) Condição</h2>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th>
                      {condicaoOptions.map((o) => (
                        <th key={o.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {o.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {turnos.map((t) => (
                      <tr key={t.key}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{t.label}</td>
                        {condicaoOptions.map((o) => (
                          <td key={o.key} className="px-4 py-3">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={!!draft.condicao[t.key]?.[o.key]}
                                onChange={() => toggleExclusive('condicao', t.key, o.key)}
                                disabled={isReadOnly || saving || deleting}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="md:hidden">{o.label}</span>
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">3) Atividades</h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addAtividade}
                    disabled={saving || deleting}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar
                  </button>
                )}
              </div>

              {draft.atividades.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  Nenhuma atividade registrada.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atividade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situação</th>
                        {!isReadOnly && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {draft.atividades.map((a, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={a.atividade}
                              onChange={(e) => updateAtividade(idx, { atividade: e.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={a.local}
                              onChange={(e) => updateAtividade(idx, { local: e.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={a.situacao}
                              onChange={(e) => updateAtividade(idx, { situacao: e.target.value as RDOAtividadeSituacao })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            >
                              {situacaoOptions.map((o) => (
                                <option key={o.key} value={o.key}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeAtividade(idx)}
                                  disabled={saving || deleting}
                                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Remover
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">4) Efetivo</h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addEfetivo}
                    disabled={saving || deleting}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar
                  </button>
                )}
              </div>

              {draft.efetivo.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  Nenhum efetivo registrado.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empreiteiro</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                        {!isReadOnly && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {draft.efetivo.map((e, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={e.funcao}
                              onChange={(ev) => updateEfetivo(idx, { funcao: ev.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={e.empreiteiro}
                              onChange={(ev) => updateEfetivo(idx, { empreiteiro: ev.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={Number.isFinite(e.quantidade) ? e.quantidade : 0}
                              onChange={(ev) => updateEfetivo(idx, { quantidade: Number(ev.target.value || 0) })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeEfetivo(idx)}
                                  disabled={saving || deleting}
                                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Remover
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">5) Equipamentos</h2>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addEquipamento}
                    disabled={saving || deleting}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Plus size={16} className="mr-2" />
                    Adicionar
                  </button>
                )}
              </div>

              {draft.equipamentos.length === 0 ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
                  Nenhum equipamento registrado.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proprietário</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                        {!isReadOnly && (
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {draft.equipamentos.map((e, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={e.nome}
                              onChange={(ev) => updateEquipamento(idx, { nome: ev.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={e.proprietario}
                              onChange={(ev) => updateEquipamento(idx, { proprietario: ev.target.value })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={e.status}
                              onChange={(ev) => updateEquipamento(idx, { status: ev.target.value as 'ativo' | 'inativo' })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            >
                              <option value="ativo">Ativo</option>
                              <option value="inativo">Inativo</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={Number.isFinite(e.quantidade) ? e.quantidade : 0}
                              onChange={(ev) => updateEquipamento(idx, { quantidade: Number(ev.target.value || 0) })}
                              disabled={isReadOnly || saving || deleting}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeEquipamento(idx)}
                                  disabled={saving || deleting}
                                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  Remover
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">6) Observações</h2>
              <textarea
                value={draft.observacoes}
                onChange={(e) => setDraft((prev) => ({ ...prev, observacoes: e.target.value }))}
                disabled={isReadOnly || saving || deleting}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                placeholder="Escreva aqui qualquer informação adicional..."
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

