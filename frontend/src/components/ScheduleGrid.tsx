import { useState } from 'react';

const ScheduleGrid = ({ interviews }: { interviews: any[] }) => {
  const [filter, setFilter] = useState('SCHEDULED');

  const filtered = interviews.filter(i => i.status === filter);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Interviews</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('SCHEDULED')}
            className={`px-3 py-1 rounded text-sm ${filter === 'SCHEDULED' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          >
            Scheduled
          </button>
          <button 
            onClick={() => setFilter('UNSCHEDULED')}
            className={`px-3 py-1 rounded text-sm ${filter === 'UNSCHEDULED' ? 'bg-red-100 text-red-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          >
            Unscheduled
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-200 rounded">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 shadow-sm">
            <tr>
              <th className="p-3 border-b text-sm font-medium text-gray-600">Day</th>
              <th className="p-3 border-b text-sm font-medium text-gray-600">Time</th>
              <th className="p-3 border-b text-sm font-medium text-gray-600">Student</th>
              <th className="p-3 border-b text-sm font-medium text-gray-600">Company</th>
              {filter === 'SCHEDULED' && <th className="p-3 border-b text-sm font-medium text-gray-600">Room & Panel</th>}
              {filter === 'UNSCHEDULED' && <th className="p-3 border-b text-sm font-medium text-gray-600">Reason</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((inv, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b last:border-0">
                <td className="p-3 text-sm">{inv.day || '-'}</td>
                <td className="p-3 text-sm">{inv.startTime ? `${inv.startTime} - ${inv.endTime}` : '-'}</td>
                <td className="p-3 text-sm font-medium">{inv.studentId?.name}</td>
                <td className="p-3 text-sm">{inv.companyId?.name}</td>
                {filter === 'SCHEDULED' && (
                  <td className="p-3 text-sm text-gray-600">
                    {inv.roomId?.name} • {inv.panelId?.name}
                  </td>
                )}
                {filter === 'UNSCHEDULED' && (
                  <td className="p-3 text-sm text-red-600">{inv.reason}</td>
                )}
              </tr>
            ))}
            {filtered.length > 100 && (
              <tr>
                <td colSpan={6} className="p-3 text-center text-sm text-gray-500">
                  Showing 100 of {filtered.length} entries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500">No interviews found.</div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGrid;
