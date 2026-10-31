package reference

import "context"

type VariantExistenceChecker interface {
	VariantExists(ctx context.Context, id uint64) (bool, error)
}
