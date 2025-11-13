import { Disciplina } from '../types';

export const getDisciplinaColor = (disciplina: Disciplina): string => {
  const colors: Record<Disciplina, string> = {
    civil: '#3B82F6',
    eletrica: '#F59E0B',
    combate: '#EF4444',
    climatizacao: '#10B981',
  };
  return colors[disciplina];
};

export const getDisciplinaName = (disciplina: Disciplina): string => {
  const names: Record<Disciplina, string> = {
    civil: 'Civil',
    eletrica: 'Elétrica',
    combate: 'Combate a Incêndio',
    climatizacao: 'Climatização',
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

