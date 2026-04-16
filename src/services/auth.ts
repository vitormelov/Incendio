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
import { doc, setDoc } from 'firebase/firestore';
import { UserPermission } from '../types';

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

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

