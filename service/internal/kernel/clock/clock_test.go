package clock

import (
	"testing"
	"time"
)

func TestNowUsesSystemClockByDefault(t *testing.T) {
	before := time.Now()
	got := Now()
	after := time.Now()

	if got.Before(before) || got.After(after) {
		t.Fatalf("Now() = %v, want between %v and %v", got, before, after)
	}
}

func TestSetOverridesClockAndRestoresPrevious(t *testing.T) {
	fixed := time.Date(2024, time.March, 1, 12, 0, 0, 0, time.UTC)
	restore := Set(func() time.Time { return fixed })
	defer restore()

	if got := Now(); !got.Equal(fixed) {
		t.Fatalf("Now() = %v, want %v", got, fixed)
	}

	restore()

	if got := Now(); got.Equal(fixed) {
		t.Fatal("Now() still uses the overridden clock after restore")
	}
}

func TestSetNilRestoresSystemClock(t *testing.T) {
	fixed := time.Date(2024, time.March, 1, 12, 0, 0, 0, time.UTC)
	restore := Set(func() time.Time { return fixed })
	defer restore()

	restoreNil := Set(nil)
	if got := Now(); got.Equal(fixed) {
		t.Fatal("Set(nil) must fall back to the system clock")
	}
	restoreNil()
}
