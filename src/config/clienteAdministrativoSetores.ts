/** Opções do campo Setor no módulo Administrativo (cliente na planta). */
export const SETOR_LOCAL_OPCOES = [
  'Subsolo',
  'Azul',
  'Amarelo',
  'Laranja',
  'Verde',
  'Black',
  'Branco',
  'Vermelho',
] as const;

export type SetorLocalOpcao = (typeof SETOR_LOCAL_OPCOES)[number];

export function isSetorLocalOpcao(value: string): value is SetorLocalOpcao {
  return (SETOR_LOCAL_OPCOES as readonly string[]).includes(value);
}
