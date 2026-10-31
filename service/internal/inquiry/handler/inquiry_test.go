package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/inquiry"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

func inquiryHandlerTest(t *testing.T, inquiryDAO inquiry.ContactInquiryDAO) *fiber.App {
	t.Helper()
	app := fiber.New()
	handler := NewContactInquiryHandler(inquiry.NewContactInquiryService(inquiryDAO))
	handler.RegisterPublic(app)
	return app
}

func doInquiryRequest(t *testing.T, app *fiber.App, body string) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/contact-inquiries/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func TestContactInquiryHandlerCreate(t *testing.T) {
	tests := []struct {
		name   string
		dao    inquiry.ContactInquiryDAO
		body   string
		want   int
		wantID uint64
	}{
		{
			name: "stores a valid inquiry",
			dao: dao.CRUDMock[inquiry.ContactInquiry]{
				CreateFunc: func(_ context.Context, entity *inquiry.ContactInquiry) (*inquiry.ContactInquiry, error) {
					entity.ID = 42
					return entity, nil
				},
			},
			body:   `{"name":"Ada","email":"ada@example.com","company":"Acme","message":"Hello"}`,
			want:   http.StatusCreated,
			wantID: 42,
		},
		{
			name: "rejects a missing name",
			dao:  dao.CRUDMock[inquiry.ContactInquiry]{},
			body: `{"email":"ada@example.com","message":"Hello"}`,
			want: http.StatusUnprocessableEntity,
		},
		{
			name: "rejects an invalid email",
			dao:  dao.CRUDMock[inquiry.ContactInquiry]{},
			body: `{"name":"Ada","email":"not-an-email","message":"Hello"}`,
			want: http.StatusUnprocessableEntity,
		},
		{
			name: "returns a server error when storage fails",
			dao: dao.CRUDMock[inquiry.ContactInquiry]{
				CreateFunc: func(_ context.Context, _ *inquiry.ContactInquiry) (*inquiry.ContactInquiry, error) {
					return nil, errors.New("db down")
				},
			},
			body: `{"name":"Ada","email":"ada@example.com","message":"Hello"}`,
			want: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := inquiryHandlerTest(t, tt.dao)
			resp := doInquiryRequest(t, app, tt.body)
			defer resp.Body.Close()

			if resp.StatusCode != tt.want {
				body, _ := io.ReadAll(resp.Body)
				t.Fatalf("status = %d, want %d: %s", resp.StatusCode, tt.want, body)
			}
			if tt.wantID == 0 {
				return
			}

			var payload struct {
				Data struct {
					Inquiry struct {
						ID uint64 `json:"id"`
					} `json:"inquiry"`
				} `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
				t.Fatal(err)
			}
			if payload.Data.Inquiry.ID != tt.wantID {
				t.Fatalf("inquiry id = %d, want %d", payload.Data.Inquiry.ID, tt.wantID)
			}
		})
	}
}
