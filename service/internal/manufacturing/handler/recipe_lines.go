package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ListRecipeLinesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListRecipeLinesResponse `json:"data"`
}
type ListRecipeLinesResponse struct {
	Lines []RecipeLineResponse `json:"lines"`
}

// @Summary List recipe lines
// @Description Lists the component lines of a tenant-scoped bill of materials, including each component's quantity, unit of measure, scrap percentage, and associated operation. Results can be exported in CSV format when requested.
// @Tags recipes
// @Accept json
// @Produce json
// @Param id path integer true "recipe ID"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListRecipeLinesResponseEnvelope "recipe lines retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "recipe not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/recipes/{id}/lines [get]
func (h RecipeHandler) ListLines(c fiber.Ctx) error {
	recipeID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid recipe id provided.", nil)
	}

	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	recipe, err := h.svc.FindInOrg(c, recipeID, organizationID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "recipe not found.")
		}
		httpx.RequestLog(c).Error("recipe lookup failed", "recipe_id", recipeID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve recipe lines.", err)
	}
	if recipe == nil {
		return httpx.CreateNotFoundResponse(c, "recipe not found.")
	}

	lines, err := h.svc.ListLines(c, recipeID)
	if err != nil {
		httpx.RequestLog(c).Error("recipe line list failed", "recipe_id", recipeID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve recipe lines.", err)
	}

	items := make([]RecipeLineResponse, len(lines))
	for i, line := range lines {
		items[i] = newRecipeLineResponse(line)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "recipe-lines.csv", items)
	}

	return httpx.CreateSuccessResponse(c, "recipe lines retrieved successfully.", ListRecipeLinesResponse{
		Lines: items,
	})
}
