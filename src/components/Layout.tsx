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
      <div className="flex-1 w-full max-w-md md:max-w-xl lg:max-w-7xl xl:max-w-9xl bg-eecol-light-blue p-4 sm:p-6 rounded-xl shadow-2xl mx-auto border-2 border-solid border-eecol-blue overflow-hidden flex flex-col mb-4 relative">

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
              <Link to="/useful-tool" className="px-3 py-1.5 bg-sky-500 text-white font-bold rounded-xl shadow-lg text-xs no-underline">Is This Tool Useful?</Link>
              <Link to="/privacy" className="px-3 py-1.5 bg-purple-500 text-white font-bold rounded-xl shadow-lg text-xs no-underline">🔒 Privacy Policy</Link>
            </div>
            <div className="flex space-x-2 items-center">
              <Link to="/database" className="px-3 py-1.5 bg-cyan-600 text-white font-bold rounded-xl shadow-lg text-xs no-underline">🗃️ Database Config</Link>
              <p className="text-xs text-gray-500 font-mono select-none">v0.9.0</p>
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
