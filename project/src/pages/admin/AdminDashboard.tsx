import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { PillIcon, Truck, Users, DollarSign, ShoppingCart, Bell } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalMedicines: number;
  totalSuppliers: number;
  totalUsers: number;
  monthlyRevenue: number;
  medicineChange: number;
  supplierChange: number;
  revenueChange: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats] = useState<DashboardStats>({
    totalMedicines: 25,
    totalSuppliers: 8,
    totalUsers: 12,
    monthlyRevenue: 45000,
    medicineChange: 15,
    supplierChange: 25,
    revenueChange: 30
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [expiringMedicines] = useState([
    { name: 'Paracetamol', expiryDate: '2024-06-15' },
    { name: 'Amoxicillin', expiryDate: '2024-06-20' },
    { name: 'Ibuprofen', expiryDate: '2024-06-25' }
  ]);
  const [notificationCount] = useState(3);

  const handleAddMedicine = () => {
    navigate('/admin/inventory/add');
  };

  const handleAddUser = () => {
    navigate('/admin/users/add');
  };

  const handleAddSupplier = () => {
    navigate('/admin/suppliers/add');
  };

  const handleNewSale = () => {
    navigate('/admin/sales/new');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <MainLayout 
      title="Admin Dashboard" 
      headerElements={
        <div className="relative">
          <button 
            onClick={toggleNotifications}
            className="p-2 rounded-full hover:bg-gray-100 relative"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">Expiring Medicines</p>
              </div>
              {expiringMedicines.length > 0 ? (
                expiringMedicines.map((medicine, index) => (
                  <div key={index} className="px-4 py-2 hover:bg-gray-50">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{medicine.name}</span> expires on {new Date(medicine.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2">
                  <p className="text-sm text-gray-500">No medicines expiring soon</p>
                </div>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Medicines" 
            value={stats.totalMedicines.toString()}
            icon={<PillIcon size={24} />} 
            change={{ value: stats.medicineChange, isPositive: stats.medicineChange >= 0 }}
            bgColor="bg-blue-100"
            textColor="text-blue-600"
          />
          <StatCard 
            title="Total Suppliers" 
            value={stats.totalSuppliers.toString()}
            icon={<Truck size={24} />}
            change={{ value: stats.supplierChange, isPositive: stats.supplierChange >= 0 }}
            bgColor="bg-green-100"
            textColor="text-green-600"
          />
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toString()}
            icon={<Users size={24} />}
            bgColor="bg-purple-100"
            textColor="text-purple-600"
          />
          <StatCard 
            title="Revenue (Monthly)" 
            value={`₹${stats.monthlyRevenue.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            change={{ value: stats.revenueChange, isPositive: stats.revenueChange >= 0 }}
            bgColor="bg-amber-100"
            textColor="text-amber-600"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button 
            onClick={handleAddMedicine}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2"
          >
            <div className="bg-teal-100 p-3 rounded-full">
              <PillIcon size={24} className="text-teal-600" />
            </div>
            <span className="font-medium text-gray-800">Add New Medicine</span>
          </button>
          
          <button 
            onClick={handleAddUser}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2"
          >
            <div className="bg-indigo-100 p-3 rounded-full">
              <Users size={24} className="text-indigo-600" />
            </div>
            <span className="font-medium text-gray-800">Add New User</span>
          </button>
          
          <button 
            onClick={handleAddSupplier}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2"
          >
            <div className="bg-amber-100 p-3 rounded-full">
              <Truck size={24} className="text-amber-600" />
            </div>
            <span className="font-medium text-gray-800">Add New Supplier</span>
          </button>
          
          <button 
            onClick={handleNewSale}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-2"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart size={24} className="text-blue-600" />
            </div>
            <span className="font-medium text-gray-800">New Sale</span>
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;