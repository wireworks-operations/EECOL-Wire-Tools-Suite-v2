import React from 'react';

const AdvancedMath: React.FC = () => (
  <div className="flex-1 flex flex-col items-center p-4 animate-entrance pb-24">
    <div className="w-full max-w-4xl bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-eecol-blue/20 text-left">
      <h1 className="text-3xl font-black header-gradient text-center mb-4 uppercase">Advanced Engineering Mathematics</h1>
      <p className="text-center text-eecol-blue dark:text-blue-300 font-bold mb-8 uppercase text-xs">Technical Foundation for Cable Reel Estimation</p>

      <div className="space-y-8">
        <section className="border-l-4 border-amber-500 pl-4">
          <h2 className="text-xl font-black text-amber-700 dark:text-amber-400 mb-2 uppercase">Geometric Modeling</h2>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl font-mono text-sm">
             <p className="font-bold text-lg mb-2">F = (H + B) × H × T × 0.262</p>
             <ul className="text-xs space-y-1">
                <li><strong>H</strong> = Traverse Height (Flange - Barrel)/2</li>
                <li><strong>B</strong> = Barrel Diameter</li>
                <li><strong>T</strong> = Traverse Width</li>
                <li><strong>0.262</strong> = Volume to Length Conversion Factor</li>
             </ul>
          </div>
        </section>

        <section className="border-l-4 border-purple-500 pl-4">
          <h2 className="text-xl font-black text-purple-700 dark:text-purple-400 mb-2 uppercase">Material Science</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-bold text-purple-800 dark:text-purple-300">Copper</p>
                <p className="text-[10px]">8.89 g/cm³</p>
             </div>
             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-bold text-purple-800 dark:text-purple-300">Aluminum</p>
                <p className="text-[10px]">2.70 g/cm³</p>
             </div>
             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-bold text-purple-800 dark:text-purple-300">PVC</p>
                <p className="text-[10px]">1.40 g/cm³</p>
             </div>
             <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <p className="font-bold text-purple-800 dark:text-purple-300">XLPE</p>
                <p className="text-[10px]">0.92 g/cm³</p>
             </div>
          </div>
          <div className="mt-4 bg-gray-50 dark:bg-slate-700 p-4 rounded-xl font-mono text-sm">
             <p className="font-bold text-lg mb-1">Wc = 340.5 × D² × G</p>
             <p className="text-[10px] opacity-75">Conductor weight per 1000 ft (lbs)</p>
          </div>
        </section>

        <section className="border-l-4 border-teal-500 pl-4">
          <h2 className="text-xl font-black text-teal-700 dark:text-teal-400 mb-2 uppercase">Precision Conversions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <p className="text-[10px] font-bold uppercase mb-1">Feet to Meters</p>
                <p className="text-lg font-black text-teal-800 dark:text-white">1 ft = 0.3048 m</p>
             </div>
             <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <p className="text-[10px] font-bold uppercase mb-1">Meters to Feet</p>
                <p className="text-lg font-black text-teal-800 dark:text-white">1 m = 3.28084 ft</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);

export default AdvancedMath;
