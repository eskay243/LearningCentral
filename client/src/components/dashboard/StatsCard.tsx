import { StatsCardItem } from "@/types";

interface StatsCardProps {
  item: StatsCardItem;
}

const StatsCard = ({ item }: StatsCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-5 border border-gray-100 dark:border-gray-700 transition-all">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full ${item.iconBgClass} flex items-center justify-center`}>
          <i className={`${item.icon} text-xl sm:text-2xl`}></i>
        </div>
        <div className="ml-3 sm:ml-4">
          <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</div>
          <div className="text-lg sm:text-2xl font-semibold text-dark-800 dark:text-gray-100">{item.value}</div>
        </div>
      </div>
      {item.change && (
        <div className={`mt-2 sm:mt-3 text-xs sm:text-sm flex items-center ${
          item.changeType === 'increase' ? 'text-green-600 dark:text-green-500' : 
          item.changeType === 'decrease' ? 'text-red-600 dark:text-red-500' : 
          'text-gray-600 dark:text-gray-400'
        }`}>
          {item.changeType === 'increase' && <i className="ri-arrow-up-line mr-1"></i>}
          {item.changeType === 'decrease' && <i className="ri-arrow-down-line mr-1"></i>}
          <span>{item.change}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
