import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientPortal from './pages/ClientPortal';
import LandingPage from './pages/LandingPage';
// --- RBAC SECURITY GUARD ---
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('finguard_token');
  const role = localStorage.getItem('finguard_role');

  // 1. Not logged in? Kick to login screen.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in, but wrong role? Kick to their designated dashboard.
  if (role !== requiredRole) {
    return <Navigate to={role === 'ADMIN' ? "/dashboard" : "/apply"} replace />;
  }

  // 3. Cleared all checks. Grant access.
  return children;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('finguard_token'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        
        {/* SECURE ADMIN WORKSPACE */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* SECURE CLIENT INGESTION PORTAL */}
        <Route 
          path="/apply" 
          element={
            <ProtectedRoute requiredRole="CLIENT">
              <ClientPortal />
            </ProtectedRoute>
          } 
        />

        {/* CATCH-ALL ROUTING LOGIC */}
        <Route path="*" element={
          isAuthenticated 
            ? <Navigate to={localStorage.getItem('finguard_role') === 'ADMIN' ? "/dashboard" : "/apply"} replace /> 
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}