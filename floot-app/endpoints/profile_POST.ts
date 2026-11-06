import {tcgReadLimitedBody,TcgRequestBodyError} from "../helpers/tcgReadLimitedBody";
import { db } from "../helpers/db";
import {tcgMutationGuard} from "../helpers/tcgMutationGuard";
import { getServerUserSession } from "../helpers/getServerUserSession";
import { NotAuthenticatedError } from "../helpers/getSetServerSession";
import { schema, type OutputType } from "./profile_POST.schema";
import superjson from "superjson";
import { ZodError } from "zod";

const respond = (body: unknown, status = 200) =>
  new Response(superjson.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export async function handle(request: Request) {
  const blocked = tcgMutationGuard(request);
  if (blocked) return blocked;
  try {
    const { user } = await getServerUserSession(request);
    const input = schema.parse(superjson.parse(await tcgReadLimitedBody(request)));
    const result = await db.updateTable("users")
      .set({ displayName: input.displayName, updatedAt: new Date() })
      .where("id", "=", user.id)
      .returning("displayName")
      .executeTakeFirstOrThrow();
    return respond({ displayName: result.displayName } satisfies OutputType);
  } catch (error) {
    if (error instanceof NotAuthenticatedError) return respond({ error: "Connexion requise." }, 401);
    if (error instanceof TcgRequestBodyError) return respond({ error: error.message }, error.status);
    if (error instanceof ZodError) return respond({ error: "Pseudo invalide : 3 à 24 caractères, sans caractères de contrôle." }, 400);
    console.error("Profile update error:", error);
    return respond({ error: "Impossible de modifier le pseudo pour le moment." }, 500);
  }
}
