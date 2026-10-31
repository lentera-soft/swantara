package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/iam"
)

func TestWriteAccessError(t *testing.T) {
	app := fiber.New()
	app.Get("/probe/:kind", func(c fiber.Ctx) error {
		switch c.Params("kind") {
		case "forbidden":
			return writeAccessError(c, iam.ErrForbidden)
		case "missing":
			return writeAccessError(c, httpx.ErrMissingUserInContext)
		default:
			return writeAccessError(c, errors.New("boom"))
		}
	})

	resp, err := doIamRequest(app, http.MethodGet, "/probe/forbidden", "")
	if err != nil {
		t.Fatal(err)
	}
	helper.AssertStatus(t, resp.StatusCode, http.StatusForbidden)

	resp, err = doIamRequest(app, http.MethodGet, "/probe/missing", "")
	if err != nil {
		t.Fatal(err)
	}
	helper.AssertStatus(t, resp.StatusCode, http.StatusUnauthorized)

	resp, err = doIamRequest(app, http.MethodGet, "/probe/other", "")
	if err != nil {
		t.Fatal(err)
	}
	helper.AssertStatus(t, resp.StatusCode, http.StatusInternalServerError)
}

func doIamRequest(app *fiber.App, method, path, body string) (*http.Response, error) {
	var reader *strings.Reader
	if body == "" {
		reader = strings.NewReader("")
	} else {
		reader = strings.NewReader(body)
	}
	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	return app.Test(req)
}
