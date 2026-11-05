package handler

import (
	"bufio"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
)

type ContactAvatarHandler struct {
	avatarSvc contacts.ContactAvatarService
}

func NewContactAvatarHandler(avatarSvc contacts.ContactAvatarService) ContactAvatarHandler {
	return ContactAvatarHandler{avatarSvc: avatarSvc}
}

type UpdateContactAvatarResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateContactAvatarResponse `json:"data"`
}
type UpdateContactAvatarResponse struct {
	Avatar string `json:"avatar"`
}

// @Summary Upload contact avatar
// @Description Uploads an image file to storage and links it to the contact after enforcing tenant ownership. The multipart form must include a "file" field containing an image.
// @Tags Contacts
// @Accept multipart/form-data
// @Produce json
// @Param organization_id path integer true "Organization ID"
// @Param id path integer true "Contact ID"
// @Param file formData file true "Avatar image file"
// @Success 200 {object} UpdateContactAvatarResponseEnvelope "Avatar updated successfully."
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Contact not found"
// @Failure 422 {object} httpx.ErrorResponse "Validation error"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/contacts/{id}/avatar [patch]
func (h ContactAvatarHandler) Update(c fiber.Ctx) error {
	contactID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid contact id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	file, err := c.FormFile("file")
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "A file field is required.", nil)
	}
	src, err := file.Open()
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Failed to read uploaded file.", nil)
	}
	defer func() { _ = src.Close() }()

	avatarID, err := h.avatarSvc.Upload(c, contactID, organizationID, src)
	if err != nil {
		switch {
		case errors.Is(err, contacts.ErrAvatarEmpty):
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Avatar content cannot be empty.", nil)
		case errors.Is(err, contacts.ErrAvatarInvalidType):
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Avatar must be an image.", nil)
		case errors.Is(err, contacts.ErrContactNotFound):
			return httpx.CreateNotFoundResponse(c, "Contact not found.")
		default:
			httpx.RequestLog(c).Error("contact avatar upload failed", "contact_id", contactID, "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to update avatar.", err)
		}
	}

	httpx.RequestLog(c).Info("contact avatar updated", "contact_id", contactID)
	return httpx.CreateSuccessResponse(c, "Avatar updated successfully.", UpdateContactAvatarResponse{
		Avatar: avatarID,
	})
}

// @Summary Get contact avatar
// @Description Streams the stored avatar image for a contact after enforcing tenant ownership, returning 404 when the contact or avatar does not exist.
// @Tags Contacts
// @Produce image/png
// @Param organization_id path integer true "Organization ID"
// @Param id path integer true "Contact ID"
// @Success 200 {string} binary "Avatar image"
// @Failure 401 {object} httpx.ErrorResponse "Unauthorized"
// @Failure 404 {object} httpx.ErrorResponse "Avatar not found"
// @Failure 500 {object} httpx.ErrorResponse "Internal server error"
// @Security BearerAuth
// @Router /organizations/{organization_id}/contacts/{id}/avatar [get]
func (h ContactAvatarHandler) Get(c fiber.Ctx) error {
	contactID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid contact id provided.", nil)
	}
	organizationID, ok := httpx.CallerOrganizationID(c)
	if !ok {
		return httpx.CreateUnauthorizedErrorResponse(c, "Unauthorized.", httpx.ErrMissingOrganizationInContext)
	}

	reader, err := h.avatarSvc.Download(c, contactID, organizationID)
	if err != nil {
		switch {
		case errors.Is(err, contacts.ErrAvatarNotFound):
			return httpx.CreateNotFoundResponse(c, "Avatar not found.")
		default:
			httpx.RequestLog(c).Error("contact avatar download failed", "contact_id", contactID, "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve avatar.", err)
		}
	}
	defer func() { _ = reader.Close() }()

	buffered := bufio.NewReader(reader)
	head, err := buffered.Peek(512)
	if err != nil && !errors.Is(err, io.EOF) {
		httpx.RequestLog(c).Error("contact avatar download failed", "contact_id", contactID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to retrieve avatar.", err)
	}
	c.Set(fiber.HeaderContentType, http.DetectContentType(head))
	c.Set(fiber.HeaderCacheControl, "private, max-age=300")
	return c.SendStream(buffered)
}
