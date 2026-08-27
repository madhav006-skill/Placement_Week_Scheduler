import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Building, DoorOpen, UsersRound } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="w-64 bg-indigo-900 text-white min-h-screen p-4 flex flex-col hidden lg:flex shrink-0">
            <div className="mb-8 mt-2 px-2">
                <h2 className="text-xl font-bold">Placement Scheduler</h2>
                <p className="text-indigo-300 text-sm mt-1">Coordinator Portal</p>
            </div>
            
            <nav className="flex flex-col gap-2 flex-grow">
                <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <LayoutDashboard size={20} /> Dashboard
                </NavLink>
                <NavLink to="/schedule" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <Calendar size={20} /> Schedule
                </NavLink>
                <NavLink to="/students" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <Users size={20} /> Students
                </NavLink>
                <NavLink to="/companies" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <Building size={20} /> Companies
                </NavLink>
                <NavLink to="/panels" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <UsersRound size={20} /> Panels
                </NavLink>
                <NavLink to="/rooms" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>
                    <DoorOpen size={20} /> Rooms
                </NavLink>
            </nav>
        </aside>
    );
}
