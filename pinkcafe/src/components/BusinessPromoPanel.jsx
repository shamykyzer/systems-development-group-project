import React, { useState, useEffect } from 'react';

function BusinessPromoPanel() {
  // Images for carousel
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
      <h2 className="text-3xl font-extrabold text-black mb-4 text-center">AI-Powered Sales Forecasting</h2>
      <p className="text-lg text-black mb-8 text-center max-w-md">
        Predict product demand with machine learning to reduce waste, optimize inventory, and maximize profitability.
      </p>
      <ul className="space-y-4 text-lg text-black pl-2 w-full">
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Prophet algorithm predictions
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Multiple time horizons (7 days to 12 months)
        </li>
        <li className="flex items-center">
          <span className="mr-2 text-pinkcafe2 text-xl">•</span> Upload custom sales data
        </li>
      </ul>
    </div>
  );
}
export default BusinessPromoPanel;