import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { parseObraIdsPermitidosDoUsuario } from '../config/setores';
import {
  Incendio,
  Disciplina,
  Severidade,
  Collaborator,
  ObraNote,
  ObraService,
  UserPermission,
  ObraRDO,
  RDOClimaOpcao,
  RDOCondicaoOpcao,
  Turno,
  ObraMedicao,
  ObraMedicaoBloco,
  ObraMedicaoPrestadorSheet,
  OBRA_MEDICAO_PRESTADOR_SLOTS,
  MedicaoLinha,
  MedicaoColuna,
  MedicaoCelula,
} from '../types';

const INCENDIOS_COLLECTION = 'incendios';
const USERS_COLLECTION = 'users';
const OBRA_SERVICES_COLLECTION = 'obraServices';
const OBRA_NOTES_COLLECTION = 'obraNotes';
const OBRA_RDOS_COLLECTION = 'obraRdos';
const OBRA_MEDICOES_COLLECTION = 'obraMedicoes';

const emptyMedicaoBloco = (): ObraMedicaoBloco => ({
  colunas: [],
  linhas: [],
  descontoSinalPercent: 0,
  descontoFinalizacaoPercent: 0,
});

const parseMedicaoCelula = (raw: unknown): MedicaoCelula => {
  if (!raw || typeof raw !== 'object') {
    return { percentualExecutado: 0, abatimentoValor: 0 };
  }
  const o = raw as Record<string, unknown>;
  const percentualExecutado =
    typeof o.percentualExecutado === 'number'
      ? o.percentualExecutado
      : Number(o.percentualExecutado ?? 0);
  const abatimentoValor =
    typeof o.abatimentoValor === 'number' ? o.abatimentoValor : Number(o.abatimentoValor ?? 0);
  return {
    percentualExecutado: Number.isFinite(percentualExecutado) ? percentualExecutado : 0,
    abatimentoValor: Number.isFinite(abatimentoValor) ? abatimentoValor : 0,
  };
};

const parseMedicaoLinha = (raw: unknown): MedicaoLinha | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? o.serviceId ?? '');
  if (!id) return null;
  const celulasRaw = o.celulas;
  const celulas: Record<string, MedicaoCelula> = {};
  if (celulasRaw && typeof celulasRaw === 'object') {
    for (const [k, v] of Object.entries(celulasRaw as Record<string, unknown>)) {
      celulas[k] = parseMedicaoCelula(v);
    }
  }
  return {
    id,
    serviceId: o.serviceId === null || o.serviceId === undefined ? null : String(o.serviceId),
    pacote: String(o.pacote ?? ''),
    descricao: String(o.descricao ?? ''),
    valorFechado: typeof o.valorFechado === 'number' ? o.valorFechado : Number(o.valorFechado ?? 0),
    celulas,
  };
};

const parseMedicaoColuna = (raw: unknown): MedicaoColuna | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? '');
  if (!id) return null;
  return { id, titulo: String(o.titulo ?? 'Medição') };
};

const parseMedicaoBloco = (raw: unknown): ObraMedicaoBloco => {
  if (!raw || typeof raw !== 'object') return emptyMedicaoBloco();
  const o = raw as Record<string, unknown>;
  const colunasIn = Array.isArray(o.colunas) ? o.colunas : [];
  const linhasIn = Array.isArray(o.linhas) ? o.linhas : [];
  const colunas = colunasIn.map(parseMedicaoColuna).filter((c): c is MedicaoColuna => !!c);
  const linhas = linhasIn.map(parseMedicaoLinha).filter((l): l is MedicaoLinha => !!l);

  const totalContrato = linhas.reduce(
    (sum, l) => sum + (Number.isFinite(l.valorFechado) ? l.valorFechado : 0),
    0
  );
  const totalAbatidoBruto = linhas.reduce((sum, l) => {
    let row = 0;
    for (const c of colunas) {
      const cel = l.celulas[c.id];
      if (cel && Number.isFinite(cel.abatimentoValor)) row += cel.abatimentoValor;
    }
    return sum + row;
  }, 0);

  let descontoSinalPercent =
    typeof o.descontoSinalPercent === 'number' ? o.descontoSinalPercent : Number(o.descontoSinalPercent ?? NaN);
  if (!Number.isFinite(descontoSinalPercent)) {
    const legacyV =
      typeof o.descontoSinalValor === 'number' ? o.descontoSinalValor : Number(o.descontoSinalValor ?? NaN);
    if (Number.isFinite(legacyV) && legacyV > 0 && totalContrato > 0) {
      descontoSinalPercent = Math.min(100, (legacyV / totalContrato) * 100);
    } else {
      descontoSinalPercent = 0;
    }
  }
  descontoSinalPercent = Math.max(0, Math.min(100, descontoSinalPercent));

  let descontoFinalizacaoPercent =
    typeof o.descontoFinalizacaoPercent === 'number'
      ? o.descontoFinalizacaoPercent
      : Number(o.descontoFinalizacaoPercent ?? NaN);
  if (!Number.isFinite(descontoFinalizacaoPercent)) {
    const legacyV =
      typeof o.descontoFinalizacaoValor === 'number'
        ? o.descontoFinalizacaoValor
        : Number(o.descontoFinalizacaoValor ?? NaN);
    if (Number.isFinite(legacyV) && legacyV > 0 && totalContrato > 0) {
      descontoFinalizacaoPercent = Math.min(100, (legacyV / totalContrato) * 100);
    } else if (Number.isFinite(legacyV) && legacyV > 0 && totalAbatidoBruto > 0) {
      descontoFinalizacaoPercent = Math.min(100, (legacyV / totalAbatidoBruto) * 100);
    } else {
      descontoFinalizacaoPercent = 0;
    }
  }
  descontoFinalizacaoPercent = Math.max(0, Math.min(100, descontoFinalizacaoPercent));

  return {
    colunas,
    linhas,
    descontoSinalPercent,
    descontoFinalizacaoPercent,
  };
};

const emptyPrestadorSheet = (): ObraMedicaoPrestadorSheet => ({
  nomePrestador: '',
  bloco: emptyMedicaoBloco(),
});

const parsePrestadorSheet = (raw: unknown): ObraMedicaoPrestadorSheet => {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const nomePrestador = String(o.nomePrestador ?? '').trim();
  return { nomePrestador, bloco: parseMedicaoBloco(raw) };
};

const padPrestadoresMedicoes = (sheets: ObraMedicaoPrestadorSheet[]): ObraMedicaoPrestadorSheet[] => {
  const out = [...sheets];
  while (out.length < OBRA_MEDICAO_PRESTADOR_SLOTS) {
    out.push(emptyPrestadorSheet());
  }
  return out.slice(0, OBRA_MEDICAO_PRESTADOR_SLOTS);
};

const parsePrestadoresMedicoesFromDoc = (d: Record<string, unknown>): ObraMedicaoPrestadorSheet[] => {
  const arr = d.prestadoresMedicoes;
  if (Array.isArray(arr) && arr.length > 0) {
    return padPrestadoresMedicoes(arr.map(parsePrestadorSheet));
  }
  const legacy = parseMedicaoBloco(d.obraPrestadores);
  return padPrestadoresMedicoes([{ nomePrestador: '', bloco: legacy }]);
};

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
        obraIdsPermitidos: parseObraIdsPermitidosDoUsuario(data as Record<string, unknown>),
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
  data: Pick<Collaborator, 'nome' | 'permissions' | 'obraIdsPermitidos'>
): Promise<void> => {
  const ref = doc(db, USERS_COLLECTION, userId);
  const payload: Record<string, unknown> = {
    nome: data.nome,
    permissions: data.permissions,
    updatedAt: new Date().toISOString(),
  };
  if (data.obraIdsPermitidos === null) {
    payload.obraIdsPermitidos = deleteField();
  } else {
    payload.obraIdsPermitidos = data.obraIdsPermitidos;
  }
  await updateDoc(ref, payload);
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
      pacoteOrder: typeof data.pacoteOrder === 'number' ? data.pacoteOrder : undefined,
      serviceOrder: typeof data.serviceOrder === 'number' ? data.serviceOrder : undefined,
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
    pacoteOrder: typeof data.pacoteOrder === 'number' ? data.pacoteOrder : null,
    serviceOrder: typeof data.serviceOrder === 'number' ? data.serviceOrder : null,
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

export const updateObraServicePackageOrder = async (
  obraId: string,
  pacote: string,
  pacoteOrder: number
): Promise<void> => {
  const q = query(
    collection(db, OBRA_SERVICES_COLLECTION),
    where('obraId', '==', obraId),
    where('pacote', '==', pacote)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);
  querySnapshot.docs.forEach((snap) => {
    batch.update(snap.ref, { pacoteOrder, updatedAt: Timestamp.now() });
  });
  await batch.commit();
};

export const updateObraServiceItemOrder = async (serviceId: string, serviceOrder: number): Promise<void> => {
  await updateDoc(doc(db, OBRA_SERVICES_COLLECTION, serviceId), {
    serviceOrder,
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

const buildRDODocId = (obraId: string, data: string) => `${obraId}_${data}`;

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

const defaultRDO = (obraId: string, data: string): Omit<ObraRDO, 'id' | 'createdAt' | 'updatedAt'> => ({
  obraId,
  data,
  clima: defaultTurnoMap<RDOClimaOpcao>(['limpo', 'nublado', 'chuvoso'] as const),
  condicao: defaultTurnoMap<RDOCondicaoOpcao>(['produtivo', 'improdutivo'] as const),
  atividades: [],
  efetivo: [],
  equipamentos: [],
  observacoes: '',
});

export const getObraRDOs = async (obraId: string): Promise<ObraRDO[]> => {
  const q = query(collection(db, OBRA_RDOS_COLLECTION), where('obraId', '==', obraId));
  const querySnapshot = await getDocs(q);
  const results = querySnapshot.docs.map((snapshot) => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      obraId: String(data.obraId ?? ''),
      data: String(data.data ?? ''),
      clima: (data.clima ?? defaultRDO(obraId, String(data.data ?? '')).clima) as ObraRDO['clima'],
      condicao: (data.condicao ?? defaultRDO(obraId, String(data.data ?? '')).condicao) as ObraRDO['condicao'],
      atividades: Array.isArray(data.atividades) ? (data.atividades as ObraRDO['atividades']) : [],
      efetivo: Array.isArray(data.efetivo) ? (data.efetivo as ObraRDO['efetivo']) : [],
      equipamentos: Array.isArray(data.equipamentos) ? (data.equipamentos as ObraRDO['equipamentos']) : [],
      observacoes: String(data.observacoes ?? ''),
      createdAt: data.createdAt?.toDate?.().toISOString() || String(data.createdAt ?? ''),
      updatedAt: data.updatedAt?.toDate?.().toISOString() || String(data.updatedAt ?? ''),
    } as ObraRDO;
  });

  results.sort((a, b) => String(b.data).localeCompare(String(a.data)));
  return results;
};

/** RDO mais recente com data estritamente anterior a `beforeDate` (YYYY-MM-DD). */
export const getPreviousObraRDO = async (obraId: string, beforeDate: string): Promise<ObraRDO | null> => {
  const list = await getObraRDOs(obraId);
  const candidates = list.filter((r) => r.data < beforeDate);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.data.localeCompare(a.data));
  return candidates[0];
};

export const getObraRDOByDate = async (obraId: string, data: string): Promise<ObraRDO | null> => {
  const id = buildRDODocId(obraId, data);
  const snap = await getDoc(doc(db, OBRA_RDOS_COLLECTION, id));
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    id: snap.id,
    obraId: String(d.obraId ?? obraId),
    data: String(d.data ?? data),
    clima: (d.clima ?? defaultRDO(obraId, data).clima) as ObraRDO['clima'],
    condicao: (d.condicao ?? defaultRDO(obraId, data).condicao) as ObraRDO['condicao'],
    atividades: Array.isArray(d.atividades) ? (d.atividades as ObraRDO['atividades']) : [],
    efetivo: Array.isArray(d.efetivo) ? (d.efetivo as ObraRDO['efetivo']) : [],
    equipamentos: Array.isArray(d.equipamentos) ? (d.equipamentos as ObraRDO['equipamentos']) : [],
    observacoes: String(d.observacoes ?? ''),
    createdAt: d.createdAt?.toDate?.().toISOString() || String(d.createdAt ?? ''),
    updatedAt: d.updatedAt?.toDate?.().toISOString() || String(d.updatedAt ?? ''),
  } as ObraRDO;
};

export const upsertObraRDO = async (
  obraId: string,
  data: string,
  payload: Omit<ObraRDO, 'id' | 'obraId' | 'data' | 'createdAt' | 'updatedAt'> & Partial<Pick<ObraRDO, 'clima' | 'condicao' | 'atividades' | 'efetivo' | 'equipamentos' | 'observacoes'>>
): Promise<string> => {
  const id = buildRDODocId(obraId, data);
  const ref = doc(db, OBRA_RDOS_COLLECTION, id);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      ...defaultRDO(obraId, data),
      ...payload,
      obraId,
      data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return id;
  }

  await updateDoc(ref, {
    ...payload,
    updatedAt: Timestamp.now(),
  });
  return id;
};

export const deleteObraRDO = async (obraId: string, data: string): Promise<void> => {
  const id = buildRDODocId(obraId, data);
  await deleteDoc(doc(db, OBRA_RDOS_COLLECTION, id));
};

const medicaoBlocoToFirestore = (b: ObraMedicaoBloco) => ({
  colunas: b.colunas.map((c) => ({ id: c.id, titulo: c.titulo })),
  linhas: b.linhas.map((l) => ({
    id: l.id,
    serviceId: l.serviceId,
    pacote: l.pacote,
    descricao: l.descricao,
    valorFechado: l.valorFechado,
    celulas: Object.fromEntries(
      Object.entries(l.celulas).map(([k, v]) => [
        k,
        { percentualExecutado: v.percentualExecutado, abatimentoValor: v.abatimentoValor },
      ])
    ),
  })),
  descontoSinalPercent: b.descontoSinalPercent,
  descontoFinalizacaoPercent: b.descontoFinalizacaoPercent,
});

const medicaoPrestadorSheetToFirestore = (s: ObraMedicaoPrestadorSheet) => ({
  nomePrestador: s.nomePrestador,
  ...medicaoBlocoToFirestore(s.bloco),
});

export const getObraMedicao = async (obraId: string): Promise<ObraMedicao | null> => {
  const snap = await getDoc(doc(db, OBRA_MEDICOES_COLLECTION, obraId));
  if (!snap.exists()) return null;
  const d = snap.data() as Record<string, unknown>;
  const ts = (v: unknown) =>
    v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function'
      ? (v as { toDate: () => Date }).toDate().toISOString()
      : String(v ?? '');
  return {
    obraId,
    clienteObra: parseMedicaoBloco(d.clienteObra),
    prestadoresMedicoes: parsePrestadoresMedicoesFromDoc(d),
    createdAt: ts(d.createdAt),
    updatedAt: ts(d.updatedAt),
  };
};

export const upsertObraMedicao = async (
  obraId: string,
  payload: { clienteObra: ObraMedicaoBloco; prestadoresMedicoes: ObraMedicaoPrestadorSheet[] }
): Promise<void> => {
  const ref = doc(db, OBRA_MEDICOES_COLLECTION, obraId);
  const existing = await getDoc(ref);
  const now = Timestamp.now();
  const sheets = padPrestadoresMedicoes(payload.prestadoresMedicoes);
  const body = {
    obraId,
    clienteObra: medicaoBlocoToFirestore(payload.clienteObra),
    prestadoresMedicoes: sheets.map(medicaoPrestadorSheetToFirestore),
    updatedAt: now,
  };

  if (!existing.exists()) {
    await setDoc(ref, {
      ...body,
      createdAt: now,
    });
    return;
  }

  await setDoc(ref, body, { merge: true });
};

