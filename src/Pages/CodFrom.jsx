import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { saveOrder } from "../utils/orders";
import { trackMetaPurchase } from "../utils/metaPixel";

const CodFrom = () => {
  const location = useLocation();
  const selectedProduct = location.state?.product;
  const product = selectedProduct || {
    name: "Premium Oversized T-Shirt",
    price: 750,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
    type: "shirt",
  };
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    if (!orderSuccess) return undefined;

    const timeoutId = window.setTimeout(() => setOrderSuccess(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [orderSuccess]);

  const deliveryCharge = 60;

  const total = product.price * quantity + deliveryCharge;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    setOrderError("");
    setIsSubmitting(true);
    try {
      const savedOrder = await saveOrder({
        customerName: formData.get("customerName"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        productName: product.name,
        productImage: product.image,
        quantity,
        size: product.type === "shirt" ? size : null,
        unitPrice: product.price,
        deliveryCharge,
        total,
      });
      void trackMetaPurchase(savedOrder.id, savedOrder.total).catch((error) => {
        console.error("Could not send the Meta Purchase event.", error);
      });
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


            {/* Product */}
            <div className="flex gap-4 border-b border-gray-200 pb-5">

              <img
                src={product.image}
                alt={product.name}
                className="h-24 w-24 rounded-lg object-cover"
              />

              <div className="min-w-0 flex-1">

                <h3 className="font-bold text-gray-900">
                  {product.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  ৳{product.price}
                </p>

                {/* Size */}
                {product.type === "shirt" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setSize(item)}
                        className={`h-9 min-w-10 rounded-md border text-sm font-semibold transition ${
                          size === item
                            ? "border-black bg-black text-white"
                            : "border-gray-300 hover:border-black"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>


            {/* Quantity */}
            <div className="flex items-center justify-between border-b border-gray-200 py-5">

              <span className="font-semibold text-gray-700">
                Quantity
              </span>

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  aria-label="Decrease quantity"
                  className="h-9 w-9 rounded-md border border-gray-300 text-lg hover:bg-gray-100"
                >
                  -
                </button>

                <span className="w-6 text-center font-bold">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="h-9 w-9 rounded-md border border-gray-300 text-lg hover:bg-gray-100"
                >
                  +
                </button>

              </div>
            </div>


            {/* Price Details */}
            <div className="space-y-3 border-b border-gray-200 py-5">

              <div className="flex justify-between text-gray-600">
                <span>Product Price</span>
                <span>৳{product.price * quantity}</span>
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