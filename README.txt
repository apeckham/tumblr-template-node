Render a tumblr template with the Javascript renderer written by Tumblr.

## To run ##

cat your-tumblr-template.html | coffee render.coffee --content-map your-content-map.js

## To get your blog's content map ##

The content map is JSON with all of your blog's variables (title, colors, sample posts)

- Open https://www.tumblr.com/customize
- javascript:copy(JSON.stringify(Tumblr.Template.content_map))

## theme_engine.js ##

scripts/theme_engine.js was extracted from https://secure.assets.tumblr.com/assets/scripts/customize_v3.js?_v=7ad8863121a935576a791f1e0ece9b60

... which is one of the script tags on https://www.tumblr.com/customize

It is the code starting at "/*! scripts/theme_engine.js */"

## underscore ##

curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js >scripts/underscore.js

## jquery ##

curl http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js >scripts/jquery.js