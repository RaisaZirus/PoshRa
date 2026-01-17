import React from "react";
import { ShoppingCart, Search, User } from "lucide-react";

const Navbar = () => {
  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-yellow-400 text-black text-sm text-center py-2 font-medium">
        🚚 Free Delivery on orders over ৳999 | Big Deals Every Day
      </div>

      {/* Main Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="text-2xl font-extrabold text-yellow-500 cursor-pointer">
            Posh<span className="text-black">Ra</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search for products, brands and more"
                className="w-full border border-yellow-300 rounded-lg py-2 pl-4 pr-12
                           focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <button className="absolute right-1 top-1/2 -translate-y-1/2
                                 bg-yellow-400 hover:bg-yellow-500 p-2 rounded-md transition">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button className="relative hover:text-yellow-500 transition">
              <ShoppingCart size={22} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5">
                3
              </span>
            </button>

            {/* Login */}
            <button className="flex items-center gap-1 text-gray-700 hover:text-yellow-500 transition">
              <User size={20} />
              <span className="hidden md:block font-medium">Login</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
