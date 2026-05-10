import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const ReelLabels: React.FC = () => {
  const { db } = useDatabase();
  const [formData, setFormData] = useState({
    wireId: '', length: '', lengthUnit: 'm',
    lineCode: '', coreDiameter: '', flangeDiameter: '', traverseWidth: '',
    coreUnit: 'in', flangeUnit: 'in', traverseUnit: 'in'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Reel Inventory Labels</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Create simple, large-format labels for reel inventory identification.</p>
        </div>

        <div className="shadow-xl rounded-3xl p-4 bg-white border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-eecol-blue text-center uppercase">🏷️ Label Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Wire ID <span className="text-red-500">*</span></label>
                    <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} placeholder="TK6/3CU" className="input-premium w-full font-bold uppercase text-sm" required />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Length <span className="text-red-500">*</span></label>
                    <div className="flex space-x-1">
                        <input value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} placeholder="500" className="input-premium w-full font-bold text-sm" required />
                        <select value={formData.lengthUnit} onChange={e => setFormData({...formData, lengthUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="m">m</option><option value="ft">ft</option></select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Line Code <span className="text-red-500">*</span></label>
                    <input value={formData.lineCode} onChange={e => setFormData({...formData, lineCode: e.target.value.toUpperCase()})} placeholder="L:A" maxLength={6} className="input-premium w-full font-bold uppercase text-sm" required />
                </div>
            </div>
        </div>

        <div className="shadow-xl rounded-3xl p-4 bg-white border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-eecol-blue text-center uppercase">📏 Reel Dimensions (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Core Diameter</label>
                    <div className="flex space-x-1">
                        <input value={formData.coreDiameter} onChange={e => setFormData({...formData, coreDiameter: e.target.value})} placeholder="0" className="input-premium w-full text-sm font-bold" />
                        <select value={formData.coreUnit} onChange={e => setFormData({...formData, coreUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Flange Diameter</label>
                    <div className="flex space-x-1">
                        <input value={formData.flangeDiameter} onChange={e => setFormData({...formData, flangeDiameter: e.target.value})} placeholder="0" className="input-premium w-full text-sm font-bold" />
                        <select value={formData.flangeUnit} onChange={e => setFormData({...formData, flangeUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Traverse Width</label>
                    <div className="flex space-x-1">
                        <input value={formData.traverseWidth} onChange={e => setFormData({...formData, traverseWidth: e.target.value})} placeholder="0" className="input-premium w-full text-sm font-bold" />
                        <select value={formData.traverseUnit} onChange={e => setFormData({...formData, traverseUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="in">in</option><option value="cm">cm</option></select>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 px-2 flex justify-center">
            <button onClick={handlePrint} className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-3xl shadow-xl btn-tactile text-sm uppercase">🖨️ Print Reel Label</button>
        </div>
      </div>
    </div>
  );
};

export default ReelLabels;
