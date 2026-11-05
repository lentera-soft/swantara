package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type UpdateContactRequest struct {
	OrganizationID *uint64                      `json:"organization_id"`
	Name           string                       `json:"name" validate:"required"`
	DisplayName    *string                      `json:"display_name"`
	IsOrganization bool                         `json:"is_organization"`
	ParentID       *uint64                      `json:"parent_id"`
	Email          *string                      `json:"email" validate:"omitempty,email"`
	Phone          *string                      `json:"phone"`
	Mobile         *string                      `json:"mobile"`
	Website        *string                      `json:"website"`
	TaxID          *string                      `json:"tax_id"`
	Industry       *string                      `json:"industry"`
	CurrencyCode   *string                      `json:"currency_code"`
	Lang           string                       `json:"lang"`
	Active         bool                         `json:"active"`
	Addresses      *[]ContactAddressRequest     `json:"addresses"`
	BankAccounts   *[]ContactBankAccountRequest `json:"bank_accounts"`
	Customer       *CustomerProfileRequest      `json:"customer"`
	Supplier       *SupplierProfileRequest      `json:"supplier"`
}

type UpdateContactResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateContactResponse `json:"data"`
}
type UpdateContactResponse struct {
	Contact ContactResponse `json:"contact"`
}

// @Summary Update contact
// @Description Updates a contact's base identity fields after enforcing tenant ownership, returning 404 when the contact is missing or not owned by the caller's organization. A non-empty name is required. When addresses, bank_accounts, customer, or supplier are present they are replaced or upserted atomically with the contact; omitted sections are left unchanged. The updated contact is returned with HATEOAS links.
// @Tags Contacts
// @Accept json
// @Produce json
// @Param id path integer true "Contact ID"
// @Param body body UpdateContactRequest true "Contact details"
// @Success 200 {object} UpdateContactResponseEnvelope "Contact updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 403 {object} httpx.ErrorResponse "Forbidden"
// @Failure 404 {object} httpx.ErrorResponse "Contact not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/contacts/{id} [put]
func (h ContactHandler) Update(c fiber.Ctx) error {
	contactID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid contact id provided.", nil)
	}

	var request UpdateContactRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	existing, err := h.svc.FindInOrg(c, contactID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Contact not found.")
		}
		httpx.RequestLog(c).Error("contact lookup failed", "contact_id", contactID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update contact.", err)
	}
	if existing == nil {
		return httpx.CreateNotFoundResponse(c, "Contact not found.")
	}

	base := &contacts.Contact{
		OrganizationID: httpx.TenantOrganizationID(c, existing.OrganizationID),
		Name:           request.Name,
		DisplayName:    request.DisplayName,
		IsOrganization: request.IsOrganization,
		ParentID:       request.ParentID,
		Email:          request.Email,
		Phone:          request.Phone,
		Mobile:         request.Mobile,
		Website:        request.Website,
		TaxID:          request.TaxID,
		Industry:       request.Industry,
		CurrencyCode:   request.CurrencyCode,
		Lang:           request.Lang,
		Active:         request.Active,
	}

	contact := base
	if request.Addresses != nil || request.BankAccounts != nil || request.Customer != nil || request.Supplier != nil {
		var addresses []*contacts.ContactAddress
		var banks []*contacts.ContactBankAccount
		if request.Addresses != nil {
			addresses = make([]*contacts.ContactAddress, len(*request.Addresses))
			for i, address := range *request.Addresses {
				addresses[i] = &contacts.ContactAddress{
					Type:        address.Type,
					Line1:       address.Line1,
					Line2:       address.Line2,
					City:        address.City,
					State:       address.State,
					PostalCode:  address.PostalCode,
					CountryCode: address.CountryCode,
					IsDefault:   address.IsDefault,
				}
			}
		}
		if request.BankAccounts != nil {
			banks = make([]*contacts.ContactBankAccount, len(*request.BankAccounts))
			for i, bank := range *request.BankAccounts {
				banks[i] = &contacts.ContactBankAccount{
					AccountHolder: bank.AccountHolder,
					BankName:      bank.BankName,
					IBAN:          bank.IBAN,
					SwiftBIC:      bank.SwiftBIC,
					AccountNumber: bank.AccountNumber,
					RoutingNumber: bank.RoutingNumber,
					CurrencyCode:  bank.CurrencyCode,
				}
			}
		}
		var customer *contacts.CustomerProfile
		if request.Customer != nil {
			customer = &contacts.CustomerProfile{
				CustomerPaymentTermID: request.Customer.CustomerPaymentTermID,
				CreditLimit:           request.Customer.CreditLimit,
				ReceivableAccountID:   request.Customer.ReceivableAccountID,
				Active:                request.Customer.Active,
			}
		}
		var supplier *contacts.SupplierProfile
		if request.Supplier != nil {
			supplier = &contacts.SupplierProfile{
				SupplierPaymentTermID: request.Supplier.SupplierPaymentTermID,
				PayableAccountID:      request.Supplier.PayableAccountID,
				Active:                request.Supplier.Active,
			}
		}
		contact, err = h.svc.UpdateWithDetails(c, contactID, base, addresses, banks, customer, supplier)
	} else {
		contact, err = h.svc.Update(c, contactID, base)
	}
	if err != nil {
		return writeContactError(c, err)
	}

	return httpx.CreateSuccessResponseWithLinks(c, "Contact updated successfully.", UpdateContactResponse{
		Contact: newContactResponse(contact),
	}, buildContactLinks(c, contact.ID))
}
