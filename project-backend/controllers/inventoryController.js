import asyncHandler from 'express-async-handler';
import Inventory from '../models/inventoryModel.js';
import Medicine from '../models/medicineModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private/Pharmacist
const getInventory = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Filter options
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.location) {
    filter.location = req.query.location;
  }
  
  // First, clean up any inventory items with invalid medicine references
  const invalidInventoryItems = await Inventory.find({ medicine: { $exists: false } });
  if (invalidInventoryItems.length > 0) {
    console.log(`Found ${invalidInventoryItems.length} invalid inventory items. Cleaning up...`);
    await Inventory.deleteMany({ medicine: { $exists: false } });
  }
  
  // Query execution with medicine details and ensure medicine exists
  const count = await Inventory.countDocuments(filter);
  
  const inventory = await Inventory.find(filter)
    .populate({
      path: 'medicine',
      select: 'name category manufacturer price brand dosage usage requiresPrescription',
      match: { _id: { $exists: true } }
    })
    .populate('updatedBy', 'name')
    .sort({ updatedAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Filter out any items where medicine population failed and update medicineName if missing
  const validInventory = await Promise.all(inventory
    .filter(item => item.medicine)
    .map(async item => {
      // If medicineName is missing or different from medicine.name, update it
      if (!item.medicineName || item.medicineName !== item.medicine.name) {
        await Inventory.findByIdAndUpdate(item._id, {
          medicineName: item.medicine.name
        });
        item.medicineName = item.medicine.name;
      }
      return item;
    }));

  res.json({
    inventory: validInventory,
    page,
    pages: Math.ceil(count / limit),
    totalCount: validInventory.length,
  });
});

// @desc    Get inventory by ID
// @route   GET /api/inventory/:id
// @access  Private/Pharmacist
const getInventoryById = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id)
    .populate('medicine')
    .populate('updatedBy', 'name');

  if (inventory) {
    res.json(inventory);
  } else {
    res.status(404);
    throw new Error('Inventory not found');
  }
});

// @desc    Update inventory
// @route   PUT /api/inventory/:id
// @access  Private/Pharmacist
const updateInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);

  if (inventory) {
    // Get previous quantity for comparison
    const previousQuantity = inventory.quantity;
    
    // Update fields
    inventory.quantity = req.body.quantity !== undefined ? req.body.quantity : inventory.quantity;
    inventory.batchNumber = req.body.batchNumber || inventory.batchNumber;
    inventory.expiryDate = req.body.expiryDate || inventory.expiryDate;
    inventory.reorderLevel = req.body.reorderLevel || inventory.reorderLevel;
    inventory.location = req.body.location || inventory.location;
    inventory.notes = req.body.notes || inventory.notes;
    inventory.updatedBy = req.user._id;

    // If medicine is being updated, update the medicine name as well
    if (req.body.medicine) {
      const medicine = await Medicine.findById(req.body.medicine);
      if (medicine) {
        inventory.medicine = medicine._id;
        inventory.medicineName = medicine.name;
      }
    }
    
    // If we're adding stock, update lastRestocked
    if (req.body.quantity > previousQuantity) {
      inventory.lastRestocked = Date.now();
    }

    const updatedInventory = await inventory.save();
    
    // Check if we need to create a notification for low stock
    if (updatedInventory.status === 'Low Stock') {
      // Get medicine details
      const medicine = await Medicine.findById(updatedInventory.medicine);
      
      // Create notification
      await Notification.create({
        type: 'Low Stock',
        title: 'Low Stock Alert',
        message: `${medicine.name} is running low on stock. Current quantity: ${updatedInventory.quantity}`,
        priority: 'Medium',
        for: 'all',
        relatedDocument: updatedInventory._id,
        onModel: 'Inventory',
      });
    }
    
    if (updatedInventory.status === 'Out of Stock') {
      // Get medicine details
      const medicine = await Medicine.findById(updatedInventory.medicine);
      
      // Create notification
      await Notification.create({
        type: 'Low Stock',
        title: 'Out of Stock Alert',
        message: `${medicine.name} is out of stock.`,
        priority: 'High',
        for: 'all',
        relatedDocument: updatedInventory._id,
        onModel: 'Inventory',
      });
      
      // Update medicine availability
      await Medicine.findByIdAndUpdate(updatedInventory.medicine, {
        isAvailable: false,
      });
    }

    res.json(updatedInventory);
  } else {
    res.status(404);
    throw new Error('Inventory not found');
  }
});

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Pharmacist
const getLowStockItems = asyncHandler(async (req, res) => {
  const lowStockItems = await Inventory.find({
    status: { $in: ['Low Stock', 'Out of Stock'] },
  })
    .populate('medicine', 'name category manufacturer price')
    .sort({ quantity: 1 });

  res.json(lowStockItems);
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private/Admin
const getInventoryStats = asyncHandler(async (req, res) => {
  // Get total count by status
  const statusStats = await Inventory.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get total inventory value
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
      },
    },
  ]);

  // Get expiring soon count (next 90 days)
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
  
  const expiringSoon = await Inventory.countDocuments({
    expiryDate: { $lte: threeMonthsFromNow, $gte: new Date() },
  });

  res.json({
    statusStats,
    inventoryValue: inventoryValue.length > 0 ? inventoryValue[0] : { totalValue: 0, totalItems: 0 },
    expiringSoon,
  });
});

// @desc    Check expiring inventory
// @route   GET /api/inventory/expiring
// @access  Private/Pharmacist
const getExpiringInventory = asyncHandler(async (req, res) => {
  // Get items expiring in the next 90 days
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
  
  const expiringItems = await Inventory.find({
    expiryDate: { $lte: threeMonthsFromNow, $gte: new Date() },
  })
    .populate('medicine', 'name category manufacturer')
    .sort({ expiryDate: 1 });

  res.json(expiringItems);
});

// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private
const createInventory = asyncHandler(async (req, res) => {
  const {
    medicineId,
    medicineName,
    quantity,
    unit,
    batchNumber,
    expiryDate,
    reorderLevel,
  } = req.body;

  try {
    // Check if medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      res.status(404);
      throw new Error('Medicine not found');
    }

    // Create inventory item
    const inventory = await Inventory.create({
      medicine: medicineId,
      medicineName: medicineName || medicine.name,
      quantity,
      unit,
      batchNumber,
      expiryDate,
      reorderLevel,
      status: quantity <= reorderLevel ? 'Low Stock' : 'In Stock',
      lastRestocked: new Date(),
      updatedBy: req.user._id
    });

    if (inventory) {
      res.status(201).json({
        inventory: {
          ...inventory._doc,
          medicine: medicine
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid inventory data');
    }
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(400);
    throw error;
  }
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Pharmacist
const deleteInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  // Get the associated medicine
  const medicine = await Medicine.findById(inventory.medicine);

  // Delete the inventory item
  await inventory.deleteOne();

  // If medicine exists and has no other inventory items, mark it as unavailable
  if (medicine) {
    const otherInventory = await Inventory.findOne({ medicine: medicine._id });
    if (!otherInventory) {
      medicine.isAvailable = false;
      await medicine.save();
    }
  }

  res.json({ message: 'Inventory item removed' });
});

export {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  getLowStockItems,
  getInventoryStats,
  getExpiringInventory,
  deleteInventory,
};