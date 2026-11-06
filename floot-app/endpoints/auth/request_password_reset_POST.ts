import {tcgAuthRateLimit} from "../../helpers/tcgAuthRateLimit";
import {tcgReadLimitedBody} from "../../helpers/tcgReadLimitedBody";
import {TcgRequestBodyError} from "../../helpers/TcgRequestBodyError";
import { db } from "../../helpers/db";
import {tcgMutationGuard} from "../../helpers/tcgMutationGuard";
import { sql } from "kysely";
import { randomInt } from "crypto";
import { tcgResetCodeDigest } from "../../helpers/tcgResetCodeDigest";
import { sendEmail } from "@floot/email";
import superjson from "superjson";
import { schema } from "./request_password_reset_POST.schema";

// Who the code comes from. Until an email domain is verified in the Email tab,
// Floot sends from its own domain (keeping the display name) and delivers ONLY
// to the project owner, so the owner can always reset their own account. Once
// a domain is verified, change the address to one on that domain so every user
// receives their own code.
const RESET_EMAIL_FROM = "TCG Deseur <noreply@example.com>";

const CODE_TTL_MINUTES = 15;
const MAX_CODES_PER_HOUR = 3;


export async function handle(request: Request) {
  const blocked = tcgMutationGuard(request);
  if (blocked) return blocked;
  try {
    const throttle = await tcgAuthRateLimit(request,"reset_request");
    if(throttle)return throttle;
    const json = superjson.parse(await tcgReadLimitedBody(request));
    const { email } = schema.parse(json);
    const normalizedEmail = email.toLowerCase();
    const now = new Date();

    const user = await db
      .selectFrom("users")
      .select(["id", "email"])
      .where(sql`LOWER(users.email)`, "=", normalizedEmail)
      .executeTakeFirst();

    if (user) {
      const recent = await db
        .selectFrom("passwordResetCodes")
        .select(db.fn.countAll<number>().as("count"))
        .where("userId", "=", user.id)
        .where("createdAt", ">=", new Date(now.getTime() - 60 * 60 * 1000))
        .executeTakeFirst();

      if (Number(recent?.count ?? 0) < MAX_CODES_PER_HOUR) {
        const code = randomInt(0, 100_000_000).toString().padStart(8, "0");

        await db.transaction().execute(async (trx) => {
          // Only the newest code works.
          await trx
            .updateTable("passwordResetCodes")
            .set({ usedAt: now })
            .where("userId", "=", user.id)
            .where("usedAt", "is", null)
            .execute();
          await trx
            .insertInto("passwordResetCodes")
            .values({
              userId: user.id,
              codeHash: tcgResetCodeDigest(user.id, code),
              expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000),
            })
            .execute();
        });

        const text = `Ton code de réinitialisation TCG Deseur est ${code}.\n\nCe code expire dans ${CODE_TTL_MINUTES} minutes. Si tu n'as rien demandé, ignore cet e-mail.`;
        const result = await sendEmail({
          from: RESET_EMAIL_FROM,
          to: user.email,
          subject: "TCG Deseur — Réinitialisation du mot de passe",
          text,
          html: `<p>Ton code de réinitialisation <strong>TCG Deseur</strong> :</p><p style="font-size:28px;font-weight:600;letter-spacing:4px;font-family:monospace">${code}</p><p>Ce code expire dans ${CODE_TTL_MINUTES} minutes. Si tu n'as rien demandé, ignore cet e-mail.</p>`,
        });
        if (!result.ok) {
          console.error(
            "Password reset email failed:",
            result.error.code,
            result.error.message
          );
        }
      }
    }

    // The same answer whether or not the account exists.
    return new Response(superjson.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    console.error("Password reset request error:", error);
    return new Response(
      superjson.stringify({ message: error instanceof TcgRequestBodyError ? error.message : "Impossible d'envoyer le code pour le moment." }),
      { status: error instanceof TcgRequestBodyError ? error.status : 400, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } }
    );
  }
}
