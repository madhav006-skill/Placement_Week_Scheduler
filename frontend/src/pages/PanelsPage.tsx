import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PanelsPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/companies`);
            setCompanies(res.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePanel = async (panelId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        if (!newStatus) {
            if (!confirm('Marking this panel as unavailable will trigger a schedule replan. Continue?')) return;
        }

        try {
            await axios.put(`${API_URL}/panels/${panelId}/availability`, { isAvailable: newStatus });
            alert(`Panel marked as ${newStatus ? 'Available' : 'Unavailable'}. Schedule updated.`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update panel availability.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel Management</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map(company => (
                        <div key={company._id} className="bg-white p-6 rounded-lg shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">{company.name}</h2>
                            <div className="space-y-3">
                                {company.panels && company.panels.length > 0 ? (
                                    company.panels.map((panel: any) => (
                                        <div key={panel._id} className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                                            <span className="font-medium text-gray-700">{panel.name}</span>
                                            <button 
                                                onClick={() => togglePanel(panel._id, panel.isAvailable !== false)}
                                                className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${panel.isAvailable !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            >
                                                {panel.isAvailable !== false ? 'Available' : 'Unavailable'}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No panels configured.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
