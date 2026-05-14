import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getObraIdForSetor } from '../config/setores';
import { canUserAccessObraId } from '../services/auth';

interface ProtectedSetorRouteProps {
  children: React.ReactNode;
}

export default function ProtectedSetorRoute({ children }: ProtectedSetorRouteProps) {
  const { setorId } = useParams<{ setorId: string }>();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    if (!setorId) {
      setState('denied');
      return;
    }
    const obraId = getObraIdForSetor(setorId);
    if (!obraId) {
      setState('denied');
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await canUserAccessObraId(obraId);
      if (!cancelled) setState(ok ? 'ok' : 'denied');
    })();
    return () => {
      cancelled = true;
    };
  }, [setorId]);

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
