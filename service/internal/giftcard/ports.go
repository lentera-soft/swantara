package giftcard

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"gorm.io/gorm"
)

type CouponDAO interface {
	dao.CRUD[Coupon]
	RedeemTx(ctx context.Context, tx *gorm.DB, couponID uint64) (*Coupon, error)
}
