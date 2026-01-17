import React from "react";

const Hero = () => {

      const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 1999,
      originalPrice: 2999,
      image:
        "https://plus.unsplash.com/premium_photo-1678099940967-73fe30680949?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 2499,
      originalPrice: 3999,
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    },
    {
      id: 3,
      name: "Bluetooth Speaker",
      price: 1599,
      originalPrice: 2599,
      image:
        "https://images.unsplash.com/photo-1589003077984-894e133dabab?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      id: 4,
      name: "Gaming Mouse",
      price: 899,
      originalPrice: 1499,
      image:
        "https://images.unsplash.com/photo-1617096200347-cb04ae810b1d",
    },
  ]; {/*FlashSale update*/}
  return (
    <div className="w-full bg-yellow-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left Content */}
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Everything You Need,
            <span className="text-yellow-500"> Delivered to Your Door</span>
          </h1>

          <p className="mt-5 text-gray-600 text-lg">
            Shop from thousands of verified sellers. Best prices, trusted
            stores, fast delivery and secure payments — all in one place.
          </p>

          <div className="mt-8 flex gap-4 flex-wrap">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg shadow-md transition">
              Shop Now
            </button>
            <button className="border border-yellow-400 text-yellow-600 hover:bg-yellow-100 font-semibold px-6 py-3 rounded-lg transition">
              Become a Seller
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative">
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-yellow-200 rounded-full blur-xl"></div>
          <img
            src="https://images.unsplash.com/photo-1606813907291-d86efa9b94db"
            alt="Online Shopping"
            className="rounded-2xl shadow-lg relative z-10"
          />
        </div>
      </section>

      {/* FlashSale Section */}
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Flash Sale
            </h2>

            {/* Timer */}
            <div className="flex items-center gap-1">
              <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold">
                12
              </span>
              :
              <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold">
                45
              </span>
              :
              <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold">
                08
              </span>
            </div>
          </div>

          <button className="text-yellow-600 font-semibold hover:underline">
            Shop All
          </button>
        </div>

        {/* Product Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-yellow-50 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg"
              />

              <h3 className="mt-3 text-sm font-medium text-gray-800 line-clamp-2">
                {product.name}
              </h3>

              <div className="mt-2">
                <span className="text-lg font-bold text-yellow-600">
                  ৳{product.price}
                </span>
                <span className="ml-2 text-sm text-gray-400 line-through">
                  ৳{product.originalPrice}
                </span>
              </div>

              <div className="mt-2">
                <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded">
                  -
                  {Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Popular Categories
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            "Electronics",
            "Fashion",
            "Groceries",
            "Home",
            "Beauty",
            "Sports",
          ].map((category) => (
            <div
              key={category}
              className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md cursor-pointer transition"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-yellow-100 rounded-full flex items-center justify-center font-bold text-yellow-600">
                {category[0]}
              </div>
              <p className="font-medium text-gray-700">{category}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Hero;
