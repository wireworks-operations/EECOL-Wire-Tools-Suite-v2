import React from 'react';
import { InventoryRecord } from '../../../types/database';

interface ItemProps {
  item: InventoryRecord;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const InventoryItem: React.FC<ItemProps> = ({ item, onEdit, onDelete }) => {
  const dateStr = new Date(item.timestamp).toLocaleString();

  return (
    <div className="bg-gray-100 dark:bg-slate-700 p-2 rounded-3xl text-left border border-gray-200 dark:border-slate-600">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div><span className="font-bold header-gradient uppercase text-[9px]">Date:</span> {item.inventoryDate || new Date(item.timestamp).toLocaleDateString()}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Name:</span> {item.personName}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Line #:</span> {item.lineCode}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Product:</span> {item.productCode}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Coil:</span> {item.coilCode}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">INA #:</span> {item.inaNumber || 'N/A'}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Current:</span> {item.currentLength} {item.currentLengthUnit}</div>
        <div><span className="font-bold header-gradient uppercase text-[9px]">Actual:</span> {item.actualLength} {item.actualLengthUnit}</div>
        <div className="col-span-2"><span className="font-bold header-gradient uppercase text-[9px]">Reason:</span> {item.reason}</div>
        <div className="col-span-2"><span className="font-bold header-gradient uppercase text-[9px]">Note:</span> {item.note}</div>
        <div className="col-span-4 mt-1 bg-white/50 dark:bg-black/20 p-1 rounded italic text-[9px]">
            <span className="font-bold header-gradient uppercase text-[8px] not-italic">Comments:</span> {item.inventoryComments || 'None'}
        </div>
      </div>
      <div className="text-[9px] text-gray-500 mt-1 flex justify-between items-center">
        <span>Recorded @ {dateStr}</span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(item.id)} className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[8px] font-bold">Edit</button>
          <button onClick={() => onDelete(item.id)} className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[8px] font-bold">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryItem;
