import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center p-2 animate-entrance overflow-y-auto pb-24 text-left">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-black mb-3 header-gradient uppercase tracking-tighter">Privacy & Security Policy</h1>
            <p className="mb-5 text-sm font-medium text-eecol-blue">How we protect your data and ensure compliance with privacy regulations.</p>
        </div>

        <section className="p-6 bg-green-50 border border-green-200 rounded-3xl shadow-xl">
            <h2 className="text-xl font-bold text-green-800 mb-4 uppercase">🚀 Version 0.8.0.0 - Enterprise Privacy Update</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-green-700 mb-1">🛡️ Enterprise Security</h4>
                    <p className="text-green-600">No third-party backends - complete independence</p>
                </div>
                <div className="bg-white p-3 rounded border">
                    <h4 className="font-semibold text-green-700 mb-1">📱 PWA Control</h4>
                    <p className="text-green-600">Installable app with offline capabilities</p>
                </div>
            </div>
        </section>

        <section className="p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-eecol-blue mb-4 uppercase">🛡️ Privacy Commitment</h2>
            <p className="text-sm text-gray-700 mb-4 italic">The EECOL Wire Tools Suite v0.9.0 prioritizes enterprise-grade privacy and data security. Your data remains under your control within trusted networks.</p>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-eecol-blue uppercase">📊 No External Data Collection</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                    <li>✅ No personal information collected (name, email, IP address)</li>
                    <li>✅ No analytics or tracking technologies</li>
                    <li>✅ No third-party data sharing or backend services</li>
                </ul>
            </div>
        </section>

        <section className="p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-eecol-blue mb-4 uppercase">💾 Local Data Storage</h2>
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-eecol-blue uppercase">Enterprise Storage Policy</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                    <li>✅ All data stored in browser IndexedDB with full data integrity</li>
                    <li>✅ Data accessible only within your local machine/network</li>
                    <li>✅ Comprehensive data export/import and backup capabilities</li>
                </ul>
            </div>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
