import { supabase } from "../lib/supabase";

const META_PIXEL_KEYS = ["meta_pixel_enabled", "meta_pixel_id"];
let initializedPixelId = "";
let activePixelId = "";

export const loadPublicMetaPixelSettings = async () => {
  if (!supabase) return { enabled: false, pixelId: "" };

  const { data, error } = await supabase
    .from("site_settings")
    .select("key,value")
    .in("key", META_PIXEL_KEYS);
  if (error) throw error;

  const settings = new Map(data.map(({ key, value }) => [key, value]));
  const pixelId = settings.get("meta_pixel_id") || "";
  return {
    enabled: settings.get("meta_pixel_enabled") === "true" && /^\d+$/.test(pixelId),
    pixelId,
  };
};

export const initializeMetaPixel = (pixelId) => {
  if (!pixelId || typeof window === "undefined") return;

  if (!window.fbq) {
    const fbq = function (...args) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.onerror = () => console.error("Could not load the Meta Pixel script.");
    document.head.appendChild(script);
  }

  if (initializedPixelId !== pixelId) {
    window.fbq("init", pixelId);
    initializedPixelId = pixelId;
  }
  activePixelId = pixelId;
};

export const disableMetaPixel = () => {
  activePixelId = "";
};

export const trackMetaPageView = () => {
  if (activePixelId && typeof window !== "undefined" && window.fbq) window.fbq("track", "PageView");
};

const readMetaCookie = (name) => {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
};

export const trackMetaPurchase = async (orderId, value) => {
  if (activePixelId && typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "Purchase",
      { value: Number(value), currency: "BDT" },
      { eventID: orderId },
    );
  }

  if (!supabase) return Promise.resolve();

  const { data, error } = await supabase.functions.invoke("meta-capi", {
    body: {
      orderId,
      eventId: orderId,
      fbp: readMetaCookie("_fbp"),
      fbc: readMetaCookie("_fbc"),
      eventSourceUrl: typeof window === "undefined"
        ? undefined
        : `${window.location.origin}${window.location.pathname}`,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
};

export const notifyMetaPixelSettingsChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("meta-pixel-config-updated"));
  }
};
