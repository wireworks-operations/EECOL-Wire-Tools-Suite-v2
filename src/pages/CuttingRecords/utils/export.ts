import { CuttingRecord } from '../../../types/database';

export const exportToCSV = (records: CuttingRecord[]) => {
  if (records.length === 0) return;

  const header = [
    'id', 'wireid', 'cutlength', 'cutlengthunit', 'startingmark', 'startingmarkunit', 'endingmark',
    'linecode', 'cuttername', 'ordernumber', 'customername', 'coilorreel', 'reelsize', 'chargeable'
  ];

  const rows = records.map(r => [
    r.id, r.wireId, r.cutLength, r.cutLengthUnit, r.startingMark || '', r.startingMarkUnit || '', r.endingMark || '',
    r.lineCode, r.cutterName, r.orderNumber, r.customerName, r.coilOrReel, r.reelSize || '', r.chargeable
  ].map(val => {
    const s = String(val);
    return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));

  const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cut_records_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
