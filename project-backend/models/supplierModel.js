import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true }
}, { timestamps: true });

const Supplier = mongoose.model('Supplier', SupplierSchema);
export default Supplier;
