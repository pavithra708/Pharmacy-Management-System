import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getSalesReport,
  getInventoryReport,
  getSupplierReport,
  getProfitabilityReport,
} from '../controllers/reportController.js';

const router = express.Router();

router.route('/sales')
  .get(protect, admin, getSalesReport);

router.route('/inventory')
  .get(protect, admin, getInventoryReport);

router.route('/suppliers')
  .get(protect, admin, getSupplierReport);

router.route('/profitability')
  .get(protect, admin, getProfitabilityReport);

export default router;