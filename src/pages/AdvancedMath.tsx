import React from 'react';

const AdvancedMath: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-4xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">Advanced Mathematics For Reel Estimation</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Advanced Engineering Model for Cable Reel Capacity and Volumetric Weight Estimation.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📊</div>
                <h2 className="text-xl font-bold text-eecol-blue">Technical Foundation for Cable Estimation</h2>
            </div>
            <p className="text-sm text-gray-700 mb-4"><strong>Precision engineering</strong> drives efficient cable logistics, enabling accurate prediction of reel capacity and shipping weight.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-eecol-light-blue p-3 rounded-3xl">
                    <div className="text-2xl mb-1">📏</div>
                    <div className="text-sm font-semibold text-eecol-blue">Geometric Analysis</div>
                    <div className="text-xs text-gray-600">Reel dimensions & packing</div>
                </div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl">
                    <div className="text-2xl mb-1">⚖️</div>
                    <div className="text-sm font-semibold text-eecol-blue">Material Science</div>
                    <div className="text-xs text-gray-600">Weight by component</div>
                </div>
                <div className="bg-eecol-light-blue p-3 rounded-3xl">
                    <div className="text-2xl mb-1">🔄</div>
                    <div className="text-sm font-semibold text-eecol-blue">Unit Conversion</div>
                    <div className="text-xs text-gray-600">Metric ↔ Imperial sync</div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-amber-400">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📏</div>
                <h2 className="text-xl font-bold text-eecol-blue">Cable Reel Geometry</h2>
            </div>
            <div className="bg-yellow-50 p-4 rounded-3xl mb-4">
                <h3 className="text-lg font-semibold text-amber-800 mb-2">📐 Key Dimensions</h3>
                <ul className="text-sm space-y-2">
                    <li><strong>DF</strong> = Flange Diameter (reel outside edge)</li>
                    <li><strong>DB</strong> = Barrel Diameter (central hub)</li>
                    <li><strong>T</strong> = Traverse Width (reel face width)</li>
                    <li><strong>H</strong> = Traverse Height = (DF - DB)/2</li>
                    <li><strong>Dc</strong> = Cable Outer Diameter</li>
                </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-3xl mb-4 text-center">
                <h3 className="text-lg font-semibold text-eecol-blue mb-3">Reel Factor Calculation</h3>
                <div className="text-lg font-bold text-amber-700 mb-2">F = (H+B) × H × T × 0.262</div>
                <p className="text-sm text-gray-600 italic">Where 0.262 converts cubic inches to feet conversion factor</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-3xl text-center">
                <h3 className="text-lg font-semibold text-eecol-blue mb-3 uppercase">Maximum Cable Length</h3>
                <div className="text-lg font-bold text-eecol-blue mb-2">Lmax = Dc² / F</div>
                <p className="text-sm text-gray-600 italic">Capacity is inversely proportional to diameter squared</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-purple-400">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">⚖️</div>
                <h2 className="text-xl font-bold text-eecol-blue">Material Science & Weight Calculations</h2>
            </div>
            <div className="bg-purple-50 p-4 rounded-3xl mb-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">📊 Material Density Reference</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-2 rounded border text-center">
                        <div className="font-bold text-amber-700">Copper</div>
                        <div className="text-xs">8.89 g/cm³</div>
                    </div>
                    <div className="bg-white p-2 rounded border text-center">
                        <div className="font-bold text-blue-700">Aluminum</div>
                        <div className="text-xs">2.70 g/cm³</div>
                    </div>
                    <div className="bg-white p-2 rounded border text-center">
                        <div className="font-bold text-gray-700">PVC</div>
                        <div className="text-xs">1.40 g/cm³</div>
                    </div>
                    <div className="bg-white p-2 rounded border text-center">
                        <div className="font-bold text-green-700">XLPE</div>
                        <div className="text-xs">0.92 g/cm³</div>
                    </div>
                </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-3xl text-center">
                <h3 className="text-lg font-semibold text-eecol-blue mb-3">Conductor Weight Formula</h3>
                <div className="text-lg font-bold text-purple-700 mb-1">Wc = 340.5 × D² × G</div>
                <p className="text-xs text-gray-600 mb-2 italic">Weight per 1000 feet (lbs)</p>
                <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400 text-xs italic">
                    <p>Stranded conductors require 3% more material (K = 1.03):</p>
                    <p className="font-bold mt-1">WSC = Wc × 1.03</p>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-teal-400">
            <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🔄</div>
                <h2 className="text-xl font-bold text-eecol-blue">Unit Conversion & Implementation</h2>
            </div>
            <div className="bg-teal-50 p-4 rounded-3xl grid grid-cols-2 gap-4 text-center">
                <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-bold text-teal-700">Feet → Meters</div>
                    <div className="text-xs text-gray-600">1 ft = 0.3048 m</div>
                </div>
                <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-bold text-teal-700">Meters → Feet</div>
                    <div className="text-xs text-gray-600">1 m ≈ 3.28084 ft</div>
                </div>
            </div>
            <div className="bg-gray-100 p-4 rounded-3xl mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">✅ Implementation Essentials</h3>
                <ul className="text-sm space-y-2 list-disc ml-4">
                    <li><strong>Geometric Modeling:</strong> Use Reel Factor (F) and inverse square diameter relationship</li>
                    <li><strong>Safety Factor:</strong> Apply η = 0.80 for real-world winding efficiency</li>
                    <li><strong>Unit Precision:</strong> Use exact International Foot (0.3048m) for conversions</li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMath;
