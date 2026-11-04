package contacts

import (
	"context"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ContactService struct {
	contacts      ContactDAO
	addresses     ContactAddressDAO
	customers     CustomerProfileDAO
	suppliers     SupplierProfileDAO
	banks         ContactBankAccountDAO
	employeeRoles EmployeeRoleReader
}

func NewContactService(
	contacts ContactDAO,
	addresses ContactAddressDAO,
	banks ContactBankAccountDAO,
	customers CustomerProfileDAO,
	suppliers SupplierProfileDAO,
	employeeRoles EmployeeRoleReader,
) ContactService {
	return ContactService{
		contacts:      contacts,
		addresses:     addresses,
		banks:         banks,
		customers:     customers,
		suppliers:     suppliers,
		employeeRoles: employeeRoles,
	}
}

func (s ContactService) List(ctx context.Context, q *query.Query) (*query.Page[Contact], error) {
	page, err := s.contacts.List(ctx, q)
	if err != nil {
		return nil, err
	}
	if err := s.annotateRoles(ctx, page); err != nil {
		return nil, err
	}
	return page, nil
}

func (s ContactService) Find(ctx context.Context, id uint64) (*Contact, error) {
	contact, err := s.contacts.Find(ctx, id)
	if err != nil || contact == nil {
		return contact, err
	}
	if err := s.annotateRoles(ctx, &query.Page[Contact]{Items: []*Contact{contact}, Count: 1}); err != nil {
		return nil, err
	}
	return contact, nil
}

func (s ContactService) Delete(ctx context.Context, id uint64) error {
	return s.contacts.Delete(ctx, id)
}

func (s ContactService) ListAddressesByContact(ctx context.Context, contactID uint64) ([]*ContactAddress, error) {
	return s.addresses.ListByContact(ctx, contactID)
}

func (s ContactService) FindAddress(ctx context.Context, id uint64) (*ContactAddress, error) {
	return s.addresses.Find(ctx, id)
}

func (s ContactService) CreateAddress(ctx context.Context, address *ContactAddress) (*ContactAddress, error) {
	return s.addresses.Create(ctx, address)
}

func (s ContactService) UpdateAddress(ctx context.Context, address *ContactAddress) (*ContactAddress, error) {
	return s.addresses.Update(ctx, address)
}

func (s ContactService) DeleteAddress(ctx context.Context, id uint64) error {
	return s.addresses.Delete(ctx, id)
}

func (s ContactService) ListBankAccountsByContact(ctx context.Context, contactID uint64) ([]*ContactBankAccount, error) {
	return s.banks.ListByContact(ctx, contactID)
}

func (s ContactService) FindBankAccount(ctx context.Context, id uint64) (*ContactBankAccount, error) {
	return s.banks.Find(ctx, id)
}

func (s ContactService) CreateBankAccount(ctx context.Context, account *ContactBankAccount) (*ContactBankAccount, error) {
	return s.banks.Create(ctx, account)
}

func (s ContactService) UpdateBankAccount(ctx context.Context, contactID uint64, account *ContactBankAccount) (*ContactBankAccount, error) {
	existing, err := s.banks.Find(ctx, account.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrBankAccountNotFound)
	}
	if existing == nil {
		return nil, ErrBankAccountNotFound
	}
	if contactID != 0 && existing.ContactID != contactID {
		return nil, ErrBankAccountNotForContact
	}
	existing.AccountHolder = account.AccountHolder
	existing.BankName = account.BankName
	existing.IBAN = account.IBAN
	existing.SwiftBIC = account.SwiftBIC
	existing.AccountNumber = account.AccountNumber
	existing.RoutingNumber = account.RoutingNumber
	existing.CurrencyCode = account.CurrencyCode
	return s.banks.Update(ctx, existing)
}

func (s ContactService) DeleteBankAccount(ctx context.Context, contactID, id uint64) error {
	existing, err := s.banks.Find(ctx, id)
	if err != nil {
		return dao.NotFound(err, ErrBankAccountNotFound)
	}
	if existing == nil {
		return ErrBankAccountNotFound
	}
	if contactID != 0 && existing.ContactID != contactID {
		return ErrBankAccountNotForContact
	}
	return s.banks.Delete(ctx, id)
}

func (s ContactService) Create(
	ctx context.Context,
	contact *Contact,
	addresses []*ContactAddress,
	banks []*ContactBankAccount,
	customer *CustomerProfile,
	supplier *SupplierProfile,
) (*Contact, error) {
	if err := s.validateName(contact.Name); err != nil {
		return nil, err
	}
	if err := s.validateAddresses(addresses); err != nil {
		return nil, err
	}

	return s.contacts.CreateWithDetails(ctx, contact, addresses, banks, customer, supplier)
}

func (s ContactService) Update(ctx context.Context, contactID uint64, contact *Contact) (*Contact, error) {
	existing, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return nil, dao.NotFound(err, ErrContactNotFound)
	}
	if existing == nil {
		return nil, ErrContactNotFound
	}
	if err := s.validateName(contact.Name); err != nil {
		return nil, err
	}

	existing.Name = contact.Name
	existing.DisplayName = contact.DisplayName
	existing.IsOrganization = contact.IsOrganization
	existing.ParentID = contact.ParentID
	existing.Email = contact.Email
	existing.Phone = contact.Phone
	existing.Mobile = contact.Mobile
	existing.Website = contact.Website
	existing.TaxID = contact.TaxID
	existing.Industry = contact.Industry
	existing.CurrencyCode = contact.CurrencyCode
	existing.Lang = contact.Lang
	existing.Active = contact.Active

	return s.contacts.Update(ctx, existing)
}

func (s ContactService) EnableCustomer(ctx context.Context, contactID uint64, extension *CustomerProfile) (*CustomerProfile, error) {
	existing, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return nil, dao.NotFound(err, ErrContactNotFound)
	}
	if existing == nil {
		return nil, ErrContactNotFound
	}

	record, err := s.customers.FindByContact(ctx, contactID)
	if err != nil {
		return nil, err
	}
	if record == nil {
		extension.ContactID = contactID
		if !extension.Active {
			extension.Active = true
		}
		return s.customers.Create(ctx, extension)
	}

	record.CustomerPaymentTermID = extension.CustomerPaymentTermID
	record.CreditLimit = extension.CreditLimit
	record.ReceivableAccountID = extension.ReceivableAccountID
	record.Active = true
	return s.customers.Update(ctx, record)
}

func (s ContactService) DisableCustomer(ctx context.Context, contactID uint64) error {
	record, err := s.customers.FindByContact(ctx, contactID)
	if err != nil {
		return err
	}
	if record == nil {
		return nil
	}

	record.Active = false
	if _, err := s.customers.Update(ctx, record); err != nil {
		return err
	}
	return nil
}

func (s ContactService) EnableSupplier(ctx context.Context, contactID uint64, extension *SupplierProfile) (*SupplierProfile, error) {
	existing, err := s.contacts.Find(ctx, contactID)
	if err != nil {
		return nil, dao.NotFound(err, ErrContactNotFound)
	}
	if existing == nil {
		return nil, ErrContactNotFound
	}

	record, err := s.suppliers.FindByContact(ctx, contactID)
	if err != nil {
		return nil, err
	}
	if record == nil {
		extension.ContactID = contactID
		if !extension.Active {
			extension.Active = true
		}
		return s.suppliers.Create(ctx, extension)
	}

	record.SupplierPaymentTermID = extension.SupplierPaymentTermID
	record.PayableAccountID = extension.PayableAccountID
	record.Active = true
	return s.suppliers.Update(ctx, record)
}

func (s ContactService) DisableSupplier(ctx context.Context, contactID uint64) error {
	record, err := s.suppliers.FindByContact(ctx, contactID)
	if err != nil {
		return err
	}
	if record == nil {
		return nil
	}

	record.Active = false
	if _, err := s.suppliers.Update(ctx, record); err != nil {
		return err
	}
	return nil
}

func (s ContactService) SetDefaultAddress(ctx context.Context, contactID, addressID uint64) error {
	address, err := s.addresses.Find(ctx, addressID)
	if err != nil {
		return dao.NotFound(err, ErrAddressNotFound)
	}
	if address == nil {
		return ErrAddressNotFound
	}
	if address.ContactID != contactID {
		return ErrAddressNotForContact
	}

	return s.addresses.SetDefault(ctx, contactID, addressID)
}

func (s ContactService) validateName(name string) error {
	if strings.TrimSpace(name) == "" {
		return ErrNameRequired
	}
	return nil
}

func (s ContactService) validateAddresses(addresses []*ContactAddress) error {
	seen := map[string]bool{}
	for _, address := range addresses {
		if address.Type != nil && !validAddressType(*address.Type) {
			return ErrInvalidAddressType
		}
		if address.IsDefault {
			key := ""
			if address.Type != nil {
				key = *address.Type
			}
			if seen[key] {
				return ErrMultipleDefaultAddresses
			}
			seen[key] = true
		}
	}
	return nil
}

func validAddressType(value string) bool {
	switch value {
	case AddressTypeBilling, AddressTypeShipping, AddressTypeOther:
		return true
	default:
		return false
	}
}

func (s ContactService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[Contact], error) {
	page, err := s.contacts.List(ctx, scope.ToOrg(q, organizationID))
	if err != nil {
		return nil, err
	}
	if err := s.annotateRoles(ctx, page); err != nil {
		return nil, err
	}
	return page, nil
}

func (s ContactService) FindInOrg(ctx context.Context, id, organizationID uint64) (*Contact, error) {
	e, err := s.contacts.Find(ctx, id)
	if err != nil || e == nil || !scope.Owns(e.OrganizationID, organizationID) {
		return nil, err
	}
	if err := s.annotateRoles(ctx, &query.Page[Contact]{Items: []*Contact{e}, Count: 1}); err != nil {
		return nil, err
	}
	return e, nil
}

// annotateRoles marks each contact with the active customer, supplier, and
// employee roles so callers can tell role-specific lists apart. The employee
// role lives in the payroll module and is resolved through the injected
// EmployeeRoleReader.
func (s ContactService) annotateRoles(ctx context.Context, page *query.Page[Contact]) error {
	if page == nil || len(page.Items) == 0 {
		return nil
	}

	ids := make([]uint64, 0, len(page.Items))
	for _, contact := range page.Items {
		if contact != nil {
			ids = append(ids, contact.ID)
		}
	}
	if len(ids) == 0 {
		return nil
	}

	customers, err := s.customers.List(ctx, &query.Query{Filters: []query.Filter{{
		Field:    "contact_id",
		Operator: query.In,
		Value:    ids,
	}}})
	if err != nil {
		return err
	}
	suppliers, err := s.suppliers.List(ctx, &query.Query{Filters: []query.Filter{{
		Field:    "contact_id",
		Operator: query.In,
		Value:    ids,
	}}})
	if err != nil {
		return err
	}

	customerIDs := make(map[uint64]struct{}, len(customers.Items))
	for _, profile := range customers.Items {
		if profile != nil && profile.Active {
			customerIDs[profile.ContactID] = struct{}{}
		}
	}
	supplierIDs := make(map[uint64]struct{}, len(suppliers.Items))
	for _, profile := range suppliers.Items {
		if profile != nil && profile.Active {
			supplierIDs[profile.ContactID] = struct{}{}
		}
	}

	employeeIDs := make(map[uint64]struct{})
	if s.employeeRoles != nil {
		linked, err := s.employeeRoles.ListEmployeeContactIDs(ctx, ids)
		if err != nil {
			return err
		}
		for _, contactID := range linked {
			employeeIDs[contactID] = struct{}{}
		}
	}

	for _, contact := range page.Items {
		if contact == nil {
			continue
		}
		_, contact.IsCustomer = customerIDs[contact.ID]
		_, contact.IsSupplier = supplierIDs[contact.ID]
		_, contact.IsEmployee = employeeIDs[contact.ID]
	}
	return nil
}
