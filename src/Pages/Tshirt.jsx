import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, loadProducts } from "../utils/products";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/useCart";

const TShirt = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState(() => getProducts().filter((product) => product.type === "shirt"));

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((catalog) => {
        if (active) setProducts(catalog.filter((product) => product.type === "shirt"));
      })
      .catch((error) => console.error("Could not load products from Supabase:", error));

    return () => {
      active = false;
    };
  }, []);
  const openCheckout = (product) => navigate("/cod-from", {
    state: { product: { ...product, type: "shirt" } },
  });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-red-950/60" />

        <div className="relative mx-auto grid min-h-[600px] max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8">

          {/* Hero Text */}
          <div>
            <span className="inline-block rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400">
              NEW COLLECTION 2026
            </span>

            <h1 className="mt-6 text-5xl font-black leading-tight md:text-7xl">
              WEAR YOUR
              <span className="block text-red-600">
                STORY.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 md:text-lg">
              Discover premium oversized T-shirts inspired by anime,
              streetwear and your favorite characters. Designed to make
              your style different.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => openCheckout(products[0])} className="rounded-xl bg-red-600 px-7 py-4 font-bold transition hover:bg-red-700">
                Shop Collection
              </button>

              <button onClick={() => openCheckout(products[0])} className="rounded-xl border border-white/30 px-7 py-4 font-bold transition hover:bg-white hover:text-black">
                Explore Designs
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              <div>
                <h3 className="text-2xl font-bold">50+</h3>
                <p className="text-sm text-gray-400">Unique Designs</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold">5K+</h3>
                <p className="text-sm text-gray-400">Happy Customers</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold">100%</h3>
                <p className="text-sm text-gray-400">Premium Quality</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-5 rounded-full bg-red-600/20 blur-3xl" />

            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=90"
              alt="Premium T-Shirt"
              className="relative mx-auto h-[520px] w-full rounded-3xl object-cover shadow-2xl"
            />

            <div className="absolute bottom-8 left-8 rounded-2xl bg-white p-5 text-black shadow-xl">
              <p className="text-sm text-gray-500">
                Starting From
              </p>

              <p className="text-3xl font-black text-red-600">
                ৳750
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="border-b bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4 md:px-8">

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
              👕
            </div>
            <h3 className="font-bold">Premium Fabric</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comfortable & durable
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
              🎨
            </div>
            <h3 className="font-bold">Premium Print</h3>
            <p className="mt-1 text-sm text-gray-500">
              High quality DTF
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
              🚚
            </div>
            <h3 className="font-bold">Fast Delivery</h3>
            <p className="mt-1 text-sm text-gray-500">
              Nationwide delivery
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
              🔄
            </div>
            <h3 className="font-bold">Easy Exchange</h3>
            <p className="mt-1 text-sm text-gray-500">
              Simple exchange policy
            </p>
          </div>

        </div>
      </section>

      {/* ================= PRODUCTS ================= */}
      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">

          {/* Heading */}
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-red-600">
                Our Collection
              </span>

              <h2 className="mt-2 text-3xl font-black text-gray-900 md:text-5xl">
                Explore Our T-Shirts
              </h2>

              <p className="mt-3 max-w-xl text-gray-500">
                Find your favorite design and create your own unique style.
              </p>
            </div>

            <button className="w-fit rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold transition hover:border-black hover:bg-black hover:text-white">
              View All Products →
            </button>
          </div>

          {/* Categories */}
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
            <button className="whitespace-nowrap rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white">
              All
            </button>

            <button className="whitespace-nowrap rounded-full border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-black hover:text-white">
              Anime
            </button>

            <button className="whitespace-nowrap rounded-full border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-black hover:text-white">
              Streetwear
            </button>

            <button className="whitespace-nowrap rounded-full border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-black hover:text-white">
              Oversized
            </button>

            <button className="whitespace-nowrap rounded-full border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-black hover:text-white">
              Minimal
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">

            {products.map((product) => (
              <div
                key={product.id}
                className="group min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl sm:hover:-translate-y-2 sm:hover:shadow-2xl"
              >

                {/* Image */}
                <div className="relative overflow-hidden bg-gray-100">

                  <ProductImage product={product} className="h-44 sm:h-[300px] lg:h-[390px]" />

                  {/* Discount */}
                  <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                    {product.discount || "NEW"}
                  </span>

                  {/* Wishlist */}
                  <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-md transition hover:bg-red-600 hover:text-white">
                    ♡
                  </button>

                  {/* Quick View */}
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-black/80 p-3 transition duration-300 group-hover:translate-y-0">
                    <Link to={`/product/${product.id}`} className="block w-full rounded-lg bg-white py-2.5 text-center text-sm font-bold text-black">
                      Quick View
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 p-3 sm:p-5">

                  <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 sm:text-xs">
                      {product.category}
                    </span>

                    <span className="text-xs text-yellow-500 sm:text-sm">
                      ★★★★★
                    </span>
                  </div>

                  <Link to={`/product/${product.id}`} className="block break-words text-base font-bold text-gray-900 hover:text-red-600 sm:text-xl">
                    {product.name}
                  </Link>

                  <p className="mt-2 min-h-12 line-clamp-3 text-xs leading-4 text-gray-500 sm:text-sm sm:leading-6">
                    {product.description}
                  </p>

                  {/* Price */}
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:mt-4 sm:gap-3">
                    <span className="text-lg font-black text-red-600 sm:text-2xl">
                      ৳{product.price}
                    </span>

                    {product.oldPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through sm:text-sm">৳{product.oldPrice}</span>
                    )}
                  </div>

                  {/* Sizes */}
                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                    <span className="rounded-md border px-2 py-1 text-[10px] sm:px-2.5 sm:text-xs">
                      M
                    </span>
                    <span className="rounded-md border px-2 py-1 text-[10px] sm:px-2.5 sm:text-xs">
                      L
                    </span>
                    <span className="rounded-md border px-2 py-1 text-[10px] sm:px-2.5 sm:text-xs">
                      XL
                    </span>
                    <span className="rounded-md border px-2 py-1 text-[10px] sm:px-2.5 sm:text-xs">
                      XXL
                    </span>
                  </div>

                  {/* Order */}
                  <Link
                    to={`/product/${product.id}`}
                    className="mt-4 block w-full rounded-lg border border-gray-300 px-2 py-2.5 text-center text-sm font-bold text-gray-900 transition hover:border-red-600 hover:text-red-600 sm:mt-5 sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-base"
                  >
                    View Details
                  </Link>
                  <button
                    type="button"
                    onClick={() => addToCart(product, "M")}
                    className="mt-2 w-full rounded-lg border border-black px-2 py-2.5 text-sm font-bold text-black transition hover:bg-gray-100 sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-base"
                  >
                    Add to Cart (M)
                  </button>
                  <button onClick={() => openCheckout(product)} className="mt-4 w-full rounded-lg bg-black px-2 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 sm:mt-5 sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-base">
                    Order Now
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

    

    </div>
  );
};

export default TShirt;