package seeders

import "testing"

func TestSeedDataLoaders(t *testing.T) {
	loaders := []struct {
		name string
		load func() error
	}{
		{"iam", func() error { _, err := loadIamSeed(); return err }},
		{"currencies", func() error { _, err := LoadCurrencySeed(); return err }},
		{"countries", func() error { _, err := LoadCountrySeed(); return err }},
		{"accounting", func() error { _, err := loadAccountingSeed(); return err }},
		{"inventory", func() error { _, err := loadInventorySeed(); return err }},
		{"manufacturing", func() error { _, err := loadManufacturingSeed(); return err }},
		{"hr", func() error { _, err := loadHRSeed(); return err }},
		{"hr bahasa", func() error { _, err := loadHRSeed("id"); return err }},
		{"crm", func() error { _, err := loadCRMSeed(); return err }},
		{"pos", func() error { _, err := loadPOSSeed(); return err }},
		{"subscription", func() error { _, err := loadSubscriptionSeed(); return err }},
		{"system", func() error { _, err := loadSystemSeed(); return err }},
		{"localization", func() error { _, err := loadLocalizationSeed(); return err }},
	}

	for _, tt := range loaders {
		t.Run(tt.name, func(t *testing.T) {
			if err := tt.load(); err != nil {
				t.Fatalf("seed data failed to load: %v", err)
			}
		})
	}
}

func TestHRSeedLanguageVariants(t *testing.T) {
	english, err := loadHRSeed("en")
	if err != nil {
		t.Fatal(err)
	}
	bahasa, err := loadHRSeed("id")
	if err != nil {
		t.Fatal(err)
	}

	if english.Departments[0] != "General Management" {
		t.Errorf("english first department = %q", english.Departments[0])
	}
	if bahasa.Departments[0] != "Manajemen Umum" {
		t.Errorf("bahasa first department = %q", bahasa.Departments[0])
	}
	if len(english.Departments) != len(bahasa.Departments) {
		t.Errorf("department counts differ: en=%d id=%d", len(english.Departments), len(bahasa.Departments))
	}
	if len(english.JobPositions) != len(bahasa.JobPositions) {
		t.Errorf("job position counts differ: en=%d id=%d", len(english.JobPositions), len(bahasa.JobPositions))
	}
}

func TestIamSeedData(t *testing.T) {
	seed, err := loadIamSeed()
	if err != nil {
		t.Fatal(err)
	}

	if len(seed.permissions) != 350 {
		t.Errorf("permissions: got %d, want 350", len(seed.permissions))
	}
}

func TestIamSeedPermissionCodesAreUnique(t *testing.T) {
	seed, err := loadIamSeed()
	if err != nil {
		t.Fatal(err)
	}

	seen := make(map[string]bool, len(seed.permissions))
	for _, permission := range seed.permissions {
		if seen[permission.Code] {
			t.Errorf("duplicate permission code: %s", permission.Code)
		}
		seen[permission.Code] = true
	}
}
