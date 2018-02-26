const { Document } = require('nodom');
global.document = new Document();
global.window = {location: {protocol: "https"}};

var TumblrData = {feature: {}};

var fs = require('fs');

eval(fs.readFileSync('scripts/theme_engine.js', 'utf8'));

function render(content_map, template) {
  Tumblr.Template.set_content_map(content_map);
  Tumblr.Template.set_template(template);
  return Tumblr.Template.render();
}

var content_map = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
var template = fs.readFileSync(process.argv[2], 'utf8');
process.stdout.write(render(content_map, template))
