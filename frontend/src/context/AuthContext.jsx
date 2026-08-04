import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const savedToken = localStorage.getItem('rebid_token');
    const savedUser = localStorage.getItem('rebid_user');
    return {
      token: savedToken || null,
      user: savedUser ? JSON.parse(savedUser) : null,
    };
  });

  const login = (token, user) => {
    localStorage.setItem('rebid_token', token);
    localStorage.setItem('rebid_user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const logout = () => {
    localStorage.removeItem('rebid_token');
    localStorage.removeItem('rebid_user');
    setAuth({ token: null, user: null });
  };

  // Global Axios Interceptor to handle 401 Unauthorized token expirations automatically
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("[Auth] 401 Unauthorized received. Clearing stale session.");
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token: auth.token, user: auth.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
