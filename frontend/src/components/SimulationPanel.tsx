import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SimulationPanel = ({ onReplan, loading }: { onReplan: (d: any) => void, loading: boolean }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [disruptionType, setDisruptionType] = useState('COMPANY_DELAY');
  const [targetId, setTargetId] = useState('');
  const [delayHours, setDelayHours] = useState(2);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cRes, sRes, rRes] = await Promise.all([
          axios.get(`${API_URL}/companies`),
          axios.get(`${API_URL}/students`),
          axios.get(`${API_URL}/rooms`)
        ]);
        setCompanies(cRes.data);
        setStudents(sRes.data);
        setRooms(rRes.data);
        if (cRes.data.length > 0) setTargetId(cRes.data[0]._id);
      } catch (err) {}
    };
    fetchDropdowns();
  }, []);

  const handleRun = () => {
    const d = { type: disruptionType, targetId, delayHours };
    onReplan(d);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-200">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-orange-500">⚡</span> Disruption Simulator
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Scenario</label>
          <select 
            value={disruptionType}
            onChange={e => {
              setDisruptionType(e.target.value);
              setTargetId('');
            }}
            className="w-full border-gray-300 rounded shadow-sm p-2 bg-gray-50 border"
          >
            <option value="COMPANY_DELAY">Company Arrives Late</option>
            <option value="PANEL_DROP">Panel Drops Out</option>
            <option value="STUDENT_WITHDRAW">Student Withdraws</option>
            <option value="ROOM_UNAVAILABLE">Room Unavailable</option>
          </select>
        </div>

        {disruptionType === 'COMPANY_DELAY' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 bg-gray-50 border rounded">
                <option value="">Select Company</option>
                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay (Hours)</label>
              <input type="number" min="1" max="10" value={delayHours} onChange={e => setDelayHours(Number(e.target.value))} className="w-full p-2 bg-gray-50 border rounded" />
            </div>
          </>
        )}

        {disruptionType === 'PANEL_DROP' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Panel</label>
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 bg-gray-50 border rounded">
              <option value="">Select Panel</option>
              {companies.map(c => 
                c.panels?.map((p: any) => <option key={p._id} value={p._id}>{c.name} - {p.name}</option>)
              )}
            </select>
          </div>
        )}

        {disruptionType === 'STUDENT_WITHDRAW' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 bg-gray-50 border rounded">
              <option value="">Select Student</option>
              {students.slice(0, 50).map(s => <option key={s._id} value={s._id}>{s.name} (CGPA: {s.cgpa})</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Showing top 50 students for brevity.</p>
          </div>
        )}

        {disruptionType === 'ROOM_UNAVAILABLE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 bg-gray-50 border rounded">
              <option value="">Select Room</option>
              {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
        )}

        <button 
          onClick={handleRun}
          disabled={loading || !targetId}
          className="w-full mt-4 bg-orange-600 text-white py-2 rounded font-medium hover:bg-orange-700 disabled:opacity-50"
        >
          Inject Disruption & Replan
        </button>
      </div>
    </div>
  );
};

export default SimulationPanel;
