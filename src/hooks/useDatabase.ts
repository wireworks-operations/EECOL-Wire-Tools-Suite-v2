import { useEffect, useState } from 'react';
import { EECOLIndexedDB } from '../services/database/core';

export function useDatabase() {
  const [db, setDb] = useState<EECOLIndexedDB | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const instance = EECOLIndexedDB.getInstance();
    instance.isReady()
      .then(() => setDb(instance))
      .catch(err => setError(err));
  }, []);

  return { db, error, isReady: !!db };
}
