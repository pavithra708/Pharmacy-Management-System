import asyncHandler from 'express-async-handler';
import Sale from '../models/saleModel.js';
import Inventory from '../models/inventoryModel.js';
import Medicine from '../models/medicineModel.js';
import Notification from '../models/notificationModel.js';

// Helper to generate invoice number
const generateInvoiceNumber = async () => {
  const today = new Date();
  const year = today.getFullYear().toString().substr(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  const prefix = `INV-${year}${month}${day}`;
  
  // Count today's invoices
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const count = await Sale.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd },
  });
  
  // Generate sequence number
  const sequenceNumber = (count + 1).toString().padStart(3, '0');
  
  return `${prefix}-${sequenceNumber}`;
};

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private/Pharmacist
const createSale = asyncHandler(async (req, res) => {
  const {
    customer,
    items,
    totalAmount,
    discount,
    tax,
    grandTotal,
    paymentMethod,
    paymentStatus,
    notes,
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No items in sale');
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create sale
  const sale = await Sale.create({
    invoiceNumber,
    customer,
    items,
    totalAmount,
    discount,
    tax,
    grandTotal,
    paymentMethod,
    paymentStatus,
    notes,
    processedBy: req.user._id,
  });

  if (sale) {
    // Update inventory for each item
    for (const item of items) {
      const inventory = await Inventory.findOne({ medicine: item.medicine });
      
      if (inventory) {
        // Check if enough stock
        if (inventory.quantity < item.quantity) {
          res.status(400);
          throw new Error(`Not enough stock for medicine ID: ${item.medicine}`);
        }
        
        // Update inventory
        inventory.quantity -= item.quantity;
        inventory.updatedBy = req.user._id;
        await inventory.save();
        
        // Create notification if low stock after sale
        if (inventory.status === 'Low Stock' || inventory.status === 'Out of Stock') {
          const medicine = await Medicine.findById(item.medicine);
          
          await Notification.create({
            type: 'Low Stock',
            title: `${inventory.status} Alert`,
            message: `${medicine.name} is now at ${inventory.status} level after a sale. Current quantity: ${inventory.quantity}`,
            priority: inventory.status === 'Out of Stock' ? 'High' : 'Medium',
            for: 'all',
            relatedDocument: inventory._id,
            onModel: 'Inventory',
          });

          // Update medicine availability if out of stock
          if (inventory.status === 'Out of Stock') {
            await Medicine.findByIdAndUpdate(item.medicine, {
              isAvailable: false,
            });
          }
        }
      }
    }
    
    // Create notification for new sale
    await Notification.create({
      type: 'New Order',
      title: 'New Sale Completed',
      message: `Sale #${invoiceNumber} has been completed for ${grandTotal.toFixed(2)}`,
      priority: 'Low',
      for: 'admin',
      relatedDocument: sale._id,
      onModel: 'Sale',
    });

    res.status(201).json(sale);
  } else {
    res.status(400);
    throw new Error('Invalid sale data');
  }
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Pharmacist
const getSales = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Filter options
  const filter = {};
  
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  
  if (req.query.paymentMethod) {
    filter.paymentMethod = req.query.paymentMethod;
  }
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.saleDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }
  
  // Search by invoice number or customer name
  if (req.query.search) {
    filter.$or = [
      { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
      { 'customer.name': { $regex: req.query.search, $options: 'i' } },
    ];
  }
  
  // Query execution
  const count = await Sale.countDocuments(filter);
  
  const sales = await Sale.find(filter)
    .populate('processedBy', 'name')
    .populate('items.medicine', 'name')
    .sort({ saleDate: -1 })
    .skip(startIndex)
    .limit(limit);

  res.json({
    sales,
    page,
    pages: Math.ceil(count / limit),
    totalCount: count,
  });
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Private/Pharmacist
const getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('processedBy', 'name')
    .populate('items.medicine', 'name category manufacturer');

  if (sale) {
    res.json(sale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private/Admin
const updateSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);

  if (sale) {
    // Only allow updating payment status and notes
    sale.paymentStatus = req.body.paymentStatus || sale.paymentStatus;
    sale.notes = req.body.notes || sale.notes;

    const updatedSale = await sale.save();
    res.json(updatedSale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Get sales statistics
// @route   GET /api/sales/stats
// @access  Private/Admin
const getSalesStats = asyncHandler(async (req, res) => {
  // Date range filter
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate) 
    : new Date(new Date().setDate(new Date().getDate() - 30));
  
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate) 
    : new Date();
  
  // Ensure endDate is set to end of day
  endDate.setHours(23, 59, 59, 999);
  
  // Total sales in period
  const totalSales = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$grandTotal' },
      },
    },
  ]);
  
  // Sales by payment method
  const salesByPaymentMethod = await Sale.aggregate([
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
  ]);
  
  // Daily sales for the period
  const dailySales = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
        count: { $sum: 1 },
        total: { $sum: '$grandTotal' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
  
  // Top selling medicines
  const topSellingMedicines = await Sale.aggregate([
    {
      $match: {
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $unwind: '$items',
    },
    {
      $group: {
        _id: '$items.medicine',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' },
      },
    },
    {
      $sort: { totalQuantity: -1 },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: 'medicines',
        localField: '_id',
        foreignField: '_id',
        as: 'medicine',
      },
    },
    {
      $unwind: '$medicine',
    },
    {
      $project: {
        _id: 1,
        totalQuantity: 1,
        totalRevenue: 1,
        medicineName: '$medicine.name',
        category: '$medicine.category',
      },
    },
  ]);

  res.json({
    totalSales: totalSales.length > 0 ? totalSales[0] : { count: 0, revenue: 0 },
    salesByPaymentMethod,
    dailySales,
    topSellingMedicines,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  });
});

export {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  getSalesStats,
};