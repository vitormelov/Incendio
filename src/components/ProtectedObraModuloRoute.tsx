import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { ObraModuloId } from '../config/obraModulos';
import { canUserAccessObraModulo, getObraLandingPath } from '../services/auth';

interface ProtectedObraModuloRouteProps {
  modulo: ObraModuloId;
  children: React.ReactNode;
}

export default function ProtectedObraModuloRoute({ modulo, children }: ProtectedObraModuloRouteProps) {
  const { obraId } = useParams<{ obraId: string }>();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [redirectTo, setRedirectTo] = useState('/');

  useEffect(() => {
    if (!obraId) {
      setState('denied');
      setRedirectTo('/');
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await canUserAccessObraModulo(obraId, modulo);
      if (cancelled) return;
      if (ok) {
        setState('ok');
        return;
      }
      setRedirectTo(await getObraLandingPath(obraId));
      setState('denied');
    })();
    return () => {
      cancelled = true;
    };
  }, [obraId, modulo]);

  if (state === 'loading') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mb-3" />
          <p>Verificando acesso…</p>
        </div>
      </div>
    );
  }

  if (state === 'denied') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
