import { Setor } from '../types';

// Configure os setores e caminhos dos PDFs aqui
export const setores: Setor[] = [
  {
    id: 'Fachada General Sampaio',
    nome: 'Fachada General Sampaio',
    pdfPath: '/pdfs/fachada-general.pdf'
  },
  {
    id: 'Fachada Castro e Silva',
    nome: 'Fachada Castro e Silva',
    pdfPath: '/pdfs/fachada-castroesilva.pdf'
  },
  {
    id: 'Fachada 24 de Maio',
    nome: 'Fachada 24 de Maio',
    pdfPath: '/pdfs/fachada-24demaio.pdf'
  },
  {
    id: 'subsolo',
    nome: 'Subsolo',
    pdfPath: '/pdfs/subsolo.pdf'
  },
  {
    id: 'setor-azul',
    nome: 'Setor Azul',
    pdfPath: '/pdfs/setor-azul.pdf'
  },
  {
    id: 'setor-amarelo',
    nome: 'Setor Amarelo',
    pdfPath: '/pdfs/setor-amarelo.pdf'
  },
  {
    id: 'setor-laranja',
    nome: 'Setor Laranja',
    pdfPath: '/pdfs/setor-laranja.pdf'
  },
  {
    id: 'setor-verde',
    nome: 'Setor Verde',
    pdfPath: '/pdfs/setor-verde.pdf'
  },
  {
    id: 'setor-branco',
    nome: 'Setor Branco',
    pdfPath: '/pdfs/setor-branco.pdf'
  },
  {
    id: 'setor-vermelho',
    nome: 'Setor Vermelho',
    pdfPath: '/pdfs/setor-vermelho.pdf'
  },
  {
    id: 'estac-coberto',
    nome: 'Estacionamento Coberto',
    pdfPath: '/pdfs/estac-coberto.pdf'
  },
  {
    id: 'estac-descoberto',
    nome: 'Estacionamento Descoberto',
    pdfPath: '/pdfs/estac-descoberto.pdf'
  },
];

export const getSetorById = (id: string): Setor | undefined => {
  return setores.find(s => s.id === id);
};

