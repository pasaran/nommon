tests:
	mocha tests/no.jpath.js

build:
	uglifyjs lib/no.jpath.js > lib/no.jpath.min.js

clean:
	rm lib/no.*.min.js

.PHONY: tests

