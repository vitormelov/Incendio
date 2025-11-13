import { Setor } from '../types';

// Configure os setores e caminhos dos PDFs aqui
export const setores: Setor[] = [
  {
    id: 'setor-azul',
    nome: 'Setor Azul',
    pdfPath: '/pdfs/setor-azul.pdf'
  },
];

export const getSetorById = (id: string): Setor | undefined => {
  return setores.find(s => s.id === id);
};

