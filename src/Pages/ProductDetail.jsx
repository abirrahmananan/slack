import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductImage from "../components/ProductImage";
import { useCart } from "../context/useCart";
import { getProducts, loadProducts } from "../utils/products";

const SIZES = ["S", "M", "L", "XL", "XXL"];

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(() => getProducts().find((item) => item.id === productId));
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((catalog) => {
        if (active) setProduct(catalog.find((item) => item.id === productId));
      })
      .catch((error) => console.error("Could not load products from Supabase:", error));
    return () => {
      active = false;
    };
  }, [productId]);

  if (!product) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/" className="mt-5 inline-block font-semibold text-red-600">Back to shop</Link>
      </main>
    );
  }

  const isShirt = product.type === "shirt";
  const addItem = () => {
    addToCart(product, isShirt ? size : null, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Link to={isShirt ? "/tshirt" : "/wallet"} className="mb-6 inline-block text-sm font-semibold text-gray-600 hover:text-red-600">
          ← Back to {isShirt ? "T-shirts" : "wallets"}
        </Link>
        <div className="grid overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-2">
          <ProductImage product={product} className="h-[360px] sm:h-[560px]" />
          <div className="p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">{product.category}</p>
            <h1 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-red-600">৳{product.price}</span>
              {product.oldPrice > product.price && (
                <span className="text-gray-400 line-through">৳{product.oldPrice}</span>
              )}
            </div>
            <p className="mt-6 leading-7 text-gray-600">{product.description}</p>
            {isShirt && (
              <div className="mt-7">
                <h2 className="mb-3 text-sm font-semibold text-gray-800">Select size</h2>
                <div className="flex gap-2">
                  {SIZES.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setSize(item)}
                      aria-pressed={size === item}
                      className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${size === item ? "border-black bg-black text-white" : "border-gray-300 hover:border-black"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-7 flex items-center gap-4">
              <label htmlFor="product-quantity" className="text-sm font-semibold">Quantity</label>
              <input
                id="product-quantity"
                type="number"
                min="1"
                max={product.stock || undefined}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={addItem}
              disabled={Number(product.stock) === 0}
              className="mt-8 w-full rounded-xl bg-black px-5 py-3.5 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {Number(product.stock) === 0 ? "Out of stock" : added ? "Added to cart" : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/cod-from", {
                state: { product, size: isShirt ? size : null, quantity },
              })}
              disabled={Number(product.stock) === 0}
              className="mt-3 w-full rounded-xl border border-gray-300 px-5 py-3.5 font-bold text-gray-900 transition hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
