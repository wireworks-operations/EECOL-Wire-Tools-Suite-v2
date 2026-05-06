import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';

interface ImportReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (reelSize: number) => void;
}

const ImportReelModal: React.FC<ImportReelModalProps> = ({ isOpen, onClose, onImport }) => {
  const { db, isReady } = useDatabase();
  const [reelHistory, setReelHistory] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (isOpen && isReady && db) {
      loadHistory();
    }
  }, [isOpen, isReady, db]);

  const loadHistory = async () => {
    try {
      const records = await db!.getAll('reelcapacityEstimator');
      setReelHistory(
        records
          .filter((r: any) => r.flangeDiameter && r.flangeDiameter.value)
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleImport = () => {
    const selected = reelHistory.find(h => h.id === selectedId);
    if (selected) {
      // Logic from legacy: convert to inches
      const flangeValue = parseFloat(selected.flangeDiameter.value);
      const flangeUnit = selected.flangeDiameter.unit;

      let convertedValue = flangeValue;
      if (flangeUnit !== 'in') {
        if (flangeUnit === 'cm') convertedValue = flangeValue / 2.54;
        else if (flangeUnit === 'm') convertedValue = flangeValue / 0.0254;
        else if (flangeUnit === 'ft') convertedValue = flangeValue * 12;
      }

      onImport(Math.round(convertedValue));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-entrance">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-eecol-blue/20 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-black header-gradient uppercase tracking-tight">Import from Reel Estimator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold header-gradient uppercase block">Saved Reel Configurations</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="input-premium w-full bg-white dark:bg-slate-700 text-xs"
            >
              <option value="">Select a saved flange size...</option>
              {reelHistory.map(h => (
                <option key={h.id} value={h.id}>
                  Flange: {h.flangeDiameter.value}{h.flangeDiameter.unit} ({new Date(h.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
            <button
              onClick={handleImport}
              disabled={!selectedId}
              className="w-full bg-eecol-blue text-white font-bold py-2 rounded-xl text-[10px] uppercase btn-tactile disabled:opacity-50"
            >
              Import Flange Size
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
          <button onClick={onClose} className="text-[10px] font-bold text-gray-500 uppercase hover:underline">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ImportReelModal;
