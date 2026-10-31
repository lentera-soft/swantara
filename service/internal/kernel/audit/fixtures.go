//go:build test

package audit

import (
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
)

type saleOrder struct {
	model.Base
	Code        string
	State       string
	AmountTotal string
}

type postedMove struct {
	model.Base
	State string
}

func (m postedMove) IsPosted() bool {
	return m.State == "posted"
}

type plainRecord struct {
	Name string
}

type secretRecord struct {
	model.Base
	Token string `json:"token" audit:"redact"`
	State string `json:"state"`
}

type tenantRecord struct {
	model.Base
	OrganizationID uint64
	Code           string
}

type tenantPointerRecord struct {
	model.Base
	OrganizationID *uint64
	Code           string
}
