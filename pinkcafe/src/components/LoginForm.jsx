import React, { useState } from 'react';
import {FaEyeSlash} from 'react-icons/fa';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    // Add login logic here
  };

  return (
    <div className="bg-pinkcafe rounded-2xl p-8 space-y-6 w-full max-w-md" style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)' }}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-9xl font-extrabold font-sans text-pinkcafe2 mb-2">Pink</h1>
        <h1 className="text-9xl font-extrabold font-sans text-pinkcafe2 mb-2 pl-9 pb-10">Café</h1>
      </div>

      {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
            </label>
            <div className="relative">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pr-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
            placeholder="••••••••"
            required
          />
          <FaEyeSlash className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer" />
            </div>
          </div>

          <div className="flex items-center">
            <a href="#" className="text-sm text-pinkcafe2 font-medium pb-10 pl-60">
          Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-pinkcafe2 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg"
          >
            Login
          </button>
        </form>

        {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="#" className="text-black font-medium">
          Sign up
        </a>
      </p>
    </div>
  );
}

export default LoginForm;
