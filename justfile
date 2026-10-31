set dotenv-load

mod web "web/justfile"
mod service "service/justfile"

default:
    @just --list --list-submodules

dev: web::dev

dev-service: service::dev

lint: web::lint service::lint

test: web::test service::test

[group('deploy')]
up:
    docker compose -f docker-compose.prod.yml up -d --build

[group('deploy')]
down:
    docker compose -f docker-compose.prod.yml down

[group('deploy')]
logs:
    docker compose -f docker-compose.prod.yml logs -f

[group('deploy')]
backup:
    docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U swantara_app -d swantara -Fc > swantara-backup-$(date +%F).dump

[group('deploy')]
status:
    docker compose -f docker-compose.prod.yml ps

setup:
    (cd web && pnpm install)
    just service::deps
    @echo "setup: done. Run 'just dev' or 'just doctor'"

[group('maintenance')]
notices:
    node scripts/generate-third-party-notices.mjs

doctor:
    #!/usr/bin/env sh
    set -eu
    echo "node: $(node --version 2>/dev/null || echo 'missing')"
    echo "pnpm: $(pnpm --version 2>/dev/null || echo 'missing')"
    echo "go: $(go version 2>/dev/null || echo 'missing')"
    echo "docker: $(docker --version 2>/dev/null | head -n1 || echo 'missing')"
    echo "just: $(just --version 2>/dev/null || echo 'missing')"
    echo "doctor: done"
