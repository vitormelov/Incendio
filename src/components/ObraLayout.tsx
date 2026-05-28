import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getObraById } from '../config/setores';
import {
  OBRA_NAV_ITEMS,
  isObraNavActive,
  obraModuloFromPath,
  type ObraModuloId,
} from '../config/obraModulos';
import { getObraLandingPath, getUserObraModulosPermitidos } from '../services/auth';

function getObraTheme(obraId: string) {
  switch (obraId) {
    case 'estacao-fashion':
      return { centerFrom: 'from-orange-500', centerTo: 'to-rose-500' };
    case 'termaco':
      return { centerFrom: 'from-sky-600', centerTo: 'to-indigo-600' };
    case 'termaco-terraplanagem':
      return { centerFrom: 'from-emerald-600', centerTo: 'to-teal-700' };
    case 'hotel-central':
      return { centerFrom: 'from-amber-600', centerTo: 'to-stone-700' };
    default:
      return { centerFrom: 'from-slate-700', centerTo: 'to-slate-900' };
  }
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  ].join(' ');

export default function ObraLayout() {
  const { obraId } = useParams<{ obraId: string }>();
  const location = useLocation();
  const [modulosPermitidos, setModulosPermitidos] = useState<ObraModuloId[] | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const mods = await getUserObraModulosPermitidos();
      if (!cancelled) setModulosPermitidos(mods);
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const obra = obraId ? getObraById(obraId) : undefined;
  const base = obraId ? `/obra/${obraId}` : '';

  const navItemsVisiveis = useMemo(() => {
    if (modulosPermitidos === null) return [];
    return OBRA_NAV_ITEMS.filter((item) => modulosPermitidos.includes(item.modulo));
  }, [modulosPermitidos]);

  const moduloAtual = obraId ? obraModuloFromPath(location.pathname, base) : null;

  useEffect(() => {
    if (!obraId || modulosPermitidos === null || !moduloAtual) {
      setRedirectTo(null);
      return;
    }
    if (modulosPermitidos.includes(moduloAtual)) {
      setRedirectTo(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const path = await getObraLandingPath(obraId);
      if (!cancelled) setRedirectTo(path);
    })();
    return () => {
      cancelled = true;
    };
  }, [obraId, modulosPermitidos, moduloAtual]);

  if (!obraId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Obra não encontrada.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Home
        </Link>
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  const theme = getObraTheme(obraId);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="overflow-hidden rounded-xl bg-gray-100 aspect-[16/10] w-full ring-1 ring-black/5">
            {obra.imageUrl ? (
              <img src={obra.imageUrl} alt={obra.nome} className="h-full w-full object-cover" />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${theme.centerFrom} ${theme.centerTo}`}
              >
                <span className="px-3 text-center text-sm font-semibold text-white drop-shadow">{obra.nome}</span>
              </div>
            )}
          </div>
          <h1 className="mt-3 text-lg font-bold text-gray-900 leading-tight">{obra.nome}</h1>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Menu da obra">
          {modulosPermitidos === null ? (
            <p className="px-3 py-2 text-sm text-gray-500">Carregando menu…</p>
          ) : navItemsVisiveis.length === 0 ? (
            <p className="px-3 py-2 text-sm text-amber-800">Nenhuma opção liberada para sua conta nesta obra.</p>
          ) : (
            navItemsVisiveis.map((item) => {
              const Icon = item.icon;
              const to = item.segment ? `${base}/${item.segment}` : base;
              return (
                <NavLink
                  key={item.modulo}
                  to={to}
                  end={item.segment === ''}
                  className={() => navLinkClass({ isActive: isObraNavActive(item, location.pathname, base) })}
                >
                  <Icon size={20} className="shrink-0 opacity-90" strokeWidth={2} />
                  {item.label}
                </NavLink>
              );
            })
          )}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
