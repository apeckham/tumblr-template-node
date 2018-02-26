Local Tumblr template renderer, using the actual parser from Tumblr's customize page

# To run

`make example` renders `example/template.html` + `example/content_map.json` into `example/output.html`

# To get a blog's content map

A content map is JSON with all of the blog's variables (title, colors, sample posts)

- open https://www.tumblr.com/customize
- in the developer console, `javascript:copy(JSON.stringify(Tumblr.Template.content_map))`

# scripts/theme_engine.js

scripts/theme_engine.js was extracted from one of the script tags on https://www.tumblr.com/customize:

https://secure.assets.tumblr.com/assets/scripts/customize_v3.js?_v=7ad8863121a935576a791f1e0ece9b60

It starts at `/*! scripts/theme_engine.js */`