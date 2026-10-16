// Live site check (audit FIX-046): fetches calcmycard.com and checks what
// search engines see. Not part of `npm test`; run with `npm run monitor`.
// The "Live site monitor" workflow runs it every day and after each theme
// deploy, and a failed run emails the repository owner.
//
// Checks: robots.txt names a sitemap that returns XML; every calculator,
// guide and page the theme defines is in the sitemap; every sitemap URL
// returns 200, is indexable, has a self-referencing canonical and a title;
// the downloads exist; the live theme version matches the repo.
'use strict';
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const SITE = ( process.env.CMC_SITE || 'https://calcmycard.com' ).replace( /\/$/, '' );
const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );
const read = ( f ) => fs.readFileSync( path.join( THEME, f ), 'utf8' );
const UA = 'Mozilla/5.0 (compatible; CalcMyCard-monitor/1.0; +https://github.com/6977980-hash/calcmycard)';

const failures = [];
const notes = [];
const fail = ( msg ) => failures.push( msg );

async function get( url ) {
	for ( let attempt = 1; ; attempt++ ) {
		try {
			const res = await fetch( url, { headers: { 'user-agent': UA }, redirect: 'manual' } );
			return { status: res.status, headers: res.headers, body: await res.text() };
		} catch ( e ) {
			if ( attempt === 3 ) {
				return { status: 0, headers: new Headers(), body: String( e ) };
			}
			await new Promise( ( r ) => setTimeout( r, 2000 * attempt ) );
		}
	}
}

const isChallenge = ( r ) => /Checking your browser|cf-browser-verification|challenge-platform/i.test( r.body ) && ! /cmc-/.test( r.body );
const locs = ( xml ) => [ ...xml.matchAll( /<loc>\s*([^<\s]+)\s*<\/loc>/g ) ].map( ( m ) => m[1] );
const isXml = ( r ) => r.status === 200 && /<(urlset|sitemapindex)\b/.test( r.body );

async function sitemapUrls() {
	const robots = await get( SITE + '/robots.txt' );
	const named = ( robots.body.match( /^Sitemap:\s*(\S+)/mi ) || [] )[1];
	let index = null;
	if ( ! named ) {
		fail( 'robots.txt has no Sitemap: line' );
	} else {
		index = await get( named );
		if ( ! isXml( index ) ) {
			fail( 'Sitemap named in robots.txt (' + named + ') returns HTTP ' + index.status + ', not a sitemap. Fix: WordPress Settings > Permalinks > Save (rebuilds the rewrite rules).' );
			index = null;
		}
	}
	if ( ! index ) {
		// Keep checking the pages through Rank Math's query-string sitemap.
		index = await get( SITE + '/?sitemap=1' );
		if ( ! isXml( index ) ) {
			fail( 'Rank Math sitemap (/?sitemap=1) is also unavailable: HTTP ' + index.status );
			return [];
		}
		notes.push( 'Page list read from /?sitemap=1 because the pretty sitemap URL failed.' );
	}
	if ( /<urlset\b/.test( index.body ) ) {
		return locs( index.body );
	}
	const urls = [];
	for ( let child of locs( index.body ) ) {
		let r = await get( child );
		if ( ! isXml( r ) ) {
			// Pretty child URL broken too: try the query-string form.
			const type = ( child.match( /\/([a-z_]+)-sitemap\d*\.xml/ ) || [] )[1];
			const alt = type ? await get( SITE + '/?sitemap=' + type ) : r;
			if ( ! isXml( alt ) ) {
				fail( 'Child sitemap ' + child + ' returns HTTP ' + r.status );
				continue;
			}
			if ( r.status !== 200 ) {
				fail( 'Child sitemap ' + child + ' returns HTTP ' + r.status + ' (readable only as /?sitemap=' + type + ')' );
			}
			r = alt;
			child = SITE + '/?sitemap=' + type;
		}
		urls.push( ...locs( r.body ) );
	}
	return urls;
}

function expectedUrls() {
	const slugs = ( src ) => [ ...src.matchAll( /'slug'\s*=>\s*'([^']+)'/g ) ].map( ( m ) => m[1] );
	const pages = fs.readdirSync( path.join( THEME, 'content', 'pages' ) ).map( ( f ) => f.replace( /\.html$/, '' ) );
	return [
		SITE + '/',
		...slugs( read( 'inc/data-calculators.php' ) ).map( ( s ) => SITE + '/calculators/' + s + '/' ),
		...slugs( read( 'inc/data-articles.php' ) ).map( ( s ) => SITE + '/guides/' + s + '/' ),
		...pages.map( ( s ) => SITE + '/' + s + '/' ),
	];
}

async function checkPage( url ) {
	const r = await get( url );
	if ( r.status !== 200 ) {
		return fail( url + ': HTTP ' + r.status + ( r.headers.get( 'location' ) ? ' -> ' + r.headers.get( 'location' ) : '' ) );
	}
	const robots = ( r.body.match( /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i ) || [] )[1] || '';
	if ( /noindex/i.test( robots ) || /noindex/i.test( r.headers.get( 'x-robots-tag' ) || '' ) ) {
		fail( url + ': noindex' );
	}
	const canonical = ( r.body.match( /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i ) || [] )[1];
	if ( canonical !== url ) {
		fail( url + ': canonical is ' + ( canonical || 'missing' ) );
	}
	if ( ! /<title>[^<]{10,}<\/title>/i.test( r.body ) ) {
		fail( url + ': missing or short <title>' );
	}
}

async function pool( items, size, fn ) {
	const queue = [ ...items ];
	await Promise.all( Array.from( { length: size }, async () => {
		while ( queue.length ) {
			await fn( queue.shift() );
		}
	} ) );
}

( async () => {
	const home = await get( SITE + '/' );
	if ( isChallenge( home ) ) {
		// The host's bot check answered instead of WordPress: nothing below
		// would mean anything, and it is not a site problem.
		console.log( '::warning::' + SITE + ' answered with a browser check page; live checks skipped.' );
		return;
	}

	const inSitemap = await sitemapUrls();
	const expected = expectedUrls();
	if ( inSitemap.length ) {
		expected.filter( ( u ) => ! inSitemap.includes( u ) ).forEach( ( u ) => fail( 'Not in the sitemap: ' + u ) );
	}
	const urls = [ ...new Set( [ ...expected, ...inSitemap ] ) ];
	await pool( urls, 4, checkPage );

	const downloads = new Set();
	for ( const dir of [ 'content/articles', 'content/calculators', 'content/pages' ] ) {
		for ( const f of fs.readdirSync( path.join( THEME, dir ) ) ) {
			for ( const m of read( dir + '/' + f ).matchAll( /\/wp-content\/themes\/calcmycard\/assets\/downloads\/[^"'\s]+/g ) ) {
				downloads.add( m[0] );
			}
		}
	}
	for ( const d of downloads ) {
		const r = await get( SITE + d );
		if ( r.status !== 200 ) {
			fail( 'Download ' + d + ': HTTP ' + r.status );
		}
	}

	const repoVersion = ( read( 'style.css' ).match( /^Version:\s*(\S+)/m ) || [] )[1];
	const liveCss = await get( SITE + '/wp-content/themes/calcmycard/style.css?monitor=' + Date.now() );
	const liveVersion = ( liveCss.body.match( /^Version:\s*(\S+)/m ) || [] )[1];
	if ( liveVersion !== repoVersion ) {
		const msg = 'Live theme is ' + ( liveVersion || 'unknown' ) + ', repo main is ' + repoVersion;
		// Right after a merge the deploy takes a few minutes, so the
		// post-deploy run passes CMC_EXPECT_VERSION=1 to make this strict.
		process.env.CMC_EXPECT_VERSION ? fail( msg ) : notes.push( msg + ' (deploy may still be running).' );
	}

	const lines = [
		'## Live site monitor: ' + ( failures.length ? failures.length + ' problem(s)' : 'all good' ),
		'',
		'Checked ' + urls.length + ' URLs (' + inSitemap.length + ' in the sitemap), live theme ' + ( liveVersion || 'unknown' ) + '.',
		'',
		...failures.map( ( f ) => '- ❌ ' + f ),
		...notes.map( ( n ) => '- ℹ️ ' + n ),
	];
	console.log( lines.join( '\n' ) );
	if ( process.env.GITHUB_STEP_SUMMARY ) {
		fs.appendFileSync( process.env.GITHUB_STEP_SUMMARY, lines.join( '\n' ) + '\n' );
	}
	process.exitCode = failures.length ? 1 : 0;
} )();
