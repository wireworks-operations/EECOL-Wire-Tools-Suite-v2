import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CuttingRecords from './pages/CuttingRecords';
import InventoryRecords from './pages/InventoryRecords/index';
import MarkCalculator from './pages/MarkCalculator';
import StopMark from './pages/StopMark';
import WeightCalculator from './pages/WeightCalculator';
import ReelCapacity from './pages/ReelCapacity';
import ReelSize from './pages/ReelSize';
import ShippingManifest from './pages/ShippingManifest';
import ReelLabels from './pages/ReelLabels';
import Maintenance from './pages/Maintenance';
import AdvancedMath from './pages/AdvancedMath';
import Reports from './pages/Reports';
import LiveStatistics from './pages/Reports/LiveStatistics';
import DatabaseConfig from './pages/DatabaseConfig';
import MultiCutPlanner from './pages/MultiCutPlanner';
import Calibration from './pages/Calibration';
import Education from './pages/Education';
import Privacy from './pages/Privacy';
import UsefulTool from './pages/UsefulTool';

function App() {
  return (
    <Router basename="/EECOL-Wire-Tools-Suite">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cutting-records" element={<CuttingRecords />} />
          <Route path="/inventory-records" element={<InventoryRecords />} />
          <Route path="/mark-calculator" element={<MarkCalculator />} />
          <Route path="/stop-mark" element={<StopMark />} />
          <Route path="/weight" element={<WeightCalculator />} />
          <Route path="/reel-capacity" element={<ReelCapacity />} />
          <Route path="/reel-size" element={<ReelSize />} />
          <Route path="/shipping-manifest" element={<ShippingManifest />} />
          <Route path="/reel-labels" element={<ReelLabels />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/advanced-math" element={<AdvancedMath />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/live-stats" element={<LiveStatistics />} />
          <Route path="/database" element={<DatabaseConfig />} />
          <Route path="/multicut-planner" element={<MultiCutPlanner />} />
          <Route path="/education" element={<Education />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/useful-tool" element={<UsefulTool />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
