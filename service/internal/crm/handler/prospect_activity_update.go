package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type UpdateProspectActivityRequest struct {
	ProspectID   *uint64 `json:"lead_id"`
	ContactID    *uint64 `json:"contact_id"`
	Type         string  `json:"type"`
	Summary      string  `json:"summary" validate:"required"`
	Note         *string `json:"note"`
	Outcome      *string `json:"outcome"`
	NextStep     *string `json:"next_step"`
	NextStepDue  *string `json:"next_step_due"`
	Participants *string `json:"participants"`
	DueDate      *string `json:"due_date"`
	Done         *bool   `json:"done"`

	AllowConsentOverride  bool    `json:"allow_consent_override"`
	ConsentOverrideReason *string `json:"consent_override_reason"`
}

type UpdateProspectActivityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateProspectActivityResponse `json:"data"`
}

type UpdateProspectActivityResponse struct {
	Activity ProspectActivityResponse `json:"activity"`
}

// @Summary Update activity
// @Description Updates a CRM activity's type, summary, note, due date, completion flag, and linked prospect or contact, validating that any referenced record exists and parsing the due date. When the activity is flagged as done for the first time, a completion timestamp is recorded.
// @Tags CRM Activities
// @Accept json
// @Produce json
// @Param id path integer true "CRM activity ID"
// @Param body body UpdateProspectActivityRequest true "Activity details"
// @Success 200 {object} UpdateProspectActivityResponseEnvelope "Activity updated successfully."
// @Failure 400 {object} httpx.ErrorResponse "Bad request"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Activity not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or unknown reference"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/crm/activities/{id} [put]
func (h ProspectActivityHandler) Update(c fiber.Ctx) error {
	activityID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid activity id provided.", nil)
	}

	var request UpdateProspectActivityRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}

	organizationID := httpx.TenantOrganizationID(c, nil)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	activity, err := h.svc.FindInOrg(c, activityID, *organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Activity not found.")
		}
		httpx.RequestLog(c).Error("crm activity lookup failed", "activity_id", activityID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update activity.", err)
	}
	if activity == nil {
		return httpx.CreateNotFoundResponse(c, "Activity not found.")
	}

	dueDate, err := helper.ParseTimestamp(request.DueDate)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid due date provided.", nil)
	}
	nextStepDue, err := helper.ParseDate(request.NextStepDue)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid next step date provided.", nil)
	}

	activity.ProspectID = request.ProspectID
	activity.ContactID = request.ContactID
	activity.Type = request.Type
	activity.Summary = request.Summary
	activity.Note = request.Note
	activity.Outcome = request.Outcome
	activity.NextStep = request.NextStep
	activity.NextStepDue = nextStepDue
	activity.Participants = request.Participants
	activity.DueDate = dueDate
	if request.Done != nil {
		activity.Done = *request.Done
	}
	activity.AllowConsentOverride = request.AllowConsentOverride
	activity.ConsentOverrideReason = request.ConsentOverrideReason

	updated, err := h.svc.UpdateActivity(c, *organizationID, activity)
	if err != nil {
		return writeProspectActivityError(c, err)
	}

	return httpx.CreateSuccessResponse(c, "Activity updated successfully.", UpdateProspectActivityResponse{
		Activity: newProspectActivityResponse(updated),
	})
}
