import React from 'react';
import LoginForm from '../components/LoginForm.jsx';
import BusinessPromoPanel from '../components/BusinessPromoPanel.jsx';

function Login() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Blurred background image on all screens */}
      <div
        className="absolute inset-0 w-full h-full z-0"
        style={{
          backgroundImage: "url('/login_wallpaper.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.60)',
        }}
        aria-hidden="true"
      />
      {/* Main content: login form left, info panel right (large screens) */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center z-10">
        <div className="w-full max-w-xl p-2 lg:p-4 flex items-center justify-center lg:items-start lg:justify-start lg:ml-16">
          <LoginForm />
        </div>
        {/* Info panel only on large screens */}
        <div className="hidden lg:flex flex-1 h-full items-center justify-end pr-16">
          <BusinessPromoPanel />
        </div>
      </div>
    </div>
  );
}
// div here is essentially the background for the login page so if we want to change the color we can do it here not on the component
export default Login;
