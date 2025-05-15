import express from 'express';
import Supplier from '../models/supplierModel.js';

const router = express.Router();

// POST /api/suppliers/add
router.post('/add', async (req, res) => {
  try {
    const { name, contact, email } = req.body;
    const newSupplier = new Supplier({ name, contact, email });
    const savedSupplier = await newSupplier.save();
    res.status(201).json(savedSupplier);
  } catch (err) {
    res.status(500).json({ message: 'Error saving supplier', error: err.message });
  }
});

// GET /api/suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching suppliers', error: err.message });
  }
});

export default router;
