import { getSetoresByObraId, getSetorById } from './setores';
import type { Setor } from '../types';

const ADMIN_PDF_BASE = '/pdfs/pdfsIncendio';

const estacaoFashionSetoresAdministrativos: Setor[] = [
  {
    id: 'setor-azul-amarelo',
    nome: 'Setor Azul e Amarelo',
    pdfPath: `${ADMIN_PDF_BASE}/estacaoFashion/setor-azul-amarelo.pdf`,
  },
  {
    id: 'setor-black',
    nome: 'Setor Black',
    pdfPath: `${ADMIN_PDF_BASE}/estacaoFashion/setor-black.pdf`,
  },
  {
    id: 'setor-laranja-verde',
    nome: 'Setor Laranja e Verde',
    pdfPath: `${ADMIN_PDF_BASE}/estacaoFashion/setor-laranja-verde.pdf`,
  },
  {
    id: 'setor-vermelho-branco',
    nome: 'Setor Vermelho e Branco',
    pdfPath: `${ADMIN_PDF_BASE}/estacaoFashion/setor-vermelho-branco.pdf`,
  },
];

const setoresAdministrativosPorObra: Record<string, Setor[]> = {
  'estacao-fashion': estacaoFashionSetoresAdministrativos,
};

export const getSetoresAdministrativosByObraId = (obraId: string): Setor[] => {
  return setoresAdministrativosPorObra[obraId] ?? getSetoresByObraId(obraId);
};

export const getSetorAdministrativoById = (setorId: string): Setor | undefined => {
  for (const setores of Object.values(setoresAdministrativosPorObra)) {
    const found = setores.find((s) => s.id === setorId);
    if (found) return found;
  }
  return getSetorById(setorId);
};

export const getObraIdForSetorAdministrativo = (setorId: string): string | undefined => {
  for (const [obraId, setores] of Object.entries(setoresAdministrativosPorObra)) {
    if (setores.some((s) => s.id === setorId)) return obraId;
  }
  return undefined;
};
