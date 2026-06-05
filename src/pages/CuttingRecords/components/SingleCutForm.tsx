import React from 'react';

interface FormProps {
  formData: any;
  setFormData: (data: any) => void;
  onImportCalculator: () => void;
  onImportReel: () => void;
}

const SingleCutForm: React.FC<FormProps> = ({ formData, setFormData, onImportCalculator, onImportReel }) => {
  const isReel = formData.coilOrReel === 'reel';

  return (
    <div className="space-y-4">
      <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
        <label htmlFor="cutLength" className="block text-xs font-semibold mb-1 header-gradient uppercase">Length Cut</label>
        <div className="flex space-x-1">
          <input id="cutLength" type="number" value={formData.cutLength || ''} onChange={e => {
              const val = parseFloat(e.target.value);
              setFormData({...formData, cutLength: val});
          }} placeholder="How many units was the cut" className="input-premium w-full font-bold" aria-required="true" />
          <label htmlFor="cutLengthUnit" className="sr-only">Length Unit</label>
          <select id="cutLengthUnit" value={formData.cutLengthUnit} onChange={e => setFormData({...formData, cutLengthUnit: e.target.value})} className="input-premium w-auto bg-white dark:bg-slate-700 font-bold">
            <option value="m">Meters (m)</option>
            <option value="ft">Feet (ft)</option>
          </select>
        </div>
      </div>

      <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
        <div className="mb-2">
            <button onClick={onImportCalculator} className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-3xl hover:bg-emerald-700 btn-tactile">📥 Import from Calculator (Mark or Stop)</button>
        </div>
        <label htmlFor="startingMark" className="block text-xs font-semibold mb-1 header-gradient uppercase">Starting Mark</label>
        <div className="flex items-center space-x-1">
          <input id="startingMark" type="number" value={formData.startingMark || ''} onChange={e => setFormData({...formData, startingMark: parseFloat(e.target.value)})} placeholder="Starting unit" className="input-premium w-full font-bold" disabled={formData.isNoMarks} />
          <label htmlFor="startingMarkUnit" className="sr-only">Starting Mark Unit</label>
          <select id="startingMarkUnit" value={formData.startingMarkUnit} onChange={e => setFormData({...formData, startingMarkUnit: e.target.value})} className="input-premium w-auto dark:bg-slate-700 font-bold" disabled={formData.isNoMarks}>
            <option value="m">m</option>
            <option value="ft">ft</option>
          </select>
        </div>
      </div>

      <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
        <label htmlFor="endingMark" className="block text-xs font-semibold mb-1 header-gradient uppercase">Ending Mark</label>
        <input id="endingMark" type="number" value={formData.endingMark || ''} onChange={e => setFormData({...formData, endingMark: parseFloat(e.target.value)})} placeholder="Leave blank for single unit cuts" className="input-premium w-full font-bold" disabled={formData.isNoMarks || formData.isSingleUnitCut} />
        <p className="text-[10px] text-gray-500 mt-1 italic">Uses same unit as Starting Mark. Leave blank for single unit cuts</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: 'singleUnitCut', label: 'Single Unit Cut', description: 'Check for single unit cuts - auto-fills length to 1' },
          { id: 'fullPick', label: 'Full Pick', description: 'Check if this is a full pick, bypassing marks' },
          { id: 'noMarks', label: 'No Marks', description: 'Check if there are no marks on the wire' },
          { id: 'systemCut', label: 'System Cut', description: 'Check for system cuts without order number' },
          { id: 'cutInSystem', label: 'Cut In System', description: 'Check for cuts that are part of the system' }
        ].map(field => (
          <div key={field.id} className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex flex-col">
            <label htmlFor={field.id} className="flex items-center space-x-2 cursor-pointer">
                <input id={field.id} type="checkbox" checked={!!(formData as any)[field.id]} onChange={e => {
                    const checked = e.target.checked;
                    const updates: any = { [field.id]: checked };
                    if (field.id === 'singleUnitCut' && checked) {
                        updates.cutLength = 1;
                        updates.endingMark = null;
                    }
                    if (field.id === 'noMarks' && checked) {
                        updates.startingMark = null;
                        updates.endingMark = null;
                        updates.isSingleUnitCut = false;
                    }
                    if (field.id === 'systemCut' && checked) {
                        updates.orderNumber = '';
                        updates.customerName = '';
                    }
                    setFormData({...formData, ...updates});
                }} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-xs font-bold header-gradient uppercase">{field.label}</span>
            </label>
            <p className="text-[9px] text-gray-500 mt-1 leading-tight">{field.description}</p>
          </div>
        ))}
      </div>

      <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="lineCode" className="block text-xs font-semibold mb-1 header-gradient uppercase">Cut From Line Code</label>
                <input id="lineCode" value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()})} placeholder="001 or A" maxLength={3} className="input-premium w-full font-bold" />
            </div>
            <div>
                <label htmlFor="turnedToLineCode" className="block text-xs font-semibold mb-1 header-gradient uppercase">Turned To Line Code</label>
                <input id="turnedToLineCode" value={formData.turnedToLineCode} onChange={e => setFormData({...formData, turnedToLineCode: e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()})} placeholder="001 or A" maxLength={3} className="input-premium w-full font-bold" />
            </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex-1">
            <label htmlFor="coilOrReel" className="block text-xs font-semibold mb-1 header-gradient uppercase">Coil or Reel</label>
            <select id="coilOrReel" value={formData.coilOrReel} onChange={e => {
                const val = e.target.value;
                setFormData({...formData, coilOrReel: val, reelSize: val === 'coil' ? null : formData.reelSize});
            }} className="input-premium w-full bg-white dark:bg-slate-700 font-bold text-gray-900">
                <option value="coil">Coil</option>
                <option value="reel">Reel</option>
            </select>
        </div>

        <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex-1">
            <label htmlFor="reelSize" className="block text-xs font-semibold mb-1 header-gradient uppercase">Reel Size</label>
            <div className="flex items-center space-x-2">
                <input id="reelSize" type="number" value={formData.reelSize || ''} onChange={e => setFormData({...formData, reelSize: parseInt(e.target.value)})} placeholder="40" min="0" step="1" className={`input-premium flex-grow font-bold ${!isReel && 'bg-gray-100 dark:bg-slate-900 cursor-not-allowed opacity-50'}`} disabled={!isReel} />
                <button onClick={onImportReel} disabled={!isReel} className="px-2 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-3xl btn-tactile disabled:opacity-50">📥 Import</button>
            </div>
        </div>

        <div className="shadow-xl rounded-3xl p-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex-1">
            <label htmlFor="chargeable" className="block text-xs font-semibold mb-1 header-gradient uppercase">Chargeable</label>
            <select id="chargeable" value={formData.chargeable} onChange={e => setFormData({...formData, chargeable: e.target.value})} disabled={!isReel} className={`input-premium w-full bg-white dark:bg-slate-700 font-bold text-gray-900 ${!isReel && 'bg-gray-100 dark:bg-slate-900 cursor-not-allowed opacity-50'}`}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default SingleCutForm;
