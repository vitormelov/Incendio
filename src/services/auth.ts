import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Senha incorreta.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta conta foi desabilitada.';
    }
    throw new Error(errorMessage);
  }
};

export const signup = async (email: string, password: string, nome: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salvar informações do usuário no Firestore
    await setDoc(doc(db, 'users', user.uid), {
      nome: nome,
      email: email,
      createdAt: new Date().toISOString(),
    });

    return user;
  } catch (error: any) {
    let errorMessage = 'Erro ao criar conta.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este email já está em uso.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Operação não permitida.';
    }
    throw new Error(errorMessage);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Erro ao fazer logout');
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const isAdmin = (user: User | null): boolean => {
  return user?.email === 'projetos@preferencial.eng.br';
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

