import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { STORAGE_KEYS } from '../config/constants';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function isAuthenticated() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return false;

    const user = JSON.parse(raw);
    if (!user.id || !user.email || !user.username) return false;

    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity || Date.now() - Number(lastActivity) > INACTIVITY_TIMEOUT_MS) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      return false;
    }

    // Refresh activity timestamp on each authenticated navigation
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));

    return true;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    return false;
  }
}

function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
