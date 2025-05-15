import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  dosage: string;
  category: string;
  manufacturer: string;
  price: number;
  requiresPrescription: boolean;
}

interface ExpiringMedicine {
  _id: string;
  medicine: Medicine;
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  reorderLevel: number;
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expiringMedicines, setExpiringMedicines] = useState<ExpiringMedicine[]>([]);
  const { token } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExpiringMedicines = async () => {
      try {
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/inventory/expiring', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch expiring medicines');
        }

        const data = await response.json();
        setExpiringMedicines(data.expiringMedicines || []);
      } catch (error) {
        console.error('Error fetching expiring medicines:', error);
      }
    };

    fetchExpiringMedicines();
    // Refresh every 5 minutes
    const interval = setInterval(fetchExpiringMedicines, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-bell')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMedicineClick = (medicineId: string) => {
    setIsOpen(false);
    navigate(`/admin/medicine?id=${medicineId}`);
  };

  return (
    <div className="relative notification-bell">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {expiringMedicines.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {expiringMedicines.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              Medicines Expiring Soon
            </h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {expiringMedicines.map((item) => {
              const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
              return (
                <button
                  key={item._id}
                  onClick={() => handleMedicineClick(item.medicine._id)}
                  className="w-full px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.medicine.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.medicine.brand} • {item.medicine.dosage}
                      </p>
                      <p className="text-xs text-gray-500">
                        Batch: {item.batchNumber}
                      </p>
                      <p className="text-xs font-medium text-red-600">
                        Expires in {daysUntilExpiry} days
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-xs font-medium text-gray-700">
                        ₹{item.medicine.price}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 