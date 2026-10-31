package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

// @Summary List coupons
// @Description Lists coupons with pagination, sorting, and filtering. Results are scoped to the caller's organization.
// @Tags Coupons
// @Accept json
// @Produce json
// @Param organization_id path int true "Organization ID"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Param sort query string false "Sort fields (e.g. code:asc)"
// @Success 200 {object} ListCouponsResponseEnvelope "Coupons retrieved successfully."
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/coupons [get]
func (h CouponHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, couponQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("coupon list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve coupons.", err)
	}
	items := make([]CouponResponse, len(page.Items))
	for i, coupon := range page.Items {
		items[i] = newCouponResponse(coupon)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Coupons retrieved successfully.", ListCouponsResponse{
		Coupons: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get coupon
// @Description Gets a single coupon by id. The coupon must belong to the caller's organization.
// @Tags Coupons
// @Accept json
// @Produce json
// @Param organization_id path int true "Organization ID"
// @Param id path int true "Coupon ID"
// @Success 200 {object} GetCouponResponseEnvelope "Coupon retrieved successfully."
// @Failure 404 {object} httpx.ErrorResponse "Coupon not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/coupons/{id} [get]
func (h CouponHandler) Get(c fiber.Ctx) error {
	couponID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid coupon id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	coupon, err := h.svc.FindInOrg(c, couponID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Coupon not found.")
		}
		httpx.RequestLog(c).Error("coupon lookup failed", "coupon_id", couponID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get coupon.", err)
	}
	if coupon == nil {
		return httpx.CreateNotFoundResponse(c, "Coupon not found.")
	}
	return httpx.CreateSuccessResponse(c, "Coupon retrieved successfully.", GetCouponResponse{
		Coupon: newCouponResponse(coupon),
	})
}

// @Summary Create coupon
// @Description Creates a new coupon for the organization.
// @Tags Coupons
// @Accept json
// @Produce json
// @Param organization_id path int true "Organization ID"
// @Param body body CreateCouponRequest true "Coupon payload"
// @Success 201 {object} CreateCouponResponseEnvelope "Coupon created successfully."
// @Failure 409 {object} httpx.ErrorResponse "Coupon code already exists"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/coupons [post]
func (h CouponHandler) Create(c fiber.Ctx) error {
	var request CreateCouponRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	expiry, err := couponExpiry(request.ExpiryDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Expiry date must be in YYYY-MM-DD format.", nil)
	}
	active := true
	if request.Active != nil {
		active = *request.Active
	}
	coupon, err := h.svc.Create(c, &giftcard.Coupon{
		OrganizationID: organizationID,
		Code:           request.Code,
		DiscountType:   request.DiscountType,
		DiscountValue:  request.DiscountValue,
		PriceRuleID:    request.PriceRuleID,
		UsageLimit:     request.UsageLimit,
		ExpiryDate:     expiry,
		Active:         active,
	})
	if err != nil {
		return writeCouponError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Coupon created successfully.", CreateCouponResponse{
		Coupon: newCouponResponse(coupon),
	})
}

// @Summary Update coupon
// @Description Updates an existing coupon. The coupon must belong to the caller's organization.
// @Tags Coupons
// @Accept json
// @Produce json
// @Param organization_id path int true "Organization ID"
// @Param id path int true "Coupon ID"
// @Param body body UpdateCouponRequest true "Coupon payload"
// @Success 200 {object} UpdateCouponResponseEnvelope "Coupon updated successfully."
// @Failure 404 {object} httpx.ErrorResponse "Coupon not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/coupons/{id} [put]
func (h CouponHandler) Update(c fiber.Ctx) error {
	couponID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid coupon id provided.", nil)
	}
	var request UpdateCouponRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	coupon, err := h.svc.FindInOrg(c, couponID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Coupon not found.")
		}
		httpx.RequestLog(c).Error("coupon lookup failed", "coupon_id", couponID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update coupon.", err)
	}
	if coupon == nil {
		return httpx.CreateNotFoundResponse(c, "Coupon not found.")
	}
	expiry, err := couponExpiry(request.ExpiryDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Expiry date must be in YYYY-MM-DD format.", nil)
	}
	coupon.Code = request.Code
	coupon.DiscountType = request.DiscountType
	coupon.DiscountValue = request.DiscountValue
	coupon.PriceRuleID = request.PriceRuleID
	coupon.UsageLimit = request.UsageLimit
	coupon.ExpiryDate = expiry
	if request.Active != nil {
		coupon.Active = *request.Active
	}

	updated, err := h.svc.Update(c, coupon)
	if err != nil {
		return writeCouponError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Coupon updated successfully.", UpdateCouponResponse{
		Coupon: newCouponResponse(updated),
	})
}

// @Summary Delete coupon
// @Description Deletes a coupon. The coupon must belong to the caller's organization.
// @Tags Coupons
// @Accept json
// @Produce json
// @Param organization_id path int true "Organization ID"
// @Param id path int true "Coupon ID"
// @Success 204 "No content"
// @Failure 404 {object} httpx.ErrorResponse "Coupon not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/coupons/{id} [delete]
func (h CouponHandler) Delete(c fiber.Ctx) error {
	couponID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid coupon id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	coupon, err := h.svc.FindInOrg(c, couponID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Coupon not found.")
		}
		httpx.RequestLog(c).Error("coupon lookup failed", "coupon_id", couponID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete coupon.", err)
	}
	if coupon == nil {
		return httpx.CreateNotFoundResponse(c, "Coupon not found.")
	}
	if err := h.svc.Delete(c, couponID); err != nil {
		httpx.RequestLog(c).Error("coupon deletion failed", "coupon_id", couponID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete coupon.", err)
	}
	return httpx.CreateNoContentResponse(c)
}
