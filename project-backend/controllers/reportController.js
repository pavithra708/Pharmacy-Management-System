import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';
import Supplier from '../models/supplierModel.js';

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private/Admin
const getSalesReport = asyncHandler(async (req, res) => {
  // Date range filter
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate) 
    : new Date(new Date().setDate(new Date().getDate() - 30));
  
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate) 
    : new Date();
  
  // Ensure endDate is set to end of day
  endDate.setHours(23, 59, 59, 999);
  
  // Aggregation for sales report
  const salesReport = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        sales: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
        discount: { $sum: '$discount' },
        tax: { $sum: '$tax' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  
  // Summary statistics
  const summary = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$grandTotal' },
        totalDiscount: { $sum: '$discount' },
        totalTax: { $sum: '$tax' },
        averageOrderValue: { $avg: '$grandTotal' },
      },
    },
  ]);
  
  // Payment method breakdown
  const paymentMethodStats = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$grandTotal' },
      },
    },
    {
      $project: {
        paymentMethod: '$_id',
        count: 1,
        total: 1,
        _id: 0,
      },
    },
  ]);

  res.json({
    reportType: 'Sales Report',
    dateRange: {
      start: startDate,
      end: endDate,
    },
    salesData: salesReport,
    summary: summary.length > 0 ? summary[0] : {
      totalSales: 0,
      totalRevenue: 0,
      totalDiscount: 0,
      totalTax: 0,
      averageOrderValue: 0,
    },
    paymentMethodStats,
  });
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private/Admin
const getInventoryReport = asyncHandler(async (req, res) => {
  // Inventory status breakdown
  const statusBreakdown = await Inventory.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        items: { $sum: '$quantity' },
      },
    },
  ]);
  
  // Low stock items
  const lowStockItems = await Inventory.find({ status: 'Low Stock' })
    .populate('medicine', 'name category manufacturer price')
    .sort({ quantity: 1 })
    .limit(20);
  
  // Out of stock items
  const outOfStockItems = await Inventory.find({ status: 'Out of Stock' })
    .populate('medicine', 'name category manufacturer price')
    .sort({ updatedAt: -1 })
    .limit(20);
  
  // Expiring soon (next 90 days)
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
  
  const expiringSoon = await Inventory.find({
    expiryDate: { $lte: threeMonthsFromNow, $gte: new Date() },
  })
    .populate('medicine', 'name category manufacturer price')
    .sort({ expiryDate: 1 })
    .limit(20);
  
  // Inventory value
  const inventoryValue = await Inventory.aggregate([
    {
      $lookup: {
        from: 'medicines',
        localField: 'medicine',
        foreignField: '_id',
        as: 'medicineData',
      },
    },
    {
      $unwind: '$medicineData',
    },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$quantity', '$medicineData.costPrice'] } },
        totalItems: { $sum: '$quantity' },
        distinctProducts: { $addToSet: '$medicine' },
      },
    },
    {
      $project: {
        totalValue: 1,
        totalItems: 1,
        distinctProductCount: { $size: '$distinctProducts' },
        _id: 0,
      },
    },
  ]);
  
  // Category distribution
  const categoryDistribution = await Medicine.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  res.json({
    reportType: 'Inventory Report',
    generatedAt: new Date(),
    statusBreakdown,
    lowStockItems,
    outOfStockItems,
    expiringSoon,
    inventoryValue: inventoryValue.length > 0 ? inventoryValue[0] : {
      totalValue: 0,
      totalItems: 0,
      distinctProductCount: 0,
    },
    categoryDistribution,
  });
});

// @desc    Get supplier report
// @route   GET /api/reports/suppliers
// @access  Private/Admin
const getSupplierReport = asyncHandler(async (req, res) => {
  // Active suppliers count
  const suppliersCount = await Supplier.countDocuments({ 
    isDeleted: false,
    accountStatus: 'Active',
  });
  
  // Suppliers with most medicines
  const topSuppliers = await Medicine.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $group: {
        _id: '$supplier',
        medicineCount: { $sum: 1 },
      },
    },
    {
      $sort: { medicineCount: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'suppliers',
        localField: '_id',
        foreignField: '_id',
        as: 'supplierData',
      },
    },
    {
      $unwind: '$supplierData',
    },
    {
      $project: {
        _id: 1,
        supplierName: '$supplierData.name',
        contactPerson: '$supplierData.contactPerson',
        email: '$supplierData.email',
        phone: '$supplierData.phone',
        medicineCount: 1,
      },
    },
  ]);
  
  // Recently added suppliers
  const recentSuppliers = await Supplier.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name contactPerson email phone createdAt');
  
  // Suppliers by status
  const suppliersByStatus = await Supplier.aggregate([
    {
      $group: {
        _id: '$accountStatus',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0,
      },
    },
  ]);

  res.json({
    reportType: 'Supplier Report',
    generatedAt: new Date(),
    suppliersCount,
    topSuppliers,
    recentSuppliers,
    suppliersByStatus,
  });
});

// @desc    Get profitability report
// @route   GET /api/reports/profitability
// @access  Private/Admin
const getProfitabilityReport = asyncHandler(async (req, res) => {
  // Date range filter
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate) 
    : new Date(new Date().setDate(new Date().getDate() - 30));
  
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate) 
    : new Date();
  
  // Ensure endDate is set to end of day
  endDate.setHours(23, 59, 59, 999);
  
  // Get all sales in the period
  const sales = await Sale.find({
    saleDate: { $gte: startDate, $lte: endDate },
  }).populate('items.medicine');
  
  // Calculate profit for each sale
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let profitMargin = 0;
  
  const profitByDay = {};
  
  for (const sale of sales) {
    let saleRevenue = sale.grandTotal;
    let saleCost = 0;
    
    for (const item of sale.items) {
      if (item.medicine && typeof item.medicine !== 'string') {
        saleCost += item.medicine.costPrice * item.quantity;
      }
    }
    
    const saleProfit = saleRevenue - saleCost;
    
    totalRevenue += saleRevenue;
    totalCost += saleCost;
    totalProfit += saleProfit;
    
    // Group by day
    const day = new Date(sale.saleDate).toISOString().split('T')[0];
    
    if (!profitByDay[day]) {
      profitByDay[day] = {
        date: day,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
    }
    
    profitByDay[day].revenue += saleRevenue;
    profitByDay[day].cost += saleCost;
    profitByDay[day].profit += saleProfit;
  }
  
  // Calculate profit margin
  if (totalRevenue > 0) {
    profitMargin = (totalProfit / totalRevenue) * 100;
  }
  
  // Convert profitByDay to array and sort by date
  const profitTimeline = Object.values(profitByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // Most profitable products
  const mostProfitableProducts = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $unwind: '$items',
    },
    {
      $lookup: {
        from: 'medicines',
        localField: 'items.medicine',
        foreignField: '_id',
        as: 'medicineData',
      },
    },
    {
      $unwind: '$medicineData',
    },
    {
      $project: {
        medicine: '$items.medicine',
        medicineName: '$medicineData.name',
        category: '$medicineData.category',
        quantity: '$items.quantity',
        revenue: '$items.subtotal',
        cost: { $multiply: ['$medicineData.costPrice', '$items.quantity'] },
        profit: { 
          $subtract: [
            '$items.subtotal', 
            { $multiply: ['$medicineData.costPrice', '$items.quantity'] }
          ] 
        },
      },
    },
    {
      $group: {
        _id: '$medicine',
        medicineName: { $first: '$medicineName' },
        category: { $first: '$category' },
        totalQuantity: { $sum: '$quantity' },
        totalRevenue: { $sum: '$revenue' },
        totalCost: { $sum: '$cost' },
        totalProfit: { $sum: '$profit' },
      },
    },
    {
      $project: {
        _id: 1,
        medicineName: 1,
        category: 1,
        totalQuantity: 1,
        totalRevenue: 1,
        totalCost: 1,
        totalProfit: 1,
        profitMargin: { 
          $multiply: [
            { $divide: ['$totalProfit', '$totalRevenue'] },
            100
          ]
        },
      },
    },
    {
      $sort: { totalProfit: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  res.json({
    reportType: 'Profitability Report',
    dateRange: {
      start: startDate,
      end: endDate,
    },
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
    },
    profitTimeline,
    mostProfitableProducts,
  });
});

export {
  getSalesReport,
  getInventoryReport,
  getSupplierReport,
  getProfitabilityReport,
};