import React, { useState, useMemo } from 'react';

const WEIGHT_TABLE: Record<string, Record<string, number>> = {
  'ACWU90': { '6/3': 640, '4/3': 880, '2/3': 1200, '1/3': 1450, '1/0-3': 1750, '2/0-3': 2100, '3/0-3': 2500, '4/0-3': 3000, '250-3': 3500 },
  'TECK90 CU': { '14/3': 280, '12/3': 350, '10/3': 450, '8/3': 700, '6/3': 950, '4/3': 1300, '2/3': 1850 },
  'RW90 CU': { '14': 25, '12': 35, '10': 55, '8': 95, '6': 140, '4': 210, '2': 310, '1/0': 480, '4/0': 850, '500': 1850 },
  'SOOW': { '14/3': 175, '12/3': 225, '10/3': 310, '8/3': 550, '6/3': 750 }
};

const WeightCalculator: React.FC = () => {
  const [inputs, setInputs] = useState({
    length: 500, lengthUnit: 'm',
    cableType: '', designation: '',
    reelTare: 0, reelTareUnit: 'lbs',
    skidTare: 0, skidTareUnit: 'lbs'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculation = useMemo(() => {
    const unitWeight = WEIGHT_TABLE[inputs.cableType]?.[inputs.designation] || 0;
    const lenFt = inputs.lengthUnit === 'm' ? inputs.length * 3.28084 : inputs.length;
    const wireWeightLbs = (lenFt / 1000) * unitWeight;

    const reelLbs = inputs.reelTareUnit === 'kg' ? inputs.reelTare * 2.20462 : inputs.reelTare;
    const skidLbs = inputs.skidTareUnit === 'kg' ? inputs.skidTare * 2.20462 : inputs.skidTare;

    const totalLbs = wireWeightLbs + reelLbs + skidLbs;

    return { wireWeightLbs, totalLbs, unitWeight };
  }, [inputs]);

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6 text-left">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Weight Calculator</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Estimate the weight of wire based on length and specifications.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-eecol-blue mb-3 uppercase">Wire Specifications and Length</h3>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Known Length</label>
            <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={inputs.length} onChange={e => setInputs({...inputs, length: Number(e.target.value)})} className="input-premium flex-1 font-bold text-sm" />
                <select value={inputs.lengthUnit} onChange={e => setInputs({...inputs, lengthUnit: e.target.value})} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                </select>
            </div>
          </div>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Cable Type</label>
            <select value={inputs.cableType} onChange={e => setInputs({...inputs, cableType: e.target.value, designation: ''})} className="input-premium w-full font-bold bg-white text-eecol-blue text-sm">
                <option value="">-- Select Cable Type --</option>
                {Object.keys(WEIGHT_TABLE).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Size / Conductor Count / Material</label>
            <select value={inputs.designation} onChange={e => setInputs({...inputs, designation: e.target.value})} disabled={!inputs.cableType} className={`input-premium w-full font-bold bg-white text-eecol-blue text-sm ${!inputs.cableType && 'bg-gray-100 cursor-not-allowed'}`}>
                <option value="">-- Select Designation (e.g., 14/3CU) --</option>
                {inputs.cableType && Object.keys(WEIGHT_TABLE[inputs.cableType]).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Reel/Drum Tare Weight</label>
            <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={inputs.reelTare} onChange={e => setInputs({...inputs, reelTare: Number(e.target.value)})} className="input-premium flex-1 font-bold text-sm" placeholder="0" />
                <select value={inputs.reelTareUnit} onChange={e => setInputs({...inputs, reelTareUnit: e.target.value})} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                </select>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 italic">Enter weight of empty reel. Unit conversions are automatic.</p>
          </div>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Skid Tare Weight</label>
            <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={inputs.skidTare} onChange={e => setInputs({...inputs, skidTare: Number(e.target.value)})} className="input-premium flex-1 font-bold text-sm" placeholder="0" />
                <select value={inputs.skidTareUnit} onChange={e => setInputs({...inputs, skidTareUnit: e.target.value})} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                </select>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 italic">Enter weight of empty skid. Unit conversions are automatic.</p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button className="flex-1 bg-eecol-blue text-white font-bold p-3 rounded-3xl shadow-xl btn-tactile text-sm uppercase">Calculate Total Weights</button>
            <button onClick={() => setInputs({length: 500, lengthUnit: 'm', cableType: '', designation: '', reelTare: 0, reelTareUnit: 'lbs', skidTare: 0, skidTareUnit: 'lbs'})} className="sm:w-1/3 bg-gray-200 text-eecol-blue font-bold p-3 rounded-3xl shadow-xl btn-tactile text-sm uppercase">Clear</button>
          </div>

          <div className="shadow-xl rounded-3xl p-2 bg-white border border-gray-100">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full text-left font-semibold text-eecol-blue flex justify-between items-center py-2 px-2 hover:bg-blue-50 rounded-3xl transition duration-150">
                <span className="text-sm">Advanced Settings</span>
                <span className="text-lg">{showAdvanced ? '▼' : '►'}</span>
            </button>
            {showAdvanced && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-eecol-blue animate-entrance">
                    <p className="text-xs text-eecol-blue font-medium italic">🔬 Advanced settings for custom component specifications and engineering calculations are available in the full version.</p>
                </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="p-4 bg-white border-l-8 border-eecol-blue rounded-3xl shadow-xl text-center space-y-4">
            <div>
                <p className="text-sm font-medium text-gray-700 uppercase">Total Shipment Weight (Wire + Reel + Skid)</p>
                <p className="text-4xl font-extrabold mt-1 text-red-600">{calculation.totalLbs.toFixed(1)} lbs</p>
                <p className="text-md font-semibold mt-1 text-red-400">({(calculation.totalLbs * 0.453592).toFixed(1)} kg)</p>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-eecol-blue uppercase">Estimated Wire Weight Only</p>
                <p className="text-2xl font-bold mt-1 text-eecol-blue">{calculation.wireWeightLbs.toFixed(1)} lbs</p>
                <p className="text-sm font-semibold mt-1 text-gray-700">({(calculation.wireWeightLbs * 0.453592).toFixed(1)} kg)</p>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 uppercase">Unit Weight (Approx.)</p>
                <p className="text-lg font-bold text-blue-700">{calculation.unitWeight || '--'} lbs/1000ft</p>
            </div>

            <p className="text-[10px] text-gray-700 italic">Weight calculations use a standard conversion factor.</p>

            <button onClick={() => window.print()} className="w-full bg-eecol-blue text-white font-bold py-2 rounded-3xl text-sm btn-tactile shadow-xl">Print Results</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalculator;
