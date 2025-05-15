import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Plus, Minus, ShoppingCart, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  dosage: string;
  price: number;
  requiresPrescription: boolean;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
  total: number;
}

interface BillingDetails {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentMethod: 'cash' | 'card' | 'upi';
  prescriptionNumber?: string;
}

interface Bill {
  orderNumber: string;
  orderDate: string;
  items: CartItem[];
  totalAmount: number;
  customerDetails: BillingDetails;
  status: 'pending' | 'completed' | 'cancelled';
}

interface User {
  _id: string;
  name: string;
  role: 'admin' | 'pharmacist';
}

const SalesAndBilling = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'cash'
  });
  const [showBill, setShowBill] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkUserAccess();
    fetchMedicines();
  }, []);

  const checkUserAccess = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Verify user role
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const user = await response.json();

      if (!response.ok || !['admin', 'pharmacist'].includes(user.role)) {
        navigate('/unauthorized');
        return;
      }

      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking user access:', error);
      navigate('/login');
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/medicines');
      const data = await response.json();
      setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const addToCart = (medicine: Medicine) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medicine._id === medicine._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.medicine._id === medicine._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.medicine.price }
            : item
        );
      }
      return [...prevCart, { medicine, quantity: 1, total: medicine.price }];
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.medicine._id === medicineId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.medicine._id === medicineId
            ? { ...item, quantity: item.quantity - 1, total: (item.quantity - 1) * item.medicine.price }
            : item
        );
      }
      return prevCart.filter(item => item.medicine._id !== medicineId);
    });
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData = {
      items: cart.map(item => ({
        medicine: item.medicine._id,
        quantity: item.quantity,
        price: item.medicine.price
      })),
      customerDetails: billingDetails,
      totalAmount: getTotalAmount(),
      orderDate: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('Please login again to continue');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentBill(data);
        setShowBill(true);
        setCart([]);
        setShowCheckout(false);
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout title={`Sales & Billing - ${currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'User'}`}>
      {currentUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search medicines..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines
                .filter(med => 
                  med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  med.brand.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(medicine => (
                  <div key={medicine._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{medicine.name}</h3>
                        <p className="text-sm text-gray-500">{medicine.brand}</p>
                        <p className="text-sm text-gray-500">{medicine.dosage}</p>
                        <p className="text-teal-600 font-medium">${medicine.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => addToCart(medicine)}
                        className="bg-teal-100 text-teal-600 p-2 rounded-full hover:bg-teal-200"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Cart and Billing */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Cart</h2>
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-4 mb-4">
                  {cart.map(item => (
                    <div key={item.medicine._id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{item.medicine.name}</h3>
                        <p className="text-sm text-gray-500">${item.medicine.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.medicine._id)}
                          className="text-red-600 p-1 hover:bg-red-50 rounded"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item.medicine)}
                          className="text-teal-600 p-1 hover:bg-teal-50 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full mt-4 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}

            {/* Checkout Form */}
            {showCheckout && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                  <h2 className="text-xl font-semibold mb-4">Billing Details</h2>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={billingDetails.customerName}
                      onChange={(e) => setBillingDetails({...billingDetails, customerName: e.target.value})}
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={billingDetails.customerPhone}
                      onChange={(e) => setBillingDetails({...billingDetails, customerPhone: e.target.value})}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={billingDetails.customerEmail}
                      onChange={(e) => setBillingDetails({...billingDetails, customerEmail: e.target.value})}
                      required
                    />
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      value={billingDetails.paymentMethod}
                      onChange={(e) => setBillingDetails({...billingDetails, paymentMethod: e.target.value as 'cash' | 'card' | 'upi'})}
                      required
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                    {cart.some(item => item.medicine.requiresPrescription) && (
                      <input
                        type="text"
                        placeholder="Prescription Number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        value={billingDetails.prescriptionNumber || ''}
                        onChange={(e) => setBillingDetails({...billingDetails, prescriptionNumber: e.target.value})}
                        required
                      />
                    )}
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setShowCheckout(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        Complete Order
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Bill Preview */}
            {showBill && currentBill && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-semibold">Invoice</h2>
                    <button
                      onClick={handlePrint}
                      className="text-teal-600 hover:text-teal-700"
                    >
                      <Printer size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium">Bill To:</h3>
                        <p>{billingDetails.customerName}</p>
                        <p>{billingDetails.customerPhone}</p>
                        <p>{billingDetails.customerEmail}</p>
                      </div>
                      <div className="text-right">
                        <h3 className="font-medium">Order Details:</h3>
                        <p>Order #: {currentBill.orderNumber}</p>
                        <p>Date: {new Date(currentBill.orderDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map(item => (
                          <tr key={item.medicine._id} className="border-b">
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{item.medicine.name}</p>
                                <p className="text-sm text-gray-500">{item.medicine.brand}</p>
                              </div>
                            </td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">${item.medicine.price.toFixed(2)}</td>
                            <td className="text-right py-2">${item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right py-2 font-medium">Total:</td>
                          <td className="text-right py-2 font-medium">${getTotalAmount().toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    <div className="border-t pt-4">
                      <p><strong>Payment Method:</strong> {billingDetails.paymentMethod.toUpperCase()}</p>
                      {billingDetails.prescriptionNumber && (
                        <p><strong>Prescription Number:</strong> {billingDetails.prescriptionNumber}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowBill(false)}
                      className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SalesAndBilling; 