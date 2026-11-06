import {tcgAuthRateLimit} from "../../helpers/tcgAuthRateLimit";
import {tcgReadLimitedBody} from "../../helpers/tcgReadLimitedBody";
import {TcgRequestBodyError} from "../../helpers/TcgRequestBodyError";
import { db } from "../../helpers/db";
import {tcgMutationGuard} from "../../helpers/tcgMutationGuard";
import { sql } from "kysely";
import { timingSafeEqual } from "crypto";
import { tcgResetCodeDigest } from "../../helpers/tcgResetCodeDigest";
import superjson from "superjson";
import { schema } from "./reset_password_POST.schema";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";

const MAX_ATTEMPTS_PER_CODE = 5;


function invalidCode() {
  return new Response(
    superjson.stringify({
      message: "Le code est incorrect ou a expiré. Demande un nouveau code.",
    }),
    { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } }
  );
}

export async function handle(request: Request) {
  const blocked = tcgMutationGuard(request);
  if (blocked) return blocked;
  try {
    const throttle = await tcgAuthRateLimit(request,"reset_attempt");
    if(throttle)return throttle;
    const json = superjson.parse(await tcgReadLimitedBody(request));
    const { email, code, newPassword } = schema.parse(json);
    const normalizedEmail = email.toLowerCase();
    const now = new Date();

    const user = await db
      .selectFrom("users")
      .select(["id"])
      .where(sql`LOWER(users.email)`, "=", normalizedEmail)
      .executeTakeFirst();
    if (!user) return invalidCode();

    const outcome = await db.transaction().execute(async (trx) => {
      const row = await trx
        .selectFrom("passwordResetCodes")
        .select(["id", "codeHash", "expiresAt", "attempts"])
        .where("userId", "=", user.id)
        .where("usedAt", "is", null)
        .orderBy("createdAt", "desc")
        .limit(1)
        .forUpdate()
        .executeTakeFirst();

      if (
        !row ||
        new Date(row.expiresAt) <= now ||
        row.attempts >= MAX_ATTEMPTS_PER_CODE
      ) {
        return "invalid" as const;
      }

      const expected = Buffer.from(row.codeHash, "hex");
      const actual = Buffer.from(tcgResetCodeDigest(user.id, code.replace(/\s/g, "")), "hex");
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        await trx
          .updateTable("passwordResetCodes")
          .set({ attempts: row.attempts + 1 })
          .where("id", "=", row.id)
          .execute();
        return "invalid" as const;
      }

      const passwordHash = await generatePasswordHash(newPassword);
      await trx
        .insertInto("userPasswords")
        .values({ userId: user.id, passwordHash })
        .onConflict((oc) => oc.column("userId").doUpdateSet({ passwordHash }))
        .execute();
      await trx
        .updateTable("passwordResetCodes")
        .set({ usedAt: now })
        .where("id", "=", row.id)
        .execute();
      // Sign out everywhere, and lift a login lockout from earlier attempts.
      await trx.deleteFrom("sessions").where("userId", "=", user.id).execute();
      await trx
        .deleteFrom("loginAttempts")
        .where(sql`LOWER(email)`, "=", normalizedEmail)
        .where("success", "=", false)
        .execute();
      return "ok" as const;
    });

    if (outcome === "invalid") return invalidCode();
    return new Response(superjson.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    console.error("Password reset error:", error);
    const message = error instanceof TcgRequestBodyError ? error.message : "Impossible de modifier le mot de passe pour le moment.";
    return new Response(superjson.stringify({ message }), {
      status: error instanceof TcgRequestBodyError ? error.status : 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
  }
}
