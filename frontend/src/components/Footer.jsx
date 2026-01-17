import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Top Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
        
        {/* Brand */}
        <div>
          <h2 className="text-xl font-extrabold text-yellow-400">
            Posh<span className="text-white">Ra</span>
          </h2>
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">
            Your trusted multi-vendor marketplace for quality products,
            secure payments, and fast delivery.
          </p>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="text-white font-semibold mb-4">Customer Care</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-yellow-400 cursor-pointer">Help Center</li>
            <li className="hover:text-yellow-400 cursor-pointer">How to Buy</li>
            <li className="hover:text-yellow-400 cursor-pointer">Returns & Refunds</li>
            <li className="hover:text-yellow-400 cursor-pointer">Contact Us</li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h3 className="text-white font-semibold mb-4">About</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-yellow-400 cursor-pointer">About Us</li>
            <li className="hover:text-yellow-400 cursor-pointer">Careers</li>
            <li className="hover:text-yellow-400 cursor-pointer">Terms & Conditions</li>
            <li className="hover:text-yellow-400 cursor-pointer">Privacy Policy</li>
          </ul>
        </div>

        {/* Seller */}
        <div>
          <h3 className="text-white font-semibold mb-4">Seller</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-yellow-400 cursor-pointer">Sell on DarazClone</li>
            <li className="hover:text-yellow-400 cursor-pointer">Seller Center</li>
            <li className="hover:text-yellow-400 cursor-pointer">Seller Policies</li>
            <li className="hover:text-yellow-400 cursor-pointer">Seller Support</li>
          </ul>
        </div>

        {/* Payment & Social */}
        <div>
          <h3 className="text-white font-semibold mb-4">Payment Methods</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="bg-gray-800 px-3 py-1 rounded text-xs">VISA</div>
            <div className="bg-gray-800 px-3 py-1 rounded text-xs">MasterCard</div>
            <div className="bg-gray-800 px-3 py-1 rounded text-xs">bKash</div>
            <div className="bg-gray-800 px-3 py-1 rounded text-xs">Nagad</div>
          </div>

          <h3 className="text-white font-semibold mb-2">Follow Us</h3>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-gray-800 hover:bg-yellow-400 hover:text-black flex items-center justify-center rounded-full cursor-pointer transition">
              f
            </span>
            <span className="w-8 h-8 bg-gray-800 hover:bg-yellow-400 hover:text-black flex items-center justify-center rounded-full cursor-pointer transition">
              t
            </span>
            <span className="w-8 h-8 bg-gray-800 hover:bg-yellow-400 hover:text-black flex items-center justify-center rounded-full cursor-pointer transition">
              i
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} PoshRa. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
