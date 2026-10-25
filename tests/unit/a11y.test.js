// Accessibility and legal-page guards (25 Oct 2026 audit, Phase 4):
// no skipped heading levels in the shared templates, and the Terms of Use
// page is created, described and linked. Runs offline on the theme files.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );
const read = ( f ) => fs.readFileSync( path.join( THEME, f ), 'utf8' );

test( 'A25-017: templates and calculators keep the heading outline h1 > h2 > h3', () => {
	// Sidebar and footer headings follow h2 sections, so they are h3, not h4.
	for ( const f of [ 'footer.php', 'page-calculator.php', 'page-article.php', 'page-hub.php', 'page.php', 'functions.php' ] ) {
		assert.ok( ! /<h4/.test( read( f ) ), f + ' prints an h4' );
	}
	// Hub cards sit right under the h1; calculators print h3 subheadings, so
	// an h2 comes before the mount point.
	assert.ok( /<h2><a/.test( read( 'page-hub.php' ) ) );
	const calc = read( 'page-calculator.php' );
	assert.ok( calc.indexOf( '<h2 class="cmc-visually-hidden">' ) > -1 && calc.indexOf( '<h2 class="cmc-visually-hidden">' ) < calc.indexOf( 'class="cmc-calculator"' ) );
	// A JS h4 is fine only when the same tool prints an h3 first.
	for ( const f of fs.readdirSync( path.join( THEME, 'assets/js/calculators' ) ) ) {
		const src = read( 'assets/js/calculators/' + f );
		if ( src.includes( '<h4' ) ) {
			assert.ok( src.indexOf( '<h3' ) > -1 && src.indexOf( '<h3' ) < src.indexOf( '<h4' ), f );
		}
		assert.ok( ! /<h[1256]/.test( src ), f + ' prints a heading level other than h3/h4' );
	}
} );

test( 'Terms of Use page: created by page sync, described, linked in the footer', () => {
	const sync = read( 'inc/page-sync.php' );
	assert.match( sync, /'terms'\s*=>\s*'Terms of Use'/ );
	assert.match( sync, /'terms'\s*=>\s*'\d{4}-\d{2}-\d{2}/ );
	assert.match( sync, /'terms'\s*=>\s*'CalcMyCard Terms of Use[^']{20,}'/ );
	assert.ok( read( 'footer.php' ).includes( "home_url( '/terms/' )" ) );
	const body = read( 'content/pages/terms.html' );
	for ( const must of [ 'not financial', 'contact@calcmycard.com', '/privacy-policy/', 'share link', 'embed', 'Limitation of liability' ] ) {
		assert.ok( body.includes( must ), 'terms mentions ' + must );
	}
	// Facts the site can't back up stay out.
	assert.ok( ! /reviewed by (a )?(lawyer|attorney)|governed by the laws of/i.test( body ) );
} );
