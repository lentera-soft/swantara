package inquiry

import (
	"time"

	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

const (
	StatusNew      = "new"
	StatusReviewed = "reviewed"
	StatusArchived = "archived"
)

type ContactInquiry struct {
	model.Base
	OrganizationID *uint64 `json:"organization_id"`
	ProspectID     *uint64 `json:"prospect_id"`
	Name           string  `json:"name"`
	Email          string  `json:"email" audit:"redact"`
	Company        *string `json:"company"`
	Message        string  `json:"message"`
	Status         string  `gorm:"type:text;not null;default:new" json:"status"`
	Source         *string `json:"source"`
	Medium         *string `json:"medium"`
	Campaign       *string `json:"campaign"`

	ConversionClaimID   *string    `gorm:"column:conversion_claim_id" json:"-"`
	ConversionClaimedAt *time.Time `gorm:"column:conversion_claimed_at" json:"-"`
}

func (ContactInquiry) TableName() string {
	return "contact_inquiries"
}
