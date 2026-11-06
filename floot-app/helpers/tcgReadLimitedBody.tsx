/**
 * Read untrusted JSON without trusting Content-Length.
 * Browsers may send chunked requests with no declared size.
 */
export class TcgRequestBodyError extends Error {
  constructor(public readonly status: 400 | 413 | 415, message: string) {
    super(message);
    this.name = "TcgRequestBodyError";
  }
}

export async function tcgReadLimitedBody(request: Request, maxBytes = 16_384): Promise<string> {
  const contentType = request.headers.get("content-type");
  if (contentType && !/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    throw new TcgRequestBodyError(415, "Le format JSON est obligatoire.");
  }
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (!Number.isSafeInteger(n) || n < 0) {
      throw new TcgRequestBodyError(400, "Taille de requête invalide.");
    }
    if (n > maxBytes) {
      throw new TcgRequestBodyError(413, "Requête trop volumineuse.");
    }
  }
  const reader = request.body?.getReader();
  if (!reader) throw new TcgRequestBodyError(400, "Corps de requête manquant.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        // Cancel after the limit is reached, without materializing more data.
        void reader.cancel().catch(() => undefined);
        throw new TcgRequestBodyError(413, "Requête trop volumineuse.");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof TcgRequestBodyError) throw error;
    throw new TcgRequestBodyError(400, "Corps de requête invalide.");
  } finally {
    reader.releaseLock();
  }
  if (!text.trim()) throw new TcgRequestBodyError(400, "Corps de requête vide.");
  return text;
}
