import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { 
  Search, Filter, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Medicine {
  _id: string;
  name: string;
  brand: string;
  dosage: string;
  category: string;
  price: number;
  inventory?: {
    quantity: number;
    batchNumber: string;
    expiryDate: string | null;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    unit: string;
  };
}

interface InventoryItem {
  medicine: {
    _id: string;
    name: string;
    brand: string;
    category: string;
    dosage: string;
    price: number;
  };
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  unit: string;
}

const MedicineManagement = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Available statuses for filtering
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];
  
  // Memoize the fetch function to prevent unnecessary recreations
  const fetchMedicines = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch from inventory endpoint instead of medicines
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medicines');
      }

      const data = await response.json();
      console.log('Fetched inventory data:', data);

      if (!data.inventory || !Array.isArray(data.inventory)) {
        throw new Error('Invalid data format received from server');
      }

      // Transform inventory data to medicine format
      const medicinesWithInventory: Medicine[] = data.inventory.map((item: InventoryItem) => ({
        _id: item.medicine._id,
        name: item.medicine.name,
        brand: item.medicine.brand,
        category: item.medicine.category,
        dosage: item.medicine.dosage,
        price: item.medicine.price,
        inventory: {
          quantity: item.quantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          status: item.status,
          unit: item.unit
        }
      }));

      // Filter based on search and filters
      let filteredMedicines = medicinesWithInventory;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredMedicines = filteredMedicines.filter(med => 
          med.name.toLowerCase().includes(searchLower) ||
          med.brand.toLowerCase().includes(searchLower) ||
          med.category.toLowerCase().includes(searchLower)
        );
      }

      if (filterCategory) {
        filteredMedicines = filteredMedicines.filter(med => 
          med.category === filterCategory
        );
      }

      if (filterStatus) {
        filteredMedicines = filteredMedicines.filter(med => 
          med.inventory?.status === filterStatus
        );
      }

      // Calculate pagination
      const totalItems = filteredMedicines.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      // Slice the array for current page
      const paginatedMedicines = filteredMedicines.slice(startIndex, endIndex);

      setMedicines(paginatedMedicines);
      setTotalPages(totalPages);

      // Get unique categories
      const uniqueCategories = Array.from(
        new Set(medicinesWithInventory.map(med => med.category))
      ).filter(Boolean);
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching medicines:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch medicines');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterCategory, filterStatus, itemsPerPage, navigate]);

  // Initial fetch and refresh setup
  useEffect(() => {
    fetchMedicines();

    // Set up refresh interval with a longer duration
    const refreshInterval = setInterval(() => {
      fetchMedicines();
    }, 30000); // Changed to 30 seconds instead of 5 seconds

    return () => clearInterval(refreshInterval);
  }, [fetchMedicines]); // Only depend on the memoized fetch function

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Add pagination controls
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Filter and sort medicines
  const sortedMedicines = [...medicines].sort((a, b) => {
    if (sortField === 'price' || sortField === 'quantity') {
      const valueA = sortField === 'quantity' ? a.inventory?.quantity || 0 : a.price;
      const valueB = sortField === 'quantity' ? b.inventory?.quantity || 0 : b.price;
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    const valueA = sortField === 'status' ? (a.inventory?.status || '').toLowerCase() : (a[sortField as keyof Medicine] || '').toString().toLowerCase();
    const valueB = sortField === 'status' ? (b.inventory?.status || '').toLowerCase() : (b[sortField as keyof Medicine] || '').toString().toLowerCase();
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
    <MainLayout title="Inventory Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Header with Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center mb-6">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search medicines..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-500">Filter by:</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1); // Reset to first page on filter change
                }}
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Medicines Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Medicine Name
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortField === 'category' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-1">
                      Stock
                      {sortField === 'quantity' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      Price
                      {sortField === 'price' && (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : medicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="text-gray-400 text-lg font-medium">No Medicines Found</div>
                        <div className="text-gray-500 text-sm max-w-md">
                          {searchTerm || filterCategory || filterStatus ? 
                            `No medicines match your search criteria. Try adjusting your filters.` :
                            `No medicines are currently available in the database. Add medicines through the Inventory Management.`
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedMedicines.map((medicine) => (
                    <tr key={medicine._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                          <div className="text-sm text-gray-500">{medicine.brand}</div>
                          <div className="text-xs text-gray-500">{medicine.dosage}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicine.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{medicine.inventory?.quantity || 0}</span>
                          {medicine.inventory?.unit && (
                            <span className="text-xs text-gray-400">{medicine.inventory.unit}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          medicine.inventory?.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                          medicine.inventory?.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {medicine.inventory?.status || 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{medicine.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicine.inventory?.expiryDate ? 
                          new Date(medicine.inventory.expiryDate).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicine.inventory?.batchNumber || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded-lg ${
                  currentPage === page ? 'bg-teal-600 text-white' : ''
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MedicineManagement;