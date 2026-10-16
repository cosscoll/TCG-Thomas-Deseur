// adapt this to the database schema and helpers if necessary
import { db } from "../../helpers/db";
import { sql } from "kysely";
import { schema } from "./register_with_password_POST.schema";
import { randomBytes } from "crypto";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../helpers/getSetServerSession";
import { generatePasswordHash } from "../../helpers/generatePasswordHash";
import superjson from "superjson";
import { ZodError } from "zod";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const { email, password, displayName } = schema.parse(json);
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await db
      .selectFrom("users")
      .select("id")
      .where(sql`LOWER(users.email)`, "=", normalizedEmail)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      return new Response(
        superjson.stringify({ message: "Cette adresse e-mail est déjà utilisée." }),
        {
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    const passwordHash = await generatePasswordHash(password);

    // Create new user
    const newUser = await db.transaction().execute(async (trx) => {
      // Insert the user
      const [user] = await trx
        .insertInto("users")
        .values({
          email: normalizedEmail,
          displayName,
          role: "user", // Default role
        })
        .returning(["id", "email", "displayName", "avatarUrl", "createdAt"])
        .execute();

      // Store the password hash in another table
      await trx
        .insertInto("userPasswords")
        .values({
          userId: user.id,
          passwordHash,
        })
        .execute();

      // Every new player starts with one available booster and an independent reserve.
      await trx.insertInto("tcgPackStatus").values({
        userId:user.id,stock:1,rechargeAt:new Date(Date.now()+12*60*60*1000)
      }).execute();
      return user;
    });

    // Create a new session
    const sessionId = randomBytes(32).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SessionExpirationSeconds * 1000);

    await db
      .insertInto("sessions")
      .values({
        id: sessionId,
        userId: newUser.id,
        createdAt: now,
        lastAccessed: now,
        expiresAt,
      })
      .execute();

    // Create response with user data
    const response = new Response(
      superjson.stringify({
        user: {
          ...newUser,
          role: "user" as const,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
            "Cache-Control": "private, no-store",
        },
      }
    );

    // Set session cookie
    await setServerSession(response, {
      id: sessionId,
      createdAt: now.getTime(),
      lastAccessed: now.getTime(),
    });

    return response;
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === "23505";
    const errorMessage = duplicate
      ? "Cette adresse e-mail est déjà utilisée."
      : error instanceof ZodError
        ? "Vérifie les informations du formulaire."
        : "L'inscription est momentanément indisponible.";
    return new Response(
      superjson.stringify({ message: errorMessage }),
      {
        status: duplicate ? 409 : error instanceof ZodError ? 400 : 500,
        headers: {
          "Content-Type": "application/json",
            "Cache-Control": "private, no-store",
        },
      }
    );
  }
}

