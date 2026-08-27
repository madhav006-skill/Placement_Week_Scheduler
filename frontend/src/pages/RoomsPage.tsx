import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RoomsPage() {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${API_URL}/rooms`);
            setRooms(res.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleRoom = async (roomId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        if (!newStatus) {
            if (!confirm('Marking this room as unavailable will trigger a schedule replan. Continue?')) return;
        }

        try {
            await axios.put(`${API_URL}/rooms/${roomId}/availability`, { isAvailable: newStatus });
            alert(`Room marked as ${newStatus ? 'Available' : 'Unavailable'}. Schedule updated.`);
            fetchRooms();
        } catch (err) {
            console.error(err);
            alert('Failed to update room availability.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Room Management</h1>
            
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold text-gray-600">Room Name</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map(room => (
                                <tr key={room._id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{room.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${room.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {room.isAvailable !== false ? 'AVAILABLE' : 'UNAVAILABLE'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => toggleRoom(room._id, room.isAvailable !== false)}
                                            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${room.isAvailable !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {room.isAvailable !== false ? 'Mark Unavailable' : 'Mark Available'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
