/**
 * Additional CSRF protection for state-changing endpoints.
 * SameSite cookies are necessary, but are not a complete CSRF policy.
 * Keep requests without browser origin metadata usable for first-party
 * server-side clients; browsers supply Origin and/or Sec-Fetch-Site.
 */
export function tcgMutationGuard(request: Request): Response | null {
  const reject = () => new Response(JSON.stringify({ error: "Requête non autorisée." }), {
    status: 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  const site = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (site && site !== "same-origin" && site !== "none") return reject();
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return reject();
    } catch {
      return reject();
    }
  }
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isSafeInteger(length) || length < 0) return reject();
    if (length > 16384) return new Response(
      JSON.stringify({ error: "Requête trop volumineuse." }),
      { status: 413, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  }
  return null;
}
