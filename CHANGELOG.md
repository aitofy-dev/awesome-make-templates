# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Static site for `make-templates.aitofy.dev`, generated from `templates/*/meta.json`: a filterable index, one page per template with `HowTo` and `FAQPage` structured data, an import guide, a Zapier migration page, `sitemap.xml`, `robots.txt` and `llms.txt`.
- `pnpm gen` also rewrites the template table in `README.md` and the template list in `llms.txt`, so those are generated, never hand-edited.
- `llms-full.txt`: the root README plus every template README in one file, so an agent can load the whole library in one fetch. Run `node --run docs:llms`.
- `llms.txt` lists raw GitHub URLs for each `blueprint.json`, `README.md` and `meta.json`, so an agent can download the blueprint instead of an HTML page.
- README carries a generated `## FAQ`, built from the `faq` entries of every template with duplicate questions collapsed, and a CI badge.
