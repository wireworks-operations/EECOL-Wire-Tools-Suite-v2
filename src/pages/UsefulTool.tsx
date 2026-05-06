import React from 'react';

const UsefulTool: React.FC = () => {
  const sections = [
    {
      title: 'Precision Matters',
      text: 'Every millimeter counts in high-stakes electrical projects. Our tools ensure that mark consistency is maintained across every cut, reducing waste and increasing reliability.',
      icon: '🎯'
    },
    {
      title: 'Operational Efficiency',
      text: 'By centralizing records and calculations, we eliminate the need for manual logs and error-prone mental math, allowing workshop professionals to focus on quality execution.',
      icon: '⚡'
    },
    {
      title: 'Local-First Reliability',
      text: 'Industrial environments can be unpredictable. Our suite works 100% offline, ensuring that your data and tools are always available, regardless of connectivity.',
      icon: '🛡️'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 animate-entrance pb-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
           <h1 className="text-4xl font-black header-gradient uppercase tracking-tighter">Is This Tool Useful?</h1>
           <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Why we built the EECOL Wire Tools Suite.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {sections.map(s => (
             <div key={s.title} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-eecol-blue/10 text-center space-y-4 hover:scale-105 transition-transform">
                <div className="text-5xl">{s.icon}</div>
                <h3 className="text-xl font-black header-gradient uppercase">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{s.text}</p>
             </div>
           ))}
        </div>

        <div className="bg-eecol-blue rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-black uppercase italic">Built for the Workshop Floor</h2>
              <p className="text-blue-100 text-lg max-w-2xl">
                The suite was developed to solve real-world problems faced by wire and cable professionals.
                From complex reel capacity estimations to simple daily maintenance checklists,
                every feature is designed to be tactile, responsive, and reliable.
              </p>
              <div className="flex gap-4">
                 <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
                    <div className="text-2xl font-black">100%</div>
                    <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Offline Capable</div>
                 </div>
                 <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
                    <div className="text-2xl font-black">ZERO</div>
                    <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Data Collection</div>
                 </div>
              </div>
           </div>
           <div className="absolute -bottom-24 -right-24 text-[20rem] opacity-5 select-none pointer-events-none">🛠️</div>
        </div>
      </div>
    </div>
  );
};

export default UsefulTool;
