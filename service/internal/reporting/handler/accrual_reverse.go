package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type ReverseAccrualsRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	AsOf           string  `json:"as_of" validate:"required"`
}

type ReverseAccrualsResponse struct {
	Reversed int `json:"reversed"`
}

// @Summary Reverse due accruals
// @Description Automatically reverses posted accruals whose reversal date is on or before the given date, creating mirrored GL entries.
// @Tags Accruals
// @Accept json
// @Produce json
// @Param body body ReverseAccrualsRequest true "Reversal details"
// @Success 200 {object} ReverseAccrualsResponse "Due accruals reversed successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/accruals/reverse-due [post]
func (h AccrualHandler) ReverseDue(c fiber.Ctx) error {
	var request ReverseAccrualsRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	asOf, err := helper.ParseDate(&request.AsOf)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "as_of must be in YYYY-MM-DD format.", nil)
	}

	reversed, err := h.svc.ReverseDue(c, *organizationID, *asOf)
	if err != nil {
		return writeAccrualError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Due accruals reversed successfully.", ReverseAccrualsResponse{
		Reversed: reversed,
	})
}

type ReverseAccrualRequest struct {
	OrganizationID *uint64 `json:"organization_id"`
	Date           string  `json:"date"`
}

// @Summary Reverse an accrual
// @Description Reverses a posted accrual by creating a mirrored GL entry on the supplied date (or today when omitted). Only posted accruals that have not been reversed yet can be reversed.
// @Tags Accruals
// @Accept json
// @Produce json
// @Param id path integer true "Accrual ID"
// @Param body body ReverseAccrualRequest true "Reversal details"
// @Success 200 {object} reporting.AccrualResult "Accrual reversed successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Accrual not found"
// @Failure 409 {object} httpx.ErrorResponse "Accrual state conflict"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/accruals/{id}/reverse [post]
func (h AccrualHandler) Reverse(c fiber.Ctx) error {
	accrualID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid accrual id provided.", nil)
	}
	var request ReverseAccrualRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID := httpx.TenantOrganizationID(c, request.OrganizationID)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	date, err := helper.ParseDate(&request.Date)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Date must be in YYYY-MM-DD format.", nil)
	}

	result, err := h.svc.Reverse(c, *organizationID, accrualID, helper.Deref(date, time.Time{}))
	if err != nil {
		return writeAccrualError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Accrual reversed successfully.", result)
}
