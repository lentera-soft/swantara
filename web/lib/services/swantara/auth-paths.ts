export const oauthProviders = ["google", "facebook"] as const;
export type OAuthProviderName = (typeof oauthProviders)[number];

export const authPaths = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",
  oauthAuthorize: (provider: OAuthProviderName) => `/api/v1/auth/oauth/${provider}`,
  requestEmailVerification: "/api/v1/auth/email-verification/request",
  verifyEmail: "/api/v1/auth/email-verification/verify",
  requestPasswordReset: "/api/v1/auth/password-reset/request",
  resetPassword: "/api/v1/auth/password-reset",
  sessions: "/api/v1/auth/sessions",
  revokeSession: (sessionId: string) => `/api/v1/auth/sessions/${sessionId}`,
} as const;

export const quickCreateOrganizationPath = "/api/v1/organizations/quick";
