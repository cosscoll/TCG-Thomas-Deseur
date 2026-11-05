import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  displayName: z.string().trim().min(3, "Le pseudo doit contenir au moins 3 caractères.")
    .max(24, "Le pseudo ne peut pas dépasser 24 caractères.")
    .refine(value => !/[\u0000-\u001f\u007f]/.test(value), "Caractères non autorisés."),
});

export type OutputType = { displayName: string };

export async function postProfile(input: z.infer<typeof schema>): Promise<OutputType> {
  const response = await fetch("/_api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(schema.parse(input)),
    credentials: "include",
  });
  const payload = superjson.parse<OutputType & { error?: string }>(await response.text());
  if (!response.ok) throw new Error(payload.error || "Impossible de modifier le pseudo.");
  return payload;
}
