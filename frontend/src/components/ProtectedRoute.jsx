import React from 'react';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <RedirectToLogin />;
  }

  if (user.status !== 'approved') {
    return <RedirectBasedOnStatus status={user.status} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <RedirectBasedOnRole role={user.role} />;
  }

  return children;
}

function RedirectToLogin() {
  window.location.href = '/auth/login';
  return null;
}

function RedirectBasedOnStatus({ status }) {
  if (status === 'pending_verification') {
    window.location.href = '/auth/verify-email';
  } else if (status === 'pending_documents') {
    window.location.href = '/auth/upload-documents';
  } else if (status === 'pending_approval') {
    window.location.href = '/auth/under-review';
  } else if (status === 'amendment_required') {
    window.location.href = '/auth/re-upload';
  } else if (status === 'rejected') {
    window.location.href = '/auth/rejected';
  }
  return null;
}

function RedirectBasedOnRole({ role }) {
  if (role === 'ADMIN') {
    window.location.href = '/admin';
  } else if (role === 'BUYER') {
    window.location.href = '/buyer';
  } else if (role === 'VENDOR') {
    window.location.href = '/vendor';
  }
  return null;
}

export function StatusRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <RedirectToLogin />;
  }

  return children;
}
