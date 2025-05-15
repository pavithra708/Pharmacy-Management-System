import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { 
  Users, PillIcon, Truck, Package, Receipt, BarChart3, UserCircle, LogOut, 
  X, Home 
} from 'lucide-react';

type SidebarProps = {
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
};

const Sidebar = ({ isMobileOpen, toggleMobileSidebar }: SidebarProps) => {
  const { user, logout } = useUser();
  const isAdmin = user?.role === 'admin';

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-teal-600 text-white' 
        : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
    }`;

  const basePath = `/${user?.role}`;

  const adminLinks = [
    { to: '/admin', icon: <Home size={20} />, text: 'Dashboard' },
    { to: '/admin/users', icon: <Users size={20} />, text: 'Users' },
    { to: '/admin/medicine', icon: <Package size={20} />, text: 'Inventory' },
    { to: '/admin/suppliers', icon: <Truck size={20} />, text: 'Suppliers' },
    { to: '/admin/inventory', icon: <PillIcon size={20} />, text: 'Medicines' },
    { to: '/admin/sales-management', icon: <Receipt size={20} />, text: 'Sales & Billing' },
    { to: '/admin/reports', icon: <BarChart3 size={20} />, text: 'Reports' },
    { to: '/admin/profile', icon: <UserCircle size={20} />, text: 'Profile' },
  ];

  const pharmacistLinks = [
    { to: '/pharmacist', icon: <Home size={20} />, text: 'Dashboard' },
    { to: '/pharmacist/medicine', icon: <Package size={20} />, text: 'Inventory' },
    { to: '/pharmacist/inventory', icon: <PillIcon size={20} />, text: 'Medicines' },
    { to: '/pharmacist/sales-management', icon: <Receipt size={20} />, text: 'Sales & Billing' },
    { to: '/pharmacist/profile', icon: <UserCircle size={20} />, text: 'Profile' },
  ];

  const links = isAdmin ? adminLinks : pharmacistLinks;

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <div className="flex items-center gap-2">
              <PillIcon className="h-8 w-8 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-800">PharmaSys</h1>
            </div>
            <button onClick={toggleMobileSidebar} className="lg:hidden">
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink 
                    to={link.to} 
                    className={navLinkClass}
                    onClick={() => {
                      if (isMobileOpen) toggleMobileSidebar();
                    }}
                  >
                    {link.icon}
                    <span>{link.text}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;