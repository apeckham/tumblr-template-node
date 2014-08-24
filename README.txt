Render a tumblr template with the Javascript renderer written by Tumblr.

## To run ##

cat your-tumblr-template.html | coffee render.coffee --content-map your-content-map.js

## To get your blog's content map ##

- Open https://www.tumblr.com/customize
- javascript:copy(JSON.stringify(Tumblr.Template.content_map))

## tumblr_template.js ##

scripts/tumblr_template.js was extracted from https://secure.assets.tumblr.com/assets/scripts/customize_v3/quick_update.js

... which is one of the script tags on https://www.tumblr.com/customize/

## underscore ##

curl http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js >scripts/underscore.js

## jquery ##

curl http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js >scripts/jquery.js