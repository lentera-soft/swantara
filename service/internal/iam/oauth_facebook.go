package iam

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/config"
	"golang.org/x/oauth2"
)

const (
	facebookAPIVersion = "v23.0"
	facebookGraphURL   = "https://graph.facebook.com/" + facebookAPIVersion
)

type facebookProvider struct {
	oauth     *oauth2.Config
	appSecret string
	timeout   time.Duration
}

// NewFacebookProvider builds the Facebook OAuth provider from configuration.
func NewFacebookProvider(cfg *config.Config) OAuthProvider {
	return &facebookProvider{
		appSecret: cfg.FacebookAppSecret,
		timeout:   cfg.OAuthHTTPTimeoutDuration,
		oauth: &oauth2.Config{
			ClientID:     cfg.FacebookAppID,
			ClientSecret: cfg.FacebookAppSecret,
			RedirectURL:  OAuthCallbackURL(cfg, OAuthProviderFacebook),
			Scopes:       []string{"email"},
			Endpoint: oauth2.Endpoint{
				AuthURL:   facebookGraphURL + "/dialog/oauth",
				TokenURL:  facebookGraphURL + "/oauth/access_token",
				AuthStyle: oauth2.AuthStyleInParams,
			},
		},
	}
}

func (p *facebookProvider) Name() string {
	return OAuthProviderFacebook
}

func (p *facebookProvider) AuthorizeURL(state, _ string) string {
	return p.oauth.AuthCodeURL(state, oauth2.SetAuthURLParam("response_type", "code"))
}

func (p *facebookProvider) Exchange(ctx context.Context, code, _ string) (OAuthProfile, error) {
	ctx, cancel := context.WithTimeout(ctx, p.timeout)
	defer cancel()

	token, err := p.oauth.Exchange(ctx, code)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: %v", ErrOAuthExchangeFailed, err)
	}

	endpoint := facebookGraphURL + "/me?" + url.Values{
		"fields":          {"id,first_name,last_name,email,picture.width(128).height(128)"},
		"access_token":    {token.AccessToken},
		"appsecret_proof": {p.appsecretProof(token.AccessToken)},
	}.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: %v", ErrOAuthProfileUnavailable, err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: %v", ErrOAuthProfileUnavailable, err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: status %d", ErrOAuthProfileUnavailable, resp.StatusCode)
	}

	var me struct {
		ID        string `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		Picture   struct {
			Data struct {
				URL string `json:"url"`
			} `json:"data"`
		} `json:"picture"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&me); err != nil {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: %v", ErrOAuthProfileUnavailable, err)
	}

	if me.ID == "" {
		return OAuthProfile{}, fmt.Errorf("%w: facebook: missing id", ErrOAuthProfileUnavailable)
	}

	email := strings.ToLower(strings.TrimSpace(me.Email))

	return OAuthProfile{
		Provider:       OAuthProviderFacebook,
		ProviderUserID: me.ID,
		Email:          email,
		// Facebook only exposes confirmed (verified) email addresses on the Graph API.
		EmailVerified: email != "",
		FirstName:     me.FirstName,
		LastName:      me.LastName,
		Avatar:        me.Picture.Data.URL,
	}, nil
}

func (p *facebookProvider) appsecretProof(accessToken string) string {
	mac := hmac.New(sha256.New, []byte(p.appSecret))
	mac.Write([]byte(accessToken))
	return hex.EncodeToString(mac.Sum(nil))
}
