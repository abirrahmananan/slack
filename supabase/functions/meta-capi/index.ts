import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const cleanCookieValue = (value: unknown) =>
  typeof value === "string" && value.length <= 512 ? value : undefined;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  let serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secretKeysEnvironment = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysEnvironment) {
    try {
      const secretKeys: Record<string, unknown> = JSON.parse(secretKeysEnvironment);
      if (typeof secretKeys.default === "string") serviceRoleKey = secretKeys.default;
    } catch (error) {
      console.error("The Supabase secret-key configuration is invalid.", error);
      return jsonResponse({ error: "Meta CAPI is not configured on the server." }, 500);
    }
  }
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Meta CAPI is missing its Supabase server credentials.");
    return jsonResponse({ error: "Meta CAPI is not configured on the server." }, 500);
  }

  let body: {
    orderId?: unknown;
    eventId?: unknown;
    fbp?: unknown;
    fbc?: unknown;
    eventSourceUrl?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  if (
    typeof body.orderId !== "string"
    || body.orderId.length < 1
    || body.orderId.length > 128
    || body.eventId !== body.orderId
  ) {
    return jsonResponse({ error: "A valid order ID and matching event ID are required." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [{ data: order, error: orderError }, { data: settings, error: settingsError }] = await Promise.all([
    adminClient
      .from("orders")
      .select("id,customer_name,phone,product_name,quantity,total")
      .eq("id", body.orderId)
      .maybeSingle(),
    adminClient
      .from("meta_pixel_settings")
      .select("enabled,pixel_id,capi_token,test_event_code")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (orderError || settingsError) {
    console.error("Could not load the order or Meta CAPI settings.", orderError || settingsError);
    return jsonResponse({ error: "Could not load the order tracking settings." }, 500);
  }
  if (!order) return jsonResponse({ error: "Order not found." }, 404);
  if (!settings?.enabled) return jsonResponse({ skipped: true });
  if (!settings.pixel_id || !/^\d+$/.test(settings.pixel_id) || !settings.capi_token) {
    console.error("Meta CAPI is enabled but its Pixel ID or API token is invalid.");
    return jsonResponse({ error: "Meta CAPI is enabled but not fully configured." }, 500);
  }

  const normalizedPhone = order.phone.replace(/\D/g, "");
  const phone = normalizedPhone.startsWith("0") && normalizedPhone.length === 11
    ? `880${normalizedPhone.slice(1)}`
    : normalizedPhone;
  const nameParts = order.customer_name.trim().toLowerCase().split(/\s+/);
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ");
  const userAgent = request.headers.get("user-agent") || undefined;
  const eventSourceInput = typeof body.eventSourceUrl === "string"
    ? body.eventSourceUrl
    : request.headers.get("origin");
  let eventSourceUrl: string | undefined;
  if (eventSourceInput) {
    try {
      const parsedReferer = new URL(eventSourceInput);
      if (!["http:", "https:"].includes(parsedReferer.protocol)) {
        throw new Error("Unsupported event source URL protocol.");
      }
      eventSourceUrl = `${parsedReferer.origin}${parsedReferer.pathname}`;
    } catch {
      eventSourceUrl = undefined;
    }
  }

  const userData: Record<string, unknown> = { country: await sha256("bd") };
  if (phone) userData.ph = [await sha256(phone)];
  if (firstName) userData.fn = [await sha256(firstName)];
  if (lastName) userData.ln = [await sha256(lastName)];
  if (!userAgent) {
    return jsonResponse({ error: "The browser user agent is required for a website Purchase event." }, 400);
  }
  userData.client_user_agent = userAgent;
  const fbp = cleanCookieValue(body.fbp);
  const fbc = cleanCookieValue(body.fbc);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  if (!eventSourceUrl) {
    return jsonResponse({ error: "The website URL is required for a Purchase event." }, 400);
  }

  const event: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: body.eventId,
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency: "BDT",
      value: Number(order.total),
      content_name: order.product_name,
      num_items: order.quantity,
    },
    event_source_url: eventSourceUrl,
  };

  const payload: Record<string, unknown> = { data: [event] };
  if (settings.test_event_code) payload.test_event_code = settings.test_event_code;

  let metaResponse: Response;
  try {
    metaResponse = await fetch(
      `https://graph.facebook.com/v25.0/${encodeURIComponent(settings.pixel_id)}/events?access_token=${encodeURIComponent(settings.capi_token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    console.error("Could not reach Meta Conversions API.", error);
    return jsonResponse({ error: "Could not reach Meta Conversions API." }, 502);
  }

  let metaResult: unknown;
  try {
    metaResult = await metaResponse.json();
  } catch (error) {
    console.error("Meta Conversions API returned an invalid response.", error);
    return jsonResponse({ error: "Meta returned an invalid response for the Purchase event." }, 502);
  }
  if (!metaResponse.ok) {
    console.error("Meta Conversions API rejected the Purchase event.", metaResult);
    return jsonResponse({ error: "Meta rejected the Purchase event. Check your Pixel ID and API token." }, 502);
  }
  if (!metaResult || typeof metaResult !== "object") {
    console.error("Meta Conversions API returned an unexpected response.", metaResult);
    return jsonResponse({ error: "Meta returned an unexpected response for the Purchase event." }, 502);
  }
  const eventsReceived = (metaResult as Record<string, unknown>).events_received;
  if (eventsReceived !== 1) {
    console.error("Meta Conversions API did not confirm the Purchase event.", metaResult);
    return jsonResponse({ error: "Meta did not confirm receipt of the Purchase event." }, 502);
  }

  return jsonResponse({ eventsReceived });
});
