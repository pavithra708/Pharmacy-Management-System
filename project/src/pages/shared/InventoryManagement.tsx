import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { PlusCircle, Loader } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

interface Medicine {
  _id?: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  unit: string;
  dosage: string;
  price: number;
  requiresPrescription: boolean;
  manufacturer: string;
  usage: string;
  expiryDate: string;
  batchNumber: string;
  inventory?: {
    quantity: number;
    unit: string;
    batchNumber: string;
    expiryDate: string;
    status: string;
    lastRestocked: string;
    reorderLevel: number;
  };
}

interface InventoryItem {
  medicine: {
    _id: string;
    name: string;
    brand: string;
    category: string;
    manufacturer: string;
    dosage: string;
    price: number;
    usage: string;
    requiresPrescription: boolean;
  };
  medicineName: string;
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  status: string;
  lastRestocked: string;
  reorderLevel: number;
}

interface LowStockItem {
  _id: string;
  medicine: Medicine;
  quantity: number;
  unit: string;
  reorderLevel: number;
  status: 'Low Stock' | 'Out of Stock';
}

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useUser();
  const { showNotification } = useNotification();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [formData, setFormData] = useState<Medicine>({
    name: '',
    brand: '',
    category: '',
    quantity: 0,
    unit: 'pcs',
    dosage: '',
    price: 0,
    requiresPrescription: false,
    manufacturer: '',
    usage: '',
    expiryDate: '',
    batchNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated || !token) {
          navigate('/login');
          return;
        }

        // Verify token is still valid
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        await fetchMedicines();
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      } finally {
        setPageLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, token, navigate]);

  const fetchMedicines = async () => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching inventory data...');
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      console.log('Fetched inventory data:', data);
      
      // Transform the data to include both medicine and inventory information
      const inventoryList = data.inventory
        .filter((item: InventoryItem) => item.medicine) // Filter out items with null medicine
        .map((item: InventoryItem) => ({
          _id: item.medicine._id,
          name: item.medicineName || item.medicine.name,
          category: item.medicine.category,
          manufacturer: item.medicine.manufacturer,
          dosage: item.medicine.dosage,  // Remove the fallback since dosage is required
          price: item.medicine.price,
          usage: item.medicine.usage,
          requiresPrescription: item.medicine.requiresPrescription,
          inventory: {
            quantity: item.quantity,
            unit: item.unit,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            status: item.status,
            lastRestocked: item.lastRestocked,
            reorderLevel: item.reorderLevel
          }
        }));

      console.log('Processed inventory list:', inventoryList);
      setMedicines(inventoryList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    }
  };

  // Add useEffect to log medicines state changes
  useEffect(() => {
    console.log('Current medicines state:', medicines);
  }, [medicines]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddMedicine = async () => {
    if (!token || !isAuthenticated) {
      navigate('/login');
      return;
    }

    // Validate required fields
    const requiredFields = {
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      manufacturer: formData.manufacturer,
      dosage: formData.dosage,
      usage: formData.usage,
      quantity: formData.quantity,
      price: formData.price
    };

    // Log validation details
    console.log('Validating fields:', requiredFields);
    
    const emptyFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || (typeof value === 'number' && value <= 0))
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      const errorMessage = `Please fill in the following required fields: ${emptyFields.join(', ')}`;
      setError(errorMessage);
      console.log('Validation failed:', errorMessage);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Log the exact data being sent
      console.log('Sending medicine data:', JSON.stringify(formData, null, 2));

      const response = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      // Log the response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to add medicine');
      }

      const responseData = await response.json();
      console.log('Server response:', responseData);

      // Refresh medicines list immediately
      console.log('Refreshing medicines list...');
      await fetchMedicines();
      console.log('Medicines list refreshed');

      // Show success message
      setError(null);
      alert('Medicine added successfully!');

      // Reset form
      setFormData({
        name: '',
        brand: '',
        category: '',
        quantity: 0,
        unit: 'pcs',
        dosage: '',
        price: 0,
        requiresPrescription: false,
        manufacturer: '',
        usage: '',
        expiryDate: '',
        batchNumber: ''
      });

      // Scroll to the medicines list
      const medicinesListElement = document.querySelector('#medicines-list');
      if (medicinesListElement) {
        medicinesListElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error adding medicine:', error);
      setError(error instanceof Error ? error.message : 'Failed to add medicine');
    } finally {
      setLoading(false);
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
    }
  };

  const handleRestock = async (itemId: string) => {
    try {
      // Find the item to get its current quantity and reorder level
      const item = lowStockItems.find(i => i._id === itemId);
      if (!item) return;

      // Calculate the quantity to add (difference between reorder level and current quantity plus some buffer)
      const quantityToAdd = (item.reorderLevel - item.quantity) + 10; // Adding 10 as buffer

      const response = await fetch(`http://localhost:5000/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: item.quantity + quantityToAdd,
          lastRestocked: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restock item');
      }

      // Refresh the low stock items list
      await fetchLowStockItems();
      showNotification('success', `Successfully restocked ${item.medicine.name}`);
    } catch (error) {
      console.error('Error restocking item:', error);
      showNotification('error', 'Failed to restock item');
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, [token]);

  if (pageLoading) {
    return (
      <MainLayout title="Medicines Management">
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Medicines Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Medicine Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Medicine</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm text-gray-600">Medicine Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter medicine name"
                value={formData.name}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="category" className="mb-1 text-sm text-gray-600">Category *</label>
              <input
                id="category"
                type="text"
                name="category"
                placeholder="Enter category"
                value={formData.category}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="manufacturer" className="mb-1 text-sm text-gray-600">Manufacturer *</label>
              <input
                id="manufacturer"
                type="text"
                name="manufacturer"
                placeholder="Enter manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="dosage" className="mb-1 text-sm text-gray-600">Dosage (e.g., 500mg) *</label>
              <input
                id="dosage"
                type="text"
                name="dosage"
                placeholder="Enter dosage"
                value={formData.dosage}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="quantity" className="mb-1 text-sm text-gray-600">Initial Stock Quantity *</label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                placeholder="Enter initial stock quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="price" className="mb-1 text-sm text-gray-600">Price (₹) *</label>
              <input
                id="price"
                type="number"
                name="price"
                placeholder="Enter price in rupees"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="usage" className="mb-1 text-sm text-gray-600">Usage Instructions *</label>
              <textarea
                id="usage"
                name="usage"
                placeholder="Enter usage instructions"
                value={formData.usage}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="unit" className="mb-1 text-sm text-gray-600">Unit</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="pcs">pcs</option>
                <option value="bottles">bottles</option>
                <option value="strips">strips</option>
                <option value="boxes">boxes</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="expiryDate" className="mb-1 text-sm text-gray-600">Expiry Date</label>
              <input
                id="expiryDate"
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="batchNumber" className="mb-1 text-sm text-gray-600">Batch Number</label>
              <input
                id="batchNumber"
                type="text"
                name="batchNumber"
                placeholder="Enter batch number"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                name="requiresPrescription"
                id="requiresPrescription"
                checked={formData.requiresPrescription}
                onChange={handleCheckboxChange}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="requiresPrescription">Requires Prescription</label>
            </div>
          </div>
          <button
            onClick={handleAddMedicine}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400"
          >
            <PlusCircle size={18} />
            {loading ? 'Adding...' : 'Add Medicine'}
          </button>
        </div>

        {/* Medicines List */}
        <div id="medicines-list" className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inventory List {medicines.length > 0 && `(${medicines.length} items)`}
          </h2>
          {medicines.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No items in inventory</p>
              </div>
              <div className="max-w-md mx-auto">
                <p className="text-gray-600 text-sm mb-2">
                  To add a new medicine to inventory, fill out the form above with the following details:
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside text-left">
                  <li>Medicine name and brand</li>
                  <li>Category and manufacturer</li>
                  <li>Dosage and usage instructions</li>
                  <li>Quantity and unit</li>
                  <li>Price and prescription requirements</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Category</th>
                    <th className="border px-4 py-2 text-left">Manufacturer</th>
                    <th className="border px-4 py-2 text-left">Dosage</th>
                    <th className="border px-4 py-2 text-left">Quantity</th>
                    <th className="border px-4 py-2 text-left">Batch No.</th>
                    <th className="border px-4 py-2 text-left">Price</th>
                    <th className="border px-4 py-2 text-left">Expiry Date</th>
                    <th className="border px-4 py-2 text-left">Last Restocked</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((medicine) => (
                    <tr key={medicine._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{medicine.name}</td>
                      <td className="border px-4 py-2">{medicine.category}</td>
                      <td className="border px-4 py-2">{medicine.manufacturer}</td>
                      <td className="border px-4 py-2">{medicine.dosage}</td>
                      <td className="border px-4 py-2">{medicine.inventory?.quantity || 0}</td>
                      <td className="border px-4 py-2">{medicine.inventory?.batchNumber || '-'}</td>
                      <td className="border px-4 py-2">₹{medicine.price.toFixed(2)}</td>
                      <td className="border px-4 py-2">
                        {medicine.inventory?.expiryDate ? new Date(medicine.inventory.expiryDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="border px-4 py-2">
                        {medicine.inventory?.lastRestocked ? new Date(medicine.inventory.lastRestocked).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Alert</h2>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No low stock items at the moment
            </div>
          ) : (
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
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <button 
              onClick={() => window.location.href = '/inventory'}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View Full Inventory
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InventoryManagement;
