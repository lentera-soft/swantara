import { getCsrfToken } from "@/lib/constants/cookies";
import { authPaths, quickCreateOrganizationPath } from "@/lib/services/swantara/auth-paths";
import { SwantaraError } from "@/lib/services/swantara/errors";
import type {
  LoginRequest,
  QuickCreateOrganizationRequest,
  RegisterRequest,
  TokenPair,
} from "@/lib/services/swantara/identity";
import {
  type SwantaraErrorBody,
  toSwantaraResponseError,
} from "@/lib/services/swantara/response-error";
import type { Organization, SuccessEnvelope, User } from "@/lib/services/swantara/types";
import { toCamelCase, toSnakeCase } from "@/lib/utils/case";

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) ? seconds : null;
}

async function refreshAccessToken(): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  try {
    const response = await fetch(authPaths.refresh, {
      method: "POST",
      headers,
      credentials: "include",
      body: "{}",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(toSnakeCase(body ?? {})),
    });
  } catch {
    throw new SwantaraError("Network error.", null, 0);
  }

  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = toCamelCase(json);

  if (!response.ok) {
    throw toSwantaraResponseError(
      response.status,
      parsed as SwantaraErrorBody | null,
      parseRetryAfter(response.headers.get("retry-after")),
    );
  }

  const envelope = parsed as SuccessEnvelope<T> | null;
  if (envelope?.data === null || envelope?.data === undefined) {
    return envelope?.data as T;
  }
  if (envelope.meta === undefined) return { ...envelope.data };
  return { ...envelope.data, meta: envelope.meta };
}

export async function login(input: LoginRequest): Promise<TokenPair> {
  return request<TokenPair>(authPaths.login, input);
}

export async function register(input: RegisterRequest): Promise<{ user: User }> {
  return request<{ user: User }>(authPaths.register, input);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request<void>(authPaths.requestPasswordReset, { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request<void>(authPaths.resetPassword, { token, password });
}

export async function quickCreateOrganization(
  input: QuickCreateOrganizationRequest,
): Promise<{ organization: Organization }> {
  try {
    return await request<{ organization: Organization }>(quickCreateOrganizationPath, input);
  } catch (error) {
    if (error instanceof SwantaraError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<{ organization: Organization }>(quickCreateOrganizationPath, input);
      }
    }
    throw error;
  }
}
