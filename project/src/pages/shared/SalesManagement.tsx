import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Supplier {
  _id: string;
  name: string;
  contact: string;
  email: string;
}

interface OrderItem {
  medicineName: string;
  quantity: number;
  supplier: Supplier;
}

interface SavedOrderItem {
  medicineName: string;
  quantity: number;
  supplier: Supplier;
}

interface SavedOrder extends Omit<Order, 'items'> {
  items: SavedOrderItem[];
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  paymentMethod: 'cash' | 'card' | 'upi';
}

interface Order {
  items: OrderItem[];
  orderDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  customerDetails?: CustomerDetails;
  orderNumber: string;
}

const SalesManagement: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'cash'
  });
  const [currentOrder, setCurrentOrder] = useState<OrderItem>({
    medicineName: '',
    quantity: 0,
    supplier: {} as Supplier
  });

  useEffect(() => {
    const init = async () => {
      try {
        await checkUserAccess();
        await fetchSuppliers();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };
    init();
  }, []);

  const checkUserAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const user = await response.json();

      if (!response.ok || !['admin', 'pharmacist'].includes(user.role)) {
        navigate('/unauthorized');
        return;
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      navigate('/login');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
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
      alert('Failed to load suppliers. Please try refreshing the page.');
    }
  };

  const addToCart = () => {
    if (!currentOrder.medicineName || !currentOrder.quantity || !currentOrder.supplier._id) {
      alert('Please fill in all fields');
      return;
    }
    setCart([...cart, currentOrder]);
    setCurrentOrder({
      medicineName: '',
      quantity: 0,
      supplier: {} as Supplier
    });
    setShowOrderForm(false);
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowCheckoutForm(true);
  };

  const handleCheckout = async () => {
    // Validate customer details
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      alert('Please fill in all customer details');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone number (assuming 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerDetails.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const orderData = {
        items: cart.map(item => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          supplier: item.supplier._id
        })),
        customerDetails
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const savedOrder = await response.json();
      
      // Generate PDF without prices
      try {
        generatePDF(savedOrder);
      } catch (pdfError) {
        console.error('PDF Generation Error:', pdfError);
        alert('Order placed successfully, but failed to generate PDF. Please check order history.');
      }
      
      // Reset the form
        setCart([]);
      setShowCheckoutForm(false);
      setCustomerDetails({
        name: '',
        email: '',
        phone: '',
        paymentMethod: 'cash'
      });
      
      alert(`Order placed successfully! Order Number: ${savedOrder.orderNumber}`);
    } catch (error) {
      console.error('Error in checkout process:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to place order. Please try again.');
      }
    }
  };

  const generatePDF = (order: SavedOrder) => {
    try {
      // Create new document
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text('Order Details', 15, 20);

      // Add order information
      doc.setFontSize(12);
      doc.text(`Order Number: ${order.orderNumber}`, 15, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 40);

      // Add customer information
      if (order.customerDetails) {
        doc.text(`Customer Name: ${order.customerDetails.name}`, 15, 55);
        doc.text(`Phone: ${order.customerDetails.phone}`, 15, 65);
        doc.text(`Email: ${order.customerDetails.email}`, 15, 75);
        doc.text(`Payment Method: ${order.customerDetails.paymentMethod.toUpperCase()}`, 15, 85);
      }

      // Create table data without prices
      const tableData = order.items.map(item => [
        item.medicineName,
        item.quantity.toString(),
        item.supplier.name || 'N/A'
      ]);

      // Add table using autoTable directly
      autoTable(doc, {
        startY: 95,
        head: [['Medicine Name', 'Quantity', 'Supplier']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        margin: { top: 80 }
      });

      // Save the PDF
      doc.save(`order_${order.orderNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  return (
    <MainLayout title="Sales Management">
      <div className="space-y-6">
        {/* Order Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Order from Supplier
          </button>
        </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-lg font-semibold mb-4">Order Medicine</h2>
          <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name
                  </label>
              <input
                type="text"
                    value={currentOrder.medicineName}
                    onChange={(e) => setCurrentOrder({
                      ...currentOrder,
                      medicineName: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter medicine name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
              <input
                type="number"
                    value={currentOrder.quantity}
                    onChange={(e) => setCurrentOrder({
                      ...currentOrder,
                      quantity: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={currentOrder.supplier._id || ''}
                    onChange={(e) => {
                      const supplier = suppliers.find(s => s._id === e.target.value);
                      setCurrentOrder({
                        ...currentOrder,
                        supplier: supplier || {} as Supplier
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
              <button
                    onClick={addToCart}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                    Add to Cart
              </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Form Modal */}
        {showCheckoutForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({
                      ...customerDetails,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({
                      ...customerDetails,
                      email: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails({
                      ...customerDetails,
                      phone: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={customerDetails.paymentMethod}
                    onChange={(e) => setCustomerDetails({
                      ...customerDetails,
                      paymentMethod: e.target.value as 'cash' | 'card' | 'upi'
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowCheckoutForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No items in cart</p>
          ) : (
            <div className="space-y-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Medicine Name</th>
                    <th className="px-4 py-2 text-left">Quantity</th>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.medicineName}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.supplier.name}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end">
            <button
                  onClick={handleCheckoutClick}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
            >
              Proceed to Checkout
            </button>
          </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default SalesManagement;
