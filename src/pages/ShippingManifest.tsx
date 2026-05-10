import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const ShippingManifest: React.FC = () => {
  const { db } = useDatabase();
  const [formData, setFormData] = useState({
    customerName: '', date: new Date().toISOString().split('T')[0],
    wireId: '', targetAmount: '', targetAmountUnit: 'm',
    orderNumber: '', weight: '', weightUnit: 'lbs',
    coreDiameter: '', flangeDiameter: '', traverseWidth: '',
    coreUnit: 'in', flangeUnit: 'in', traverseUnit: 'in',
    customDetails: ''
  });

  const handlePrint = () => {
    window.print();
  };

  const handleAutoPull = async () => {
    if (!db) return;
    const records = await db.getAll('cuttingRecords');
    if (records.length > 0) {
        const last = records.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
        setFormData({
            ...formData,
            customerName: last.customerName || '',
            wireId: last.wireId || '',
            targetAmount: last.cutLength?.toString() || '',
            targetAmountUnit: last.cutLengthUnit || 'm',
            orderNumber: last.orderNumber || ''
        });
        alert('Last order details pulled from records.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Shipping Manifest Generator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Create professional reel labels for shipping with integrated hazardous materials documentation.</p>
        </div>

        <div className="shadow-xl rounded-3xl p-4 bg-white border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-eecol-blue text-center uppercase">📏 Reel Dimensions</h3>
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

        <div className="shadow-xl rounded-3xl p-4 bg-white border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-eecol-blue text-center uppercase">👤 Shipping Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Customer Name / Branch</label>
                    <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} placeholder="EECOL CUSTOMER" className="input-premium w-full font-bold uppercase text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-premium w-full font-bold text-sm" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Wire ID</label>
                    <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} placeholder="TK6/3CU" className="input-premium w-full font-bold uppercase text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Reel Amount</label>
                    <div className="flex space-x-1">
                        <input value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} placeholder="Quantity" className="input-premium w-full font-bold text-sm" />
                        <select value={formData.targetAmountUnit} onChange={e => setFormData({...formData, targetAmountUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="m">m</option><option value="ft">ft</option></select>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Order # / IBT #</label>
                    <input value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value.toUpperCase()})} placeholder="1234567" maxLength={7} className="input-premium w-full font-bold uppercase text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Weight</label>
                    <div className="flex space-x-1">
                        <input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="Full Weight" className="input-premium w-full font-bold text-sm" />
                        <select value={formData.weightUnit} onChange={e => setFormData({...formData, weightUnit: e.target.value})} className="input-premium w-auto bg-white font-bold"><option value="lbs">lbs</option><option value="kg">kg</option></select>
                    </div>
                </div>
            </div>
        </div>

        <div className="shadow-xl rounded-3xl p-4 bg-white border border-gray-100">
            <h3 className="text-lg font-bold mb-3 text-eecol-blue text-center uppercase">📝 Additional Details</h3>
            <textarea value={formData.customDetails} onChange={e => setFormData({...formData, customDetails: e.target.value})} placeholder="Special instructions..." className="input-premium w-full font-bold h-20 text-sm" />
        </div>

        <div className="pt-2 px-2 flex flex-col sm:flex-row gap-2">
            <button onClick={handleAutoPull} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-3xl shadow-xl btn-tactile text-sm uppercase">📋 Auto-pull Last Order</button>
            <button onClick={handlePrint} className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-3xl shadow-xl btn-tactile text-sm uppercase">🖨️ Print Reel Label</button>
        </div>
      </div>
    </div>
  );
};

export default ShippingManifest;
