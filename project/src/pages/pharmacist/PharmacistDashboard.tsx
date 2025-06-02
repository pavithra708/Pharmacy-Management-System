import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import StatCard from '../../components/dashboard/StatCard';
import RecentSalesTable from '../../components/dashboard/RecentSalesTable';
import InventoryStatusCard from '../../components/dashboard/InventoryStatusCard';
import NotificationBell from '../../components/NotificationBell';
import { 
  PillIcon, Package, Receipt, ShoppingCart, ClipboardList 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';

// Mock data for daily sales
const dailySalesData = [
  { day: 'Mon', sales: 1200 },
  { day: 'Tue', sales: 1900 },
  { day: 'Wed', sales: 1500 },
  { day: 'Thu', sales: 2200 },
  { day: 'Fri', sales: 1800 },
  { day: 'Sat', sales: 2400 },
  { day: 'Sun', sales: 1100 },
];

const PharmacistDashboard = () => {
  const { token } = useUser();
  const [lowStockCount, setLowStockCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/inventory/low-stock', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLowStockCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching low stock count:', error);
      }
    };

    fetchLowStockCount();
  }, [token]);

  return (
    <MainLayout 
      title="Pharmacist Dashboard"
      headerElements={<NotificationBell />}
    >
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Today's Sales" 
            value="$1,245" 
            icon={<Receipt size={24} />} 
            change={{ value: 8, isPositive: true }}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard 
            title="Medicines in Stock" 
            value="412" 
            icon={<PillIcon size={24} />}
            change={{ value: 3, isPositive: false }}
            bgColor="bg-teal-100"
            textColor="text-teal-600"
          />
          <StatCard 
            title="Low Stock Items" 
            value={lowStockCount.toString()} 
            icon={<Package size={24} />}
            change={{ value: 2, isPositive: false }}
            bgColor="bg-red-100"
            textColor="text-red-600"
          />
        </div>

        {/* Daily Sales and Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Daily Sales This Week</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailySalesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div>
            <InventoryStatusCard />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PharmacistDashboard;