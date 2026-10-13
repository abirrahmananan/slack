import { supabase } from "../lib/supabase";

const PRODUCTS_STORAGE_KEY = "shoulder-slack-products";

export const defaultProducts = [
  {
    id: "shirt-naruto",
    name: "Naruto Shadow T-Shirt",
    description: "Premium oversized T-shirt with Naruto-inspired artwork.",
    price: 850,
    oldPrice: 1050,
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80",
    category: "Anime",
    type: "shirt",
    stock: 20,
    deliveryCharge: 60,
  },
  {
    id: "shirt-demon-slayer",
    name: "Demon Slayer T-Shirt",
    description: "Unique anime artwork printed on premium cotton fabric.",
    price: 900,
    oldPrice: 1150,
    discount: "22% OFF",
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=700&q=80",
    category: "Anime",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-minimal-black",
    name: "Minimal Black T-Shirt",
    description: "Clean and stylish oversized black T-shirt for daily wear.",
    price: 750,
    oldPrice: 950,
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1583743814966-8936f37f3846?auto=format&fit=crop&w=700&q=80",
    category: "Minimal",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-street-art",
    name: "Street Art T-Shirt",
    description: "Bold streetwear design with premium quality fabric.",
    price: 850,
    oldPrice: 1100,
    discount: "23% OFF",
    image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=700&q=80",
    category: "Streetwear",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-akatsuki",
    name: "Akatsuki Edition",
    description: "Dark anime-inspired artwork for your streetwear style.",
    price: 950,
    oldPrice: 1200,
    discount: "21% OFF",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80",
    category: "Anime",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-oversized-white",
    name: "Oversized White Tee",
    description: "Soft premium cotton oversized T-shirt with modern fit.",
    price: 800,
    oldPrice: 1000,
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80",
    category: "Oversized",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-samurai",
    name: "Samurai Edition",
    description: "Japanese-inspired artwork with premium DTF print.",
    price: 900,
    oldPrice: 1150,
    discount: "22% OFF",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
    category: "Anime",
    type: "shirt",
    stock: 20,
  },
  {
    id: "shirt-urban-black",
    name: "Urban Black Tee",
    description: "Premium black streetwear T-shirt for everyday style.",
    price: 850,
    oldPrice: 1050,
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80",
    category: "Streetwear",
    type: "shirt",
    stock: 20,
  },
  {
    id: "wallet-premium-leather",
    name: "Premium Leather Wallet",
    description: "Stylish and durable wallet with a premium design.",
    price: 650,
    oldPrice: 850,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    category: "Wallet",
    type: "wallet",
    stock: 20,
  },
  {
    id: "wallet-classic-black",
    name: "Classic Black Wallet",
    description: "A timeless black wallet made for everyday use.",
    price: 750,
    oldPrice: 950,
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=800&q=80",
    category: "Wallet",
    type: "wallet",
    stock: 20,
  },
  {
    id: "wallet-minimalist",
    name: "Minimalist Wallet",
    description: "A compact minimalist wallet with a clean profile.",
    price: 550,
    oldPrice: 700,
    image: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=800&q=80",
    category: "Wallet",
    type: "wallet",
    stock: 20,
  },
  {
    id: "wallet-executive-leather",
    name: "Executive Leather Wallet",
    description: "A refined leather wallet with a premium finish.",
    price: 850,
    oldPrice: 1050,
    image: "https://images.unsplash.com/photo-1611010344444-5f9e4d86a6e1?auto=format&fit=crop&w=800&q=80",
    category: "Wallet",
    type: "wallet",
    stock: 20,
  },
];

const getStoredProducts = () => {
  try {
    const savedCatalog = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || "null");
    if (Array.isArray(savedCatalog)) return [...savedCatalog, ...defaultProducts];
    if (savedCatalog?.version === 2 && Array.isArray(savedCatalog.products)) {
      return savedCatalog.products;
    }
  } catch {
    return [...defaultProducts];
  }
  return [...defaultProducts];
};

const saveCatalog = (products) => {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify({ version: 2, products }));
};

export const getProducts = () => getStoredProducts();

const fromDatabaseProduct = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  type: row.type,
  category: row.category,
  price: Number(row.price),
  oldPrice: row.old_price === null ? null : Number(row.old_price),
  discount: row.discount,
  image: row.image,
  backImage: row.back_image,
  stock: row.stock,
  deliveryCharge: row.delivery_charge === null || row.delivery_charge === undefined ? 60 : Number(row.delivery_charge),
});

const toDatabaseProduct = (product) => ({
  name: product.name,
  description: product.description,
  type: product.type,
  category: product.category,
  price: product.price,
  old_price: product.oldPrice ?? null,
  discount: product.discount ?? null,
  image: product.image,
  back_image: product.backImage ?? null,
  stock: product.stock,
  delivery_charge: Number.isFinite(Number(product.deliveryCharge)) ? Number(product.deliveryCharge) : 60,
});

export const loadProducts = async () => {
  if (!supabase) return getProducts();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const products = data.map(fromDatabaseProduct);
  saveCatalog(products);
  return products;
};

export const uploadProductImage = async (file) => {
  if (!supabase) throw new Error("Supabase is not configured.");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
};

export const addProduct = async (product) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .insert(toDatabaseProduct(product))
      .select()
      .single();

    if (error) throw error;
    return fromDatabaseProduct(data);
  }

  const savedProduct = {
    ...product,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  saveCatalog([savedProduct, ...getProducts()]);
  return savedProduct;
};

export const updateProduct = async (productId, updates) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .update(toDatabaseProduct(updates))
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;
    return fromDatabaseProduct(data);
  }

  const products = getProducts().map((product) =>
    product.id === productId ? { ...product, ...updates, id: productId } : product,
  );
  saveCatalog(products);
  return products;
};

export const deleteProduct = async (productId) => {
  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) throw error;
    return loadProducts();
  }

  const products = getProducts().filter((product) => product.id !== productId);
  saveCatalog(products);
  return products;
};