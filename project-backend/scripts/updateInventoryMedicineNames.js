import mongoose from 'mongoose';
import Inventory from '../models/inventoryModel.js';
import Medicine from '../models/medicineModel.js';

const updateInventoryMedicineNames = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pharmacy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB...');

    // Get all inventory items
    const inventoryItems = await Inventory.find().populate('medicine');
    console.log(`Found ${inventoryItems.length} inventory items to update`);

    // Update each inventory item
    for (const item of inventoryItems) {
      if (item.medicine) {
        await Inventory.findByIdAndUpdate(item._id, {
          medicineName: item.medicine.name
        });
        console.log(`Updated inventory item ${item._id} with medicine name: ${item.medicine.name}`);
      } else {
        console.log(`Warning: Inventory item ${item._id} has no associated medicine`);
      }
    }

    console.log('Finished updating inventory items');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateInventoryMedicineNames(); 