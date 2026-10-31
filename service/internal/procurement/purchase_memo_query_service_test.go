package procurement

import (
	"context"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
)

func memoQueryService(orders PurchaseOrderDAOMock, creditMemos PurchaseCreditMemoDAOMock, debitMemos PurchaseDebitMemoDAOMock) PurchaseOrderService {
	return NewTestPurchaseOrderService(PurchaseOrderServiceTestDeps{
		Orders:      orders,
		CreditMemos: creditMemos,
		DebitMemos:  debitMemos,
	})
}

func existingOrderDAO() PurchaseOrderDAOMock {
	return PurchaseOrderDAOMock{CRUDMock: dao.CRUDMock[PurchaseOrder]{
		FindFunc: func(_ context.Context, id uint64) (*PurchaseOrder, error) {
			return &PurchaseOrder{Base: model.Base{ID: id}, SupplierID: 10}, nil
		},
	}}
}

func TestListCreditMemos_FiltersByOrder(t *testing.T) {
	var filterSeen bool
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{CRUDMock: dao.CRUDMock[PurchaseCreditMemo]{
		ListFunc: func(_ context.Context, q *query.Query) (*query.Page[PurchaseCreditMemo], error) {
			for _, f := range q.Filters {
				if f.Field == "order_id" && f.Value == uint64(1) {
					filterSeen = true
				}
			}
			return &query.Page[PurchaseCreditMemo]{Count: 1}, nil
		},
	}}, PurchaseDebitMemoDAOMock{})

	page, err := svc.ListCreditMemos(context.Background(), 1, &query.Query{})
	if err != nil || page.Count != 1 || !filterSeen {
		t.Fatalf("page = %+v, filterSeen = %v, err = %v", page, filterSeen, err)
	}
}

func TestListCreditMemos_OrderNotFound(t *testing.T) {
	svc := memoQueryService(PurchaseOrderDAOMock{}, PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{})

	if _, err := svc.ListCreditMemos(context.Background(), 1, &query.Query{}); !errors.Is(err, ErrPurchaseOrderNotFound) {
		t.Fatalf("err = %v, want ErrPurchaseOrderNotFound", err)
	}
}

func TestFindCreditMemo_Found(t *testing.T) {
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{CRUDMock: dao.CRUDMock[PurchaseCreditMemo]{
		FindFunc: func(_ context.Context, id uint64) (*PurchaseCreditMemo, error) {
			return &PurchaseCreditMemo{Base: model.Base{ID: id}, OrderID: 1}, nil
		},
	}}, PurchaseDebitMemoDAOMock{})

	memo, err := svc.FindCreditMemo(context.Background(), 1, 5)
	if err != nil || memo == nil || memo.ID != 5 {
		t.Fatalf("memo = %+v, err = %v", memo, err)
	}
}

func TestFindCreditMemo_WrongOrder(t *testing.T) {
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{CRUDMock: dao.CRUDMock[PurchaseCreditMemo]{
		FindFunc: func(_ context.Context, id uint64) (*PurchaseCreditMemo, error) {
			return &PurchaseCreditMemo{Base: model.Base{ID: id}, OrderID: 99}, nil
		},
	}}, PurchaseDebitMemoDAOMock{})

	if _, err := svc.FindCreditMemo(context.Background(), 1, 5); !errors.Is(err, ErrCreditMemoNotFound) {
		t.Fatalf("err = %v, want ErrCreditMemoNotFound", err)
	}
}

func TestFindCreditMemo_NotFound(t *testing.T) {
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{})

	if _, err := svc.FindCreditMemo(context.Background(), 1, 5); !errors.Is(err, ErrCreditMemoNotFound) {
		t.Fatalf("err = %v, want ErrCreditMemoNotFound", err)
	}
}

func TestListDebitMemos_FiltersByOrder(t *testing.T) {
	var filterSeen bool
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{CRUDMock: dao.CRUDMock[PurchaseDebitMemo]{
		ListFunc: func(_ context.Context, q *query.Query) (*query.Page[PurchaseDebitMemo], error) {
			for _, f := range q.Filters {
				if f.Field == "order_id" && f.Value == uint64(2) {
					filterSeen = true
				}
			}
			return &query.Page[PurchaseDebitMemo]{Count: 2}, nil
		},
	}})

	page, err := svc.ListDebitMemos(context.Background(), 2, &query.Query{})
	if err != nil || page.Count != 2 || !filterSeen {
		t.Fatalf("page = %+v, filterSeen = %v, err = %v", page, filterSeen, err)
	}
}

func TestListDebitMemos_OrderNotFound(t *testing.T) {
	svc := memoQueryService(PurchaseOrderDAOMock{}, PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{})

	if _, err := svc.ListDebitMemos(context.Background(), 1, &query.Query{}); !errors.Is(err, ErrPurchaseOrderNotFound) {
		t.Fatalf("err = %v, want ErrPurchaseOrderNotFound", err)
	}
}

func TestFindDebitMemo_Found(t *testing.T) {
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{CRUDMock: dao.CRUDMock[PurchaseDebitMemo]{
		FindFunc: func(_ context.Context, id uint64) (*PurchaseDebitMemo, error) {
			return &PurchaseDebitMemo{Base: model.Base{ID: id}, OrderID: 1}, nil
		},
	}})

	memo, err := svc.FindDebitMemo(context.Background(), 1, 5)
	if err != nil || memo == nil || memo.ID != 5 {
		t.Fatalf("memo = %+v, err = %v", memo, err)
	}
}

func TestFindDebitMemo_NotFound(t *testing.T) {
	svc := memoQueryService(existingOrderDAO(), PurchaseCreditMemoDAOMock{}, PurchaseDebitMemoDAOMock{})

	if _, err := svc.FindDebitMemo(context.Background(), 1, 5); !errors.Is(err, ErrDebitMemoNotFound) {
		t.Fatalf("err = %v, want ErrDebitMemoNotFound", err)
	}
}
