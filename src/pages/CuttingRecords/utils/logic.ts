import { CuttingRecord } from '../../../types/database';

export const calculateStats = (records: CuttingRecord[]) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let totalCutsToday = 0;
  let totalLength = 0;
  let fullPicksCount = 0;
  let systemCutsCount = 0;
  const cutterCounts: Record<string, number> = {};
  const customerCounts: Record<string, number> = {};

  for (const r of records) {
    if (r.timestamp >= todayStart) totalCutsToday++;
    totalLength += (r.cutLength || 0);
    if (r.isFullPick) fullPicksCount++;
    if (r.isSystemCut) systemCutsCount++;
    if (r.cutterName) cutterCounts[r.cutterName] = (cutterCounts[r.cutterName] || 0) + 1;
    if (r.customerName) customerCounts[r.customerName] = (customerCounts[r.customerName] || 0) + 1;
  }

  const topCutter = Object.entries(cutterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  const topCustomer = Object.entries(customerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  return { totalCutsToday, totalLength, fullPicksCount, systemCutsCount, topCutter, topCustomer };
};

export const filterRecords = (records: CuttingRecord[], searchTerm: string, filterField: string, dateFrom: string, dateTo: string) => {
  const term = searchTerm.toLowerCase();
  const from = dateFrom ? new Date(dateFrom).getTime() : null;
  const to = dateTo ? new Date(dateTo).getTime() + 86399999 : null;

  return records.filter(r => {
    if (from && r.timestamp < from) return false;
    if (to && r.timestamp > to) return false;
    if (!term) return true;

    if (filterField !== 'all') {
      const val = (r as any)[filterField];
      return val && String(val).toLowerCase().includes(term);
    }

    return [r.wireId, r.orderNumber, r.cutterName, r.customerName].some(v => v?.toLowerCase().includes(term));
  });
};
