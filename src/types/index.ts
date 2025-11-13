export type Disciplina = 'civil' | 'eletrica' | 'combate' | 'climatizacao';

export type Severidade = 1 | 2 | 3;

export interface Incendio {
  id: string;
  setor: string;
  disciplina: Disciplina;
  severidade: Severidade;
  isGargalo: boolean;
  descricao: string;
  responsavel: string;
  dataAconteceu: string;
  dataPretendeApagar: string | null;
  dataFoiApagada: string | null;
  coordenadas: {
    x: number;
    y: number;
    page: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Setor {
  id: string;
  nome: string;
  pdfPath: string;
}

