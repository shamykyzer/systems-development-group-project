import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function isAuthenticated() {
  try {
    const raw = localStorage.getItem('pinkcafe_user');
    if (!raw) return false;

    const user = JSON.parse(raw);
    if (!user.id || !user.email || !user.username) return false;

    const loginTime = localStorage.getItem('pinkcafe_login_time');
    if (!loginTime || Date.now() - Number(loginTime) > SESSION_EXPIRY_MS) {
      localStorage.removeItem('pinkcafe_user');
      localStorage.removeItem('pinkcafe_login_time');
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem('pinkcafe_user');
    localStorage.removeItem('pinkcafe_login_time');
    return false;
  }
}

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
