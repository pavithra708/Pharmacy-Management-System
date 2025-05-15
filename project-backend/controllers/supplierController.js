import asyncHandler from 'express-async-handler';
import Supplier from '../models/supplierModel.js';
import Medicine from '../models/medicineModel.js';

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private/Admin
const createSupplier = asyncHandler(async (req, res) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    address,
    taxId,
    licenseNumber,
    paymentTerms,
    notes,
  } = req.body;

  // Check if supplier exists
  const supplierExists = await Supplier.findOne({ email });

  if (supplierExists && !supplierExists.isDeleted) {
    res.status(400);
    throw new Error('Supplier already exists');
  }

  // Create supplier
  const supplier = await Supplier.create({
    name,
    contactPerson,
    email,
    phone,
    address: address || {},
    taxId,
    licenseNumber,
    paymentTerms,
    notes,
    addedBy: req.user._id,
  });

  if (supplier) {
    res.status(201).json(supplier);
  } else {
    res.status(400);
    throw new Error('Invalid supplier data');
  }
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Pharmacist
const getSuppliers = asyncHandler(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;

  // Filter options
  const filter = { isDeleted: false };
  
  if (req.query.accountStatus) {
    filter.accountStatus = req.query.accountStatus;
  }

  // Search by name or email
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { contactPerson: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  
  // Query execution
  const count = await Supplier.countDocuments(filter);
  
  const suppliers = await Supplier.find(filter)
    .populate('addedBy', 'name')
    .sort({ name: 1 })
    .skip(startIndex)
    .limit(limit);

  res.json({
    suppliers,
    page,
    pages: Math.ceil(count / limit),
    totalCount: count,
  });
});

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private/Pharmacist
const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('addedBy', 'name')
    .populate('medicines');

  if (supplier) {
    res.json(supplier);
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    supplier.name = req.body.name || supplier.name;
    supplier.contactPerson = req.body.contactPerson || supplier.contactPerson;
    supplier.email = req.body.email || supplier.email;
    supplier.phone = req.body.phone || supplier.phone;
    
    if (req.body.address) {
      supplier.address = {
        ...supplier.address,
        ...req.body.address,
      };
    }
    
    supplier.taxId = req.body.taxId || supplier.taxId;
    supplier.licenseNumber = req.body.licenseNumber || supplier.licenseNumber;
    supplier.paymentTerms = req.body.paymentTerms || supplier.paymentTerms;
    supplier.accountStatus = req.body.accountStatus || supplier.accountStatus;
    supplier.notes = req.body.notes || supplier.notes;

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
});

// @desc    Delete supplier (soft delete)
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    // Check if supplier has medicines
    const medicineCount = await Medicine.countDocuments({ supplier: supplier._id });
    
    if (medicineCount > 0) {
      res.status(400);
      throw new Error('Cannot delete supplier with associated medicines. Update the medicines to use a different supplier first.');
    }
    
    supplier.isDeleted = true;
    supplier.accountStatus = 'Inactive';
    await supplier.save();
    
    res.json({ message: 'Supplier removed' });
  } else {
    res.status(404);
    throw new Error('Supplier not found');
  }
});

// @desc    Get medicines by supplier
// @route   GET /api/suppliers/:id/medicines
// @access  Private/Pharmacist
const getSupplierMedicines = asyncHandler(async (req, res) => {
  const medicines = await Medicine.find({
    supplier: req.params.id,
    isDeleted: false,
  }).sort({ name: 1 });

  res.json(medicines);
});

export {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  getSupplierMedicines,
};