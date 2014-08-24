jsdom = require 'jsdom'
rw = require 'rw'
argv = require('yargs')
  .usage("Usage: $0 --content-map content_map.json")
  .demand(['content-map'])
  .default(in: '/dev/stdin', out: '/dev/stdout')
  .argv

content_map = JSON.parse rw.readFileSync(argv['content-map'], 'utf8')

jsdom.env
  html: '<div></div>'
  scripts: [ 'scripts/jquery.js', 'scripts/underscore.js', 'scripts/theme_engine.js' ]
  created: (error, window) ->
    window.TumblrData =
      feature: {}

  done: (errors, window) ->
    window.Tumblr.Template.set_content_map content_map

    window.Tumblr.Template.set_template(rw.readFileSync(argv.in, 'utf8'))
    rw.writeFileSync argv.out, window.Tumblr.Template.render(), 'utf8'
