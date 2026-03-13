import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Login = lazy(() => import('./pages/Login.jsx'));
const Home = lazy(() => import('./pages/Home.jsx'));
const Upload = lazy(() => import('./pages/Upload.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
