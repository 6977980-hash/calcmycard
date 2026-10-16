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

## Theme

The site theme lives in `theme/calcmycard/`. On every push to `main` that touches it, the
"Sync theme-live branch" workflow runs the calculator tests, then copies the theme to the
`theme-live` branch, which Hostinger deploys to `public_html/wp-content/themes/calcmycard`.
If the tests fail, nothing is deployed.

A calculator or guide page's "Updated" date (and its schema `dateModified` and sitemap `lastmod`)
moves to the deploy time only when its file in `content/` or its entry in `inc/data-*.php`
changes, so edit those files only for real content changes.

## Calculator tests

    npm install
    npx playwright install chromium
    npm test

`tests/unit/` checks the shared math (`assets/js/finance-math.js`) against the worked examples
published on the calculator pages and an independent reference implementation, and
`links.test.js` checks that every internal link, related-page slug and source key in the theme
exists.
`tests/e2e/` loads each of the 16 calculators in Chromium, including "Copy link to these
results" round trips, invalid inputs and extreme values; `layout.test.js` fails if a calculator
shifts the page below it as it renders (lab CLS 0.1 or more at 1280, 800 or 390 px), which means
its reserved height in `style.css` is missing or too small. Pull requests run both
(`.github/workflows/tests.yml`). When the number of tests changes, update `cmc_qa_status()` in
`inc/helpers.php` and the About / Methodology text in `inc/page-sync.php`.

## Live site monitor

`npm run monitor` (`tests/monitor/live-check.js`) checks calcmycard.com itself: the sitemap
named in robots.txt, that every calculator, guide and page is in it and returns 200, is indexable
and self-canonical, the downloads, and the deployed theme version. The "Live site monitor"
workflow runs it every morning and after each theme deploy; a failed run emails the repository
owner, and the run summary lists each problem.

## Rolling back a release

1. Revert the change on `main` (`git revert <commit>`, or "Revert" on the merged pull request
   in GitHub) and merge it. The workflow tests and redeploys the previous theme within a few
   minutes; Hostinger's Git auto-deployment pulls `theme-live` again.
2. Purge the LiteSpeed page cache (WP Admin → LiteSpeed Cache → Toolbox → Purge All).
3. Text changes made to the database by `inc/page-sync.php` are not undone by a revert. Restore
   them from the page's revision history (WP Admin → Pages → the page → Revisions), or from a
   Hostinger backup (hPanel → Websites → Backups) taken before the release.
