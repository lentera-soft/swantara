package sales

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/crosscutting"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/systemconfig"
)

const (
	ApprovalOwnerTypeSaleOrder = "sale_order"
	ApprovalOwnerTypeSaleQuote = "sale_quote"

	configDiscountApprovalThreshold = "sales.discount_approval_threshold"
	configStandardPaymentTermIDs    = "sales.standard_payment_term_ids"
	configApproverIDs               = "sales.approver_ids"
)

// SalesApprovalPolicy describes the commercial terms that require approval
// before a quote can be accepted or an order confirmed.
type SalesApprovalPolicy struct {
	DiscountThreshold      float64
	StandardPaymentTermIDs []uint64
	ApproverIDs            []uint64
}

type SalesConfigSource interface {
	ApprovalPolicy(ctx context.Context, organizationID uint64) (SalesApprovalPolicy, error)
}

type systemConfigSource struct {
	configs systemconfig.Lookup
}

func NewSystemConfigSource(configs systemconfig.Lookup) SalesConfigSource {
	return systemConfigSource{configs: configs}
}

func (s systemConfigSource) ApprovalPolicy(ctx context.Context, organizationID uint64) (SalesApprovalPolicy, error) {
	var policy SalesApprovalPolicy
	if err := systemconfig.Read(ctx, s.configs, organizationID, configDiscountApprovalThreshold, &policy.DiscountThreshold); err != nil {
		return policy, err
	}
	if err := systemconfig.Read(ctx, s.configs, organizationID, configStandardPaymentTermIDs, &policy.StandardPaymentTermIDs); err != nil {
		return policy, err
	}
	if err := systemconfig.Read(ctx, s.configs, organizationID, configApproverIDs, &policy.ApproverIDs); err != nil {
		return policy, err
	}
	return policy, nil
}

type ApprovalEngine interface {
	IsApproved(ctx context.Context, ownerType string, ownerID uint64) (bool, error)
	Create(ctx context.Context, organizationID uint64, ownerType string, ownerID, requestedBy uint64, approverIDs []uint64) (*crosscutting.ApprovalRequest, error)
	State(ctx context.Context, ownerType string, ownerID uint64) (*crosscutting.ApprovalRequest, []*crosscutting.ApprovalStep, error)
	Invalidate(ctx context.Context, ownerType string, ownerID uint64) error
}

// SalesControls applies customer credit limits and approval rules to commercial
// documents. Zero-value controls are inert until wired by the application.
type SalesControls struct {
	Customers contacts.CustomerProfileDAO
	Invoices  InvoiceLookup
	Approvals ApprovalEngine
	Configs   SalesConfigSource
}

// Enforce returns nil when the sale may proceed, or a typed error when it is
// held for credit or is waiting on a sales approval request. When approval is
// required and none exists yet, it creates the request and returns
// ErrSalesApprovalPending so the caller can prompt the user to retry later.
func (c SalesControls) Enforce(ctx context.Context, organizationID uint64, ownerType string, ownerID, contactID uint64, total float64, paymentTermID *uint64, maxDiscount float64) error {
	if c.Customers == nil && c.Invoices == nil && c.Approvals == nil && c.Configs == nil {
		return nil
	}

	reasons := make([]string, 0, 3)
	overLimit, err := c.creditLimitExceeded(ctx, organizationID, contactID, total)
	if err != nil {
		return err
	}
	if overLimit {
		reasons = append(reasons, "credit_limit")
	}

	var policy SalesApprovalPolicy
	if c.Configs != nil {
		policy, err = c.Configs.ApprovalPolicy(ctx, organizationID)
		if err != nil {
			return err
		}
		if policy.DiscountThreshold > 0 && maxDiscount > policy.DiscountThreshold {
			reasons = append(reasons, "discount")
		}
		if len(policy.StandardPaymentTermIDs) > 0 && !containsID(policy.StandardPaymentTermIDs, paymentTermID) {
			reasons = append(reasons, "payment_term")
		}
	}
	if len(reasons) == 0 {
		return nil
	}

	if c.Approvals == nil {
		if overLimit {
			return ErrSalesCreditLimit
		}
		return ErrSalesApprovalRequired
	}

	request, _, err := c.Approvals.State(ctx, ownerType, ownerID)
	if err != nil {
		return err
	}
	if request != nil {
		switch request.State {
		case crosscutting.ApprovalStateApproved:
			return nil
		case crosscutting.ApprovalStatePending:
			return ErrSalesApprovalPending
		case crosscutting.ApprovalStateRefused:
			return ErrSalesApprovalRefused
		}
	}

	if len(policy.ApproverIDs) == 0 {
		if overLimit {
			return ErrSalesCreditLimit
		}
		return ErrSalesApprovalRequired
	}
	if _, err := c.Approvals.Create(ctx, organizationID, ownerType, ownerID, model.ActorID(ctx), policy.ApproverIDs); err != nil {
		return err
	}
	return ErrSalesApprovalPending
}

func (c SalesControls) Invalidate(ctx context.Context, ownerType string, ownerID uint64) error {
	if c.Approvals == nil {
		return nil
	}
	return c.Approvals.Invalidate(ctx, ownerType, ownerID)
}

func (c SalesControls) creditLimitExceeded(ctx context.Context, organizationID, contactID uint64, additional float64) (bool, error) {
	if c.Customers == nil || c.Invoices == nil {
		return false, nil
	}
	profile, err := c.Customers.FindByContact(ctx, contactID)
	if err != nil {
		if dao.IsNotFound(err) {
			return false, nil
		}
		return false, err
	}
	if profile == nil || profile.CreditLimit == nil {
		return false, nil
	}
	open, err := c.Invoices.ListOpenByContact(ctx, contactID)
	if err != nil {
		return false, err
	}
	exposure := amount.FromFloat64(additional)
	for _, invoice := range open {
		if invoice == nil || invoice.OrganizationID == nil || *invoice.OrganizationID != organizationID {
			continue
		}
		exposure = exposure.Add(invoice.AmountResidual)
	}
	return exposure.Round(4).GreaterThan(amount.FromFloat64(*profile.CreditLimit).Round(4)), nil
}

func containsID(ids []uint64, id *uint64) bool {
	if id == nil {
		return false
	}
	for _, candidate := range ids {
		if candidate == *id {
			return true
		}
	}
	return false
}

func maxSalesLineDiscount(lines []*SaleOrderLine) float64 {
	maxDiscount := 0.0
	for _, line := range lines {
		if line != nil && line.DiscountPct > maxDiscount {
			maxDiscount = line.DiscountPct
		}
	}
	return maxDiscount
}

func maxQuoteLineDiscount(lines []*SaleQuoteLine) float64 {
	maxDiscount := 0.0
	for _, line := range lines {
		if line != nil && line.DiscountPct > maxDiscount {
			maxDiscount = line.DiscountPct
		}
	}
	return maxDiscount
}
