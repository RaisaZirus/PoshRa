import React from "react";

const FlashSale = () => {
  const products = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 1999,
      originalPrice: 2999,
      image:
        "https://images.unsplash.com/photo-1518445699381-9c6eafba43c0",
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
        "https://images.unsplash.com/photo-1585386959984-a41552231693",
    },
    {
      id: 4,
      name: "Gaming Mouse",
      price: 899,
      originalPrice: 1499,
      image:
        "https://images.unsplash.com/photo-1617096200347-cb04ae810b1d",
    },
  ];

  return (
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
  );
};

export default FlashSale;
