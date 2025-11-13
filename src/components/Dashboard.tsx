import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, MapPin } from 'lucide-react';
import { Incendio } from '../types';
import { getDisciplinaName, getDisciplinaColor } from '../utils/colors';
import { setores } from '../config/setores';
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

    // Estatísticas por setor
    const porSetor = setores.map(setor => ({
      setorId: setor.id,
      setorNome: setor.nome,
      quantidade: abertos.filter(i => i.setor === setor.id).length,
    })).sort((a, b) => b.quantidade - a.quantidade); // Ordenar por quantidade (maior primeiro)

    return {
      total: incendios.length,
      abertos: abertos.length,
      fechados: fechados.length,
      gargalos: gargalos.length,
      atrasados: atrasados.length,
      porDisciplina,
      porSeveridade,
      porSetor,
    };
  }, [incendios]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral dos incêndios e estatísticas</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total de Incêndios</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <AlertTriangle className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Abertos</p>
              <p className="text-3xl font-bold text-red-600">{stats.abertos}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="text-red-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Fechados</p>
              <p className="text-3xl font-bold text-green-600">{stats.fechados}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Gargalos</p>
              <p className="text-3xl font-bold text-orange-600">{stats.gargalos}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="text-orange-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Atrasos */}
      {stats.atrasados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={24} />
            {stats.atrasados} Incêndio(s) Atrasado(s)
          </h2>
          <div className="space-y-3">
            {incendios
              .filter(i => {
                if (i.dataFoiApagada || !i.dataPretendeApagar) return false;
                const dateStr = i.dataPretendeApagar.split('T')[0];
                const [year, month, day] = dateStr.split('-').map(Number);
                const prazo = new Date(year, month - 1, day);
                prazo.setHours(0, 0, 0, 0);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                return hoje > prazo;
              })
              .map(inc => {
                const dateStr = inc.dataPretendeApagar!.split('T')[0];
                const [year, month, day] = dateStr.split('-').map(Number);
                const prazoDate = new Date(year, month - 1, day);
                prazoDate.setHours(0, 0, 0, 0);
                const hoje = new Date();
                hoje.setHours(0, 0, 0, 0);
                const diasAtraso = differenceInDays(hoje, prazoDate);
                return (
                  <div key={inc.id} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{inc.descricao}</p>
                        <p className="text-sm text-gray-600">
                          {getDisciplinaName(inc.disciplina)} • Responsável: {inc.responsavel}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prazo: {format(prazoDate, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-red-600 text-white text-sm font-medium rounded whitespace-nowrap">
                        {diasAtraso} dia(s) de atraso
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribuição por Setor */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <MapPin size={24} className="text-blue-600" />
            Incêndios Abertos por Setor
          </h2>
          {stats.porSetor.some(item => item.quantidade > 0) ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.porSetor.map(({ setorId, setorNome, quantidade }) => (
                <div 
                  key={setorId} 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    quantidade > 0 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <span className={`text-sm font-medium ${quantidade > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                    {setorNome}
                  </span>
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                    quantidade > 0 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {quantidade}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Nenhum incêndio aberto nos setores</p>
          )}
        </div>

        {/* Distribuição por Severidade */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Incêndios Abertos por Severidade</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stats.porSeveridade).map(([severidade, count]) => (
              <div key={severidade} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
                <p className="text-sm font-medium text-gray-600">Nível {severidade}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribuição por Disciplina */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Incêndios Abertos por Disciplina</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(stats.porDisciplina).map(([disciplina, count]) => {
            const color = getDisciplinaColor(disciplina as any);
            return (
              <div key={disciplina} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: color }}
                ></div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{count}</p>
                <p className="text-xs font-medium text-gray-600">{getDisciplinaName(disciplina as any)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

