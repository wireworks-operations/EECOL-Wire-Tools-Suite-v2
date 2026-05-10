import React from 'react';

const UsefulTool: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-black mb-3 header-gradient uppercase tracking-tighter">About & Feedback</h1>
            <p className="mb-5 text-sm font-medium text-eecol-blue">Learn about the EECOL Wire Tools Suite and share your thoughts.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">💡</div>
                <h2 className="text-xl font-bold text-eecol-blue uppercase">About the EECOL Wire Tools Suite</h2>
            </div>
            <p className="text-sm text-gray-700 mb-4"><strong>Enterprise wire processing operations</strong> powered by modern architecture and offline-first functionality for industrial cable management.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-eecol-light-blue p-3 rounded-3xl"><div className="text-xl mb-1">📱</div><div className="text-[10px] font-black uppercase text-eecol-blue">Installable</div></div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl"><div className="text-xl mb-1">⚡</div><div className="text-[10px] font-black uppercase text-eecol-blue">Offline-First</div></div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl"><div className="text-xl mb-1">🎯</div><div className="text-[10px] font-black uppercase text-eecol-blue">Precision</div></div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl"><div className="text-xl mb-1">⭐</div><div className="text-[10px] font-black uppercase text-eecol-blue">User-Friendly</div></div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl"><div className="text-xl mb-1">💰</div><div className="text-[10px] font-black uppercase text-eecol-blue">Efficient</div></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-green-400">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📧</div>
                <h2 className="text-xl font-bold text-eecol-blue uppercase">Share Your Feedback</h2>
            </div>
            <div className="bg-green-50 p-4 rounded-3xl">
                <h3 className="text-sm font-bold text-green-800 mb-2 uppercase">📤 Contact Information</h3>
                <div className="bg-white p-3 rounded border flex justify-between items-center">
                    <div>
                        <div className="font-bold text-green-700">Lucas Kara</div>
                        <div className="text-[10px] text-gray-600">Langley Main Branch</div>
                    </div>
                    <a href="mailto:lucas.kara@eecol.com" className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded uppercase no-underline">📧 Email</a>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-amber-400">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🔍</div>
                <h2 className="text-xl font-bold text-eecol-blue uppercase">Project Background</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>The initial motivation for this tool was to solve a recurring issue with feet-to-meter conversions that proved cumbersome and prone to error. Respecting specific digit-markings ensures accuracy and removes risk of human error.</p>
                <p>Addressing inconveniences at the reeler machine, the stop-mark calculator eliminates guesswork and ensures clean presentation of finished spools.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UsefulTool;
