package hardening

import (
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestDomainsDoNotImportOtherDomainHandlers(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatalf("resolve repo root failed: %v", err)
	}

	var violations []string
	err = filepath.WalkDir(filepath.Join(root, "internal"), func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return err
		}
		clean := filepath.ToSlash(rel)
		if !strings.HasSuffix(clean, ".go") || strings.HasSuffix(clean, "_test.go") {
			return nil
		}

		sourceDomain := domainOf(clean)
		if sourceDomain == "" {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		for line, text := range strings.Split(string(content), "\n") {
			line++
			const marker = "internal/"
			idx := strings.Index(text, marker)
			if idx < 0 {
				continue
			}
			importPath := strings.TrimSpace(text[idx+len(marker):])
			importPath = strings.TrimSuffix(importPath, `"`)
			parts := strings.Split(importPath, "/")
			if len(parts) < 2 || parts[1] != "handler" {
				continue
			}
			targetDomain := parts[0]
			if targetDomain != sourceDomain {
				violations = append(violations, clean+":"+strconv.Itoa(line)+" imports "+targetDomain+"/handler")
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("scan failed: %v", err)
	}
	if len(violations) > 0 {
		t.Fatalf("cross-domain handler imports are forbidden:\n%s", strings.Join(violations, "\n"))
	}
}

func domainOf(rel string) string {
	parts := strings.Split(rel, "/")
	if len(parts) < 2 || parts[0] != "internal" {
		return ""
	}
	switch parts[1] {
	case "kernel", "httpx", "config", "db", "helper", "logger", "mail", "queue", "storage", "seeders", "hardening", "systemconfig", "jobs":
		return ""
	default:
		return parts[1]
	}
}
