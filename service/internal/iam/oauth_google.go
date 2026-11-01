package iam

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/config"
	"golang.org/x/oauth2"
)

const (
	googleAuthURL     = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL    = "https://oauth2.googleapis.com/token"
	googleUserinfoURL = "https://openidconnect.googleapis.com/v1/userinfo"
)

type googleProvider struct {
	oauth   *oauth2.Config
	timeout time.Duration
}

// NewGoogleProvider builds the Google OAuth provider from configuration.
func NewGoogleProvider(cfg *config.Config) OAuthProvider {
	return &googleProvider{
		timeout: cfg.OAuthHTTPTimeoutDuration,
		oauth: &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  OAuthCallbackURL(cfg, OAuthProviderGoogle),
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint: oauth2.Endpoint{
				AuthURL:   googleAuthURL,
				TokenURL:  googleTokenURL,
				AuthStyle: oauth2.AuthStyleInParams,
			},
		},
	}
}

func (p *googleProvider) Name() string {
	return OAuthProviderGoogle
}

func (p *googleProvider) AuthorizeURL(state, codeChallenge string) string {
	opts := []oauth2.AuthCodeOption{}
	if codeChallenge != "" {
		opts = append(opts,
			oauth2.SetAuthURLParam("code_challenge", codeChallenge),
			oauth2.SetAuthURLParam("code_challenge_method", "S256"),
		)
	}
	return p.oauth.AuthCodeURL(state, opts...)
}

func (p *googleProvider) Exchange(ctx context.Context, code, codeVerifier string) (OAuthProfile, error) {
	ctx, cancel := context.WithTimeout(ctx, p.timeout)
	defer cancel()

	opts := []oauth2.AuthCodeOption{}
	if codeVerifier != "" {
		opts = append(opts, oauth2.SetAuthURLParam("code_verifier", codeVerifier))
	}

	token, err := p.oauth.Exchange(ctx, code, opts...)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: google: %v", ErrOAuthExchangeFailed, err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserinfoURL, nil)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: google: %v", ErrOAuthProfileUnavailable, err)
	}

	resp, err := p.oauth.Client(ctx, token).Do(req)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: google: %v", ErrOAuthProfileUnavailable, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return OAuthProfile{}, fmt.Errorf("%w: google: status %d", ErrOAuthProfileUnavailable, resp.StatusCode)
	}

	var claims struct {
		Sub         string `json:"sub"`
		Email       string `json:"email"`
		EmailVerify bool   `json:"email_verified"`
		GivenName   string `json:"given_name"`
		FamilyName  string `json:"family_name"`
		Picture     string `json:"picture"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&claims); err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: google: %v", ErrOAuthProfileUnavailable, err)
	}

	if claims.Sub == "" {
		return OAuthProfile{}, fmt.Errorf("%w: google: missing sub", ErrOAuthProfileUnavailable)
	}

	return OAuthProfile{
		Provider:       OAuthProviderGoogle,
		ProviderUserID: claims.Sub,
		Email:          strings.ToLower(strings.TrimSpace(claims.Email)),
		EmailVerified:  claims.EmailVerify,
		FirstName:      claims.GivenName,
		LastName:       claims.FamilyName,
		Avatar:         claims.Picture,
	}, nil
}
