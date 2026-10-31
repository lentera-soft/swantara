package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/service"
)

func writeServiceError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "service write failed", "Failed to process request.",
		httpx.NotFound(service.ErrEquipmentNotFound, "Resource not found."),
		httpx.NotFound(service.ErrContractNotFound, "Resource not found."),
		httpx.NotFound(service.ErrOrderNotFound, "Resource not found."),
		httpx.NotFound(service.ErrPlanNotFound, "Resource not found."),
		httpx.Unprocessable(service.ErrEquipmentNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrContractNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrContractInvalidState, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderInvalidType, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderInvalidState, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderLineInvalidType, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderLineInvalidQty, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderLineInvalidPrice, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderNoLines, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderNotDone, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderNotCompleted, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderRequiresJournal, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderRequiresAccounts, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderRequiresContact, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderEmptyLines, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrOrderContactForCOGS, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrPlanNameRequired, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrPlanIntervalInvalid, "Request cannot be processed."),
		httpx.Unprocessable(service.ErrPlanNextDueRequired, "Request cannot be processed."),
	)
}
