import { z } from "zod";
import { User } from "../../helpers/User";
import superjson from "superjson";

export const schema = z.object({
  email: z.string().trim().email("Saisis une adresse e-mail valide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  displayName: z.string().trim().min(3, "Le pseudonyme doit contenir au moins 3 caractères.").max(24, "Le pseudonyme ne doit pas dépasser 24 caractères.")
    .refine(value => !/[\u0000-\u001f\u007f]/.test(value), "Caractères non autorisés."),
});

export type OutputType = {
  user: User;
};

export const postRegister = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/auth/register_with_password`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include", // Important for cookies to be sent and received
  });

  if (!result.ok) {
    const errorData = superjson.parse<{ message: string }>(await result.text());
    throw new Error(errorData.message || "Inscription impossible.");
  }

  return superjson.parse<OutputType>(await result.text());
};

