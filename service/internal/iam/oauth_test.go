package iam

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"golang.org/x/crypto/bcrypt"
)

type fakeOAuthProvider struct {
	name    string
	profile OAuthProfile
	err     error
}

func (p fakeOAuthProvider) Name() string { return p.name }

func (p fakeOAuthProvider) AuthorizeURL(state, codeChallenge string) string {
	return "https://provider.example/authorize?state=" + state + "&challenge=" + codeChallenge
}

func (p fakeOAuthProvider) Exchange(_ context.Context, code, _ string) (OAuthProfile, error) {
	if p.err != nil {
		return OAuthProfile{}, p.err
	}
	if code == "" {
		return OAuthProfile{}, errors.New("missing code")
	}
	return p.profile, nil
}

func testOAuthConfig() *config.Config {
	return &config.Config{
		ApplicationURL:                 "http://localhost:8080",
		ClientWebURL:                   "http://localhost:3000",
		JWTAccessTokenSecret:           "access-secret",
		JWTAccessTokenExpiresDuration:  30 * time.Minute,
		JWTAccessTokenSigningMethod:    jwt.SigningMethodHS256,
		JWTRefreshTokenSecret:          "refresh-secret",
		JWTRefreshTokenExpiresDuration: time.Hour,
		JWTRefreshTokenSigningMethod:   jwt.SigningMethodHS256,
	}
}

func testOAuthService(userDAO UserDAO, oauthDAO UserOAuthIdentityDAO, sessionDAO UserSessionDAO, providers ...OAuthProvider) OAuthService {
	cfg := testOAuthConfig()
	passwordSvc := NewPasswordService(&config.Config{BcryptCost: bcrypt.MinCost})
	return NewOAuthService(
		userDAO,
		NewUserService(userDAO, passwordSvc),
		oauthDAO,
		sessionDAO,
		passwordSvc,
		NewTokenService(cfg),
		providers...,
	)
}

func googleProfile() OAuthProfile {
	return OAuthProfile{
		Provider:       OAuthProviderGoogle,
		ProviderUserID: "g-123",
		Email:          "Jane.Doe@Example.com",
		EmailVerified:  true,
		FirstName:      "Jane",
		LastName:       "Doe",
		Avatar:         "https://example.com/avatar.png",
	}
}

func TestOAuthServiceAuthorize(t *testing.T) {
	t.Run("returns url with state and challenge", func(t *testing.T) {
		svc := testOAuthService(UserDAOMock{}, UserOAuthIdentityDAOMock{}, UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle})

		url, state, verifier, err := svc.Authorize(OAuthProviderGoogle)
		if err != nil {
			t.Fatal(err)
		}
		if state == "" || verifier == "" {
			t.Fatal("expected non-empty state and verifier")
		}
		if !strings.Contains(url, "state="+state) {
			t.Errorf("expected url to contain state, got %q", url)
		}
		if !strings.Contains(url, "challenge=") {
			t.Errorf("expected url to contain a PKCE challenge, got %q", url)
		}
		if verifier == pkceChallenge(verifier) {
			t.Error("challenge must not equal the verifier")
		}
	})

	t.Run("unknown provider", func(t *testing.T) {
		svc := testOAuthService(UserDAOMock{}, UserOAuthIdentityDAOMock{}, UserSessionDAOMock{})
		if _, _, _, err := svc.Authorize("twitter"); !errors.Is(err, ErrOAuthUnknownProvider) {
			t.Fatalf("expected ErrOAuthUnknownProvider, got %v", err)
		}
	})

	t.Run("configured provider missing", func(t *testing.T) {
		svc := testOAuthService(UserDAOMock{}, UserOAuthIdentityDAOMock{}, UserSessionDAOMock{})
		if _, _, _, err := svc.Authorize(OAuthProviderGoogle); !errors.Is(err, ErrOAuthProviderDisabled) {
			t.Fatalf("expected ErrOAuthProviderDisabled, got %v", err)
		}
	})
}

func TestOAuthServiceLoginWithCode(t *testing.T) {
	ctx := context.Background()

	t.Run("provisions a new user and links identity", func(t *testing.T) {
		var createdUser *User
		var createdIdentity *UserOAuthIdentity

		userDAO := UserDAOMock{
			DAOMock: DAOMock[User]{
				CreateFunc: func(ctx context.Context, entity *User) (*User, error) {
					entity.ID = 77
					createdUser = entity
					return entity, nil
				},
			},
			FindByEmailFunc: func(ctx context.Context, email string) (*User, error) {
				return nil, nil
			},
			FindByUsernameFunc: func(ctx context.Context, username string) (*User, error) {
				return nil, nil
			},
		}
		oauthDAO := UserOAuthIdentityDAOMock{
			DAOMock: DAOMock[UserOAuthIdentity]{
				CreateFunc: func(ctx context.Context, entity *UserOAuthIdentity) (*UserOAuthIdentity, error) {
					createdIdentity = entity
					return entity, nil
				},
			},
			FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
				return nil, nil
			},
		}

		svc := testOAuthService(userDAO, oauthDAO, UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, profile: googleProfile()})

		result, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{IPAddress: "127.0.0.1"})
		if err != nil {
			t.Fatal(err)
		}

		if createdUser == nil {
			t.Fatal("expected user to be created")
		}
		if createdUser.Email != "jane.doe@example.com" {
			t.Errorf("expected lowercased email, got %q", createdUser.Email)
		}
		if !createdUser.Active {
			t.Error("expected user to be active")
		}
		if createdUser.EmailVerifiedAt == nil {
			t.Error("expected email to be pre-verified")
		}
		if createdUser.Password == "" {
			t.Error("expected a random hashed password")
		}
		if createdIdentity == nil || createdIdentity.UserID != 77 || createdIdentity.Provider != OAuthProviderGoogle {
			t.Fatalf("unexpected identity: %+v", createdIdentity)
		}
		if result.UserID != 77 || result.AccessToken == "" || result.RefreshToken == "" {
			t.Fatalf("unexpected login result: %+v", result)
		}
	})

	t.Run("signs in an already linked identity", func(t *testing.T) {
		user := &User{Base: model.Base{ID: 5}, Email: "a@b.com", Active: true}

		svc := testOAuthService(
			UserDAOMock{
				DAOMock: DAOMock[User]{
					FindFunc: func(ctx context.Context, id uint64) (*User, error) {
						return user, nil
					},
				},
			},
			UserOAuthIdentityDAOMock{
				FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
					return &UserOAuthIdentity{Base: model.Base{ID: 1}, UserID: 5, Provider: provider, ProviderUserID: providerUserID}, nil
				},
			},
			UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderFacebook, profile: OAuthProfile{Provider: OAuthProviderFacebook, ProviderUserID: "fb-1", Email: "a@b.com", EmailVerified: true}},
		)

		result, err := svc.LoginWithCode(ctx, OAuthProviderFacebook, "code", "verifier", SessionClientInfo{})
		if err != nil {
			t.Fatal(err)
		}
		if result.UserID != 5 {
			t.Fatalf("expected user 5, got %d", result.UserID)
		}
	})

	t.Run("auto-links verified email to existing account", func(t *testing.T) {
		user := &User{Base: model.Base{ID: 9}, Email: "jane.doe@example.com", Active: true}
		var updated bool
		var linked bool

		userDAO := UserDAOMock{
			DAOMock: DAOMock[User]{
				UpdateFunc: func(ctx context.Context, entity *User) (*User, error) {
					updated = true
					return entity, nil
				},
			},
			FindByEmailFunc: func(ctx context.Context, email string) (*User, error) {
				return user, nil
			},
		}
		oauthDAO := UserOAuthIdentityDAOMock{
			DAOMock: DAOMock[UserOAuthIdentity]{
				CreateFunc: func(ctx context.Context, entity *UserOAuthIdentity) (*UserOAuthIdentity, error) {
					linked = true
					return entity, nil
				},
			},
			FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
				return nil, nil
			},
		}

		svc := testOAuthService(userDAO, oauthDAO, UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, profile: googleProfile()})

		if _, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{}); err != nil {
			t.Fatal(err)
		}
		if !linked || !updated {
			t.Fatalf("expected identity link (got %v) and email verification update (got %v)", linked, updated)
		}
		if user.EmailVerifiedAt == nil {
			t.Error("expected email verified timestamp to be set")
		}
	})

	t.Run("rejects unverified email matching existing account", func(t *testing.T) {
		profile := googleProfile()
		profile.EmailVerified = false

		svc := testOAuthService(
			UserDAOMock{
				FindByEmailFunc: func(ctx context.Context, email string) (*User, error) {
					return &User{Base: model.Base{ID: 9}, Email: profile.Email, Active: true}, nil
				},
			},
			UserOAuthIdentityDAOMock{
				FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
					return nil, nil
				},
			},
			UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, profile: profile},
		)

		if _, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{}); !errors.Is(err, ErrOAuthEmailUnverified) {
			t.Fatalf("expected ErrOAuthEmailUnverified, got %v", err)
		}
	})

	t.Run("requires an email for new accounts", func(t *testing.T) {
		profile := googleProfile()
		profile.Email = ""

		svc := testOAuthService(
			UserDAOMock{FindByEmailFunc: func(ctx context.Context, email string) (*User, error) { return nil, nil }},
			UserOAuthIdentityDAOMock{
				FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
					return nil, nil
				},
			},
			UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, profile: profile},
		)

		if _, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{}); !errors.Is(err, ErrOAuthEmailRequired) {
			t.Fatalf("expected ErrOAuthEmailRequired, got %v", err)
		}
	})

	t.Run("inactive user is rejected", func(t *testing.T) {
		svc := testOAuthService(
			UserDAOMock{
				DAOMock: DAOMock[User]{
					FindFunc: func(ctx context.Context, id uint64) (*User, error) {
						return &User{Base: model.Base{ID: 5}, Active: false}, nil
					},
				},
			},
			UserOAuthIdentityDAOMock{
				FindByProviderUserFunc: func(ctx context.Context, provider, providerUserID string) (*UserOAuthIdentity, error) {
					return &UserOAuthIdentity{Base: model.Base{ID: 1}, UserID: 5}, nil
				},
			},
			UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, profile: googleProfile()},
		)

		if _, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{}); !errors.Is(err, ErrUserNotActive) {
			t.Fatalf("expected ErrUserNotActive, got %v", err)
		}
	})

	t.Run("exchange failure propagates", func(t *testing.T) {
		svc := testOAuthService(
			UserDAOMock{},
			UserOAuthIdentityDAOMock{},
			UserSessionDAOMock{},
			fakeOAuthProvider{name: OAuthProviderGoogle, err: errors.New("boom")},
		)

		if _, err := svc.LoginWithCode(ctx, OAuthProviderGoogle, "code", "verifier", SessionClientInfo{}); err == nil {
			t.Fatal("expected exchange error")
		}
	})
}
