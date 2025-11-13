import { Disciplina } from '../types';

export const getDisciplinaColor = (disciplina: Disciplina): string => {
  const colors: Record<Disciplina, string> = {
    civil: '#3B82F6',           // Azul
    instalacoes: '#F59E0B',     // Laranja/Amarelo
    equipamentos: '#8B5CF6',    // Roxo
    estrutural: '#EF4444',      // Vermelho
    impermeabilizacao: '#10B981', // Verde
    ambientacao: '#EC4899',     // Rosa
  };
  return colors[disciplina];
};

export const getDisciplinaName = (disciplina: Disciplina): string => {
  const names: Record<Disciplina, string> = {
    civil: 'Civil',
    instalacoes: 'Instalações',
    equipamentos: 'Equipamentos',
    estrutural: 'Estrutural',
    impermeabilizacao: 'Impermeabilização',
    ambientacao: 'Ambientação',
  };
  return names[disciplina];
};

export const getSeveridadeName = (severidade: number): string => {
  const names: Record<number, string> = {
    1: 'Pequeno',
    2: 'Médio',
    3: 'Grande',
  };
  return names[severidade] || 'Desconhecido';
};

