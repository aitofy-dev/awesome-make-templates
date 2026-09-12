# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Static site for `make-templates.aitofy.dev`, generated from `templates/*/meta.json`: a filterable index, one page per template with `HowTo` and `FAQPage` structured data, an import guide, a Zapier migration page, `sitemap.xml`, `robots.txt` and `llms.txt`.
- `pnpm gen` also rewrites the template table in `README.md` and the template list in `llms.txt`, so those are generated, never hand-edited.
