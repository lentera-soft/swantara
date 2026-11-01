package handler

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

const (
	oauthAccessCookie  = "access_token"
	oauthRefreshCookie = "refresh_token"
	oauthCSRFCookie    = "csrf_token"

	oauthCSRFMaxAgeSeconds = 48 * 60 * 60
)

type OAuthHandler struct {
	oauthSvc iam.OAuthService
	cfg      *config.Config
}

func NewOAuthHandler(oauthSvc iam.OAuthService, cfg *config.Config) OAuthHandler {
	return OAuthHandler{oauthSvc: oauthSvc, cfg: cfg}
}

// GoogleRedirectHandler godoc
// @Summary Start Google OAuth login
// @Description Redirects the browser to the Google consent screen. A CSRF state and a PKCE code verifier are stored in short-lived HttpOnly cookies and validated again on callback. Returns 503 when the provider is not configured.
// @Tags Authentication
// @Produce json
// @Success 302 "Redirect to Google"
// @Failure 503 {object} httpx.ErrorResponse "Provider not configured"
// @Router /auth/oauth/google [get]
func (h OAuthHandler) GoogleRedirectHandler(c fiber.Ctx) error {
	return h.redirect(c, iam.OAuthProviderGoogle)
}

// FacebookRedirectHandler godoc
// @Summary Start Facebook OAuth login
// @Description Redirects the browser to the Facebook consent screen. A CSRF state is stored in a short-lived HttpOnly cookie and validated again on callback. Returns 503 when the provider is not configured.
// @Tags Authentication
// @Produce json
// @Success 302 "Redirect to Facebook"
// @Failure 503 {object} httpx.ErrorResponse "Provider not configured"
// @Router /auth/oauth/facebook [get]
func (h OAuthHandler) FacebookRedirectHandler(c fiber.Ctx) error {
	return h.redirect(c, iam.OAuthProviderFacebook)
}

func (h OAuthHandler) redirect(c fiber.Ctx, provider string) error {
	authorizeURL, state, codeVerifier, err := h.oauthSvc.Authorize(provider)
	if err != nil {
		switch {
		case errors.Is(err, iam.ErrOAuthUnknownProvider):
			return httpx.CreateNotFoundResponse(c, "Unknown oauth provider.")
		case errors.Is(err, iam.ErrOAuthProviderDisabled):
			httpx.RequestLog(c).Warn("oauth provider disabled", "provider", provider)
			return httpx.CreateServiceUnavailableErrorResponse(c, "Oauth provider is not configured.", err)
		default:
			httpx.RequestLog(c).Error("oauth authorize failed", "provider", provider, "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to start oauth login.", err)
		}
	}

	h.setStateCookies(c, state, codeVerifier)
	return c.Redirect().Status(fiber.StatusFound).To(authorizeURL)
}

// GoogleCallbackHandler godoc
// @Summary Complete Google OAuth login
// @Description Exchanges the Google authorization code for the user identity, links it to an existing account (when the provider email is verified) or provisions a new user, then issues the session token pair as HttpOnly cookies and redirects to the web client. Failures redirect to the web login page with an oauth error code.
// @Tags Authentication
// @Produce json
// @Param code query string true "Authorization code"
// @Param state query string true "CSRF state"
// @Success 302 "Redirect to the web client"
// @Failure 302 "Redirect to the web login page with an error"
// @Router /auth/oauth/google/callback [get]
func (h OAuthHandler) GoogleCallbackHandler(c fiber.Ctx) error {
	return h.callback(c, iam.OAuthProviderGoogle)
}

// FacebookCallbackHandler godoc
// @Summary Complete Facebook OAuth login
// @Description Exchanges the Facebook authorization code for the user identity, links it to an existing account (when the provider email is verified) or provisions a new user, then issues the session token pair as HttpOnly cookies and redirects to the web client. Failures redirect to the web login page with an oauth error code.
// @Tags Authentication
// @Produce json
// @Param code query string true "Authorization code"
// @Param state query string true "CSRF state"
// @Success 302 "Redirect to the web client"
// @Failure 302 "Redirect to the web login page with an error"
// @Router /auth/oauth/facebook/callback [get]
func (h OAuthHandler) FacebookCallbackHandler(c fiber.Ctx) error {
	return h.callback(c, iam.OAuthProviderFacebook)
}

func (h OAuthHandler) callback(c fiber.Ctx, provider string) error {
	h.clearStateCookies(c)

	if providerErr := c.Query("error"); providerErr != "" {
		httpx.RequestLog(c).Warn("oauth denied by provider", "provider", provider, "reason", providerErr)
		return h.redirectFailure(c, "oauth_denied")
	}

	state := c.Query("state")
	code := c.Query("code")
	cookieState := c.Cookies(iam.OAuthStateCookie)
	codeVerifier := c.Cookies(iam.OAuthVerifierCookie)

	if code == "" || state == "" || cookieState == "" || state != cookieState || codeVerifier == "" {
		httpx.RequestLog(c).Warn("oauth state mismatch", "provider", provider)
		return h.redirectFailure(c, "oauth_invalid_state")
	}

	tokens, err := h.oauthSvc.LoginWithCode(
		c,
		provider,
		code,
		codeVerifier,
		iam.SessionClientInfo{
			IPAddress:  httpx.ClientIP(c),
			DeviceName: httpx.DeviceName(c),
			Browser:    httpx.Browser(c),
			OS:         httpx.OS(c),
		},
	)
	if err != nil {
		switch {
		case errors.Is(err, iam.ErrOAuthExchangeFailed), errors.Is(err, iam.ErrOAuthProfileUnavailable):
			httpx.RequestLog(c).Warn("oauth exchange failed", "provider", provider, "error", err)
			return h.redirectFailure(c, "oauth_provider_error")
		case errors.Is(err, iam.ErrOAuthEmailRequired):
			return h.redirectFailure(c, "oauth_email_required")
		case errors.Is(err, iam.ErrOAuthEmailUnverified):
			return h.redirectFailure(c, "oauth_email_unverified")
		case errors.Is(err, iam.ErrUserNotActive):
			return h.redirectFailure(c, "oauth_account_inactive")
		default:
			httpx.RequestLog(c).Error("oauth login failed", "provider", provider, "error", err)
			return h.redirectFailure(c, "oauth_failed")
		}
	}

	httpx.RequestLog(c).Info("oauth login succeeded", "provider", provider, "user_id", tokens.UserID)
	h.setSessionCookies(c, tokens)

	return c.Redirect().Status(fiber.StatusFound).To(h.clientURL(h.cfg.OAuthSuccessRedirect))
}

func (h OAuthHandler) setStateCookies(c fiber.Ctx, state, codeVerifier string) {
	maxAge := int(h.cfg.OAuthStateTTLDuration.Seconds())
	c.Res().Cookie(h.baseCookie(iam.OAuthStateCookie, state, maxAge, true))
	c.Res().Cookie(h.baseCookie(iam.OAuthVerifierCookie, codeVerifier, maxAge, true))
}

func (h OAuthHandler) clearStateCookies(c fiber.Ctx) {
	c.Res().Cookie(h.baseCookie(iam.OAuthStateCookie, "", 0, true))
	c.Res().Cookie(h.baseCookie(iam.OAuthVerifierCookie, "", 0, true))
}

func (h OAuthHandler) setSessionCookies(c fiber.Ctx, tokens *iam.LoginResult) {
	c.Res().Cookie(h.baseCookie(oauthAccessCookie, tokens.AccessToken, int(tokens.AccessTokenExpiresAt.Sub(clock.Now()).Seconds()), true))
	c.Res().Cookie(h.baseCookie(oauthRefreshCookie, tokens.RefreshToken, int(tokens.RefreshTokenExpiresAt.Sub(clock.Now()).Seconds()), true))

	csrf, err := helper.RandomHex(16)
	if err != nil {
		httpx.RequestLog(c).Error("oauth csrf generation failed", "error", err)
		return
	}
	c.Res().Cookie(h.baseCookie(oauthCSRFCookie, csrf, oauthCSRFMaxAgeSeconds, false))
}

func (h OAuthHandler) baseCookie(name, value string, maxAge int, httpOnly bool) *fiber.Cookie {
	return &fiber.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   maxAge,
		Secure:   !h.cfg.ApplicationDebug,
		HTTPOnly: httpOnly,
		SameSite: "lax",
	}
}

func (h OAuthHandler) redirectFailure(c fiber.Ctx, reason string) error {
	return c.Redirect().Status(fiber.StatusFound).To(h.clientURL("/login") + "?error=" + reason)
}

func (h OAuthHandler) clientURL(path string) string {
	return strings.TrimSuffix(h.cfg.ClientWebURL, "/") + path
}
