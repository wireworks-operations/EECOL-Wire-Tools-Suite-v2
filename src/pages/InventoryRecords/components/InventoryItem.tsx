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
    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-gray-100 dark:border-slate-700 text-left">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div><span className="font-bold header-gradient uppercase">Date:</span> {item.inventoryDate}</div>
        <div><span className="font-bold header-gradient uppercase">Name:</span> {item.personName}</div>
        <div><span className="font-bold header-gradient uppercase">Line:</span> {item.lineCode}</div>
        <div><span className="font-bold header-gradient uppercase">Product:</span> {item.productCode}</div>
        <div className="col-span-2"><span className="font-bold header-gradient uppercase">Reason:</span> {item.reason}</div>
        <div><span className="font-bold header-gradient uppercase">Current:</span> {item.currentLength} {item.currentLengthUnit}</div>
        <div><span className="font-bold header-gradient uppercase">Actual:</span> {item.actualLength} {item.actualLengthUnit}</div>
      </div>
      <div className="text-[10px] text-gray-500 mt-2">@ {dateStr}</div>
      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-slate-700">
        <button onClick={() => onEdit(item.id)} className="px-2 py-0.5 bg-blue-500 text-white rounded text-[10px] btn-tactile">Edit</button>
        <button onClick={() => onDelete(item.id)} className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] btn-tactile">Delete</button>
      </div>
    </div>
  );
};

export default InventoryItem;
