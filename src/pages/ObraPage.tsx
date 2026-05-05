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

function getObraTheme(obraId: string) {
  // Mantém cada obra visualmente distinta mesmo sem imagem cadastrada.
  switch (obraId) {
    case 'estacao-fashion':
      return {
        ring: 'ring-orange-200',
        centerFrom: 'from-orange-500',
        centerTo: 'to-rose-500',
      };
    case 'termaco':
      return {
        ring: 'ring-sky-200',
        centerFrom: 'from-sky-600',
        centerTo: 'to-indigo-600',
      };
    default:
      return {
        ring: 'ring-slate-200',
        centerFrom: 'from-slate-700',
        centerTo: 'to-slate-900',
      };
  }
}

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
      to: `/obra/${obraId}/rdo/lista`,
      label: 'RDO',
      description: 'Relatório diário de obra por data',
      icon: ClipboardList,
      iconWrapClass: 'bg-violet-100',
      iconClass: 'text-violet-600',
    },
  ];

  const theme = getObraTheme(obraId);
  const orbitRadius = 170; // px (evita sobreposição com o centro)
  const startAngleDeg = -90; // começa no "topo"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{obra.nome}</h1>
          <p className="text-base md:text-lg text-gray-600 mt-3 max-w-2xl mx-auto">
            Passe o mouse (ou foque com TAB) nos ícones para ver o nome de cada opção.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[460px] aspect-square">
            {/* Órbita */}
            <div className="absolute inset-0 rounded-full border border-gray-200 bg-white/40 shadow-sm" />

            {/* Planetas (botões) */}
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const angleDeg = startAngleDeg + (360 / menuItems.length) * idx;
              const angleRad = (angleDeg * Math.PI) / 180;
              const x = Math.cos(angleRad) * orbitRadius;
              const y = Math.sin(angleRad) * orbitRadius;
              const tooltipAbove = y < 0;

              return (
                <div
                  key={item.to}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  }}
                >
                  <Link
                    to={item.to}
                    aria-label={item.label}
                    className={[
                      'group relative grid place-items-center',
                      'h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white shadow-md ring-1 ring-black/5',
                      'transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'grid place-items-center h-10 w-10 sm:h-12 sm:w-12 rounded-full',
                        item.iconWrapClass,
                      ].join(' ')}
                    >
                      <Icon className={item.iconClass} size={26} strokeWidth={2} />
                    </span>

                    {/* Tooltip */}
                    <span
                      className={[
                        'pointer-events-none absolute left-1/2 top-[calc(100%+10px)] -translate-x-1/2',
                        'whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
                        'opacity-0 translate-y-1 transition',
                        'group-hover:opacity-100 group-hover:translate-y-0',
                        'group-focus-visible:opacity-100 group-focus-visible:translate-y-0',
                        tooltipAbove
                          ? 'top-auto bottom-[calc(100%+10px)] translate-y-[-0.25rem] group-hover:translate-y-0 group-focus-visible:translate-y-0'
                          : '',
                      ].join(' ')}
                      role="tooltip"
                    >
                      {item.label}
                    </span>
                  </Link>
                </div>
              );
            })}

            {/* Sol (centro) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className={[
                  'relative grid place-items-center overflow-hidden',
                  'h-44 w-44 sm:h-52 sm:w-52 rounded-full shadow-xl ring-8',
                  theme.ring,
                  obra.imageUrl ? '' : `bg-gradient-to-br ${theme.centerFrom} ${theme.centerTo}`,
                ].join(' ')}
              >
                {obra.imageUrl && (
                  <img
                    src={obra.imageUrl}
                    alt={obra.nome}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* overlay para garantir contraste do nome */}
                <div className="absolute inset-0 bg-black/25" />

                <div className="relative px-6 text-center">
                  <div className="text-white text-xl font-extrabold leading-tight drop-shadow">
                    {obra.nome}
                  </div>
                  <div className="mt-2 text-white/90 text-xs font-semibold tracking-wide drop-shadow">
                    MENU DA OBRA
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão fora da roda */}
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50"
            >
              <Home size={16} className="mr-2" />
              Trocar obra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
