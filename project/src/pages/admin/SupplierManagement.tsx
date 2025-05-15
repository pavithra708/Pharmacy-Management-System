import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface Supplier {
  _id: string; // MongoDB uses _id as string
  name: string;
  contact: string;
  email: string;
  itemsSupplied: string; // Added items supplied field
}

interface ApiError {
  message: string;
  status?: number;
}

interface SupplierCache {
  data: Supplier[];
  timestamp: number;
}

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [itemsSupplied, setItemsSupplied] = useState(''); // New state for items supplied
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implement debounced fetch with caching and retry logic
  const fetchSuppliers = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    // Check cache first
    const cachedData = localStorage.getItem('suppliersCache');
    if (cachedData) {
      const cache: SupplierCache = JSON.parse(cachedData);
      const now = Date.now();
      if (now - cache.timestamp < CACHE_DURATION) {
        setSuppliers(cache.data);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('Attempting to fetch suppliers...');
      
      const response = await fetch('http://localhost:5000/api/suppliers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Fetch response status:', response.status);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        if (retryCount < maxRetries) {
          // Use retryAfter value (in seconds) converted to milliseconds, with exponential backoff
          const delay = Math.min(retryAfter * 1000 * Math.pow(2, retryCount), 10000);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchSuppliers(retryCount + 1);
        } else {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched suppliers data:', data);

      let supplierData: Supplier[] = [];
      if (Array.isArray(data)) {
        supplierData = data;
      } else if (data.suppliers && Array.isArray(data.suppliers)) {
        supplierData = data.suppliers;
      } else {
        throw new Error('Invalid data format received from server');
      }

      // Update cache
      localStorage.setItem('suppliersCache', JSON.stringify({
        data: supplierData,
        timestamp: Date.now()
      }));

      setSuppliers(supplierData);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError(error instanceof Error ? error.message : 'Error loading suppliers');
      
      // Retry on network errors
      if (retryCount < maxRetries && !(error instanceof Error && error.message.includes('Rate limit exceeded'))) {
        const delay = Math.min(baseDelay * Math.pow(2, retryCount), 10000);
        console.log(`Network error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchSuppliers(retryCount + 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Use debounced effect for initial fetch
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuppliers();
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [fetchSuppliers]);

  // Handle delete supplier
  const handleDeleteSupplier = async (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        console.log('Attempting to delete supplier:', supplierId);
        const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json() as ApiError;
          throw new Error(errorData.message || `Failed to delete supplier (Status: ${response.status})`);
        }

        setSuppliers(prevSuppliers => prevSuppliers.filter(supplier => supplier._id !== supplierId));
        alert('Supplier deleted successfully');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to delete supplier: ${errorMessage}`);
      }
    }
  };

  // Handle edit click
  const handleEditClick = (supplier: Supplier) => {
    console.log('Editing supplier:', supplier); // Log the supplier being edited
    setEditingSupplier(supplier);
    setShowEditForm(true);
  };

  // Handle edit supplier
  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    try {
      console.log('Attempting to update supplier:', editingSupplier._id);
      const updatePayload = {
        name: editingSupplier.name.trim(),
        contact: editingSupplier.contact.trim(),
        email: editingSupplier.email.trim(),
        itemsSupplied: editingSupplier.itemsSupplied.trim()
      };
      console.log('Update payload:', updatePayload);

      const response = await fetch(`http://localhost:5000/api/suppliers/${editingSupplier._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || `Failed to update supplier (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log('Update response data:', data);

      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier => 
          supplier._id === editingSupplier._id 
            ? { ...supplier, ...updatePayload }
            : supplier
        )
      );
      
      setShowEditForm(false);
      setEditingSupplier(null);
      alert('Supplier updated successfully!');
    } catch (error) {
      console.error('Error updating supplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to update supplier: ${errorMessage}`);
    }
  };

  // Add a new supplier
  const handleAddSupplier = async () => {
    if (!name || !contact || !email || !itemsSupplied) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/suppliers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, contact, email, itemsSupplied }),
      });

      if (response.ok) {
        const savedSupplier = await response.json();
        setSuppliers([...suppliers, savedSupplier]);
        // Reset all form fields
        setName('');
        setContact('');
        setEmail('');
        setItemsSupplied('');
        alert('Supplier added successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save supplier');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add supplier. Please try again.');
    }
  };

  return (
    <MainLayout title="Supplier Management">
      <div className="space-y-6">
        {/* Add Supplier Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Supplier</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Supplier Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <textarea
              placeholder="Items Supplied (e.g., Paracetamol, Antibiotics, etc.)"
              value={itemsSupplied}
              onChange={(e) => setItemsSupplied(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none h-[42px]"
            />
          </div>
          <button
            onClick={handleAddSupplier}
            disabled={isLoading}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={18} />
            {isLoading ? 'Adding...' : 'Add Supplier'}
          </button>
        </div>

        {/* Edit Supplier Modal */}
        {showEditForm && editingSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Supplier</h3>
                <button 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSupplier(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleEditSupplier}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    value={editingSupplier.name}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Contact Number"
                    value={editingSupplier.contact}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={editingSupplier.email}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    required
                  />
                  <textarea
                    placeholder="Items Supplied"
                    value={editingSupplier.itemsSupplied}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, itemsSupplied: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none h-[42px]"
                    required
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingSupplier(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Supplier List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Supplier List</h2>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <p className="text-gray-500">No suppliers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">Name</th>
                    <th className="border px-4 py-2 text-left">Contact</th>
                    <th className="border px-4 py-2 text-left">Email</th>
                    <th className="border px-4 py-2 text-left">Items Supplied</th>
                    <th className="border px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{supplier.name}</td>
                      <td className="border px-4 py-2">{supplier.contact}</td>
                      <td className="border px-4 py-2">{supplier.email}</td>
                      <td className="border px-4 py-2">{supplier.itemsSupplied}</td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditClick(supplier)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
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

export default SupplierManagement;
