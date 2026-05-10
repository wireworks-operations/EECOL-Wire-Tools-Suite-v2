import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="p-3 sm:p-6 min-h-screen flex flex-col">
      <div className={`flex-1 w-full max-w-md md:max-w-xl lg:max-w-7xl xl:max-w-9xl ${isHome ? 'glass-panel' : 'bg-white'} p-4 sm:p-6 rounded-3xl shadow-xl mx-auto border-2 border-solid border-eecol-blue overflow-hidden flex flex-col mb-16 relative animate-entrance`}>

        {!isHome && (
          <nav className="mb-4">
            <Link to="/" className="text-eecol-blue font-bold flex items-center hover:underline">
              <span className="mr-2">🏠</span> Home
            </Link>
          </nav>
        )}

        {children}

        <footer className="mt-auto pt-4 border-t border-blue-200 hidden sm:block">
          <div className="flex justify-between items-center mb-2">
            <div className="flex space-x-2">
              {!isHome && (
                <Link to="/" className="px-3 py-1.5 bg-blue-600 border-2 border-blue-600 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-600 focus:ring-opacity-50 text-xs no-underline">
                  🏠 Home
                </Link>
              )}
              <Link to="/useful-tool" className="px-3 py-1.5 bg-sky-500 border-2 border-sky-500 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-sky-600 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 text-xs no-underline">
                Is This Tool Useful?
              </Link>
              <Link to="/privacy" className="px-3 py-1.5 bg-purple-500 border-2 border-purple-500 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-purple-600 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 text-xs no-underline">
                🔒 Privacy Policy
              </Link>
              {isHome && (
                <button className="px-3 py-1.5 bg-green-500 border-2 border-green-500 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-green-600 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 text-xs no-underline">
                  💾 Backup Guide
                </button>
              )}
            </div>
            <div className="flex space-x-2 items-center">
              <Link to="/database" className="px-3 py-1.5 bg-cyan-600 border-2 border-cyan-600 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-cyan-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-cyan-600 focus:ring-opacity-50 text-xs no-underline">
                🗃️ Database Config
              </Link>
              <Link to="/maintenance" className="px-3 py-1.5 bg-purple-600 border-2 border-purple-600 text-white font-bold rounded-3xl shadow-lg transition duration-200 ease-in-out transform hover:bg-purple-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-purple-600 focus:ring-opacity-50 text-xs no-underline">
                🛠️ Maintenance
              </Link>
              <p className="text-xs text-gray-500 font-mono select-none">v0.8.0.4</p>
            </div>
          </div>
          <p className="font-medium text-eecol-blue text-center select-none mb-1">
            Made With ❤️ By: Lucas and Cline 🤖
          </p>
          <p className="text-xs font-semibold header-gradient text-center select-none">
            EECOL Wire Tools 2025 - Enterprise Edition
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
