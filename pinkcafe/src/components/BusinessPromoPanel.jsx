import React, { useState, useEffect } from 'react';

function BusinessPromoPanel() {
  // Example images, replace with your own coffee shop photos in public folder
  const images = [
    '/coffee1.jpg',
    '/coffee2.jpg',
    '/coffee3.jpg',
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="hidden lg:flex flex-col justify-center items-center h-auto w-[510px] bg-white bg-opacity-40 backdrop-blur-md p-12 rounded-2xl shadow-xl">
      {/* Cycling image carousel */}
      <div className="w-full h-56 mb-8 rounded-xl overflow-hidden shadow-lg flex items-center justify-center bg-gray-100">
        <img
          src={images[current]}
          alt="Coffee shop"
          className="object-cover w-full h-full transition-all duration-700"
        />
      </div>
      <h2 className="text-3xl font-extrabold text-pinkcafe2 mb-4 text-center">Welcome to Pink Café Admin Portal</h2>
      <p className="text-lg text-gray-800 mb-8 text-center max-w-md">
        Empower your business and staff with seamless management tools, smart analytics, and automated forecasting—all in one place.
      </p>
      <ul className="space-y-4 text-lg text-gray-700 pl-2 w-full">
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Real-time sales analytics
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Automated forecasting
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Staff management tools
        </li>
      </ul>
    </div>
  );
}

export default BusinessPromoPanel;
