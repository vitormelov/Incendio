import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCurrentUser } from './auth';
import { isDemoMode } from './demoMode';
import { getObraById } from '../config/setores';
import type { SiteActivityAcao, SiteActivityLog, SiteActivityModulo } from '../types';

const SITE_ACTIVITY_COLLECTION = 'siteActivityLogs';
const USERS_COLLECTION = 'users';
const RETENTION_DAYS = 7;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

const cutoffTimestamp = () => Timestamp.fromDate(new Date(Date.now() - RETENTION_MS));

const resolveActorName = async (uid: string, email: string | null, displayName: string | null) => {
  if (email === 'projetos@preferencial.eng.br') return 'Vitor Viana';
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    const nome = snap.exists() ? String(snap.data().nome ?? '').trim() : '';
    if (nome) return nome;
  } catch {
    // ignore
  }
  if (displayName?.trim()) return displayName.trim();
  return email || 'Usuário';
};

export const recordSiteActivity = async (input: {
  acao: SiteActivityAcao;
  modulo: SiteActivityModulo;
  descricao: string;
  obraId?: string;
}): Promise<void> => {
  try {
    if (isDemoMode()) return;
    const user = getCurrentUser();
    if (!user) return;

    const obraNome = input.obraId ? getObraById(input.obraId)?.nome : undefined;
    const usuarioNome = await resolveActorName(user.uid, user.email, user.displayName);

    await addDoc(collection(db, SITE_ACTIVITY_COLLECTION), {
      createdAt: Timestamp.now(),
      usuarioId: user.uid,
      usuarioNome,
      usuarioEmail: user.email || '',
      acao: input.acao,
      modulo: input.modulo,
      descricao: input.descricao,
      ...(input.obraId ? { obraId: input.obraId } : {}),
      ...(obraNome ? { obraNome } : {}),
    });
  } catch (err) {
    console.error('Erro ao registrar log de atividade:', err);
  }
};

export const purgeOldSiteActivityLogs = async (): Promise<void> => {
  const q = query(
    collection(db, SITE_ACTIVITY_COLLECTION),
    where('createdAt', '<', cutoffTimestamp()),
    limit(400)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

const VALID_ACOES: SiteActivityAcao[] = ['criou', 'editou', 'excluiu', 'entrou', 'saiu'];
const VALID_MODULOS: SiteActivityModulo[] = [
  'incendios',
  'administrativo',
  'servicos',
  'notas',
  'planejamento',
  'rdo',
  'medicao',
  'informacoes',
  'colaboradores',
  'acesso',
];

export const getSiteActivityLogs = async (): Promise<SiteActivityLog[]> => {
  const q = query(
    collection(db, SITE_ACTIVITY_COLLECTION),
    where('createdAt', '>=', cutoffTimestamp()),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const createdAt =
      data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt
        ? (data.createdAt as Timestamp).toDate().toISOString()
        : String(data.createdAt ?? '');
    const acaoRaw = String(data.acao ?? '');
    const moduloRaw = String(data.modulo ?? '');
    return {
      id: d.id,
      createdAt,
      usuarioId: String(data.usuarioId ?? ''),
      usuarioNome: String(data.usuarioNome ?? 'Usuário'),
      usuarioEmail: String(data.usuarioEmail ?? ''),
      acao: (VALID_ACOES.includes(acaoRaw as SiteActivityAcao) ? acaoRaw : 'editou') as SiteActivityAcao,
      modulo: (VALID_MODULOS.includes(moduloRaw as SiteActivityModulo) ? moduloRaw : 'acesso') as SiteActivityModulo,
      descricao: String(data.descricao ?? ''),
      obraId: data.obraId ? String(data.obraId) : undefined,
      obraNome: data.obraNome ? String(data.obraNome) : undefined,
    };
  });
};
