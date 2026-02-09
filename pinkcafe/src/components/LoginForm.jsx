import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {FaEyeSlash} from 'react-icons/fa';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Default to same-origin so the app works when frontend is served by the backend container.
      // For local dev with separate ports, set REACT_APP_API_URL=http://localhost:5001
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login successful:', data.user);
        // Optional: store user for later use
        localStorage.setItem('pinkcafe_user', JSON.stringify(data.user));
        // Redirect to home immediately
        navigate('/home');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Could not reach the backend. Is it running on port 5001?');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-pinkcafe rounded-2xl p-8 space-y-6 w-full max-w-md">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-9xl font-extrabold font-sans text-pinkcafe2 mb-2">Pink</h1>
        <h1 className="text-9xl font-extrabold font-sans text-pinkcafe2 mb-2 pl-9 pb-10">Cafe</h1>
      </div>

      {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
            </label>
            <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
          placeholder="you@pinkcafe.com"
          required
          disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
            </label>
            <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
            required
            disabled={loading}
          />
          {showPassword ? (
            <FaEye 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer" 
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <FaEyeSlash 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer" 
              onClick={() => setShowPassword(true)}
            />
          )}
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="text-sm text-pinkcafe2 font-medium pb-10 pl-60 hover:underline"
              onClick={() =>
                setError('Password reset is not implemented yet. Please contact an administrator.')
              }
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pinkcafe2 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button
          type="button"
          className="text-black font-medium hover:underline"
          onClick={() =>
            setError('Sign up is not implemented yet. Please contact an administrator.')
          }
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

export default LoginForm;
