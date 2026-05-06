import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-entrance p-4">
      <div className="max-w-2xl mx-auto w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-eecol-blue/10">
        <h1 className="text-3xl font-black header-gradient mb-6 uppercase text-center">Privacy Policy</h1>

        <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-2">Data Sovereignty</h2>
            <p>
              The EECOL Wire Tools Suite is built on a <span className="font-bold text-gray-900 dark:text-white">Local-First</span> architecture.
              This means all your data (cutting records, inventory, settings) is stored exclusively in your browser's local storage (IndexedDB).
            </p>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-2">Information We Do Not Collect</h2>
            <p>
              We do not use any tracking cookies, analytics scripts, or external databases. We do not have access to your records, customer names, or operational data.
              Your data never leaves your device unless you explicitly perform an export or manual backup.
            </p>
          </section>

          <section>
            <h2 className="text-[10px] font-black text-eecol-blue dark:text-blue-400 uppercase tracking-widest mb-2">Cloud Sync & P2P</h2>
            <p>
              Future synchronization features will utilize end-to-end encrypted peer-to-peer protocols. No central server will ever store your unencrypted operational data.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-700 text-[10px] text-center font-bold text-gray-400 uppercase">
            Effective Date: January 1, 2025 | Version 0.8.0.4
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
