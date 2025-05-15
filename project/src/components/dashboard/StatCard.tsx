import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
  textColor: string;
};

const StatCard = ({ title, value, icon, change, bgColor, textColor }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between transition-transform hover:shadow-md hover:-translate-y-1">
      <div>
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        
        {change && (
          <div className={`text-sm mt-2 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? '+' : ''}{change.value}%
            <span className="text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      
      <div className={`${bgColor} ${textColor} p-3 rounded-lg`}>
        {icon}
      </div>
    </div>
  );
};

export default StatCard;