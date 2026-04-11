import "server-only";

export class AdmActionError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AdmActionError";
  }
}
