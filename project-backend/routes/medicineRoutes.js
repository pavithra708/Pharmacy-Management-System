import express from 'express';
import { check } from 'express-validator';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getMedicineCategories,
  getMedicineManufacturers,
  getExpiringMedicines,
} from '../controllers/medicineController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up storage for medicine images
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename(req, file, cb) {
    cb(
      null,
      `medicine-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

const router = express.Router();

// Remove pharmacist middleware, keep only protect for authentication
router.route('/')
  .get(protect, getMedicines)
  .post(
    protect,
    upload.single('image'),
    [
      check('name', 'Medicine name is required').notEmpty(),
      check('brand', 'Brand is required').notEmpty(),
      check('category', 'Category is required').notEmpty(),
      check('price', 'Price is required').isNumeric(),
    ],
    validateRequest,
    createMedicine
  );

router.route('/categories')
  .get(protect, getMedicineCategories);

router.route('/manufacturers')
  .get(protect, getMedicineManufacturers);

router.route('/expiring')
  .get(protect, getExpiringMedicines);

router.route('/:id')
  .get(protect, getMedicineById)
  .put(
    protect,
    upload.single('image'),
    updateMedicine
  )
  .delete(protect, deleteMedicine);

export default router;