import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Hit the Zero-Trust Auth endpoint we tested in Postman
      const response = await api.post('/auth/login', { email, password });
      
      const { token, role } = response.data;

      // Securely store the credentials in the browser
      localStorage.setItem('finguard_token', token);
      localStorage.setItem('finguard_role', role);

      // Tell App.jsx that we are officially authenticated
      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // The Sorting Hat: Send them to their designated workspace
      if (role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/apply');
      }

    } catch (err) {
      console.error("Login Failed:", err);
      // Display a clean error message to the user
      setError(err.response?.data?.message || "Invalid credentials or server offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">FinGuard</h1>
          <p className="text-gray-500 mt-2">Zero-Trust Authentication Gateway</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-bold">Access Denied</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="admin@finguard.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-bold rounded-lg shadow-md transition ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {/* Developer Helper Text */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          <p>Test Accounts:</p>
          <p>Client: testapplicant@finguard.com</p>
          <p>Admin: myadmin@test.com</p>
        </div>

      </div>
    </div>
  );
}