package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/payroll"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type AttendanceHandler struct {
	svc payroll.HRService
}

func NewAttendanceHandler(svc payroll.HRService) AttendanceHandler {
	return AttendanceHandler{svc: svc}
}

type AttendanceResponse struct {
	ID                    uint64   `json:"id"`
	OrganizationID        uint64   `json:"organization_id"`
	EmployeeID            uint64   `json:"employee_id"`
	CheckIn               *string  `json:"check_in"`
	CheckOut              *string  `json:"check_out"`
	WorkedHours           float64  `json:"worked_hours"`
	Status                string   `json:"status"`
	AttendanceType        string   `json:"attendance_type"`
	Source                string   `json:"source"`
	BreakMinutes          int      `json:"break_minutes"`
	OvertimeHours         float64  `json:"overtime_hours"`
	LateMinutes           int      `json:"late_minutes"`
	EarlyDepartureMinutes int      `json:"early_departure_minutes"`
	Notes                 *string  `json:"notes"`
	ConfirmedAt           *string  `json:"confirmed_at"`
	Latitude              *float64 `json:"latitude"`
	Longitude             *float64 `json:"longitude"`
	DeviceID              *string  `json:"device_id"`
	IPAddress             *string  `json:"ip_address"`
	UserAgent             *string  `json:"user_agent"`
}

func newAttendanceResponse(attendance *payroll.Attendance) AttendanceResponse {
	response := AttendanceResponse{
		ID:                    attendance.ID,
		OrganizationID:        attendance.OrganizationID,
		EmployeeID:            attendance.EmployeeID,
		WorkedHours:           attendance.WorkedHours,
		Status:                attendance.Status,
		AttendanceType:        attendance.AttendanceType,
		Source:                attendance.Source,
		BreakMinutes:          attendance.BreakMinutes,
		OvertimeHours:         attendance.OvertimeHours,
		LateMinutes:           attendance.LateMinutes,
		EarlyDepartureMinutes: attendance.EarlyDepartureMinutes,
		Notes:                 attendance.Notes,
		Latitude:              attendance.Latitude,
		Longitude:             attendance.Longitude,
		DeviceID:              attendance.DeviceID,
		IPAddress:             attendance.IPAddress,
		UserAgent:             attendance.UserAgent,
	}
	if attendance.CheckIn != nil {
		value := attendance.CheckIn.Format(time.RFC3339)
		response.CheckIn = &value
	}
	if attendance.CheckOut != nil {
		value := attendance.CheckOut.Format(time.RFC3339)
		response.CheckOut = &value
	}
	if attendance.ConfirmedAt != nil {
		value := attendance.ConfirmedAt.Format(time.RFC3339)
		response.ConfirmedAt = &value
	}
	return response
}

type CheckInRequest struct {
	EmployeeID     uint64   `json:"employee_id" validate:"required,gt=0"`
	CheckIn        string   `json:"check_in" validate:"required"`
	AttendanceType string   `json:"attendance_type"`
	Source         string   `json:"source"`
	Notes          *string  `json:"notes"`
	Latitude       *float64 `json:"latitude"`
	Longitude      *float64 `json:"longitude"`
	DeviceID       *string  `json:"device_id"`
}

type ListAttendancesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []AttendanceResponse `json:"data"`
}

type AttendanceResponseEnvelope struct {
	httpx.EnvelopeBase
	Data AttendanceResponse `json:"data"`
}

type ListMissingAttendancesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []EmployeeResponse `json:"data"`
}

var attendanceQueryAllowlist = map[string]struct{}{
	"employee_id":     {},
	"check_in":        {},
	"check_out":       {},
	"status":          {},
	"attendance_type": {},
	"source":          {},
}

// @Summary List attendances
// @Description Lists attendances with pagination, sorting, and filtering. Queries are restricted to allowlisted fields (employee, check-in, check-out, status, type, and source), and invalid query parameters return a 422 response.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated)"
// @Param filter query string false "Filters (repeatable)"
// @Success 200 {object} ListAttendancesResponseEnvelope "Attendances retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances [get]
func (h AttendanceHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, attendanceQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	page, err := h.svc.ListAttendancesInOrg(c, parsedQuery, organizationID)
	if err != nil {
		httpx.RequestLog(c).Error("attendance list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve attendances.", err)
	}
	items := make([]AttendanceResponse, len(page.Items))
	for i, attendance := range page.Items {
		items[i] = newAttendanceResponse(attendance)
	}
	return httpx.CreateSuccessResponseWithMeta(c, "Attendances retrieved successfully.", items, httpx.BuildListMeta(parsedQuery, page.Count))
}

// @Summary Get attendance
// @Description Gets a single attendance by id. The id must be a valid positive integer, and a 404 response is returned when no matching attendance exists in the caller's organization.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Success 200 {object} AttendanceResponseEnvelope "Attendance retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id} [get]
func (h AttendanceHandler) Get(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	attendance, err := h.svc.FindAttendance(c, attendanceID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Attendance not found.")
		}
		httpx.RequestLog(c).Error("attendance lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get attendance.", err)
	}
	if attendance == nil {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok || attendance.OrganizationID != organizationID {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	return httpx.CreateSuccessResponse(c, "Attendance retrieved successfully.", newAttendanceResponse(attendance))
}

// @Summary Record attendance check-in
// @Description Records a check-in for an employee. The check-in time must be in RFC3339 format, and the employee must exist in the caller's organization.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param request body CheckInRequest true "Attendance check-in details"
// @Success 201 {object} AttendanceResponseEnvelope "Check in recorded successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/check-in [post]
func (h AttendanceHandler) CheckIn(c fiber.Ctx) error {
	var request CheckInRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	checkIn, err := time.Parse(time.RFC3339, request.CheckIn)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Check in must be in RFC3339 format.", nil)
	}
	ip := c.IP()
	ua := httpx.UserAgent(c)
	attendance := &payroll.Attendance{
		EmployeeID:     request.EmployeeID,
		CheckIn:        &checkIn,
		AttendanceType: request.AttendanceType,
		Source:         request.Source,
		Notes:          request.Notes,
		Latitude:       request.Latitude,
		Longitude:      request.Longitude,
		DeviceID:       request.DeviceID,
		IPAddress:      &ip,
		UserAgent:      &ua,
	}
	created, err := h.svc.CheckIn(c, attendance)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Check in recorded successfully.", newAttendanceResponse(created))
}

type CheckOutRequest struct {
	CheckOut     string `json:"check_out" validate:"required"`
	BreakMinutes int    `json:"break_minutes"`
}

// @Summary Record attendance check-out
// @Description Records a check-out for an existing attendance. The check-out time must be in RFC3339 format.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Param request body CheckOutRequest true "Attendance check-out details"
// @Success 200 {object} AttendanceResponseEnvelope "Check out recorded successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id}/check-out [post]
func (h AttendanceHandler) CheckOut(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	var request CheckOutRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	checkOut, err := time.Parse(time.RFC3339, request.CheckOut)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Check out must be in RFC3339 format.", nil)
	}
	attendance, err := h.svc.CheckOut(c, attendanceID, checkOut, request.BreakMinutes)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Check out recorded successfully.", newAttendanceResponse(attendance))
}

type UpdateAttendanceRequest struct {
	AttendanceType        string  `json:"attendance_type"`
	Source                string  `json:"source"`
	BreakMinutes          int     `json:"break_minutes"`
	LateMinutes           int     `json:"late_minutes"`
	EarlyDepartureMinutes int     `json:"early_departure_minutes"`
	Notes                 *string `json:"notes"`
}

// @Summary Update attendance
// @Description Updates an existing attendance record in the caller's organization. The attendance must exist and the request body must contain valid fields.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Param request body UpdateAttendanceRequest true "Attendance update details"
// @Success 200 {object} AttendanceResponseEnvelope "Attendance updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id} [put]
func (h AttendanceHandler) Update(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	attendance, err := h.svc.FindAttendance(c, attendanceID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Attendance not found.")
		}
		httpx.RequestLog(c).Error("attendance lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get attendance.", err)
	}
	if attendance == nil {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok || attendance.OrganizationID != organizationID {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	var request UpdateAttendanceRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	attendance.AttendanceType = request.AttendanceType
	attendance.Source = request.Source
	attendance.BreakMinutes = request.BreakMinutes
	attendance.LateMinutes = request.LateMinutes
	attendance.EarlyDepartureMinutes = request.EarlyDepartureMinutes
	attendance.Notes = request.Notes
	updated, err := h.svc.UpdateAttendance(c, attendance)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Attendance updated successfully.", newAttendanceResponse(updated))
}

// @Summary Delete attendance
// @Description Deletes an attendance by id. The attendance must exist in the caller's organization, and a successful deletion returns no content.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Success 204 {object} httpx.EmptyEnvelope "Attendance deleted successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id} [delete]
func (h AttendanceHandler) Delete(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	attendance, err := h.svc.FindAttendance(c, attendanceID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Attendance not found.")
		}
		httpx.RequestLog(c).Error("attendance lookup failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to get attendance.", err)
	}
	if attendance == nil {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok || attendance.OrganizationID != organizationID {
		return httpx.CreateNotFoundResponse(c, "Attendance not found.")
	}
	if err := h.svc.DeleteAttendance(c, attendanceID); err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateNoContentResponse(c)
}

type BulkCheckOutRequest struct {
	AttendanceIDs []uint64 `json:"attendance_ids" validate:"required"`
	CheckOut      string   `json:"check_out" validate:"required"`
	BreakMinutes  int      `json:"break_minutes"`
}

type BulkCheckOutResponseEnvelope struct {
	httpx.EnvelopeBase
	Data []AttendanceResponse `json:"data"`
}

// @Summary Bulk check out attendances
// @Description Records check-outs for multiple attendance records. The check-out time must be in RFC3339 format, and all attendance ids must be valid.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param request body BulkCheckOutRequest true "Bulk check-out details"
// @Success 200 {object} BulkCheckOutResponseEnvelope "Bulk check out recorded successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/bulk-check-out [post]
func (h AttendanceHandler) BulkCheckOut(c fiber.Ctx) error {
	var request BulkCheckOutRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	checkOut, err := time.Parse(time.RFC3339, request.CheckOut)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Check out must be in RFC3339 format.", nil)
	}
	records, err := h.svc.BulkCheckOut(c, request.AttendanceIDs, checkOut, request.BreakMinutes)
	if err != nil {
		return writeHRError(c, err)
	}
	items := make([]AttendanceResponse, len(records))
	for i, record := range records {
		items[i] = newAttendanceResponse(record)
	}
	return httpx.CreateSuccessResponse(c, "Bulk check out recorded successfully.", items)
}

type ListMissingRequest struct {
	Date string `json:"date" validate:"required"`
}

// @Summary List missing attendances
// @Description Lists employees without an attendance record for the given date. The date query parameter is required and must be in YYYY-MM-DD format.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param date query string true "Date (YYYY-MM-DD)"
// @Success 200 {object} ListMissingAttendancesResponseEnvelope "Missing attendances retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/missing [get]
func (h AttendanceHandler) ListMissing(c fiber.Ctx) error {
	date := c.Query("date")
	if date == "" {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Date parameter is required.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	employees, err := h.svc.ListMissingAttendance(c, organizationID, date)
	if err != nil {
		httpx.RequestLog(c).Error("missing attendance list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve missing attendances.", err)
	}
	items := make([]EmployeeResponse, len(employees))
	for i, employee := range employees {
		items[i] = newEmployeeResponse(employee)
	}
	return httpx.CreateSuccessResponse(c, "Missing attendances retrieved successfully.", items)
}

// @Summary Approve attendance
// @Description Approves an existing attendance record. The attendance must exist and be in a state that allows approval.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Success 200 {object} AttendanceResponseEnvelope "Attendance approved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id}/approve [post]
func (h AttendanceHandler) Approve(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	attendance, err := h.svc.ApproveAttendance(c, attendanceID)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Attendance approved successfully.", newAttendanceResponse(attendance))
}

// @Summary Reject attendance
// @Description Rejects an existing attendance record. The attendance must exist and be in a state that allows rejection.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param id path integer true "Attendance ID"
// @Success 200 {object} AttendanceResponseEnvelope "Attendance rejected successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Attendance not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/{id}/reject [post]
func (h AttendanceHandler) Reject(c fiber.Ctx) error {
	attendanceID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid attendance id provided.", nil)
	}
	attendance, err := h.svc.RejectAttendance(c, attendanceID)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Attendance rejected successfully.", newAttendanceResponse(attendance))
}

type AutoCheckoutRequest struct {
	OrganizationID uint64 `json:"organization_id" validate:"required"`
}

type AutoCheckoutResponse struct {
	CheckedOut int `json:"checked_out"`
}

type AutoCheckoutResponseEnvelope struct {
	httpx.EnvelopeBase
	Data AutoCheckoutResponse `json:"data"`
}

// @Summary Auto check out attendances
// @Description Automatically checks out open attendance records for the given organization.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param request body AutoCheckoutRequest true "Auto check-out details"
// @Success 200 {object} AutoCheckoutResponseEnvelope "Auto checkout completed."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Resource not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/auto-checkout [post]
func (h AttendanceHandler) AutoCheckout(c fiber.Ctx) error {
	var request AutoCheckoutRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	results, err := h.svc.AutoCheckout(c, request.OrganizationID)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Auto checkout completed.", AutoCheckoutResponse{CheckedOut: len(results)})
}

type MarkAbsentRequest struct {
	Date string `json:"date" validate:"required"`
}

type MarkAbsentResponse struct {
	Marked int `json:"marked"`
}

type MarkAbsentResponseEnvelope struct {
	httpx.EnvelopeBase
	Data MarkAbsentResponse `json:"data"`
}

// @Summary Mark absent employees
// @Description Marks employees without attendance for the given date as absent. The date must be in YYYY-MM-DD format.
// @Tags Attendances
// @Accept json
// @Produce json
// @Param request body MarkAbsentRequest true "Absence marking details"
// @Success 200 {object} MarkAbsentResponseEnvelope "Absences marked."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/attendances/mark-absent [post]
func (h AttendanceHandler) MarkAbsent(c fiber.Ctx) error {
	var request MarkAbsentRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	orgID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", nil)
	}
	results, err := h.svc.MarkAbsent(c, orgID, request.Date)
	if err != nil {
		return writeHRError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Absences marked.", MarkAbsentResponse{Marked: len(results)})
}
