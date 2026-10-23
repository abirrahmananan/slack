import { Link, useNavigate } from "react-router-dom";
import ProductImage from "./ProductImage";
import { useCart } from "../context/useCart";
import { useState } from "react";

const Tshirt = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const sizes = ["M", "L", "XL", "XXL"];
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const addItem = () => {
    addToCart(product, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="w-full min-w-0 max-w-sm overflow-hidden rounded-xl bg-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-2xl sm:hover:-translate-y-2 sm:hover:shadow-2xl">
      <ProductImage product={product} className="h-44 sm:h-72" />

      <div className="min-w-0 p-3 sm:p-5">
        <Link to={`/product/${product.id}`} className="mb-2 block break-words text-base font-bold text-gray-900 hover:text-red-600 sm:text-2xl">{product.name}</Link>
        <p className="mb-3 line-clamp-3 text-xs leading-4 text-gray-500 sm:mb-4 sm:line-clamp-none sm:text-sm sm:leading-6">{product.description}</p>
        <div className="mb-3 text-lg font-bold text-gray-900 sm:mb-4 sm:text-2xl">৳{product.price}</div>

        <div className="mb-3 sm:mb-5">
          <p className="mb-2 text-xs font-semibold text-gray-800 sm:text-sm">Select Size</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {sizes.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setSize(item)}
                aria-pressed={item === size}
                className={`rounded-md border px-2 py-1.5 text-xs font-semibold sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm ${item === size ? "border-black bg-black text-white" : "border-gray-300 text-gray-800"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mb-2 w-full rounded-lg border border-black px-2 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
        >
          {added ? "Added to Cart" : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/cod-from", { state: { product, size } })}
          className="w-full rounded-lg bg-black px-2 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-red-600 active:scale-95 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default Tshirt;
