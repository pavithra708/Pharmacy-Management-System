import mongoose from 'mongoose';
import Medicine from '../models/medicineModel.js';
import Inventory from '../models/inventoryModel.js';

const cleanupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/pharmacy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB...');

    // 1. Find duplicate medicines (same name, brand, and manufacturer)
    const medicines = await Medicine.find();
    const medicineMap = new Map();
    const duplicates = new Set();

    medicines.forEach(med => {
      const key = `${med.name}-${med.brand}-${med.manufacturer}`;
      if (medicineMap.has(key)) {
        duplicates.add(medicineMap.get(key));
        duplicates.add(med._id);
      } else {
        medicineMap.set(key, med._id);
      }
    });

    console.log(`Found ${duplicates.size} duplicate medicine records`);

    // 2. For each duplicate set, keep the one with inventory and delete others
    for (const dupId of duplicates) {
      const inventoryItems = await Inventory.find({ medicine: dupId });
      if (inventoryItems.length === 0) {
        console.log(`Deleting medicine without inventory: ${dupId}`);
        await Medicine.findByIdAndDelete(dupId);
      }
    }

    // 3. Clean up orphaned inventory records
    const allInventory = await Inventory.find();
    for (const inv of allInventory) {
      const medicine = await Medicine.findById(inv.medicine);
      if (!medicine) {
        console.log(`Deleting orphaned inventory: ${inv._id}`);
        await Inventory.findByIdAndDelete(inv._id);
      }
    }

    // 4. Ensure only one inventory record per medicine
    const medicineIds = await Medicine.find().distinct('_id');
    for (const medId of medicineIds) {
      const inventoryItems = await Inventory.find({ medicine: medId });
      if (inventoryItems.length > 1) {
        // Keep the most recently updated inventory
        const sortedInventory = inventoryItems.sort((a, b) => b.updatedAt - a.updatedAt);
        const keepInventory = sortedInventory[0];
        
        // Delete other inventory records
        for (let i = 1; i < sortedInventory.length; i++) {
          console.log(`Deleting duplicate inventory for medicine ${medId}: ${sortedInventory[i]._id}`);
          await Inventory.findByIdAndDelete(sortedInventory[i]._id);
        }
      }
    }

    console.log('Database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupDatabase(); 