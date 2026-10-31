package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/interorganization"
)

func writeInterorganizationError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "interorganization write failed", "Failed to process request.",
		httpx.NotFound(interorganization.ErrDropShipSourceNotFound, "Resource not found."),
		httpx.NotFound(interorganization.ErrDropShipOrderNotFound, "Resource not found."),
		httpx.NotFound(interorganization.ErrMirrorSourceNotFound, "Resource not found."),
		httpx.NotFound(interorganization.ErrMirrorRuleMissing, "Resource not found."),
		httpx.NotFound(interorganization.ErrRuleNotFound, "Resource not found."),
		httpx.NotFound(interorganization.ErrConsolidationRunNotFound, "Resource not found."),
		httpx.Unprocessable(interorganization.ErrDropShipSourceNotActive, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrDropShipNoLines, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrDropShipAlreadyReceived, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrDropShipDestinationMiss, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrDropShipSupplierMissing, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrMirrorSourceNoLines, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrMirrorSourceNotPosted, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrMirrorRuleDisabled, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrRuleSameOrganization, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrRuleDuplicate, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrRuleRequired, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrRuleContactsRequired, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNotDraft, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNoOrg, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNoPeriod, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationPeriodMiss, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNoMember, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNoFx, "Request cannot be processed."),
		httpx.Unprocessable(interorganization.ErrConsolidationNoAccount, "Request cannot be processed."),
	)
}
