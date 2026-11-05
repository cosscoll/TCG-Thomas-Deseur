import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  email: z.string().email("Saisis une adresse e-mail valide."),
});

export type OutputType = { ok: true };

export const postRequestPasswordReset = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/request_password_reset`, {
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
    throw new Error(errorData.message || "Impossible d'envoyer le code.");
  }

  return superjson.parse<OutputType>(await result.text());
};
