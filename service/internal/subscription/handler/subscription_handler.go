package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/subscription"
)

type SubscriptionHandler struct {
	svc subscription.SubscriptionService
}

func NewSubscriptionHandler(svc subscription.SubscriptionService) SubscriptionHandler {
	return SubscriptionHandler{svc: svc}
}

type SubscriptionLineResponse struct {
	ID          uint64  `json:"id"`
	ItemID      *uint64 `json:"item_id"`
	Qty         float64 `json:"qty"`
	UnitPrice   float64 `json:"unit_price"`
	DiscountPct float64 `json:"discount_pct"`
}

type SubscriptionResponse struct {
	ID              uint64                     `json:"id"`
	OrganizationID  *uint64                    `json:"organization_id"`
	Name            string                     `json:"name"`
	ContactID       *uint64                    `json:"contact_id"`
	PlanID          *uint64                    `json:"plan_id"`
	PriceBookID     *uint64                    `json:"price_book_id"`
	CurrencyCode    *string                    `json:"currency_code"`
	DateStart       *time.Time                 `json:"date_start"`
	NextInvoiceDate *time.Time                 `json:"next_invoice_date"`
	DateEnd         *time.Time                 `json:"date_end"`
	State           string                     `json:"state"`
	MRR             float64                    `json:"mrr"`
	Lines           []SubscriptionLineResponse `json:"lines,omitempty"`
}

func newSubscriptionResponse(s *subscription.Subscription, lines []*subscription.SubscriptionLine) SubscriptionResponse {
	response := SubscriptionResponse{
		ID:              s.ID,
		OrganizationID:  s.OrganizationID,
		Name:            s.Name,
		ContactID:       s.ContactID,
		PlanID:          s.PlanID,
		PriceBookID:     s.PriceBookID,
		CurrencyCode:    s.CurrencyCode,
		DateStart:       s.DateStart,
		NextInvoiceDate: s.NextInvoiceDate,
		DateEnd:         s.DateEnd,
		State:           s.State,
		MRR:             s.MRR,
	}
	for _, line := range lines {
		response.Lines = append(response.Lines, SubscriptionLineResponse{
			ID:          line.ID,
			ItemID:      line.ItemID,
			Qty:         line.Qty,
			UnitPrice:   line.UnitPrice,
			DiscountPct: line.DiscountPct,
		})
	}
	return response
}

func writeSubscriptionError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "subscription write failed", "Failed to save subscription.",
		httpx.NotFound(subscription.ErrSubscriptionNotFound, "Subscription not found."),
		httpx.Conflict(subscription.ErrSubscriptionAlreadyInvoiced, "A subscription invoice was already generated for this period."),
		httpx.Conflict(subscription.ErrSubscriptionState, "Subscription state is invalid for this operation."),
		httpx.Unprocessable(subscription.ErrSubscriptionNoLines, "Subscription must have at least one line."),
		httpx.Unprocessable(subscription.ErrSubscriptionNoPlan, "Subscription plan is required."),
		httpx.Unprocessable(subscription.ErrSubscriptionPlanNotFound, "Subscription plan does not exist."),
		httpx.Unprocessable(subscription.ErrSubscriptionPlanOrganization, "Subscription plan does not belong to this organization."),
		httpx.Unprocessable(subscription.ErrSubscriptionLineProduct, "Subscription line item is required."),
		httpx.Unprocessable(subscription.ErrSubscriptionLineProductOrganization, "Subscription line item does not belong to this organization."),
		httpx.Unprocessable(subscription.ErrSubscriptionLineQty, "Subscription line quantity must be greater than zero."),
		httpx.Unprocessable(subscription.ErrSubscriptionLinePrice, "Subscription line unit price must not be negative."),
		httpx.Unprocessable(subscription.ErrSubscriptionLineDiscount, "Subscription line discount must be between 0 and 100."),
		httpx.Unprocessable(subscription.ErrSubscriptionContact, "Subscription contact is required."),
		httpx.Unprocessable(subscription.ErrSubscriptionContactOrganization, "Subscription contact does not belong to this organization."),
		httpx.Unprocessable(subscription.ErrSubscriptionCurrency, "Subscription currency is required."),
		httpx.Unprocessable(subscription.ErrSubscriptionPriceBook, "Subscription price_book is required."),
		httpx.Unprocessable(subscription.ErrSubscriptionPriceBookOrganization, "Subscription price_book does not belong to this organization."),
	)
}
