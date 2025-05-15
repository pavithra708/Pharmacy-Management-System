import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationTypes,
} from '../controllers/notificationController.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications);

router.route('/read-all')
  .put(protect, markAllAsRead);

router.route('/types')
  .get(protect, getNotificationTypes);

router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, deleteNotification);

export default router;