import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, UserCog, X } from 'lucide-react';
import { ALL_OBRA_MODULO_IDS, OBRA_NAV_ITEMS } from '../config/obraModulos';
import type { ObraModuloId } from '../config/obraModulos';
import { obras } from '../config/setores';
import { Collaborator, UserPermission } from '../types';
import { deleteCollaborator, getCollaborators, updateCollaborator } from '../services/firestore';

const ALL_PERMISSIONS: { label: string; value: UserPermission }[] = [
  { label: 'Colaborador', value: 'colaborador' },
];

const allObraIds = () => obras.map((o) => o.id);

const effectiveSelectedObraIds = (c: Collaborator): string[] => {
  if (c.obraIdsPermitidos === null) {
    return c.permissions.includes('colaborador') ? allObraIds() : [];
  }
  return c.obraIdsPermitidos;
};

const effectiveSelectedModulos = (c: Collaborator): ObraModuloId[] => {
  if (c.obraModulosPermitidos === null) {
    return ALL_OBRA_MODULO_IDS;
  }
  return c.obraModulosPermitidos;
};

const toggleModuloAccess = (c: Collaborator, modulo: ObraModuloId, checked: boolean): Collaborator => {
  const current = new Set(effectiveSelectedModulos(c));
  if (checked) current.add(modulo);
  else current.delete(modulo);
  const next = ALL_OBRA_MODULO_IDS.filter((id) => current.has(id));
  const isFull = next.length === ALL_OBRA_MODULO_IDS.length;
  return { ...c, obraModulosPermitidos: isFull ? null : next };
};

const toggleObraAccess = (c: Collaborator, obraId: string, checked: boolean): Collaborator => {
  const current = new Set(effectiveSelectedObraIds(c));
  if (checked) current.add(obraId);
  else current.delete(obraId);
  const next = allObraIds().filter((id) => current.has(id));
  const every = allObraIds();
  const isFull = next.length === every.length && every.every((id) => next.includes(id));
  const useNullForAll = isFull && c.permissions.includes('colaborador');
  return { ...c, obraIdsPermitidos: useNullForAll ? null : next };
};

interface CollaboratorEditModalProps {
  collaborator: Collaborator;
  saving: boolean;
  deleting: boolean;
  onClose: () => void;
  onChange: (collaborator: Collaborator) => void;
  onSave: () => void;
  onDelete: () => void;
}

function CollaboratorEditModal({
  collaborator,
  saving,
  deleting,
  onClose,
  onChange,
  onSave,
  onDelete,
}: CollaboratorEditModalProps) {
  const disabled = saving || deleting;

  const handlePermissionChange = (permission: UserPermission, checked: boolean) => {
    const permissions = checked
      ? Array.from(new Set([...collaborator.permissions, permission]))
      : collaborator.permissions.filter((item) => item !== permission);

    let obraIdsPermitidos = collaborator.obraIdsPermitidos;
    let obraModulosPermitidos = collaborator.obraModulosPermitidos;
    if (!checked && permission === 'colaborador' && collaborator.obraIdsPermitidos === null) {
      obraIdsPermitidos = allObraIds();
    }
    if (!checked && permission === 'colaborador' && collaborator.obraModulosPermitidos === null) {
      obraModulosPermitidos = [...ALL_OBRA_MODULO_IDS];
    }

    onChange({
      ...collaborator,
      permissions,
      obraIdsPermitidos,
      obraModulosPermitidos,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {collaborator.nome || 'Colaborador'}
            </h2>
            <p className="text-sm text-gray-500 truncate">{collaborator.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={disabled}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input
              type="text"
              value={collaborator.nome}
              onChange={(e) => onChange({ ...collaborator, nome: e.target.value })}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="text"
              value={collaborator.email}
              disabled
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
            <div className="flex flex-wrap gap-3 rounded-md border border-gray-300 px-3 py-2">
              {ALL_PERMISSIONS.map((permission) => (
                <label key={permission.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={collaborator.permissions.includes(permission.value)}
                    onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  {permission.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Obras com acesso</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...collaborator,
                      obraIdsPermitidos: collaborator.permissions.includes('colaborador')
                        ? null
                        : allObraIds(),
                    })
                  }
                  disabled={disabled}
                  className="text-xs font-medium text-purple-700 hover:underline disabled:opacity-50"
                >
                  Marcar todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...collaborator, obraIdsPermitidos: [] })}
                  disabled={disabled}
                  className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
                >
                  Desmarcar todas
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Obras marcadas: acesso à obra (visualização). Com <strong>Colaborador</strong>, também edição nessas
              obras.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3">
              {obras.map((obra) => (
                <label
                  key={obra.id}
                  className="inline-flex min-w-[10rem] cursor-pointer items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={effectiveSelectedObraIds(collaborator).includes(obra.id)}
                    onChange={(e) =>
                      onChange(toggleObraAccess(collaborator, obra.id, e.target.checked))
                    }
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="truncate" title={obra.nome}>
                    {obra.nome}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Opções da obra (menu)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...collaborator, obraModulosPermitidos: null })}
                  disabled={disabled}
                  className="text-xs font-medium text-purple-700 hover:underline disabled:opacity-50"
                >
                  Marcar todas
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...collaborator, obraModulosPermitidos: [] })}
                  disabled={disabled}
                  className="text-xs font-medium text-gray-600 hover:underline disabled:opacity-50"
                >
                  Desmarcar todas
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Defina quais seções aparecem no menu lateral para este usuário.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-gray-200 bg-gray-50/80 px-3 py-3">
              {OBRA_NAV_ITEMS.map((item) => (
                <label
                  key={item.modulo}
                  className="inline-flex min-w-[9rem] cursor-pointer items-center gap-2 text-sm text-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={effectiveSelectedModulos(collaborator).includes(item.modulo)}
                    onChange={(e) =>
                      onChange(toggleModuloAccess(collaborator, item.modulo, e.target.checked))
                    }
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 disabled:opacity-60"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-4">
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} className="mr-2" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={disabled}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={disabled}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCollaborators = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCollaborators();
      setCollaborators(data);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
      setError('Não foi possível carregar os colaboradores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCollaborators();
  }, []);

  const openEditor = (collaborator: Collaborator) => {
    setError('');
    setSuccess('');
    setEditingCollaborator({ ...collaborator });
  };

  const closeEditor = () => {
    if (saving || deleting) return;
    setEditingCollaborator(null);
  };

  const handleSaveCollaborator = async () => {
    if (!editingCollaborator) return;
    if (!editingCollaborator.nome.trim()) {
      setError('O nome do colaborador é obrigatório.');
      setSuccess('');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateCollaborator(editingCollaborator.id, {
        nome: editingCollaborator.nome.trim(),
        permissions: editingCollaborator.permissions,
        obraIdsPermitidos: editingCollaborator.obraIdsPermitidos,
        obraModulosPermitidos: editingCollaborator.obraModulosPermitidos,
      });

      setCollaborators((current) =>
        current.map((c) => (c.id === editingCollaborator.id ? editingCollaborator : c))
      );
      setSuccess(`Alterações de ${editingCollaborator.nome.trim()} salvas com sucesso.`);
      setEditingCollaborator(null);
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      setError('Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollaborator = async () => {
    if (!editingCollaborator) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o colaborador "${editingCollaborator.nome || editingCollaborator.email}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteCollaborator(editingCollaborator.id);
      setCollaborators((current) => current.filter((c) => c.id !== editingCollaborator.id));
      setSuccess(`Colaborador ${editingCollaborator.nome || editingCollaborator.email} excluído com sucesso.`);
      setEditingCollaborator(null);
    } catch (err) {
      console.error('Erro ao excluir colaborador:', err);
      setError('Não foi possível excluir o colaborador.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full">
                <UserCog className="text-white" size={24} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Colaboradores cadastrados</h1>
            <p className="text-gray-600">
              Clique em um colaborador para editar permissões, obras e opções do menu.
            </p>
          </div>

          <Link
            to="/admin"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-700">{success}</div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando colaboradores...</div>
        ) : collaborators.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nenhum colaborador cadastrado.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 divide-y divide-gray-200">
            {collaborators.map((collaborator) => (
              <button
                key={collaborator.id}
                type="button"
                onClick={() => openEditor(collaborator)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 truncate">
                  {collaborator.nome.trim() || 'Sem nome'}
                </span>
                <span className="text-sm text-gray-500 truncate shrink-0 max-w-[50%]">
                  {collaborator.email}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {editingCollaborator && (
        <CollaboratorEditModal
          collaborator={editingCollaborator}
          saving={saving}
          deleting={deleting}
          onClose={closeEditor}
          onChange={setEditingCollaborator}
          onSave={() => void handleSaveCollaborator()}
          onDelete={() => void handleDeleteCollaborator()}
        />
      )}
    </div>
  );
}
