import { HttpErrorResponse } from '@angular/common/http';

export function toAppError(error: unknown, fallback: string): Error {
  if (error instanceof HttpErrorResponse) {
    const message =
      (error.error as { message?: string } | null)?.message ??
      error.message ??
      error.statusText ??
      fallback;

    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}
