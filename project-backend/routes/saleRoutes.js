import express from 'express';
import { check } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect, admin, pharmacist } from '../middleware/authMiddleware.js';
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  getSalesStats,
} from '../controllers/saleController.js';

const router = express.Router();

router.route('/')
  .post(
    protect,
    pharmacist,
    [
      check('customer.name', 'Customer name is required').notEmpty(),
      check('items', 'Items are required').isArray().notEmpty(),
      check('totalAmount', 'Total amount is required').isNumeric(),
      check('grandTotal', 'Grand total is required').isNumeric(),
    ],
    validateRequest,
    createSale
  )
  .get(protect, pharmacist, getSales);

router.route('/stats')
  .get(protect, admin, getSalesStats);

router.route('/:id')
  .get(protect, pharmacist, getSaleById)
  .put(protect, admin, updateSale);

export default router;