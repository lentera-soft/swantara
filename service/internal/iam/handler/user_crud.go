package handler

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/iam"
)

func (h UserHandler) GetUserAvatar(c fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || userID == 0 {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid user id provided.", nil)
	}
	return h.serveAvatar(c, userID)
}

type CreateUserRequest struct {
	Username    string  `json:"username" validate:"required"`
	FirstName   string  `json:"first_name" validate:"required"`
	LastName    *string `json:"last_name"`
	Email       string  `json:"email" validate:"required,email"`
	Phone       *string `json:"phone"`
	Password    string  `json:"password" validate:"required,min=8,max=72"`
	Birthday    *string `json:"birthday"`
	Sex         *string `json:"sex"`
	Address     *string `json:"address"`
	City        *string `json:"city"`
	PostalCode  *string `json:"postal_code"`
	Country     *string `json:"country"`
	CountryCode *string `json:"country_code"`
}

type CreateUserResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateUserResponse `json:"data"`
}
type CreateUserResponse struct {
	User PublicUser `json:"user"`
}

func (h UserHandler) CreateUser(c fiber.Ctx) error {
	var request CreateUserRequest
	if !bindAndValidate(c, &request) {
		return nil
	}

	birthday, ok := parseBirthday(c, request.Birthday)
	if !ok {
		return nil
	}

	user, err := h.userSvc.Create(c, &iam.User{
		Username:    request.Username,
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		Email:       request.Email,
		Phone:       request.Phone,
		Password:    request.Password,
		Birthday:    birthday,
		Sex:         request.Sex,
		Address:     request.Address,
		City:        request.City,
		PostalCode:  request.PostalCode,
		Country:     request.Country,
		CountryCode: request.CountryCode,
	})
	if err != nil {
		switch {
		case errors.Is(err, iam.ErrEmailRegistered):
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Email is already registered.", nil)
		case errors.Is(err, iam.ErrUsernameTaken):
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Username is already taken.", nil)
		case errors.Is(err, iam.ErrPhoneTaken):
			return httpx.CreateUnprocessableEntityErrorResponse(c, "Phone is already registered.", nil)
		default:
			httpx.RequestLog(c).Error("user creation failed", "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to create user.", err)
		}
	}

	httpx.RequestLog(c).Info("user created", "user_id", user.ID)

	return httpx.CreateCreatedResponse(c, "User created successfully.", CreateUserResponse{
		User: newPublicUser(user),
	})
}

type UpdateUserRequest struct {
	FirstName   string  `json:"first_name" validate:"required"`
	LastName    *string `json:"last_name"`
	Avatar      *string `json:"avatar"`
	Bio         *string `json:"bio"`
	Birthday    *string `json:"birthday"`
	Active      *bool   `json:"active"`
	Sex         *string `json:"sex" validate:"omitempty,oneof=male female other"`
	Address     *string `json:"address"`
	City        *string `json:"city"`
	PostalCode  *string `json:"postal_code"`
	Country     *string `json:"country"`
	CountryCode *string `json:"country_code"`
}

type UpdateUserResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateUserResponse `json:"data"`
}
type UpdateUserResponse struct {
	User PublicUser `json:"user"`
}

func (h UserHandler) UpdateUser(c fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid user id provided.", nil)
	}

	if err := ensureSelf(c, userID); err != nil {
		return writeAccessError(c, err)
	}

	var request UpdateUserRequest
	if !bindAndValidate(c, &request) {
		return nil
	}

	birthday, ok := parseBirthday(c, request.Birthday)
	if !ok {
		return nil
	}

	user, err := h.userSvc.Update(c, userID, &iam.User{
		FirstName:   request.FirstName,
		LastName:    request.LastName,
		Avatar:      request.Avatar,
		Bio:         request.Bio,
		Birthday:    birthday,
		Sex:         request.Sex,
		Address:     request.Address,
		City:        request.City,
		PostalCode:  request.PostalCode,
		Country:     request.Country,
		CountryCode: request.CountryCode,
	}, request.Active)
	if err != nil {
		switch {
		case errors.Is(err, iam.ErrUserNotFound):
			return httpx.CreateNotFoundResponse(c, "User not found.")
		default:
			httpx.RequestLog(c).Error("user update failed", "user_id", userID, "error", err)
			return httpx.CreateInternalServerErrorResponse(c, "Failed to update user.", err)
		}
	}

	httpx.RequestLog(c).Info("user updated", "user_id", userID)

	return httpx.CreateSuccessResponse(c, "User updated successfully.", UpdateUserResponse{
		User: newPublicUser(user),
	})
}

func (h UserHandler) DeleteUser(c fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return httpx.CreateUnprocessableEntityErrorResponse(c, "Invalid user id provided.", nil)
	}

	if err := h.userDao.Delete(c, userID); err != nil {
		httpx.RequestLog(c).Error("user deletion failed", "user_id", userID, "error", err)
		return httpx.CreateInternalServerErrorResponse(c, "Failed to delete user.", err)
	}

	httpx.RequestLog(c).Info("user deleted", "user_id", userID)

	return httpx.CreateNoContentResponse(c)
}
