import { createHmac } from "node:crypto";

/** A keyed digest prevents offline guessing of short reset codes after a DB leak. */
export function tcgResetCodeDigest(userId: number, code: string): string {
  const key = process.env.JWT_SECRET;
  if (!key) throw new Error("Session signing secret unavailable.");
  return createHmac("sha256", key).update(`TCG-DESEUR:RESET:${userId}:${code}`).digest("hex");
}
