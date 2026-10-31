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
	routeGroupPathRe  = regexp.MustCompile(`\.Group\(\s*"([^"]*)"`)
	routeMethodPathRe = regexp.MustCompile(`\.(?:Get|Post|Put|Patch|Delete|Head|Options|All)\(\s*"([^"]*)"`)
	routeDocPathRe    = regexp.MustCompile(`@Router\s+(\S+)\s+\[`)
	staticSegmentRe   = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
	paramNameRe       = regexp.MustCompile(`^:([A-Za-z0-9_]+)$`)
)

func TestEndpointPathsUseKebabCase(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatalf("resolve repo root failed: %v", err)
	}

	files, err := filepath.Glob(filepath.Join(root, "internal", "*", "handler", "*.go"))
	if err != nil {
		t.Fatalf("glob handler files failed: %v", err)
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
		text := string(content)

		paths := make([]string, 0)
		for _, match := range routeGroupPathRe.FindAllStringSubmatch(text, -1) {
			paths = append(paths, match[1])
		}
		for _, match := range routeMethodPathRe.FindAllStringSubmatch(text, -1) {
			paths = append(paths, match[1])
		}
		for _, match := range routeDocPathRe.FindAllStringSubmatch(text, -1) {
			paths = append(paths, match[1])
		}

		rel, _ := filepath.Rel(root, path)
		for _, raw := range paths {
			if !strings.HasPrefix(raw, "/") {
				continue
			}
			for _, segment := range strings.Split(strings.Trim(raw, "/"), "/") {
				if segment == "" || strings.HasPrefix(segment, "{") {
					continue
				}
				if param := paramNameRe.FindStringSubmatch(segment); param != nil {
					if param[1] != "id" && param[1] != "action" && param[1] != "method" && param[1] != "code" && !strings.HasSuffix(param[1], "_id") {
						violations = append(violations, filepath.ToSlash(rel)+": route parameter :"+param[1]+" must be :id or end with _id")
					}
					continue
				}
				if !staticSegmentRe.MatchString(segment) {
					violations = append(violations, filepath.ToSlash(rel)+": path segment "+segment+" must use kebab-case")
				}
			}
		}
	}

	if len(violations) > 0 {
		sort.Strings(violations)
		t.Fatalf("endpoint paths must use kebab-case and consistent parameters:\n%s", strings.Join(violations, "\n"))
	}
}
