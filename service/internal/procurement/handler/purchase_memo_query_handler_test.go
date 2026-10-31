package handler

import (
	"context"
	"net/http"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
)

func memoQueryService(orders procurement.PurchaseOrderDAOMock, creditMemos procurement.PurchaseCreditMemoDAOMock, debitMemos procurement.PurchaseDebitMemoDAOMock) procurement.PurchaseOrderService {
	return procurement.NewTestPurchaseOrderService(procurement.PurchaseOrderServiceTestDeps{
		Orders:      orders,
		CreditMemos: creditMemos,
		DebitMemos:  debitMemos,
	})
}

func memoOrderDAO() procurement.PurchaseOrderDAOMock {
	return procurement.PurchaseOrderDAOMock{CRUDMock: dao.CRUDMock[procurement.PurchaseOrder]{
		FindFunc: func(_ context.Context, _ uint64) (*procurement.PurchaseOrder, error) {
			return samplePurchaseOrder(), nil
		},
	}}
}

func TestPurchaseOrderHandler_ListCreditMemos(t *testing.T) {
	orders := memoOrderDAO()
	creditMemos := procurement.PurchaseCreditMemoDAOMock{CRUDMock: dao.CRUDMock[procurement.PurchaseCreditMemo]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[procurement.PurchaseCreditMemo], error) {
			return &query.Page[procurement.PurchaseCreditMemo]{
				Items: []*procurement.PurchaseCreditMemo{{Base: model.Base{ID: 1}, OrderID: 1}},
				Count: 1,
			}, nil
		},
	}}
	svc := memoQueryService(orders, creditMemos, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/credit-memos", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_GetCreditMemo_NotFound(t *testing.T) {
	orders := memoOrderDAO()
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/credit-memos/9", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_GetCreditMemo_Found(t *testing.T) {
	orders := memoOrderDAO()
	creditMemos := procurement.PurchaseCreditMemoDAOMock{CRUDMock: dao.CRUDMock[procurement.PurchaseCreditMemo]{
		FindFunc: func(_ context.Context, id uint64) (*procurement.PurchaseCreditMemo, error) {
			return &procurement.PurchaseCreditMemo{Base: model.Base{ID: id}, OrderID: 1}, nil
		},
	}}
	svc := memoQueryService(orders, creditMemos, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/credit-memos/9", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_GetCreditMemo_InvalidID(t *testing.T) {
	orders := memoOrderDAO()
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/credit-memos/abc", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want 422", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_ListDebitMemos(t *testing.T) {
	orders := memoOrderDAO()
	debitMemos := procurement.PurchaseDebitMemoDAOMock{CRUDMock: dao.CRUDMock[procurement.PurchaseDebitMemo]{
		ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[procurement.PurchaseDebitMemo], error) {
			return &query.Page[procurement.PurchaseDebitMemo]{
				Items: []*procurement.PurchaseDebitMemo{{Base: model.Base{ID: 1}, OrderID: 1}},
				Count: 1,
			}, nil
		},
	}}
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, debitMemos)
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/debit-memos", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_GetDebitMemo_NotFound(t *testing.T) {
	orders := memoOrderDAO()
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/debit-memos/9", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_GetDebitMemo_Found(t *testing.T) {
	orders := memoOrderDAO()
	debitMemos := procurement.PurchaseDebitMemoDAOMock{CRUDMock: dao.CRUDMock[procurement.PurchaseDebitMemo]{
		FindFunc: func(_ context.Context, id uint64) (*procurement.PurchaseDebitMemo, error) {
			return &procurement.PurchaseDebitMemo{Base: model.Base{ID: id}, OrderID: 1}, nil
		},
	}}
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, debitMemos)
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/debit-memos/9", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
}

func TestPurchaseOrderHandler_ListCreditMemos_OrderNotFound(t *testing.T) {
	orders := procurement.PurchaseOrderDAOMock{}
	svc := memoQueryService(orders, procurement.PurchaseCreditMemoDAOMock{}, procurement.PurchaseDebitMemoDAOMock{})
	app := orderTestApp(t, orders, procurement.PurchaseOrderLineDAOMock{}, svc)

	resp, err := doRequest(app, http.MethodGet, "/purchase-orders/1/credit-memos", "")
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
}
