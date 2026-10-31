//go:build e2e

package e2e

import (
	"net/http"
	"testing"

	"github.com/brianvoe/gofakeit/v7"
)

func TestPurchaseRequestLifecycleE2E(t *testing.T) {
	f := newFlowFixture(t)
	e := newExpect(t)

	_ = e

	requisition := f.authed(t, http.MethodPost, "/purchase-requests").
		WithJSON(map[string]any{
			"requester_id": 1,
			"lines": []map[string]any{
				{"item_id": f.variantID, "qty": 5},
			},
		}).
		Expect().
		Status(http.StatusCreated).
		JSON().
		Object().
		Value("data").
		Object().
		Value("requisition").
		Object()

	requisitionID := uint64(requisition.Value("id").Number().Raw())

	f.authed(t, http.MethodPost, "/purchase-requests/"+itoa(requisitionID)+"/confirm").
		Expect().
		Status(http.StatusOK)

	f.authed(t, http.MethodPost, "/purchase-requests/"+itoa(requisitionID)+"/approve").
		Expect().
		Status(http.StatusOK)
}

func TestSupplyAgreementLifecycleE2E(t *testing.T) {
	f := newFlowFixture(t)

	agreement := f.authed(t, http.MethodPost, "/supply-agreements").
		WithJSON(map[string]any{
			"supplier_id": f.contactID,
			"lines": []map[string]any{
				{"item_id": f.variantID, "qty": 100, "unit_price": 600000},
			},
		}).
		Expect().
		Status(http.StatusCreated).
		JSON().
		Object().
		Value("data").
		Object().
		Value("agreement").
		Object()

	agreementID := uint64(agreement.Value("id").Number().Raw())

	f.authed(t, http.MethodPost, "/supply-agreements/"+itoa(agreementID)+"/activate").
		Expect().
		Status(http.StatusOK)
}

func TestSupplierQuoteRequestLifecycleE2E(t *testing.T) {
	f := newFlowFixture(t)

	requesterID := defaultUserID(t, f.tokens.AccessToken)

	quote_request := f.authed(t, http.MethodPost, "/supplier-quote-requests/").
		WithJSON(map[string]any{
			"requester_id": requesterID,
			"supplier_id":  f.contactID,
			"lines": []map[string]any{
				{"item_id": f.variantID, "qty": 10},
			},
		}).
		Expect().
		Status(http.StatusCreated).
		JSON().
		Object().
		Value("data").
		Object()

	quote_request.NotEmpty()
}

func TestSupplierScorecardReadE2E(t *testing.T) {
	f := newFlowFixture(t)

	f.authed(t, http.MethodGet, "/supplier-scorecards?supplier_id="+itoa(f.contactID)).
		Expect().
		Status(http.StatusOK)
}

func TestPurchaseOrderCreditMemoE2E(t *testing.T) {
	f := newFlowFixture(t)

	order := f.authed(t, http.MethodPost, "/purchase-orders").
		WithJSON(map[string]any{
			"supplier_id":  f.contactID,
			"warehouse_id": f.warehouseID,
			"lines": []map[string]any{
				{
					"item_id":     f.variantID,
					"qty_ordered": 4,
					"unit_price":  600000,
					"tax_ids":     []uint64{f.taxInputID},
				},
			},
		}).
		Expect().
		Status(http.StatusCreated).
		JSON().
		Object().
		Value("data").
		Object().
		Value("order").
		Object()

	orderID := uint64(order.Value("id").Number().Raw())
	_ = gofakeit.Word()

	f.authed(t, http.MethodPost, "/purchase-orders/"+itoa(orderID)+"/confirm").
		WithJSON(map[string]any{}).
		Expect().
		Status(http.StatusOK)
}
