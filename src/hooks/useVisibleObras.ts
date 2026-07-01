import { useEffect, useState } from 'react';
import { obras, getObraById } from '../config/setores';
import type { Obra } from '../types';
import { getCurrentUser, isAdmin, getUserFirestoreProfile, isDemoMode } from '../services/auth';
import { DEMO_OBRA_ID } from '../services/demoMode';

export function useVisibleObras() {
  const [visibleObras, setVisibleObras] = useState<Obra[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = getCurrentUser();
      if (!user) {
        if (!cancelled) setVisibleObras([]);
        return;
      }
      if (isDemoMode()) {
        const demoObra = getObraById(DEMO_OBRA_ID);
        if (!cancelled) setVisibleObras(demoObra ? [demoObra] : []);
        return;
      }
      if (isAdmin(user)) {
        if (!cancelled) setVisibleObras(obras);
        return;
      }
      const profile = await getUserFirestoreProfile(user.uid);
      if (cancelled) return;
      const isCollab = profile.permissions.includes('colaborador');
      if (profile.obraIdsPermitidos === null) {
        setVisibleObras(isCollab ? obras : []);
      } else {
        setVisibleObras(obras.filter((o) => profile.obraIdsPermitidos!.includes(o.id)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return visibleObras;
}
