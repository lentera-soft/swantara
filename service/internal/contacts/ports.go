package contacts

import "context"

// EmployeeRoleReader reports which of the given contacts are backed by an
// active employee record. It is implemented by the payroll module's employee
// store, letting contacts annotate the employee role without importing
// payroll.
type EmployeeRoleReader interface {
	ListEmployeeContactIDs(ctx context.Context, contactIDs []uint64) ([]uint64, error)
}
