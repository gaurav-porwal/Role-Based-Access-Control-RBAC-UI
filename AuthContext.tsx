import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define types for user and authentication context
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (permission: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );

  const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'An error occurred');
    }
    return response.json();
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const { token, user } = await handleApiResponse(response);

      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update state
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password 
        })
      });
      
      const { token, user } = await handleApiResponse(response);

      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update state
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    return handleApiResponse(response);
  };

  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const hasPermission = (requiredPermissions: string | string[]) => {
    // If no user is logged in, return false
    if (!user || !user.permissions) return false;

    // Convert to array if single permission passed
    const permissionsToCheck = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    // Check if user has ALL required permissions
    return permissionsToCheck.every(perm => 
      user.permissions?.includes(perm)
    );
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        logout, 
        isAuthenticated, 
        hasPermission 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
