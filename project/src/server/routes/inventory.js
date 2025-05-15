const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Get all inventory items
router.get('/', auth, async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('medicine');
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// Get medicines expiring in 5 days
router.get('/expiring', auth, async (req, res) => {
  try {
    const today = new Date();
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);

    const expiringMedicines = await Inventory.find({
      expiryDate: {
        $gte: today,
        $lte: fiveDaysFromNow
      }
    }).populate('medicine', 'name brand dosage');

    res.json({ expiringMedicines });
  } catch (error) {
    console.error('Error fetching expiring medicines:', error);
    res.status(500).json({ message: 'Error fetching expiring medicines' });
  }
});

// Add new inventory item
router.post('/', auth, async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    await inventory.save();
    res.status(201).json({ inventory });
  } catch (error) {
    res.status(400).json({ message: 'Error creating inventory item' });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json({ inventory });
  } catch (error) {
    res.status(400).json({ message: 'Error updating inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', auth, async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
});

module.exports = router; 