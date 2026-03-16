import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/home', label: 'Dashboard', icon: HomeIcon },
  { to: '/upload', label: 'Upload', icon: UploadIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/login', label: 'Sign Out', icon: SignOutIcon },
];

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SignOutIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = (e) => {
    e.preventDefault();
    localStorage.removeItem('pinkcafe_user');
    localStorage.removeItem('pinkcafe_last_activity');
    localStorage.removeItem('uploadedForecastData');
    localStorage.removeItem('selectedDatasetId');
    localStorage.removeItem('autoGenerateForecast');
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 ease-out border border-white/50"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-pinkcafe2"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 z-40 flex flex-col transition-all duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 flex flex-col bg-white shadow-2xl border-r border-gray-200">
          {/* Logo - matches LoginForm: stacked, Pink bold, Cafe offset left */}
          <div className="px-6 py-8 mt-12 md:mt-6 flex justify-center">
            <Link to="/home" className="block group text-center transition-transform duration-300 ease-out hover:-translate-y-0.5">
              <h1 className="text-[2.8125rem] md:text-[3.75rem] font-black text-black group-hover:text-black/90 transition-all duration-300 ease-out group-hover:scale-[1.03] leading-tight">
                Pink
              </h1>
              <h1 className="text-[2.8125rem] md:text-[3.75rem] font-thin text-black group-hover:text-black/90 transition-all duration-300 ease-out group-hover:scale-[1.03] -ml-2 pl-6 leading-tight">
                Café
              </h1>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pt-10 md:pt-14 pb-6 space-y-1 overflow-y-auto">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              const isSettings = label === 'Settings';
              return (
                <Link
                  key={to}
                  to={to}
                  title={label}
                  onClick={label === 'Sign Out' ? handleSignOut : undefined}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all duration-300 ease-out overflow-hidden ${
                    isActive
                      ? 'bg-pinkcafe/40 text-black shadow-sm border-l-2 border-pinkcafe2'
                      : 'text-black hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {/* Hover background sweep - ClaudeRevamp style */}
                  {!isActive && (
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(135deg, rgba(246,217,210,0.5) 0%, rgba(66,59,57,0.08) 100%)' }}
                    />
                  )}
                  {/* Left accent bar on hover - ClaudeRevamp style */}
                  {!isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 group-hover:h-8 rounded-r-full transition-all duration-300"
                      style={{ background: 'linear-gradient(180deg, transparent, rgba(66,59,57,0.5), transparent)' }}
                    />
                  )}
                  <span
                    className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-all duration-300 ease-out ${
                      isActive ? 'bg-pinkcafe2/10' : 'bg-gray-100 group-hover:bg-pinkcafe/60 group-hover:scale-110'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 text-black transition-all duration-300 ${
                        isSettings ? 'group-hover:rotate-90' : 'group-hover:scale-110'
                      }`}
                    />
                  </span>
                  <span className="relative z-10 flex-1">{label}</span>
                  {/* Hover arrow - ClaudeRevamp style */}
                  {!isActive && (
                    <span className="relative z-10 opacity-0 group-hover:opacity-70 transition-all duration-300 group-hover:translate-x-0.5 text-pinkcafe2 text-lg font-bold">
                      ›
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>
      </aside>
    </>
  );
}

export default NavBar;
