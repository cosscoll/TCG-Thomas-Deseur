// adapt this to your database schema
import { db } from "../../helpers/db";
import {tcgMutationGuard} from "../../helpers/tcgMutationGuard";
import {
  getServerSessionOrThrow,
  clearServerSession,
  NotAuthenticatedError,
} from "../../helpers/getSetServerSession";
import superjson from "superjson";

export async function handle(request: Request) {
  const blocked = tcgMutationGuard(request);
  if (blocked) return blocked;
  try {
    // Get the current session
    const session = await getServerSessionOrThrow(request);

    // Delete the session from the database
    await db.deleteFrom("sessions").where("id", "=", session.id).execute();

    // Create response with success message
    const response = new Response(
      superjson.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    );

    clearServerSession(response);

    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
          },
        }
      );
    }
    console.error("Logout error:", error);
    return new Response(
      superjson.stringify({
        error: "Logout failed",
        message: "Déconnexion temporairement indisponible.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
