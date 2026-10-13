import React, { useEffect, useState } from "react";
import { getOrders, loadOrders, updateOrderStatus } from "../utils/orders";
import { addProduct, deleteProduct, getProducts, loadProducts, updateProduct, uploadProductImage } from "../utils/products";
import { getHeroImages, loadHeroImages, saveHeroImages } from "../utils/siteSettings";
import { notifyMetaPixelSettingsChanged } from "../utils/metaPixel";
import { supabase } from "../lib/supabase";

const formatOrderDate = (createdAt) => {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const getMetaPixelSettingsError = (error, action) => {
  const message = error?.message || "Unknown Supabase error.";
  if (error?.code === "PGRST205" || message.includes("meta_pixel_settings")) {
    return `Supabase cannot find the Meta Pixel settings table. Run supabase/setup.sql in your Supabase Dashboard's SQL Editor, make sure it completes successfully, then refresh this page. The setup script also reloads the API schema cache. Details: ${message}`;
  }
  return `Could not ${action} Meta Pixel settings: ${message}`;
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(!supabase);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(supabase ? "" : "Supabase is not configured. Check the VITE_SUPABASE environment variables.");
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [orders, setOrders] = useState(getOrders);
  const [ordersError, setOrdersError] = useState("");
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false);
  const isLoadingOrders = isAuthenticated && !hasLoadedOrders;
  const [products, setProducts] = useState(getProducts);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [productError, setProductError] = useState("");
  const [productNotice, setProductNotice] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [heroImages, setHeroImages] = useState(getHeroImages);
  const [heroImageError, setHeroImageError] = useState("");
  const [heroImageNotice, setHeroImageNotice] = useState("");
  const [isSavingHeroImage, setIsSavingHeroImage] = useState(false);
  const [metaPixelSettings, setMetaPixelSettings] = useState({
    enabled: false,
    pixelId: "",
    testEventCode: "",
    capiToken: "",
    hasCapiToken: false,
  });
  const [metaPixelError, setMetaPixelError] = useState("");
  const [metaPixelNotice, setMetaPixelNotice] = useState("");
  const [hasLoadedMetaPixelSettings, setHasLoadedMetaPixelSettings] = useState(false);
  const [isSavingMetaPixel, setIsSavingMetaPixel] = useState(false);

  useEffect(() => {
    let active = true;
    loadHeroImages()
      .then((images) => {
        if (active) setHeroImages(images);
      })
      .catch((error) => {
        if (active) setHeroImageError(`Could not load home hero images: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || activeMenu !== "Meta Pixel+CAPI") return undefined;

    let active = true;
    supabase
      .from("meta_pixel_settings")
      .select("enabled,pixel_id,test_event_code,has_capi_token")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active) return;
        setMetaPixelSettings({
          enabled: data?.enabled || false,
          pixelId: data?.pixel_id || "",
          testEventCode: data?.test_event_code || "",
          capiToken: "",
          hasCapiToken: data?.has_capi_token || false,
        });
      })
      .catch((error) => {
        if (active) setMetaPixelError(getMetaPixelSettingsError(error, "load"));
      })
      .finally(() => {
        if (active) setHasLoadedMetaPixelSettings(true);
      });

    return () => {
      active = false;
    };
  }, [activeMenu, isAuthenticated]);

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    const verifyAdmin = async (user) => {
      if (!user) {
        if (active) {
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("store_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setIsAuthenticated(Boolean(data));
        setAuthChecked(true);
        if (!data) setLoginError("This account is not enabled for store administration.");
        else setLoginError("");
      } catch (error) {
        if (!active) return;
        setIsAuthenticated(false);
        setAuthChecked(true);
        setLoginError(`Could not verify admin access: ${error.message}`);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      void verifyAdmin(data.session?.user || null);
    }).catch((error) => {
      if (!active) return;
      setIsAuthenticated(false);
      setAuthChecked(true);
      setLoginError(`Could not check your session: ${error.message}`);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void verifyAdmin(session?.user || null), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let active = true;
    loadOrders()
      .then((savedOrders) => {
        if (active) {
          setOrders(savedOrders);
          setOrdersError("");
        }
      })
      .catch((error) => {
        if (active) setOrdersError(`Could not load customer orders: ${error.message}`);
      })
      .finally(() => {
        if (active) setHasLoadedOrders(true);
      });

    loadProducts()
      .then((catalog) => {
        if (active) setProducts(catalog);
      })
      .catch((error) => {
        if (active) setProductError(`Could not load the Supabase catalog: ${error.message}`);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const customers = Object.values(orders.reduce((customerMap, order) => {
    const customer = customerMap[order.phone] || {
      name: order.customerName,
      phone: order.phone,
      orderCount: 0,
      totalSpent: 0,
    };
    customer.orderCount += 1;
    customer.totalSpent += order.total;
    customerMap[order.phone] = customer;
    return customerMap;
  }, {}));
  const filteredOrders = orders.filter((order) =>
    `${order.id} ${order.customerName} ${order.phone} ${order.productName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleStatusChange = async (orderId, status) => {
    setOrdersError("");
    try {
      setOrders(await updateOrderStatus(orderId, status));
    } catch (error) {
      setOrdersError(`Could not update order status: ${error.message}`);
    }
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const imageFile = formData.get("image");
    const backImageFile = formData.get("backImage");
    const hasNewImage = imageFile instanceof File && imageFile.size > 0;
    const hasNewBackImage = backImageFile instanceof File && backImageFile.size > 0;

    for (const [file, label] of [[imageFile, "front"], [backImageFile, "back"]]) {
      if (!(file instanceof File) || file.size === 0) continue;
      if (!file.type.startsWith("image/")) {
        setProductError(`Choose a valid ${label} image file.`);
        return;
      }
      if (file.size > 1024 * 1024) {
        setProductError(`Choose a ${label} image smaller than 1 MB.`);
        return;
      }
    }
    if (!editingProduct && (!hasNewImage || !hasNewBackImage)) {
      setProductError("Choose both front and back product images.");
      return;
    }

    setProductError("");
    setIsSavingProduct(true);
    try {
      const image = hasNewImage ? await uploadProductImage(imageFile) : editingProduct.image;
      const backImage = hasNewBackImage
        ? await uploadProductImage(backImageFile)
        : editingProduct?.backImage || null;
      const deliveryChargeInput = String(formData.get("deliveryCharge") ?? "").trim();
      const parsedDeliveryCharge = deliveryChargeInput === "" ? 60 : Number(deliveryChargeInput);
      const productData = {
        name: formData.get("name").trim(),
        type: formData.get("type"),
        category: formData.get("type") === "shirt" ? "T-Shirt" : "Wallet",
        price: Number(formData.get("price")),
        stock: Number(formData.get("stock")),
        deliveryCharge: Number.isFinite(parsedDeliveryCharge) ? Math.max(0, parsedDeliveryCharge) : 60,
        description: formData.get("description").trim(),
        image,
        backImage,
      };

      if (editingProduct) await updateProduct(editingProduct.id, productData);
      else await addProduct(productData);

      setProducts(await loadProducts());
      setProductNotice(editingProduct ? "Product updated." : "Product added to the catalog.");
      setProductError("");
      setEditingProduct(null);
      form.reset();
      setActiveMenu("Products");
    } catch (error) {
      setProductError(`Could not save product: ${error.message}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;

    try {
      setProducts(await deleteProduct(product.id));
      setProductNotice("Product deleted.");
      setProductError("");
    } catch (error) {
      setProductError(`Could not delete product: ${error.message}`);
    }
  };

  const handleSaveHeroImage = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submittedImages = [];

    for (let index = 0; index < heroImages.length; index += 1) {
      const imageFile = formData.get(`heroImageFile-${index}`);
      const hasNewImage = imageFile instanceof File && imageFile.size > 0;

      if (hasNewImage) {
        if (!imageFile.type.startsWith("image/")) {
          setHeroImageError(`Choose a valid image file for slide ${index + 1}.`);
          return;
        }
        if (imageFile.size > 1024 * 1024) {
          setHeroImageError(`Choose an image smaller than 1 MB for slide ${index + 1}.`);
          return;
        }
      } else {
        const imageUrl = formData.get(`heroImageUrl-${index}`).trim();
        try {
          const parsedUrl = new URL(imageUrl);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
          submittedImages.push(imageUrl);
        } catch {
          setHeroImageError(`Enter a valid HTTP or HTTPS image URL for slide ${index + 1}, or upload an image.`);
          return;
        }
      }

      if (hasNewImage) submittedImages.push(null);
    }

    setHeroImageError("");
    setHeroImageNotice("");
    setIsSavingHeroImage(true);
    try {
      const images = await Promise.all(submittedImages.map(async (image, index) => {
        if (image) return image;
        return uploadProductImage(formData.get(`heroImageFile-${index}`));
      }));
      await saveHeroImages(images);
      setHeroImages(images);
      setHeroImageNotice("All four home page hero images were saved.");
      form.reset();
    } catch (error) {
      setHeroImageError(`Could not save the home hero image: ${error.message}`);
    } finally {
      setIsSavingHeroImage(false);
    }
  };

  const handleSaveMetaPixel = async (event) => {
    event.preventDefault();
    const pixelId = metaPixelSettings.pixelId.trim();
    const capiToken = metaPixelSettings.capiToken.trim();
    const testEventCode = metaPixelSettings.testEventCode.trim();

    if (metaPixelSettings.enabled && !/^\d+$/.test(pixelId)) {
      setMetaPixelError("Enter a valid numeric Meta Pixel ID before enabling tracking.");
      return;
    }
    if (metaPixelSettings.enabled && !capiToken && !metaPixelSettings.hasCapiToken) {
      setMetaPixelError("Enter a Conversions API access token before enabling tracking.");
      return;
    }
    if (!supabase) {
      setMetaPixelError("Supabase is not configured. Meta Pixel settings cannot be saved.");
      return;
    }

    setMetaPixelError("");
    setMetaPixelNotice("");
    setIsSavingMetaPixel(true);
    let privateSettingsSaved = false;
    try {
      const settings = {
        enabled: metaPixelSettings.enabled,
        pixel_id: pixelId,
        test_event_code: testEventCode || null,
        updated_at: new Date().toISOString(),
      };
      let result;

      if (capiToken) {
        result = await supabase
          .from("meta_pixel_settings")
          .upsert({ id: 1, ...settings, capi_token: capiToken });
      } else if (metaPixelSettings.hasCapiToken) {
        result = await supabase
          .from("meta_pixel_settings")
          .update(settings)
          .eq("id", 1);
      } else {
        result = await supabase
          .from("meta_pixel_settings")
          .insert({ id: 1, ...settings, capi_token: null });
      }
      if (result.error) throw result.error;
      privateSettingsSaved = true;
      setMetaPixelSettings((current) => ({
        ...current,
        pixelId,
        testEventCode,
        capiToken: "",
        hasCapiToken: current.hasCapiToken || Boolean(capiToken),
      }));

      const { error } = await supabase
        .from("site_settings")
        .upsert([
          { key: "meta_pixel_enabled", value: String(metaPixelSettings.enabled) },
          { key: "meta_pixel_id", value: pixelId },
        ]);
      if (error) throw error;

      setMetaPixelNotice("Meta Pixel and Conversions API settings saved.");
      notifyMetaPixelSettingsChanged();
    } catch (error) {
      setMetaPixelError(
        privateSettingsSaved
          ? `Private CAPI settings were saved, but the storefront Pixel settings could not be updated: ${error.message}`
          : getMetaPixelSettingsError(error, "save"),
      );
    } finally {
      setIsSavingMetaPixel(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setLoginError("Supabase is not configured. Check the VITE_SUPABASE environment variables.");
      return;
    }

    setIsAuthenticating(true);
    setLoginError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Supabase did not return a signed-in user.");

      const { data: admin, error: adminError } = await supabase
        .from("store_admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError || !admin) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        if (adminError) throw adminError;
        throw new Error("This account is not enabled for store administration.");
      }

      setIsAuthenticated(true);
      setAuthChecked(true);
    } catch (error) {
      setLoginError(error.message || "Could not sign in. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: "📊" },
    { name: "Orders", icon: "📦" },
    { name: "Products", icon: "👕" },
    { name: "Customers", icon: "👥" },
    { name: "Add Product", icon: "➕" },
    { name: "Settings", icon: "⚙️" },
    { name: "Meta Pixel+CAPI", icon: "📈" },
  ];

  if (!authChecked) {
    return <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-sm text-gray-600">Checking admin access...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage Shoulder Slack.</p>
          <label className="mt-6 block text-sm font-medium text-gray-700" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:border-red-500"
            required
          />
          <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2 outline-none focus:border-red-500"
            required
          />
          {loginError && <p role="alert" className="mt-3 text-sm text-red-600">{loginError}</p>}
          <button type="submit" disabled={isAuthenticating} className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60">
            {isAuthenticating ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 bg-black text-white md:block">

        {/* Logo */}
        <div className="flex h-20 items-center border-b border-gray-800 px-6">
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">ANAN</span> Store
          </h1>
        </div>

        {/* Menu */}
        <nav className="mt-6 px-3">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveMenu(item.name)}
              className={`mb-2 flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
                activeMenu === item.name
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={() => supabase?.auth.signOut()} className="absolute bottom-6 left-4 right-4 rounded-xl bg-gray-800 px-4 py-3 text-left text-gray-300 transition hover:bg-red-600 hover:text-white">
          🚪 Logout
        </button>
      </aside>

      {/* Main */}
      <main className="md:ml-64">

        <div className="px-4 pt-4 md:hidden">
          <label htmlFor="admin-section" className="sr-only">Admin section</label>
          <select
            id="admin-section"
            value={activeMenu}
            onChange={(event) => setActiveMenu(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900"
          >
            {menuItems.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </div>

        {/* Top Navbar */}
        <header className="flex h-20 items-center justify-between border-b bg-white px-5 shadow-sm md:px-8">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {activeMenu}
            </h2>
            <p className="text-sm text-gray-500">
              Welcome back, Admin
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black font-bold text-white">
              A
            </div>
          </div>

        </header>

        {/* Dashboard */}
        {activeMenu === "Dashboard" && (
          <div className="p-5 md:p-8">

            {/* Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Total Orders</p>
                <h3 className="mt-2 text-3xl font-bold">{orders.length}</h3>
                <p className="mt-2 text-sm text-gray-500">Orders received</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Total Sales</p>
                <h3 className="mt-2 text-3xl font-bold">
                  ৳{orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}
                </h3>
                <p className="mt-2 text-sm text-gray-500">From submitted orders</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Products</p>
                <h3 className="mt-2 text-3xl font-bold">{products.length}</h3>
                <p className="mt-2 text-sm text-gray-500">
                  T-shirt + Wallet
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Customers</p>
                <h3 className="mt-2 text-3xl font-bold">{customers.length}</h3>
                <p className="mt-2 text-sm text-gray-500">Unique customers</p>
              </div>

            </div>

            {/* Recent Orders */}
            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">

              <div className="flex items-center justify-between border-b p-5">
                <h3 className="text-lg font-bold">
                  Recent Orders
                </h3>

                <button
                  onClick={() => setActiveMenu("Orders")}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">

                  <thead className="bg-gray-50 text-sm text-gray-500">
                    <tr>
                      <th className="px-5 py-4">Order ID</th>
                      <th className="px-5 py-4">Date &amp; Time</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Product</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 3).map((order) => (
                      <tr key={order.id} className="border-t">
                        <td className="px-5 py-4 font-semibold">#{order.id}</td>
                        <td className="px-5 py-4 whitespace-nowrap">{formatOrderDate(order.createdAt)}</td>
                        <td className="px-5 py-4">{order.customerName}</td>
                        <td className="px-5 py-4">{order.productName}</td>
                        <td className="px-5 py-4 font-semibold">৳{order.total}</td>
                        <td className="px-5 py-4">{order.status}</td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr className="border-t">
                        <td colSpan="6" className="px-5 py-8 text-center text-gray-500">
                          No customer orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>

          </div>
        )}

        {/* Orders */}
        {activeMenu === "Orders" && (
          <div className="p-5 md:p-8">

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              {ordersError && <p role="alert" className="mb-4 text-sm text-red-600">{ordersError}</p>}
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row">
                <h3 className="text-xl font-bold">
                  All Orders
                </h3>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order..."
                  className="rounded-xl border px-4 py-2 outline-none focus:border-red-500"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4">Order</th>
                      <th className="p-4">Date &amp; Time</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Delivery Address</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders && (
                      <tr className="border-t">
                        <td colSpan="8" className="p-8 text-center text-gray-500">Loading customer orders...</td>
                      </tr>
                    )}
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4 font-semibold">
                          #{order.id}
                        </td>
                        <td className="p-4 whitespace-nowrap">{formatOrderDate(order.createdAt)}</td>
                        <td className="p-4">{order.customerName}</td>
                        <td className="p-4">{order.phone}</td>
                        <td className="p-4">
                          {order.productName} ({order.quantity})
                          {order.size ? ` / ${order.size}` : ""}
                        </td>
                        <td className="p-4">{[order.address, order.district].filter(Boolean).join(", ")}</td>
                        <td className="p-4 font-semibold">
                          ৳{order.total}
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(event) => handleStatusChange(order.id, event.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm"
                          >
                            <option>Pending</option>
                            <option>Processing</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {!isLoadingOrders && filteredOrders.length === 0 && (
                      <tr className="border-t">
                        <td colSpan="8" className="p-8 text-center text-gray-500">
                          {orders.length === 0 ? "No customer orders yet." : "No matching orders."}
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>

          </div>
        )}

        {/* Products */}
        {activeMenu === "Products" && (
          <div className="p-5 md:p-8">

            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">
                Products
              </h3>

              <button
                onClick={() => {
                  setProductError("");
                  setProductNotice("");
                  setEditingProduct(null);
                  setActiveMenu("Add Product");
                }}
                className="rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-red-600"
              >
                + Add Product
              </button>
            </div>

            {productNotice && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{productNotice}</p>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="grid grid-cols-2">
                    <img src={product.image} alt={`${product.name} front`} className="h-48 w-full bg-gray-100 object-cover" />
                    {product.backImage ? (
                      <img src={product.backImage} alt={`${product.name} back`} className="h-48 w-full bg-gray-100 object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gray-100 text-sm text-gray-400">No back image</div>
                    )}
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">{product.type === "shirt" ? "T-Shirt" : "Wallet"}</p>
                    <h4 className="mt-1 font-bold">{product.name}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold">৳{product.price}</span>
                      <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProductError("");
                          setProductNotice("");
                          setEditingProduct(product);
                          setActiveMenu("Add Product");
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:border-black"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product)}
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            </div>

          </div>
        )}

        {/* Add Product */}
        {activeMenu === "Add Product" && (
          <div className="p-5 md:p-8">

            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm md:p-8">

              <h3 className="mb-6 text-2xl font-bold">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>

              <form key={editingProduct?.id || "new-product"} onSubmit={handleAddProduct} className="space-y-5">

                <div>
                  <label htmlFor="product-name" className="mb-2 block font-medium">
                    Product Name
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    defaultValue={editingProduct?.name || ""}
                    required
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="product-type" className="mb-2 block font-medium">
                    Product Type
                  </label>

                  <select id="product-type" name="type" defaultValue={editingProduct?.type || "shirt"} className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500">
                    <option value="shirt">T-Shirt</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>
                    <label htmlFor="product-price" className="mb-2 block font-medium">
                      Price
                    </label>

                    <input
                      id="product-price"
                      type="number"
                      name="price"
                      placeholder="850"
                      defaultValue={editingProduct?.price ?? ""}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-stock" className="mb-2 block font-medium">
                      Stock
                    </label>

                    <input
                      id="product-stock"
                      type="number"
                      name="stock"
                      placeholder="20"
                      defaultValue={editingProduct?.stock ?? ""}
                      min="0"
                      step="1"
                      required
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                    />
                  </div>

                </div>

                <div>
                  <label htmlFor="product-delivery-charge" className="mb-2 block font-medium">
                    Custom Delivery Charge
                  </label>

                  <input
                    id="product-delivery-charge"
                    type="number"
                    name="deliveryCharge"
                    placeholder="60"
                    defaultValue={editingProduct?.deliveryCharge ?? 60}
                    min="0"
                    step="1"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="product-description" className="mb-2 block font-medium">
                    Description
                  </label>

                  <textarea
                    id="product-description"
                    name="description"
                    rows="4"
                    placeholder="Product description..."
                    defaultValue={editingProduct?.description || ""}
                    required
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  ></textarea>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="product-image" className="mb-2 block font-medium">
                      Front Image
                    </label>
                    {editingProduct?.image && (
                      <img src={editingProduct.image} alt={`${editingProduct.name} current front`} className="mb-3 h-36 w-full rounded-lg bg-gray-100 object-cover" />
                    )}
                    <input
                      id="product-image"
                      type="file"
                      name="image"
                      accept="image/*"
                      required={!editingProduct}
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                  <div>
                    <label htmlFor="product-back-image" className="mb-2 block font-medium">
                      Back Image
                    </label>
                    {editingProduct?.backImage && (
                      <img src={editingProduct.backImage} alt={`${editingProduct.name} current back`} className="mb-3 h-36 w-full rounded-lg bg-gray-100 object-cover" />
                    )}
                    <input
                      id="product-back-image"
                      type="file"
                      name="backImage"
                      accept="image/*"
                      required={!editingProduct}
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                  <p className="text-sm text-gray-500 sm:col-span-2">
                    Each image must be 1 MB or smaller. When editing, leave an image blank to keep the current image.
                  </p>
                </div>

                {productError && <p role="alert" className="text-sm text-red-600">{productError}</p>}

                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="w-full rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-black"
                >
                  {isSavingProduct ? "Saving Product..." : editingProduct ? "Save Changes" : "Add Product"}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductError("");
                      setActiveMenu("Products");
                    }}
                    className="w-full rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}

              </form>

            </div>

          </div>
        )}

        {/* Customers */}
        {activeMenu === "Customers" && (
          <div className="p-5 md:p-8">

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-2xl font-bold">
                Customers
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">

                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Orders</th>
                      <th className="p-4">Total Spent</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((customer) => (
                      <tr
                        key={customer.phone}
                        className="border-t"
                      >
                        <td className="p-4 font-semibold">
                          {customer.name}
                        </td>
                        <td className="p-4">
                          {customer.phone}
                        </td>
                        <td className="p-4">
                          {customer.orderCount}
                        </td>
                        <td className="p-4 font-semibold">
                          ৳{customer.totalSpent.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr className="border-t">
                        <td colSpan="4" className="p-8 text-center text-gray-500">
                          No customers yet.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>

          </div>
        )}

        {/* Settings */}
        {activeMenu === "Settings" && (
          <div className="p-5 md:p-8">

            <div className="mx-auto mb-6 max-w-4xl rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-2xl font-bold">Home Page Hero Images</h3>
              <p className="mt-2 text-sm text-gray-500">
                Set the image used for each of the four home page carousel slides.
              </p>

              <form onSubmit={handleSaveHeroImage} className="mt-5 space-y-4">
                <div className="grid gap-5 sm:grid-cols-2">
                  {heroImages.map((image, index) => (
                    <div key={`hero-slide-${index}`} className="rounded-xl border border-gray-200 p-4">
                      <h4 className="mb-3 font-semibold">Slide {index + 1}</h4>
                      <img
                        src={image}
                        alt={`Current home page hero slide ${index + 1}`}
                        className="h-40 w-full rounded-lg bg-gray-100 object-cover"
                      />
                      <label htmlFor={`hero-image-url-${index}`} className="mb-2 mt-4 block text-sm font-medium">
                        Image URL
                      </label>
                      <input
                        id={`hero-image-url-${index}`}
                        type="text"
                        inputMode="url"
                        name={`heroImageUrl-${index}`}
                        value={image}
                        onChange={(event) => setHeroImages((current) => current.map(
                          (currentImage, imageIndex) => imageIndex === index ? event.target.value : currentImage,
                        ))}
                        placeholder="https://example.com/hero-image.jpg"
                        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                      />
                      <label htmlFor={`hero-image-file-${index}`} className="mb-2 mt-4 block text-sm font-medium">
                        Or upload a new image
                      </label>
                      <input
                        id={`hero-image-file-${index}`}
                        type="file"
                        name={`heroImageFile-${index}`}
                        accept="image/*"
                        className="w-full rounded-xl border p-3"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Uploaded images must be 1 MB or smaller. Uploading requires Supabase storage to be configured.
                </p>
                {heroImageError && <p role="alert" className="text-sm text-red-600">{heroImageError}</p>}
                {heroImageNotice && <p role="status" className="text-sm text-green-700">{heroImageNotice}</p>}
                <button
                  type="submit"
                  disabled={isSavingHeroImage}
                  className="rounded-xl bg-black px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  {isSavingHeroImage ? "Saving..." : "Save Hero Image"}
                </button>
              </form>
            </div>

            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm">

              <h3 className="mb-6 text-2xl font-bold">
                Store Settings
              </h3>

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block font-medium">
                    Store Name
                  </label>
                  <input
                    type="text"
                    defaultValue="ANAN Store"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Delivery Charge
                  </label>
                  <input
                    type="number"
                    defaultValue="60"
                    className="w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500"
                  />
                </div>

                <button className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-red-600">
                  Save Changes
                </button>

              </div>

            </div>

          </div>
        )}

        {activeMenu === "Meta Pixel+CAPI" && (
          <div className="p-5 md:p-8">
            <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold">Meta Pixel + Conversions API</h3>
                  <p className="mt-2 max-w-2xl text-sm text-gray-500">
                    Configure tracking once. Page views are sent by the browser Pixel, and completed orders are sent
                    through the Conversions API with matching event IDs for deduplication.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  metaPixelSettings.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>
                  {metaPixelSettings.enabled ? "Tracking enabled" : "Tracking disabled"}
                </span>
              </div>

              {!hasLoadedMetaPixelSettings ? (
                <p className="mt-6 text-sm text-gray-500">Loading Meta Pixel settings...</p>
              ) : (
                <form onSubmit={handleSaveMetaPixel} className="mt-7 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
                    <label htmlFor="meta-pixel-type" className="text-sm font-medium text-gray-700">
                      Type of Pixel
                    </label>
                    <select
                      id="meta-pixel-type"
                      value="meta-capi"
                      disabled
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-700"
                    >
                      <option value="meta-capi">Meta Pixel + Conversions API</option>
                    </select>

                    <label htmlFor="meta-pixel-id" className="text-sm font-medium text-gray-700">
                      Pixel ID
                    </label>
                    <input
                      id="meta-pixel-id"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={metaPixelSettings.pixelId}
                      onChange={(event) => setMetaPixelSettings((current) => ({
                        ...current,
                        pixelId: event.target.value,
                      }))}
                      placeholder="e.g. 1234567890"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500"
                    />

                    <label htmlFor="meta-capi-token" className="text-sm font-medium text-gray-700">
                      Conversions API Token
                    </label>
                    <div>
                      <input
                        id="meta-capi-token"
                        type="password"
                        autoComplete="new-password"
                        value={metaPixelSettings.capiToken}
                        onChange={(event) => setMetaPixelSettings((current) => ({
                          ...current,
                          capiToken: event.target.value,
                        }))}
                        placeholder={metaPixelSettings.hasCapiToken ? "Saved securely — leave blank to keep it" : "Paste your Meta access token"}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This token is stored in an admin-only table and is never sent to the browser Pixel.
                      </p>
                    </div>

                    <label htmlFor="meta-test-event-code" className="text-sm font-medium text-gray-700">
                      Test Event Code <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="meta-test-event-code"
                      type="text"
                      autoComplete="off"
                      value={metaPixelSettings.testEventCode}
                      onChange={(event) => setMetaPixelSettings((current) => ({
                        ...current,
                        testEventCode: event.target.value,
                      }))}
                      placeholder="e.g. TEST12345"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500"
                    />

                    <label htmlFor="meta-excluded-pages" className="text-sm font-medium text-gray-700">
                      Excluded Pages <span className="text-xs italic text-gray-400">(Premium only)</span>
                    </label>
                    <select
                      id="meta-excluded-pages"
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2.5 text-gray-500"
                    >
                      <option>All storefront pages are tracked</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                    <input
                      type="checkbox"
                      checked={metaPixelSettings.enabled}
                      onChange={(event) => setMetaPixelSettings((current) => ({
                        ...current,
                        enabled: event.target.checked,
                      }))}
                      className="mt-1 h-4 w-4 accent-red-600"
                    />
                    <span>
                      <span className="block font-semibold text-gray-900">Enable Meta tracking</span>
                      <span className="mt-1 block text-sm text-gray-500">
                        Send PageView events from the Pixel and Purchase events from both the Pixel and CAPI.
                      </span>
                    </span>
                  </label>

                  <p className="text-sm italic leading-6 text-gray-500">
                    Purchase events are sent only after an order has been saved. The browser and server use the same
                    event ID so Meta can deduplicate them.
                  </p>

                  {metaPixelError && <p role="alert" className="text-sm text-red-600">{metaPixelError}</p>}
                  {metaPixelNotice && <p role="status" className="text-sm text-green-700">{metaPixelNotice}</p>}

                  <button
                    type="submit"
                    disabled={isSavingMetaPixel}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSavingMetaPixel ? "Saving..." : "Save Meta Pixel Settings"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Admin;