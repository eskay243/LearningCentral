import { RecentActivityItem } from "@/types";
import { formatTimeFromNow } from "@/lib/utils";

interface RecentActivityProps {
  activities: RecentActivityItem[];
  isLoading?: boolean;
}

const RecentActivity = ({ activities, isLoading = false }: RecentActivityProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
        <div className="p-4 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-500">Latest Updates</div>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">No recent activity found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Latest Updates</div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4">
            <div className="flex items-start">
              <div className={`flex-shrink-0 h-8 w-8 rounded-full ${activity.iconBgClass} flex items-center justify-center`}>
                <i className={activity.iconClass}></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-dark-800">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTimeFromNow(activity.time)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right border-t border-gray-200">
        <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-700">View All Activity</a>
      </div>
    </div>
  );
};

export default RecentActivity;
