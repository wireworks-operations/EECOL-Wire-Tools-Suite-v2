import React from 'react';
import { CuttingRecord } from '../../../types/database';

interface HistoryItemProps {
  record: CuttingRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSystem: (id: string) => void;
}

const fullDateTimeFormat = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

const HistoryItem: React.FC<HistoryItemProps> = ({ record, onEdit, onDelete, onToggleSystem }) => {
  const date = fullDateTimeFormat.format(record.timestamp);
  const createdDate = fullDateTimeFormat.format(record.createdAt || record.timestamp);
  const updatedDate = record.updatedAt && record.updatedAt !== record.createdAt ? ` | Updated: ${fullDateTimeFormat.format(record.updatedAt)}` : '';

  return (
    <div className="cut-record-item text-left relative bg-white dark:bg-slate-800 p-3 mb-3 rounded-3xl shadow border-l-4 border-eecol-blue transition-all duration-200">
      <p className="text-xs font-semibold header-gradient truncate">
        Wire: {record.wireId} | Cut From {record.lineCode || 'N/A'} | Turned To {record.turnedToLineCode ? `L:${record.turnedToLineCode}` : 'N/A'} | Order: {record.orderNumber} | Customer: {record.customerName}
      </p>

      <p className="text-xs text-gray-700 dark:text-gray-300">
        Cut Length: <span className="font-bold">{record.cutLength.toFixed(2)} {record.cutLengthUnit}</span>
        { (record.isFullPick || record.isNoMarks) ? (
            <> | <span className="font-bold">{[record.isFullPick && 'Full Pick', record.isNoMarks && 'No Marks'].filter(Boolean).join(', ')}</span></>
        ) : null}
        {record.startingMark !== null && !record.isNoMarks && (
          <> | Start Mark: <span className="font-bold">{record.startingMark} {record.startingMarkUnit}</span> | End Mark: <span className="font-bold">{record.isSingleUnitCut ? '1 unit cut' : `${record.endingMark} ${record.startingMarkUnit}`}</span></>
        )}
      </p>

      <p className="text-xs text-gray-700 dark:text-gray-300">
        Cutter: {record.cutterName} | {record.coilOrReel === 'coil' ? 'Coil: Yes' : (record.chargeable === 'yes' ? `RLS EE-${record.reelSize || 'N/A'}W | Chargeable: yes` : 'Non-Chargeable Reel')}
        {record.isSystemCut && <span className="font-bold"> | System Cut</span>}
        <span className="font-bold"> | Cut In System: {record.isCutInSystem ? 'Yes' : 'No'}</span>
      </p>

      <p className="text-xs text-gray-700 dark:text-gray-300">Comments: {record.orderComments || 'N/A'}</p>
      <p className="text-xs text-gray-500 mt-1">@ {date} by Local</p>
      <p className="text-xs text-gray-400">Created: {createdDate}{updatedDate}</p>

      <div className="flex justify-between items-center mt-1">
        <div className="flex space-x-1">
          <button onClick={() => onEdit(record.id)} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">Edit</button>
          <button onClick={() => onDelete(record.id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
        </div>
        {!record.isCutInSystem ? (
           <button onClick={() => onToggleSystem(record.id)} className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded">Cut In System</button>
        ) : (
           <button disabled className="text-xs bg-purple-600 text-white px-2 py-1 rounded cursor-not-allowed opacity-75">
             ✓ Cut In System ({record.cutInSystemTimestamp ? new Date(record.cutInSystemTimestamp).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'}) : 'Unknown'})
           </button>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;
