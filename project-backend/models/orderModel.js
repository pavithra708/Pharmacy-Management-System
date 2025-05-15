import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: [true, 'Order number is required'],
    trim: true
  },
  items: [{
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    }
  }],
  customerDetails: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
      match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['cash', 'card', 'upi'],
        message: '{VALUE} is not a valid payment method'
      },
      required: [true, 'Payment method is required']
    }
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true
});

// Add index for orderNumber to ensure uniqueness
orderSchema.index({ orderNumber: 1 }, { unique: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
