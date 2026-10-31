package hardening

import (
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"testing"
)

var (
	routeGroupRe = regexp.MustCompile(`\.Group\("([^"]+)"`)
	routeDocRe   = regexp.MustCompile(`@Router\s+(/[^\s\[]+)`)
)

var globalRoutePrefixes = map[string]bool{
	"auth":                  true,
	"contact-inquiries":     true,
	"countries":             true,
	"currencies":            true,
	"localization-profiles": true,
	"organizations":         true,
	"unit-groups":           true,
	"units":                 true,
	"users":                 true,
}

func TestSwaggerRoutesMatchRegisteredGroups(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatalf("resolve repo root failed: %v", err)
	}

	handlerDirs, err := filepath.Glob(filepath.Join(root, "internal", "*", "handler"))
	if err != nil {
		t.Fatalf("glob handler directories failed: %v", err)
	}

	var violations []string
	for _, dir := range handlerDirs {
		files, err := filepath.Glob(filepath.Join(dir, "*.go"))
		if err != nil {
			t.Fatalf("glob handler files failed: %v", err)
		}

		groups := make(map[string]bool)
		documented := make(map[string]bool)
		for _, file := range files {
			if strings.HasSuffix(file, "_test.go") {
				continue
			}
			content, err := os.ReadFile(file)
			if err != nil {
				t.Fatalf("read %s failed: %v", file, err)
			}
			text := string(content)
			for _, match := range routeGroupRe.FindAllStringSubmatch(text, -1) {
				groups[strings.Split(strings.Trim(match[1], "/"), "/")[0]] = true
			}
			for _, match := range routeDocRe.FindAllStringSubmatch(text, -1) {
				docPath := match[1]
				const orgPrefix = "/organizations/{organization_id}/"
				if strings.HasPrefix(docPath, orgPrefix) {
					segment := strings.Split(strings.Trim(strings.TrimPrefix(docPath, orgPrefix), "/"), "/")[0]
					if segment != "" && !strings.HasPrefix(segment, "{") {
						documented[segment] = true
					}
					continue
				}
				first := strings.Split(strings.Trim(docPath, "/"), "/")[0]
				if !globalRoutePrefixes[first] {
					rel, _ := filepath.Rel(root, file)
					violations = append(violations, filepath.ToSlash(rel)+": swagger route "+docPath+" must use /organizations/{organization_id}/ prefix")
				}
			}
		}

		for segment := range documented {
			if !groups[segment] {
				rel, _ := filepath.Rel(root, dir)
				violations = append(violations, filepath.ToSlash(rel)+": swagger documents unregistered route prefix /"+segment)
			}
		}
	}

	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("swagger @Router paths must match registered route groups:\n%s", strings.Join(violations, "\n"))
	}
}
