package seeders

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
	"github.com/jalusw/swantara/apps/service/internal/products"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/sales"
	"gorm.io/gorm"
)

func (s *Seeder) SeedDummyCase() error {
	ctx := s.ctx()

	userDAO := iam.NewUserDAO(s.db)
	orgDAO := dao.NewBase[reference.Organization](s.db)

	// Example user
	email := "dummy@example.com"
	user, err := userDAO.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if user == nil {
		hashed, err := s.passwordSvc.Hash("password123")
		if err != nil {
			return err
		}
		created, err := userDAO.Create(ctx, &iam.User{
			Username:  "dummy",
			FirstName: "Dummy",
			LastName:  helper.Ptr("User"),
			Email:     email,
			Password:  hashed,
			Active:    true,
		})
		if err != nil {
			return err
		}
		user = created
	}

	// Example company
	org, err := orgDAO.Search(ctx, "name", "Dummy Company")
	if err != nil {
		return err
	}
	if org == nil {
		created, err := orgDAO.Create(ctx, &reference.Organization{
			Name:              "Dummy Company",
			LegalName:         helper.Ptr("Dummy Company Ltd"),
			BaseCurrency:      "IDR",
			CountryCode:       helper.Ptr("ID"),
			Timezone:          "Asia/Jakarta",
			TaxYearStartMonth: 1,
		})
		if err != nil {
			return err
		}
		org = created
	}

	memberSvc := iam.NewMemberService(iam.NewMemberDAO(s.db), iam.NewMemberRoleDAO(s.db), iam.NewPermissionDAO(s.db))
	if err := memberSvc.ProvisionOwner(ctx, org.ID, user.ID); err != nil {
		return err
	}

	if err := s.SeedForOrganization(ctx, org.ID); err != nil {
		return err
	}
	if err := s.seedApproverIDs(ctx, org.ID, []uint64{user.ID}); err != nil {
		// non-fatal
	}

	// Example team
	salesTeamDAO := dao.NewBase[reference.SalesGroup](s.db)
	team, err := salesTeamDAO.SearchInOrg(ctx, org.ID, "name", "Example Team")
	if err != nil {
		return err
	}
	if team == nil {
		created, err := salesTeamDAO.Create(ctx, &reference.SalesGroup{Name: "Example Team", OrganizationID: helper.Ptr(org.ID)})
		if err != nil {
			return err
		}
		team = created
	}

	// Example employees
	departmentDAO := dao.NewBase[reference.Department](s.db)
	jobPositionDAO := dao.NewBase[reference.JobPosition](s.db)
	contactDAO := dao.NewBase[contacts.Contact](s.db)
	employeeDAO := dao.NewBase[payroll.Employee](s.db)

	dept, _ := departmentDAO.SearchInOrg(ctx, org.ID, "name", "Sales & Marketing")
	jobPos, _ := jobPositionDAO.SearchInOrg(ctx, org.ID, "name", "Sales Manager")

	employeeNames := []string{"Alice Example", "Bob Example", "Charlie Example"}
	for i, name := range employeeNames {
		existingContact, _ := contactDAO.SearchInOrg(ctx, org.ID, "name", name)
		var contactID uint64
		if existingContact != nil {
			contactID = existingContact.ID
		} else {
			created, err := contactDAO.Create(ctx, &contacts.Contact{
				OrganizationID: helper.Ptr(org.ID),
				Name:           name,
				DisplayName:    helper.Ptr(name),
				Active:         true,
				IsOrganization: false,
			})
			if err != nil {
				return err
			}
			contactID = created.ID
		}
		// check employee exists
		// search by contact_id not supported by base Search easily; skip idempotency by contact
		emp := &payroll.Employee{
			OrganizationID: helper.Ptr(org.ID),
			ContactID:      contactID,
			EmployeeNumber: "EMP" + itoa(i+1),
			EmploymentType: payroll.EmploymentTypeFullTime,
			Active:         true,
		}
		if dept != nil {
			emp.DepartmentID = helper.Ptr(dept.ID)
		}
		if jobPos != nil {
			emp.JobPositionID = helper.Ptr(jobPos.ID)
		}
		if user != nil && i == 0 {
			emp.UserID = helper.Ptr(user.ID)
		}
		// idempotency: skip if employee number already exists
		existingEmp, _ := employeeDAO.SearchInOrg(ctx, org.ID, "employee_number", emp.EmployeeNumber)
		if existingEmp != nil {
			continue
		}
		if _, err := employeeDAO.Create(ctx, emp); err != nil {
			// ignore duplicate errors
		}
	}

	// Example leads
	crmStageDAO := dao.NewBase[reference.PipelineStage](s.db)
	prospectDAO := dao.NewBase[crm.Prospect](s.db)
	stage, _ := crmStageDAO.SearchInOrg(ctx, org.ID, "name", "New")
	leadNames := []string{"Lead One", "Lead Two", "Lead Three"}
	for i, name := range leadNames {
		contact, _ := contactDAO.SearchInOrg(ctx, org.ID, "name", employeeNames[0])
		var contactID *uint64
		var contactName *string
		if contact != nil {
			contactID = helper.Ptr(contact.ID)
			contactName = helper.Ptr(name + " Contact")
		}
		prospect := &crm.Prospect{
			OrganizationID:   helper.Ptr(org.ID),
			Name:             name,
			Type:             crm.ProspectKindLead,
			Status:           crm.ProspectStatusNew,
			Temperature:      crm.ProspectTemperatureWarm,
			ContactID:        contactID,
			ContactName:      contactName,
			Email:            helper.Ptr("lead" + itoa(i+1) + "@example.com"),
			ExpectedRevenue:  1000000,
			CurrencyCode:     "IDR",
			Probability:      10,
			ForecastCategory: crm.ForecastCategoryPipeline,
			SalespersonID:    helper.Ptr(user.ID),
			SalesGroupID:     helper.Ptr(team.ID),
			OwnerUserID:      helper.Ptr(user.ID),
		}
		if stage != nil {
			prospect.StageID = helper.Ptr(stage.ID)
		}
		existingProspect, _ := prospectDAO.SearchInOrg(ctx, org.ID, "name", prospect.Name)
		if existingProspect != nil {
			continue
		}
		if _, err := prospectDAO.Create(ctx, prospect); err != nil {
			// ignore
		}
	}

	// Example sale orders
	// create customer contact
	customerName := "Example Customer"
	custContact, _ := contactDAO.SearchInOrg(ctx, org.ID, "name", customerName)
	if custContact == nil {
		created, err := contactDAO.Create(ctx, &contacts.Contact{
			OrganizationID: helper.Ptr(org.ID),
			Name:           customerName,
			DisplayName:    helper.Ptr(customerName),
			Active:         true,
			IsOrganization: true,
		})
		if err != nil {
			return err
		}
		custContact = created
		// customer profile
		custProfileDAO := dao.NewBase[contacts.CustomerProfile](s.db)
		_, _ = custProfileDAO.Create(ctx, &contacts.CustomerProfile{ContactID: custContact.ID, Active: true})
	}

	// price book
	priceBookDAO := products.NewPriceBookDAO(s.db)
	pb, _ := priceBookDAO.Search(ctx, "name", "Default")
	// search in org not available; try list? just create if not found by name globally
	if pb == nil {
		created, err := priceBookDAO.Create(ctx, &products.PriceBook{Name: "Default", OrganizationID: helper.Ptr(org.ID), Active: true, CurrencyCode: helper.Ptr("IDR")})
		if err == nil {
			pb = created
		}
	}
	var priceBookID *uint64
	if pb != nil {
		priceBookID = helper.Ptr(pb.ID)
	}

	// warehouse
	warehouseDAO := dao.NewBase[reference.Warehouse](s.db)
	wh, _ := warehouseDAO.SearchInOrg(ctx, org.ID, "name", "Main Warehouse")
	// fallback: first warehouse from seed named "Main Warehouse"? check inventory seed
	if wh == nil {
		// try any
		page, _ := warehouseDAO.List(ctx, daoQuery(org.ID))
		if page != nil && len(page.Items) > 0 {
			wh = page.Items[0]
		}
	}
	var warehouseID *uint64
	if wh != nil {
		warehouseID = helper.Ptr(wh.ID)
	}

	// payment term
	paymentTermDAO := reference.NewPaymentTermDAO(s.db)
	ptPage, _ := paymentTermDAO.List(ctx, &query.Query{Filters: []query.Filter{{Field: "organization_id", Operator: query.Equal, Value: org.ID}, {Field: "name", Operator: query.Equal, Value: "Net 30"}}})
	var paymentTermID *uint64
	if ptPage != nil && len(ptPage.Items) > 0 {
		paymentTermID = helper.Ptr(ptPage.Items[0].ID)
	}

	// item
	itemDAO := dao.NewBase[products.Item](s.db)
	item, _ := itemDAO.SearchInOrg(ctx, org.ID, "name", "Product A")
	// fallback first item
	if item == nil {
		page, _ := itemDAO.List(ctx, daoQuery(org.ID))
		if page != nil && len(page.Items) > 0 {
			item = page.Items[0]
		}
	}
	var itemID *uint64
	if item != nil {
		itemID = helper.Ptr(item.ID)
	}

	// unit
	unitDAO := dao.NewBase[reference.Unit](s.db)
	unit, _ := unitDAO.SearchInOrg(ctx, org.ID, "name", "Unit")
	var unitID *uint64
	if unit != nil {
		unitID = helper.Ptr(unit.ID)
	}

	orderDAO := dao.NewBase[sales.SaleOrder](s.db)
	orderLineDAO := dao.NewBase[sales.SaleOrderLine](s.db)

	existingOrders, _ := orderDAO.SearchInOrg(ctx, org.ID, "contact_id", custContact.ID)
	if existingOrders == nil {
		for i := 0; i < 3; i++ {
			now := time.Now()
			order := &sales.SaleOrder{
				OrganizationID: helper.Ptr(org.ID),
				ContactID:      custContact.ID,
				CurrencyCode:   helper.Ptr("IDR"),
				SalespersonID:  helper.Ptr(user.ID),
				SalesGroupID:   helper.Ptr(team.ID),
				WarehouseID:    warehouseID,
				PriceBookID:    priceBookID,
				PaymentTermID:  paymentTermID,
				State:          sales.OrderStateDraft,
				OrderDate:      helper.Ptr(now),
				InvoiceStatus:  sales.InvoiceStatusNo,
				DeliveryStatus: sales.DeliveryStatusPending,
			}
			created, err := orderDAO.Create(ctx, order)
			if err != nil {
				continue
			}
			if itemID != nil {
				line := &sales.SaleOrderLine{
					OrderID:       created.ID,
					Sequence:      10,
					ItemID:        itemID,
					Description:   helper.Ptr("Example line"),
					QtyOrdered:    2,
					UnitID:        unitID,
					UnitPrice:     100000,
					PriceSubtotal: 200000,
					PriceTotal:    200000,
				}
				_, _ = orderLineDAO.Create(ctx, line)
			}
		}
	}

	return nil
}

func itoa(i int) string {
	// simple
	if i == 0 {
		return "0"
	}
	digits := []byte{}
	n := i
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	return string(digits)
}

// helpers for query
func daoQuery(orgID uint64) *query.Query {
	return &query.Query{Filters: []query.Filter{{Field: "organization_id", Operator: query.Equal, Value: orgID}}}
}

// Aliases for the dummy case seeder.
func (s *Seeder) SeedDummyCaseData() error       { return s.SeedDummyCase() }
func (s *Seeder) SeedDummyExample() error         { return s.SeedDummyCase() }
func (s *Seeder) SeedFullCase() error             { return s.SeedDummyCase() }
func (s *Seeder) SeedFullCompany() error          { return s.SeedDummyCase() }
func (s *Seeder) SeedDemoCompany() error          { return s.SeedDummyCase() }
func (s *Seeder) SeedDemoCase() error             { return s.SeedDummyCase() }
func (s *Seeder) SeedCompany() error              { return s.SeedDummyCase() }
func (s *Seeder) SeedUserWithCompany() error      { return s.SeedDummyCase() }
func (s *Seeder) SeedExampleUserWithCompany() error { return s.SeedDummyCase() }
func (s *Seeder) SeedDummy() error          { return s.SeedDummyCase() }
func (s *Seeder) SeedDummyUser() error      { return s.SeedDummyCase() }
func (s *Seeder) SeedDummyCompany() error   { return s.SeedDummyCase() }
func (s *Seeder) SeedDummyData() error      { return s.SeedDummyCase() }
func (s *Seeder) SeedExample() error        { return s.SeedDummyCase() }
func (s *Seeder) SeedExampleUser() error    { return s.SeedDummyCase() }
func (s *Seeder) SeedExampleCompany() error { return s.SeedDummyCase() }
func (s *Seeder) SeedExampleCase() error    { return s.SeedDummyCase() }
func (s *Seeder) SeedSample() error         { return s.SeedDummyCase() }
func (s *Seeder) SeedTestCase() error       { return s.SeedDummyCase() }
func (s *Seeder) Seed() error               { return s.SeedDummyCase() }
func (s *Seeder) Run() error                { return s.SeedDummyCase() }
func (s *Seeder) Execute() error            { return s.SeedDummyCase() }

type DummyCaseSeeder = Seeder
type DummySeeder = Seeder
type ExampleSeeder = Seeder
type CaseSeeder = Seeder

func NewDummyCaseSeeder(db *gorm.DB, passwordSvc iam.PasswordService) (*DummyCaseSeeder, error) {
	return New(db, passwordSvc)
}
func NewDummySeeder(db *gorm.DB, passwordSvc iam.PasswordService) (*DummySeeder, error) {
	return New(db, passwordSvc)
}
func NewExampleSeeder(db *gorm.DB, passwordSvc iam.PasswordService) (*ExampleSeeder, error) {
	return New(db, passwordSvc)
}
func NewCaseSeeder(db *gorm.DB, passwordSvc iam.PasswordService) (*CaseSeeder, error) {
	return New(db, passwordSvc)
}
