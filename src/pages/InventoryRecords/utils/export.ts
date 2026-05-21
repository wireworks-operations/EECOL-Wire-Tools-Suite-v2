import { InventoryRecord } from '../../../types/database';

export const exportInventoryToCSV = (records: InventoryRecord[]) => {
  if (records.length === 0) return;

  const header = [
    'id', 'wireType', 'personName', 'productCode', 'lineCode', 'actualLength', 'timestamp', 'updatedAt'
  ];

  const rows = records.map(r => [
    r.id, r.wireType, r.personName, r.productCode, r.lineCode, r.actualLength, r.timestamp, r.updatedAt
  ].map(val => {
    const s = String(val);
    return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));

  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory_records_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
