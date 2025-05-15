import express from 'express';
import { check } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  getLowStockItems,
  getInventoryStats,
  getExpiringInventory,
  deleteInventory,
} from '../controllers/inventoryController.js';

const router = express.Router();

// Basic routes with only authentication
router.route('/')
  .get(protect, getInventory)
  .post(
    protect,
    [
      check('medicineId', 'Medicine ID is required').notEmpty(),
      check('quantity', 'Quantity must be a number').isNumeric(),
      check('unit', 'Unit is required').notEmpty(),
      check('batchNumber', 'Batch number is required').notEmpty(),
      check('expiryDate', 'Expiry date is required').notEmpty(),
      check('reorderLevel', 'Reorder level must be a number').isNumeric(),
    ],
    validateRequest,
    createInventory
  );

router.route('/low-stock')
  .get(protect, getLowStockItems);

router.route('/stats')
  .get(protect, getInventoryStats);

router.route('/expiring')
  .get(protect, getExpiringInventory);

router.route('/:id')
  .get(protect, getInventoryById)
  .put(
    protect,
    [
      check('quantity', 'Quantity must be a number').optional().isNumeric(),
      check('reorderLevel', 'Reorder level must be a number').optional().isNumeric(),
    ],
    validateRequest,
    updateInventory
  )
  .delete(protect, deleteInventory);

export default router;