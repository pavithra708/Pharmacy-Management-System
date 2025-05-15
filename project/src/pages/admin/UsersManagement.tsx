import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { Edit, Trash2, UserPlus, Search } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist';
  status: 'active' | 'inactive';
  avatar: string;
  lastLogin: string;
}

interface NewUser {
  name: string;
  email: string;
  role: 'admin' | 'pharmacist';
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState<NewUser>({ 
    name: '', 
    email: '', 
    role: 'pharmacist'
  });
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Role-specific avatars
  const ROLE_AVATARS = {
    admin: "https://cdn-icons-png.flaticon.com/512/1424/1424453.png", // Admin icon with security/management theme
    pharmacist: "https://cdn-icons-png.flaticon.com/512/3774/3774299.png" // Pharmacist icon with medical theme
  };

  // Get avatar based on role
  const getAvatarForRole = (role: 'admin' | 'pharmacist') => {
    return ROLE_AVATARS[role];
  };

  // Fetch users from MongoDB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setUsers([]);
          return;
        }

        const response = await fetch('http://localhost:5000/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error('Unauthorized access. Please log in again.');
            // Optionally redirect to login or handle auth error
            localStorage.removeItem('token'); // Clear invalid token
            setUsers([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Ensure data is an array before setting it to state
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Invalid data format received:', data);
          setUsers([]); // Set to empty array as fallback
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // Set to empty array on error
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please log in to delete users');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/users/delete/${userId}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setUsers(users.filter((user) => user._id !== userId));
          alert('User deleted successfully');
        } else {
          if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            localStorage.removeItem('token');
          } else {
            alert(data.message || 'Error deleting user');
          }
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to add users');
        return;
      }

      // Validate required fields
      if (!newUser.name.trim() || !newUser.email.trim()) {
        alert('Name and email are required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const userData = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        status: 'active',
        avatar: getAvatarForRole(newUser.role),
        lastLogin: new Date().toISOString(),
        password: 'defaultPassword123'
      };

      // Log the request data for debugging
      console.log('Sending user data:', userData);

      const response = await fetch('http://localhost:5000/api/users/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Log the response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('User added successfully:', data);
        setUsers([...users, data]);
        setShowForm(false);
        setNewUser({ name: '', email: '', role: 'pharmacist' });
        alert('User added successfully!');
      } else {
        const errorMessage = data.message || data.error || 'Failed to add user. Please try again.';
        console.error('Server error details:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
        } else if (response.status === 500) {
          alert('Server error occurred. Please check if:\n1. Email is not already in use\n2. All required fields are provided\n3. Server is running properly');
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to connect to the server. Please check your connection and try again.');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setShowEditForm(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to edit users');
        return;
      }

      // Validate required fields
      if (!editingUser.name.trim() || !editingUser.email.trim()) {
        alert('Name and email are required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingUser.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/users/update/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingUser.name.trim(),
          email: editingUser.email.trim(),
          role: editingUser.role,
          status: editingUser.status,
          avatar: getAvatarForRole(editingUser.role)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the users list with the edited user
        setUsers(users.map(user => 
          user._id === editingUser._id ? { ...user, ...data } : user
        ));
        setShowEditForm(false);
        setEditingUser(null);
        alert('User updated successfully!');
      } else {
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
        } else {
          alert(data.message || 'Error updating user');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  return (
    <MainLayout title="User Management">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              onClick={() => setShowForm(true)}
            >
              <UserPlus size={18} />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold">Add New User</h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full border border-gray-300 p-2 rounded-md"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full border border-gray-300 p-2 rounded-md"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'pharmacist' })}
                  className="w-full border border-gray-300 p-2 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
                <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">
                  Add User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Form */}
        {showEditForm && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-sm p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit User</h3>
                <button 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full border border-gray-300 p-2 rounded-md"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full border border-gray-300 p-2 rounded-md"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                  />
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'pharmacist' })}
                    className="w-full border border-gray-300 p-2 rounded-md"
                  >
                    <option value="admin">Admin</option>
                    <option value="pharmacist">Pharmacist</option>
                  </select>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full border border-gray-300 p-2 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover bg-gray-100 p-1"
                              src={getAvatarForRole(user.role)}
                              alt={`${user.name} - ${user.role}`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = ROLE_AVATARS.pharmacist; // Fallback to pharmacist icon
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button 
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UsersManagement;