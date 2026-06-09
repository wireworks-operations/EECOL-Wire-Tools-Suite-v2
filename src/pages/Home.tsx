import React from 'react';
import { Link } from 'react-router-dom';
import MaintenanceNotification from '../components/MaintenanceNotification';

interface ToolCardProps {
  to: string;
  icon: string;
  title: string;
  description: string;
  colSpan?: string;
  rowSpan?: string;
  delay?: string;
  disabled?: boolean;
  large?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({ to, icon, title, description, colSpan = 'col-span-2', rowSpan = 'row-span-1', delay = 'delay-500', disabled, large }) => (
  <Link
    to={disabled ? '#' : to}
    className={`tool-card card-magnetic bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue text-center block no-underline transition-all animate-entrance ${delay} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${colSpan} ${rowSpan}`}
  >
    <div className={`${large ? 'text-6xl' : 'text-3xl'} mb-2`}>{icon}</div>
    <h3 className={`${large ? 'text-xl' : 'text-lg'} font-bold text-eecol-blue`}>{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </Link>
);

const Home: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="flex justify-center mb-1 relative">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-eecol-blue drop-shadow-xl eecol-logo-tilt">
          <circle cx="12" cy="12" r="11.35" fill="white" stroke="currentColor" strokeWidth="2" />
          <rect x="4" y="4" width="4" height="16" rx="1" fill="currentColor" />
          <path d="M 8,6.5 C 12,5.5 16,7.5 20,6.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 8,12 C 12,11 16,13 20,12" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 8,17.5 C 12,16.5 16,18.5 20,17.5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      <h1 className="text-3xl font-black mb-3 text-center header-gradient animate-entrance delay-100">
        EECOL Wire Tools Suite
      </h1>
      <p className="mb-4 text-center text-sm font-medium text-eecol-blue animate-entrance delay-200">
        Choose Your Tool - Wire Cut Consistency Protocol
      </p>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border-l-4 border-eecol-blue mb-6 animate-entrance delay-300">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">🔧</div>
          <h2 className="text-xl font-bold text-eecol-blue">EECOL Wire Tools Suite Overview</h2>
        </div>
        <p className="text-sm text-gray-700 mb-4">
          The EECOL Wire Tools Suite provides a comprehensive collection of specialized calculators,
          estimators, and record-keeping tools designed to enhance precision, efficiency, and consistency in
          wire cutting operations for workshop professionals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-eecol-light-blue p-3 rounded-3xl">
            <div className="text-2xl mb-1">🧮</div>
            <div className="text-sm font-semibold text-eecol-blue">Calculators</div>
            <div className="text-xs text-gray-600">Precise measurements</div>
          </div>
          <div className="bg-eecol-light-blue p-3 rounded-3xl">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm font-semibold text-eecol-blue">Records</div>
            <div className="text-xs text-gray-600">Track operations</div>
          </div>
          <div className="bg-eecol-light-blue p-3 rounded-3xl">
            <div className="text-2xl mb-1">📈</div>
            <div className="text-sm font-semibold text-eecol-blue">Estimators</div>
            <div className="text-xs text-gray-600">Optimize efficiency</div>
          </div>
        </div>
      </div>

      {/* Protocol Section */}
      <section className="mb-6 p-4 bg-white rounded-3xl shadow-xl animate-entrance delay-400">
        <h3 className="text-lg font-bold text-eecol-blue mb-2 text-center">Wire Cut Consistency Protocol</h3>
        <p className="text-sm text-gray-700 mb-2 text-center">
            Maintaining mark consistency is critical for minimizing inventory chaos and ensuring the next user can easily perform a reliable cut.
            All cuts must be performed based on the starting position of the measured mark.
        </p>

        <div className="space-y-3 mt-3">
            <div className="p-3 bg-green-50/50 border-l-4 border-green-600 rounded-3xl">
                <h4 className="font-semibold text-sm text-green-700 mb-1">Scenario 1: Mark at the Tip (Preferred Method)</h4>
                <p className="text-xs text-gray-700">The current wire mark (e.g., 5m) is at the tip of the wire, aligned with the machine's zero point (Marking Reference: <strong>At the Tip</strong>).</p>
                <p className="text-sm font-bold text-gray-800 mt-1">Action: Cut the wire just <strong>BEFORE</strong> the next digit up.</p>
                <p className="text-xs italic text-gray-600 mt-1">
                    Example: If you start at 5 and want 5 units, you cut right <strong>before</strong> the 6 mark. This ensures the 6 mark is now at the new tip for the next cut.
                </p>
            </div>

            <div className="p-3 bg-amber-50/50 border-l-4 border-amber-600 rounded-3xl">
                <h4 className="font-semibold text-sm text-amber-700 mb-1">Scenario 2: Mark 1 Meter In (Alternative Method)</h4>
                <p className="text-xs text-gray-700">The current wire mark (e.g., 5m) is located 1 meter (or 1 foot) in from the tip (Marking Reference: <strong>1 Meter In</strong>).</p>
                <p className="text-sm font-bold text-gray-800 mt-1">Action: Cut the wire just <strong>AFTER</strong> the digit you are cutting at.</p>
                <p className="text-xs italic text-gray-600 mt-1">
                    Example: If you start at 5 (1m in) and want 5 units, you cut right <strong>after</strong> the 5 mark. This leaves the 6 mark still 1 meter in from the new tip, maintaining consistency in the offset.
                </p>
            </div>
        </div>

        <p className="text-xs text-gray-700 mt-3 text-center"><strong>Goal:</strong> Use Scenario 1 whenever possible. If Scenario 2 is used, the next person <strong>must</strong> use the wire cut tool's 1-meter offset feature to properly estimate the desired length, as the mark will not be at the tip.</p>
      </section>

      <MaintenanceNotification />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 grid-rows-4 gap-3 mt-4">
        <ToolCard to="/cutting-records" icon="📊" title="Wire Cut Records" description="Log, track, and analyze wire cuts efficiently." colSpan="col-span-3" rowSpan="row-span-2" delay="delay-500" large />
        <ToolCard to="/inventory-records" icon="📦" title="Wire Inventory Records" description="Track and manage wire inventory efficiently." colSpan="col-span-3" rowSpan="row-span-2" delay="delay-500" large />
        <ToolCard to="/mark-calculator" icon="📏" title="Mark Calculator" description="Calculate length between wire marks." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-600" />
        <ToolCard to="/stop-mark" icon="⏹️" title="Stop Mark Calculator" description="Determine exact stopping points." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-600" />
        <ToolCard to="/reel-capacity" icon="🔄" title="Reel Capacity Estimator" description="Calculate maximum wire capacity." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-700" />
        <ToolCard to="/reel-size" icon="📐" title="Reel Size Estimator" description="Find optimal reel for wire length." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-700" />
        <ToolCard to="/weight" icon="⚖️" title="Weight Calculator" description="Estimate wire weight by length." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-800" />
        <ToolCard to="/multicut-planner" icon="✂️" title="Multi-Cut Planner" description="Plan multiple reel cuts & capacity." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-800" />
        <ToolCard to="/shipping-manifest" icon="📋" title="Shipping Manifest" description="Create reel labels for shipping." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-900" />
        <ToolCard to="/reel-labels" icon="🏷️" title="Reel Inventory Labels" description="Simple large-format reel identification." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-900" />
        <ToolCard to="/maintenance" icon="🔧" title="Machine Maintenance" description="Daily equipment inspection checklists." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-1000" />
        <ToolCard to="/advanced-math" icon="🧮" title="Advanced Mathematics" description="Engineering formulas for reels." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-1000" />
        <ToolCard to="/education" icon="🎓" title="Education Center" description="Master wire cutting excellence." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-1000" />
        <ToolCard to="/useful-tool" icon="💡" title="About & Feedback" description="Share feedback and learn about the suite." colSpan="col-span-2" rowSpan="row-span-1" delay="delay-1000" />
      </div>
    </div>
  );
};

export default Home;
