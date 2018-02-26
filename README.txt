Render a tumblr template with Tumblr's Javascript renderer.

## To run ##

`make example`

## To get a blog's content map ##

The content map is JSON with all of your blog's variables (title, colors, sample posts)

- open https://www.tumblr.com/customize
- javascript:copy(JSON.stringify(Tumblr.Template.content_map))

## theme_engine.js ##

scripts/theme_engine.js was extracted from one of the script tags on https://www.tumblr.com/customize

https://secure.assets.tumblr.com/assets/scripts/customize_v3.js?_v=7ad8863121a935576a791f1e0ece9b60

It starts at "/*! scripts/theme_engine.js */"