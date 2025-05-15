import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  dosage: string;
  category: string;
  manufacturer: string;
  usage: string;
  requiresPrescription: boolean;
  price: number;
}

interface InventoryItem {
  _id: string;
  medicine: Medicine;
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastRestocked: string;
  reorderLevel: number;
}

interface NewInventoryItem {
  medicine: {
    name: string;
    brand: string;
    dosage: string;
    category: string;
    manufacturer: string;
    usage: string;
    requiresPrescription: boolean;
    price: number;
  };
  quantity: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  reorderLevel: number;
}

const InventoryManagement = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useUser();
  const { showNotification } = useNotification();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<NewInventoryItem>({
    medicine: {
      name: '',
      brand: '',
      dosage: '',
      category: '',
      manufacturer: '',
      usage: '',
      requiresPrescription: false,
      price: 0
    },
    quantity: 0,
    unit: 'pcs',
    batchNumber: '',
    expiryDate: '',
    reorderLevel: 10
  });

  // Only check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
    }
  }, [isAuthenticated, token, navigate]);

  const fetchInventory = useCallback(async () => {
    try {
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      console.log('Fetched inventory data:', data); // Debug log

      if (Array.isArray(data.inventory)) {
        setInventory(data.inventory);
        showNotification('success', 'Inventory loaded successfully');
      } else {
        throw new Error('Invalid inventory data format');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(error instanceof Error ? error.message : 'Failed to load inventory');
      showNotification('error', 'Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, navigate, showNotification]);

  // Initial fetch
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Refresh interval
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchInventory();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchInventory]);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Validate required fields
      const requiredFields = {
        'Medicine Name': newItem.medicine.name,
        'Brand': newItem.medicine.brand,
        'Category': newItem.medicine.category,
        'Dosage': newItem.medicine.dosage,
        'Price': newItem.medicine.price,
        'Batch Number': newItem.batchNumber,
        'Expiry Date': newItem.expiryDate,
        'Quantity': newItem.quantity
      };

      const emptyFields = Object.entries(requiredFields)
        .filter(([, value]) => !value || (typeof value === 'number' && value <= 0))
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        setError(`Please fill in the following required fields: ${emptyFields.join(', ')}`);
        return;
      }

      // Create medicine
      const medicineResponse = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newItem.medicine,
          batchNumber: newItem.batchNumber,
          expiryDate: newItem.expiryDate,
          addedBy: user?._id
        }),
      });

      if (!medicineResponse.ok) {
        const medicineError = await medicineResponse.json();
        throw new Error(medicineError.message || 'Failed to create medicine');
      }

      const medicineData = await medicineResponse.json();

      // Create inventory item
      const inventoryData = {
        medicineId: medicineData.medicine._id,
        medicineName: medicineData.medicine.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        batchNumber: newItem.batchNumber,
        expiryDate: newItem.expiryDate,
        reorderLevel: newItem.reorderLevel,
        updatedBy: user?._id
      };

      const inventoryResponse = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inventoryData),
      });

      if (!inventoryResponse.ok) {
        // If inventory creation fails, delete the medicine to maintain consistency
        await fetch(`http://localhost:5000/api/medicines/${medicineData.medicine._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const inventoryError = await inventoryResponse.json();
        throw new Error(inventoryError.message || 'Failed to create inventory item');
      }

      // Refresh the inventory list
      await fetchInventory();

      // Reset form and show success message
      setNewItem({
        medicine: {
          name: '',
          brand: '',
          dosage: '',
          category: '',
          manufacturer: '',
          usage: '',
          requiresPrescription: false,
          price: 0
        },
        quantity: 0,
        unit: 'pcs',
        batchNumber: '',
        expiryDate: '',
        reorderLevel: 10
      });
      
      setShowForm(false);
      showNotification('success', 'Medicine added to inventory successfully');
    } catch (error) {
      console.error('Error adding inventory:', error);
      setError(error instanceof Error ? error.message : 'Failed to add inventory item');
      showNotification('error', 'Failed to add inventory item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInventory = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/inventory/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setInventory(inventory.filter(item => item._id !== itemId));
        showNotification('success', 'Inventory item deleted successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Error deleting inventory item');
        showNotification('error', 'Failed to delete inventory item. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete inventory item');
      showNotification('error', 'Failed to delete inventory item. Please try again.');
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.medicine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.medicine?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.medicine?.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout title="Inventory Management">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Medicine Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus size={18} />
              <span>Add Inventory Item</span>
            </button>
          </div>
        </div>

        {/* Add Inventory Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Add New Medicine to Inventory</h3>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medicine Details */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-700 mb-3">Medicine Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label htmlFor="medicineName" className="text-sm text-gray-600 mb-1">Medicine Name</label>
                      <input
                        id="medicineName"
                        type="text"
                        placeholder="Enter medicine name"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.name}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, name: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="brand" className="text-sm text-gray-600 mb-1">Brand</label>
                      <input
                        id="brand"
                        type="text"
                        placeholder="Enter brand name"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.brand}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, brand: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="dosage" className="text-sm text-gray-600 mb-1">Dosage</label>
                      <input
                        id="dosage"
                        type="text"
                        placeholder="e.g., 500mg"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.dosage}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, dosage: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="category" className="text-sm text-gray-600 mb-1">Category</label>
                      <input
                        id="category"
                        type="text"
                        placeholder="Enter category"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.category}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, category: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="manufacturer" className="text-sm text-gray-600 mb-1">Manufacturer</label>
                      <input
                        id="manufacturer"
                        type="text"
                        placeholder="Enter manufacturer"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.manufacturer}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, manufacturer: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="price" className="text-sm text-gray-600 mb-1">Price (₹)</label>
                      <input
                        id="price"
                        type="number"
                        placeholder="Enter price"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.price}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, price: parseFloat(e.target.value) }
                        })}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="usage" className="text-sm text-gray-600 mb-1">Usage Information</label>
                      <textarea
                        id="usage"
                        placeholder="Enter usage information"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.medicine.usage}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, usage: e.target.value }
                        })}
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requiresPrescription"
                        className="rounded text-teal-600"
                        checked={newItem.medicine.requiresPrescription}
                        onChange={(e) => setNewItem({
                          ...newItem,
                          medicine: { ...newItem.medicine, requiresPrescription: e.target.checked }
                        })}
                      />
                      <label htmlFor="requiresPrescription" className="ml-2">
                        Requires Prescription
                      </label>
                    </div>
                  </div>
                </div>

                {/* Inventory Details */}
                <div className="col-span-2">
                  <h4 className="text-lg font-medium text-gray-700 mb-3">Inventory Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label htmlFor="quantity" className="text-sm text-gray-600 mb-1">Quantity</label>
                      <input
                        id="quantity"
                        type="number"
                        placeholder="Enter quantity"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                        required
                        min="0"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="unit" className="text-sm text-gray-600 mb-1">Unit</label>
                      <input
                        id="unit"
                        type="text"
                        placeholder="e.g., pcs, boxes"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="batchNumber" className="text-sm text-gray-600 mb-1">Batch Number</label>
                      <input
                        id="batchNumber"
                        type="text"
                        placeholder="Enter batch number"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.batchNumber}
                        onChange={(e) => setNewItem({ ...newItem, batchNumber: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="expiryDate" className="text-sm text-gray-600 mb-1">Expiry Date</label>
                      <input
                        id="expiryDate"
                        type="date"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.expiryDate}
                        onChange={(e) => setNewItem({ ...newItem, expiryDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="flex flex-col">
                      <label htmlFor="reorderLevel" className="text-sm text-gray-600 mb-1">Reorder Level</label>
                      <input
                        id="reorderLevel"
                        type="number"
                        placeholder="Enter reorder level"
                        className="w-full border border-gray-300 p-2 rounded-md"
                        value={newItem.reorderLevel}
                        onChange={(e) => setNewItem({ ...newItem, reorderLevel: parseInt(e.target.value) })}
                        required
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.medicine?.name}</div>
                          <div className="text-sm text-gray-500">{item.medicine?.brand}</div>
                          <div className="text-xs text-gray-500">{item.medicine?.dosage}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.medicine?.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                          item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteInventory(item._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InventoryManagement; 