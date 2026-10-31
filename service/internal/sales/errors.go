package sales

import (
	"errors"

	"github.com/jalusw/swantara/apps/service/internal/inventory"
	"github.com/jalusw/swantara/apps/service/internal/products"
)

var (
	ErrOrderNotFound              = errors.New("sale order not found")
	ErrLineNotFound               = errors.New("sale order line not found")
	ErrOrderState                 = errors.New("sale order is not in the required state")
	ErrOrderNoLines               = errors.New("sale order must have at least one line")
	ErrOrderQty                   = errors.New("sale order line quantity must be positive")
	ErrOrderContact               = errors.New("sale order contact does not exist")
	ErrOrderPriceBook             = errors.New("sale order price_book does not exist")
	ErrOrderWarehouse             = errors.New("sale order warehouse does not exist")
	ErrOrderContactOrganization   = errors.New("sale order contact does not belong to the organization")
	ErrOrderPriceBookOrganization = errors.New("sale order price_book does not belong to the organization")
	ErrOrderWarehouseOrganization = errors.New("sale order warehouse does not belong to the organization")
	ErrOrderVariant               = errors.New("sale order item variant does not exist")
	ErrOrderVariantOrganization   = errors.New("sale order line item does not belong to the organization")
	ErrOrderLead                  = errors.New("sale order source opportunity does not exist")
	ErrOrderLeadNotWon            = errors.New("sale order source opportunity is not won")
	ErrOrderLeadLost              = errors.New("sale order source opportunity is lost")
	ErrOrderLeadOrganization      = errors.New("sale order source opportunity does not belong to the organization")
	ErrOrderLeadAlreadyConverted  = errors.New("sale order source opportunity already has an active order")
	ErrOrderTax                   = errors.New("sale order tax does not exist")
	ErrOrderTaxInvalid            = errors.New("sale order tax is not a sale tax")
	ErrOrderTaxOrganization       = errors.New("sale order tax does not belong to the organization")
	ErrOrderCurrency              = errors.New("sale order currency does not exist")
	ErrOrderLocation              = errors.New("sale order warehouse stock location not found")
	ErrOrderCustomerLocation      = errors.New("sale order customer location not found")
	ErrOrderStockUnavailable      = errors.New("sale order line quantity is not available to reserve")
	ErrOrderDiscount              = errors.New("sale order line discount must be between 0 and 100")
	ErrOrderSequenceNotFound      = errors.New("sale order document sequence not configured")
	ErrOrderShipmentNotFound      = errors.New("sale order outgoing shipment not found")
	ErrOrderNothingToDeliver      = errors.New("sale order has nothing ready to deliver")
	ErrOrderNothingToInvoice      = errors.New("sale order has no quantity available to invoice")
	ErrOrderAdvancePercentage     = errors.New("sale order advance percentage must be between 0 and 100")
	ErrOrderInvoiceMismatch       = errors.New("invoice does not belong to the sale order")
	ErrOrderNoInvoices            = errors.New("sale order has no open invoices to pay")

	ErrSalesCreditLimit      = errors.New("sale exceeds the customer credit limit")
	ErrSalesApprovalRequired = errors.New("sale requires approval but no approvers are configured")
	ErrSalesApprovalPending  = errors.New("sale approval request is pending")
	ErrSalesApprovalRefused  = errors.New("sale approval request was refused")

	ErrQuoteNotFound              = errors.New("sale quote not found")
	ErrQuoteLineNotFound          = errors.New("sale quote line not found")
	ErrQuoteState                 = errors.New("sale quote is not in the required state")
	ErrQuoteNoLines               = errors.New("sale quote must have at least one line")
	ErrQuoteQty                   = errors.New("sale quote line quantity must be positive")
	ErrQuoteDiscount              = errors.New("sale quote line discount must be between 0 and 100")
	ErrQuoteContact               = errors.New("sale quote contact does not exist")
	ErrQuotePriceBook             = errors.New("sale quote price_book does not exist")
	ErrQuoteContactOrganization   = errors.New("sale quote contact does not belong to the organization")
	ErrQuotePriceBookOrganization = errors.New("sale quote price_book does not belong to the organization")
	ErrQuoteVariant               = errors.New("sale quote item variant does not exist")
	ErrQuoteVariantOrganization   = errors.New("sale quote line item does not belong to the organization")
	ErrQuoteLead                  = errors.New("sale quote source opportunity does not exist")
	ErrQuoteLeadInvalid           = errors.New("sale quote source must be an opportunity")
	ErrQuoteLeadClosed            = errors.New("sale quote source opportunity is lost or closed")
	ErrQuoteLeadOrganization      = errors.New("sale quote source opportunity does not belong to the organization")
	ErrQuoteTax                   = errors.New("sale quote tax does not exist")
	ErrQuoteTaxInvalid            = errors.New("sale quote tax is not a sale tax")
	ErrQuoteTaxOrganization       = errors.New("sale quote tax does not belong to the organization")
	ErrQuoteExpired               = errors.New("sale quote has expired")
	ErrQuoteNotAccepted           = errors.New("sale quote must be accepted before conversion")
	ErrQuoteAlreadyConverted      = errors.New("sale quote has already been converted to an order")
	ErrQuoteSequenceNotFound      = errors.New("sale quote document sequence not configured")

	ErrBalanceNotFound = inventory.ErrBalanceNotFound
	ErrHoldOverflow    = inventory.ErrHoldOverflow
	ErrNoIncomeAccount = products.ErrNoIncomeAccount
)
