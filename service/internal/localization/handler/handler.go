package handler

import "github.com/jalusw/swantara/apps/service/internal/localization"

type ProfileHandler struct {
	svc localization.ProfileService
}

func NewProfileHandler(svc localization.ProfileService) ProfileHandler {
	return ProfileHandler{svc: svc}
}
