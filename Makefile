.PHONY: build dev clean test test-frontend lint format bump-version release ha-up ha-down ha-logs

FRONTEND := custom_components/remote_mapper/frontend

# Usage: $(call jq-set,FILTER,FILE)  e.g. $(call jq-set,.version = "1.0",package.json)
define jq-set
	jq '$(1)' $(2) > $(2).tmp && mv $(2).tmp $(2)
endef

# Prompt for VERSION if not provided, then re-invoke the given target.
define require-version
	@cur=$$(cat VERSION 2>/dev/null || echo "unknown"); \
	printf "Enter version (current: $$cur): "; \
	read ver; \
	if [ -z "$$ver" ]; then echo "No version provided."; exit 1; fi; \
	$(MAKE) $(1) VERSION=$$ver
endef

build:
	# Production frontend build — minified, no sourcemaps
	cd $(FRONTEND) && npm ci && npm run build

dev:
	# Development frontend build — unminified, sourcemaps
	cd $(FRONTEND) && npm ci && npm run dev

clean:
	rm -rf custom_components/remote_mapper/www/*

test: test-frontend
	uv run pytest

test-frontend:
	cd $(FRONTEND) && npm test

lint:
	uv run ruff check .
	uv run ruff format --check .

format:
	uv run ruff format .
	uv run ruff check --fix .

# Example: make bump-version VERSION=0.2.0
bump-version:
ifndef VERSION
	$(call require-version,bump-version)
else
	@echo "Bumping version to $(VERSION)..."
	@test -f $(FRONTEND)/package.json || (echo "Missing frontend package.json" && exit 1)
	@test -f pyproject.toml || (echo "Missing pyproject.toml" && exit 1)
	$(call jq-set,.version = "$(VERSION)",$(FRONTEND)/package.json)
	$(call jq-set,.version = "$(VERSION)",custom_components/remote_mapper/manifest.json)
	sed -i 's/^version = ".*"/version = "$(VERSION)"/' pyproject.toml
	echo "$(VERSION)" > VERSION
	@echo "Versions updated."
endif

# One-shot release: bump → rebuild card → test → commit → tag → push.
# GitHub's release.yml then builds the zip and publishes the release
# (HACS installs from that asset). Usage: make release VERSION=x.y.z
GH_REMOTE ?= github
release:
ifndef VERSION
	$(call require-version,release)
else
	@git diff --quiet && git diff --cached --quiet || { echo "Working tree not clean — commit or stash first."; exit 1; }
	@[ "$$(git rev-parse --abbrev-ref HEAD)" = "master" ] || { echo "Release from master."; exit 1; }
	$(MAKE) bump-version VERSION=$(VERSION)
	uv lock
	cd $(FRONTEND) && npm ci && npm run build
	uv run pytest -q
	cd $(FRONTEND) && npm test
	git add -A
	git diff --cached --quiet || git commit -m "chore: release v$(VERSION)"
	git tag -a v$(VERSION) -m "v$(VERSION)"
	git push $(GH_REMOTE) master v$(VERSION)
	-git remote get-url origin >/dev/null 2>&1 && [ "$(GH_REMOTE)" != "origin" ] && git push origin master v$(VERSION)
	@echo "Tag v$(VERSION) pushed — watch https://github.com/shorti1996/ha-remote-mapper/actions"
endif

ha-up:
	docker compose -f docker/compose.yaml up -d

ha-down:
	docker compose -f docker/compose.yaml down

ha-logs:
	docker compose -f docker/compose.yaml logs -f homeassistant
