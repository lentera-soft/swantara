//go:build e2e

package e2e

import (
	"net/http"
	"strconv"
	"testing"

	"github.com/brianvoe/gofakeit/v7"
)

func TestCreateUserForbiddenForBasicUserE2E(t *testing.T) {
	user := registerAndLogin(t)

	newExpect(t).POST("/api/v1/users").
		WithHeader("Authorization", "Bearer "+user.tokens.AccessToken).
		WithJSON(map[string]any{
			"username":   gofakeit.Username(),
			"first_name": gofakeit.FirstName(),
			"last_name":  gofakeit.LastName(),
			"email":      gofakeit.Email(),
			"password":   "test-password",
		}).
		Expect().
		Status(http.StatusForbidden)
}

func TestCreateUserRequiresTokenE2E(t *testing.T) {
	newExpect(t).POST("/api/v1/users").
		WithJSON(map[string]any{
			"username":   gofakeit.Username(),
			"first_name": gofakeit.FirstName(),
			"email":      gofakeit.Email(),
			"password":   "test-password",
		}).
		Expect().
		Status(http.StatusUnauthorized)
}

func TestUserListAndDetailClosedE2E(t *testing.T) {
	user := registerAndLogin(t)
	e := newExpect(t)

	e.GET("/api/v1/users").
		WithHeader("Authorization", "Bearer "+user.tokens.AccessToken).
		Expect().
		Status(http.StatusNotFound)

	e.GET("/api/v1/users/"+strconv.FormatUint(user.ID, 10)).
		WithHeader("Authorization", "Bearer "+user.tokens.AccessToken).
		Expect().
		Status(http.StatusNotFound)
}
