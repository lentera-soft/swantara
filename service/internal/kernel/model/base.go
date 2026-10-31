package model

import (
	"time"

	"gorm.io/gorm"
)

type Base struct {
	ID        uint64         `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

func (b Base) GetID() uint64 {
	return b.ID
}

type Tenant struct {
	OrganizationID uint64 `gorm:"index;not null" json:"organization_id"`
}

type Status string
