import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';

interface ImportCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { startMark: number; endMark: number; unit: string }) => void;
}

const ImportCalculatorModal: React.FC<ImportCalculatorModalProps> = ({ isOpen, onClose, onImport }) => {
  const { db, isReady } = useDatabase();
  const [markHistory, setMarkHistory] = useState<any[]>([]);
  const [stopHistory, setStopHistory] = useState<any[]>([]);
  const [selectedMarkId, setSelectedMarkId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');

  useEffect(() => {
    if (isOpen && isReady && db) {
      loadHistory();
    }
  }, [isOpen, isReady, db]);

  const loadHistory = async () => {
    try {
      const [markRecords, stopRecords] = await Promise.all([
        db!.getAll('markConverter'),
        db!.getAll('stopmarkConverter')
      ]);

      setMarkHistory(
        markRecords
          .filter((r: any) => r.startMark !== undefined && r.endMark !== undefined)
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 5)
      );

      setStopHistory(
        stopRecords
          .filter((r: any) => r.startMark !== undefined && r.endMark !== undefined)
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleImportMark = () => {
    const selected = markHistory.find(h => h.id === selectedMarkId);
    if (selected) {
      onImport({ startMark: selected.startMark, endMark: selected.endMark, unit: selected.unit });
      onClose();
    }
  };

  const handleImportStop = () => {
    const selected = stopHistory.find(h => h.id === selectedStopId);
    if (selected) {
      onImport({ startMark: selected.startMark, endMark: selected.endMark, unit: selected.unit });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-entrance">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-eecol-blue/20 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-black header-gradient uppercase tracking-tight">Import from Calculators</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold header-gradient uppercase block">Wire Mark Calculator History</label>
            <select
              value={selectedMarkId}
              onChange={(e) => setSelectedMarkId(e.target.value)}
              className="input-premium w-full bg-white dark:bg-slate-700 text-xs"
            >
              <option value="">Select a saved calculation...</option>
              {markHistory.map(h => (
                <option key={h.id} value={h.id}>
                  {h.startMark}{h.unit} to {h.endMark}{h.unit} ({new Date(h.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
            <button
              onClick={handleImportMark}
              disabled={!selectedMarkId}
              className="w-full bg-eecol-blue text-white font-bold py-2 rounded-xl text-[10px] uppercase btn-tactile disabled:opacity-50"
            >
              Import Marks
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold header-gradient uppercase block">Stop Mark Calculator History</label>
            <select
              value={selectedStopId}
              onChange={(e) => setSelectedStopId(e.target.value)}
              className="input-premium w-full bg-white dark:bg-slate-700 text-xs"
            >
              <option value="">Select a saved calculation...</option>
              {stopHistory.map(h => (
                <option key={h.id} value={h.id}>
                  {h.startMark}{h.unit} to {h.endMark}{h.unit} ({new Date(h.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
            <button
              onClick={handleImportStop}
              disabled={!selectedStopId}
              className="w-full bg-purple-600 text-white font-bold py-2 rounded-xl text-[10px] uppercase btn-tactile disabled:opacity-50"
            >
              Import Stop Marks
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

export default ImportCalculatorModal;
