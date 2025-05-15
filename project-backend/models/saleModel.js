import mongoose from 'mongoose';

const saleItemSchema = mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const saleSchema = mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Please add a customer name'],
      },
      phone: {
        type: String,
      },
      email: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Mobile Payment', 'Other'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed'],
      default: 'Paid',
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;