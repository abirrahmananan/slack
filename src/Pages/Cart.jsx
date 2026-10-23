import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = items.length
    ? Math.max(...items.map((item) => Number.isFinite(Number(item.product.deliveryCharge))
      ? Math.max(0, Number(item.product.deliveryCharge))
      : 60))
    : 0;

  if (!items.length) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black">Your cart is empty</h1>
        <p className="mt-3 text-gray-600">Explore the collection and add something you like.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-red-600">
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-3xl font-black text-gray-900">Your Cart</h1>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map(({ key, product, size, quantity }) => (
              <article key={key} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <Link to={`/product/${product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-32 sm:w-32">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${product.id}`} className="font-bold text-gray-900 hover:text-red-600">{product.name}</Link>
                  {size && <p className="mt-1 text-sm text-gray-500">Size: {size}</p>}
                  <p className="mt-1 font-semibold text-red-600">৳{product.price}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label htmlFor={`quantity-${key}`} className="text-sm text-gray-600">Qty</label>
                    <input
                      id={`quantity-${key}`}
                      type="number"
                      min="1"
                      max={product.stock || undefined}
                      value={quantity}
                      onChange={(event) => updateQuantity(key, Math.max(1, Number(event.target.value) || 1))}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1"
                    />
                    <button type="button" onClick={() => removeFromCart(key)} className="text-sm font-semibold text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  </div>
                </div>
                <span className="hidden font-bold text-gray-900 sm:block">৳{product.price * quantity}</span>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-bold">Order summary</h2>
            <div className="mt-5 flex justify-between text-gray-600">
              <span>Subtotal</span><span>৳{subtotal}</span>
            </div>
            <div className="mt-3 flex justify-between text-gray-600">
              <span>Delivery</span><span>৳{deliveryCharge}</span>
            </div>
            <div className="mt-5 flex justify-between border-t border-gray-200 pt-5 text-lg font-bold">
              <span>Total</span><span>৳{subtotal + deliveryCharge}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">One delivery charge applies to this cart.</p>
            <button
              type="button"
              onClick={() => navigate("/cod-from", { state: { items, fromCart: true } })}
              className="mt-6 w-full rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700"
            >
              Checkout
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Cart;
