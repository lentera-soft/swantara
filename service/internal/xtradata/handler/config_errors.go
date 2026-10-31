package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
)

func writeSystemConfigError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "system config write failed", "Failed to save system config.",
		httpx.Conflict(xtradata.ErrConfigKeyExists, "System config key already exists."),
	)
}
