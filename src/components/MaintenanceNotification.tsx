import React, { useEffect, useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';

const MaintenanceNotification: React.FC = () => {
  const { db, isReady } = useDatabase();
  const [status, setStatus] = useState<{ icon: string; bg: string; text: string } | null>(null);

  useEffect(() => {
    if (isReady && db) {
      checkStatus();
    }
  }, [isReady, db]);

  const checkStatus = async () => {
    try {
      const data = await db!.getAll<any>('maintenanceLogs');
      const today = new Date().toISOString().split('T')[0];
      const dailyCheck = data.find((log: any) => log.id === today || log.id === 'daily_check');

      if (!dailyCheck || !dailyCheck.completedAt) {
        setStatus({ icon: '❌', bg: 'bg-red-100 border-red-500', text: 'Daily Machine Maintenance: Not Completed' });
        return;
      }

      const completedAt = new Date(dailyCheck.completedAt);
      const now = new Date();
      const cycleStart = new Date(now);
      cycleStart.setHours(23, 0, 0, 0);
      if (now.getHours() < 23) cycleStart.setDate(cycleStart.getDate() - 1);

      if (completedAt > cycleStart) {
        setStatus({ icon: '✅', bg: 'bg-green-100 border-green-500', text: 'Daily Machine Maintenance: Completed' });
      } else {
        setStatus({ icon: '❌', bg: 'bg-red-100 border-red-500', text: 'Daily Machine Maintenance: Not Completed' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!status) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg shadow-md border-l-4 ${status.bg} flex items-center`}>
      <div className="text-2xl mr-3">{status.icon}</div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-eecol-blue mb-1">Maintenance Status</h3>
        <p className="text-sm text-gray-700">{status.text}</p>
      </div>
    </div>
  );
};

export default MaintenanceNotification;
