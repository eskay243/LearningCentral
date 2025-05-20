import { StatsCardItem } from "@/types";

interface StatsCardProps {
  item: StatsCardItem;
}

const StatsCard = ({ item }: StatsCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-12 w-12 rounded-full ${item.iconBgClass} flex items-center justify-center`}>
          <i className={`${item.icon} text-2xl`}></i>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-500">{item.title}</div>
          <div className="text-2xl font-semibold text-dark-800">{item.value}</div>
        </div>
      </div>
      {item.change && (
        <div className={`mt-3 text-sm flex items-center ${
          item.changeType === 'increase' ? 'text-green-600' : 
          item.changeType === 'decrease' ? 'text-red-600' : 
          'text-gray-600'
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
