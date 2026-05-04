import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Flame,
  Home,
  LucideIcon,
  Receipt,
  Wrench,
} from 'lucide-react';
import { getObraById } from '../config/setores';

type MenuItem = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconWrapClass: string;
  iconClass: string;
};

export default function ObraPage() {
  const { obraId } = useParams<{ obraId: string }>();

  if (!obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

  const obra = getObraById(obraId);

  if (!obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
        <div className="mt-4">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:underline">
            <ArrowLeft size={16} className="mr-2" />
            Voltar para Home
          </Link>
        </div>
      </div>
    );
  }

  const menuItems: MenuItem[] = [
    {
      to: `/obra/${obraId}/incendios`,
      label: 'Incêndios',
      description: 'Projetos, plantas e marcações nos PDFs',
      icon: Flame,
      iconWrapClass: 'bg-orange-100',
      iconClass: 'text-orange-600',
    },
    {
      to: `/obra/${obraId}/dashboard`,
      label: 'Dashboard',
      description: 'Visão geral por setor, disciplina e severidade',
      icon: BarChart3,
      iconWrapClass: 'bg-slate-100',
      iconClass: 'text-slate-700',
    },
    {
      to: `/obra/${obraId}/planejamento`,
      label: 'Planejamento',
      description: 'Datas e status dos serviços da obra',
      icon: CalendarDays,
      iconWrapClass: 'bg-slate-100',
      iconClass: 'text-slate-700',
    },
    {
      to: `/obra/${obraId}/servicos`,
      label: 'Serviços',
      description: 'Pacotes, descrições e verba',
      icon: Wrench,
      iconWrapClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
    },
    {
      to: `/obra/${obraId}/notas`,
      label: 'Notas',
      description: 'Notas fiscais e valores por serviço',
      icon: Receipt,
      iconWrapClass: 'bg-emerald-100',
      iconClass: 'text-emerald-600',
    },
    {
      to: `/obra/${obraId}/gastos`,
      label: 'Gastos',
      description: 'Acompanhamento de gastos da obra',
      icon: Banknote,
      iconWrapClass: 'bg-indigo-100',
      iconClass: 'text-indigo-600',
    },
    {
      to: `/obra/${obraId}/rdo?modo=editar`,
      label: 'RDO',
      description: 'Relatório diário de obra por data',
      icon: ClipboardList,
      iconWrapClass: 'bg-violet-100',
      iconClass: 'text-violet-600',
    },
    {
      to: '/',
      label: 'Trocar obra',
      description: 'Voltar à lista de obras na página inicial',
      icon: Home,
      iconWrapClass: 'bg-gray-100',
      iconClass: 'text-gray-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{obra.nome}</h1>
          <p className="text-xl text-gray-600 mt-3 max-w-2xl mx-auto">
            Menu da obra — escolha abaixo o que deseja acessar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow block"
              >
                <div className="flex items-center gap-5">
                  <div className={`${item.iconWrapClass} p-4 rounded-xl shrink-0`}>
                    <Icon className={item.iconClass} size={40} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 text-left">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{item.label}</h2>
                    <p className="text-base text-gray-600 mt-1.5 leading-snug">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
