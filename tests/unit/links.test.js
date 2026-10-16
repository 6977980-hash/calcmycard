// Internal link check (audit FIX-045): every link the theme prints to
// another CalcMyCard page must point at a page the theme creates, every
// slug in the related lists must exist, and every source key must be in
// cmc_sources(). Runs offline on the theme files, so a typo in a slug fails
// the pull request instead of becoming a 404 on the live site.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );
const read = ( f ) => fs.readFileSync( path.join( THEME, f ), 'utf8' );
const slugsIn = ( dir ) => fs.readdirSync( path.join( THEME, dir ) ).filter( ( f ) => f.endsWith( '.html' ) ).map( ( f ) => f.slice( 0, -5 ) );

function walk( dir, out = [] ) {
	for ( const e of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const p = path.join( dir, e.name );
		if ( e.isDirectory() ) {
			walk( p, out );
		} else if ( /\.(php|html)$/.test( e.name ) ) {
			out.push( p );
		}
	}
	return out;
}

const calcData = read( 'inc/data-calculators.php' );
const articleData = read( 'inc/data-articles.php' );
const dataSlugs = ( src ) => [ ...src.matchAll( /'slug'\s*=>\s*'([^']+)'/g ) ].map( ( m ) => m[1] );
const calculators = dataSlugs( calcData );
const guides = dataSlugs( articleData );
const pages = slugsIn( 'content/pages' );

// URL path -> content file (for #fragment checks), or true when the page
// exists but its HTML is built by a template.
const known = new Map( [ [ '/', true ], [ '/calculators/', true ], [ '/guides/', true ] ] );
calculators.forEach( ( s ) => known.set( '/calculators/' + s + '/', 'content/calculators/' + s + '.html' ) );
guides.forEach( ( s ) => known.set( '/guides/' + s + '/', 'content/articles/' + s + '.html' ) );
pages.forEach( ( s ) => known.set( '/' + s + '/', 'content/pages/' + s + '.html' ) );

// Every internal link in the theme: href="/..." or href="https://calcmycard.com/..."
// in HTML, and home_url( '/...' ) in PHP.
const links = [];
for ( const file of walk( THEME ) ) {
	const src = fs.readFileSync( file, 'utf8' );
	const rel = path.relative( THEME, file );
	for ( const m of src.matchAll( /href=["'](?:https?:\/\/(?:www\.)?calcmycard\.com)?(\/[^"'\s]*)["']/g ) ) {
		links.push( { from: rel, url: m[1] } );
	}
	for ( const m of src.matchAll( /home_url\(\s*'(\/[^']*)'\s*\)/g ) ) {
		links.push( { from: rel, url: m[1] } );
	}
}

test( 'links: theme data and content files list the same pages', () => {
	assert.deepEqual( [ ...calculators ].sort(), slugsIn( 'content/calculators' ).sort() );
	assert.deepEqual( [ ...guides ].sort(), slugsIn( 'content/articles' ).sort() );
} );

test( 'links: every internal link points at a page the theme creates', () => {
	assert.ok( links.length > 100, 'found ' + links.length + ' internal links' );
	const broken = [];
	for ( const { from, url } of links ) {
		const [ beforeHash, fragment = '' ] = url.split( '#' );
		const p = beforeHash.split( '?' )[0];
		if ( p.startsWith( '/wp-content/themes/calcmycard/' ) ) {
			if ( ! fs.existsSync( path.join( THEME, p.replace( '/wp-content/themes/calcmycard/', '' ) ) ) ) {
				broken.push( from + ' -> ' + url + ' (file missing)' );
			}
			continue;
		}
		if ( ! known.has( p ) ) {
			broken.push( from + ' -> ' + url );
			continue;
		}
		const file = known.get( p );
		if ( fragment && typeof file === 'string' && ! read( file ).includes( 'id="' + fragment + '"' ) ) {
			broken.push( from + ' -> ' + url + ' (no id="' + fragment + '")' );
		}
	}
	assert.deepEqual( broken, [] );
} );

test( 'links: related calculator and embed slugs exist', () => {
	const missing = [];
	const lists = [ ...calcData.matchAll( /'related'\s*=>\s*array\(([^)]*)\)/g ), ...articleData.matchAll( /'related_calculators'\s*=>\s*array\(([^)]*)\)/g ) ];
	for ( const m of lists ) {
		for ( const s of m[1].matchAll( /'([^']+)'/g ) ) {
			if ( ! calculators.includes( s[1] ) && ! guides.includes( s[1] ) ) {
				missing.push( s[1] );
			}
		}
	}
	for ( const m of articleData.matchAll( /'embed_calc'\s*=>\s*'([^']+)'/g ) ) {
		if ( ! calculators.includes( m[1] ) ) {
			missing.push( m[1] );
		}
	}
	assert.ok( lists.length >= 30 );
	assert.deepEqual( missing, [] );
} );

test( 'links: every cited source key is defined in cmc_sources()', () => {
	const helpers = read( 'inc/helpers.php' );
	const body = helpers.slice( helpers.indexOf( 'function cmc_sources()' ) );
	const defined = new Set( [ ...body.slice( 0, body.indexOf( "\n}\n" ) ).matchAll( /^\t\t'([a-z0-9-]+)'\s*=>\s*array\(/gm ) ].map( ( m ) => m[1] ) );
	assert.ok( defined.size >= 10, 'found ' + defined.size + ' sources' );
	const missing = [];
	for ( const m of ( calcData + articleData ).matchAll( /'sources'\s*=>\s*array\(([^)]*)\)/g ) ) {
		for ( const s of m[1].matchAll( /'([^']+)'/g ) ) {
			if ( ! defined.has( s[1] ) ) {
				missing.push( s[1] );
			}
		}
	}
	assert.deepEqual( missing, [] );
} );
