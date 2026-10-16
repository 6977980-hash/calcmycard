// Layout budget (audit FIX-045): every calculator, at desktop, tablet and
// phone widths, must not push the page content below it down when it
// renders (lab CLS < 0.1). The harness copies the calculator page's layout
// (theme style.css, .cmc-layout grid, sidebar, guide text after the mount)
// and loads the calculator scripts only after the first paint, the worst
// case for a slow phone, so a missing or too-small reserved height in
// style.css fails here before it reaches the live site.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { pathToFileURL } = require( 'node:url' );
const { chromium } = require( 'playwright' );

const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );
const JS = path.join( THEME, 'assets', 'js' );
const CLS_BUDGET = 0.1;
const VIEWPORTS = {
	desktop: { width: 1280, height: 800 },
	tablet: { width: 800, height: 1000 },
	phone: { width: 390, height: 844 },
};

// calc_id -> script, read from the theme's own calculator list so a new
// calculator is covered without editing this file.
const data = fs.readFileSync( path.join( THEME, 'inc', 'data-calculators.php' ), 'utf8' );
const CALCS = {};
for ( const m of data.matchAll( /'calc_id'\s*=>\s*'([^']+)',\s*'js'\s*=>\s*'([^']+)'/g ) ) {
	CALCS[ m[1] ] = m[2];
}

const href = ( f ) => pathToFileURL( f ).href;
const filler = '<h2>How the calculator works</h2>' + '<p>Text that sits under the calculator on the real page. '.repeat( 6 ) + '</p>';
const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cmc-layout-' ) );
const harness = {};
for ( const [ id, file ] of Object.entries( CALCS ) ) {
	const scripts = [ 'finance-math.js', 'chart-helper.js', 'ui-helper.js', 'calculators/' + file ].map( ( f ) => href( path.join( JS, f ) ) );
	const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
		'<title>' + id + '</title><link rel="stylesheet" href="' + href( path.join( THEME, 'style.css' ) ) + '"></head><body>' +
		'<main id="cmc-main"><div class="cmc-container cmc-layout"><div class="cmc-main-col">' +
		'<div id="cmc-calc-' + id + '" class="cmc-calculator" data-calc="' + id + '"></div>' +
		'<div class="cmc-content-narrow cmc-calc-guide" id="below">' + filler.repeat( 3 ) + '</div>' +
		'</div><aside class="cmc-sidebar"><div class="cmc-ad-slot">Sidebar</div></aside></div></main>' +
		'<script>window.__cls = 0; new PerformanceObserver( ( l ) => { for ( const e of l.getEntries() ) { if ( ! e.hadRecentInput ) { window.__cls += e.value; } } } ).observe( { type: "layout-shift", buffered: true } );' +
		'const S = ' + JSON.stringify( scripts ) + ';' +
		'function next( i ) { if ( i === S.length ) { window.__rendered = true; return; } const s = document.createElement( "script" ); s.src = S[ i ]; s.onload = () => next( i + 1 ); document.body.appendChild( s ); }' +
		'requestAnimationFrame( () => requestAnimationFrame( () => setTimeout( () => next( 0 ), 50 ) ) );</script>' +
		'</body></html>';
	const p = path.join( dir, id + '.html' );
	fs.writeFileSync( p, html );
	harness[ id ] = href( p );
}

let browser;
test.before( async () => {
	browser = await chromium.launch( process.env.CMC_CHROMIUM ? { executablePath: process.env.CMC_CHROMIUM } : {} );
} );
test.after( async () => {
	await browser.close();
	fs.rmSync( dir, { recursive: true, force: true } );
} );

test( 'layout: the calculator list is read from data-calculators.php', () => {
	assert.ok( Object.keys( CALCS ).length >= 16, 'found ' + Object.keys( CALCS ).length + ' calculators' );
} );

for ( const id of Object.keys( CALCS ) ) {
	test( 'FIX-045: ' + id + ' renders with lab CLS under ' + CLS_BUDGET + ' at every width', async () => {
		const results = [];
		for ( const [ name, viewport ] of Object.entries( VIEWPORTS ) ) {
			const page = await browser.newPage( { viewport } );
			await page.goto( harness[ id ] );
			await page.waitForFunction( () => window.__rendered && document.querySelector( '.cmc-stat-value' ) );
			await page.waitForTimeout( 300 );
			const cls = await page.evaluate( () => window.__cls );
			results.push( name + ' ' + cls.toFixed( 3 ) );
			await page.close();
			assert.ok( cls < CLS_BUDGET, id + ' at ' + name + ' (' + viewport.width + 'px): CLS ' + cls.toFixed( 3 ) + ' (reserve its height in style.css, "Reserved calculator height")' );
		}
	} );
}
