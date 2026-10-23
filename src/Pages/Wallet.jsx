import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, loadProducts } from "../utils/products";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/useCart";

const Wallet = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wallets, setWallets] = useState(() => getProducts().filter((product) => product.type === "wallet"));

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((catalog) => {
        if (active) setWallets(catalog.filter((product) => product.type === "wallet"));
      })
      .catch((error) => console.error("Could not load products from Supabase:", error));

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="min-h-screen bg-gray-100 px-5 py-12">

      {/* Header */}
      <div className="mx-auto mb-10 max-w-7xl text-center">
        <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600">
          PREMIUM COLLECTION
        </span>

        <h1 className="mt-5 text-4xl font-extrabold text-gray-900 md:text-5xl">
          Premium Wallets
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-gray-500">
          Stylish, durable and premium wallets designed for everyday use.
        </p>
      </div>

      {/* Products */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">

        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="group min-w-0 overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl sm:hover:-translate-y-2 sm:hover:shadow-2xl"
          >

            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-gray-200 sm:h-60 lg:h-[300px]">

              <ProductImage product={wallet} className="h-full" />

              {/* Discount */}
              <div className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                SALE
              </div>

              {/* Wishlist */}
              <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-md transition hover:bg-red-600 hover:text-white">
                ♡
              </button>

            </div>

            {/* Content */}
            <div className="min-w-0 p-3 sm:p-5">

              <Link to={`/product/${wallet.id}`} className="block break-words text-base font-bold text-gray-900 hover:text-red-600 sm:text-xl">
                {wallet.name}
              </Link>

              <p className="mt-2 line-clamp-3 min-h-12 text-xs leading-4 text-gray-500 sm:text-sm sm:leading-6">
                {wallet.description}
              </p>

              {/* Rating */}
              <div className="mt-3 flex flex-wrap items-center gap-1 sm:gap-2">
                <div className="text-sm text-yellow-400 sm:text-base">
                  ★★★★★
                </div>

                <span className="text-xs text-gray-400 sm:text-sm">
                  (4.9)
                </span>
              </div>

              {/* Price */}
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-4 sm:gap-3">
                <span className="text-lg font-extrabold text-red-600 sm:text-2xl">
                  ৳{wallet.price}
                </span>

                {wallet.oldPrice > wallet.price && (
                  <span className="text-xs text-gray-400 line-through sm:text-sm">৳{wallet.oldPrice}</span>
                )}
              </div>

              {/* Button */}
              <Link
                to={`/product/${wallet.id}`}
                className="mt-4 block w-full rounded-lg border border-gray-300 px-2 py-2.5 text-center text-sm font-bold text-gray-900 transition hover:border-red-600 hover:text-red-600 sm:mt-5 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
              >
                View Details
              </Link>
              <button
                type="button"
                onClick={() => addToCart(wallet)}
                className="mt-2 w-full rounded-lg border border-black px-2 py-2.5 text-sm font-bold text-black transition hover:bg-gray-100 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
              >
                Add to Cart
              </button>
              <button
                onClick={() => navigate("/cod-from", { state: { product: { ...wallet, type: "wallet" } } })}
                className="mt-4 w-full rounded-lg bg-black px-2 py-2.5 text-sm font-bold text-white transition duration-300 hover:bg-red-600 sm:mt-5 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
              >
                Order Now
              </button>

            </div>
          </div>
        ))}

      </div>

      {/* Bottom Feature Section */}
      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">

        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-3xl">🚚</div>
          <h3 className="mt-3 font-bold">Fast Delivery</h3>
          <p className="mt-1 text-sm text-gray-500">
            Fast home delivery across Bangladesh
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-3xl">💳</div>
          <h3 className="mt-3 font-bold">Cash On Delivery</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pay after receiving your product
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="text-3xl">✓</div>
          <h3 className="mt-3 font-bold">Premium Quality</h3>
          <p className="mt-1 text-sm text-gray-500">
            Quality products at affordable prices
          </p>
        </div>

      </div>

    </section>
  );
};

export default Wallet;