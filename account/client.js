import { ACCOUNT_CONFIG } from "./config.js";
export function accountsConfigured() {
  try {
    const url = new URL(ACCOUNT_CONFIG.url);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") &&
      typeof ACCOUNT_CONFIG.publishableKey === "string" && ACCOUNT_CONFIG.publishableKey.length > 20;
  } catch { return false; }
}
let pendingClient = null;
export async function getAccountClient() {
  if (!accountsConfigured()) return null;
  if (!pendingClient) pendingClient = import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/+esm")
    .then(({createClient}) => createClient(ACCOUNT_CONFIG.url, ACCOUNT_CONFIG.publishableKey, {
      auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:true},
    })).catch(error=>{ pendingClient=null; throw error; });
  return pendingClient;
}
