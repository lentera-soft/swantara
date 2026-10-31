package hardening

import (
	"io/fs"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// tenantScopeMigratedDomains lists domains that have adopted the canonical
// tenant-scoping rule: organization scoping is enforced in the service/DAO
// layer (ListInOrg/FindInOrg, or scoped DAO methods) instead of in handlers.
// Domains are migrated incrementally; add each domain here once its handlers
// no longer call httpx.ForceTenantFilter or httpx.OwnsTenant.
var tenantScopeMigratedDomains = map[string]bool{
	"accounting":        true,
	"asset":             true,
	"commission":        true,
	"contacts":          true,
	"crm":               true,
	"crosscutting":      true,
	"expense":           true,
	"giftcard":          true,
	"iam":               true,
	"interorganization": true,
	"kernel/audit":      true,
	"inventory":         true,
	"localization":      true,
	"manufacturing":     true,
	"organization":      true,
	"payroll":           true,
	"pos":               true,
	"procurement":       true,
	"products":          true,
	"project":           true,
	"quality":           true,
	"reference":         true,
	"reporting":         true,
	"returns":           true,
	"sales":             true,
	"service":           true,
	"subscription":      true,
	"xtradata":          true,
}

func TestMigratedDomainsScopeTenantInServiceLayer(t *testing.T) {
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
		parts := strings.Split(clean, "/")
		if len(parts) < 3 || parts[0] != "internal" {
			return nil
		}
		domain := parts[1]
		handlerIndex := 2
		if domain == "kernel" {
			if len(parts) < 4 {
				return nil
			}
			domain = "kernel/" + parts[2]
			handlerIndex = 3
		}
		if parts[handlerIndex] != "handler" || !tenantScopeMigratedDomains[domain] {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		for i, text := range strings.Split(string(content), "\n") {
			if strings.Contains(text, "httpx.ForceTenantFilter") || strings.Contains(text, "httpx.OwnsTenant") {
				violations = append(violations, clean+":"+strconv.Itoa(i+1)+" uses handler-level tenant scoping")
			}
		}
		return nil
	})
	if err != nil {
		t.Fatalf("scan failed: %v", err)
	}
	if len(violations) > 0 {
		t.Fatalf("migrated domains must scope tenants in the service/DAO layer:\n%s", strings.Join(violations, "\n"))
	}
}
