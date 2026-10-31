package handler

import (
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type OpportunityHandler struct {
	stages dao.CRUD[reference.PipelineStage]
	svc    crm.ProspectService
}

func NewOpportunityHandler(stages dao.CRUD[reference.PipelineStage], svc crm.ProspectService) OpportunityHandler {
	return OpportunityHandler{stages: stages, svc: svc}
}

type ListCRMOpportunitiesResponseEnvelope struct {
	httpx.EnvelopeBase
	Data ListCRMOpportunitiesResponse `json:"data"`
}
type ListCRMOpportunitiesResponse struct {
	Opportunities []ProspectResponse `json:"opportunities"`
}

type GetCRMOpportunityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data GetCRMOpportunityResponse `json:"data"`
}
type GetCRMOpportunityResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}

type CreateCRMOpportunityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data CreateCRMOpportunityResponse `json:"data"`
}
type CreateCRMOpportunityResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}

type UpdateCRMOpportunityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data UpdateCRMOpportunityResponse `json:"data"`
}
type UpdateCRMOpportunityResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}

type AdvanceStageResponseEnvelope struct {
	httpx.EnvelopeBase
	Data AdvanceStageResponse `json:"data"`
}
type AdvanceStageResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}

type WinOpportunityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data WinOpportunityResponse `json:"data"`
}
type WinOpportunityResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}

type LoseOpportunityResponseEnvelope struct {
	httpx.EnvelopeBase
	Data LoseOpportunityResponse `json:"data"`
}
type LoseOpportunityResponse struct {
	Opportunity ProspectResponse `json:"opportunity"`
}
