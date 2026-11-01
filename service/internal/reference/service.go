package reference

import (
	"context"
	"math"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
)

type orgCRUD[T any] struct {
	base     dao.Base[T]
	owns     func(*T, uint64) bool
	notFound error
}

func newOrgCRUD[T any](base dao.Base[T], owns func(*T, uint64) bool, notFound error) orgCRUD[T] {
	return orgCRUD[T]{base: base, owns: owns, notFound: notFound}
}

func (s orgCRUD[T]) List(ctx context.Context, q *query.Query) (*query.Page[T], error) {
	return s.base.List(ctx, q)
}

func (s orgCRUD[T]) Find(ctx context.Context, id uint64) (*T, error) {
	entity, err := s.base.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, s.notFound)
	}
	return entity, nil
}

func (s orgCRUD[T]) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[T], error) {
	return s.base.List(ctx, scope.ToOrg(q, organizationID))
}

func (s orgCRUD[T]) FindInOrg(ctx context.Context, id, organizationID uint64) (*T, error) {
	entity, err := s.base.Find(ctx, id)
	if err != nil {
		return nil, dao.NotFound(err, s.notFound)
	}
	if entity == nil || !s.owns(entity, organizationID) {
		return nil, nil
	}
	return entity, nil
}

func (s orgCRUD[T]) Delete(ctx context.Context, organizationID, id uint64) error {
	entity, err := s.base.Find(ctx, id)
	if err != nil {
		return dao.NotFound(err, s.notFound)
	}
	if entity == nil || !s.owns(entity, organizationID) {
		return s.notFound
	}
	return s.base.Delete(ctx, id)
}

type FxRateService struct {
	orgCRUD[FxRate]
	currencies dao.Base[Currency]
}

func NewFxRateService(rates dao.Base[FxRate], currencies dao.Base[Currency]) FxRateService {
	return FxRateService{
		orgCRUD:    newOrgCRUD(rates, func(rate *FxRate, organizationID uint64) bool { return scope.Owns(rate.OrganizationID, organizationID) }, ErrRateNotFound),
		currencies: currencies,
	}
}

func (s FxRateService) ListCurrencies(ctx context.Context, q *query.Query) (*query.Page[Currency], error) {
	return s.currencies.List(ctx, q)
}

func (s FxRateService) SearchCurrency(ctx context.Context, field string, value any) (*Currency, error) {
	return s.currencies.Search(ctx, field, value)
}

func (s FxRateService) Create(ctx context.Context, rate *FxRate) (*FxRate, error) {
	if rate.Rate <= 0 {
		return nil, amount.ErrInvalidRate
	}
	if rate.RateType == "" {
		rate.RateType = string(amount.RateSpot)
	}
	if !validRateType(rate.RateType) {
		return nil, amount.ErrInvalidRate
	}
	if rate.ValidFrom.IsZero() {
		return nil, ErrRateValidFromMissing
	}

	if err := s.validateCurrency(ctx, rate.CurrencyCode); err != nil {
		return nil, err
	}

	return s.base.Create(ctx, rate)
}

func (s FxRateService) Update(ctx context.Context, rate *FxRate) (*FxRate, error) {
	if rate.Rate <= 0 {
		return nil, amount.ErrInvalidRate
	}
	if rate.RateType == "" {
		rate.RateType = string(amount.RateSpot)
	}
	if !validRateType(rate.RateType) {
		return nil, amount.ErrInvalidRate
	}
	if rate.ValidFrom.IsZero() {
		return nil, ErrRateValidFromMissing
	}

	if err := s.validateCurrency(ctx, rate.CurrencyCode); err != nil {
		return nil, err
	}

	return s.base.Update(ctx, rate)
}

func (s FxRateService) validateCurrency(ctx context.Context, code string) error {
	currency, err := s.currencies.Search(ctx, "code", code)
	if err != nil {
		return dao.NotFound(err, ErrCurrencyNotFound)
	}
	if currency == nil {
		return ErrCurrencyNotFound
	}
	return nil
}

func validRateType(value string) bool {
	switch amount.RateType(value) {
	case amount.RateSpot, amount.RateAverage, amount.RateClosing:
		return true
	default:
		return false
	}
}

type CountryService struct {
	countries dao.Base[Country]
}

func NewCountryService(countries dao.Base[Country]) CountryService {
	return CountryService{countries: countries}
}

func (s CountryService) ListCountries(ctx context.Context, q *query.Query) (*query.Page[Country], error) {
	return s.countries.List(ctx, q)
}

func (s CountryService) SearchCountry(ctx context.Context, field string, value any) (*Country, error) {
	return s.countries.Search(ctx, field, value)
}

func (s CountryService) FindCountry(ctx context.Context, id uint64) (*Country, error) {
	return s.countries.Find(ctx, id)
}

type UnitService struct {
	categories orgCRUD[UnitGroup]
	units      orgCRUD[Unit]
}

func NewUnitService(categories dao.Base[UnitGroup], units dao.Base[Unit]) UnitService {
	return UnitService{
		categories: newOrgCRUD(categories, func(category *UnitGroup, organizationID uint64) bool {
			return scope.Owns(category.OrganizationID, organizationID)
		}, ErrUnitGroupNotFound),
		units: newOrgCRUD(units, func(unit *Unit, organizationID uint64) bool {
			return scope.Owns(unit.OrganizationID, organizationID)
		}, ErrUnitNotFound),
	}
}

func (s UnitService) ListUnits(ctx context.Context, q *query.Query, organizationIDs ...uint64) (*query.Page[Unit], error) {
	if len(organizationIDs) > 0 && organizationIDs[0] != 0 {
		return s.units.ListInOrg(ctx, q, organizationIDs[0])
	}
	return s.units.base.List(ctx, q)
}

func (s UnitService) FindUnit(ctx context.Context, id uint64, organizationIDs ...uint64) (*Unit, error) {
	if len(organizationIDs) > 0 && organizationIDs[0] != 0 {
		return s.units.FindInOrg(ctx, id, organizationIDs[0])
	}
	return s.units.base.Find(ctx, id)
}

func (s UnitService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[Unit], error) {
	return s.units.ListInOrg(ctx, q, organizationID)
}

func (s UnitService) FindInOrg(ctx context.Context, id, organizationID uint64) (*Unit, error) {
	return s.units.FindInOrg(ctx, id, organizationID)
}

func (s UnitService) DeleteUnit(ctx context.Context, args ...uint64) error {
	if len(args) == 0 {
		return nil
	}
	id := args[len(args)-1]
	orgID := uint64(0)
	if len(args) > 1 {
		orgID = args[0]
	}
	if orgID != 0 {
		return s.units.Delete(ctx, orgID, id)
	}
	return s.units.base.Delete(ctx, id)
}

func (s UnitService) Delete(ctx context.Context, organizationID, id uint64) error {
	return s.units.Delete(ctx, organizationID, id)
}

func (s UnitService) ListCategories(ctx context.Context, q *query.Query, organizationIDs ...uint64) (*query.Page[UnitGroup], error) {
	if len(organizationIDs) > 0 && organizationIDs[0] != 0 {
		return s.categories.ListInOrg(ctx, q, organizationIDs[0])
	}
	return s.categories.base.List(ctx, q)
}

func (s UnitService) FindCategory(ctx context.Context, id uint64, organizationIDs ...uint64) (*UnitGroup, error) {
	if len(organizationIDs) > 0 && organizationIDs[0] != 0 {
		return s.categories.FindInOrg(ctx, id, organizationIDs[0])
	}
	return s.categories.base.Find(ctx, id)
}

func (s UnitService) ListCategoriesInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[UnitGroup], error) {
	return s.categories.ListInOrg(ctx, q, organizationID)
}

func (s UnitService) FindCategoryInOrg(ctx context.Context, id, organizationID uint64) (*UnitGroup, error) {
	return s.categories.FindInOrg(ctx, id, organizationID)
}

func (s UnitService) DeleteCategory(ctx context.Context, args ...uint64) error {
	if len(args) == 0 {
		return nil
	}
	id := args[len(args)-1]
	orgID := uint64(0)
	if len(args) > 1 {
		orgID = args[0]
	}
	if orgID != 0 {
		return s.categories.Delete(ctx, orgID, id)
	}
	return s.categories.base.Delete(ctx, id)
}

func (s UnitService) CreateCategory(ctx context.Context, category *UnitGroup) (*UnitGroup, error) {
	return s.categories.base.Create(ctx, category)
}

func (s UnitService) UpdateCategory(ctx context.Context, category *UnitGroup) (*UnitGroup, error) {
	return s.categories.base.Update(ctx, category)
}

func (s UnitService) CreateUnit(ctx context.Context, unit *Unit) (*Unit, error) {
	if err := s.validateUnit(ctx, unit, 0); err != nil {
		return nil, err
	}
	return s.units.base.Create(ctx, unit)
}

func (s UnitService) UpdateUnit(ctx context.Context, unit *Unit) (*Unit, error) {
	if err := s.validateUnit(ctx, unit, unit.ID); err != nil {
		return nil, err
	}
	return s.units.base.Update(ctx, unit)
}

func (s UnitService) validateUnit(ctx context.Context, unit *Unit, excludeID uint64) error {
	if unit.Factor <= 0 {
		return ErrInvalidFactor
	}

	category, err := s.categories.base.Find(ctx, unit.CategoryID)
	if err != nil {
		return dao.NotFound(err, ErrUnitGroupNotFound)
	}
	if category == nil {
		return ErrUnitGroupNotFound
	}
	if category.OrganizationID != nil && unit.OrganizationID != nil && *category.OrganizationID != *unit.OrganizationID {
		return ErrUnitGroupNotFound
	}

	existing, err := s.units.base.Search(ctx, "name", unit.Name)
	if err != nil {
		return err
	}
	if existing != nil && existing.ID != excludeID && existing.CategoryID == unit.CategoryID && sameOrganization(existing.OrganizationID, unit.OrganizationID) {
		return ErrUnitNameTaken
	}
	return nil
}

func (s UnitService) Convert(ctx context.Context, qty amount.Amount, fromID, toID uint64) (amount.Amount, error) {
	from, err := s.units.base.Find(ctx, fromID)
	if err != nil {
		return amount.Amount{}, dao.NotFound(err, ErrUnitNotFound)
	}
	if from == nil {
		return amount.Amount{}, ErrUnitNotFound
	}

	to, err := s.units.base.Find(ctx, toID)
	if err != nil {
		return amount.Amount{}, dao.NotFound(err, ErrUnitNotFound)
	}
	if to == nil {
		return amount.Amount{}, ErrUnitNotFound
	}

	if from.CategoryID != to.CategoryID {
		return amount.Amount{}, ErrUnitGroupMismatch
	}
	if from.Factor <= 0 || to.Factor <= 0 {
		return amount.Amount{}, ErrInvalidFactor
	}

	base := qty.Mul(amount.FromFloat64(from.Factor))
	converted, err := base.Div(amount.FromFloat64(to.Factor))
	if err != nil {
		return amount.Amount{}, err
	}
	return converted.Round(helper.DecimalPlaces(to.Rounding)), nil
}

type PaymentTermService struct {
	terms PaymentTermDAO
}

func NewPaymentTermService(terms PaymentTermDAO) PaymentTermService {
	return PaymentTermService{terms: terms}
}

func (s PaymentTermService) List(ctx context.Context, q *query.Query) (*query.Page[PaymentTerm], error) {
	return s.terms.List(ctx, q)
}

func (s PaymentTermService) Find(ctx context.Context, id uint64) (*PaymentTerm, error) {
	return s.terms.Find(ctx, id)
}

func (s PaymentTermService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[PaymentTerm], error) {
	return s.terms.List(ctx, scope.ToOrg(q, organizationID))
}

func (s PaymentTermService) FindInOrg(ctx context.Context, id, organizationID uint64) (*PaymentTerm, error) {
	term, err := s.terms.Find(ctx, id)
	if err != nil || term == nil || !scope.OwnsValue(term.OrganizationID, organizationID) {
		return nil, err
	}
	return term, nil
}

func (s PaymentTermService) ListLines(ctx context.Context, termID uint64) ([]*PaymentTermLine, error) {
	return s.terms.ListLines(ctx, termID)
}

func (s PaymentTermService) Create(ctx context.Context, term *PaymentTerm, lines []*PaymentTermLine) (*PaymentTerm, error) {
	if err := validateTermLines(lines); err != nil {
		return nil, err
	}
	if term.OrganizationID == 0 {
		return nil, ErrTermOrganizationRequired
	}
	if err := s.validateUniqueName(ctx, 0, term.OrganizationID, term.Name); err != nil {
		return nil, err
	}

	created, err := s.terms.Create(ctx, term)
	if err != nil {
		return nil, err
	}
	if err := s.terms.ReplaceLines(ctx, created.ID, lines); err != nil {
		return nil, err
	}
	return created, nil
}

func (s PaymentTermService) Update(ctx context.Context, termID uint64, term *PaymentTerm, lines []*PaymentTermLine) (*PaymentTerm, error) {
	if err := validateTermLines(lines); err != nil {
		return nil, err
	}

	existing, err := s.terms.Find(ctx, termID)
	if err != nil {
		return nil, dao.NotFound(err, ErrTermNotFound)
	}
	if existing == nil {
		return nil, ErrTermNotFound
	}
	if term.OrganizationID != 0 && existing.OrganizationID != term.OrganizationID {
		return nil, ErrTermOrganizationMismatch
	}
	if err := s.validateUniqueName(ctx, termID, existing.OrganizationID, term.Name); err != nil {
		return nil, err
	}

	existing.Name = term.Name
	existing.Note = term.Note
	existing.Code = term.Code
	existing.IsActive = term.IsActive
	existing.TemplateKey = term.TemplateKey

	updated, err := s.terms.Update(ctx, existing)
	if err != nil {
		return nil, err
	}
	if err := s.terms.ReplaceLines(ctx, termID, lines); err != nil {
		return nil, err
	}
	return updated, nil
}

func (s PaymentTermService) validateUniqueName(ctx context.Context, excludeID uint64, organizationID uint64, name string) error {
	page, err := s.terms.List(ctx, &query.Query{Filters: []query.Filter{
		{Field: "organization_id", Operator: query.Equal, Value: organizationID},
		{Field: "name", Operator: query.Equal, Value: name},
	}})
	if err != nil {
		return err
	}
	for _, item := range page.Items {
		if item.ID != excludeID {
			return ErrDuplicateTermName
		}
	}
	return nil
}

func (s PaymentTermService) ValidateTermInOrganization(ctx context.Context, termID uint64, organizationID uint64) error {
	term, err := s.terms.Find(ctx, termID)
	if err != nil {
		return dao.NotFound(err, ErrPaymentTermNotInOrg)
	}
	if term == nil || term.OrganizationID != organizationID {
		return ErrPaymentTermNotInOrg
	}
	return nil
}

func (s PaymentTermService) Delete(ctx context.Context, organizationID, termID uint64) error {
	term, err := s.terms.Find(ctx, termID)
	if err != nil {
		return dao.NotFound(err, ErrTermNotFound)
	}
	if term == nil || term.OrganizationID != organizationID {
		return ErrTermNotFound
	}
	return s.terms.DeleteWithLines(ctx, termID)
}

func (s PaymentTermService) Splits(ctx context.Context, termID uint64, total amount.Amount, date time.Time) ([]PaymentSplit, error) {
	term, err := s.terms.Find(ctx, termID)
	if err != nil {
		return nil, dao.NotFound(err, ErrTermNotFound)
	}
	if term == nil {
		return nil, ErrTermNotFound
	}

	lines, err := s.terms.ListLines(ctx, termID)
	if err != nil {
		return nil, err
	}
	if err := validateTermLines(lines); err != nil {
		return nil, err
	}

	splits := make([]PaymentSplit, 0, len(lines))
	var assigned amount.Amount
	for _, line := range lines {
		split := PaymentSplit{
			Sequence:     line.Sequence,
			ValueType:    line.ValueType,
			DaysAfter:    line.DaysAfter,
			DayOfMonth:   line.DayOfMonth,
			DiscountPct:  line.DiscountPct,
			DiscountDays: line.DiscountDays,
			DueDate:      termLineDueDate(line, date),
		}
		switch line.ValueType {
		case "percent":
			split.Amount = total.Mul(amount.FromFloat64(line.Value / 100)).Round(2)
		case "fixed":
			split.Amount = amount.FromFloat64(line.Value).Round(2)
		case "balance":
			split.Amount = total.Sub(assigned).Round(2)
		default:
			return nil, ErrInvalidTermLines
		}
		assigned = assigned.Add(split.Amount)
		splits = append(splits, split)
	}
	return splits, nil
}

type PaymentSplit struct {
	Sequence     int           `json:"sequence"`
	ValueType    string        `json:"value_type"`
	Amount       amount.Amount `json:"amount"`
	DueDate      time.Time     `json:"due_date"`
	DaysAfter    int           `json:"days_after"`
	DayOfMonth   *int          `json:"day_of_month,omitempty"`
	DiscountPct  *float64      `json:"discount_pct,omitempty"`
	DiscountDays *int          `json:"discount_days,omitempty"`
}

func termLineDueDate(line *PaymentTermLine, date time.Time) time.Time {
	if line.DayOfMonth == nil {
		return date.AddDate(0, 0, line.DaysAfter)
	}
	due := time.Date(date.Year(), date.Month(), *line.DayOfMonth, 0, 0, 0, 0, time.UTC)
	if due.Before(date) {
		due = time.Date(date.Year(), date.Month()+1, *line.DayOfMonth, 0, 0, 0, 0, time.UTC)
	}
	return due
}

func validateTermLines(lines []*PaymentTermLine) error {
	if len(lines) == 0 {
		return ErrInvalidTermLines
	}

	var percentSum float64
	balanceCount := 0
	for _, line := range lines {
		switch line.ValueType {
		case "percent", "fixed", "balance":
		default:
			return ErrInvalidTermLines
		}
		if line.ValueType == "percent" {
			percentSum += line.Value
		}
		if line.ValueType == "balance" {
			balanceCount++
		}
	}
	if balanceCount > 1 {
		return ErrMultipleBalanceLines
	}
	if balanceCount == 1 {
		if percentSum > 100 {
			return ErrInvalidTermLines
		}
		return nil
	}
	if math.Abs(percentSum-100) > 0.0001 {
		return ErrInvalidTermLines
	}
	return nil
}

type DimensionService struct {
	orgCRUD[Dimension]
}

func NewDimensionService(accounts dao.Base[Dimension]) DimensionService {
	return DimensionService{
		orgCRUD: newOrgCRUD(accounts, func(account *Dimension, organizationID uint64) bool {
			return scope.Owns(account.OrganizationID, organizationID)
		}, ErrDimensionNotFound),
	}
}

func (s DimensionService) Create(ctx context.Context, account *Dimension) (*Dimension, error) {
	if err := s.validateDimension(ctx, account, 0); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, account)
}

func (s DimensionService) Update(ctx context.Context, account *Dimension) (*Dimension, error) {
	if err := s.validateDimension(ctx, account, account.ID); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, account)
}

func (s DimensionService) validateDimension(ctx context.Context, account *Dimension, excludeID uint64) error {
	if account.Code != nil && *account.Code != "" {
		duplicate, err := s.base.Search(ctx, "code", *account.Code)
		if err != nil {
			return err
		}
		if duplicate != nil && duplicate.ID != excludeID && sameOrganization(duplicate.OrganizationID, account.OrganizationID) {
			return ErrDuplicateCode
		}
	}

	if account.ParentID != nil {
		parent, err := s.base.Find(ctx, *account.ParentID)
		if err != nil {
			return dao.NotFound(err, ErrParentNotFound)
		}
		if parent == nil {
			return ErrParentNotFound
		}
	}

	return nil
}

func sameOrganization(a, b *uint64) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

var validAccountTypes = map[string]struct{}{
	"asset": {}, "liability": {}, "equity": {}, "income": {}, "expense": {},
	"receivable": {}, "payable": {}, "bank": {}, "cash": {}, "cogs": {}, "tax": {},
	"current_asset": {}, "fixed_asset": {}, "depreciation": {},
}

type AccountService struct {
	orgCRUD[Account]
}

func NewAccountService(accounts dao.Base[Account]) AccountService {
	return AccountService{
		orgCRUD: newOrgCRUD(accounts, func(account *Account, organizationID uint64) bool {
			return scope.OwnsValue(account.OrganizationID, organizationID)
		}, ErrAccountNotFound),
	}
}

func (s AccountService) Create(ctx context.Context, account *Account) (*Account, error) {
	if err := s.validateAccount(ctx, account, 0); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, account)
}

func (s AccountService) Update(ctx context.Context, account *Account) (*Account, error) {
	if err := s.validateAccount(ctx, account, account.ID); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, account)
}

func (s AccountService) validateAccount(ctx context.Context, account *Account, excludeID uint64) error {
	if _, ok := validAccountTypes[account.Type]; !ok {
		return ErrInvalidAccountType
	}

	duplicate, err := s.base.Search(ctx, "code", account.Code)
	if err != nil {
		return err
	}
	if duplicate != nil && duplicate.ID != excludeID && duplicate.OrganizationID == account.OrganizationID {
		return ErrDuplicateAccount
	}

	if account.ParentID != nil {
		parent, err := s.base.Find(ctx, *account.ParentID)
		if err != nil {
			return dao.NotFound(err, ErrInvalidParent)
		}
		if parent == nil || parent.OrganizationID != account.OrganizationID {
			return ErrInvalidParent
		}
	}

	return nil
}

var validJournalTypes = map[string]struct{}{
	"sale":     {},
	"purchase": {},
	"bank":     {},
	"cash":     {},
	"general":  {},
}

type JournalService struct {
	orgCRUD[Journal]
	accounts dao.Base[Account]
}

func NewJournalService(journals dao.Base[Journal], accounts dao.Base[Account]) JournalService {
	return JournalService{
		orgCRUD: newOrgCRUD(journals, func(journal *Journal, organizationID uint64) bool {
			return scope.OwnsValue(journal.OrganizationID, organizationID)
		}, ErrJournalNotFound),
		accounts: accounts,
	}
}

func (s JournalService) Create(ctx context.Context, journal *Journal) (*Journal, error) {
	if err := s.validateJournal(ctx, journal); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, journal)
}

func (s JournalService) Update(ctx context.Context, organizationID uint64, journal *Journal) (*Journal, error) {
	existing, err := s.base.Find(ctx, journal.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrJournalNotFound)
	}
	if existing == nil || existing.OrganizationID != organizationID {
		return nil, ErrJournalNotFound
	}
	journal.OrganizationID = existing.OrganizationID
	if err := s.validateJournal(ctx, journal); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, journal)
}

func (s JournalService) validateJournal(ctx context.Context, journal *Journal) error {
	if _, ok := validJournalTypes[journal.Type]; !ok {
		return ErrInvalidJournalType
	}

	if journal.DefaultAccountID != nil {
		account, err := s.accounts.Find(ctx, *journal.DefaultAccountID)
		if err != nil {
			return dao.NotFound(err, ErrJournalDefaultAccount)
		}
		if account == nil || account.OrganizationID != journal.OrganizationID {
			return ErrJournalDefaultAccount
		}
	}

	return nil
}

var validTaxTypes = map[string]struct{}{
	"percent": {}, "fixed": {}, "group": {},
}

var validTaxScopes = map[string]struct{}{
	"sale": {}, "purchase": {}, "none": {},
}

type TaxService struct {
	orgCRUD[Tax]
	accounts dao.Base[Account]
}

func NewTaxService(taxes dao.Base[Tax], accounts dao.Base[Account]) TaxService {
	return TaxService{
		orgCRUD:  newOrgCRUD(taxes, func(tax *Tax, organizationID uint64) bool { return scope.Owns(tax.OrganizationID, organizationID) }, ErrTaxNotFound),
		accounts: accounts,
	}
}

func (s TaxService) Create(ctx context.Context, tax *Tax) (*Tax, error) {
	if err := s.validateTax(ctx, tax); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, tax)
}

func (s TaxService) Update(ctx context.Context, organizationID uint64, tax *Tax) (*Tax, error) {
	existing, err := s.base.Find(ctx, tax.ID)
	if err != nil {
		return nil, dao.NotFound(err, ErrTaxNotFound)
	}
	if existing == nil || existing.OrganizationID == nil || *existing.OrganizationID != organizationID {
		return nil, ErrTaxNotFound
	}
	tax.OrganizationID = existing.OrganizationID
	if err := s.validateTax(ctx, tax); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, tax)
}

func (s TaxService) validateTax(ctx context.Context, tax *Tax) error {
	if _, ok := validTaxTypes[tax.Type]; !ok {
		return ErrInvalidTaxType
	}
	if _, ok := validTaxScopes[tax.Scope]; !ok {
		return ErrInvalidTaxScope
	}
	if (tax.Type == "percent" || tax.Type == "fixed") && (tax.Amount == nil || *tax.Amount <= 0) {
		return ErrTaxAmountMissing
	}

	for _, accountID := range []*uint64{tax.TaxAccountID, tax.RefundTaxAccountID} {
		if accountID == nil {
			continue
		}
		account, err := s.accounts.Find(ctx, *accountID)
		if err != nil {
			return dao.NotFound(err, ErrInvalidTaxAccount)
		}
		if account == nil {
			return ErrInvalidTaxAccount
		}
	}

	return nil
}

type TaxYearService struct {
	orgCRUD[TaxYear]
}

func NewTaxYearService(years dao.Base[TaxYear]) TaxYearService {
	return TaxYearService{
		orgCRUD: newOrgCRUD(years, func(year *TaxYear, organizationID uint64) bool {
			return scope.Owns(year.OrganizationID, organizationID)
		}, ErrTaxYearNotFound),
	}
}

func (s TaxYearService) Create(ctx context.Context, year *TaxYear) (*TaxYear, error) {
	if err := s.validateTaxYear(year); err != nil {
		return nil, err
	}
	return s.base.Create(ctx, year)
}

func (s TaxYearService) Update(ctx context.Context, year *TaxYear) (*TaxYear, error) {
	if err := s.validateTaxYear(year); err != nil {
		return nil, err
	}
	return s.base.Update(ctx, year)
}

func (s TaxYearService) validateTaxYear(year *TaxYear) error {
	if year.DateStart == nil || year.DateEnd == nil || year.DateEnd.Before(*year.DateStart) {
		return ErrInvalidTaxYear
	}
	return nil
}
