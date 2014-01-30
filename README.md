markup
======

Markdown-like parser used for everything in Amber.

API
---

### Markup.parse(text)

Returns a context object with the generated HTML in `result`. It also includes the following keys:

* **config**: an object containing properties set by templates
* **references**: a dictionary of reference names to `{href, title}`

### Markup.tr(key)

Returns a translated version of the string `key`. By default, this does nothing, but you can override it to provide translation support. Markup uses the following translated strings:

* `Missing reference "%"`

### Markup.templates[<name>]

Templates follow the syntax `{{ template-name <arg1> <arg2> <arg3> }}`. Arguments can be bare words, single-quoted strings, pipe-quoted paragraphs, nestable bracket-quoted paragraphs, or other templates. The template function is called with the Markup context as its first argument, followed by any template arguments.

Markup provides the `{{ echo <string> }}` and `{{ title <p> }}` templates by default.
