package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type AccountHandler struct {
	svc reference.AccountService
}

func NewAccountHandler(svc reference.AccountService) AccountHandler {
	return AccountHandler{svc: svc}
}

type AccountResponse struct {
	ID             uint64    `json:"id"`
	OrganizationID uint64    `json:"organization_id"`
	Code           string    `json:"code"`
	Name           string    `json:"name"`
	Type           string    `json:"type"`
	Reconcilable   bool      `json:"reconcilable"`
	CurrencyCode   *string   `json:"currency_code"`
	ParentID       *uint64   `json:"parent_id"`
	Active         bool      `json:"active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func newAccountResponse(account *reference.Account) AccountResponse {
	return AccountResponse{
		ID:             account.ID,
		OrganizationID: account.OrganizationID,
		Code:           account.Code,
		Name:           account.Name,
		Type:           account.Type,
		Reconcilable:   account.Reconcilable,
		CurrencyCode:   account.CurrencyCode,
		ParentID:       account.ParentID,
		Active:         account.Active,
		CreatedAt:      account.CreatedAt,
		UpdatedAt:      account.UpdatedAt,
	}
}

var accountQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"code":            {},
	"name":            {},
	"type":            {},
	"reconcilable":    {},
	"parent_id":       {},
	"active":          {},
	"created_at":      {},
	"updated_at":      {},
}

func boolOrTrue(value *bool) bool {
	if value == nil {
		return true
	}
	return *value
}

func writeAccountError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "account write failed", "Failed to save account.",
		httpx.Unprocessable(reference.ErrInvalidAccountType, "Account type is not valid."),
		httpx.Unprocessable(reference.ErrDuplicateAccount, "Account code already exists for the organization."),
		httpx.Unprocessable(reference.ErrInvalidParent, "Parent account does not exist for the organization."),
	)
}
