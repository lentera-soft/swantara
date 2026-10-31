package handler

import (
	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
)

type WarehouseHandler struct {
	svc inventory.WarehouseService
}

func NewWarehouseHandler(
	svc inventory.WarehouseService,
) WarehouseHandler {
	return WarehouseHandler{svc: svc}
}

func writeWarehouseError(c fiber.Ctx, err error) error {
	return httpx.WriteMappedError(c, err, "warehouse write failed", "Failed to save warehouse.",
		httpx.Unprocessable(inventory.ErrWarehouseNameRequired, "Warehouse name is required."),
		httpx.Conflict(inventory.ErrWarehouseCodeTaken, "Warehouse code already exists."),
		httpx.Unprocessable(inventory.ErrWarehouseNotFound, "Warehouse does not exist."),
		httpx.Unprocessable(inventory.ErrLocationNameRequired, "Stock location name is required."),
		httpx.Unprocessable(inventory.ErrInvalidLocationType, "Stock location usage is invalid."),
		httpx.Unprocessable(inventory.ErrLocationParent, "Stock location parent does not exist."),
		httpx.Unprocessable(inventory.ErrWarehouseMismatch, "Stock location organization does not match its warehouse."),
	)
}
