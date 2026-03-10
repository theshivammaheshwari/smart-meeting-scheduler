import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // During build/SSR without valid env vars, return a dummy-safe client
  if (!url || url === "your_supabase_url_here") {
    // Use a placeholder URL that satisfies validation but won't make real requests
    return createBrowserClient(
      "https://placeholder.supabase.co",
      key || "placeholder"
    );
  }

  return createBrowserClient(url, key);
}
