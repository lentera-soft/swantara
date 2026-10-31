package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

func couponExpiry(raw *string) (*time.Time, error) {
	if raw == nil || *raw == "" {
		return nil, nil
	}
	parsed, err := helper.ParseDateStr(*raw)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func writeCouponError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "coupon write failed", "Failed to save coupon.",
		httpx.NotFound(giftcard.ErrCouponNotFound, "Coupon not found."),
		httpx.Unprocessable(giftcard.ErrCouponCodeRequired, "Coupon code is required."),
		httpx.Unprocessable(giftcard.ErrCouponOrganization, "Coupon requires an organization."),
		httpx.Unprocessable(giftcard.ErrCouponDiscountInvalid, "Coupon discount is invalid."),
		httpx.Unprocessable(giftcard.ErrCouponAlreadyExists, "Coupon code already exists for the organization."),
		httpx.Unprocessable(giftcard.ErrCouponExpired, "Coupon has expired."),
		httpx.Unprocessable(giftcard.ErrCouponOverLimit, "Coupon usage limit exceeded."),
		httpx.Unprocessable(giftcard.ErrCouponInactive, "Coupon is not active."),
	)
}
