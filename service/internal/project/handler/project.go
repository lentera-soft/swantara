package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/project"
)

type ProjectResponse struct {
	ID             uint64     `json:"id"`
	OrganizationID uint64     `json:"organization_id"`
	Name           string     `json:"name"`
	ContactID      uint64     `json:"contact_id"`
	ManagerID      *uint64    `json:"manager_id"`
	DimensionID    *uint64    `json:"dimension_id"`
	SaleOrderID    *uint64    `json:"sale_order_id"`
	BillingType    string     `json:"billing_type"`
	BillableRate   float64    `json:"billable_rate"`
	DateStart      *time.Time `json:"date_start"`
	DateEnd        *time.Time `json:"date_end"`
	State          string     `json:"state"`
}

func newProjectResponse(p *project.Project) ProjectResponse {
	return ProjectResponse{
		ID:             p.ID,
		OrganizationID: p.OrganizationID,
		Name:           p.Name,
		ContactID:      p.ContactID,
		ManagerID:      p.ManagerID,
		DimensionID:    p.DimensionID,
		SaleOrderID:    p.SaleOrderID,
		BillingType:    p.BillingType,
		BillableRate:   p.BillableRate,
		DateStart:      p.DateStart,
		DateEnd:        p.DateEnd,
		State:          p.State,
	}
}

type ProjectHandler struct {
	svc project.ProjectService
}

func NewProjectHandler(
	svc project.ProjectService,
) ProjectHandler {
	return ProjectHandler{svc: svc}
}

var projectQueryAllowlist = map[string]struct{}{
	"organization_id": {},
	"contact_id":      {},
	"manager_id":      {},
	"dimension_id":    {},
	"billing_type":    {},
	"state":           {},
	"created_at":      {},
	"updated_at":      {},
}

func writeProjectError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "project write failed", "Failed to process request.",
		httpx.NotFound(project.ErrProjectNotFound, "Resource not found."),
		httpx.NotFound(project.ErrProjectContactNotFound, "Resource not found."),
		httpx.NotFound(project.ErrProjectDimensionNotFound, "Resource not found."),
		httpx.NotFound(project.ErrProjectTaskNotFound, "Resource not found."),
		httpx.NotFound(project.ErrProjectMilestoneNotFound, "Resource not found."),
		httpx.Unprocessable(project.ErrProjectInvalidState, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectNotTimeMaterial, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectNoBillableRate, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectNothingToBill, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectNoRevenueAccount, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectCostNotAttributable, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectInvalidBillingType, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectInvalidDates, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectTaskNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectInvalidHours, "Request cannot be processed."),
		httpx.Unprocessable(project.ErrProjectMilestoneNameRequired, "Request cannot be processed."),
	)
}
