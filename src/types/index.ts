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
  pdfPath: string;
}

