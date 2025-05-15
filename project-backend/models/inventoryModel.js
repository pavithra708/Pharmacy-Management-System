import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please add a quantity'],
      min: 0,
      default: 0,
    },
    batchNumber: {
      type: String,
      required: [true, 'Please add a batch number'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please add an expiry date'],
    },
    lastRestocked: {
      type: Date,
      default: Date.now,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    location: {
      type: String,
      default: 'Main Storage',
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      default: 'In Stock',
    },
    notes: {
      type: String,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Update status based on quantity and reorder level
inventorySchema.pre('save', function (next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;