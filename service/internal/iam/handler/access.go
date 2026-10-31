package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/iam"
)

func ensureSelf(c fiber.Ctx, targetUserID uint64) error {
	userID, ok := httpx.CallerID(c)
	if !ok {
		return httpx.ErrMissingUserInContext
	}

	if userID == targetUserID {
		return nil
	}

	return iam.ErrForbidden
}

func writeAccessError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "access verification failed", "Failed to verify access.",
		httpx.Forbidden(iam.ErrForbidden, "Forbidden."),
		httpx.Unauthorized(httpx.ErrMissingUserInContext, "Unauthorized."),
	)
}
