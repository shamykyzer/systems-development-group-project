import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const user = localStorage.getItem('pinkcafe_user');
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
