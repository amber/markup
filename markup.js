(function() {
  'use strict';


  function htmle(string) {
    return string
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }


  var emoticons = {
    smile: /^(?:=|:-?)\)/,
    wink: /^;-?\)/,
    'wide-eyed': /^o\.o/i,
    'big-smile': /^(?:=|:-?)D/,
    slant: /^(?:=|:-?)[\/\\]/,
    tongue: /^(?:=|:-?)P/,
    neutral: /^(?:=|:-?)\|/,
    frown: /^(?:=|:-?)\(/,
    cry: /^(?:=|:-?)'\(/,
    confused: /^(?:=|:-?)S/,
    'big-frown': /^D(?:=|-?:)/,
    heart: /^<3\b/
  };


  var symbols = [
    [/^<--?>/, '&harr;'],
    [/^<--?/, '&larr;'],
    [/^--?>/, '&rarr;'],
    [/^\s+x\s+/, '&times;'],
    [/^\(\s*tm\s*\)/i, '&trade;'],
    [/^\(\s*r\s*\)/i, '&reg;'],
    [/^\(\s*c\s*\)/i, '&copy;']
  ];


  var templates = {
    title: function(x, title) {
      x.config.title = title;
      return '';
    },
    echo: function(x, content) {
      return content;
    }
  };


  var REFERENCE = /^ {0,3}\[([^[\]]+)\]:\s*(.+?)\s*((?:"(?:[^"]|\\[\\"])+"|'(?:[^']|\\[\\'])+'|\((?:[^()]|\\[\\()])+\))?)\s*$/gm;
  var VALID_LINK = /^\w+:|^$|^\//;

  var HORIZONTAL_RULE = /^\s*(?:\*(?:\s*\*){2,}|-(?:\s*-){2,})\s*\n\n+/;
  var HEADING = /^(#{1,6})([^#][^\n]*?)#{0,6}(\n|$)/;

  var LINE_BREAK = /^\\\n/;
  var ESCAPE = /^\\(.)/;
  var CODE = /^`+/;
  var EMPHASIS = /^[_*]/;
  var STRONG = /^(?:__|\*\*)/;
  var DASH_SEQUENCE = /^---+/;
  var EM_DASH = /^(\s*)--(?!-)(\s*)/;
  var EN_DASH = /^\s+-\s+/;
  var DOTS = /^\.{5,}/;
  var ELLIPSIS = /^\.\.\.(\.?)/;
  var SPACE = /^\s+('(?:"')*"?|"(?:'")*'?)/;
  var WORD = /^(['"]*)([a-z0-9][a-z0-9'"]*)/i;
  var QUOTE = /^['"]+/;
  var NON_EMPHASIS = /^\s+(?:\*+|_+)\s+/;
  var LINK = /^(!?)\[([^[\]]+)\]\s*\(([^(\)]*?)\s*((?:"(?:[^"]|\\[\\"])+"|'(?:[^']|\\[\\'])+'|\((?:[^()]|\\[\\()])+\))?)\)/;
  var REFERENCE_LINK = /^(!?)\[([^[\]]+)\]\s*\[([^[\]]*)\]/;
  var AUTOMATIC_LINK = /^<((?:https?|s?ftp|data|file|wss?|about|irc):[^>]*|[0-9a-z-]+(\.[0-9a-z\-]+)+\.*(?::\d+)?(?:\/[^>]*)?)>/;
  var EMAIL_ADDRESS = /^<((?:[a-z0-9!#$%&'*+\-\/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-\/=?^_`{|}~]+)*|"(?:[^\\"]|\\.)+")@(?:[a-z0-9!#$%&'*+\-\/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-\/=?^_`{|}~]+)*|\[[^[\]\\]*\]))>/i;
  var TAG = /^<(\/?)(br|del|dd|dl|dt|ins|kbd|sup|sub|mark)>/i;
  var TEMPLATE = /^\{\{\s*/;


  function linkHref(href) {
    return VALID_LINK.test(href) ? href : 'http://' + href;
  }


  function link(image, label, href, title) {
    href = linkHref(href);
    if (image) {
      return '<img class=markup-image title="' + title + '" src="' + href + '" alt="' + label + '">';
    } else {
      return '<a title="' + title + '" href="' + href + '">' + label + '</a>';
    }
  }


  function parseTitle(title) {
    switch (title[0]) {
      case '"':
        return title.slice(1, -1).replace(/\\([\\"])/g, '$1');
      case '\'':
        return title.slice(1, -1).replace(/\\([\\'])/g, '$1');
      case '(':
        return title.slice(1, -1).replace(/\\([\\()])/g, '$1');
      default:
        return '';
    }
  }


  function parse(text) {
    function parseTemplate(string) {
      var a, args, b, e, f, i, j, name, result, start, sub, template;
      if (!(e = /^\s*(\S+)\s*/.exec(string))) return;

      name = e[1];
      i = e[0].length;
      args = [];
      while (!(f = /^\s*}}/.exec((sub = string.substr(i))))) {
        if (e = /^\s*\{\{\s*/.exec(sub)) {
          i += e[0].length;
          result = parseTemplate(string.substr(i));
          if (!result) {
            return;
          }
          args.push(result.contents);
          i += result.length;
        } else if (e = /^\s*('(?:[^']|\\[\\'])*')\s*/.exec(sub)) {
          args.push(htmle(parseTitle(e[1])));
          i += e[0].length;
        } else if (e = /^\s*(\|+)/.exec(sub)) {
          i += e[0].length;
          j = string.indexOf(e[1], i);
          if (j === -1) return;

          args.push(parseParagraph(string.substring(i, j)));
          i = j + e[1].length;
        } else if (e = /^\s*\[/.exec(sub)) {
          i += e[0].length;
          start = i;
          j = 1;
          while (j) {
            a = string.indexOf('[', i + 1);
            b = string.indexOf(']', i + 1);
            if (a === -1 && b === -1) {
              return;
            }
            if (a !== -1 && (a < b || b === -1)) {
              ++j;
              i = a;
            }
            if (b !== -1 && (b < a || a === -1)) {
              --j;
              i = b;
            }
          }
          args.push(parseParagraph(string.substring(start, i)));
          i += 1;
        } else if (e = /^\s*([^\s{}]+)\s*/.exec(sub)) {
          args.push(htmle(e[1]));
          i += e[0].length;
        } else {
          return;
        }
      }
      i += f[0].length;
      if (!(template = templates[name])) return;
      return {
        length: i,
        contents: template.apply(null, [context].concat(args))
      };
    }

    function parseBlock(text) {
      var code, e, end, i, index, item, items, length, match, n, next, p, r, result, s, t, terminator, title, useParagraph, _i, _len;
      index = 0;
      if (e = /^\n+/.exec(text)) {
        result = '';
        index += e[0].length;
      } else if (e = /^[*-]\s+/.exec(text)) {
        index += e[0].length;
        items = [];
        useParagraph = false;
        for (;;) {
          p = text.substr(index);
          match = /\n(\n*)[*-]\s+/.exec(p);
          next = match != null ? match.index : void 0;
          terminator = p.search(/\n\n+(?!    )(?!\n)|$/);
          end = Math.min(terminator, match ? next : p.length);
          items.push(item = p.substr(0, end));
          index += end;
          useParagraph || (useParagraph = /\n+/.test(item));
          if (!match || terminator < next) {
            break;
          }
          useParagraph || (useParagraph = match[1]);
          e = /\n+[*-]\s+/.exec(p.substr(end));
          index += e[0].length;
        }
        result = '';
        result += "<ul>\n";
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          if (useParagraph) {
            i = 0;
            item = item.replace(/^    /gm, '');
            length = item.length;
            t = '';
            while (i < length) {
              r = parseBlock(item.substr(i));
              t += r.content;
              i += r.length;
            }
            result += "<li>\n" + t + "\n</li>\n";
          } else {
            t = parseParagraph(item);
            result += "<li>" + t + "</li>\n";
          }
        }
        result += "</ul>\n";
        e = null;
      } else if (e = HEADING.exec(text)) {
        n = e[1].length;
        title = parseParagraph(e[2].trim());
        result = "<h" + n + ">" + title + "</h" + n + ">";
        index += e[0].length;
      } else if (e = /^```/.exec(text)) {
        index += e[0].length;
        p = text.substr(index);
        i = p.search(/^```/m);
        if (i === -1) {
          result = "```";
        } else {
          code = htmle(p.substr(0, i));
          result = "<pre><code>" + code + "</code></pre>\n";
          index += i + 3;
        }
      } else if (e = HORIZONTAL_RULE.exec(text)) {
        result = '<hr>\n';
        index += e[0].length;
      } else if (/^    /.test(text)) {
        i = text.search(/\n\n+(?!    )/);
        if (i === -1) {
          i = text.length;
        }
        code = text.substr(0, i);
        code = htmle(code.replace(/^    /gm, ''));
        result = "<pre><code>" + code + "</code></pre>\n";
        index += i;
      } else {
        i = text.search(/\n\n+/);
        if (i === -1) {
          i = text.length;
        }
        s = parseParagraph(text.substr(0, i));
        result = "<p>" + s + "</p>\n";
        index += i;
      }
      return {
        content: result,
        length: index
      };
    }

    function parseParagraph(p) {
      function find(kind) {
        for (var j = 0; j < stack.length; j++) {
          if (stack[j].kind === kind) return j;
        }
        return -1;
      }

      function pop(kind) {
        var i = find(kind);
        if (i === -1) return;

        var entries = [];
        while (stack.length > i + 1) {
          var entry = stack.pop();
          s += "</" + entry.kind + ">";
          entries.push(entry);
        }
        entry = stack.pop();
        s += "</" + entry.kind + ">";

        for (var j = 0; j < entries.length; j++) {
          s += "<" + entries[j].kind + ">";
          stack.push(entries[j]);
        }
      }

      function push(kind, original) {
        stack.push({
          kind: kind,
          index: s.length,
          original: original
        });
        s += "<" + kind + ">";
      }

      function toggle(kind, original) {
        if (find(kind) === -1) {
          push(kind, original);
        } else {
          pop(kind);
        }
      }

      function leftQuote(s) {
        return s.replace(/'/g, "&lsquo;").replace(/"/g, "&ldquo;");
      }

      function rightQuote(s) {
        return s.replace(/'/g, "&rsquo;").replace(/"/g, "&rdquo;");
      }

      var stack = [];
      var i = 0;
      var length = p.length;
      var s = '';

      while (i < length) {
        var sub = p.substr(i);

        var done = false;
        for (var name in emoticons) {
          var regex = emoticons[name];
          if (e = regex.exec(sub)) {
            var className = htmle(name);
            var label = htmle(e[0]);
            s += "<span class=\"markup-emoticon " + className + "\">" + label + "</span>";
            done = true;
            break;
          }
        }

        if (!done) {
          for (var j = 0; j < symbols.length; j++) {
            regex = symbols[j][0];
            var substitution = symbols[j][1];
            if (e = regex.exec(sub)) {
              s += substitution;
              done = true;
              break;
            }
          }
        }

        var e, result, title, href, ref, code, chunked, left, obfuscator;
        if (done) {
        } else if (e = LINE_BREAK.exec(sub)) {
          s += '<br>';
        } else if (e = ESCAPE.exec(sub)) {
          s += e[1];
        } else if (e = TEMPLATE.exec(sub)) {
          if (result = parseTemplate(p.substr(i + e[0].length))) {
            i += result.length;
            s += result.contents;
          } else {
            s += e[0];
          }
        } else if (e = STRONG.exec(sub)) {
          toggle('strong', e[0]);
        } else if (e = EMPHASIS.exec(sub)) {
          toggle('em', e[0]);
        } else if (e = DASH_SEQUENCE.exec(sub)) {
          s += e[0];
        } else if (e = EM_DASH.exec(sub)) {
          s += e[1] ? " " : "";
          s += "&mdash;";
          s += e[2] ? " " : "";
        } else if (e = EN_DASH.exec(sub)) {
          s += " &ndash; ";
        } else if (e = DOTS.exec(sub)) {
          s += e[0];
        } else if (e = ELLIPSIS.exec(sub)) {
          s += "&hellip;" + e[1];
        } else if (e = CODE.exec(sub)) {
          i += e[0].length;
          j = p.indexOf(e[0], i);
          if (j === -1) {
            s += '`';
          } else {
            code = htmle(p.substring(i, j));
            code = code.trim();
            s += "<code>" + code + "</code>";
            i = j + e[0].length;
          }
          e = null;
        } else if (e = WORD.exec(sub)) {
          s += leftQuote(e[1]);
          s += rightQuote(e[2]);
        } else if (e = QUOTE.exec(sub)) {
          s += rightQuote(e[0]);
        } else if (e = NON_EMPHASIS.exec(sub)) {
          s += e[0];
        } else if (e = SPACE.exec(sub)) {
          s += ' ';
          s += leftQuote(e[1]);
        } else if (e = EMAIL_ADDRESS.exec(sub)) {
          chunked = '';
          left = e[1];
          while (left) {
            obfuscator = '';
            for (j = 3; j--;) {
              obfuscator += String.fromCharCode(Math.floor(Math.random() * 26 + 97));
            }
            chunked += htmle(left.substr(0, 6));
            chunked += "<span class=markup-email>" + obfuscator + "</span>";
            left = left.substr(6);
          }
          href = htmle(e[1].split('').reverse().join('').replace(/\\/g, '\\\\').replace(/'/g, '\\\''));
          s += "<a href=\"javascript:window.open('mailto:'+'" + href + "'.split('').reverse().join(''))\">" + chunked + "</a>";
        } else if (e = LINK.exec(sub)) {
          label = htmle(e[2]);
          href = e[3];
          title = parseTitle(e[4]);
          title = htmle(title);
          href = htmle(href);
          s += link(e[1], label, href, title);
        } else if (e = REFERENCE_LINK.exec(sub)) {
          label = htmle(e[2]);
          href = (e[3] || e[2]).toLowerCase();
          if (ref = references[href]) {
            href = htmle(ref.href);
            title = htmle(ref.title);
            s += link(e[1], label, href, title);
          } else {
            s += "<span class=markup-error title=\"" + (htmle(Markup.tr('Missing reference "%"', href))) + "\">" + label + "</span>";
          }
        } else if (e = AUTOMATIC_LINK.exec(sub)) {
          href = htmle(e[1]);
          s += "<a href=\"" + href + "\">" + href + "</a>";
        } else {
          e = null;
          if (!e) {
            s += htmle(p[i]);
            i += 1;
          }
        }
        if (e) {
          i += e[0].length;
        }
      }

      var entry;
      while (entry = stack.pop()) {
        s = s.substr(0, entry.index) + entry.original + s.substr(entry.index + entry.kind.length + 2);
      }
      return s;
    }

    var references = {};
    var config = {};
    var context = {
      source: text,
      config: config,
      references: references
    };

    text = text.trim();
    text = text.replace(REFERENCE, function(_, name, href, title) {
      references[name.toLowerCase()] = {
        href: href,
        title: parseTitle(title)
      };
      return '';
    });

    var textLength = text.length;
    var content = '';
    var index = 0;
    while (index < textLength) {
      var result = parseBlock(text.substr(index));
      content += result.content;
      index += result.length;
    }

    context.result = content;
    return context;
  };

  var Markup = {
    tr: function(key) {
      return key;
    },
    parse: parse,
    templates: templates
  };

  if (typeof module !== 'undefined') {
    module.exports = Markup;
  } else {
    this.Markup = Markup;
  }

}.call(this));
