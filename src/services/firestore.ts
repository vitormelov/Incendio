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
    dataAconteceu: doc.data().dataAconteceu?.toDate?.().toISOString() || doc.data().dataAconteceu,
    dataPretendeApagar: doc.data().dataPretendeApagar?.toDate?.().toISOString() || doc.data().dataPretendeApagar || null,
    dataFoiApagada: doc.data().dataFoiApagada?.toDate?.().toISOString() || doc.data().dataFoiApagada || null,
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
    dataAconteceu: data.dataAconteceu?.toDate?.().toISOString() || data.dataAconteceu,
    dataPretendeApagar: data.dataPretendeApagar?.toDate?.().toISOString() || data.dataPretendeApagar || null,
    dataFoiApagada: data.dataFoiApagada?.toDate?.().toISOString() || data.dataFoiApagada || null,
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
  } as Incendio;
};

export const createIncendio = async (incendio: Omit<Incendio, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, INCENDIOS_COLLECTION), {
    ...incendio,
    dataAconteceu: Timestamp.fromDate(new Date(incendio.dataAconteceu)),
    dataPretendeApagar: incendio.dataPretendeApagar ? Timestamp.fromDate(new Date(incendio.dataPretendeApagar)) : null,
    dataFoiApagada: incendio.dataFoiApagada ? Timestamp.fromDate(new Date(incendio.dataFoiApagada)) : null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateIncendio = async (id: string, incendio: Partial<Omit<Incendio, 'id' | 'createdAt'>>): Promise<void> => {
  const docRef = doc(db, INCENDIOS_COLLECTION, id);
  const updateData: any = {
    ...incendio,
    updatedAt: Timestamp.now(),
  };
  
  if (incendio.dataAconteceu) {
    updateData.dataAconteceu = Timestamp.fromDate(new Date(incendio.dataAconteceu));
  }
  if (incendio.dataPretendeApagar) {
    updateData.dataPretendeApagar = Timestamp.fromDate(new Date(incendio.dataPretendeApagar));
  }
  if (incendio.dataFoiApagada) {
    updateData.dataFoiApagada = Timestamp.fromDate(new Date(incendio.dataFoiApagada));
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
    dataAconteceu: doc.data().dataAconteceu?.toDate?.().toISOString() || doc.data().dataAconteceu,
    dataPretendeApagar: doc.data().dataPretendeApagar?.toDate?.().toISOString() || doc.data().dataPretendeApagar || null,
    dataFoiApagada: doc.data().dataFoiApagada?.toDate?.().toISOString() || doc.data().dataFoiApagada || null,
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

