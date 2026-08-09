import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE = 'http://localhost:8001/api';

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const savedToken = localStorage.getItem('rebid_token');
    const savedUser = localStorage.getItem('rebid_user');
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    return {
      token: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
    };
  });

  const login = (token, user) => {
    localStorage.setItem('rebid_token', token);
    localStorage.setItem('rebid_user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuth({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('rebid_token');
    localStorage.removeItem('rebid_user');
    delete axios.defaults.headers.common['Authorization'];
    setAuth({ token: null, user: null });
  };

  const updateUserStatus = async () => {
    if (!auth.user?.user_id) return;
    
    try {
      const res = await axios.get(`${API_BASE}/auth/status/${auth.user.user_id}`);
      if (res.data) {
        const updatedUser = { ...auth.user, status: res.data.status };
        localStorage.setItem('rebid_user', JSON.stringify(updatedUser));
        setAuth((prev) => ({ ...prev, user: updatedUser }));
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
    }
  }, [auth.token]);

  useEffect(() => {
    if (auth.user?.user_id) {
      updateUserStatus();
    }
  }, [auth.user?.user_id]);

  return (
    <AuthContext.Provider value={{ 
      token: auth.token, 
      user: auth.user, 
      login, 
      logout,
      updateUserStatus,
      isAuthenticated: !!auth.token,
      isAdmin: auth.user?.role === 'ADMIN',
      isBuyer: auth.user?.role === 'BUYER',
      isVendor: auth.user?.role === 'VENDOR',
      isApproved: auth.user?.status === 'approved'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
