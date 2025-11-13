import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Incendio } from '../types';
import { getDisciplinaName } from '../utils/colors';
import { format, differenceInDays } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

interface DashboardProps {
  incendios: Incendio[];
}

export default function Dashboard({ incendios }: DashboardProps) {
  const stats = useMemo(() => {
    const abertos = incendios.filter(i => !i.dataFoiApagada);
    const fechados = incendios.filter(i => i.dataFoiApagada);
    const gargalos = incendios.filter(i => i.isGargalo && !i.dataFoiApagada);
    
    const atrasados = abertos.filter(i => {
      if (!i.dataPretendeApagar) return false;
      const prazo = new Date(i.dataPretendeApagar);
      const hoje = new Date();
      return hoje > prazo;
    });

    const porDisciplina = {
      civil: abertos.filter(i => i.disciplina === 'civil').length,
      instalacoes: abertos.filter(i => i.disciplina === 'instalacoes').length,
      equipamentos: abertos.filter(i => i.disciplina === 'equipamentos').length,
      estrutural: abertos.filter(i => i.disciplina === 'estrutural').length,
      impermeabilizacao: abertos.filter(i => i.disciplina === 'impermeabilizacao').length,
      ambientacao: abertos.filter(i => i.disciplina === 'ambientacao').length,
    };

    const porSeveridade = {
      1: abertos.filter(i => i.severidade === 1).length,
      2: abertos.filter(i => i.severidade === 2).length,
      3: abertos.filter(i => i.severidade === 3).length,
    };

    return {
      total: incendios.length,
      abertos: abertos.length,
      fechados: fechados.length,
      gargalos: gargalos.length,
      atrasados: atrasados.length,
      porDisciplina,
      porSeveridade,
    };
  }, [incendios]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Incêndios</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <AlertTriangle className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abertos</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats.abertos}</p>
            </div>
            <Clock className="text-red-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fechados</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats.fechados}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gargalos</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">{stats.gargalos}</p>
            </div>
            <TrendingUp className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      {/* Atrasos */}
      {stats.atrasados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            ⚠️ {stats.atrasados} Incêndio(s) Atrasado(s)
          </h2>
          <div className="space-y-2">
            {incendios
              .filter(i => {
                if (i.dataFoiApagada || !i.dataPretendeApagar) return false;
                const prazo = new Date(i.dataPretendeApagar);
                const hoje = new Date();
                return hoje > prazo;
              })
              .map(inc => {
                const diasAtraso = differenceInDays(new Date(), new Date(inc.dataPretendeApagar!));
                return (
                  <div key={inc.id} className="bg-white p-3 rounded border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{inc.descricao}</p>
                        <p className="text-sm text-gray-600">
                          {getDisciplinaName(inc.disciplina)} • Responsável: {inc.responsavel}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prazo: {format(new Date(inc.dataPretendeApagar!), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                        {diasAtraso} dia(s) de atraso
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Distribuição por Disciplina */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Incêndios Abertos por Disciplina</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats.porDisciplina).map(([disciplina, count]) => (
            <div key={disciplina} className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-600">{getDisciplinaName(disciplina as any)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição por Severidade */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Incêndios Abertos por Severidade</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.porSeveridade).map(([severidade, count]) => (
            <div key={severidade} className="text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-600">Nível {severidade}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

