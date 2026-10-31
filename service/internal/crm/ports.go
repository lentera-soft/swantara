package crm

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/iam"
)

// MemberDirectory resolves organization membership for CRM owner assignment.
type MemberDirectory interface {
	IsActiveMember(ctx context.Context, userID, organizationID uint64) (bool, error)
}

// UserLookup resolves display names for owner-based reporting.
type UserLookup interface {
	Find(ctx context.Context, id uint64) (*iam.User, error)
}
