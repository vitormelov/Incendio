import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Incendio, Disciplina, Severidade } from '../types';

const INCENDIOS_COLLECTION = 'incendios';
const USERS_COLLECTION = 'users';

// Helper para converter string de data (YYYY-MM-DD) para Date no fuso local
const parseLocalDate = (dateString: string): Date => {
  // Se já for uma data ISO completa, usar diretamente
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  // Para formato YYYY-MM-DD, criar data local (não UTC)
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Helper para converter Date para string YYYY-MM-DD no fuso local
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para converter Timestamp do Firestore para string YYYY-MM-DD no fuso local
const timestampToLocalDateString = (timestamp: any): string | null => {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return formatLocalDate(date);
};

// Helper para converter string YYYY-MM-DD ou ISO para Timestamp
const stringToTimestamp = (dateString: string | null): Timestamp | null => {
  if (!dateString) return null;
  const date = parseLocalDate(dateString);
  // Normalizar para meia-noite local
  date.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(date);
};

export const getUserName = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Se for o admin (email projetos@preferencial.eng.br), retornar nome fixo
      if (userData.email === 'projetos@preferencial.eng.br') {
        return 'Vitor Viana';
      }
      return userData.nome || null;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar nome do usuário:', error);
    return null;
  }
};

// Função auxiliar para obter o nome do usuário pelo email (útil para exibição na navegação)
export const getUserNameByEmail = (email: string | null | undefined): string => {
  if (email === 'projetos@preferencial.eng.br') {
    return 'Vitor Viana';
  }
  return email || 'Usuário';
};

export const getIncendios = async (setor?: string): Promise<Incendio[]> => {
  let q;
  
  if (setor) {
    // Quando há setor, não usamos orderBy para evitar necessidade de índice composto
    // Vamos ordenar no cliente depois
    q = query(collection(db, INCENDIOS_COLLECTION), where('setor', '==', setor));
  } else {
    // Sem setor, podemos usar orderBy normalmente
    q = query(collection(db, INCENDIOS_COLLECTION), orderBy('createdAt', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dataAconteceu: timestampToLocalDateString(doc.data().dataAconteceu) || doc.data().dataAconteceu,
    dataPretendeApagar: timestampToLocalDateString(doc.data().dataPretendeApagar) || null,
    dataFoiApagada: timestampToLocalDateString(doc.data().dataFoiApagada) || null,
    createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || doc.data().updatedAt,
  })) as Incendio[];
  
  // Se havia setor, ordenar no cliente
  if (setor) {
    results.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });
  }
  
  return results;
};

export const getIncendio = async (id: string): Promise<Incendio | null> => {
  const docRef = doc(db, INCENDIOS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    dataAconteceu: timestampToLocalDateString(data.dataAconteceu) || data.dataAconteceu,
    dataPretendeApagar: timestampToLocalDateString(data.dataPretendeApagar) || null,
    dataFoiApagada: timestampToLocalDateString(data.dataFoiApagada) || null,
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
  } as Incendio;
};

export const createIncendio = async (incendio: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, INCENDIOS_COLLECTION), {
    ...incendio,
    dataAconteceu: stringToTimestamp(incendio.dataAconteceu) || Timestamp.now(),
    dataPretendeApagar: stringToTimestamp(incendio.dataPretendeApagar || null),
    dataFoiApagada: stringToTimestamp(incendio.dataFoiApagada || null),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateIncendio = async (id: string, incendio: Partial<Omit<Incendio, 'id' | 'createdAt'>>): Promise<void> => {
  const docRef = doc(db, INCENDIOS_COLLECTION, id);
  const updateData: any = {
    updatedAt: Timestamp.now(),
  };
  
  // Copiar outros campos que não são datas
  Object.keys(incendio).forEach(key => {
    if (key !== 'dataAconteceu' && key !== 'dataPretendeApagar' && key !== 'dataFoiApagada') {
      updateData[key] = (incendio as any)[key];
    }
  });
  
  if (incendio.dataAconteceu) {
    updateData.dataAconteceu = stringToTimestamp(incendio.dataAconteceu);
  }
  if (incendio.dataPretendeApagar !== undefined) {
    updateData.dataPretendeApagar = stringToTimestamp(incendio.dataPretendeApagar || null);
  }
  if (incendio.dataFoiApagada !== undefined) {
    updateData.dataFoiApagada = stringToTimestamp(incendio.dataFoiApagada || null);
  }
  
  await updateDoc(docRef, updateData);
};

export const deleteIncendio = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, INCENDIOS_COLLECTION, id));
};

export const getIncendiosByFilter = async (
  setor?: string,
  disciplina?: Disciplina,
  severidade?: Severidade,
  isGargalo?: boolean,
  apenasAbertos?: boolean
): Promise<Incendio[]> => {
  let q = query(collection(db, INCENDIOS_COLLECTION));
  
  // Aplicar filtros (sem orderBy para evitar necessidade de índices compostos)
  if (setor) {
    q = query(q, where('setor', '==', setor));
  }
  if (disciplina) {
    q = query(q, where('disciplina', '==', disciplina));
  }
  if (severidade) {
    q = query(q, where('severidade', '==', severidade));
  }
  if (isGargalo !== undefined) {
    q = query(q, where('isGargalo', '==', isGargalo));
  }
  
  // Não usar orderBy aqui - vamos ordenar no cliente
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dataAconteceu: timestampToLocalDateString(doc.data().dataAconteceu) || doc.data().dataAconteceu,
    dataPretendeApagar: timestampToLocalDateString(doc.data().dataPretendeApagar) || null,
    dataFoiApagada: timestampToLocalDateString(doc.data().dataFoiApagada) || null,
    createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
    updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || doc.data().updatedAt,
  })) as Incendio[];
  
  // Ordenar no cliente
  results.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Ordem decrescente (mais recente primeiro)
  });
  
  if (apenasAbertos) {
    results = results.filter(i => !i.dataFoiApagada);
  }
  
  return results;
};

