import { supabase } from "../lib/supabase";

const ORDERS_STORAGE_KEY = "shoulder-slack-orders";

export const getOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const mapOrder = (order) => ({
  id: order.id,
  customerName: order.customer_name,
  phone: order.phone,
  address: order.address,
  productName: order.product_name,
  productImage: order.product_image,
  quantity: order.quantity,
  size: order.size,
  unitPrice: Number(order.unit_price),
  deliveryCharge: Number(order.delivery_charge),
  total: Number(order.total),
  status: order.status,
  createdAt: order.created_at,
});

export const loadOrders = async () => {
  if (!supabase) return getOrders();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapOrder);
};

export const saveOrders = async (orderItems) => {
  const createdAt = new Date().toISOString();
  const savedOrders = orderItems.map((order) => ({
    ...order,
    id: `ORD-${crypto.randomUUID()}`,
    status: "Pending",
    createdAt,
  }));

  if (supabase) {
    const { error } = await supabase.from("orders").insert(savedOrders.map((order) => ({
      id: order.id,
      customer_name: order.customerName,
      phone: order.phone,
      address: order.address,
      product_name: order.productName,
      product_image: order.productImage,
      quantity: order.quantity,
      size: order.size,
      unit_price: order.unitPrice,
      delivery_charge: order.deliveryCharge,
      total: order.total,
    })));

    if (error) throw error;
  } else {
    const orders = getOrders();
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([...savedOrders, ...orders]));
  }

  return savedOrders;
};

export const saveOrder = async (order) => (await saveOrders([order]))[0];

export const updateOrderStatus = async (orderId, status) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Order not found or not allowed to update it.");
    return loadOrders();
  }

  const orders = getOrders().map((order) =>
    order.id === orderId ? { ...order, status } : order,
  );

  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return orders;
};