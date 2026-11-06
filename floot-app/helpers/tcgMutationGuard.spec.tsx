import { tcgMutationGuard } from "./tcgMutationGuard";

describe("TCG mutation protection", () => {
  const url = "https://tcg-thomas-deseur.floot.app/_api/booster";
  it("blocks a forged cross-origin POST", () => {
    const request = new Request(url, { method: "POST", headers: { origin: "https://attacker.example" } });
    expect(tcgMutationGuard(request)?.status).toBe(403);
  });
  it("blocks a cross-site Fetch Metadata request even without Origin", () => {
    const request = new Request(url, { method: "POST", headers: { "sec-fetch-site": "cross-site" } });
    expect(tcgMutationGuard(request)?.status).toBe(403);
  });
  it("allows first-party browser requests", () => {
    const request = new Request(url, { method: "POST", headers: {
      origin: "https://tcg-thomas-deseur.floot.app", "sec-fetch-site": "same-origin",
    } });
    expect(tcgMutationGuard(request)).toBeNull();
  });
  it("rejects bogus content lengths", () => {
    const request = new Request(url, { method: "POST", headers: { "content-length": "NaN" } });
    expect(tcgMutationGuard(request)?.status).toBe(403);
  });
  it("limits declared request size", () => {
    const request = new Request(url, { method: "POST", headers: { "content-length": "20000" } });
    expect(tcgMutationGuard(request)?.status).toBe(413);
  });
});
