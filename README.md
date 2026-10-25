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

Hostinger's CDN (`server: hcdn`) sits in front of the site. The theme sends
`Cache-Control: s-maxage=600`, so a deploy should show everywhere within about ten minutes.
Check with `curl -sI https://calcmycard.com/ | grep -i 'age\|hcdn'`: on a `HIT`, `age` should
stay under 600. If a page still shows old content after that, flush the cache in the CDN
section of the website in hPanel. The live site monitor fails when a CDN copy is more than an
hour old.

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
exists; `content.test.js` guards facts corrected in the 25 Oct 2026 audit (Reg Z 1026.54 on the
grace period pages, the 2026 late fee safe harbor, homepage privacy FAQ), and `a11y.test.js`
checks the heading outline (no h2 → h4 skips) and that the Terms of Use page is created and linked.
`tests/e2e/` loads each of the 16 calculators in Chromium, including "Copy link to these
results" round trips, invalid inputs and extreme values; `layout.test.js` fails if a calculator
shifts the page below it as it renders (lab CLS 0.1 or more at 1280, 800 or 390 px), which means
its reserved height in `style.css` is missing or too small, and that stand-alone links are at
least 24 px tall (WCAG 2.2 2.5.8). Pull requests run both
(`.github/workflows/tests.yml`, pinned to `ubuntu-24.04` because Playwright 1.56 has no Chromium
build for ubuntu 26.04). When the number of tests changes, update `cmc_qa_status()` in
`inc/helpers.php`, the About text in `inc/page-sync.php` and the "How we test" list in
`content/pages/methodology.html` (bump its version in `cmc_page_bodies()`).

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
