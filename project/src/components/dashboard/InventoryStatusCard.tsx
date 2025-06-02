import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  category: string;
  manufacturer: string;
  price: number;
}

interface LowStockItem {
  _id: string;
  medicine: Medicine;
  quantity: number;
  unit: string;
  reorderLevel: number;
  status: 'Low Stock' | 'Out of Stock';
}

interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

const InventoryStatusCard: React.FC = () => {
  const { token, user } = useUser();
  const { showNotification } = useNotification();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory/low-stock', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch low stock items');
      }

      const data = await response.json();
      setLowStockItems(data);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      showNotification('error', 'Failed to fetch low stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (itemId: string) => {
    try {
      // Find the item to get its current quantity and reorder level
      const item = lowStockItems.find(i => i._id === itemId);
      if (!item) return;

      // Make sure we have suppliers
      if (suppliers.length === 0) {
        showNotification('error', 'No suppliers available for restock order');
        return;
      }

      // Calculate the quantity to add
      const quantityToAdd = (item.reorderLevel - item.quantity) + 10;

      // Create the order data object
      const orderData = {
        orderNumber: `RO-${Date.now()}`, // Generate a unique order number
        items: [
          {
            medicineName: item.medicine.name,
            quantity: quantityToAdd,
            supplier: suppliers[0]._id,
          }
        ],
        customerDetails: {
          name: "Pharmacy Restock",
          email: "pharmacy@example.com",
          phone: "1234567890",
          paymentMethod: "cash"
        },
        status: "pending",
        createdBy: user?._id
      };

      // Create the restock order
      const orderResponse = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create restock order');
      }

      // Create the notification data object
      const notificationData = {
        type: 'Low Stock',
        title: 'Restock Order Created',
        message: `Restock order placed for ${item.medicine.name}`,
        priority: 'Medium',
        for: 'all',
        relatedDocument: itemId,
        onModel: 'Inventory'
      };

      // Create the notification
      const notificationResponse = await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      if (!notificationResponse.ok) {
        console.error('Failed to create notification');
      }

      // Remove the item from the low stock list
      setLowStockItems(prev => prev.filter(i => i._id !== itemId));
      
      // Show success notification
      showNotification('success', `Restock order created for ${item.medicine.name}`);
    } catch (error) {
      console.error('Error restocking item:', error);
      showNotification('error', 'Failed to create restock order');
    }
  };

  useEffect(() => {
    fetchLowStockItems();
    fetchSuppliers();
  }, [token]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="text-center py-6 text-gray-500">
            Loading...
          </div>
        ) : lowStockItems.length > 0 ? (
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{item.medicine.name}</h3>
                  <div className="text-sm text-red-600 mt-1">
                    Current Stock: {item.quantity} {item.unit} (Min: {item.reorderLevel})
                  </div>
                </div>
                <button 
                  onClick={() => handleRestock(item._id)}
                  className="px-3 py-1 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700"
                  disabled={suppliers.length === 0}
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No low stock items at the moment
          </div>
        )}
      </div>
      
      <div className="p-4 border-t text-center">
        <button 
          onClick={() => window.location.href = '/inventory'}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View Full Inventory
        </button>
      </div>
    </div>
  );
};

export default InventoryStatusCard;