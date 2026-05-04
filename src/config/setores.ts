import { Obra, Setor } from '../types';

const estacaoFashionSetores: Setor[] = [
  {
    id: 'Fachada General Sampaio',
    nome: 'Fachada General Sampaio',
    pdfPath: '/pdfs/estacaoFashion/fachada-general.pdf',
  },
  {
    id: 'Fachada Castro e Silva',
    nome: 'Fachada Castro e Silva',
    pdfPath: '/pdfs/estacaoFashion/fachada-castroesilva.pdf',
  },
  {
    id: 'Fachada 24 de Maio',
    nome: 'Fachada 24 de Maio',
    pdfPath: '/pdfs/estacaoFashion/fachada-24demaio.pdf',
  },
  {
    id: 'subsolo',
    nome: 'Subsolo',
    pdfPath: '/pdfs/estacaoFashion/subsolo.pdf',
  },
  {
    id: 'setor-azul',
    nome: 'Setor Azul',
    pdfPath: '/pdfs/estacaoFashion/setor-azul.pdf',
  },
  {
    id: 'setor-amarelo',
    nome: 'Setor Amarelo',
    pdfPath: '/pdfs/estacaoFashion/setor-amarelo.pdf',
  },
  {
    id: 'setor-laranja',
    nome: 'Setor Laranja',
    pdfPath: '/pdfs/estacaoFashion/setor-laranja.pdf',
  },
  {
    id: 'setor-verde',
    nome: 'Setor Verde',
    pdfPath: '/pdfs/estacaoFashion/setor-verde.pdf',
  },
  {
    id: 'setor-branco',
    nome: 'Setor Branco',
    pdfPath: '/pdfs/estacaoFashion/setor-branco.pdf',
  },
  {
    id: 'setor-vermelho',
    nome: 'Setor Vermelho',
    pdfPath: '/pdfs/estacaoFashion/setor-vermelho.pdf',
  },
  {
    id: 'estac-coberto',
    nome: 'Estacionamento Coberto',
    pdfPath: '/pdfs/estacaoFashion/estac-coberto.pdf',
  },
  {
    id: 'estac-descoberto',
    nome: 'Estacionamento Descoberto',
    pdfPath: '/pdfs/estacaoFashion/estac-descoberto.pdf',
  },
];

const termacoSetores: Setor[] = [
  {
    id: 'termaco-geral',
    nome: 'Geral',
    pdfPath: '/pdfs/termaco/termaco.pdf',
  },
];

export const obras: Obra[] = [
  {
    id: 'estacao-fashion',
    nome: 'Estação Fashion',
    setores: estacaoFashionSetores,
  },
  {
    id: 'termaco',
    nome: 'Termaco',
    setores: termacoSetores,
  },
];

export const setores: Setor[] = obras.flatMap((obra) => obra.setores);

export const getSetorById = (id: string): Setor | undefined => {
  return setores.find(s => s.id === id);
};

export const getObraById = (id: string): Obra | undefined => {
  return obras.find((obra) => obra.id === id);
};

export const getSetoresByObraId = (obraId: string): Setor[] => {
  return getObraById(obraId)?.setores ?? [];
};

/** Obra que contém o setor (para voltar da tela de marcações à lista de projetos). */
export const getObraIdForSetor = (setorId: string): string | undefined => {
  for (const obra of obras) {
    if (obra.setores.some((s) => s.id === setorId)) {
      return obra.id;
    }
  }
  return undefined;
};

