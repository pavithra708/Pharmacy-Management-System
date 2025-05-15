import React, { createContext, useState, useContext, ReactNode } from 'react';

type User = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist';
  avatar?: string;
};

type UserContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check if user is already logged in (from localStorage)
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      const userData = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatar: data.profilePicture || 'https://i.pravatar.cc/150?img=68'
      };

      setUser(userData);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated: !!user, login, logout, token }}>
      {children}
    </UserContext.Provider>
  );
};