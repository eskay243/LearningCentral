import { Button } from "@/components/ui/button";
import { UpcomingClass } from "@/types";
import { formatDate, formatDuration } from "@/lib/utils";

interface UpcomingClassesProps {
  classes: UpcomingClass[];
  isLoading?: boolean;
}

const UpcomingClasses = ({ classes, isLoading = false }: UpcomingClassesProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading upcoming classes...</p>
        </div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 text-center">
          <p className="text-gray-500">No upcoming classes scheduled.</p>
          <Button variant="outline" className="mt-4">
            Schedule a Class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded ${cls.iconBgClass} flex items-center justify-center`}>
                      <i className={cls.iconClass}></i>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-dark-800">{cls.title}</div>
                      <div className="text-sm text-gray-500">{cls.module}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark-700">{formatDate(cls.startTime, true)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark-700">{formatDuration(cls.duration * 60)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-dark-700">{cls.enrolledCount} students</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button 
                    size="sm" 
                    variant={formatDate(cls.startTime) === "Today" ? "default" : "outline"}
                    className={formatDate(cls.startTime) === "Today" ? "" : "text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100"}
                  >
                    {formatDate(cls.startTime) === "Today" ? "Start Class" : "Prepare"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpcomingClasses;
