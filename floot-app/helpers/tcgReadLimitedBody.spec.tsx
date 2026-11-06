import { tcgReadLimitedBody, TcgRequestBodyError } from "./tcgReadLimitedBody";

describe("Limitation réelle des corps de requête", () => {
  const url = "https://tcg-thomas-deseur.floot.app/_api/auth/login_with_password";
  const post = (body: string, contentType = "application/json") =>
    new Request(url, { method: "POST", headers: { "content-type": contentType }, body });

  it("accepte le JSON envoyé normalement", async () => {
    const payload = '{"email":"a@example.org","password":"testing"}';
    expect(await tcgReadLimitedBody(post(payload))).toBe(payload);
  });

  it("refuse les gros corps même si Content-Length n'est pas fourni", async () => {
    const payload = JSON.stringify({ garbage: "x".repeat(20_000) });
    try {
      await tcgReadLimitedBody(post(payload));
      fail("La requête volumineuse aurait dû être refusée.");
    } catch (error) {
      expect(error instanceof TcgRequestBodyError).toBe(true);
      expect((error as TcgRequestBodyError).status).toBe(413);
    }
  });

  it("refuse les formats inattendus", async () => {
    await expectAsync(tcgReadLimitedBody(post("hello", "text/plain"))).toBeRejectedWithError(TcgRequestBodyError);
  });

  it("refuse un corps vide", async () => {
    await expectAsync(tcgReadLimitedBody(post("  "))).toBeRejectedWithError(TcgRequestBodyError);
  });
});
