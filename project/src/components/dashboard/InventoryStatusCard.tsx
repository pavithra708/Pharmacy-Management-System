import React from 'react';

// Mock data for low stock medicines
const lowStockMedicines = [
  {
    id: '1',
    name: 'Amoxicillin 500mg',
    currentStock: 10,
    minStock: 20,
  },
  {
    id: '2',
    name: 'Ibuprofen 400mg',
    currentStock: 5,
    minStock: 15,
  },
  {
    id: '3',
    name: 'Paracetamol 500mg',
    currentStock: 8,
    minStock: 25,
  }
];

const InventoryStatusCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Low Stock Alert</h2>
      </div>
      
      <div className="p-6">
        {lowStockMedicines.length > 0 ? (
          <div className="space-y-4">
            {lowStockMedicines.map((medicine) => (
              <div key={medicine.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                  <div className="text-sm text-red-600 mt-1">
                    Current Stock: {medicine.currentStock} (Min: {medicine.minStock})
                  </div>
                </div>
                <button className="px-3 py-1 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700">
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
        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View Full Inventory
        </button>
      </div>
    </div>
  );
};

export default InventoryStatusCard;