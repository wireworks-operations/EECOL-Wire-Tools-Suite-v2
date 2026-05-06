import React from 'react';
import { CuttingRecord } from '../../../types/database';

interface HistoryItemProps {
  record: CuttingRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSystem: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ record, onEdit, onDelete, onToggleSystem }) => {
  const dateStr = new Date(record.timestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="cut-record-item text-left relative group">
      <div className="text-xs font-semibold header-gradient truncate mb-1">
        Wire: {record.wireId} | {record.lineCode} → {record.turnedToLineCode ? `L:${record.turnedToLineCode}` : 'N/A'} | Order: {record.orderNumber} | {record.customerName}
      </div>
      <div className="text-xs text-gray-700 dark:text-gray-300">
        <span className="font-bold">Length: {record.cutLength.toFixed(2)} {record.cutLengthUnit}</span>
        {record.isFullPick && <span className="font-bold ml-1">| Full Pick</span>}
        {record.startingMark !== null && (
          <> | Start: <span className="font-bold">{record.startingMark} {record.startingMarkUnit}</span> | End: <span className="font-bold">{record.isSingleUnitCut ? '1 unit' : `${record.endingMark} ${record.startingMarkUnit}`}</span></>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Cutter: {record.cutterName} | {record.coilOrReel === 'reel' ? `RLS EE-${record.reelSize || 'N/A'}W` : 'Coil'} | System: {record.isCutInSystem ? 'Yes' : 'No'}
      </div>
      <div className="text-[10px] text-gray-400 mt-1">@ {dateStr}</div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        <div className="flex gap-1">
          <button onClick={() => onEdit(record.id)} className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] btn-tactile">Edit</button>
          <button onClick={() => onDelete(record.id)} className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] btn-tactile">Delete</button>
        </div>
        {!record.isCutInSystem && (
           <button onClick={() => onToggleSystem(record.id)} className="px-2 py-0.5 bg-gray-500 text-white rounded text-[10px] btn-tactile">Cut In System</button>
        )}
        {record.isCutInSystem && (
           <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] opacity-75">✓ Cut In System</span>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;
