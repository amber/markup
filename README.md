markup
======

Markdown-like parser used for everything in Amber.

API
---

### Markup.parse(text)

Returns a context object with the generated markup in `result`. Other keys in the context object depend on what templates you use.

### Markup.tr(key)

Returns a translated version of the string `key`. By default, this does nothing, but you can override it to provide translation support. Markup uses the following translated strings:

* `Missing reference "%"`
