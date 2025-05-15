import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
  textColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  bgColor,
  textColor,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-semibold text-gray-800">{value}</h3>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`flex items-center text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {change.isPositive ? (
                  <ArrowUpIcon size={16} className="mr-1" />
                ) : (
                  <ArrowDownIcon size={16} className="mr-1" />
                )}
                {Math.abs(change.value)}%
              </span>
              <span className="text-gray-500 text-sm ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`${bgColor} ${textColor} p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 