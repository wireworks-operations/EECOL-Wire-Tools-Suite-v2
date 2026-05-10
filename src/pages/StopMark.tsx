import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const StopMarkCalculator: React.FC = () => {
  const { db } = useDatabase();
  const [startValue, setStartValue] = useState(0);
  const [startUnit, setStartUnit] = useState<'m' | 'ft'>('m');
  const [cutLength, setCutLength] = useState(0);
  const [cutLengthUnit, setCutLengthUnit] = useState<'m' | 'ft'>('m');
  const [reference, setReference] = useState<'zero' | 'offset_meter' | 'offset_foot' | 'custom'>('zero');
  const [customOffset, setCustomOffset] = useState(0);
  const [customOffsetUnit, setCustomOffsetUnit] = useState<'m' | 'ft'>('m');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [counterDistance, setCounterDistance] = useState(0);
  const [counterDistanceUnit, setCounterDistanceUnit] = useState<'m' | 'ft'>('m');
  const [result, setResult] = useState<{ stopMark: number; visualMark: number } | null>(null);

  const calculate = () => {
    const METERS_TO_FEET = 3.28084;

    // Normalize all to base unit (m or ft based on start unit)
    const toBase = (val: number, unit: 'm' | 'ft') => {
        if (unit === startUnit) return val;
        return unit === 'm' ? val * METERS_TO_FEET : val / METERS_TO_FEET;
    };

    const start = startValue;
    const length = toBase(cutLength, cutLengthUnit);

    // Handle Reference Offset
    let offset = 0;
    if (reference === 'offset_meter') {
      offset = toBase(1, 'm');
    } else if (reference === 'offset_foot') {
      offset = toBase(1, 'ft');
    } else if (reference === 'custom') {
      offset = toBase(customOffset, customOffsetUnit);
    }

    // Adjust start position based on offset
    const adjustedStart = direction === 'up' ? start - offset : start + offset;

    // Calculate theoretical stop mark (at the counter)
    const stopMark = direction === 'up' ? adjustedStart + length : adjustedStart - length;

    // Calculate visual mark (at the reel)
    const dist = toBase(counterDistance, counterDistanceUnit);
    const visualMark = direction === 'up' ? stopMark - dist : stopMark + dist;

    setResult({ stopMark, visualMark });
  };

  const save = async () => {
    if (!db || !result) return;
    await db.put('stopmarkConverter', {
      id: crypto.randomUUID(),
      startMark: startValue,
      endMark: result.stopMark,
      unit: startUnit,
      timestamp: Date.now()
    });
    alert('Saved for Cutting Records.');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Cut Stop Mark Tool</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Calculate the stopping mark using flexible input and output units.</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border-2 border-solid border-eecol-blue space-y-4">
          <div className="p-3 bg-indigo-50/70 border-l-4 border-indigo-500 rounded-3xl shadow-xl">
            <p className="text-xs font-semibold text-indigo-800">
              CUT MARK PROTOCOL: For <strong>Scenario 1 (Mark at Tip)</strong>, always prefer to cut <strong>JUST BEFORE</strong> the next mark digit to maintain mark consistency. See Knowledgebase for Scenario 2 details.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="shadow-xl rounded-3xl p-2 bg-white">
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Starting Mark on Wire</label>
              <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={startValue} onChange={e => setStartValue(Number(e.target.value))} className="input-premium flex-1 font-bold text-sm" placeholder="0" />
                <select value={startUnit} onChange={e => setStartUnit(e.target.value as any)} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                  <option value="m">Meters (m)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white">
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Length to Cut</label>
              <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={cutLength} onChange={e => setCutLength(Number(e.target.value))} className="input-premium flex-1 font-bold text-sm" placeholder="0" />
                <select value={cutLengthUnit} onChange={e => setCutLengthUnit(e.target.value as any)} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                  <option value="m">Meters (m)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white flex flex-col gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Marking Reference (Relative to Machine Zero)</label>
                <select value={reference} onChange={e => setReference(e.target.value as any)} className="input-premium w-full font-bold bg-white text-eecol-blue text-sm">
                  <option value="zero">At the Tip (No Offset)</option>
                  <option value="offset_meter">1 Meter In (1 Meter Offset)</option>
                  <option value="offset_foot">1 Foot In (1 Foot Offset)</option>
                  <option value="custom">Custom Offset</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 italic">The offset unit (1 ft or 1 m) is based on the 'Starting Mark' unit.</p>
              </div>
              <div className={`flex-1 ${reference !== 'custom' && 'invisible'}`}>
                <label className="block text-xs font-semibold mb-1 text-eecol-blue">Custom Offset Value & Unit</label>
                <div className="flex space-x-1">
                  <input type="number" value={customOffset} onChange={e => setCustomOffset(Number(e.target.value))} className="input-premium flex-1 font-bold text-sm" placeholder="Value" disabled={reference !== 'custom'} />
                  <select value={customOffsetUnit} onChange={e => setCustomOffsetUnit(e.target.value as any)} className="input-premium flex-auto font-bold bg-white text-eecol-blue text-sm" disabled={reference !== 'custom'}>
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white">
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Marking Direction</label>
              <select value={direction} onChange={e => setDirection(e.target.value as any)} className="input-premium w-full font-bold bg-white text-eecol-blue text-sm">
                <option value="up">Counting Up (Additive)</option>
                <option value="down">Counting Down (Subtractive)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1 italic">Determines if the cut length is added to or subtracted from the starting mark.</p>
            </div>

            <div className="shadow-xl rounded-3xl p-2 bg-white">
              <label className="block text-xs font-semibold mb-1 text-eecol-blue uppercase">Counter-to-Reel Distance</label>
              <div className="flex flex-col sm:flex-row sm:space-x-1 sm:space-y-0 space-y-1">
                <input type="number" value={counterDistance} onChange={e => setCounterDistance(Number(e.target.value))} className="input-premium flex-1 font-bold text-sm" placeholder="0" />
                <select value={counterDistanceUnit} onChange={e => setCounterDistanceUnit(e.target.value as any)} className="input-premium w-full sm:w-auto font-bold bg-white text-eecol-blue text-sm">
                  <option value="m">Meters (m)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1 italic">Distance between counter sensor and reel spooling point.</p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button onClick={calculate} className="w-full bg-eecol-blue hover:bg-eecol-blue-light text-white font-bold p-3 rounded-3xl shadow-xl btn-tactile text-sm uppercase">
                Calculate Stopping Mark
              </button>
              <button onClick={() => {setStartValue(0); setCutLength(0); setResult(null);}} className="px-3 py-2 bg-white border-2 border-eecol-blue text-eecol-blue font-bold rounded-3xl shadow-xl btn-tactile text-sm">
                Clear
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="p-4 bg-white border-l-8 border-eecol-blue rounded-3xl shadow-xl animate-entrance space-y-4">
            <h3 className="text-lg font-bold text-eecol-blue text-center uppercase">Stop Mark Analysis</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 text-center">
              <p className="text-sm font-bold text-gray-600 mb-1">Stopping Mark</p>
              <p className="text-3xl font-black text-eecol-blue">{result.stopMark.toFixed(3)} {startUnit}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">
                ({startUnit === 'm' ? (result.stopMark * 3.28084).toFixed(3) + ' ft' : (result.stopMark * 0.3048).toFixed(3) + ' m'})
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-3 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Visual Reference (At Reel)</p>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-gray-700">Mark Location:</span>
                <span className="text-xl font-bold text-eecol-blue">{result.visualMark.toFixed(3)} {startUnit}</span>
              </div>
              <p className="text-xs text-right text-gray-500 mt-1 italic">
                ({startUnit === 'm' ? (result.visualMark * 3.28084).toFixed(3) + ' ft' : (result.visualMark * 0.3048).toFixed(3) + ' m'})
              </p>
            </div>

            <p className="text-[10px] text-gray-700 text-center italic">Conversion Factor Used: 1 m ≈ 3.28084 ft</p>

            <div className="flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-eecol-blue text-white font-bold py-3 rounded-3xl text-sm btn-tactile shadow-xl">
                Print Results
              </button>
              <button onClick={save} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-3xl text-sm btn-tactile shadow-xl">
                Save for Cutting Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StopMarkCalculator;
