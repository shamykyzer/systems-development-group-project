import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function isAuthenticated() {
  try {
    const raw = localStorage.getItem('pinkcafe_user');
    if (!raw) return false;

    const user = JSON.parse(raw);
    if (!user.id || !user.email || !user.username) return false;

    const lastActivity = localStorage.getItem('pinkcafe_last_activity');
    if (!lastActivity || Date.now() - Number(lastActivity) > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem('pinkcafe_user');
      localStorage.removeItem('pinkcafe_last_activity');
      return false;
    }

    // Refresh activity timestamp on each authenticated navigation
    localStorage.setItem('pinkcafe_last_activity', String(Date.now()));

    return true;
  } catch {
    localStorage.removeItem('pinkcafe_user');
    localStorage.removeItem('pinkcafe_last_activity');
    return false;
  }
}

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
