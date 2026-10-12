# Meta Pixel + Conversions API setup

1. Run `supabase/setup.sql` in the Supabase SQL Editor. This creates the private settings table and its admin-only row policies.
2. Link this folder to the correct Supabase project, then deploy the Edge Function:

   ```sh
   supabase link --project-ref <your-project-ref>
   supabase functions deploy meta-capi
   ```

   The project configuration disables JWT verification for this public event endpoint. The function validates each order against the database and reads the Meta token only on the server.
3. In `/admin`, open **Meta Pixel+CAPI**, enter the Pixel ID and Conversions API token, optionally add a Test Event Code, enable tracking, and save.
4. To verify events, use Meta Events Manager's Test Events view with a test code, place a test order, and remove the test code when verification is complete.

The browser Pixel sends PageView and Purchase events. The Edge Function sends Purchase events from the saved order and uses the same order ID as the browser event ID for Meta deduplication. The CAPI token is never stored in public `site_settings` or returned to the storefront.
