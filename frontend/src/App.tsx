import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/StudentsPage';
import CompaniesPage from './pages/CompaniesPage';
import PanelsPage from './pages/PanelsPage';
import RoomsPage from './pages/RoomsPage';
import SchedulePage from './pages/SchedulePage';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/panels" element={<PanelsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
