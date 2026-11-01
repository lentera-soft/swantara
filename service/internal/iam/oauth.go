package iam

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

// OAuthProfile is the normalized identity returned by an OAuth provider.
type OAuthProfile struct {
	Provider       string
	ProviderUserID string
	Email          string
	EmailVerified  bool
	FirstName      string
	LastName       string
	Avatar         string
}

// OAuthProvider abstracts a social-login provider such as Google or Facebook.
type OAuthProvider interface {
	Name() string
	AuthorizeURL(state, codeChallenge string) string
	Exchange(ctx context.Context, code, codeVerifier string) (OAuthProfile, error)
}

const (
	OAuthStateCookie    = "oauth_state"
	OAuthVerifierCookie = "oauth_code_verifier"

	oauthCallbackPathFormat = "/api/v1/auth/oauth/%s/callback"
)

// OAuthCallbackURL builds the redirect URI that must be registered with the provider.
func OAuthCallbackURL(cfg *config.Config, provider string) string {
	return strings.TrimSuffix(cfg.ApplicationURL, "/") + fmt.Sprintf(oauthCallbackPathFormat, provider)
}

type OAuthService struct {
	providers      map[string]OAuthProvider
	userDAO        UserDAO
	userSvc        UserService
	oauthDAO       UserOAuthIdentityDAO
	userSessionDAO UserSessionDAO
	passwordSvc    PasswordService
	tokenSvc       TokenService
}

func NewOAuthService(
	userDAO UserDAO,
	userSvc UserService,
	oauthDAO UserOAuthIdentityDAO,
	userSessionDAO UserSessionDAO,
	passwordSvc PasswordService,
	tokenSvc TokenService,
	providers ...OAuthProvider,
) OAuthService {
	registry := make(map[string]OAuthProvider, len(providers))
	for _, p := range providers {
		if p == nil {
			continue
		}
		registry[p.Name()] = p
	}

	return OAuthService{
		providers:      registry,
		userDAO:        userDAO,
		userSvc:        userSvc,
		oauthDAO:       oauthDAO,
		userSessionDAO: userSessionDAO,
		passwordSvc:    passwordSvc,
		tokenSvc:       tokenSvc,
	}
}

// Authorize returns the provider authorization URL plus the CSRF state and the
// PKCE code verifier that the caller must persist (for example in cookies).
func (s OAuthService) Authorize(providerName string) (authorizeURL, state, codeVerifier string, err error) {
	provider, err := s.provider(providerName)
	if err != nil {
		return "", "", "", err
	}

	state, err = helper.RandomHex(16)
	if err != nil {
		return "", "", "", err
	}

	codeVerifier, err = helper.RandomHex(32)
	if err != nil {
		return "", "", "", err
	}

	return provider.AuthorizeURL(state, pkceChallenge(codeVerifier)), state, codeVerifier, nil
}

// LoginWithCode exchanges an authorization code for provider tokens, resolves
// (or provisions) the local user, and returns an access/refresh token pair.
func (s OAuthService) LoginWithCode(
	ctx context.Context,
	providerName,
	code,
	codeVerifier string,
	client SessionClientInfo,
) (result *LoginResult, err error) {
	defer helper.RecordOp(ctx, "auth.oauth_login", clock.Now(), &err)

	provider, err := s.provider(providerName)
	if err != nil {
		return nil, err
	}

	profile, err := provider.Exchange(ctx, code, codeVerifier)
	if err != nil {
		return nil, err
	}

	user, err := s.resolveUser(ctx, profile)
	if err != nil {
		return nil, err
	}

	if !user.Active {
		return nil, ErrUserNotActive
	}

	refreshToken, refreshTokenExpiresAt, err := s.tokenSvc.IssueUserRefreshToken(user)
	if err != nil {
		return nil, err
	}

	session, err := s.userSessionDAO.Create(ctx, sessionModel(client, user.ID, refreshToken, *refreshTokenExpiresAt))
	if err != nil {
		return nil, err
	}

	accessToken, accessTokenExpiresAt, err := s.tokenSvc.IssueUserAccessToken(user, session.ID)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		UserID:                user.ID,
		AccessToken:           accessToken,
		AccessTokenExpiresAt:  *accessTokenExpiresAt,
		RefreshToken:          refreshToken,
		RefreshTokenExpiresAt: *refreshTokenExpiresAt,
	}, nil
}

func (s OAuthService) provider(name string) (OAuthProvider, error) {
	switch name {
	case OAuthProviderGoogle, OAuthProviderFacebook:
	default:
		return nil, ErrOAuthUnknownProvider
	}

	provider, ok := s.providers[name]
	if !ok {
		return nil, ErrOAuthProviderDisabled
	}
	return provider, nil
}

func (s OAuthService) resolveUser(ctx context.Context, profile OAuthProfile) (*User, error) {
	profile.Email = strings.ToLower(strings.TrimSpace(profile.Email))

	identity, err := s.oauthDAO.FindByProviderUser(ctx, profile.Provider, profile.ProviderUserID)
	if err != nil {
		return nil, err
	}

	if identity != nil && identity.ID != 0 {
		user, err := s.userDAO.Find(ctx, identity.UserID)
		if err != nil {
			if errors.Is(err, dao.ErrNotFound) {
				return nil, ErrUserNotFound
			}
			return nil, err
		}
		return user, nil
	}

	if profile.Email == "" {
		return nil, ErrOAuthEmailRequired
	}

	user, err := s.userDAO.FindByEmail(ctx, profile.Email)
	if err != nil {
		return nil, err
	}

	if user != nil && user.ID != 0 {
		if !profile.EmailVerified {
			return nil, ErrOAuthEmailUnverified
		}

		if user.EmailVerifiedAt == nil {
			now := clock.Now()
			user.EmailVerifiedAt = &now
			if _, err := s.userDAO.Update(ctx, user); err != nil {
				return nil, err
			}
		}

		if err := s.linkIdentity(ctx, user.ID, profile); err != nil {
			return nil, err
		}
		return user, nil
	}

	return s.provisionUser(ctx, profile)
}

func (s OAuthService) provisionUser(ctx context.Context, profile OAuthProfile) (*User, error) {
	randomPassword, err := helper.RandomHex(32)
	if err != nil {
		return nil, err
	}

	hashedPassword, err := s.passwordSvc.Hash(randomPassword)
	if err != nil {
		return nil, err
	}

	username, err := generateUniqueUsername(ctx, s.userSvc, profile.Email)
	if err != nil {
		return nil, err
	}

	firstName := strings.TrimSpace(profile.FirstName)
	if firstName == "" {
		firstName = username
	}

	user := &User{
		Username:  username,
		FirstName: firstName,
		LastName:  optionalString(profile.LastName),
		Email:     profile.Email,
		Password:  hashedPassword,
		Avatar:    optionalString(profile.Avatar),
		Active:    true,
	}

	if profile.EmailVerified {
		now := clock.Now()
		user.EmailVerifiedAt = &now
	}

	created, err := s.userDAO.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	if err := s.linkIdentity(ctx, created.ID, profile); err != nil {
		return nil, err
	}
	return created, nil
}

func (s OAuthService) linkIdentity(ctx context.Context, userID uint64, profile OAuthProfile) error {
	email := profile.Email
	_, err := s.oauthDAO.Create(ctx, &UserOAuthIdentity{
		UserID:         userID,
		Provider:       profile.Provider,
		ProviderUserID: profile.ProviderUserID,
		Email:          &email,
	})
	return err
}

func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func optionalString(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}
