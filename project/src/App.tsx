import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/Notification';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import MedicineManagement from './pages/shared/MedicineManagement';
import SupplierManagement from './pages/admin/SupplierManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import SalesManagement from './pages/shared/SalesManagement';
import ReportsPage from './pages/admin/ReportsPage';
import ProfilePage from './pages/shared/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';
import AddMedicine from './pages/admin/AddMedicine';
import AddUser from './pages/admin/AddUser';
import AddSupplier from './pages/admin/AddSupplier';
import NewSale from './pages/admin/NewSale';
import OrdersManagement from './pages/shared/OrdersManagement';

function App() {
  return (
    <UserProvider>
      <NotificationProvider>
        <Router>
          <NotificationContainer />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute role="admin">
                <UsersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/medicine" element={
              <ProtectedRoute role="admin">
                <MedicineManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/suppliers" element={
              <ProtectedRoute role="admin">
                <SupplierManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/inventory" element={
              <ProtectedRoute role="admin">
                <InventoryManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/sales-management" element={
              <ProtectedRoute role="admin">
                <SalesManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute role="admin">
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute role="admin">
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/inventory/add" element={<AddMedicine />} />
            <Route path="/admin/users/add" element={<AddUser />} />
            <Route path="/admin/suppliers/add" element={<AddSupplier />} />
            <Route path="/admin/sales/new" element={<NewSale />} />
            
            {/* Pharmacist Routes */}
            <Route path="/pharmacist" element={
              <ProtectedRoute role="pharmacist">
                <PharmacistDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/medicine" element={
              <ProtectedRoute role="pharmacist">
                <MedicineManagement />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/inventory" element={
              <ProtectedRoute role="pharmacist">
                <InventoryManagement />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/sales-management" element={
              <ProtectedRoute role="pharmacist">
                <SalesManagement />
              </ProtectedRoute>
            } />
            <Route path="/pharmacist/profile" element={
              <ProtectedRoute role="pharmacist">
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute>
                  <OrdersManagement />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </NotificationProvider>
    </UserProvider>
  );
}

export default App;