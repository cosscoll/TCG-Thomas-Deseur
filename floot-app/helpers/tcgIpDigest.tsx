import { createHmac } from "node:crypto";
import { isIP } from "node:net";

/**
 * Floot's edge sets x-floot-client-ip and prevents clients from forging it.
 * Never use X-Forwarded-For or CF-Connecting-IP here.
 * No raw IP or user identifier is stored in PostgreSQL.
 */
export function tcgIpDigest(request: Request, scope: string): string {
  const key = process.env.JWT_SECRET;
  if (!key) throw new Error("Security secret unavailable");
  const edgeIp = request.headers.get("x-floot-client-ip")?.trim() ?? "";
  const normalized = isIP(edgeIp) ? edgeIp : "unavailable";
  return createHmac("sha256", key)
    .update("TCG-DESEUR:AUTH-RATE:" + scope + ":" + normalized)
    .digest("hex");
}
