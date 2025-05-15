import React from 'react';

// Mock data for recent sales
const recentSales = [
  {
    id: '1',
    customer: 'John Doe',
    medicine: 'Paracetamol 500mg',
    date: '2023-07-12',
    quantity: 2,
    amount: 15.99
  },
  {
    id: '2',
    customer: 'Jane Smith',
    medicine: 'Amoxicillin 250mg',
    date: '2023-07-12',
    quantity: 1,
    amount: 24.50
  },
  {
    id: '3',
    customer: 'Robert Johnson',
    medicine: 'Vitamin C 1000mg',
    date: '2023-07-11',
    quantity: 3,
    amount: 18.75
  },
  {
    id: '4',
    customer: 'Sarah Williams',
    medicine: 'Ibuprofen 400mg',
    date: '2023-07-11',
    quantity: 1,
    amount: 12.25
  },
  {
    id: '5',
    customer: 'Michael Brown',
    medicine: 'Cetirizine 10mg',
    date: '2023-07-10',
    quantity: 2,
    amount: 9.99
  }
];

type RecentSalesTableProps = {
  limit?: number;
};

const RecentSalesTable = ({ limit = 5 }: RecentSalesTableProps) => {
  const displaySales = recentSales.slice(0, limit);
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Recent Sales</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicine
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displaySales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{sale.customer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{sale.medicine}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{sale.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{sale.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">${sale.amount.toFixed(2)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t text-center">
        <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View All Sales
        </button>
      </div>
    </div>
  );
};

export default RecentSalesTable;