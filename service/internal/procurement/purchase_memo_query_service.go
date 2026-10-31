package procurement

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/query"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

func (s PurchaseOrderService) ListCreditMemos(ctx context.Context, orderID uint64, q *query.Query) (*query.Page[PurchaseCreditMemo], error) {
	if _, err := s.findOrder(ctx, orderID); err != nil {
		return nil, err
	}
	q.Filters = append(q.Filters, query.Filter{Field: "order_id", Operator: query.Equal, Value: orderID})
	return s.creditMemos.List(ctx, q)
}

func (s PurchaseOrderService) FindCreditMemo(ctx context.Context, orderID, memoID uint64) (*PurchaseCreditMemo, error) {
	if _, err := s.findOrder(ctx, orderID); err != nil {
		return nil, err
	}
	memo, err := s.creditMemos.Find(ctx, memoID)
	if err != nil {
		return nil, dao.NotFound(err, ErrCreditMemoNotFound)
	}
	if memo == nil || memo.OrderID != orderID {
		return nil, ErrCreditMemoNotFound
	}
	return memo, nil
}

func (s PurchaseOrderService) ListDebitMemos(ctx context.Context, orderID uint64, q *query.Query) (*query.Page[PurchaseDebitMemo], error) {
	if _, err := s.findOrder(ctx, orderID); err != nil {
		return nil, err
	}
	q.Filters = append(q.Filters, query.Filter{Field: "order_id", Operator: query.Equal, Value: orderID})
	return s.debitMemos.List(ctx, q)
}

func (s PurchaseOrderService) FindDebitMemo(ctx context.Context, orderID, memoID uint64) (*PurchaseDebitMemo, error) {
	if _, err := s.findOrder(ctx, orderID); err != nil {
		return nil, err
	}
	memo, err := s.debitMemos.Find(ctx, memoID)
	if err != nil {
		return nil, dao.NotFound(err, ErrDebitMemoNotFound)
	}
	if memo == nil || memo.OrderID != orderID {
		return nil, ErrDebitMemoNotFound
	}
	return memo, nil
}
