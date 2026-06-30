export type ClienteAdministrativoStatus = 'aberto' | 'fechado' | 'disponivel' | 'em_reforma';

export interface ClienteAdministrativo {
  id: string;
  /** ID da planta/setor (mesmo usado em incêndios). */
  setor: string;
  obraId: string;
  setorLocal: string;
  corredor: string;
  box: string;
  nomeCliente: string;
  status: ClienteAdministrativoStatus;
  inadimplencia: boolean;
  processoJudicial: boolean;
  observacao: string;
  criadoPor?: string;
  coordenadas: {
    x: number;
    y: number;
    page: number;
  };
  createdAt: string;
  updatedAt: string;
}

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
  pacoteOrder?: number; // Ordem do pacote (para reordenar na lista)
  serviceOrder?: number; // Ordem do item dentro do pacote
  descricao: string;
  verba: number;
  dataInicio?: string | null; // YYYY-MM-DD
  dataTermino?: string | null; // YYYY-MM-DD
  finalizado?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Abatimento (R$) da célula = valor fechado × (medição % ÷ 100). Sinal e finalização são % únicos no resumo. */
export interface MedicaoCelula {
  percentualExecutado: number;
  abatimentoValor: number;
}

export interface MedicaoColuna {
  id: string;
  titulo: string;
}

export interface MedicaoLinha {
  id: string;
  serviceId: string | null;
  pacote: string;
  descricao: string;
  valorFechado: number;
  /** Chave = id da coluna de medição */
  celulas: Record<string, MedicaoCelula>;
}

export interface ObraMedicaoBloco {
  colunas: MedicaoColuna[];
  linhas: MedicaoLinha[];
  /** Desconto de sinal (%), uma vez no resumo — aplicado sobre o total abatido de cada coluna */
  descontoSinalPercent: number;
  /** Desconto de finalização (%), uma vez no resumo */
  descontoFinalizacaoPercent: number;
}

/** Quantidade de planilhas “Obra × prestador” (uma obra costuma ter mais de um prestador). */
export const OBRA_MEDICAO_PRESTADOR_SLOTS = 5;

export interface ObraMedicaoPrestadorSheet {
  nomePrestador: string;
  bloco: ObraMedicaoBloco;
}

export interface ObraMedicao {
  obraId: string;
  clienteObra: ObraMedicaoBloco;
  prestadoresMedicoes: ObraMedicaoPrestadorSheet[];
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
  criadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

import type { ObraModuloId } from '../config/obraModulos';

export type UserPermission = 'colaborador';

export interface Collaborator {
  id: string;
  nome: string;
  email: string;
  permissions: UserPermission[];
  /**
   * Obras que o usuário pode abrir (visualização). Independente da permissão Colaborador.
   * `null` com colaborador = todas as obras (campo ausente no Firestore). Sem colaborador, “todas” na UI grava lista explícita.
   * Array vazio = nenhuma obra.
   */
  obraIdsPermitidos: string[] | null;
  /**
   * Opções do menu da obra (dashboard, RDO, etc.). Colaborador ignora e vê todas.
   * `null` = todas as opções. Array vazio = nenhuma seção.
   */
  obraModulosPermitidos: ObraModuloId[] | null;
  createdAt: string | null;
  updatedAt?: string | null;
}

