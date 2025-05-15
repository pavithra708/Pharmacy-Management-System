import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes
router.route('/')
  .get(protect, getUsers);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, updateUser)
  .delete(protect, deleteUser);

export default router;
