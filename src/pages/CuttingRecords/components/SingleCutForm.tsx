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
      <div className="shadow-md rounded-xl p-2 bg-white dark:bg-slate-800">
        <label className="block text-xs font-semibold mb-1 header-gradient">Length Cut</label>
        <div className="flex space-x-1">
          <input type="number" value={formData.cutLength || ''} onChange={e => setFormData({...formData, cutLength: parseFloat(e.target.value)})} placeholder="How many units was the cut" className="input-premium w-full" />
          <select value={formData.cutLengthUnit} onChange={e => setFormData({...formData, cutLengthUnit: e.target.value})} className="input-premium w-auto bg-white dark:bg-slate-700">
            <option value="m">Meters (m)</option>
            <option value="ft">Feet (ft)</option>
          </select>
        </div>
      </div>

      <div className="shadow-md rounded-xl p-2 bg-white dark:bg-slate-800">
        <button onClick={onImportCalculator} className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 btn-tactile mb-2">📥 Import from Calculator</button>
        <label className="block text-xs font-semibold mb-1 header-gradient">Starting Mark</label>
        <div className="flex items-center space-x-1">
          <input type="number" value={formData.startingMark || ''} onChange={e => setFormData({...formData, startingMark: parseFloat(e.target.value)})} placeholder="Starting unit" className="input-premium w-full" disabled={formData.isNoMarks} />
          <select value={formData.startingMarkUnit} onChange={e => setFormData({...formData, startingMarkUnit: e.target.value})} className="input-premium w-auto dark:bg-slate-700" disabled={formData.isNoMarks}>
            <option value="m">m</option>
            <option value="ft">ft</option>
          </select>
        </div>
      </div>

      <div className="shadow-md rounded-xl p-2 bg-white dark:bg-slate-800">
        <label className="block text-xs font-semibold mb-1 header-gradient">Ending Mark</label>
        <input type="number" value={formData.endingMark || ''} onChange={e => setFormData({...formData, endingMark: parseFloat(e.target.value)})} placeholder="Blank for single unit cuts" className="input-premium w-full" disabled={formData.isNoMarks || formData.isSingleUnitCut} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {['isSingleUnitCut', 'isFullPick', 'isNoMarks', 'isSystemCut', 'isCutInSystem'].map(field => (
          <label key={field} className="flex items-center space-x-2 shadow-sm p-2 rounded bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 cursor-pointer">
            <input type="checkbox" checked={!!(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-[10px] font-bold header-gradient">{field.replace('is', '').replace(/([A-Z])/g, ' $1')}</span>
          </label>
        ))}
      </div>

      <div className="shadow-md rounded-xl p-2 bg-white dark:bg-slate-800 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold mb-1 header-gradient">Cut From Line</label>
          <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} placeholder="e.g. A" className="input-premium w-full" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 header-gradient">Turned To Line</label>
          <input value={formData.turnedToLineCode} onChange={e => setFormData({...formData, turnedToLineCode: e.target.value.toUpperCase()})} placeholder="e.g. B" className="input-premium w-full" />
        </div>
      </div>

      <div className="shadow-md rounded-xl p-2 bg-white dark:bg-slate-800 flex flex-col gap-2">
        <div className="flex gap-2">
           <select value={formData.coilOrReel} onChange={e => setFormData({...formData, coilOrReel: e.target.value})} className="input-premium flex-1 dark:bg-slate-700">
             <option value="coil">Coil</option><option value="reel">Reel</option>
           </select>
           <input type="number" value={formData.reelSize || ''} onChange={e => setFormData({...formData, reelSize: parseInt(e.target.value)})} placeholder="Reel Size" className={`input-premium flex-1 ${!isReel && 'bg-gray-100 dark:bg-slate-900 opacity-50'}`} disabled={!isReel} />
        </div>
        {isReel && <button onClick={onImportReel} className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded btn-tactile">📥 Import from Reel Estimator</button>}
      </div>
    </div>
  );
};

export default SingleCutForm;
