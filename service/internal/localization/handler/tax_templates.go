package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/localization"
)

type ListTaxTemplatesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListTaxTemplatesResponse `json:"data"`
}

type ListTaxTemplatesResponse struct {
	TaxTemplateLines []TaxTemplateLineResponse `json:"tax_template_lines"`
}

// @Summary List localization tax template lines
// @Description Lists the tax template lines configured for a country localization profile.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Success 200 {object} ListTaxTemplatesResponseEnvelope "Tax template lines retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles/{id}/tax-templates [get]
func (h ProfileHandler) ListTaxTemplates(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	lines, err := h.svc.ListTaxTemplateLines(c, profileID)
	if err != nil {
		return writeProfileError(c, err)
	}
	items := make([]TaxTemplateLineResponse, len(lines))
	for i, line := range lines {
		items[i] = newTaxTemplateLineResponse(line)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Tax template lines retrieved successfully.", ListTaxTemplatesResponse{
		TaxTemplateLines: items,
	})
}

type ReplaceTaxTemplatesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ReplaceTaxTemplatesResponse `json:"data"`
}

type ReplaceTaxTemplatesResponse struct {
	TaxTemplateLines []TaxTemplateLineResponse `json:"tax_template_lines"`
}

// @Summary Replace localization tax template lines
// @Description Replaces the full set of tax template lines for a country localization profile.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Param body body ReplaceTaxTemplatesRequest true "Tax template lines"
// @Success 200 {object} ReplaceTaxTemplatesResponseEnvelope "Tax template lines replaced successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles/{id}/tax-templates [put]
func (h ProfileHandler) ReplaceTaxTemplates(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	var request ReplaceTaxTemplatesRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	lines := make([]*localization.TaxTemplateLine, len(request.Lines))
	for i, line := range request.Lines {
		lines[i] = &localization.TaxTemplateLine{
			Name:           line.Name,
			Kind:           line.Kind,
			Rate:           line.Rate,
			PriceInclude:   line.PriceInclude,
			TaxAccountCode: line.TaxAccountCode,
			Sequence:       line.Sequence,
		}
	}
	replaced, err := h.svc.ReplaceTaxTemplateLines(c, profileID, lines)
	if err != nil {
		return writeProfileError(c, err)
	}
	items := make([]TaxTemplateLineResponse, len(replaced))
	for i, line := range replaced {
		items[i] = newTaxTemplateLineResponse(line)
	}
	httpx.RequestLog(c).Info("operation completed")
	return httpx.CreateSuccessResponse(c, "Tax template lines replaced successfully.", ReplaceTaxTemplatesResponse{
		TaxTemplateLines: items,
	})
}
