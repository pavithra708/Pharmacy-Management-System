import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Filter } from 'lucide-react';

// Mock data for different time periods
const salesData = {
  all: [
    { month: 'Jan', sales: 4500, profit: 1200 },
    { month: 'Feb', sales: 3800, profit: 950 },
    { month: 'Mar', sales: 5200, profit: 1400 },
    { month: 'Apr', sales: 4200, profit: 1100 },
    { month: 'May', sales: 4800, profit: 1300 },
    { month: 'Jun', sales: 5500, profit: 1500 },
  ],
  today: [
    { hour: '9 AM', sales: 450, profit: 120 },
    { hour: '12 PM', sales: 800, profit: 210 },
    { hour: '3 PM', sales: 600, profit: 160 },
    { hour: '6 PM', sales: 750, profit: 200 },
  ],
  week: [
    { day: 'Mon', sales: 1200, profit: 320 },
    { day: 'Tue', sales: 900, profit: 240 },
    { day: 'Wed', sales: 1500, profit: 400 },
    { day: 'Thu', sales: 1100, profit: 300 },
    { day: 'Fri', sales: 1800, profit: 480 },
    { day: 'Sat', sales: 2000, profit: 520 },
    { day: 'Sun', sales: 1600, profit: 420 },
  ],
  month: [
    { week: 'Week 1', sales: 4500, profit: 1200 },
    { week: 'Week 2', sales: 3800, profit: 950 },
    { week: 'Week 3', sales: 5200, profit: 1400 },
    { week: 'Week 4', sales: 4800, profit: 1300 },
  ],
  year: [
    { quarter: 'Q1', sales: 13500, profit: 3550 },
    { quarter: 'Q2', sales: 14500, profit: 3800 },
    { quarter: 'Q3', sales: 12500, profit: 3300 },
    { quarter: 'Q4', sales: 15500, profit: 4100 },
  ],
};

const inventoryData = {
  all: [
    { category: 'Pain Relief', inStock: 245, lowStock: 12, outOfStock: 3 },
    { category: 'Antibiotics', inStock: 180, lowStock: 8, outOfStock: 2 },
    { category: 'Vitamins', inStock: 320, lowStock: 15, outOfStock: 0 },
    { category: 'First Aid', inStock: 150, lowStock: 5, outOfStock: 1 },
    { category: 'Diabetes', inStock: 90, lowStock: 10, outOfStock: 4 },
  ],
  today: [
    { category: 'Pain Relief', inStock: 5, lowStock: 2, outOfStock: 0 },
    { category: 'Antibiotics', inStock: 3, lowStock: 1, outOfStock: 0 },
    { category: 'Vitamins', inStock: 8, lowStock: 0, outOfStock: 0 },
  ],
  week: [
    { category: 'Pain Relief', inStock: 45, lowStock: 5, outOfStock: 1 },
    { category: 'Antibiotics', inStock: 30, lowStock: 3, outOfStock: 1 },
    { category: 'Vitamins', inStock: 60, lowStock: 2, outOfStock: 0 },
    { category: 'First Aid', inStock: 25, lowStock: 1, outOfStock: 0 },
  ],
  month: [
    { category: 'Pain Relief', inStock: 120, lowStock: 8, outOfStock: 2 },
    { category: 'Antibiotics', inStock: 90, lowStock: 5, outOfStock: 1 },
    { category: 'Vitamins', inStock: 150, lowStock: 10, outOfStock: 0 },
    { category: 'First Aid', inStock: 75, lowStock: 3, outOfStock: 1 },
    { category: 'Diabetes', inStock: 40, lowStock: 5, outOfStock: 2 },
  ],
  year: [
    { category: 'Pain Relief', inStock: 245, lowStock: 12, outOfStock: 3 },
    { category: 'Antibiotics', inStock: 180, lowStock: 8, outOfStock: 2 },
    { category: 'Vitamins', inStock: 320, lowStock: 15, outOfStock: 0 },
    { category: 'First Aid', inStock: 150, lowStock: 5, outOfStock: 1 },
    { category: 'Diabetes', inStock: 90, lowStock: 10, outOfStock: 4 },
  ],
};

const summaryData = {
  all: {
    totalSales: 28000,
    totalProfit: 7450,
    totalOrders: 342,
    avgOrderValue: 81.85,
    salesTrend: '+12%',
    profitTrend: '+8%',
    ordersTrend: '+5%',
    avgOrderTrend: '-2%',
  },
  today: {
    totalSales: 2600,
    totalProfit: 690,
    totalOrders: 32,
    avgOrderValue: 81.25,
    salesTrend: '+5%',
    profitTrend: '+3%',
    ordersTrend: '+2%',
    avgOrderTrend: '+1%',
  },
  week: {
    totalSales: 9100,
    totalProfit: 2380,
    totalOrders: 112,
    avgOrderValue: 81.25,
    salesTrend: '+8%',
    profitTrend: '+6%',
    ordersTrend: '+4%',
    avgOrderTrend: '+1%',
  },
  month: {
    totalSales: 18300,
    totalProfit: 4850,
    totalOrders: 225,
    avgOrderValue: 81.33,
    salesTrend: '+10%',
    profitTrend: '+7%',
    ordersTrend: '+4%',
    avgOrderTrend: '-1%',
  },
  year: {
    totalSales: 56000,
    totalProfit: 14750,
    totalOrders: 685,
    avgOrderValue: 81.75,
    salesTrend: '+15%',
    profitTrend: '+12%',
    ordersTrend: '+8%',
    avgOrderTrend: '+2%',
  },
};

const ReportsPage = () => {
  const [timeFilter, setTimeFilter] = useState('all');

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFilter(e.target.value);
  };

  const getXAxisKey = () => {
    switch (timeFilter) {
      case 'today': return 'hour';
      case 'week': return 'day';
      case 'month': return 'week';
      case 'year': return 'quarter';
      default: return 'month';
    }
  };

  const handleExport = () => {
    // In a real app, this would generate and download a report
    alert(`Exporting ${timeFilter} report`);
  };

  return (
    <MainLayout title="Reports">
      <div className="space-y-6">
        {/* Filters and Export */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm text-gray-500">Filter by:</span>
              </div>
              
              <select 
                value={timeFilter}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <button 
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Download size={18} />
              <span>Export Reports</span>
            </button>
          </div>
        </div>

        {/* Sales Report */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Sales Report</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData[timeFilter as keyof typeof salesData]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                />
                <Bar dataKey="sales" name="Sales" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Inventory Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inventoryData[timeFilter as keyof typeof inventoryData]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
                  }}
                />
                <Bar dataKey="inStock" name="In Stock" stackId="a" fill="#0D9488" />
                <Bar dataKey="lowStock" name="Low Stock" stackId="a" fill="#EAB308" />
                <Bar dataKey="outOfStock" name="Out of Stock" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${summaryData[timeFilter as keyof typeof summaryData].totalSales.toLocaleString()}
            </p>
            <span className={`text-sm ${
              summaryData[timeFilter as keyof typeof summaryData].salesTrend.startsWith('+') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {summaryData[timeFilter as keyof typeof summaryData].salesTrend} vs previous period
            </span>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${summaryData[timeFilter as keyof typeof summaryData].totalProfit.toLocaleString()}
            </p>
            <span className={`text-sm ${
              summaryData[timeFilter as keyof typeof summaryData].profitTrend.startsWith('+') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {summaryData[timeFilter as keyof typeof summaryData].profitTrend} vs previous period
            </span>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {summaryData[timeFilter as keyof typeof summaryData].totalOrders}
            </p>
            <span className={`text-sm ${
              summaryData[timeFilter as keyof typeof summaryData].ordersTrend.startsWith('+') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {summaryData[timeFilter as keyof typeof summaryData].ordersTrend} vs previous period
            </span>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              ${summaryData[timeFilter as keyof typeof summaryData].avgOrderValue.toFixed(2)}
            </p>
            <span className={`text-sm ${
              summaryData[timeFilter as keyof typeof summaryData].avgOrderTrend.startsWith('+') 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {summaryData[timeFilter as keyof typeof summaryData].avgOrderTrend} vs previous period
            </span>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportsPage;