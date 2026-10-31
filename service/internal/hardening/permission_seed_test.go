package hardening

import (
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"
)

type permissionSeed struct {
	Permissions []struct {
		Resource string `json:"resource"`
		Action   string `json:"action"`
	} `json:"permissions"`
	OrgPermissions []struct {
		Resource string   `json:"resource"`
		Actions  []string `json:"actions"`
	} `json:"org_permissions"`
}

var (
	guardResourceRe     = regexp.MustCompile(`Guard\("([^"]+)",\s*"([^"]+)"`)
	servicePermissionRe = regexp.MustCompile(`(?s)UserHasOrganizationPermission\([^)]*?"([^"]+)"\s*,\s*"([^"]+)"\)`)
)

func loadSeededPermissions(t *testing.T) (string, map[string]map[string]bool) {
	t.Helper()

	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatalf("resolve repo root failed: %v", err)
	}

	raw, err := os.ReadFile(filepath.Join(root, "internal", "seeders", "data", "iam_seed.json"))
	if err != nil {
		t.Fatalf("read iam seed failed: %v", err)
	}
	var seed permissionSeed
	if err := json.Unmarshal(raw, &seed); err != nil {
		t.Fatalf("parse iam seed failed: %v", err)
	}

	seeded := make(map[string]map[string]bool)
	for _, permission := range seed.Permissions {
		if seeded[permission.Resource] == nil {
			seeded[permission.Resource] = make(map[string]bool)
		}
		seeded[permission.Resource][permission.Action] = true
	}
	for _, permission := range seed.OrgPermissions {
		if seeded[permission.Resource] == nil {
			seeded[permission.Resource] = make(map[string]bool)
		}
		for _, action := range permission.Actions {
			seeded[permission.Resource][action] = true
		}
	}

	return root, seeded
}

func TestGuardResourcesAreSeededPermissions(t *testing.T) {
	root, seeded := loadSeededPermissions(t)

	patterns := []string{
		filepath.Join(root, "internal", "*", "handler", "*.go"),
		filepath.Join(root, "internal", "kernel", "*", "handler", "*.go"),
	}
	var files []string
	for _, pattern := range patterns {
		matches, err := filepath.Glob(pattern)
		if err != nil {
			t.Fatalf("glob handler files failed: %v", err)
		}
		files = append(files, matches...)
	}

	var violations []string
	for _, path := range files {
		if strings.HasSuffix(path, "_test.go") {
			continue
		}
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s failed: %v", path, err)
		}
		for _, match := range guardResourceRe.FindAllStringSubmatch(string(content), -1) {
			resource, action := match[1], match[2]
			if !seeded[resource][action] {
				rel, _ := filepath.Rel(root, path)
				violations = append(violations, filepath.ToSlash(rel)+": guard uses unseeded permission "+resource+"."+action)
			}
		}
	}

	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("every route guard must reference a permission defined in iam_seed.json:\n%s", strings.Join(violations, "\n"))
	}
}

func TestServicePermissionChecksAreSeededPermissions(t *testing.T) {
	root, seeded := loadSeededPermissions(t)

	var violations []string
	err := filepath.WalkDir(filepath.Join(root, "internal"), func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			if entry.Name() == "docs" {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		for _, match := range servicePermissionRe.FindAllStringSubmatch(string(content), -1) {
			resource, action := match[1], match[2]
			if !seeded[resource][action] {
				rel, _ := filepath.Rel(root, path)
				violations = append(violations, filepath.ToSlash(rel)+": service check uses unseeded permission "+resource+"."+action)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("scan service permission checks failed: %v", err)
	}

	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("every service permission check must reference a permission defined in iam_seed.json:\n%s", strings.Join(violations, "\n"))
	}
}
