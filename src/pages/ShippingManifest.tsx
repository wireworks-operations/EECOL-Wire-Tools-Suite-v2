import React, { useState } from 'react';
import { _esc, _openPrint, formatPrintTimestamp } from '../utils/print/core';

const ShippingManifest: React.FC = () => {
  const [formData, setFormData] = useState({
    customerName: '', wireId: '', orderNumber: '', date: new Date().toISOString().split('T')[0],
    amount: '', weight: '', comments: ''
  });

  const handlePrint = () => {
    const html = `
      <div style="padding: 40px; border: 8px solid #0058B3; border-radius: 20px; max-width: 800px; margin: 0 auto; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0058B3; padding-bottom: 20px; margin-bottom: 30px;">
              <div>
                  <h1 style="color: #0058B3; font-size: 48px; font-weight: 900; margin: 0; line-height: 1;">EECOL</h1>
                  <p style="color: #0058B3; font-size: 16px; font-weight: bold; margin: 0; letter-spacing: 2px;">WIRE & CABLE SERVICE</p>
              </div>
              <div style="text-align: right;">
                  <p style="font-size: 12px; font-weight: bold; color: #64748b; margin: 0;">SHIPPING MANIFEST</p>
                  <p style="font-size: 18px; font-weight: 900; margin: 0;"># ${_esc(formData.orderNumber)}</p>
              </div>
          </div>

          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 30px;">
              <div>
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Customer / Consignee</label>
                  <p style="font-size: 24px; font-weight: 900; margin: 0;">${_esc(formData.customerName)}</p>
              </div>
              <div style="text-align: right;">
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Date Processed</label>
                  <p style="font-size: 20px; font-weight: 700; margin: 0;">${_esc(formData.date)}</p>
              </div>
              <div style="grid-column: span 2; background: #f8fafc; padding: 20px; border-radius: 10px; border: 2px solid #e2e8f0;">
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #0058B3; text-transform: uppercase; margin-bottom: 10px;">Product Identification</label>
                  <p style="font-size: 32px; font-weight: 900; margin: 0; color: #1e293b;">${_esc(formData.wireId)}</p>
              </div>
              <div>
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Net Length</label>
                  <p style="font-size: 28px; font-weight: 900; margin: 0;">${_esc(formData.amount)}</p>
              </div>
              <div style="text-align: right;">
                  <label style="display: block; font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Est. Total Weight</label>
                  <p style="font-size: 28px; font-weight: 900; margin: 0;">${_esc(formData.weight)}</p>
              </div>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end;">
              <div style="font-size: 10px; color: #94a3b8; font-style: italic;">
                  Verified for Shipment: ${formatPrintTimestamp()}
              </div>
              <div style="text-align: center;">
                  <div style="width: 200px; border-bottom: 2px solid #1e293b; margin-bottom: 5px;"></div>
                  <p style="font-size: 8px; font-weight: 900; text-transform: uppercase; margin: 0;">Authorized Signature</p>
              </div>
          </div>
      </div>
    `;
    _openPrint('EECOL Shipping Label', html);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20">
        <h1 className="text-2xl font-black header-gradient text-center mb-6 uppercase">Shipping Manifest / Label</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Customer Name</label>
              <input value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Order #</label>
              <input value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-premium w-full" />
           </div>
           <div className="col-span-2">
              <label className="text-[10px] font-bold header-gradient uppercase">Wire ID</label>
              <input value={formData.wireId} onChange={e => setFormData({...formData, wireId: e.target.value.toUpperCase()})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Amount</label>
              <input value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-premium w-full" />
           </div>
           <div>
              <label className="text-[10px] font-bold header-gradient uppercase">Est. Weight</label>
              <input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="input-premium w-full" />
           </div>
        </div>

        <button onClick={handlePrint} className="w-full bg-eecol-blue text-white font-bold py-3 rounded-xl btn-tactile mt-6 uppercase">Print Shipping Label</button>
      </div>
    </div>
  );
};

export default ShippingManifest;
