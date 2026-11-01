package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
)

type ShiftAssignmentHandler struct {
	svc payroll.HRService
}

func NewShiftAssignmentHandler(svc payroll.HRService) ShiftAssignmentHandler {
	return ShiftAssignmentHandler{svc: svc}
}

func (h ShiftAssignmentHandler) ensureAssignmentInOrg(c fiber.Ctx, assignmentID uint64) error {
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	assignment, err := h.svc.FindShiftAssignmentInOrg(c, assignmentID, organizationID)
	if err != nil {
		return writeHRError(c, err)
	}
	if assignment == nil {
		return httpx.CreateNotFoundResponse(c, "Resource not found.")
	}
	return nil
}

type ShiftAssignmentResponse struct {
	ID         uint64 `json:"id"`
	EmployeeID uint64 `json:"employee_id"`
	ShiftID    uint64 `json:"shift_id"`
	Date       string `json:"date"`
}

func newShiftAssignmentResponse(a *payroll.ShiftAssignment) ShiftAssignmentResponse {
	return ShiftAssignmentResponse{
		ID:         a.ID,
		EmployeeID: a.EmployeeID,
		ShiftID:    a.ShiftID,
		Date:       a.Date.Format("2006-01-02"),
	}
}

type CreateShiftAssignmentRequest struct {
	EmployeeID uint64 `json:"employee_id" validate:"required"`
	ShiftID    uint64 `json:"shift_id" validate:"required"`
	Date       string `json:"date" validate:"required"`
}

type ShiftAssignmentResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ShiftAssignmentResponse `json:"data"`
}

func (h ShiftAssignmentHandler) Create(c fiber.Ctx) error {
	var request CreateShiftAssignmentRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	date, err := helper.ParseDate(&request.Date)
	if err != nil || date == nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Date must be in YYYY-MM-DD format.", nil)
	}
	assignment, err := h.svc.CreateShiftAssignment(c, &payroll.ShiftAssignment{
		EmployeeID: request.EmployeeID,
		ShiftID:    request.ShiftID,
		Date:       *date,
	})
	if err != nil {
		return writeHRError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateCreatedResponse(c, "Shift assignment created successfully.", newShiftAssignmentResponse(assignment))
}

func (h ShiftAssignmentHandler) Delete(c fiber.Ctx) error {
	assignmentID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid assignment id provided.", nil)
	}
	if err := h.ensureAssignmentInOrg(c, assignmentID); err != nil {
		return err
	}
	if err := h.svc.DeleteShiftAssignment(c, assignmentID); err != nil {
		return writeHRError(c, err)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateNoContentResponse(c)
}
