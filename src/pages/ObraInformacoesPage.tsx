import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { Info, Pencil, Save, X } from 'lucide-react';
import { getObraById } from '../config/setores';
import { canManageObraData } from '../services/auth';
import { defaultObraInformacoes, getObraInformacoes, upsertObraInformacoes } from '../services/firestore';
import type { ObraInformacoes, ObraStatus } from '../types';

const STATUS_OPTIONS: { value: ObraStatus; label: string }[] = [
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'parada', label: 'Parada' },
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'concluida', label: 'Concluída' },
];

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const parseCurrencyInput = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
};

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const formatDateBR = (iso: string) => {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

type FormState = Omit<ObraInformacoes, 'createdAt' | 'updatedAt'>;

export default function ObraInformacoesPage() {
  const { obraId } = useParams<{ obraId: string }>();
  const obra = obraId ? getObraById(obraId) : undefined;

  const [form, setForm] = useState<FormState | null>(null);
  const [updatedAt, setUpdatedAt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const formSnapshotRef = useRef<FormState | null>(null);

  const load = async () => {
    if (!obraId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getObraInformacoes(obraId);
      if (data) {
        setForm({
          obraId: data.obraId,
          endereco: data.endereco,
          status: data.status,
          dataInicio: data.dataInicio,
          dataPrevistaTermino: data.dataPrevistaTermino,
          orcamentoBase: data.orcamentoBase,
          orcamentoDinamico: data.orcamentoDinamico,
          etapaObra: data.etapaObra,
        });
        setUpdatedAt(data.updatedAt);
        setIsEditing(false);
      } else {
        setForm(defaultObraInformacoes(obraId));
        setUpdatedAt('');
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Erro ao carregar informações da obra:', err);
      setError('Não foi possível carregar as informações desta obra.');
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
      if (!obraId) {
        setCanManage(false);
        return;
      }
      try {
        setCanManage(await canManageObraData(obraId));
      } catch {
        setCanManage(false);
      }
    };
    void run();
  }, [obraId]);

  const handleSave = async () => {
    if (!obraId || !form || !canManage) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await upsertObraInformacoes(obraId, {
        endereco: form.endereco,
        status: form.status,
        dataInicio: form.dataInicio,
        dataPrevistaTermino: form.dataPrevistaTermino,
        orcamentoBase: form.orcamentoBase,
        orcamentoDinamico: form.orcamentoDinamico,
        etapaObra: form.etapaObra,
      });
      const saved = await getObraInformacoes(obraId);
      if (saved) {
        setUpdatedAt(saved.updatedAt);
      }
      setIsEditing(false);
      setSuccess('Informações salvas com sucesso.');
    } catch (err) {
      console.error('Erro ao salvar informações da obra:', err);
      setError('Não foi possível salvar as informações.');
    } finally {
      setSaving(false);
    }
  };

  if (!obraId || !obra) {
    return (
      <div className="p-8 text-center text-gray-500">Obra não encontrada.</div>
    );
  }

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-50';
  const readOnlyClass = `${inputClass} bg-gray-50 text-gray-900`;

  const hasSavedData = Boolean(updatedAt);
  const isFieldsEditable = canManage && (!hasSavedData || isEditing);

  const handleStartEditing = () => {
    if (!form) return;
    formSnapshotRef.current = { ...form };
    setIsEditing(true);
    setSuccess('');
    setError('');
  };

  const handleCancelEditing = () => {
    if (formSnapshotRef.current) {
      setForm(formSnapshotRef.current);
    }
    formSnapshotRef.current = null;
    setIsEditing(false);
    setSuccess('');
    setError('');
  };

  const statusLabel =
    STATUS_OPTIONS.find((op) => op.value === form?.status)?.label ?? '—';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <div className="flex items-start gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 shrink-0">
            <Info className="text-violet-700" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Informações da obra</h1>
            <p className="text-gray-600 mt-1">Dados gerais e status do empreendimento.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        {loading || !form ? (
          <div className="py-12 text-center text-gray-500">Carregando informações...</div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da obra</label>
              <input type="text" value={obra.nome} disabled className={`${inputClass} bg-gray-50 text-gray-700`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              {isFieldsEditable ? (
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm((p) => (p ? { ...p, endereco: e.target.value } : p))}
                  disabled={saving}
                  className={inputClass}
                  placeholder="Endereço da obra"
                />
              ) : (
                <p className={readOnlyClass}>{form.endereco || '—'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status da obra</label>
              {isFieldsEditable ? (
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => (p ? { ...p, status: e.target.value as ObraStatus } : p))
                  }
                  disabled={saving}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={readOnlyClass}>{statusLabel}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de início</label>
                {isFieldsEditable ? (
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm((p) => (p ? { ...p, dataInicio: e.target.value } : p))}
                    disabled={saving}
                    className={inputClass}
                  />
                ) : (
                  <p className={readOnlyClass}>{formatDateBR(form.dataInicio)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data prevista de término</label>
                {isFieldsEditable ? (
                  <input
                    type="date"
                    value={form.dataPrevistaTermino}
                    onChange={(e) =>
                      setForm((p) => (p ? { ...p, dataPrevistaTermino: e.target.value } : p))
                    }
                    disabled={saving}
                    className={inputClass}
                  />
                ) : (
                  <p className={readOnlyClass}>{formatDateBR(form.dataPrevistaTermino)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento base</label>
                {isFieldsEditable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrency(form.orcamentoBase)}
                    onChange={(e) =>
                      setForm((p) =>
                        p ? { ...p, orcamentoBase: parseCurrencyInput(e.target.value) } : p
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                    placeholder="R$ 0,00"
                  />
                ) : (
                  <p className={`${readOnlyClass} font-medium`}>{formatCurrency(form.orcamentoBase)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento dinâmico</label>
                {isFieldsEditable ? (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatCurrency(form.orcamentoDinamico)}
                    onChange={(e) =>
                      setForm((p) =>
                        p ? { ...p, orcamentoDinamico: parseCurrencyInput(e.target.value) } : p
                      )
                    }
                    disabled={saving}
                    className={inputClass}
                    placeholder="R$ 0,00"
                  />
                ) : (
                  <p className={`${readOnlyClass} font-medium`}>{formatCurrency(form.orcamentoDinamico)}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa da obra</label>
              {isFieldsEditable ? (
                <input
                  type="text"
                  value={form.etapaObra}
                  onChange={(e) => setForm((p) => (p ? { ...p, etapaObra: e.target.value } : p))}
                  disabled={saving}
                  className={inputClass}
                  placeholder="Ex.: Fundação, estrutura, acabamento..."
                />
              ) : (
                <p className={readOnlyClass}>{form.etapaObra || '—'}</p>
              )}
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p>
                <span className="font-medium text-gray-700">Data da última atualização:</span>{' '}
                {updatedAt ? formatDateTime(updatedAt) : 'Ainda não salvo'}
              </p>
              {form.dataInicio && (
                <p className="mt-1 text-xs text-gray-500">
                  Início previsto: {formatDateBR(form.dataInicio)}
                  {form.dataPrevistaTermino ? ` · Término previsto: ${formatDateBR(form.dataPrevistaTermino)}` : ''}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {canManage && hasSavedData && !isEditing && (
                <button
                  type="button"
                  onClick={handleStartEditing}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  title="Editar informações"
                >
                  <Pencil size={18} className="mr-2" />
                  Editar
                </button>
              )}

              {canManage && hasSavedData && isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={saving}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <X size={18} className="mr-2" />
                  Cancelar
                </button>
              )}

              {isFieldsEditable && (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  <Save size={18} className="mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              )}

              {!canManage && (
                <p className="text-sm text-gray-500">Você pode apenas visualizar estas informações.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
