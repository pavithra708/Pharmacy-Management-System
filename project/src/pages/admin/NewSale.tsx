import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useUser } from '../../context/UserContext';
import { Plus, Minus, ShoppingCart } from 'lucide-react';

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

const NewSale = () => {
  const navigate = useNavigate();
  const { token } = useUser();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/medicines', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }

        const data = await response.json();
        setMedicines(data);
      } catch (error) {
        console.error('Error fetching medicines:', error);
        setError('Failed to load medicines');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [token, navigate]);

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
    
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      const orderData = {
        items: cart.map(item => ({
          medicine: item.medicine._id,
          quantity: item.quantity,
          price: item.medicine.price
        })),
        customerDetails: billingDetails,
        totalAmount: getTotalAmount()
      };

      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create sale');
      }

      // Navigate back to sales list after successful creation
      navigate('/admin/sales-management');
    } catch (error) {
      console.error('Error creating sale:', error);
      setError('Failed to create sale. Please try again.');
    }
  };

  if (loading) {
    return (
      <MainLayout title="New Sale">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="New Sale">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medicines List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

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
                      <p className="text-teal-600 font-medium">₹{medicine.price.toFixed(2)}</p>
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

        {/* Cart and Checkout Form */}
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
                      <p className="text-sm text-gray-500">₹{item.medicine.price.toFixed(2)} x {item.quantity}</p>
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
                <div className="flex justify-between font-medium mb-4">
                  <span>Total:</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>

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

                  <button
                    type="submit"
                    className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} />
                    Complete Sale
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default NewSale;

 