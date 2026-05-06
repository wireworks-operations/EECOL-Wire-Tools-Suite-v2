import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const [undoStack, setUndoStack] = useState<T[]>([]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const updateState = useCallback((newState: T) => {
    setUndoStack(prev => [...prev.slice(-19), state]);
    setRedoStack([]);
    setState(newState);
  }, [state]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(prevRedo => [...prevRedo, state]);
    setUndoStack(prevUndo => prevUndo.slice(0, -1));
    setState(prev);
    return prev;
  }, [state, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prevUndo => [...prevUndo, state]);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
    setState(next);
    return next;
  }, [state, redoStack]);

  return { state, setState: updateState, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0, undoCount: undoStack.length };
}
