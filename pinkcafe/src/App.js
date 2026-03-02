import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Upload from './pages/Upload.jsx';
import './App.css';

/**
 * Redirects to /login if no user session is found in localStorage.
 * Login stores the user via: localStorage.setItem('pinkcafe_user', ...)
 */
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('pinkcafe_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home"     element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/upload"   element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        {/* Any unknown path goes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
