import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  // Filter based on user role
  const filter = {
    $or: [
      { for: 'all' },
      { for: req.user.role },
      { user: req.user._id },
    ],
  };
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  
  // Query parameters
  if (req.query.read === 'true') {
    filter.read = true;
  } else if (req.query.read === 'false') {
    filter.read = false;
  }
  
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  
  // Count total notifications
  const count = await Notification.countDocuments(filter);
  
  // Get notifications
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);
  
  res.json({
    notifications,
    page,
    pages: Math.ceil(count / limit),
    totalCount: count,
    unreadCount: await Notification.countDocuments({
      ...filter,
      read: false,
    }),
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification) {
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  // Filter based on user role
  const filter = {
    $or: [
      { for: 'all' },
      { for: req.user.role },
      { user: req.user._id },
    ],
    read: false,
  };
  
  await Notification.updateMany(filter, { read: true });
  
  res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  
  if (notification) {
    await notification.deleteOne();
    res.json({ message: 'Notification removed' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Get notification types
// @route   GET /api/notifications/types
// @access  Private
const getNotificationTypes = asyncHandler(async (req, res) => {
  const types = await Notification.distinct('type');
  res.json(types);
});

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationTypes,
};