import asyncHandler from 'express-async-handler';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Create a new medicine
// @route   POST /api/medicines
// @access  Private/Pharmacist
const createMedicine = asyncHandler(async (req, res) => {
  console.log('Received medicine creation request with body:', JSON.stringify(req.body, null, 2));

  const {
    name,
    brand,
    category,
    manufacturer,
    dosage,
    usage,
    quantity,
    unit,
    price,
    requiresPrescription,
    batchNumber,
    expiryDate,
  } = req.body;

  // Log extracted fields
  console.log('Extracted fields:', {
    name,
    brand,
    category,
    manufacturer,
    dosage,
    usage,
    quantity,
    unit,
    price,
    requiresPrescription,
    batchNumber,
    expiryDate,
  });

  try {
    // Check if medicine already exists
    let medicine = await Medicine.findOne({
      name,
      brand,
      manufacturer
    });

    if (medicine) {
      // If medicine exists, check if it has inventory
      const existingInventory = await Inventory.findOne({ medicine: medicine._id });
      
      if (existingInventory) {
        // Update existing inventory
        existingInventory.quantity += quantity || 0;
        existingInventory.unit = unit || existingInventory.unit;
        existingInventory.batchNumber = batchNumber || existingInventory.batchNumber;
        existingInventory.expiryDate = expiryDate || existingInventory.expiryDate;
        existingInventory.lastRestocked = Date.now();
        existingInventory.updatedBy = req.user._id;
        
        await existingInventory.save();
        
        res.status(200).json({
          medicine,
          inventory: existingInventory,
          message: 'Medicine exists, inventory updated'
        });
        return;
      }
    } else {
      // Create new medicine if it doesn't exist
      medicine = await Medicine.create({
        name,
        brand,
        category,
        manufacturer,
        dosage,
        usage,
        price,
        requiresPrescription,
        addedBy: req.user._id,
      });
    }

    // Create new inventory entry
    const inventory = await Inventory.create({
      medicine: medicine._id,
      medicineName: medicine.name,
      quantity: quantity || 0,
      unit,
      batchNumber,
      expiryDate,
      reorderLevel: 10, // Default reorder level
      updatedBy: req.user._id,
    });

    res.status(201).json({
      medicine,
      inventory,
      message: medicine ? 'Medicine and inventory created' : 'Medicine exists, new inventory created'
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    
    // If error is due to duplicate key, send appropriate message
    if (error.code === 11000) {
      res.status(400);
      throw new Error('Medicine with this name, brand, and manufacturer already exists');
    }
    
    res.status(400);
    throw error;
  }
});

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private/Pharmacist
const getMedicines = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Filter options
  const filter = { isDeleted: false };
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.manufacturer) {
    filter.manufacturer = req.query.manufacturer;
  }
  
  if (req.query.supplier) {
    filter.supplier = req.query.supplier;
  }

  // Search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Query execution
  const count = await Medicine.countDocuments(filter);
  
  const medicines = await Medicine.find(filter)
    .populate('supplier', 'name')
    .populate('addedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  res.json({
    medicines,
    page,
    pages: Math.ceil(count / limit),
    totalCount: count,
  });
});

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Private/Pharmacist
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id)
    .populate('supplier', 'name contactPerson email phone')
    .populate('addedBy', 'name');

  if (medicine) {
    // Get inventory info
    const inventory = await Inventory.findOne({ medicine: medicine._id });
    
    res.json({
      ...medicine._doc,
      inventory: inventory || null,
    });
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/Pharmacist
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (medicine) {
    const oldName = medicine.name;
    medicine.name = req.body.name || medicine.name;
    medicine.description = req.body.description || medicine.description;
    medicine.category = req.body.category || medicine.category;
    medicine.manufacturer = req.body.manufacturer || medicine.manufacturer;
    medicine.supplier = req.body.supplier || medicine.supplier;
    medicine.dosage = req.body.dosage || medicine.dosage;
    medicine.strength = req.body.strength || medicine.strength;
    medicine.batchNumber = req.body.batchNumber || medicine.batchNumber;
    medicine.expiryDate = req.body.expiryDate || medicine.expiryDate;
    medicine.price = req.body.price || medicine.price;
    medicine.costPrice = req.body.costPrice || medicine.costPrice;
    medicine.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : medicine.isAvailable;

    if (req.file) {
      medicine.image = req.file.filename;
    }

    const updatedMedicine = await medicine.save();

    // If medicine name changed, update all related inventory items
    if (oldName !== medicine.name) {
      await Inventory.updateMany(
        { medicine: medicine._id },
        { medicineName: medicine.name }
      );
    }

    // Check if inventory needs to be updated
    if (req.body.quantity || req.body.reorderLevel) {
      const inventory = await Inventory.findOne({ medicine: medicine._id });
      
      if (inventory) {
        if (req.body.quantity !== undefined) {
          inventory.quantity = req.body.quantity;
          inventory.lastRestocked = Date.now();
        }
        
        if (req.body.reorderLevel) {
          inventory.reorderLevel = req.body.reorderLevel;
        }
        
        inventory.updatedBy = req.user._id;
        await inventory.save();
      }
    }

    res.json(updatedMedicine);
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Delete medicine (soft delete)
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (medicine) {
    medicine.isDeleted = true;
    medicine.isAvailable = false;
    await medicine.save();
    
    res.json({ message: 'Medicine removed' });
  } else {
    res.status(404);
    throw new Error('Medicine not found');
  }
});

// @desc    Get medicine categories
// @route   GET /api/medicines/categories
// @access  Private/Pharmacist
const getMedicineCategories = asyncHandler(async (req, res) => {
  const categories = await Medicine.distinct('category');
  res.json(categories);
});

// @desc    Get medicine manufacturers
// @route   GET /api/medicines/manufacturers
// @access  Private/Pharmacist
const getMedicineManufacturers = asyncHandler(async (req, res) => {
  const manufacturers = await Medicine.distinct('manufacturer');
  res.json(manufacturers);
});

// @desc    Check expiring medicines
// @route   GET /api/medicines/expiring
// @access  Private/Pharmacist
const getExpiringMedicines = asyncHandler(async (req, res) => {
  // Get medicines expiring in the next 90 days
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setDate(threeMonthsFromNow.getDate() + 90);
  
  const expiringMedicines = await Medicine.find({
    expiryDate: { $lte: threeMonthsFromNow, $gte: new Date() },
    isDeleted: false,
  })
    .populate('supplier', 'name')
    .sort({ expiryDate: 1 });

  res.json(expiringMedicines);
});

export {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicineCategories,
  getMedicineManufacturers,
  getExpiringMedicines,
};