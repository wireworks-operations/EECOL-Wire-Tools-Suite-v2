import { InventoryRecord } from '../../../types/database';

export const calculateInventoryStats = (items: InventoryRecord[]) => {
  const totalItems = items.length;
  let totalLength = 0;
  let damagedItems = 0;
  let tailendReasons = 0;

  for (const item of items) {
    totalLength += (item.actualLength || 0);
    const reason = (item.reason || '').toLowerCase();
    if (reason === 'damaged') damagedItems++;
    if (reason === 'tail end' || reason === 'tailend') tailendReasons++;
  }

  const avgLength = totalItems > 0 ? totalLength / totalItems : 0;
  return { totalItems, totalLength, damagedItems, tailendReasons, avgLength };
};

export const filterInventoryItems = (items: InventoryRecord[], searchTerm: string, filterField: string, filterDamaged: string, dateFrom: string, dateTo: string) => {
  const term = searchTerm.toLowerCase();
  const from = dateFrom ? new Date(dateFrom).getTime() : null;
  const to = dateTo ? new Date(dateTo).getTime() + 86399999 : null;

  return items.filter(item => {
    if (from || to) {
      const itemTime = new Date(item.inventoryDate).getTime();
      if (from && itemTime < from) return false;
      if (to && itemTime > to) return false;
    }

    if (term) {
      if (filterField !== 'all') {
        const val = (item as any)[filterField];
        if (!String(val).toLowerCase().includes(term)) return false;
      } else {
        const match = [item.productCode, item.personName, item.inventoryComments, item.lineCode].some(v => String(v).toLowerCase().includes(term));
        if (!match) return false;
      }
    }

    if (filterDamaged !== 'all') {
      const reason = (item.reason || '').toLowerCase();
      if (filterDamaged === 'damaged' && !reason.includes('damaged')) return false;
      if (filterDamaged === 'tailends' && !reason.includes('tail')) return false;
    }

    return true;
  });
};
