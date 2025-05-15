import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import path from 'path';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Routes
import userRoutes from './routes/userRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();
connectDB();

const app = express();

// Security headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// CORS
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));

// Static uploads folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT || 5000}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
