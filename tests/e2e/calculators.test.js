// Browser tests: every calculator script runs in real Chromium on a small
// harness page (the theme's own JS files, the same mount <div> the page
// template prints), including "Copy link to these results" round trips.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { pathToFileURL } = require( 'node:url' );
const { chromium } = require( 'playwright' );

const JS = path.join( __dirname, '..', '..', 'theme', 'calcmycard', 'assets', 'js' );
const CALCS = {
	interest: 'calc-interest.js',
	payoff: 'calc-payoff.js',
	minpayment: 'calc-minimum-payment.js',
	balancetransfer: 'calc-balance-transfer.js',
	multidebt: 'calc-multi-debt.js',
	apr: 'calc-apr.js',
	dpr: 'calc-daily-periodic-rate.js',
	extrapayment: 'calc-extra-payment.js',
	introapr: 'calc-intro-apr.js',
	utilization: 'calc-utilization.js',
	consolidationvstransfer: 'calc-consolidation-vs-transfer.js',
	cashadvance: 'calc-cash-advance.js',
	biweekly: 'calc-biweekly.js',
	interestcheck: 'calc-interest-check.js',
	fedrate: 'calc-fed-rate.js',
};

const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'cmc-e2e-' ) );
const harness = {};
for ( const [ id, file ] of Object.entries( CALCS ) ) {
	const src = ( f ) => pathToFileURL( path.join( JS, f ) ).href;
	const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + id + '</title></head><body>' +
		'<div id="cmc-calc-' + id + '" class="cmc-calculator" data-calc="' + id + '" style="width:760px"></div>' +
		[ 'finance-math.js', 'chart-helper.js', 'ui-helper.js', 'calculators/' + file ].map( ( f ) => '<script src="' + src( f ) + '"></script>' ).join( '' ) +
		'</body></html>';
	const p = path.join( dir, id + '.html' );
	fs.writeFileSync( p, html );
	harness[ id ] = pathToFileURL( p ).href;
}

let browser, context;
test.before( async () => {
	browser = await chromium.launch( process.env.CMC_CHROMIUM ? { executablePath: process.env.CMC_CHROMIUM } : {} );
	context = await browser.newContext();
	// Capture "Copy link" output instead of touching the real clipboard.
	await context.addInitScript( () => {
		window.__copied = null;
		Object.defineProperty( navigator, 'clipboard', { value: { writeText: ( t ) => { window.__copied = t; return Promise.resolve(); } } } );
	} );
} );
test.after( async () => {
	await browser.close();
	fs.rmSync( dir, { recursive: true, force: true } );
} );

async function open( id, query ) {
	const page = await context.newPage();
	const errors = [];
	page.on( 'pageerror', ( e ) => errors.push( e.message ) );
	page.on( 'console', ( m ) => { if ( m.type() === 'error' ) { errors.push( m.text() ); } } );
	await page.goto( harness[ id ] + ( query ? '?' + query : '' ) );
	await page.waitForFunction( () => document.readyState === 'complete' );
	page.errors = errors;
	return page;
}

const text = ( page, sel ) => page.locator( sel ).first().textContent().then( ( t ) => ( t || '' ).trim() );
const shown = ( page, sel ) => page.locator( sel ).first().isVisible();

// Set a field, fire the same events a user's typing does, and wait past
// the 120 ms debounce.
async function set( page, id, value ) {
	await page.evaluate( ( [ id, value ] ) => {
		const el = document.getElementById( id );
		el.value = value;
		el.dispatchEvent( new Event( 'input', { bubbles: true } ) );
		el.dispatchEvent( new Event( 'change', { bubbles: true } ) );
	}, [ id, String( value ) ] );
	await page.waitForTimeout( 250 );
}

async function statTexts( page ) {
	return page.$$eval( '.cmc-stat-value', ( els ) => els.map( ( e ) => e.textContent.trim() ) );
}

for ( const id of Object.keys( CALCS ) ) {
	test( id + ': renders defaults with results and no errors', async () => {
		const page = await open( id );
		assert.deepEqual( page.errors, [] );
		assert.equal( await shown( page, '#results' ), true );
		assert.equal( await shown( page, '.cmc-calc-error' ), false );
		const stats = await statTexts( page );
		assert.ok( stats.length >= 3 );
		stats.forEach( ( s ) => assert.ok( s && s !== '—' || stats.some( ( x ) => /\$|%|month|year/.test( x ) ), id + ' stat empty' ) );
		await page.close();
	} );

	test( id + ': "Copy link" round-trips to the same results', async () => {
		const page = await open( id );
		// Change one number so the link carries non-default inputs.
		const first = await page.$eval( '.cmc-calculator input[type=number]', ( el ) => el.id );
		const val = Number( await page.$eval( '#' + first, ( el ) => el.value ) );
		await set( page, first, val > 0 ? Math.round( val * 1.1 * 100 ) / 100 : 1 );
		const before = await statTexts( page );
		await page.click( '.cmc-share-bar button' );
		await page.waitForFunction( () => window.__copied );
		const link = await page.evaluate( () => window.__copied );
		const query = link.split( '?' )[1];
		assert.ok( query && query.includes( first + '=' ), 'link carries ' + first );
		const again = await open( id, query );
		assert.deepEqual( await statTexts( again ), before );
		assert.deepEqual( again.errors, [] );
		await page.close();
		await again.close();
	} );
}

test( 'payoff: page example $5,000 at 22.99% paying $175', async () => {
	const page = await open( 'payoff', 'mode=time&balance=5000&apr=22.99&payment=175' );
	assert.equal( await text( page, '#stat-months' ), '3 years, 6 months' );
	assert.equal( await text( page, '#stat-interest' ), '$2,310.32' );
	assert.equal( await text( page, '#stat-total' ), '$7,310.32' );
	await set( page, 'mode', 'goal' );
	await set( page, 'months', 24 );
	assert.equal( await text( page, '#stat-payment' ), '$261.85' );
	await page.close();
} );

test( 'extra payment: page example $5,000 at 22.99%, $150 + $50', async () => {
	const page = await open( 'extrapayment', 'balance=5000&apr=22.99&payment=150&extra=50' );
	assert.equal( await text( page, '#stat-months-saved' ), '19 months' );
	assert.equal( await text( page, '#stat-interest-saved' ), '$1,174.21' );
	await page.close();
} );

test( 'FIX-006: Discover share link uses the $20 + interest formula', async () => {
	const page = await open( 'minpayment', 'balance=3500&apr=23.99&issuer=discover&method=percent_plus_interest&percent=2&floor=35' );
	assert.equal( await text( page, '#stat-min' ), '$89.97' );
	assert.equal( await text( page, '#stat-months' ), '13 years, 10 months' );
	assert.equal( await text( page, '#stat-interest' ), '$6,107.78' );
	// Same numbers as picking Discover by hand.
	const byHand = await open( 'minpayment', 'balance=3500&apr=23.99' );
	await byHand.selectOption( '#issuer', 'discover' );
	await byHand.waitForTimeout( 250 );
	assert.equal( await text( byHand, '#stat-min' ), '$89.97' );
	await page.close();
	await byHand.close();
} );

test( 'FIX-011: minimum formula label explains the "% below if higher" rule', async () => {
	const page = await open( 'minpayment' );
	assert.equal( await text( page, '#method option[value=percent_plus_interest]' ), 'Interest + 1% of balance, or the % below if higher' );
	await page.close();
} );

test( 'FIX-007: multi-card share link keeps 4+ cards and removed cards stay removed', async () => {
	const q = 'name-0=A&balance-0=1000&apr-0=20&minpay-0=30&name-1=B&balance-1=2000&apr-1=25&minpay-1=50' +
		'&name-3=D&balance-3=3000&apr-3=18&minpay-3=60&name-4=E&balance-4=400&apr-4=29&minpay-4=25&extra=100';
	const page = await open( 'multidebt', q );
	const names = await page.$$eval( '.cmc-card-row input[type=text]', ( els ) => els.map( ( e ) => e.value ) );
	assert.deepEqual( names, [ 'A', 'B', 'D', 'E' ] );
	assert.equal( await page.$eval( '#balance-4', ( e ) => e.value ), '400' );
	// A newly added card gets an unused index.
	await page.click( '#add-card' );
	assert.equal( await page.locator( '#name-5' ).count(), 1 );
	// And the link it produces round-trips.
	await page.click( '.cmc-share-bar button' );
	await page.waitForFunction( () => window.__copied );
	const again = await open( 'multidebt', ( await page.evaluate( () => window.__copied ) ).split( '?' )[1] );
	assert.equal( await again.locator( '.cmc-card-row' ).count(), 5 );
	assert.deepEqual( await statTexts( again ), await statTexts( page ) );
	await page.close();
	await again.close();
} );

test( 'FIX-007: utilization share link rebuilds its rows', async () => {
	const q = 'uname-0=X&ubal-0=100&ulimit-0=1000&uname-2=Z&ubal-2=900&ulimit-2=1000&uname-3=W&ubal-3=0&ulimit-3=3000';
	const page = await open( 'utilization', q );
	const names = await page.$$eval( '.cmc-util-row input[type=text]', ( els ) => els.map( ( e ) => e.value ) );
	assert.deepEqual( names, [ 'X', 'Z', 'W' ] );
	assert.equal( await text( page, '#stat-overall' ), '20.0%' );
	await page.close();
} );

const NEGATIVE = {
	interest: 'apr', payoff: 'apr', minpayment: 'percent', balancetransfer: 'feePercent', multidebt: 'apr-0',
	apr: 'apr', dpr: 'balance', extrapayment: 'extra', introapr: 'plannedPayment', utilization: 'ubal-0',
	consolidationvstransfer: 'originationFee', cashadvance: 'feePercent', biweekly: 'apr', interestcheck: 'apr', fedrate: 'apr',
};
for ( const [ id, field ] of Object.entries( NEGATIVE ) ) {
	test( 'FIX-008: ' + id + ' rejects a negative ' + field + ' and hides results', async () => {
		const page = await open( id );
		await set( page, field, -5 );
		assert.equal( await shown( page, '.cmc-calc-error' ), true );
		assert.equal( await shown( page, '#results' ), false );
		await page.close();
	} );
}

test( 'FIX-010: consolidation needs a balance and whole months', async () => {
	const page = await open( 'consolidationvstransfer' );
	for ( const [ field, value ] of [ [ 'balance', 0 ], [ 'loanTerm', 36.5 ], [ 'promoMonths', 12.5 ] ] ) {
		await page.reload();
		await set( page, field, value );
		assert.equal( await shown( page, '.cmc-calc-error' ), true, field + '=' + value );
		assert.equal( await shown( page, '#results' ), false, field + '=' + value );
	}
	await page.close();
} );

test( 'FIX-009: over-50-year payoffs say so instead of "payment too low"', async () => {
	const big = 'balance=500000&apr=24&payment=10000.01';
	let page = await open( 'payoff', 'mode=time&' + big );
	assert.equal( await text( page, '#stat-date' ), 'More than 50 years' );
	await page.close();
	page = await open( 'payoff', 'mode=time&balance=1000&apr=30&payment=25' );
	assert.equal( await text( page, '#stat-date' ), 'Never at this payment' );
	await page.close();
	page = await open( 'interest', big );
	assert.equal( await text( page, '#stat-months' ), 'More than 50 years' );
	await page.close();
	page = await open( 'extrapayment', big + '&extra=0' );
	assert.equal( await text( page, '#stat-old-payoff' ), 'More than 50 years' );
	await page.close();
	page = await open( 'balancetransfer', 'balance=500000&currentApr=24&payment=10000.01&feePercent=0&promoApr=24&promoMonths=1&goToApr=24' );
	assert.match( await text( page, '#stat-stay-cost' ), /50 years/ );
	await page.close();
	page = await open( 'biweekly', big );
	assert.match( await text( page, '.cmc-calc-error' ), /more than 50 years/ );
	await page.close();
	page = await open( 'fedrate', 'balance=500000&apr=23.75&payment=10000.01&change=0.25' );
	assert.match( await text( page, '.cmc-calc-error' ), /more than 50 years/ );
	await page.close();
	page = await open( 'minpayment', 'balance=100000&apr=23.99&method=percent&percent=2&floor=0' );
	assert.equal( await text( page, '#stat-months' ), 'More than 50 years' );
	await page.close();
} );

test( 'FIX-012: extra payment hides the chart when the base never pays off', async () => {
	const page = await open( 'extrapayment' );
	assert.equal( await shown( page, '#chart-bar' ), true );
	await set( page, 'payment', 50 );
	assert.equal( await shown( page, '#chart-bar' ), false );
	await set( page, 'payment', 150 );
	assert.equal( await shown( page, '#chart-bar' ), true );
	await page.close();
} );

test( 'FIX-013: chart downsampling keeps the final point', async () => {
	const page = await open( 'payoff' );
	const out = await page.evaluate( () => {
		const vals = Array.from( { length: 55 }, ( _, i ) => 55 - i - 1 );
		return window.CMCChart.downsample( vals, 40 );
	} );
	assert.equal( out[0], 54 );
	assert.equal( out[ out.length - 1 ], 0 );
	assert.ok( out.length <= 41 );
	await page.close();
} );

// Edge cases: no result may ever read NaN or Infinity, and the browser
// must not log an error, whatever single input is pushed to an extreme.
async function noBadNumbers( page, label ) {
	const body = await page.$eval( '.cmc-calculator', ( el ) => el.innerText );
	assert.ok( ! /NaN|Infinity|undefined/.test( body ), label + ' shows NaN/Infinity/undefined' );
	assert.deepEqual( page.errors, [], label + ' logged an error' );
}

for ( const id of Object.keys( CALCS ) ) {
	test( id + ': extreme single inputs ($0, $1, 0%, 100%, decimals) never show NaN', async () => {
		const page = await open( id );
		const ids = await page.$$eval( '.cmc-calculator input[type=number]', ( els ) => els.map( ( e ) => e.id ) );
		for ( const field of ids ) {
			for ( const v of [ 0, 1, 100, 19.99 ] ) {
				await page.reload();
				await set( page, field, v );
				await noBadNumbers( page, id + ' ' + field + '=' + v );
			}
		}
		await page.close();
	} );
}

test( 'edge: payment equal to the monthly interest never pays off', async () => {
	const page = await open( 'interest', 'balance=1000&apr=30&payment=25' );
	assert.equal( await text( page, '#stat-months' ), 'Never (payment too low)' );
	await page.close();
} );

test( 'edge: 0% promo and 0% fee balance transfer', async () => {
	const page = await open( 'balancetransfer', 'balance=6000&currentApr=24.99&payment=300&feePercent=0&promoApr=0&promoMonths=20&goToApr=24.99' );
	assert.equal( await text( page, '#stat-fee' ), '$0.00' );
	assert.equal( await text( page, '#stat-transfer-cost' ), '$0.00' );
	await noBadNumbers( page, 'bt 0/0' );
	await page.close();
} );

test( 'edge: snowball/avalanche with equal APRs and equal balances, minimum above balance', async () => {
	const page = await open( 'multidebt', 'name-0=A&balance-0=2000&apr-0=20&minpay-0=50&name-1=B&balance-1=2000&apr-1=20&minpay-1=50&name-2=C&balance-2=30&apr-2=20&minpay-2=80&extra=100' );
	assert.equal( await text( page, '#stat-snow-interest' ), await text( page, '#stat-aval-interest' ) );
	await noBadNumbers( page, 'multi equal' );
	await page.close();
} );

test( 'edge: $0 credit limit and utilization above 100%', async () => {
	const page = await open( 'utilization', 'uname-0=A&ubal-0=1500&ulimit-0=1000&uname-1=B&ubal-1=200&ulimit-1=0' );
	assert.equal( await text( page, '#stat-overall' ), '150.0%' );
	assert.match( await page.$eval( '#table-wrap', ( e ) => e.textContent ), /Enter a credit limit/ );
	await set( page, 'ulimit-0', 0 );
	assert.equal( await shown( page, '.cmc-calc-error' ), true );
	await page.close();
} );

test( 'edge: minimum payment floor applies and never exceeds the payoff amount', async () => {
	const page = await open( 'minpayment', 'balance=20&apr=24&method=percent&percent=2&floor=25' );
	assert.equal( await text( page, '#stat-min' ), '$20.40' );
	await page.close();
} );
