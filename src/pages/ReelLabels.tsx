import React, { useState } from 'react';
import { _esc, _openPrint, formatPrintTimestamp } from '../utils/print/core';

const ReelLabels: React.FC = () => {
  const [formData, setFormData] = useState({ wireId: '', length: '', unit: 'm', lineCode: '' });

  const handlePrint = () => {
    const html = `
      <div style="padding: 20px; text-align: center; border: 15px solid #0058B3; border-radius: 40px; min-height: 500px; display: flex; flex-direction: column; justify-content: center; position: relative;">
          <div style="position: absolute; top: 30px; left: 0; right: 0; color: #0058B3; font-weight: 900; font-size: 24px; letter-spacing: 5px;">EECOL WIRE TOOLS</div>

          <h1 style="color: #0058B3; font-size: 90px; font-weight: 900; margin: 40px 0 10px 0; line-height: 1;">${_esc(formData.wireId.toUpperCase())}</h1>
          <div style="width: 200px; height: 10px; background: #0058B3; margin: 0 auto 30px auto;"></div>

          <h2 style="font-size: 70px; font-weight: 900; margin: 0;">${_esc(formData.length)} <span style="font-size: 40px;">${_esc(formData.unit)}</span></h2>

          <div style="margin-top: 50px;">
              <span style="background: #0058B3; color: white; padding: 10px 40px; border-radius: 15px; font-size: 50px; font-weight: 900;">
                  LINE: ${_esc(formData.lineCode.toUpperCase())}
              </span>
          </div>

          <div style="position: absolute; bottom: 30px; left: 0; right: 0; font-size: 10px; color: #94a3b8; font-style: italic;">
              Generated: ${formatPrintTimestamp()} | Workshop Resource
          </div>
      </div>
    `;
    _openPrint('EECOL Large Reel Label', html);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Reel Inventory Labels</h1>

        <div className="space-y-4 text-left">
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Wire ID</label>
              <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Length</label>
              <div className="flex gap-1">
                <input value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="input-premium flex-1" />
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="input-premium w-20 dark:bg-slate-700"><option value="m">m</option><option value="ft">ft</option></select>
              </div>
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Line #</label>
              <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} className="input-premium w-full" maxLength={3} />
           </div>

           <button onClick={handlePrint} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-2 uppercase">Generate Large Label</button>
        </div>
      </div>
    </div>
  );
};

export default ReelLabels;
