import React from 'react';

const UsefulTool: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-2 animate-entrance pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black header-gradient uppercase tracking-tighter">About & Feedback</h1>
          <p className="text-lg font-bold text-eecol-blue mt-2">Learn about the EECOL Wire Tools Suite and share your thoughts.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl border border-eecol-blue/10 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-6">About the EECOL Wire Tools Suite</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-8 text-lg font-medium">
              Enterprise wire processing operations powered by modern P2P architecture, enabling real-time collaboration across local networks, and offline-first functionality for industrial cable management.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '📱', title: 'Installable PWA', desc: 'Native app experience' },
                { icon: '⚡', title: 'Offline-First', desc: 'Works without internet' },
                { icon: '🎯', title: 'Precision', desc: 'Accurate measurements' },
                { icon: '⭐', title: 'User-Friendly', desc: 'Intuitive interface' }
              ].map(feature => (
                <div key={feature.title} className="text-center space-y-2">
                  <div className="text-4xl">{feature.icon}</div>
                  <div className="text-[10px] font-black uppercase text-eecol-blue">{feature.title}</div>
                  <div className="text-[10px] font-bold text-gray-400">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <div className="text-[15rem]">💡</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-eecol-blue rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-black uppercase tracking-widest mb-4 italic">Share Your Feedback</h2>
                <p className="text-blue-100 mb-6 text-sm">Your input helps me enhance our tools and better serve our wire room operations.</p>
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">📧</div>
                      <div>
                         <div className="text-[10px] font-black uppercase opacity-60">Email Contact</div>
                         <div className="font-bold">lucas.kara@eecol.com</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">💬</div>
                      <div>
                         <div className="text-[10px] font-black uppercase opacity-60">Microsoft Teams</div>
                         <div className="font-bold">Available for messaging</div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 text-[12rem] opacity-10">✉️</div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-black uppercase tracking-widest mb-4 italic">Project Background</h2>
                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                   <p><span className="font-black text-white">The Conversion Conundrum:</span> Solving recurring issues with feet-to-meter conversions that proved cumbersome and prone to error.</p>
                   <p><span className="font-black text-white">Cut Optimization:</span> Eliminating guesswork and preventing inefficient back-reeling at the machine.</p>
                   <p><span className="font-black text-white">AI Collaboration:</span> Developed with the assistance of advanced AI technology, specifically our custom collaborator Cline.</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 text-[12rem] opacity-10">🏗️</div>
           </div>
        </div>

        <div className="text-center pt-8 border-t border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest pb-12">
           EECOL Wire Tools Suite - Commitment to Operational Excellence
        </div>
      </div>
    </div>
  );
};

export default UsefulTool;
