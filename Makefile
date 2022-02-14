PACKAGE_NAME := loco-redis
PACKAGE_VERSION = $(shell cat package.json | grep "\"version\"" | cut -d\" -f4)

test:
	yarn test

coverage:
	yarn coverage

build:
	yarn build

.ONESHELL:

release:
	@echo RELEASING VERSION $(PACKAGE_VERSION)
	$(eval GIT_STATUS = $(shell git status --porcelain=v1 2>/dev/null))
	@if [ -z "$(GIT_STATUS)" ]; then echo "Clean working dir"; else echo "\x1b[31mYou have uncommited changes. Aborting.\x1b[0m"; exit 1; fi
	yarn test
	yarn build
	npm publish --access public
	git tag $(PACKAGE_NAME)-$(PACKAGE_VERSION)
