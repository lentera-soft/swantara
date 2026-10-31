package inquiry

import (
	"context"
	"errors"
	"strings"

	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

var (
	ErrNameRequired           = errors.New("inquiry name is required")
	ErrEmailRequired          = errors.New("inquiry email is required")
	ErrMessageRequired        = errors.New("inquiry message is required")
	ErrInquiryNotFound        = errors.New("inquiry not found")
	ErrInvalidStatus          = errors.New("inquiry status is invalid")
	ErrAlreadyConverted       = errors.New("inquiry has already been converted")
	ErrConversionInProgress   = errors.New("inquiry conversion is already in progress")
	ErrLeadCreatorUnavailable = errors.New("inquiry lead conversion is unavailable")
)

// LeadCreator is the CRM capability required to turn an inquiry into a lead.
type LeadCreator interface {
	CreateLead(ctx context.Context, prospect *crm.Prospect) (*crm.Prospect, error)
}

type ContactInquiryService struct {
	inquiries ContactInquiryDAO
	leads     LeadCreator
}

func NewContactInquiryService(inquiries ContactInquiryDAO) ContactInquiryService {
	return ContactInquiryService{inquiries: inquiries}
}

func (s ContactInquiryService) WithLeadCreator(leads LeadCreator) ContactInquiryService {
	s.leads = leads
	return s
}

type CreateContactInquiryRequest struct {
	OrganizationID *uint64
	Name           string
	Email          string
	Company        *string
	Message        string
	Source         *string
	Medium         *string
	Campaign       *string
}

func (s ContactInquiryService) Create(
	ctx context.Context,
	request CreateContactInquiryRequest,
) (*ContactInquiry, error) {
	name := strings.TrimSpace(request.Name)
	email := strings.TrimSpace(request.Email)
	message := strings.TrimSpace(request.Message)

	if name == "" {
		return nil, ErrNameRequired
	}
	if email == "" {
		return nil, ErrEmailRequired
	}
	if message == "" {
		return nil, ErrMessageRequired
	}

	var company *string
	if request.Company != nil {
		trimmed := strings.TrimSpace(*request.Company)
		if trimmed != "" {
			company = &trimmed
		}
	}

	source := trimmedPtr(request.Source)
	if source == nil {
		source = ptr("website")
	}

	return s.inquiries.Create(ctx, &ContactInquiry{
		OrganizationID: request.OrganizationID,
		Name:           name,
		Email:          email,
		Company:        company,
		Message:        message,
		Status:         StatusNew,
		Source:         source,
		Medium:         trimmedPtr(request.Medium),
		Campaign:       trimmedPtr(request.Campaign),
	})
}

func (s ContactInquiryService) ListInOrg(ctx context.Context, q *query.Query, organizationID uint64) (*query.Page[ContactInquiry], error) {
	return s.inquiries.ListInOrg(ctx, q, organizationID)
}

func (s ContactInquiryService) FindInOrg(ctx context.Context, id, organizationID uint64) (*ContactInquiry, error) {
	inquiry, err := s.inquiries.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return nil, dao.NotFound(err, ErrInquiryNotFound)
	}
	if inquiry == nil {
		return nil, ErrInquiryNotFound
	}
	return inquiry, nil
}

type UpdateStatusInput struct {
	Status string
}

func (s ContactInquiryService) UpdateStatus(ctx context.Context, id, organizationID uint64, input UpdateStatusInput) (*ContactInquiry, error) {
	status := strings.TrimSpace(input.Status)
	if status != StatusNew && status != StatusReviewed && status != StatusArchived {
		return nil, ErrInvalidStatus
	}
	inquiry, err := s.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return nil, err
	}
	inquiry.Status = status
	return s.inquiries.Update(ctx, inquiry)
}

type ConvertInput struct {
	OrganizationID uint64
	Source         *string
	Medium         *string
	Campaign       *string
	OwnerUserID    *uint64
	AllowDuplicate bool
}

// Convert creates a CRM lead from the inquiry and links the two records. The
// inquiry is claimed first so concurrent requests cannot create duplicate
// leads, then marked reviewed once the lead has been linked.
func (s ContactInquiryService) Convert(ctx context.Context, id, organizationID uint64, input ConvertInput) (*ContactInquiry, *crm.Prospect, error) {
	if s.leads == nil {
		return nil, nil, ErrLeadCreatorUnavailable
	}

	conversion, atomic := s.inquiries.(ContactInquiryConversionDAO)
	if !atomic {
		return s.convertWithoutClaim(ctx, id, organizationID, input)
	}

	claimID, err := helper.RandomHex(16)
	if err != nil {
		return nil, nil, err
	}
	inquiry, err := conversion.ClaimForConversion(ctx, id, organizationID, claimID)
	if err != nil {
		return nil, nil, err
	}

	created, err := s.leads.CreateLead(ctx, newProspectFromInquiry(inquiry, input))
	if err != nil {
		_ = conversion.ReleaseConversionClaim(ctx, id, organizationID, claimID)
		return nil, nil, err
	}

	updated, err := conversion.LinkConversion(ctx, id, organizationID, claimID, created.ID)
	if err != nil {
		_ = conversion.ReleaseConversionClaim(ctx, id, organizationID, claimID)
		return nil, nil, err
	}
	return updated, created, nil
}

// convertWithoutClaim preserves compatibility with DAO test doubles that do
// not implement ContactInquiryConversionDAO. Production uses the claim path.
func (s ContactInquiryService) convertWithoutClaim(ctx context.Context, id, organizationID uint64, input ConvertInput) (*ContactInquiry, *crm.Prospect, error) {
	inquiry, err := s.FindInOrg(ctx, id, organizationID)
	if err != nil {
		return nil, nil, err
	}
	if inquiry.ProspectID != nil {
		return nil, nil, ErrAlreadyConverted
	}

	created, err := s.leads.CreateLead(ctx, newProspectFromInquiry(inquiry, input))
	if err != nil {
		return nil, nil, err
	}

	inquiry.ProspectID = &created.ID
	inquiry.Status = StatusReviewed
	if inquiry.OrganizationID == nil {
		inquiry.OrganizationID = &input.OrganizationID
	}
	updated, err := s.inquiries.Update(ctx, inquiry)
	if err != nil {
		return nil, nil, err
	}
	return updated, created, nil
}

func newProspectFromInquiry(inquiry *ContactInquiry, input ConvertInput) *crm.Prospect {
	name := inquiry.Name
	if inquiry.Company != nil && strings.TrimSpace(*inquiry.Company) != "" {
		name = strings.TrimSpace(*inquiry.Company)
	}
	contactName := inquiry.Name
	email := inquiry.Email
	need := inquiry.Message
	source := trimmedPtr(input.Source)
	if source == nil {
		source = inquiry.Source
	}
	if source == nil {
		source = ptr("inquiry")
	}
	medium := trimmedPtr(input.Medium)
	if medium == nil {
		medium = inquiry.Medium
	}
	campaign := trimmedPtr(input.Campaign)
	if campaign == nil {
		campaign = inquiry.Campaign
	}

	return &crm.Prospect{
		OrganizationID: &input.OrganizationID,
		Name:           name,
		Type:           crm.ProspectKindLead,
		Status:         crm.ProspectStatusNew,
		ContactName:    &contactName,
		Email:          &email,
		NeedSummary:    &need,
		Source:         source,
		Medium:         medium,
		Campaign:       campaign,
		OwnerUserID:    input.OwnerUserID,
		AllowDuplicate: input.AllowDuplicate,
	}
}

func trimmedPtr(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func ptr(value string) *string {
	return &value
}
