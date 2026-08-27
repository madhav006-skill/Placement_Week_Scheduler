import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, UserMinus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axios.get(`${API_URL}/students`);
            setStudents(res.data);
        } catch (err) {
            console.error('Failed to fetch students', err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (studentId: string) => {
        if (!confirm('Are you sure you want to withdraw this student? This will cancel all their future interviews and trigger a schedule replan.')) return;
        
        try {
            await axios.put(`${API_URL}/students/${studentId}/withdraw`);
            alert('Student withdrawn and schedule updated successfully.');
            fetchStudents();
        } catch (err) {
            console.error(err);
            alert('Failed to withdraw student.');
        }
    };

    const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.branch.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={18} /> Add Student
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or branch..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Branch</th>
                            <th className="p-4 font-semibold text-gray-600">CGPA</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                            <th className="p-4 font-semibold text-gray-600">Shortlists</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No students found.</td></tr>
                        ) : (
                            filtered.map(student => (
                                <tr key={student._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{student.name}</td>
                                    <td className="p-4 text-gray-600">{student.branch}</td>
                                    <td className="p-4 text-gray-600">{student.cgpa.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${student.status === 'WITHDRAWN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {student.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {student.shortlistedCompanyIds?.length || 0} companies
                                    </td>
                                    <td className="p-4">
                                        {(!student.status || student.status === 'ACTIVE') && (
                                            <button 
                                                onClick={() => handleWithdraw(student._id)}
                                                className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm font-medium"
                                                title="Withdraw Student"
                                            >
                                                <UserMinus size={16} /> Withdraw
                                            </button>
                                        )}
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
