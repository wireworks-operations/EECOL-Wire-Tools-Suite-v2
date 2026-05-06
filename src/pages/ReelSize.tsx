import React, { useState } from 'react';
import { METERS_TO_FEET } from './ReelCapacity/utils/logic';

const ReelSize: React.FC = () => {
  const [inputs, setInputs] = useState({
    wireD: 0.25, targetLength: 500, efficiency: 0.85, freeboard: 0.5
  });
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    // Legacy logic for "Optimal" Reel Size
    // Df = sqrt((L * d^2) / (0.262 * efficiency * 0.75)) + dc
    // Simplified model assuming Core = 0.5 * Flange and Traverse = 0.6 * Flange
    const targetFt = inputs.targetLength * METERS_TO_FEET;
    const dSq = inputs.wireD * inputs.wireD;

    // Theoretical optimal flange size
    const optimalFlange = Math.pow((targetFt * dSq) / (0.262 * inputs.efficiency * 0.6), 1/3);
    const optimalCore = optimalFlange * 0.5;
    const optimalTraverse = optimalFlange * 0.6;

    setResult({
      flange: optimalFlange,
      core: optimalCore,
      traverse: optimalTraverse,
      layers: Math.floor((optimalFlange - optimalCore) / (2 * inputs.wireD))
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Reel Size Estimator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Find the optimal reel size for your wire capacity requirements.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10">
          <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4">Wire Specifications</h2>

          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Wire/Cable Diameter (d)</label>
                <input type="number" value={inputs.wireD} onChange={e => setInputs({...inputs, wireD: Number(e.target.value)})} className="input-premium w-full font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Target Length</label>
                <div className="flex gap-2">
                  <input type="number" value={inputs.targetLength} onChange={e => setInputs({...inputs, targetLength: Number(e.target.value)})} className="input-premium flex-1 font-bold" />
                  <span className="flex items-center text-[10px] font-bold text-gray-400">meters</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Winding Efficiency</label>
                <select value={inputs.efficiency} onChange={e => setInputs({...inputs, efficiency: Number(e.target.value)})} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                  <option value={0.8}>80% (Safe)</option>
                  <option value={0.85}>85% (Standard)</option>
                  <option value={0.9}>90% (Tight)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Freeboard Clearance</label>
                <input type="number" value={inputs.freeboard} onChange={e => setInputs({...inputs, freeboard: Number(e.target.value)})} className="input-premium w-full font-bold" />
              </div>
            </div>

            <button onClick={calculate} className="w-full bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs mt-2">
              Find Optimal Reel Size
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 animate-entrance">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4 text-center">Reel Size Analysis</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 text-center">
                <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Flange Diameter</p>
                <p className="text-xl font-black text-blue-800 dark:text-white">{result.flange.toFixed(1)}"</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 text-center">
                <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Core Diameter</p>
                <p className="text-xl font-black text-blue-800 dark:text-white">{result.core.toFixed(1)}"</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 text-center">
                <p className="text-[8px] font-black text-blue-700 uppercase mb-1">Traverse Width</p>
                <p className="text-xl font-black text-blue-800 dark:text-white">{result.traverse.toFixed(1)}"</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 mb-6">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Theoretical Layers</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">{result.layers}</span>
               </div>
               <p className="text-[10px] text-slate-400 leading-relaxed italic">
                 Note: These are mathematically ideal dimensions and may not correspond to industry standard reel sizes.
               </p>
            </div>

            <button onClick={() => window.print()} className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-3 rounded-xl text-[10px] uppercase">
              Print Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelSize;
