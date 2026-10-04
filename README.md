# CalcMyCard Content Importer

WordPress plugin for calcmycard.com. Imports posts and pages from JSON or CSV with SEO title,
meta description, focus keyword, canonical and FAQ schema (FAQPage JSON-LD). Works with Yoast
and Rank Math; falls back to its own meta tags when neither is active.

## Use

WP Admin → Tools → CalcMyCard Importer → upload a `.json` or `.csv` file. "Dry run" is on by
default so you can preview before saving. Posts are matched by slug, so re-importing updates them.
Sample files are in `samples/`.

## Deploy

Plugin files live at the repository root. Hostinger "Deploy from GitHub" deploys the `main`
branch to:

    public_html/wp-content/plugins/calcmycard-content-importer
