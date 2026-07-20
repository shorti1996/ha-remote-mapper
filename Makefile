.PHONY: build dev clean test lint format bump-version ha-up ha-down ha-logs

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

test:
	uv run pytest

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

ha-up:
	docker compose -f docker/compose.yaml up -d

ha-down:
	docker compose -f docker/compose.yaml down

ha-logs:
	docker compose -f docker/compose.yaml logs -f homeassistant
