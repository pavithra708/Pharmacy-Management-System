import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Protect routes - verify token and attach user to request
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database and include role
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Set both user and role in the request
      req.user = user;
      req.userRole = user.role;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (req.user && req.userRole === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

// Middleware to check if user is pharmacist
const pharmacist = (req, res, next) => {
  if (req.user && (req.userRole === 'pharmacist' || req.userRole === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as pharmacist' });
  }
};

// Middleware to check if user is either admin or pharmacist
const staff = (req, res, next) => {
  if (req.user && (req.userRole === 'admin' || req.userRole === 'pharmacist')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as staff' });
  }
};

export { protect, admin, pharmacist, staff };