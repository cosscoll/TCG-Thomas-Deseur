import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  email: z.string().email("Saisis une adresse e-mail valide."),
  code: z.string().trim().min(1, "Saisis le code reçu."),
  newPassword: z.string().min(8, "Utilise au moins 8 caractères."),
});

export type OutputType = { ok: true };

export const postResetPassword = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/reset_password`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!result.ok) {
    const errorData = superjson.parse<{ message: string }>(await result.text());
    throw new Error(errorData.message || "Impossible de modifier le mot de passe.");
  }

  return superjson.parse<OutputType>(await result.text());
};
