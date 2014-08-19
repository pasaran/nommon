tests:
	node_modules/.bin/mocha tests/no.jpath.js
	node_modules/.bin/mocha tests/no.events.js
	node_modules/.bin/mocha tests/no.watcher.js

build:
	uglifyjs lib/no.jpath.js > lib/no.jpath.min.js

clean:
	rm lib/no.*.min.js

.PHONY: tests

