package clock

import "time"

// Clock returns the current time.
type Clock func() time.Time

// System returns the default wall clock.
func System() Clock {
	return time.Now
}

var current = System()

// Now returns the current time from the active clock.
func Now() time.Time {
	return current()
}

// Set replaces the active clock and returns a function that restores the previous one.
func Set(c Clock) func() {
	previous := current
	if c == nil {
		c = System()
	}
	current = c
	return func() {
		current = previous
	}
}
