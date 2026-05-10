import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Calibration: React.FC = () => {
  const machines = [
    'Manual Hand Coiler', 'Green Elec Coiler', 'Blue Elec Coiler',
    'Telus Machine', 'Big B1 Machine', 'Big B2 Machine'
  ];

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-solid border-eecol-blue relative text-left">
        <div className="flex justify-center mb-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-xl eecol-logo-tilt">
            <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-3 text-center header-gradient uppercase tracking-tighter">Machine Counter Calibration</h1>
        <p className="mb-5 text-center text-sm font-medium text-eecol-blue uppercase">Calibration Measurement Records for Counting Devices</p>

        <div className="flex justify-center gap-4 mb-6 no-print">
            <Link to="/maintenance" className="px-6 py-3 bg-blue-500 text-white font-bold rounded-3xl shadow-xl btn-tactile text-lg no-underline">📋 Main Checklist</Link>
        </div>

        <div className="space-y-6">
            {machines.map(m => (
                <div key={m} className="p-4 bg-gray-50 border-l-8 border-eecol-blue rounded-3xl shadow-xl space-y-4">
                    <h3 className="text-lg font-bold header-gradient uppercase">{m}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Measured Length (Tape)</label>
                            <input type="number" placeholder="0.00" className="input-premium w-full font-bold" />
                        </div>
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Counter Reading</label>
                            <input type="number" placeholder="0.00" className="input-premium w-full font-bold" />
                        </div>
                        <div className="bg-white p-3 rounded-3xl shadow-inner border border-gray-200">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Variance (%)</label>
                            <div className="text-xl font-black text-eecol-blue">0.00%</div>
                        </div>
                    </div>
                    <button className="w-full bg-emerald-600 text-white font-bold py-2 rounded-3xl shadow btn-tactile uppercase text-xs">Save Calibration Point</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Calibration;
