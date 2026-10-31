import {
  SwantaraError,
  type SwantaraFieldError,
  SwantaraUnauthorizedError,
  SwantaraUnprocessableError,
} from "./errors";

export type SwantaraErrorBody = {
  message?: string;
  errorCode?: string;
  fieldErrors?: SwantaraFieldError[] | null;
};

const codeToErrorClass: Record<string, new (message: string) => SwantaraError> = {
  ERR_UNAUTHORIZED: SwantaraUnauthorizedError,
  ERR_UNPROCESSABLE: SwantaraUnprocessableError,
};

export function toSwantaraResponseError(
  status: number,
  body: SwantaraErrorBody | null | undefined,
  retryAfterSeconds: number | null,
): SwantaraError {
  const message = body?.message ?? `Request failed with status ${status}`;
  const errorCode = body?.errorCode;
  const fieldErrors = body?.fieldErrors ?? null;

  let error: SwantaraError;
  if (errorCode) {
    const ErrorClass = codeToErrorClass[errorCode];
    if (!ErrorClass) {
      error = new SwantaraError(message, errorCode, status);
    } else {
      const mapped = new ErrorClass(message);
      if (mapped instanceof SwantaraUnprocessableError) {
        mapped.fieldErrors = fieldErrors;
      }
      error = mapped;
    }
  } else if (status === 422) {
    error = new SwantaraUnprocessableError(message, fieldErrors);
  } else if (status === 401) {
    error = new SwantaraUnauthorizedError(message);
  } else {
    error = new SwantaraError(message, null, status);
  }

  error.retryAfterSeconds = retryAfterSeconds;
  return error;
}
