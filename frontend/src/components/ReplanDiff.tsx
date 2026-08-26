import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

const ReplanDiff = ({ diff }: { diff: any }) => {
  if (!diff || diff.changes.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="text-blue-500" />
        <h2 className="text-lg font-bold text-gray-800">Replan Summary</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm text-gray-500">Moved Appointments</p>
          <p className="text-xl font-bold text-blue-600">{diff.summary.moved}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-xl font-bold text-red-600">{diff.summary.cancelled}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <p className="text-sm text-gray-500">Stakeholders Notified</p>
          <p className="text-xl font-bold text-indigo-600">{diff.summary.affectedStakeholders.length}</p>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Change Log</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {diff.changes.map((c: any, idx: number) => (
          <div key={idx} className="text-sm border-l-4 p-3 bg-gray-50 shadow-sm
            {c.type === 'CANCELLED' ? 'border-red-500' : c.type === 'MOVED' ? 'border-blue-500' : 'border-green-500'}">
            
            <div className="font-semibold text-gray-800 mb-1">
              {c.new?.studentId?.name || c.old?.studentId?.name} • {c.new?.companyId?.name || c.old?.companyId?.name}
            </div>

            {c.type === 'CANCELLED' && (
              <div className="text-red-600">
                <span className="font-medium">Cancelled:</span> {c.reason}
              </div>
            )}
            
            {c.type === 'MOVED' && c.old && c.new && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>{c.old.startTime} (Day {c.old.day})</span>
                <ArrowRight size={14} />
                <span className="font-medium text-blue-600">{c.new.startTime} (Day {c.new.day})</span>
              </div>
            )}

            {c.type === 'NEWLY_SCHEDULED' && c.new && (
              <div className="text-green-600">
                <span className="font-medium">Scheduled:</span> {c.new.startTime} (Day {c.new.day})
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReplanDiff;
