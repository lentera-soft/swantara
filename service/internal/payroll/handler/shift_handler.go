package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
)

type ShiftHandler struct {
	svc payroll.HRService
}

func NewShiftHandler(svc payroll.HRService) ShiftHandler {
	return ShiftHandler{svc: svc}
}

func (h ShiftHandler) ensureShiftInOrg(c fiber.Ctx, shiftID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	shift, err := h.svc.FindShiftInOrg(c, shiftID, organizationID)
	if err != nil {
		return writeHRError(c, err)
	}
	if shift == nil {
		return httpx.CreateNotFoundResponse(c, "Resource not found.")
	}
	return nil
}

type ShiftResponse struct {
	ID             uint64 `json:"id"`
	OrganizationID uint64 `json:"organization_id"`
	Name           string `json:"name"`
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
}

func newShiftResponse(shift *payroll.Shift) ShiftResponse {
	return ShiftResponse{
		ID:             shift.ID,
		OrganizationID: shift.OrganizationID,
		Name:           shift.Name,
		StartTime:      shift.StartTime,
		EndTime:        shift.EndTime,
	}
}

type CreateShiftRequest struct {
	OrganizationID uint64 `json:"organization_id" validate:"required"`
	Name           string `json:"name" validate:"required"`
	StartTime      string `json:"start_time" validate:"required"`
	EndTime        string `json:"end_time" validate:"required"`
}

type ShiftResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ShiftResponse `json:"data"`
}

type ListShiftsResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []ShiftResponse `json:"data"`
}

var shiftQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"name":            {},
}

func (h ShiftHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, shiftQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	page, err := h.svc.ListShiftsInOrg(c, parsedQuery, organizationID)
	if err != nil {
		return writeHRError(c, err)
	}
	items := make([]ShiftResponse, len(page.Items))
	for i, shift := range page.Items {
		items[i] = newShiftResponse(shift)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponseWithMeta(c, "Shifts retrieved successfully.", items, httpx.BuildListMeta(parsedQuery, page.Count))
}

func (h ShiftHandler) Create(c fiber.Ctx) error {
	var request CreateShiftRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	shift, err := h.svc.CreateShift(c, &payroll.Shift{
		OrganizationID: organizationID,
		Name:           request.Name,
		StartTime:      request.StartTime,
		EndTime:        request.EndTime,
	})
	if err != nil {
		return writeHRError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Shift created successfully.", newShiftResponse(shift))
}

func (h ShiftHandler) Update(c fiber.Ctx) error {
	shiftID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid shift id provided.", nil)
	}
	var request CreateShiftRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	if err := h.ensureShiftInOrg(c, shiftID); err != nil {
		return err
	}
	shift, err := h.svc.UpdateShift(c, &payroll.Shift{
		Base:      model.Base{ID: shiftID},
		Name:      request.Name,
		StartTime: request.StartTime,
		EndTime:   request.EndTime,
	})
	if err != nil {
		return writeHRError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Shift updated successfully.", newShiftResponse(shift))
}

func (h ShiftHandler) Delete(c fiber.Ctx) error {
	shiftID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid shift id provided.", nil)
	}
	if err := h.ensureShiftInOrg(c, shiftID); err != nil {
		return err
	}
	if err := h.svc.DeleteShift(c, shiftID); err != nil {
		return writeHRError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
