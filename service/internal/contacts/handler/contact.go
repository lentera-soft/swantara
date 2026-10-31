package handler

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type ContactHandler struct {
	svc contacts.ContactService
}

func NewContactHandler(svc contacts.ContactService) ContactHandler {
	return ContactHandler{svc: svc}
}

func (h ContactHandler) findContact(c fiber.Ctx) (*contacts.Contact, bool) {
	contactID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		_ = httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid contact id provided.", nil)
		return nil, false
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		_ = httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
		return nil, false
	}

	contact, err := h.svc.FindInOrg(c, contactID, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("contact lookup failed", "contact_id", contactID, "error", err)
		_ = httpx.CreateInternalServerErrorResponse(c, "Failed to get contact.", err)
		return nil, false
	}
	if contact == nil {
		_ = httpx.CreateNotFoundResponse(c, "Contact not found.")
		return nil, false
	}
	return contact, true
}

func writeContactError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "contact write failed", "Failed to save contact.",
		httpx.NotFound(contacts.ErrContactNotFound, "Contact not found."),
		httpx.Unprocessable(contacts.ErrNameRequired, "Contact name is required."),
		httpx.Unprocessable(contacts.ErrInvalidAddressType, "Address type must be one of billing, shipping, other."),
		httpx.Unprocessable(contacts.ErrMultipleDefaultAddresses, "Only one default address is allowed per contact."),
		httpx.NotFound(contacts.ErrBankAccountNotFound, "Bank account not found."),
		httpx.NotFound(contacts.ErrBankAccountNotForContact, "Bank account does not belong to the specified contact."),
	)
}

func buildContactLinks(c fiber.Ctx, contactID uint64) []httpx.Link {
	base := fmt.Sprintf("%s/contacts/%d", httpx.LinkBaseFor(c), contactID)
	return []httpx.Link{
		{Rel: "self", Method: fiber.MethodGet, Href: base},
		{Rel: "update", Method: fiber.MethodPut, Href: base},
		{Rel: "delete", Method: fiber.MethodDelete, Href: base},
	}
}
