export class DuplicateError extends Error {
  constructor(public existing: { id: string; status: string; liveUrl?: string }) {
    super("DUPLICATE_NOMINATION");
    this.name = "DuplicateError";
  }
}

export class InvalidLinkedInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLinkedInError";
  }
}

export class ConflictError extends Error {
  constructor(
    message: string,
    public existingId: string,
    public existingStatus: string,
    public liveUrl: string
  ) {
    super(message);
    this.name = "ConflictError";
  }
}