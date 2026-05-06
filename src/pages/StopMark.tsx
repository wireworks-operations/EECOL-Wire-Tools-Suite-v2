import React, { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const StopMarkCalculator: React.FC = () => {
  const { db } = useDatabase();
  const [startValue, setStartValue] = useState(0);
  const [startUnit, setStartUnit] = useState<'m' | 'ft'>('m');
  const [cutLength, setCutLength] = useState(0);
  const [cutLengthUnit, setCutLengthUnit] = useState<'m' | 'ft'>('m');
  const [reference, setReference] = useState<'tip' | 'one-meter' | 'custom'>('tip');
  const [customOffset, setCustomOffset] = useState(0);
  const [customOffsetUnit, setCustomOffsetUnit] = useState<'m' | 'ft'>('m');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [counterDistance, setCounterDistance] = useState(0);
  const [counterDistanceUnit, setCounterDistanceUnit] = useState<'m' | 'ft'>('m');
  const [result, setResult] = useState<{ stopMark: number; visualMark: number } | null>(null);

  const calculate = () => {
    const METERS_TO_FEET = 3.28084;

    // Normalize all to feet for internal calculation
    const toFt = (val: number, unit: 'm' | 'ft') => unit === 'm' ? val * METERS_TO_FEET : val;
    const fromFt = (val: number, unit: 'm' | 'ft') => unit === 'm' ? val / METERS_TO_FEET : val;

    const startFt = toFt(startValue, startUnit);
    const lengthFt = toFt(cutLength, cutLengthUnit);

    // Handle Reference Offset
    let offsetFt = 0;
    if (reference === 'one-meter') {
      offsetFt = toFt(1, startUnit); // 1 meter or 1 foot based on start unit
    } else if (reference === 'custom') {
      offsetFt = toFt(customOffset, customOffsetUnit);
    }

    // Adjust start position based on offset
    // If mark is 1m in, the "actual" mark at the tip is start - 1m (for counting up)
    const adjustedStartFt = direction === 'up' ? startFt - offsetFt : startFt + offsetFt;

    // Calculate theoretical stop mark (at the counter)
    const stopFt = direction === 'up' ? adjustedStartFt + lengthFt : adjustedStartFt - lengthFt;

    // Calculate visual mark (at the reel)
    const distFt = toFt(counterDistance, counterDistanceUnit);
    const visualFt = direction === 'up' ? stopFt - distFt : stopFt + distFt;

    setResult({
      stopMark: fromFt(stopFt, startUnit),
      visualMark: fromFt(visualFt, startUnit)
    });
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black header-gradient uppercase tracking-tighter">EECOL Wire Cut Stop Mark Tool</h1>
          <p className="text-sm font-bold text-eecol-blue mt-1">Calculate the stopping mark using flexible input and output units.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-eecol-blue rounded-xl mb-6">
            <p className="text-[10px] font-black text-eecol-blue uppercase tracking-wider leading-relaxed">
              CUT MARK PROTOCOL: For <span className="underline">Scenario 1 (Mark at Tip)</span>, always prefer to cut <span className="font-bold">JUST BEFORE</span> the next mark digit to maintain mark consistency. See Knowledgebase for Scenario 2 details.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Starting Mark on Wire</label>
                <div className="flex gap-2">
                  <input type="number" value={startValue} onChange={e => setStartValue(Number(e.target.value))} className="input-premium flex-1 text-lg font-bold" placeholder="0" />
                  <select value={startUnit} onChange={e => setStartUnit(e.target.value as any)} className="input-premium w-24 font-bold bg-white dark:bg-slate-700">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Length to Cut</label>
                <div className="flex gap-2">
                  <input type="number" value={cutLength} onChange={e => setCutLength(Number(e.target.value))} className="input-premium flex-1 text-lg font-bold" placeholder="0" />
                  <select value={cutLengthUnit} onChange={e => setCutLengthUnit(e.target.value as any)} className="input-premium w-24 font-bold bg-white dark:bg-slate-700">
                    <option value="m">Meters (m)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Marking Reference (Relative to Machine Zero)</label>
              <select value={reference} onChange={e => setReference(e.target.value as any)} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                <option value="tip">At the Tip (No Offset)</option>
                <option value="one-meter">1 Unit In (1m or 1ft offset)</option>
                <option value="custom">Custom Offset Value</option>
              </select>
              <p className="text-[9px] text-gray-400 mt-1 italic ml-1">The offset unit is based on the 'Starting Mark' unit.</p>
            </div>

            {reference === 'custom' && (
              <div className="animate-entrance">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Custom Offset Value & Unit</label>
                <div className="flex gap-2">
                  <input type="number" value={customOffset} onChange={e => setCustomOffset(Number(e.target.value))} className="input-premium flex-1 font-bold" />
                  <select value={customOffsetUnit} onChange={e => setCustomOffsetUnit(e.target.value as any)} className="input-premium w-24 font-bold bg-white dark:bg-slate-700">
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Marking Direction</label>
                <select value={direction} onChange={e => setDirection(e.target.value as any)} className="input-premium w-full font-bold bg-white dark:bg-slate-700">
                  <option value="up">Counting Up (Additive)</option>
                  <option value="down">Counting Down (Subtractive)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Counter-to-Reel Distance</label>
                <div className="flex gap-2">
                  <input type="number" value={counterDistance} onChange={e => setCounterDistance(Number(e.target.value))} className="input-premium flex-1 font-bold" placeholder="0" />
                  <select value={counterDistanceUnit} onChange={e => setCounterDistanceUnit(e.target.value as any)} className="input-premium w-24 font-bold bg-white dark:bg-slate-700">
                    <option value="m">m</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => {setStartValue(0); setCutLength(0); setResult(null);}} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-4 rounded-2xl text-xs uppercase transition-colors">
                Clear
              </button>
              <button onClick={calculate} className="flex-[3] bg-eecol-blue text-white font-black py-4 rounded-2xl btn-tactile uppercase shadow-lg text-xs">
                Calculate Stopping Mark
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-eecol-blue/10 animate-entrance">
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-4 text-center">Stop Mark Analysis</h2>

            <div className="space-y-4">
              <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-3xl border-2 border-green-500 text-center shadow-inner">
                <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase mb-1">Stopping Mark</p>
                <p className="text-4xl font-black text-green-700 dark:text-white">{result.stopMark.toFixed(3)} {startUnit}</p>
              </div>

              <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-3xl border-2 border-orange-500 text-center shadow-inner">
                <p className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase mb-1">Visual Reference (At Reel)</p>
                <p className="text-2xl font-black text-orange-700 dark:text-white">Mark Location: {result.visualMark.toFixed(3)} {startUnit}</p>
              </div>
            </div>

            <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 mb-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                <span>⚙️</span> Mechanism Explanation
              </h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed italic">
                Mark at Counter: The exact point on the wire currently at the counter sensor.
                <br />
                Conversion Factor Used: 1 m ≈ 3.28084 ft
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white font-black py-3 rounded-xl text-[10px] uppercase hover:bg-slate-200 transition-colors">
                Print Results
              </button>
              <button onClick={save} className="flex-[2] bg-emerald-600 text-white font-black py-3 rounded-xl text-[10px] uppercase btn-tactile shadow-lg shadow-emerald-600/20">
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
