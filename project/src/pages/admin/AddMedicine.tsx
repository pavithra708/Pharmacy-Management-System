import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../context/NotificationContext';

interface MedicineFormData {
  name: string;
  brand: string;
  category: string;
  manufacturer: string;
  dosage: string;
  usage: string;
  price: string;
  requiresPrescription: boolean;
  quantity: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  reorderLevel: string;
}

const AddMedicine = () => {
  const navigate = useNavigate();
  const { token } = useUser();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    brand: '',
    category: '',
    manufacturer: '',
    dosage: '',
    usage: '',
    price: '',
    requiresPrescription: false,
    quantity: '',
    unit: '',
    batchNumber: '',
    expiryDate: '',
    reorderLevel: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create medicine
      const medicineResponse = await fetch('http://localhost:5000/api/medicines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          manufacturer: formData.manufacturer,
          dosage: formData.dosage,
          usage: formData.usage,
          price: parseFloat(formData.price),
          requiresPrescription: formData.requiresPrescription
        })
      });

      if (!medicineResponse.ok) {
        throw new Error('Failed to create medicine');
      }

      const medicineData = await medicineResponse.json();

      // Create inventory entry
      const inventoryResponse = await fetch('http://localhost:5000/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          medicine: medicineData._id,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate,
          reorderLevel: parseInt(formData.reorderLevel)
        })
      });

      if (!inventoryResponse.ok) {
        throw new Error('Failed to create inventory entry');
      }

      showNotification('success', 'Medicine added successfully!');
      setTimeout(() => {
        navigate('/admin/inventory');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <MainLayout title="Add New Medicine">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Usage Instructions</label>
                <textarea
                  name="usage"
                  value={formData.usage}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="requiresPrescription"
                  checked={formData.requiresPrescription}
                  onChange={handleChange}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Requires Prescription
                </label>
              </div>
            </div>

            {/* Inventory Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900">Inventory Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Select Unit</option>
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ML</option>
                    <option value="mg">MG</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                  <input
                    type="text"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default AddMedicine; 