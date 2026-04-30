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
import { Incendio, Disciplina, Severidade, Collaborator, ObraNote, ObraService, UserPermission } from '../types';

const INCENDIOS_COLLECTION = 'incendios';
const USERS_COLLECTION = 'users';
const OBRA_SERVICES_COLLECTION = 'obraServices';
const OBRA_NOTES_COLLECTION = 'obraNotes';

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
const timestampToLocalDateString = (timestamp: unknown): string | null => {
  if (!timestamp) return null;

  if (timestamp instanceof Date) {
    return formatLocalDate(timestamp);
  }

  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'toDate' in timestamp &&
    typeof (timestamp as { toDate?: unknown }).toDate === 'function'
  ) {
    const date = (timestamp as { toDate: () => Date }).toDate();
    return formatLocalDate(date);
  }

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : formatLocalDate(date);
  }

  return null;
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

export const getCollaborators = async (): Promise<Collaborator[]> => {
  const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));

  return querySnapshot.docs
    .map((snapshot) => {
      const data = snapshot.data();
      const permissions: UserPermission[] = Array.isArray(data.permissions)
        ? data.permissions.filter((permission): permission is UserPermission => permission === 'colaborador')
        : ['colaborador'];

      return {
        id: snapshot.id,
        nome: data.nome || '',
        email: data.email || '',
        permissions,
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
};

export const deleteCollaborator = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
};

export const updateCollaborator = async (
  userId: string,
  data: Pick<Collaborator, 'nome' | 'permissions'>
): Promise<void> => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    nome: data.nome,
    permissions: data.permissions,
    updatedAt: new Date().toISOString(),
  });
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
  const updateData: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  
  // Copiar outros campos que não são datas
  Object.keys(incendio).forEach((key) => {
    if (key !== 'dataAconteceu' && key !== 'dataPretendeApagar' && key !== 'dataFoiApagada') {
      const value = incendio[key as keyof typeof incendio];
      updateData[key] = value;
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

export const getObraServices = async (obraId: string): Promise<ObraService[]> => {
  const q = query(
    collection(db, OBRA_SERVICES_COLLECTION),
    where('obraId', '==', obraId)
  );

  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      obraId: String(data.obraId ?? ''),
      pacote: String(data.pacote ?? ''),
      descricao: String(data.descricao ?? ''),
      verba: typeof data.verba === 'number' ? data.verba : Number(data.verba ?? 0),
      dataInicio: data.dataInicio ? String(data.dataInicio) : null,
      dataTermino: data.dataTermino ? String(data.dataTermino) : null,
      finalizado: typeof data.finalizado === 'boolean' ? data.finalizado : false,
      createdAt: data.createdAt?.toDate?.().toISOString() || String(data.createdAt ?? ''),
      updatedAt: data.updatedAt?.toDate?.().toISOString() || String(data.updatedAt ?? ''),
    } as ObraService;
  });

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
};

export const createObraService = async (
  data: Omit<ObraService, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, OBRA_SERVICES_COLLECTION), {
    obraId: data.obraId,
    pacote: data.pacote,
    descricao: data.descricao,
    verba: data.verba,
    dataInicio: data.dataInicio ?? null,
    dataTermino: data.dataTermino ?? null,
    finalizado: data.finalizado ?? false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
};

export const updateObraService = async (
  serviceId: string,
  data: Pick<ObraService, 'pacote' | 'descricao' | 'verba'>
): Promise<void> => {
  await updateDoc(doc(db, OBRA_SERVICES_COLLECTION, serviceId), {
    pacote: data.pacote,
    descricao: data.descricao,
    verba: data.verba,
    updatedAt: Timestamp.now(),
  });
};

export const updateObraServicePlanning = async (
  serviceId: string,
  data: Pick<ObraService, 'dataInicio' | 'dataTermino' | 'finalizado'>
): Promise<void> => {
  await updateDoc(doc(db, OBRA_SERVICES_COLLECTION, serviceId), {
    dataInicio: data.dataInicio ?? null,
    dataTermino: data.dataTermino ?? null,
    finalizado: !!data.finalizado,
    updatedAt: Timestamp.now(),
  });
};

export const deleteObraService = async (serviceId: string): Promise<void> => {
  await deleteDoc(doc(db, OBRA_SERVICES_COLLECTION, serviceId));
};

export const getObraNotes = async (obraId: string): Promise<ObraNote[]> => {
  const q = query(collection(db, OBRA_NOTES_COLLECTION), where('obraId', '==', obraId));
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      obraId: String(data.obraId ?? ''),
      serviceId: data.serviceId ? String(data.serviceId) : null,
      numero: String(data.numero ?? ''),
      data: String(data.data ?? ''),
      empresa: String(data.empresa ?? ''),
      descricao: String(data.descricao ?? ''),
      valor: typeof data.valor === 'number' ? data.valor : Number(data.valor ?? 0),
      createdAt: data.createdAt?.toDate?.().toISOString() || String(data.createdAt ?? ''),
      updatedAt: data.updatedAt?.toDate?.().toISOString() || String(data.updatedAt ?? ''),
    } as ObraNote;
  });

  results.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return results;
};

export const createObraNote = async (
  data: Omit<ObraNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, OBRA_NOTES_COLLECTION), {
    obraId: data.obraId,
    serviceId: data.serviceId ?? null,
    numero: data.numero,
    data: data.data,
    empresa: data.empresa,
    descricao: data.descricao,
    valor: data.valor,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return docRef.id;
};

export const updateObraNote = async (
  noteId: string,
  data: Pick<ObraNote, 'serviceId' | 'numero' | 'data' | 'empresa' | 'descricao' | 'valor'>
): Promise<void> => {
  await updateDoc(doc(db, OBRA_NOTES_COLLECTION, noteId), {
    serviceId: data.serviceId ?? null,
    numero: data.numero,
    data: data.data,
    empresa: data.empresa,
    descricao: data.descricao,
    valor: data.valor,
    updatedAt: Timestamp.now(),
  });
};

export const deleteObraNote = async (noteId: string): Promise<void> => {
  await deleteDoc(doc(db, OBRA_NOTES_COLLECTION, noteId));
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

