
REPORTER = dot

build:
	@./node_modules/.bin/browserify --standalone eio -o engine.io.js .

build-nodebug:
	@./node_modules/.bin/browserify --transform ./make-nodebug.js --standalone eio -o engine.io.nodebug.js .


test:
	@./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		test/index.js
	@./node_modules/.bin/zuul -- test/index.js

test-cov:
	@./node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha -- \
		--require ./test/common \
		--reporter $(REPORTER) \
		$(TESTS)

.PHONY: test
