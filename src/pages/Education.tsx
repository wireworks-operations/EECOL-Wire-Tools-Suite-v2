import React from 'react';
import { Link } from 'react-router-dom';

const Education: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 text-center relative overflow-hidden">
            <div className="flex justify-center mb-6">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-xl eecol-logo-tilt">
                    <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2"/>
                    <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                    <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                    <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                    <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                </svg>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 header-gradient uppercase tracking-tighter">EECOL Learning Hub</h1>
            <p className="text-lg text-gray-700 font-medium mb-2">Professional Wire Tools Education Platform</p>
            <p className="text-base text-eecol-blue font-semibold opacity-90 uppercase">Master cutting excellence through theory, tools, and best practices</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4 hover:-translate-y-2 transition-transform">
                <div className="text-5xl text-center">📚</div>
                <h2 className="text-xl font-bold text-eecol-blue text-center uppercase">Wire Tools Foundation</h2>
                <p className="text-xs text-gray-600 text-center">Comprehensive guide to all suite calculators, features, and usage instructions.</p>
                <div className="bg-blue-50 p-3 rounded-3xl text-[10px] space-y-1">
                    <div className="font-bold text-blue-700 uppercase">Includes:</div>
                    <div className="text-gray-600">• Tool descriptions</div>
                    <div className="text-gray-600">• Usage instructions</div>
                    <div className="text-gray-600">• Best practices</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4 opacity-60">
                <div className="text-5xl text-center">✂️</div>
                <h2 className="text-xl font-bold text-gray-500 text-center uppercase">Precision Cutting</h2>
                <p className="text-xs text-gray-500 text-center italic">Advanced techniques for mark consistency and multi-cut optimization.</p>
                <div className="text-center"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase">Coming Soon</span></div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
                <div className="text-5xl text-center">🧮</div>
                <h2 className="text-xl font-bold text-eecol-blue text-center uppercase">Engineering Reference</h2>
                <p className="text-xs text-gray-600 text-center">Advanced mathematics for cable reel capacity and volumetric weight estimation.</p>
                <Link to="/advanced-math" className="block text-center text-[10px] font-black text-blue-600 uppercase hover:underline">View Formulas →</Link>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 space-y-4">
                <div className="text-5xl text-center">🏠</div>
                <h2 className="text-xl font-bold text-eecol-blue text-center uppercase">Back to Tools</h2>
                <p className="text-xs text-gray-600 text-center">Return to the main suite for calculators, records, and planning tools.</p>
                <Link to="/" className="block text-center py-2 bg-eecol-blue text-white rounded-3xl text-[10px] font-black uppercase shadow-xl">Main Suite</Link>
            </div>
        </div>

        <div className="mx-4 p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl shadow-2xl border border-white text-center space-y-6">
            <h2 className="text-3xl font-bold text-eecol-blue uppercase tracking-tight">🚀 Ready to Use Your Tools?</h2>
            <p className="text-gray-700 max-w-2xl mx-auto">Return to the EECOL Wire Tools Suite for professional calculators, inventory management, and cutting operations.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cutting-records" className="px-6 py-3 bg-white border-2 border-eecol-blue text-eecol-blue font-bold rounded-3xl shadow-xl hover:bg-eecol-blue hover:text-white transition-all uppercase text-sm no-underline">📊 Start Cutting Records</Link>
                <Link to="/inventory-records" className="px-6 py-3 bg-white border-2 border-eecol-blue text-eecol-blue font-bold rounded-3xl shadow-xl hover:bg-eecol-blue hover:text-white transition-all uppercase text-sm no-underline">📦 Start Inventory Records</Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Education;
