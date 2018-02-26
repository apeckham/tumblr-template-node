default:
	cat Makefile

.PHONY: example
example:
	node render.js example/template.html example/content_map.json >example/output.html
	diff example/expected_output.html example/output.html
