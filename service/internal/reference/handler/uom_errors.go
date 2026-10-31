package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

func writeUnitError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "unit write failed", "Failed to save UoM.",
		httpx.Unprocessable(reference.ErrUnitGroupNotFound, "UoM category does not exist."),
		httpx.Unprocessable(reference.ErrUnitNameTaken, "A UoM with this name already exists in the category."),
		httpx.Unprocessable(reference.ErrInvalidFactor, "UoM factor must be greater than zero."),
		httpx.NotFound(reference.ErrUnitNotFound, "UoM not found."),
		httpx.Unprocessable(reference.ErrUnitGroupMismatch, "UoMs belong to different categories."),
	)
}
