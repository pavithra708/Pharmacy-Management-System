import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'Low Stock',
        'Expiry Alert',
        'New Order',
        'Payment',
        'System',
        'Other',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    for: {
      type: String,
      enum: ['admin', 'pharmacist', 'all'],
      default: 'all',
    },
    read: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedDocument: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['Medicine', 'Inventory', 'Sale', 'Supplier'],
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;