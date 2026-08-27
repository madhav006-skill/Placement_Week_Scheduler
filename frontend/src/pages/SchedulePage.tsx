import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SchedulePage() {
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterDay, setFilterDay] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await axios.get(`${API_URL}/schedule/latest`);
            setInterviews(res.data.interviews);
        } catch (err) {
            console.error('Failed to fetch schedule', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = interviews.filter(inv => {
        if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
        if (filterDay !== 'ALL' && inv.day?.toString() !== filterDay) return false;
        if (search) {
            const s = search.toLowerCase();
            const studentMatch = inv.studentId?.name?.toLowerCase().includes(s);
            const companyMatch = inv.companyId?.name?.toLowerCase().includes(s);
            if (!studentMatch && !companyMatch) return false;
        }
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Full Schedule</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search student or company..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                
                <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="UNSCHEDULED">Unscheduled</option>
                    <option value="COMPLETED">Completed</option>
                </select>

                <select 
                    value={filterDay} 
                    onChange={e => setFilterDay(e.target.value)}
                    className="border rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                    <option value="ALL">All Days</option>
                    <option value="1">Day 1</option>
                    <option value="2">Day 2</option>
                    <option value="3">Day 3</option>
                    <option value="4">Day 4</option>
                </select>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4 font-semibold text-gray-600">Student</th>
                            <th className="p-4 font-semibold text-gray-600">Company</th>
                            <th className="p-4 font-semibold text-gray-600">Day</th>
                            <th className="p-4 font-semibold text-gray-600">Time</th>
                            <th className="p-4 font-semibold text-gray-600">Room / Panel</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No interviews found matching filters.</td></tr>
                        ) : (
                            filtered.map(inv => (
                                <tr key={inv._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{inv.studentId?.name || '-'}</td>
                                    <td className="p-4 text-gray-600">{inv.companyId?.name || '-'}</td>
                                    <td className="p-4 text-gray-600">{inv.day ? `Day ${inv.day}` : '-'}</td>
                                    <td className="p-4 text-gray-600">{inv.startTime ? `${inv.startTime} - ${inv.endTime}` : '-'}</td>
                                    <td className="p-4 text-gray-600">
                                        {inv.roomId?.name ? <span className="block">{inv.roomId.name}</span> : null}
                                        {inv.panelId?.name ? <span className="block text-sm text-gray-400">{inv.panelId.name}</span> : null}
                                        {!inv.roomId && !inv.panelId && '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            inv.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                                            inv.status === 'UNSCHEDULED' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {inv.status}
                                        </span>
                                        {inv.reason && <div className="text-xs text-red-500 mt-1">{inv.reason}</div>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
