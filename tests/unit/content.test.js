// Content accuracy guards (25 Oct 2026 audit, Phase 3): facts that were
// wrong or missing on the live site stay fixed. Runs offline on the theme
// files.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );
const read = ( f ) => fs.readFileSync( path.join( THEME, f ), 'utf8' );
const article = ( slug ) => read( 'content/articles/' + slug + '.html' );

test( 'A25-002: grace period pages cite Regulation Z 1026.54', () => {
	for ( const slug of [ 'credit-card-grace-period-explained', 'how-does-credit-card-interest-work', 'credit-card-glossary', 'statement-balance-vs-current-balance' ] ) {
		assert.ok( article( slug ).includes( '1026.54' ), slug );
	}
	assert.ok( ! article( 'credit-card-grace-period-explained' ).includes( 'already partly paid off' ) );
} );

test( 'A25-012: late fee guide gives the exact 2026 safe harbor', () => {
	const body = article( 'credit-card-late-fees-explained' );
	assert.ok( body.includes( '$30' ) && body.includes( '$41' ) && body.includes( '2026' ) );
	assert.ok( ! /roughly \$(30|41)|\$30 to \$32/.test( body ), 'no rough ranges' );
} );

test( 'A25-005 / A25-006: homepage FAQ and methodology match what the site does', () => {
	assert.ok( ! read( 'front-page.php' ).includes( 'analytics and advertising' ) );
	assert.ok( ! read( 'content/pages/methodology.html' ).includes( 'promotional deferred-interest structures' ) );
	// GA4 is on: every page that talks about analytics has to say so.
	assert.ok( read( 'functions.php' ).includes( 'G-FVYH8DJVC5' ) );
	for ( const f of [ 'front-page.php', 'inc/page-sync.php', 'content/pages/privacy-policy.html', 'content/pages/terms.html' ] ) {
		assert.ok( ! /no analytics|use analytics today|any analytics service/.test( read( f ) ), f + ' still says no analytics' );
	}
	assert.ok( read( 'content/pages/privacy-policy.html' ).includes( 'Google Analytics Opt-out' ) );
} );

test( 'G-2: the statement balance guide is linked from other pages', () => {
	const slug = 'statement-balance-vs-current-balance';
	const files = [ 'articles', 'calculators', 'pages' ].flatMap( ( d ) =>
		fs.readdirSync( path.join( THEME, 'content', d ) ).map( ( f ) => 'content/' + d + '/' + f ) );
	const from = files.filter( ( f ) => ! f.endsWith( '/' + slug + '.html' ) && read( f ).includes( '/guides/' + slug + '/' ) );
	assert.ok( from.length >= 5, 'linked from ' + from.length + ' page(s)' );
} );
