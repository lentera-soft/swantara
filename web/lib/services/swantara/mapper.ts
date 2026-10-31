import { isAxiosError } from "axios";
import { SwantaraError } from "./errors";
import { toSwantaraResponseError } from "./response-error";

export type { SwantaraErrorBody } from "./response-error";

type SwantaraErrorEnvelope = {
  message?: string;
  error_code?: string;
  field_errors?: Array<{ field: string; code: string; message: string }> | null;
};

function parseRetryAfter(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

export function toSwantaraError(error: unknown): SwantaraError {
  if (!isAxiosError(error)) {
    return new SwantaraError("Network error.");
  }

  const status = error.response?.status ?? 0;
  const body = error.response?.data as SwantaraErrorEnvelope | undefined;
  const retryAfterSeconds = parseRetryAfter(error.response?.headers?.["retry-after"]);

  return toSwantaraResponseError(
    status,
    body
      ? {
          message: body.message ?? error.message,
          errorCode: body.error_code,
          fieldErrors: body.field_errors ?? null,
        }
      : {
          message: error.message,
          errorCode: undefined,
          fieldErrors: null,
        },
    retryAfterSeconds,
  );
}
