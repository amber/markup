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

### Markup.templates[<var>name</var>]

Templates follow the syntax <code>{{ template-name <var>arg1</var> <var>arg2</var> <var>arg3</var> }}</code>. Arguments can be bare words, single-quoted strings, pipe-quoted paragraphs, nestable bracket-quoted paragraphs, or other templates. The template function is called with the Markup context as its first argument, followed by any template arguments, HTML entity escaped.

Markup provides the <code>{{ echo <var>string</var> }}</code> and <code>{{ title <var>p</var> }}</code> templates by default.
