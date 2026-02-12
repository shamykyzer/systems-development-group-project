import React, { useState } from 'react';

function NavBar(){
    const [isOpen, setIsOpen] = useState(true);

    return(
        <>
            {/* Toggle Button - Hidden on larger screens */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                aria-label="Toggle menu"
            >
                <svg 
                    className="w-6 h-6 text-gray-700 transition-transform duration-300" 
                    style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar - Always visible on larger screens, toggleable on mobile */}
            <div 
                className={`fixed top-0 left-0 h-screen bg-white shadow-2xl z-40 flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 w-64`}
            >
                {/* Logo Section */}
                <div className="flex items-center gap-1 px-6 py-8 border-b border-gray-200 mt-12 md:mt-0">
                    <h1 className="text-4xl font-extrabold font-sans text-pinkcafe2 transition-all duration-300">
                        Pink
                    </h1>
                    <h1 className="text-4xl font-extrabold font-sans text-rose-400">Cafe</h1>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-4 py-6 overflow-y-auto">
                    <nav className="space-y-2">
                        <button type="button" className="flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-gray-700 hover:text-pinkcafe2 hover:bg-pinkcafe rounded-lg group" title="Dashboard">
                            <svg className="flex-shrink-0 w-5 h-5 mr-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="transition-all duration-300">Dashboard</span>
                        </button>

                        <button type="button" className="flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-gray-700 hover:text-pinkcafe2 hover:bg-pinkcafe rounded-lg group" title="Upload">
                            <svg className="flex-shrink-0 w-5 h-5 mr-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="transition-all duration-300">Upload</span>
                        </button>

                        <button type="button" className="flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-gray-700 hover:text-pinkcafe2 hover:bg-pinkcafe rounded-lg group" title="Settings">
                            <svg className="flex-shrink-0 w-5 h-5 mr-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="transition-all duration-300">Settings</span>
                        </button>

                        <button type="button" className="flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 text-gray-700 hover:text-pinkcafe2 hover:bg-pinkcafe rounded-lg group" title="Sign Out">
                            <svg className="flex-shrink-0 w-5 h-5 mr-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="transition-all duration-300">Sign Out</span>
                        </button>
                    </nav>
                </div>

                {/* Footer/User Section */}
                <div className="px-4 py-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pinkcafe flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            U
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-900 truncate">User Name</p>
                            <p className="text-xs text-gray-500 truncate">user@pinkcafe.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default NavBar;