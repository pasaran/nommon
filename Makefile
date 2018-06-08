test: test_events test_date test_jpath test_jsetter test_number test_promise test_string test_watcher

test_events:
	node_modules/.bin/mocha tests/no.events.js

test_date:
	node_modules/.bin/mocha tests/no.date.js

test_jpath:
	node_modules/.bin/mocha tests/no.jpath.js

test_jsetter:
	node_modules/.bin/mocha tests/jsetter.js

test_number:
	node_modules/.bin/mocha tests/no.number.js

test_promise:
	node_modules/.bin/mocha tests/no.promise.js

test_string:
	node_modules/.bin/mocha tests/no.string.js

test_watcher:
	node_modules/.bin/mocha tests/no.watcher.js

lint:
	node_modules/.bin/eslint lib/*.js

.PHONY: lint test test_events test_date test_jpath test_jsetter test_number test_promise test_string test_watcher

