import { tcgIpDigest } from "./tcgIpDigest";

describe("TCG anonymous IP rate-limit identifiers", () => {
  const previous = process.env.JWT_SECRET;
  beforeEach(() => { process.env.JWT_SECRET = "dummy-test-only-signing-key"; });
  afterEach(() => {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  });
  const request = (ip: string) => new Request(
    "https://tcg-thomas-deseur.floot.app/_api/auth/register_with_password",
    { headers: { "x-floot-client-ip": ip } }
  );
  it("does not store a raw address", () => {
    const digest = tcgIpDigest(request("198.51.100.50"), "register");
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain("198.51.100.50");
  });
  it("separates IPs and operations", () => {
    expect(tcgIpDigest(request("198.51.100.50"), "register"))
      .not.toBe(tcgIpDigest(request("198.51.100.51"), "register"));
    expect(tcgIpDigest(request("198.51.100.50"), "login"))
      .not.toBe(tcgIpDigest(request("198.51.100.50"), "register"));
  });
  it("uses a fail-closed shared bucket when Floot does not provide an IP", () => {
    const without = new Request("https://tcg-thomas-deseur.floot.app/_api/auth/register_with_password");
    expect(tcgIpDigest(without, "register"))
      .toBe(tcgIpDigest(request("not-an-ip"), "register"));
  });
});
