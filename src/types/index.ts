export type Disciplina = 'civil' | 'instalacoes' | 'equipamentos' | 'estrutural' | 'impermeabilizacao' | 'ambientacao';

export type Severidade = 1 | 2 | 3;

export interface Incendio {
  id: string;
  setor: string;
  disciplina: Disciplina;
  severidade: Severidade;
  isGargalo: boolean;
  descricao: string;
  responsavel: string;
  criadoPor?: string; // UID ou email do usuário que criou a marcação
  criadoPorNome?: string; // Nome do criador (pode ser buscado do Firestore)
  dataAconteceu: string;
  dataPretendeApagar: string | null;
  dataFoiApagada: string | null;
  coordenadas: {
    x: number;
    y: number;
    page: number;
  };
  createdAt: string; // Data e horário da criação
  updatedAt: string;
}

export interface Setor {
  id: string;
  nome: string;
  pdfPath: string | null;
}

export interface Obra {
  id: string;
  nome: string;
  imageUrl?: string | null;
  setores: Setor[];
}

export interface ObraService {
  id: string;
  obraId: string;
  pacote: string;
  descricao: string;
  verba: number;
  dataInicio?: string | null; // YYYY-MM-DD
  dataTermino?: string | null; // YYYY-MM-DD
  finalizado?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObraNote {
  id: string;
  obraId: string;
  serviceId: string | null;
  numero: string;
  data: string; // YYYY-MM-DD
  empresa: string;
  descricao: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export type Turno = 'manha' | 'tarde' | 'noite';
export type RDOClimaOpcao = 'limpo' | 'nublado' | 'chuvoso';
export type RDOCondicaoOpcao = 'produtivo' | 'improdutivo';
export type RDOAtividadeSituacao = 'iniciada' | 'em_andamento' | 'finalizada';

export type RDOTurnoOpcoes<T extends string> = Record<Turno, Record<T, boolean>>;

export interface RDOAtividade {
  atividade: string;
  local: string;
  situacao: RDOAtividadeSituacao;
}

export interface RDOEfetivo {
  funcao: string;
  empreiteiro: string;
  quantidade: number;
}

export interface RDOEquipamento {
  nome: string;
  proprietario: string;
  status: 'ativo' | 'inativo';
  quantidade: number;
}

export interface ObraRDO {
  id: string;
  obraId: string;
  data: string; // YYYY-MM-DD
  clima: RDOTurnoOpcoes<RDOClimaOpcao>;
  condicao: RDOTurnoOpcoes<RDOCondicaoOpcao>;
  atividades: RDOAtividade[];
  efetivo: RDOEfetivo[];
  equipamentos: RDOEquipamento[];
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

export type UserPermission = 'colaborador';

export interface Collaborator {
  id: string;
  nome: string;
  email: string;
  permissions: UserPermission[];
  createdAt: string | null;
  updatedAt?: string | null;
}

