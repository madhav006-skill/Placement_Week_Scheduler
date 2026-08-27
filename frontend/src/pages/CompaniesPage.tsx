import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await axios.get(`${API_URL}/companies`);
            setCompanies(res.data);
        } catch (err) {
            console.error('Failed to fetch companies', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Companies</h1>

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by company name..." 
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
                            <th className="p-4 font-semibold text-gray-600">Tier</th>
                            <th className="p-4 font-semibold text-gray-600">Day</th>
                            <th className="p-4 font-semibold text-gray-600">Window</th>
                            <th className="p-4 font-semibold text-gray-600">Duration</th>
                            <th className="p-4 font-semibold text-gray-600">Panels</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">No companies found.</td></tr>
                        ) : (
                            filtered.map(company => (
                                <tr key={company._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{company.name}</td>
                                    <td className="p-4 text-gray-600">Tier {company.priorityTier}</td>
                                    <td className="p-4 text-gray-600">Day {company.day}</td>
                                    <td className="p-4 text-gray-600">{company.startTime} - {company.endTime}</td>
                                    <td className="p-4 text-gray-600">{company.durationMins} mins</td>
                                    <td className="p-4 text-gray-600">{company.panels?.length || 0}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
