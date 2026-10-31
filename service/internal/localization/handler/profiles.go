package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/localization"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ListProfilesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListProfilesResponse `json:"data"`
}

type ListProfilesResponse struct {
	Profiles []ProfileResponse `json:"localization_profiles"`
}

// @Summary List localization profiles
// @Description Lists country localization profiles with pagination, sorting, and filtering.
// @Tags Localization
// @Accept json
// @Produce json
// @Param page query integer false "Page number" default(1)
// @Param size query integer false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort fields (comma separated, e.g. country_code:asc)"
// @Param filter query string false "Filters (repeatable, e.g. country_code:eq:ID)"
// @Param format query string false "Response format" Enums(json, xml, csv)
// @Success 200 {object} ListProfilesResponseEnvelope "Localization profiles retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 422 {object} httpx.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles [get]
func (h ProfileHandler) List(c fiber.Ctx) error {
	parsedQuery, err := httpx.ParseQueryParams(c, profileQueryAllowlist)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid query parameters.", nil)
	}

	page, err := h.svc.ListProfiles(c, parsedQuery)
	if err != nil {
		httpx.RequestLog(c).Error("localization profile list failed", "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve localization profiles.", err)
	}

	items := make([]ProfileResponse, len(page.Items))
	for i, profile := range page.Items {
		items[i] = newProfileResponse(profile)
	}

	if httpx.RequestFormat(c) == httpx.FormatCSV {
		return httpx.ExportCSV(c, fiber.StatusOK, "localization-profiles.csv", items)
	}

	return httpx.CreateSuccessResponseWithMeta(c, "Localization profiles retrieved successfully.", ListProfilesResponse{
		Profiles: items,
	}, httpx.BuildListMeta(parsedQuery, page.Count))
}

type GetProfileResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetProfileResponse `json:"data"`
}

type GetProfileResponse struct {
	Profile ProfileResponse `json:"localization_profile"`
}

// @Summary Get localization profile
// @Description Returns a single country localization profile by id.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Success 200 {object} GetProfileResponseEnvelope "Localization profile retrieved successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles/{id} [get]
func (h ProfileHandler) Get(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	profile, err := h.svc.FindProfile(c, profileID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Localization profile not found.")
		}
		httpx.RequestLog(c).Error("localization profile lookup failed", "profile_id", profileID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve localization profile.", err)
	}
	if profile == nil {
		return httpx.CreateNotFoundResponse(c, "Localization profile not found.")
	}
	return httpx.CreateSuccessResponse(c, "Localization profile retrieved successfully.", GetProfileResponse{
		Profile: newProfileResponse(profile),
	})
}

type CreateProfileResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateProfileResponse `json:"data"`
}

type CreateProfileResponse struct {
	Profile ProfileResponse `json:"localization_profile"`
}

// @Summary Create localization profile
// @Description Creates a country localization profile describing currency, locale, timezone, and fiscal year.
// @Tags Localization
// @Accept json
// @Produce json
// @Param body body CreateProfileRequest true "Localization profile details"
// @Success 201 {object} CreateProfileResponseEnvelope "Localization profile created successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 409 {object} httpx.ErrorResponse "Localization profile already exists for this country"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles [post]
func (h ProfileHandler) Create(c fiber.Ctx) error {
	var request CreateProfileRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	active := true
	if request.Active != nil {
		active = *request.Active
	}
	profile, err := h.svc.CreateProfile(c, &localization.Profile{
		Name:              request.Name,
		CountryCode:       request.CountryCode,
		CurrencyCode:      request.CurrencyCode,
		Locale:            request.Locale,
		Timezone:          request.Timezone,
		DateFormat:        request.DateFormat,
		TaxYearStartMonth: request.TaxYearStartMonth,
		Active:            active,
	})
	if err != nil {
		return writeProfileError(c, err)
	}
	return httpx.CreateCreatedResponse(c, "Localization profile created successfully.", CreateProfileResponse{
		Profile: newProfileResponse(profile),
	})
}

type UpdateProfileResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateProfileResponse `json:"data"`
}

type UpdateProfileResponse struct {
	Profile ProfileResponse `json:"localization_profile"`
}

// @Summary Update localization profile
// @Description Updates a country localization profile by id.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Param body body UpdateProfileRequest true "Localization profile details"
// @Success 200 {object} UpdateProfileResponseEnvelope "Localization profile updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile not found"
// @Failure 409 {object} httpx.ErrorResponse "Localization profile already exists for this country"
// @Failure 422 {object} httpx.ErrorResponse "Validation error or invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles/{id} [put]
func (h ProfileHandler) Update(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	var request UpdateProfileRequest
	if !httpx.BindAndValidate(c, &request) {
		return nil
	}
	profile, err := h.svc.FindProfile(c, profileID)
	if err != nil {
		if dao.IsNotFound(err) {
			return httpx.CreateNotFoundResponse(c, "Localization profile not found.")
		}
		httpx.RequestLog(c).Error("localization profile lookup failed", "profile_id", profileID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to update localization profile.", err)
	}
	if profile == nil {
		return httpx.CreateNotFoundResponse(c, "Localization profile not found.")
	}
	profile.Name = request.Name
	profile.CountryCode = request.CountryCode
	profile.CurrencyCode = request.CurrencyCode
	profile.Locale = request.Locale
	profile.Timezone = request.Timezone
	profile.DateFormat = request.DateFormat
	profile.TaxYearStartMonth = request.TaxYearStartMonth
	if request.Active != nil {
		profile.Active = *request.Active
	}
	updated, err := h.svc.UpdateProfile(c, profile)
	if err != nil {
		return writeProfileError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Localization profile updated successfully.", UpdateProfileResponse{
		Profile: newProfileResponse(updated),
	})
}

// @Summary Delete localization profile
// @Description Deletes a country localization profile by id.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Success 204 "No Content"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /localization-profiles/{id} [delete]
func (h ProfileHandler) Delete(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	if err := h.svc.DeleteProfile(c, profileID); err != nil {
		return writeProfileError(c, err)
	}
	return httpx.CreateNoContentResponse(c)
}

type ApplyProfileResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ApplyProfileResponse `json:"data"`
}

type ApplyProfileResponse struct {
	Profile ProfileResponse `json:"localization_profile"`
}

// @Summary Apply localization profile to organization
// @Description Applies a localization profile to the caller's organization, updating its country, base currency, timezone, and fiscal year start month.
// @Tags Localization
// @Accept json
// @Produce json
// @Param id path integer true "Localization profile ID"
// @Success 200 {object} ApplyProfileResponseEnvelope "Localization profile applied successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Localization profile or organization not found"
// @Failure 422 {object} httpx.ErrorResponse "Invalid id"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Param organization_id path integer true "Organization ID"
// @Router /organizations/{organization_id}/localization-profiles/{id}/apply [post]
func (h ProfileHandler) Apply(c fiber.Ctx) error {
	profileID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid localization profile id provided.", nil)
	}
	organizationID := httpx.TenantOrganizationID(c, nil)
	if organizationID == nil {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}
	profile, err := h.svc.ApplyProfile(c, *organizationID, profileID)
	if err != nil {
		return writeProfileError(c, err)
	}
	return httpx.CreateSuccessResponse(c, "Localization profile applied successfully.", ApplyProfileResponse{
		Profile: newProfileResponse(profile),
	})
}
