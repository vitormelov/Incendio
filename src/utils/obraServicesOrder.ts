import type { ObraService } from '../types';

const IMPLICIT_ORDER_BASE = 1_000_000;

export type ObraServicesPackageGroup = {
  pacote: string;
  items: ObraService[];
  pacoteOrder: number;
  displayOrder: number;
};

/** Mesma ordem da página Serviços: pacotes e itens conforme pacoteOrder / serviceOrder. */
export function groupObraServicesByPackage(services: ObraService[]): ObraServicesPackageGroup[] {
  const map = new Map<string, ObraService[]>();
  for (const service of services) {
    const pacote = (service.pacote || '').trim() || 'Sem pacote';
    const current = map.get(pacote) || [];
    current.push(service);
    map.set(pacote, current);
  }

  const entries = Array.from(map.entries()).map(([pacote, items]) => {
    const withOrder = items.filter((s) => typeof s.serviceOrder === 'number') as Array<
      ObraService & { serviceOrder: number }
    >;
    const withoutOrder = items.filter((s) => typeof s.serviceOrder !== 'number');

    withOrder.sort((a, b) => {
      if (a.serviceOrder !== b.serviceOrder) return a.serviceOrder - b.serviceOrder;
      const byDesc = a.descricao.localeCompare(b.descricao, 'pt-BR');
      if (byDesc !== 0) return byDesc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    withoutOrder.sort((a, b) => {
      const byDesc = a.descricao.localeCompare(b.descricao, 'pt-BR');
      if (byDesc !== 0) return byDesc;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const orderedItems = [...withOrder, ...withoutOrder];

    const orderCandidates = items
      .map((s) => (typeof s.pacoteOrder === 'number' ? s.pacoteOrder : Number.POSITIVE_INFINITY))
      .filter((n) => Number.isFinite(n));
    const pacoteOrder = orderCandidates.length > 0 ? Math.min(...orderCandidates) : Number.POSITIVE_INFINITY;
    return { pacote, items: orderedItems, pacoteOrder };
  });

  const implicitPackages = entries
    .filter((e) => !Number.isFinite(e.pacoteOrder))
    .map((e) => e.pacote)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const withDisplayOrder = entries.map((e) => {
    const implicitIdx = !Number.isFinite(e.pacoteOrder) ? implicitPackages.indexOf(e.pacote) : -1;
    const displayOrder = Number.isFinite(e.pacoteOrder)
      ? e.pacoteOrder
      : IMPLICIT_ORDER_BASE + Math.max(0, implicitIdx);
    return { ...e, displayOrder };
  });

  withDisplayOrder.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.pacote.localeCompare(b.pacote, 'pt-BR');
  });

  return withDisplayOrder;
}

export function sortObraServicesForDisplay(services: ObraService[]): ObraService[] {
  return groupObraServicesByPackage(services).flatMap((g) => g.items);
}
