import { tcgResetCodeDigest } from "./tcgResetCodeDigest";

describe("TCG reset code protection", () => {
  const previous = process.env.JWT_SECRET;
  beforeEach(() => { process.env.JWT_SECRET = "test-secret-with-sufficient-entropy"; });
  afterEach(() => {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  });
  it("does not reveal the eight digit reset code in the stored digest", () => {
    const value = tcgResetCodeDigest(42, "12345678");
    expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(value).not.toContain("12345678");
  });
  it("binds the digest to the user and the server secret", () => {
    const first = tcgResetCodeDigest(42, "12345678");
    expect(tcgResetCodeDigest(43, "12345678")).not.toBe(first);
    process.env.JWT_SECRET = "a-second-unique-test-secret";
    expect(tcgResetCodeDigest(42, "12345678")).not.toBe(first);
  });
});
