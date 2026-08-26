import React from 'react';
import {
  CheckCircle,
  Clock,
  CalendarDays,
  Activity
} from 'lucide-react';

const DashboardStats = ({ metrics }: { metrics: any }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
          <CalendarDays size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Scheduled Rate
          </p>

          <p className="text-xl font-bold">
            {metrics.schedulingRate}%
          </p>
        </div>
      </div>


      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className="p-3 bg-green-100 text-green-600 rounded-full">
          <CheckCircle size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Total Scheduled
          </p>

          <p className="text-xl font-bold">
            {metrics.scheduled}
          </p>
        </div>
      </div>


      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className="p-3 bg-red-100 text-red-600 rounded-full">
          <Activity size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Student Clashes
          </p>

          <p className="text-xl font-bold">
            {metrics.studentClashes}
          </p>
        </div>
      </div>


      <div className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
          <Clock size={24} />
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Replan Churn
          </p>

          <p className="text-xl font-bold">
            {metrics.replanChurn}%
          </p>
        </div>
      </div>

    </div>
  );
};

export default DashboardStats;
