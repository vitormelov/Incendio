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

const termacoTerraplanagemSetores: Setor[] = [
  {
    id: 'termaco-terraplanagem-geral',
    nome: 'Geral',
    pdfPath: '/pdfs/termacoTerraplanagem/termacoTerraplanagem.pdf',
  },
];

const hotelCentralSetores: Setor[] = [
  {
    id: 'hotel-central-fachada',
    nome: 'Fachada',
    pdfPath: '/pdfs/hotelCentral/hotel-central-fachada.pdf',
  },
  {
    id: 'hotel-central-subsolo',
    nome: 'Subsolo',
    pdfPath: '/pdfs/hotelCentral/hotel-central-subsolo.pdf',
  },
  {
    id: 'hotel-central-terreo',
    nome: 'Térreo',
    pdfPath: '/pdfs/hotelCentral/hotel-central-terreo.pdf',
  },
  {
    id: 'hotel-central-tipo',
    nome: 'Planta tipo',
    pdfPath: '/pdfs/hotelCentral/hotel-central-tipo.pdf',
  },
  {
    id: 'hotel-central-corte',
    nome: 'Corte',
    pdfPath: '/pdfs/hotelCentral/hotel-central-corte.pdf',
  },
  {
    id: 'hotel-central-cobertura',
    nome: 'Cobertura',
    pdfPath: '/pdfs/hotelCentral/hotel-central-cobertura.pdf',
  },
  {
    id: 'hotel-central-convencoes',
    nome: 'Convenções',
    pdfPath: '/pdfs/hotelCentral/hotel-central-convencoes.pdf',
  },
  {
    id: 'hotel-central-restaurante',
    nome: 'Restaurante',
    pdfPath: '/pdfs/hotelCentral/hotel-central-restaurante.pdf',
  },
  {
    id: 'hotel-central-fitness',
    nome: 'Fitness',
    pdfPath: '/pdfs/hotelCentral/hotel-central-fitness.pdf',
  },
];

export const obras: Obra[] = [
  {
    id: 'estacao-fashion',
    nome: 'Estação Fashion',
    imageUrl: '/bg/estacaoFashion.jpg',
    setores: estacaoFashionSetores,
  },
  {
    id: 'termaco',
    nome: 'Termaco Galpão',
    imageUrl: '/bg/termaco.jpg',
    setores: termacoSetores,
  },
  {
    id: 'termaco-terraplanagem',
    nome: 'Termaco Terraplanagem',
    imageUrl: '/bg/termacoTerraplanagem.png',
    setores: termacoTerraplanagemSetores,
  },
  {
    id: 'hotel-central',
    nome: 'Hotel Central',
    imageUrl: '/bg/hotelCentral.jpeg',
    setores: hotelCentralSetores,
  },
];

export const setores: Setor[] = obras.flatMap((obra) => obra.setores);

export const getSetorById = (id: string): Setor | undefined => {
  return setores.find(s => s.id === id);
};

export const getObraById = (id: string): Obra | undefined => {
  return obras.find((obra) => obra.id === id);
};

/** Lê `obraIdsPermitidos` do documento do usuário no Firestore. `null` = acesso a todas as obras cadastradas. */
export function parseObraIdsPermitidosDoUsuario(data: Record<string, unknown>): string[] | null {
  const valid = new Set(obras.map((o) => o.id));
  if (!('obraIdsPermitidos' in data)) return null;
  const raw = data.obraIdsPermitidos;
  if (!Array.isArray(raw)) return null;
  return raw.filter((id): id is string => typeof id === 'string' && valid.has(id));
}

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

