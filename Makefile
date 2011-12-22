
TESTS = $(shell find test -depth 1 -name '*.js' -type f ! -name 'common.js')
REPORTER = dot

build:
	@./node_modules/.bin/browserbuild -g eio -f engine.io.js -m engine.io-client lib/

test:
	@./node_modules/.bin/mocha \
		--require $(shell pwd)/test/common \
		--reporter $(REPORTER) \
		--growl \
		$(TESTS)

test-browser:
	./node_modules/.bin/serve test/

.PHONY: test
