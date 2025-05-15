# Pharmacy Management System Backend

This is the backend server for the Pharmacy Management System built with Node.js, Express, and MongoDB.

## Features

- User Authentication (Admin & Pharmacist roles)
- Role-based Access Control
- Medicine Management
- Inventory Management
- Supplier Management
- Sales & Billing
- Reports Generation
- Notification System

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user and get token

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Medicines

- `POST /api/medicines` - Create a new medicine
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/categories` - Get medicine categories
- `GET /api/medicines/manufacturers` - Get medicine manufacturers
- `GET /api/medicines/expiring` - Get expiring medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine (Admin only)

### Inventory

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/stats` - Get inventory statistics
- `GET /api/inventory/expiring` - Get expiring inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `PUT /api/inventory/:id` - Update inventory item

### Suppliers

- `POST /api/suppliers` - Create a new supplier (Admin only)
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier (Admin only)
- `DELETE /api/suppliers/:id` - Delete supplier (Admin only)
- `GET /api/suppliers/:id/medicines` - Get medicines by supplier

### Sales

- `POST /api/sales` - Create a new sale
- `GET /api/sales` - Get all sales
- `GET /api/sales/stats` - Get sales statistics
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id` - Update sale (Admin only)

### Reports

- `GET /api/reports/sales` - Get sales report (Admin only)
- `GET /api/reports/inventory` - Get inventory report (Admin only)
- `GET /api/reports/suppliers` - Get supplier report (Admin only)
- `GET /api/reports/profitability` - Get profitability report (Admin only)

### Notifications

- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/types` - Get notification types
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

## Setup Instructions

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Run the server with `npm run dev`

## Technical Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **File Upload**: Multer

## Project Structure

- `server.js` - Entry point
- `config/` - Configuration files
- `controllers/` - Route controllers
- `middleware/` - Express middleware
- `models/` - Mongoose models
- `routes/` - Express routes
- `utils/` - Utility functions
- `uploads/` - Uploaded files storage