import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a medicine name'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please add a brand name'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Please add dosage information'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  manufacturer: {
    type: String,
    required: [true, 'Please add a manufacturer'],
    trim: true
  },
  usage: {
    type: String,
    required: [true, 'Please add usage information'],
    trim: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create text indexes for search
medicineSchema.index({ name: 'text', manufacturer: 'text', usage: 'text' });

// Add compound unique index to prevent duplicates
medicineSchema.index({ name: 1, brand: 1, manufacturer: 1 }, { unique: true });

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;