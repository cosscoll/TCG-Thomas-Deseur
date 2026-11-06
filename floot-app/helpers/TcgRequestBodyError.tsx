export class TcgRequestBodyError extends Error {
  constructor(public readonly status: 400 | 413 | 415, message: string) {
    super(message);
    this.name = "TcgRequestBodyError";
  }
}
