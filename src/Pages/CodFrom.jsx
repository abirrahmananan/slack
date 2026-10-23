import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { saveOrders } from "../utils/orders";
import { trackMetaPurchase } from "../utils/metaPixel";
import { useCart } from "../context/useCart";

const CodFrom = () => {
  const location = useLocation();
  const { clearCart } = useCart();
  const selectedProduct = location.state?.product || {
    name: "Premium Oversized T-Shirt",
    price: 750,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
    type: "shirt",
  };
  const [items, setItems] = useState(() => location.state?.items || [{
    key: selectedProduct.id || selectedProduct.name,
    product: selectedProduct,
    size: location.state?.size || "M",
    quantity: location.state?.quantity || 1,
  }]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const isCartCheckout = Boolean(location.state?.fromCart);

  useEffect(() => {
    if (!orderSuccess) return undefined;

    const timeoutId = window.setTimeout(() => setOrderSuccess(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [orderSuccess]);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryCharge = items.length
    ? Math.max(...items.map((item) => Number.isFinite(Number(item.product.deliveryCharge))
      ? Math.max(0, Number(item.product.deliveryCharge))
      : 60))
    : 0;
  const total = subtotal + deliveryCharge;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    setOrderError("");
    setIsSubmitting(true);
    try {
      const savedOrders = await saveOrders(items.map((item, index) => {
        const itemDeliveryCharge = index === 0 ? deliveryCharge : 0;
        return {
          customerName: formData.get("customerName"),
          phone: formData.get("phone"),
          address: formData.get("address"),
          productName: item.product.name,
          productImage: item.product.image,
          quantity: item.quantity,
          size: item.product.type === "shirt" ? item.size : null,
          unitPrice: item.product.price,
          deliveryCharge: itemDeliveryCharge,
          total: item.product.price * item.quantity + itemDeliveryCharge,
        };
      }));
      savedOrders.forEach((savedOrder) => {
        void trackMetaPurchase(savedOrder.id, savedOrder.total).catch((error) => {
          console.error("Could not send the Meta Purchase event.", error);
        });
      });
      if (isCartCheckout) clearCart();
      form.reset();
      setOrderSuccess(true);
    } catch (error) {
      setOrderError(`Could not place your order: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:py-14">

      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">
            Cash On Delivery
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            Complete Your Order
          </h1>

          <p className="mt-2 text-gray-600">
            Enter your delivery details and review your order.
          </p>
        </div>

        {orderSuccess && (
          <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Order placed successfully. Thank you for your order.
          </div>
        )}
        {orderError && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {orderError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2"
        >

          {/* Customer Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">

            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Customer Information
            </h2>

            {/* Name */}
            <div className="mb-5">
              <label htmlFor="customer-name" className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>

              <input
                id="customer-name"
                type="text"
                name="customerName"
                placeholder="Enter your full name"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-3 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>


            {/* Phone */}
            <div className="mb-5">
              <label htmlFor="customer-phone" className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                id="customer-phone"
                type="tel"
                name="phone"
                placeholder="01XXXXXXXXX"
                required
                className="w-full rounded-lg border border-gray-300 px-3.5 py-3 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>


            {/* Address */}
            <div className="mb-5">
              <label htmlFor="customer-address" className="mb-2 block text-sm font-medium text-gray-700">
                Full Address
              </label>

              <textarea
                id="customer-address"
                name="address"
                rows="4"
                placeholder="House, Road, Area..."
                required
                className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-3 outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
              />
            </div>


          </div>


          {/* Order Summary */}
          <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 sm:p-6">

            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Order Summary
            </h2>


            {items.map((item) => (
              <div key={item.key} className="flex gap-4 border-b border-gray-200 py-5">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900">{item.product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">৳{item.product.price} each</p>
                  {item.product.type === "shirt" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["S", "M", "L", "XL", "XXL"].map((option) => (
                        <button
                          type="button"
                          key={option}
                          onClick={() => setItems((currentItems) => currentItems.map((currentItem) =>
                            currentItem.key === item.key ? { ...currentItem, size: option } : currentItem))}
                          aria-pressed={item.size === option}
                          className={`h-9 min-w-10 rounded-md border text-sm font-semibold transition ${
                            item.size === option
                              ? "border-black bg-black text-white"
                              : "border-gray-300 hover:border-black"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">Qty</span>
                    <button
                      type="button"
                      onClick={() => setItems((currentItems) => currentItems.map((currentItem) =>
                        currentItem.key === item.key
                          ? { ...currentItem, quantity: Math.max(1, currentItem.quantity - 1) }
                          : currentItem))}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      className="h-8 w-8 rounded-md border border-gray-300 text-lg hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setItems((currentItems) => currentItems.map((currentItem) =>
                        currentItem.key === item.key
                          ? { ...currentItem, quantity: currentItem.quantity + 1 }
                          : currentItem))}
                      aria-label={`Increase quantity of ${item.product.name}`}
                      className="h-8 w-8 rounded-md border border-gray-300 text-lg hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="font-semibold text-gray-900">৳{item.product.price * item.quantity}</span>
              </div>
            ))}


            {/* Price Details */}
            <div className="space-y-3 border-b border-gray-200 py-5">

              <div className="flex justify-between text-gray-600">
                <span>Product subtotal</span>
                <span>৳{subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span>৳{deliveryCharge}</span>
              </div>

            </div>


            {/* Total */}
            <div className="flex justify-between py-5 text-xl font-bold">
              <span>Total</span>
              <span>৳{total}</span>
            </div>


            {/* COD */}
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">
                Cash on Delivery
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Pay when your order is delivered to you.
              </p>
            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={orderSuccess || isSubmitting}
              className="w-full rounded-lg bg-red-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-default disabled:bg-green-700"
            >
              {isSubmitting ? "Placing order..." : orderSuccess ? "Order placed successfully" : `Place Order — ৳${total}`}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default CodFrom;