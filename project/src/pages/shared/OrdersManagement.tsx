import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

interface OrderItem {
  medicineName: string;
  quantity: number;
  supplier: {
    _id: string;
    name: string;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    paymentMethod: string;
  };
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

const OrdersManagement: React.FC = () => {
  const { token } = useUser();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders list
      await fetchOrders();
      showNotification('success', `Order ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification('error', 'Failed to update order status');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  return (
    <MainLayout title="Orders Management">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders List</h2>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Order Number</th>
                    <th className="border px-4 py-2 text-left">Date</th>
                    <th className="border px-4 py-2 text-left">Items</th>
                    <th className="border px-4 py-2 text-left">Customer</th>
                    <th className="border px-4 py-2 text-left">Status</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{order.orderNumber}</td>
                      <td className="border px-4 py-2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border px-4 py-2">
                        <ul className="list-disc list-inside">
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.medicineName} - {item.quantity} units
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="border px-4 py-2">
                        {order.customerDetails.name}
                      </td>
                      <td className="border px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="border px-4 py-2">
                        {order.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateOrderStatus(order._id, 'completed')}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order._id, 'cancelled')}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default OrdersManagement; 