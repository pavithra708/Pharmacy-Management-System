// controllers/orderController.js
import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';

// Helper function to generate order number
async function generateOrderNumber() {
  try {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const prefix = `ORD${year}${month}${day}`;

    // Find the last order number for today
    const lastOrder = await Order.findOne(
      { 
        orderNumber: { $regex: `^${prefix}` },
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      },
      {},
      { sort: { orderNumber: -1 } }
    );

    let sequence = '001';
    if (lastOrder && lastOrder.orderNumber) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-3));
      sequence = (lastSequence + 1).toString().padStart(3, '0');
    }

    return `${prefix}${sequence}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    throw new Error('Failed to generate order number');
  }
}

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  try {
    const { items, customerDetails } = req.body;

    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.paymentMethod) {
      res.status(400);
      throw new Error('Customer details are required');
    }

    // Generate order number
    let orderNumber;
    try {
      orderNumber = await generateOrderNumber();
      console.log('Generated order number:', orderNumber); // Debug log
    } catch (error) {
      console.error('Error generating order number:', error);
      res.status(500);
      throw new Error('Failed to generate order number. Please try again.');
    }

    // Create the order
    const orderData = {
      orderNumber,
      items: items.map(item => ({
        medicineName: item.medicineName,
        quantity: item.quantity,
        supplier: item.supplier
      })),
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        paymentMethod: customerDetails.paymentMethod
      },
      createdBy: req.user._id
    };

    console.log('Creating order with data:', orderData); // Debug log

    let order;
    try {
      order = await Order.create(orderData);
    } catch (error) {
      console.error('Error creating order in database:', error);
      res.status(500);
      if (error.name === 'ValidationError') {
        throw new Error(`Validation error: ${Object.values(error.errors).map(err => err.message).join(', ')}`);
      }
      throw new Error('Failed to create order in database. Please try again.');
    }

    if (!order) {
      res.status(500);
      throw new Error('Failed to create order - no order returned from database');
    }

    // Populate supplier information for the response
    try {
      const populatedOrder = await Order.findById(order._id)
        .populate('items.supplier', 'name contact email');
      res.status(201).json(populatedOrder);
    } catch (error) {
      console.error('Error populating order data:', error);
      // Still return the unpopulated order since it was created
      res.status(201).json(order);
    }
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to create order');
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ createdBy: req.user._id })
    .populate('items.supplier', 'name contact email')
    .sort('-createdAt');
  res.json(orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('items.supplier', 'name contact email');

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = status || order.status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
