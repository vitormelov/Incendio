/** Opções do campo Setor no módulo Administrativo (cliente na planta). */
export const SETOR_LOCAL_OPCOES = [
  'Azul',
  'Amarelo',
  'Laranja',
  'Verde',
  'Black',
  'Branco',
  'Vermelho',
] as const;

export type SetorLocalOpcao = (typeof SETOR_LOCAL_OPCOES)[number];

/** Setores locais permitidos por planta (PDF) no módulo administrativo. */
export const SETOR_LOCAL_POR_PLANTA: Record<string, readonly SetorLocalOpcao[]> = {
  'setor-azul-amarelo': ['Azul', 'Amarelo'],
  'setor-black': ['Black'],
  'setor-laranja-verde': ['Laranja', 'Verde'],
  'setor-vermelho-branco': ['Vermelho', 'Branco'],
};

export function getSetorLocalOpcoesParaPlanta(setorPlantaId: string): readonly SetorLocalOpcao[] {
  return SETOR_LOCAL_POR_PLANTA[setorPlantaId] ?? SETOR_LOCAL_OPCOES;
}

/** Valor inicial ao criar cliente — único quando a planta só tem uma opção. */
export function getSetorLocalPadraoParaPlanta(setorPlantaId: string): SetorLocalOpcao | '' {
  const opcoes = getSetorLocalOpcoesParaPlanta(setorPlantaId);
  return opcoes.length === 1 ? opcoes[0] : '';
}

export function isSetorLocalOpcao(value: string): value is SetorLocalOpcao {
  return (SETOR_LOCAL_OPCOES as readonly string[]).includes(value);
}
