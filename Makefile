tests: test_jpath test_events test_watcher test_date test_string test_number

test_jpath:
	node_modules/.bin/mocha tests/no.jpath.js

test_events:
	node_modules/.bin/mocha tests/no.events.js

test_watcher:
	node_modules/.bin/mocha tests/no.watcher.js

test_date:
	node_modules/.bin/mocha tests/no.date.js

test_string:
	node_modules/.bin/mocha tests/no.string.js

test_number:
	node_modules/.bin/mocha tests/no.number.js

jshint:
	jshint lib/*.js

build:
	uglifyjs lib/no.jpath.js > lib/no.jpath.min.js

clean:
	rm lib/no.*.min.js

.PHONY: tests test_jpath test_events test_watcher test_date jshint build clean

