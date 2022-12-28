.PHONY: build-CommonLayer

build-CommonLayer:
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)/nodejs/"
	npm install
	rm "$(ARTIFACTS_DIR)/nodejs/package.json" # to avoid rebuilding when changes doesn't relate to dependencies
	rm -rf dist
	npm run compile
	cp -r dist "${ARTIFACTS_DIR}/nodejs/common"
	cp -r node_modules "${ARTIFACTS_DIR}/nodejs"
