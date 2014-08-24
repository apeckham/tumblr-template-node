/*! scripts/theme_engine.js */
var Tumblr = Tumblr || {};
Tumblr.Template = (function () {
    var token_tree, content_map;
    var pattern = /^\{([a-zA-Z0-9][a-zA-Z0-9\-\/=" ]*|select\:[a-zA-Z0-9 ]+|font\:[a-zA-Z0-9 ]+|text\:[a-zA-Z0-9 ]+|image\:[a-zA-Z0-9 ]+|color\:[a-zA-Z0-9 ]+|RGBcolor\:[a-zA-Z0-9 ]+|lang\:[a-zA-Z0-9\- ]+)\}/ig;
    var token_pattern = /\{([a-zA-Z0-9][a-zA-Z0-9\-\/=" ]*|select\:[a-zA-Z0-9 ]+|font\:[a-zA-Z0-9 ]+|text\:[a-zA-Z0-9 ]+|image\:[a-zA-Z0-9 ]+|color\:[a-zA-Z0-9 ]+|RGBcolor\:[a-zA-Z0-9 ]+|lang\:[a-zA-Z0-9\- ]+|[\/]?block\:[a-zA-Z0-9]+( [a-zA-Z0-9=" ]+)*)\}/ig;
    var block_attributes = {};
    var branch_cache = {};
    var safe_to_mark = true;
    var safe_mark_id = "";
    var transforms = {
        plaintext: plaintext,
        jsplaintext: jsplaintext,
        js: js,
        urlencoded: encodeURIComponent,
        rgb: hex2rgb
    };
    var fonts = {
        arial: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
        "arial black": "'Arial Black', Arial, 'Helvetica Neue', Helvetica, sans-serif",
        baskerville: "Baskerville, 'Times New Roman', Times, serif",
        "century gothic": "'Century Gothic', 'Apple Gothic', sans-serif",
        copperplate: "'Copperplate', serif",
        "courier new": "'Courier New', Courier, monospace",
        futura: "Futura, 'Century Gothic', AppleGothic, sans-serif",
        garamond: "Garamond, 'Hoefler Text', Times New Roman, Times, serif",
        geneva: "Geneva, 'Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', Verdana, sans-serif",
        georgia: "Georgia, Palatino, 'Palatino Linotype', Times, 'Times New Roman', serif",
        helvetica: "Helvetica, Arial, sans-serif",
        "helvetica neue": "'Helvetica Neue', Arial, Helvetica, sans-serif",
        impact: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
        "lucida sans": "'Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', sans-serif",
        "trebuchet ms": "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif",
        verdana: "Verdana, Geneva, Tahoma, sans-serif"
    };
    var open_angle = 0;
    var open_scripts = 0;
    var open_styles = 0;

    function is_safe_to_mark(branch) {
        if (!TumblrData.feature.quick_update) {
            return false
        }
        var character;
        for (var i = 0; i < branch.length; i++) {
            character = branch[i];
            if (character === "<") {
                if (open_angle) {
                    continue
                }
                open_angle++
            } else {
                if (character === ">") {
                    if (open_angle > 0) {
                        open_angle--
                    }
                }
            }
        }
        var token, tokens = branch.split("<");
        character = "<";
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            if (token.match(/^script[\s>]/i)) {
                open_scripts++
            } else {
                if (token.match(/\/\s*script[\s>]/i)) {
                    if (open_scripts > 0) {
                        open_scripts--
                    }
                } else {
                    if (token.match(/^style[\s>]/i)) {
                        open_styles++
                    } else {
                        if (token.match(/\/\s*style[\s>]/i)) {
                            if (open_styles > 0) {
                                open_styles--
                            }
                        }
                    }
                }
            }
        }
        return (open_angle <= 0 && open_scripts <= 0 && open_styles <= 0)
    }

    function get_safe_mark_id(variable_name) {
        if (_.indexOf(["title", "description"], variable_name) >= 0) {
            return variable_name
        }
        return false
    }

    function plaintext(value) {
        return htmlentities.encode(strip_tags(strip(value)))
    }

    function js(value) {
        return "'" + value.replace("'", "'").replace('"', '"') + "'"
    }

    function jsplaintext(value) {
        return js(plaintext(value))
    }

    function hex2rgb(hex) {
        if (hex.indexOf("#") !== 0) {
            hex = "#" + hex
        }
        if (hex.length == 4) {
            hex = "#" + hex.substr(1, 1) + hex.substr(1, 1) + hex.substr(2, 1) + hex.substr(2, 1) + hex.substr(3, 1) + hex.substr(3, 1)
        }
        var valid = /^#[0-9a-f]{6}$/i.test(hex);
        if (valid) {
            if (hex[0] == "#") {
                hex = hex.substr(1)
            }
            if (hex.length == 3) {
                var temp = hex;
                hex = "";
                temp = /^([a-f0-9])([a-f0-9])([a-f0-9])$/i.exec(temp).slice(1);
                for (var i = 0; i < 3; i++) {
                    hex += temp[i] + temp[i]
                }
            }
            var out = /^([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.exec(hex).slice(1);
            return (parseInt(out[0], 16) || 0) + "," + (parseInt(out[1], 16) || 0) + "," + (parseInt(out[2], 16) || 0)
        } else {
            return ""
        }
    }

    var callbacks = {
        audio_player: audio_player,
        audio_embed: audio_embed,
        tumblelog_like_button: tumblelog_like_button,
        tumblelog_reblog_button: tumblelog_reblog_button
    };

    function audio_player(attributes, position) {
        var audioplayer = lookup(position, "audioplayerwhite");
        if (!audioplayer) {
            return ""
        }
        var color, width, height;
        if (typeof attributes.color === "undefined" && typeof attributes.width === "undefined" && typeof attributes.height === "undefined") {
            color = "white";
            width = 207;
            height = 27
        } else {
            color = typeof attributes.color !== "undefined" ? attributes.color : "white";
            width = typeof attributes.width !== "undefined" ? attributes.width : 500;
            height = typeof attributes.height !== "undefined" ? attributes.height : false
        }
        audioplayer = audioplayer.replace(/color=[^\"\&]+/i, "color=" + color);
        audioplayer = audioplayer.replace(/width=\"[^\"]+\"/i, 'width="' + width + '"');
        if (height) {
            audioplayer = audioplayer.replace(/height=\"[^\"]+\"/i, 'height="' + height + '"')
        }
        return audioplayer
    }

    function audio_embed(attributes, position) {
        var audioembed = lookup(position, "audioembed-500");
        if (!audioembed) {
            return ""
        }
        var color = typeof attributes.color !== "undefined" ? attributes.color : "white";
        var width = typeof attributes.width !== "undefined" ? attributes.width : 500;
        var height = typeof attributes.height !== "undefined" ? attributes.height : false;
        audioembed = audioembed.replace(/color=[^\"\&]+/i, "color=" + color);
        audioembed = audioembed.replace(/width=\"[^\"]+\"/i, 'width="' + width + '"');
        if (height) {
            audioembed = audioembed.replace(/height=\"[^\"]+\"/i, 'height="' + height + '"')
        }
        return audioembed
    }

    function tumblelog_like_button(attributes) {
        var tumblelog_name = "demo";
        var color = attributes.color || "";
        var size = attributes.size || "20";
        size = parseInt(size, 10) > 100 ? "100" : size;
        var post_id = attributes["post-id"] || "459265350";
        var rk = attributes.rk || "";
        var url = window.location.protocol + "//assets.tumblr.com/assets/html/like_iframe.html#name=" + tumblelog_name + "&post_id=" + post_id + "&color=" + color + "&rk=" + rk;
        var iframe = '<div class="like_button" data-post-id="' + post_id + '" id="like_button_' + post_id + '"><iframe id="like_iframe_' + post_id + '" src="' + url + '" scrolling="no" width="' + size + '" height="' + size + '" frameborder="0" class="like_toggle" allowTransparency="true"></iframe></div>';
        return iframe
    }

    function tumblelog_reblog_button(attributes) {
        var size = attributes.size || "20";
        var color = attributes.color || "default";
        var reblog_url = attributes.reblog_url || false;
        if (!reblog_url) {
            return ""
        }
        switch (color) {
            case "white":
                color = "#fff";
                break;
            case "black":
                color = "#000";
                break;
            default:
                color = "#ccc"
        }
        var svg = '<svg width="100%" height="100%" viewBox="0 0 537 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="' + color + '"><path d="M 98.893,177.139c0.00-7.462, 4.826-12.275, 12.288-12.275L 405.12,164.864 l0.00,83.469 l 118.72-120.947L 405.12,8.678l0.00,81.51 L 49.382,90.189 c-15.206,0.00-27.648,12.429-27.648,27.648l0.00,171.814 l 77.146-71.603L 98.88,177.139 z M 438.874,332.646c0.00,7.45-4.826,12.275-12.275,12.275L 123.75,344.922 l0.00-83.469 l-116.506,120.922l 116.506,120.947l0.00-81.498 l 356.864,0.00 c 15.206,0.00, 27.648-12.454, 27.648-27.648L 508.262,220.134 l-69.402,71.59L 438.861,332.646 z" ></path></svg>';
        var style = "display: block;width:" + size + "px;height:" + size + "px;";
        var button = '<a href="' + reblog_url + '" class="reblog_button"style="' + style + '">' + svg + "</a>";
        return button
    }

    function render(tree, position) {
        token_tree = token_tree || tokenize(this.template);
        position = position || [];
        tree = tree || token_tree;
        var variable_name, value, transform, matches, output = "";
        for (var branch_key in tree) {
            var branch = tree[branch_key];
            if (typeof branch == "string") {
                if (matches = branch.match(pattern)) {
                    variable_name = matches[0].replace(/[{}]/g, "");
                    var attributes = {};
                    if (variable_name.indexOf("=") !== -1) {
                        var_name_parts = variable_name.split(" ");
                        for (var p in var_name_parts) {
                            var part = var_name_parts[p];
                            if (part.indexOf("=") !== -1) {
                                var attribute = part.split("=");
                                attributes[attribute[0]] = attribute[1].replace(/"/g, "")
                            } else {
                                variable_name = part
                            }
                        }
                    }
                    transform = false;
                    for (var prefix in transforms) {
                        if (variable_name.substr(0, prefix.length).toLowerCase() == prefix) {
                            variable_name = variable_name.substr(prefix.length);
                            transform = transforms[prefix];
                            break
                        }
                    }
                    value = lookup(position, variable_name);
                    if (value && typeof value == "string" || typeof value == "number") {
                        if (transform) {
                            value = transform(value)
                        }
                        if (safe_to_mark && (safe_mark_id = get_safe_mark_id(variable_name))) {
                            if (safe_mark_id === "title" && !lookup(position, "block:regular")) {
                                safe_mark_id = "blogtitle"
                            }
                            if (safe_mark_id === "description" && !(lookup(position, "block:postodd") || lookup(position, "block:posteven"))) {
                                safe_mark_id = "blogdescription"
                            }
                            value = '<span class="tumblr_theme_marker_' + safe_mark_id + '">' + value + "</span>"
                        }
                        output += value
                    } else {
                        if (typeof value == "object" && value != null) {
                            if (value.callback) {
                                if (callbacks[value.callback]) {
                                    if (value.attributes) {
                                        for (var att in value.attributes) {
                                            attributes[att] = value.attributes[att]
                                        }
                                    }
                                    var callback_value = callbacks[value.callback](attributes, position);
                                    output += (transform) ? transform(callback_value) : callback_value
                                }
                            }
                        }
                    }
                } else {
                    safe_to_mark = is_safe_to_mark(branch);
                    output += branch
                }
            } else {
                var exploded_position = branch_key.split(";");
                var branch_name = "block:" + exploded_position[0];
                value = lookup(position, branch_name);
                if (typeof value != "undefined") {
                    if (value === true) {
                        output += render(branch, position.concat([branch_name]))
                    } else {
                        if (typeof value == "string" || typeof value == "number") {
                            output += value
                        } else {
                            if (typeof value == "object") {
                                if (Object.prototype.toString.call(value) == "[object Array]") {
                                    for (var i = 0, l = value.length; i < l; i++) {
                                        output += render(branch, position.concat([branch_name, i]))
                                    }
                                } else {
                                    output += render(branch, position.concat([branch_name]))
                                }
                            }
                        }
                    }
                }
            }
        }
        return output
    }

    function tokenize(template) {
        token_tree = {};
        var position = [];
        var position_uid = 1;
        var offset = 0;
        var matches, content_after_last_token, parent_position, tag, string_content;
        while ((matches = token_pattern.exec(template)) != null) {
            tag = matches[0].replace(/[{}]/g, "").toLowerCase();
            if (string_content = template.substring(offset, matches.index)) {
                append_to_branch(token_tree, position, string_content)
            }
            if (tag.substring(0, 6) == "block:" || tag.substring(0, 7) == "/block:") {
                if (position[position.length - 1] && (parent_position = position[position.length - 1].split(";")[0]) && parent_position && (parent_position == tag.substr(6) || parent_position == tag.substr(7))) {
                    position.pop()
                } else {
                    if (tag.substring(0, 6) == "block:") {
                        tag = append_attributes(tag, position_uid);
                        position.push(tag.substr(6) + ";" + position_uid);
                        append_to_branch(token_tree, position);
                        position_uid++
                    } else {
                    }
                }
            } else {
                append_to_branch(token_tree, position, "{" + tag + "}")
            }
            offset = matches.index + matches[0].length
        }
        if (content_after_last_token = template.substr(offset, template.length - offset)) {
            append_to_branch(token_tree, position, content_after_last_token)
        }
        delete token_tree.size;
        return token_tree
    }

    function append_attributes(tag, position_uid) {
        var first_space = tag.indexOf(" ");
        if (first_space > -1) {
            var attributes = {};
            var attribute_string = tag.substr(first_space + 1);
            var tokens = attribute_string.split(" ");
            var pair;
            for (var i = 0, token; token = tokens[i]; i++) {
                pair = token.split("=");
                if (pair[0] && pair[1]) {
                    attributes[pair[0]] = pair[1].replace(/["']/g, "")
                }
                block_attributes[tag.substr(0, first_space).replace("block:", "") + ";" + position_uid] = attributes
            }
            tag = tag.substr(0, first_space)
        }
        return tag
    }

    function append_to_branch(token_tree, position, value) {
        value = value || false;
        if (!position.length) {
            if (!token_tree.size) {
                token_tree.size = 0
            }
            token_tree[token_tree.size + "k"] = value;
            token_tree.size++
        } else {
            for (var i = 0; i < position.length; i++) {
                if (i == position.length - 1) {
                    if (value === false) {
                        token_tree[position[i]] = {};
                        token_tree[position[i]]["size"] = 0
                    } else {
                        size = token_tree[position[i]]["size"];
                        token_tree[position[i]][size + "k"] = value;
                        token_tree[position[i]]["size"]++
                    }
                } else {
                    if (!token_tree[position[i]]) {
                        token_tree[position[i]] = {}
                    }
                    token_tree = token_tree[position[i]]
                }
            }
        }
    }

    function keys_to_lowercase(object) {
        if (JSON) {
            var str = JSON.stringify(object);
            str = str.replace(/"[^"]*"(?=:)/g, function (key) {
                if (key.indexOf("block:") !== -1 || key.indexOf("if:") !== -1) {
                    return key.toLowerCase().replace(/\s/g, "")
                } else {
                    return key.toLowerCase()
                }
            });
            return JSON.parse(str)
        } else {
            var value, new_object = {};
            for (var key in object) {
                value = object[key];
                if (key.indexOf("block:") !== -1 || key.indexOf("if:") !== -1) {
                    new_object[key.toLowerCase().replace(/\s/g, "")] = typeof value == "object" ? keys_to_lowercase(value) : value
                } else {
                    new_object[key.toLowerCase()] = typeof value == "object" ? keys_to_lowercase(value) : value
                }
            }
            return new_object
        }
    }

    function set_content_map(map) {
        branch_cache = {};
        this.content_map = content_map = keys_to_lowercase(map);
        generate_conditional_blocks_and_booleans()
    }

    function generate_conditional_blocks_and_booleans() {
        var value, new_key;
        for (var key in content_map) {
            value = content_map[key];
            var positive_key = false;
            var negative_key = false;
            if (key.indexOf("font:") === 0) {
                if (typeof value !== "string") {
                    value = value.toString()
                }
                value = fonts[value.toLowerCase()] || value;
                content_map[key] = value
            } else {
                if (key === "showtitle" || key === "showdescription" || key === "showheaderimage" || key === "showavatar") {
                    content_map["block:" + key.replace(/^show/i, "hide")] = !to_boolean(value);
                    content_map["block:" + key] = to_boolean(value)
                } else {
                    if (key.indexOf("if:") === 0 || key.indexOf("text:") === 0) {
                        new_key = key.replace(/if:|text:/, "").replace(/\s/g, "");
                        positive_key = "block:if" + new_key;
                        negative_key = "block:ifnot" + new_key;
                        content_map[positive_key] = to_boolean(value);
                        content_map[negative_key] = !to_boolean(value)
                    } else {
                        if (key.indexOf("image:") === 0) {
                            if (value == "http://assets.tumblr.com/images/x.gif") {
                                value = false
                            }
                            new_key = key.replace(/image:/, "").replace(/\s/g, "");
                            positive_key = "block:if" + new_key;
                            negative_key = "block:ifnot" + new_key;
                            content_map["block:if" + new_key + "image"] = to_boolean(value);
                            content_map["block:ifnot" + new_key + "image"] = !to_boolean(value);
                            if (!to_boolean(value)) {
                                content_map[key] = "http://assets.tumblr.com/images/x.gif"
                            }
                        } else {
                            if (key === "headerimage") {
                                content_map["headerimage-640"] = content_map[key];
                                content_map["headerimage-1024"] = content_map[key];
                                positive_key = "block:if" + key;
                                negative_key = "block:ifnot" + key;
                                content_map[positive_key] = to_boolean(value);
                                content_map[negative_key] = !to_boolean(value)
                            }
                        }
                    }
                }
            }
        }
    }

    function to_boolean(string) {
        switch (string) {
            case "0":
                return false;
            case "1":
                return true;
            default:
                return Boolean(string)
        }
    }

    function set_template(template) {
        token_tree = null;
        this.template = template.replace(/\{block:Text\}/ig, "{block:Regular}").replace(/\{\/block:Text\}/ig, "{/block:Regular}").replace(/\{block:Chat\}/ig, "{block:Conversation}").replace(/\{\/block:Chat\}/ig, "{/block:Conversation}")
    }

    function lookup(global_position, key) {
        var local_position = [];
        for (var i = 0; i < global_position.length; i++) {
            local_position.push(global_position[i])
        }
        var value;
        while (local_position.length) {
            var cache_key = JSON.stringify(local_position);
            var map;
            try {
                map = branch_cache[cache_key] || eval('content_map["' + local_position.join('"]["') + '"]')
            } catch (e) {
                console.error(e)
            }
            branch_cache[cache_key] = map;
            if (typeof map != "object") {
                local_position.pop();
                global_position.pop();
                continue
            } else {
            }
            value = map[key];
            if (typeof value == "undefined") {
                local_position.pop();
                continue
            } else {
                break
            }
        }
        if (typeof value == "undefined" && !local_position.length) {
            value = content_map[key]
        }
        return value
    }

    function strip(s) {
        return s.replace(/^\s+/, "").replace(/\s+$/, "")
    }

    function strip_tags(s) {
        return s.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, "")
    }

    var htmlentities = (function (document) {
        function encode(str) {
            var div = document.createElement("div");
            div.appendChild(document.createTextNode(str));
            str = div.innerHTML;
            div = null;
            return str
        }

        encode.decode = function (str) {
            var div = document.createElement("div");
            div.innerHTML = str;
            str = div.innerText || div.textContent;
            div = null;
            return str
        };
        return (encode.encode = encode)
    }(document));
    return {
        render: render,
        set_content_map: set_content_map,
        set_template: set_template,
        template: "",
        content_map: "",
        block_attributes: block_attributes,
        pattern: pattern
    }
})();