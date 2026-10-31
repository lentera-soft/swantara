package httpx

import (
	"errors"
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
)

type ErrorMapping struct {
	Err     error
	Status  int
	Message string
	Log     string
}

func NotFound(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusNotFound, Message: message}
}

func Conflict(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusConflict, Message: message}
}

func Unprocessable(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusUnprocessableEntity, Message: message}
}

func Forbidden(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusForbidden, Message: message}
}

func Unauthorized(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusUnauthorized, Message: message}
}

func BadRequest(err error, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusBadRequest, Message: message}
}

func Internal(err error, logMessage, message string) ErrorMapping {
	return ErrorMapping{Err: err, Status: http.StatusInternalServerError, Message: message, Log: logMessage}
}

func WriteMappedError(c fiber.Ctx, err error, logMessage, fallbackMessage string, mappings ...ErrorMapping) error {
	for _, mapping := range mappings {
		if mapping.Err == nil || !errors.Is(err, mapping.Err) {
			continue
		}
		switch mapping.Status {
		case http.StatusNotFound:
			return CreateNotFoundResponse(c, mapping.Message)
		case http.StatusConflict:
			return CreateConflictResponse(c, mapping.Message, err)
		case http.StatusUnprocessableEntity:
			return CreateUnprocessableEntityErrorResponse(c, mapping.Message, nil)
		case http.StatusForbidden:
			return CreateForbiddenErrorResponse(c, mapping.Message, err)
		case http.StatusUnauthorized:
			return CreateUnauthorizedErrorResponse(c, mapping.Message, err)
		case http.StatusBadRequest:
			return CreateBadRequestResponse(c, mapping.Message, err)
		default:
			log := mapping.Log
			if log == "" {
				log = logMessage
			}
			RequestLog(c).Error(log, "error", err)
			return CreateInternalServerErrorResponse(c, mapping.Message, err)
		}
	}

	if dao.IsNotFound(err) {
		return CreateNotFoundResponse(c, "Resource not found.")
	}

	RequestLog(c).Error(logMessage, "error", err)
	return CreateInternalServerErrorResponse(c, fallbackMessage, err)
}
