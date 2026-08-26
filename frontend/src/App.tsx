import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardStats from './components/DashboardStats';
import SimulationPanel from './components/SimulationPanel';
import ReplanDiff from './components/ReplanDiff';
import ScheduleGrid from './components/ScheduleGrid';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const res = await axios.get(`${API_URL}/schedule/latest`);

      const metricsRes = await axios.get(
        `${API_URL}/metrics/${res.data.version._id}`
      );

      setData({
        ...res.data,
        metrics: metricsRes.data,
      });

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateData = async () => {
    setLoading(true);

    try {
      await axios.post(`${API_URL}/generate-data`);
      await axios.post(`${API_URL}/schedule/baseline`);

      await fetchData();

      setDiff(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to generate data.');
    } finally {
      setLoading(false);
    }
  };

  const handleReplan = async (disruption: any) => {
    setLoading(true);

    try {
      const latestRes = await axios.get(
        `${API_URL}/schedule/latest`
      );

      const versionId = latestRes.data.version._id;

      const replanRes = await axios.post(
        `${API_URL}/schedule/replan/${versionId}`,
        disruption
      );

      const newVersionId = replanRes.data._id;

      const diffRes = await axios.get(
        `${API_URL}/diff/${newVersionId}`
      );

      setDiff(diffRes.data);

      await fetchData();
    } catch (err) {
      console.error(err);
      setError('Replanning failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        <header className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Placement Week Coordinator Dashboard
            </h1>

            <p className="text-gray-500">
              Live Scheduling and Dynamic Replanning System
            </p>
          </div>

          <button
            onClick={handleGenerateData}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={loading ? 'animate-spin' : ''}
            />

            Regenerate Dataset & Baseline
          </button>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3">
            <AlertTriangle className="text-red-500" />

            <p className="text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-6">

            {data && data.metrics && (
              <DashboardStats metrics={data.metrics} />
            )}

            {diff && (
              <ReplanDiff diff={diff} />
            )}

            {data && data.interviews && (
              <ScheduleGrid interviews={data.interviews} />
            )}

          </div>

          <div className="space-y-6">
            <SimulationPanel
              onReplan={handleReplan}
              loading={loading}
            />
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
