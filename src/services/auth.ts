import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User,
  getAuth
} from 'firebase/auth';
import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app';
import { auth } from '../firebase/config';
import { db, firebaseConfig } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserPermission } from '../types';
import { getObraById, parseObraIdsPermitidosDoUsuario } from '../config/setores';

const ADMIN_EMAIL = 'projetos@preferencial.eng.br';

const getSecondaryApp = () => {
  const appName = 'secondary-signup';
  return getApps().some((app) => app.name === appName)
    ? getApp(appName)
    : initializeApp(firebaseConfig, appName);
};

const getAuthErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof FirebaseError)) {
    return fallback;
  }

  switch (error.code) {
    case 'auth/user-not-found':
      return 'Usuário não encontrado.';
    case 'auth/wrong-password':
      return 'Senha incorreta.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-disabled':
      return 'Esta conta foi desabilitada.';
    case 'auth/email-already-in-use':
      return 'Este email já está em uso.';
    case 'auth/weak-password':
      return 'A senha deve ter pelo menos 6 caracteres.';
    case 'auth/operation-not-allowed':
      return 'Operação não permitida.';
    default:
      return fallback;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    throw new Error(getAuthErrorMessage(error, 'Erro ao fazer login. Verifique suas credenciais.'));
  }
};

export const signup = async (
  email: string,
  password: string,
  nome: string,
  permissions: UserPermission[] = ['colaborador']
) => {
  const secondaryAuth = getAuth(getSecondaryApp());

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = userCredential.user;

    // Salvar informações do usuário no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      nome,
      email,
      permissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await signOut(secondaryAuth);
    return user;
  } catch (error: unknown) {
    throw new Error(getAuthErrorMessage(error, 'Erro ao criar conta.'));
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
    throw new Error(message);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isAdmin = (user: User | null): boolean => {
  return user?.email === ADMIN_EMAIL;
};

type UserFirestoreProfile = {
  permissions: UserPermission[];
  /** `null` = todas as obras; array = apenas IDs listados (pode ser vazio). */
  obraIdsPermitidos: string[] | null;
};

const userProfileCache = new Map<string, UserFirestoreProfile>();

const fetchUserProfileFromFirestore = async (uid: string): Promise<UserFirestoreProfile> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) {
      return { permissions: [], obraIdsPermitidos: [] };
    }
    const data = snap.data();
    const permissions = Array.isArray(data.permissions)
      ? (data.permissions.filter((p: unknown): p is UserPermission => p === 'colaborador') as UserPermission[])
      : [];
    const obraIdsPermitidos = parseObraIdsPermitidosDoUsuario(data as Record<string, unknown>);
    return { permissions, obraIdsPermitidos };
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return { permissions: [], obraIdsPermitidos: [] };
  }
};

export const getUserFirestoreProfile = async (uid: string): Promise<UserFirestoreProfile> => {
  const cached = userProfileCache.get(uid);
  if (cached) return cached;
  const profile = await fetchUserProfileFromFirestore(uid);
  userProfileCache.set(uid, profile);
  return profile;
};

/**
 * Se o usuário pode abrir esta obra para visualização (independente de ser colaborador).
 * - Admin: sempre.
 * - Colaborador com `obraIdsPermitidos` ausente (null): todas as obras.
 * - Demais: só obras listadas em `obraIdsPermitidos` (array vazio = nenhuma).
 */
function profileAllowsObraAccess(
  profile: UserFirestoreProfile,
  obraId: string,
  treatNullAsAllObras: boolean
): boolean {
  if (profile.obraIdsPermitidos === null) {
    return treatNullAsAllObras;
  }
  return profile.obraIdsPermitidos.includes(obraId);
}

/** Pode abrir a obra (visualização). Obras marcadas valem para todos; null = todas só para quem tem obra na lista implícita via colaborador+null = todas. */
export const canUserAccessObraId = async (obraId: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!getObraById(obraId)) return false;
  const profile = await getUserFirestoreProfile(user.uid);
  const isCollab = profile.permissions.includes('colaborador');
  return profileAllowsObraAccess(profile, obraId, isCollab);
};

/**
 * Pode editar dados da obra nesta rota (serviços, notas, medição, etc.).
 * Admin sempre; demais precisam ser colaborador e ter acesso à obra (mesma regra de obras marcadas).
 */
export const canManageObraData = async (obraId: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!getObraById(obraId)) return false;
  const profile = await getUserFirestoreProfile(user.uid);
  if (!profile.permissions.includes('colaborador')) return false;
  return profileAllowsObraAccess(profile, obraId, true);
};

export const clearPermissionsCache = (uid?: string) => {
  if (uid) userProfileCache.delete(uid);
  else userProfileCache.clear();
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

