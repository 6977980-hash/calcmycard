// Unit tests for the shared calculator math (CMCFinance). Fixtures are
// the worked examples published on the calculator pages, plus an
// independent reference implementation checked over a grid of inputs.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const F = require( '../load-finance' )();

const cents = ( n ) => Math.round( n * 100 ) / 100;
function near( actual, expected, tol, msg ) {
	assert.ok( Math.abs( actual - expected ) <= tol, ( msg || '' ) + ' expected ' + expected + ' ± ' + tol + ', got ' + actual );
}

// Independent reference: plain month-by-month loop written separately
// from finance-math.js (no shared code), APR / 12 monthly model.
function reference( balance, apr, payment ) {
	const r = apr / 1200;
	let bal = balance, months = 0, interest = 0;
	while ( bal > 0.005 ) {
		if ( months >= 600 ) { return { never: true, capped: true }; }
		const i = bal * r;
		if ( payment - i <= 1e-9 && payment < bal + i ) { return { never: true, capped: false }; }
		const pay = Math.min( payment, bal + i );
		bal = bal + i - pay;
		interest += i;
		months++;
	}
	return { never: false, months, interest };
}

test( 'payoff page example: $5,000 at 22.99% paying $175', () => {
	const r = F.amortize( { balance: 5000, apr: 22.99, payment: 175 } );
	assert.equal( r.months, 42 );
	const s = r.schedule;
	assert.equal( cents( s[0].interest ), 95.79 );
	assert.equal( cents( s[0].balance ), 4920.79 );
	assert.equal( cents( s[1].balance ), 4840.07 );
	assert.equal( cents( s[2].balance ), 4757.79 );
	assert.equal( cents( s[11].balance ), 3942.66 );
	assert.equal( cents( s[23].balance ), 2614.93 );
	assert.equal( cents( s[35].balance ), 947.63 );
	assert.equal( cents( s[41].payment ), 135.32 );
	assert.equal( cents( s[41].interest ), 2.54 );
	assert.equal( cents( r.totalInterest ), 2310.32 );
	const extra = F.amortize( { balance: 5000, apr: 22.99, payment: 175, extra: 50 } );
	assert.equal( extra.months, 30 );
	near( extra.totalInterest, 1577, 1 );
} );

test( 'extra payment page example: $5,000 at 22.99% paying $150', () => {
	const base = F.amortize( { balance: 5000, apr: 22.99, payment: 150 } );
	assert.equal( base.months, 54 );
	assert.equal( cents( base.totalInterest ), 3045.29 );
	const rows = [ [ 25, 42, 2310.32 ], [ 50, 35, 1871.08 ], [ 100, 26, 1365.57 ], [ 150, 21, 1081.17 ] ];
	for ( const [ extra, months, interest ] of rows ) {
		const r = F.amortize( { balance: 5000, apr: 22.99, payment: 150, extra } );
		assert.equal( r.months, months, '+$' + extra );
		assert.equal( cents( r.totalInterest ), interest, '+$' + extra );
	}
} );

test( 'payoff page goal-payment table (22.99% APR)', () => {
	const goal = ( b, n ) => { const r = F.monthlyRate( 22.99 ); return Math.ceil( b * r / ( 1 - Math.pow( 1 + r, -n ) ) * 100 - 1e-9 ) / 100; };
	const table = { 3000: [ 282.22, 157.11, 116.12 ], 5000: [ 470.36, 261.85, 193.53 ], 10000: [ 940.72, 523.69, 387.05 ] };
	for ( const [ b, pays ] of Object.entries( table ) ) {
		[ 12, 24, 36 ].forEach( ( n, i ) => {
			assert.equal( goal( Number( b ), n ), pays[ i ], '$' + b + ' in ' + n );
			assert.equal( F.amortize( { balance: Number( b ), apr: 22.99, payment: pays[ i ] } ).months, n );
		} );
	}
} );

const ISSUERS = {
	chase:      { method: 'percent_plus_interest', percent: 0, floor: 40, interestPlusPercent: 1, interestPlusFixed: 0 },
	citi:       { method: 'percent_plus_interest', percent: 0, floor: 41, interestPlusPercent: 1, interestPlusFixed: 0 },
	discover:   { method: 'percent_plus_interest', percent: 2, floor: 35, interestPlusPercent: 0, interestPlusFixed: 20 },
	capitalone: { method: 'percent_plus_interest', percent: 0, floor: 25, interestPlusPercent: 1, interestPlusFixed: 0 },
	amex:       { method: 'percent_plus_interest', percent: 2, floor: 40, interestPlusPercent: 1, interestPlusFixed: 0 },
};

test( 'minimum payment page: first minimum by issuer at 23.99%', () => {
	const table = {
		1000:  [ 40.00, 41.00, 39.99, 29.99, 40.00 ],
		2500:  [ 74.98, 74.98, 69.98, 74.98, 74.98 ],
		5000:  [ 149.96, 149.96, 119.96, 149.96, 149.96 ],
		10000: [ 299.92, 299.92, 219.92, 299.92, 299.92 ],
	};
	const order = [ 'chase', 'citi', 'discover', 'capitalone', 'amex' ];
	for ( const [ b, mins ] of Object.entries( table ) ) {
		order.forEach( ( k, i ) => {
			const m = F.estimateMinimumPayment( Object.assign( { balance: Number( b ), apr: 23.99 }, ISSUERS[ k ] ) );
			assert.equal( cents( m ), mins[ i ], k + ' $' + b );
		} );
	}
} );

test( 'minimum payment page: Chase-style minimum-only payoff at 23.99%', () => {
	const rows = [ [ 1000, 35, 400 ], [ 2500, 119, 3217 ], [ 5000, 187, 8215 ], [ 10000, 256, 18211 ] ];
	for ( const [ b, months, interest ] of rows ) {
		const r = F.simulateMinimumOnly( Object.assign( { balance: b, apr: 23.99 }, ISSUERS.chase ) );
		assert.equal( r.months, months, '$' + b );
		near( r.totalInterest, interest, 1, '$' + b );
	}
	const disc = F.simulateMinimumOnly( Object.assign( { balance: 10000, apr: 23.99 }, ISSUERS.discover ) );
	near( disc.months / 12, 41, 1, 'Discover $10,000 years' );
	assert.ok( disc.totalInterest > 50000 );
} );

test( 'FIX-006 fixture: Discover formula on $3,500 at 23.99%', () => {
	const opts = Object.assign( { balance: 3500, apr: 23.99 }, ISSUERS.discover );
	assert.equal( cents( F.estimateMinimumPayment( opts ) ), 89.97 );
	const r = F.simulateMinimumOnly( opts );
	assert.equal( r.months, 166 );
	assert.equal( cents( r.totalInterest ), 6107.78 );
} );

test( 'FIX-009: payment equal to interest is "never", not capped', () => {
	const r = F.amortize( { balance: 1000, apr: 30, payment: 25 } );
	assert.equal( r.neverPaysOff, true );
	assert.equal( r.capped, false );
	assert.equal( F.neverText( r ), 'Never (payment too low)' );
	const below = F.amortize( { balance: 5000, apr: 22.99, payment: 50 } );
	assert.equal( below.neverPaysOff, true );
	assert.equal( below.capped, false );
} );

test( 'FIX-009: shrinking balance past 600 months is flagged capped', () => {
	const r = F.amortize( { balance: 500000, apr: 24, payment: 10000.01 } );
	assert.equal( r.neverPaysOff, true );
	assert.equal( r.capped, true );
	assert.equal( F.neverText( r ), 'More than 50 years' );
	const longer = F.amortize( { balance: 500000, apr: 24, payment: 10000.01, maxMonths: 2000 } );
	assert.equal( longer.months, 698 );
	const minOnly = F.simulateMinimumOnly( { balance: 100000, apr: 23.99, method: 'percent', percent: 2.0, floor: 0 } );
	assert.equal( minOnly.capped, true );
} );

test( 'multi-card: capped vs. never', () => {
	const never = F.simulateMultiCardPayoff( [ { balance: 5000, apr: 24, minPayment: 50 } ], 0, 'avalanche' );
	assert.equal( never.neverPaysOff, true );
	assert.equal( never.capped, false );
	const capped = F.simulateMultiCardPayoff( [ { balance: 500000, apr: 24, minPayment: 10000.01 } ], 0, 'avalanche' );
	assert.equal( capped.neverPaysOff, true );
	assert.equal( capped.capped, true );
} );

test( 'multi-card: avalanche never costs more than snowball (default cards)', () => {
	const cards = [
		{ name: 'Card 1', balance: 1200, apr: 19.99, minPayment: 35 },
		{ name: 'Card 2', balance: 4500, apr: 26.99, minPayment: 95 },
		{ name: 'Card 3', balance: 2300, apr: 22.99, minPayment: 55 },
	];
	const s = F.simulateMultiCardPayoff( cards, 200, 'snowball' );
	const a = F.simulateMultiCardPayoff( cards, 200, 'avalanche' );
	assert.ok( a.totalInterest <= s.totalInterest + 1e-6 );
	assert.equal( s.payoffOrder[0].name, 'Card 1' );
	assert.equal( a.payoffOrder[0].name, 'Card 2' );
	assert.equal( a.monthlyBudget, 385 );
} );

test( 'amortize matches the independent reference over a grid', () => {
	let checked = 0;
	for ( const balance of [ 250, 1000, 3500, 7777.77, 20000 ] ) {
		for ( const apr of [ 0, 9.99, 18, 24.99, 29.99, 36 ] ) {
			for ( const payment of [ 20, 75, 150, 400, 2500 ] ) {
				const a = F.amortize( { balance, apr, payment } );
				const ref = reference( balance, apr, payment );
				assert.equal( a.neverPaysOff, ref.never, JSON.stringify( { balance, apr, payment } ) );
				if ( ref.never ) {
					assert.equal( a.capped, ref.capped );
				} else {
					assert.equal( a.months, ref.months );
					near( a.totalInterest, ref.interest, 1e-6 );
					near( a.totalPaid, balance + ref.interest, 1e-6 );
				}
				checked++;
			}
		}
	}
	assert.equal( checked, 150 );
} );

test( 'monthsToPayoff closed form agrees with amortize', () => {
	for ( const [ b, apr, p ] of [ [ 5000, 22.99, 175 ], [ 5000, 22.99, 150 ], [ 3000, 0, 100 ], [ 1200, 19.99, 35 ] ] ) {
		assert.equal( F.monthsToPayoff( b, apr, p ), F.amortize( { balance: b, apr, payment: p } ).months );
	}
	assert.equal( F.monthsToPayoff( 5000, 22.99, 50 ), null );
} );

test( 'zero balance and 0% APR edge cases', () => {
	assert.equal( F.amortize( { balance: 0, apr: 20, payment: 100 } ).months, 0 );
	const z = F.amortize( { balance: 1000, apr: 0, payment: 100 } );
	assert.equal( z.months, 10 );
	assert.equal( z.totalInterest, 0 );
	assert.equal( F.estimateMinimumPayment( { balance: 0, apr: 20 } ), 0 );
	assert.equal( cents( F.estimateMinimumPayment( { balance: 20, apr: 24 } ) ), 20.4 ); // floor capped at payoff amount
} );

test( 'formatting helpers', () => {
	assert.equal( F.currency( 1234.5 ), '$1,234.50' );
	assert.equal( F.currencyRounded( 1234.5 ), '$1,235' );
	assert.equal( F.percent( 22.99 ), '22.99%' );
	assert.equal( F.monthsToYearsMonths( 42 ), '3 years, 6 months' );
	assert.equal( F.monthsToYearsMonths( 12 ), '1 year' );
	assert.equal( F.monthsToYearsMonths( 0 ), '0 months' );
	assert.equal( F.monthsToYearsMonths( null ), 'Never (payment too low)' );
	assert.equal( cents( F.dailyPeriodicRate( 36.5 ) * 100 ), 0.1 );
} );

test( 'FIX-036: new monthly charges, hand-checked', () => {
	// $1,000 at 12% (1% a month), $100 of charges, $300 payment:
	// 1,100 + 11 - 300 = 811; 911 + 9.11 - 300 = 620.11; ... paid in month 6.
	const r = F.amortize( { balance: 1000, apr: 12, payment: 300, charges: 100 } );
	assert.equal( r.months, 6 );
	assert.equal( cents( r.schedule[0].balance ), 811 );
	assert.equal( cents( r.schedule[1].balance ), 620.11 );
	assert.equal( cents( r.schedule[2].balance ), 427.31 );
	near( r.schedule[5].payment, 137.27, 0.01, 'final payment' );
	near( r.totalPaid, 1000 + 6 * 100 + r.totalInterest, 1e-6, 'paid = balance + charges + interest' );
	// No charges keeps the old behavior; charges eating the payment never pay off.
	assert.deepEqual( F.amortize( { balance: 5000, apr: 22.99, payment: 175, charges: 0 } ).months, 42 );
	const page = F.amortize( { balance: 5000, apr: 22.99, payment: 175, charges: 50 } );
	assert.equal( page.months, 78 );
	assert.equal( Math.round( page.totalInterest ), 4745 );
	const never = F.amortize( { balance: 5000, apr: 22.99, payment: 175, charges: 100 } );
	assert.equal( never.neverPaysOff, true );
	assert.equal( never.capped, false );
} );

test( 'FIX-035: keeping the first minimum fixed matches the study CSV', () => {
	const chase = { balance: 5000, apr: 22.15, percent: 0, floor: 40, method: 'percent_plus_interest', interestPlusPercent: 1, interestPlusFixed: 0 };
	const first = F.estimateMinimumPayment( chase );
	assert.equal( cents( first ), 142.29 );
	assert.equal( F.simulateMinimumOnly( chase ).months, 184 );
	const fixed = F.amortize( { balance: 5000, apr: 22.15, payment: first } );
	assert.equal( fixed.months, 58 );
	assert.equal( cents( fixed.totalInterest ), 3136.67 );
} );

test( 'FIX-040: shrinking minimums on the multi-card page example', () => {
	const cards = [
		{ name: 'Card 1', balance: 1200, apr: 19.99, minPayment: 35 },
		{ name: 'Card 2', balance: 4500, apr: 26.99, minPayment: 95 },
		{ name: 'Card 3', balance: 2300, apr: 22.99, minPayment: 55 },
	];
	const snow = F.simulateMultiCardPayoff( cards, 200, 'snowball', { shrink: { floor: 25 } } );
	const aval = F.simulateMultiCardPayoff( cards, 200, 'avalanche', { shrink: { floor: 25 } } );
	assert.equal( snow.monthlyBudget, 385 ); // month 1 = the entered minimums + extra
	assert.equal( snow.months, 34 );
	assert.equal( cents( snow.totalInterest ), 3096.41 );
	assert.equal( aval.months, 35 );
	assert.equal( cents( aval.totalInterest ), 2901.67 );
	assert.ok( aval.totalInterest < snow.totalInterest );
	// Fixed minimums (no option) are unchanged.
	assert.equal( cents( F.simulateMultiCardPayoff( cards, 200, 'avalanche' ).totalInterest ), 2446.97 );
	// One card, no extra, 2% share with a $25 floor: month 2's minimum is
	// 2% of the month-start balance (1,000 + 20 interest - 20 = 1,000), so
	// the minimum only matches interest and the balance never falls.
	const flat = F.simulateMultiCardPayoff( [ { balance: 1000, apr: 24, minPayment: 20 } ], 0, 'avalanche', { shrink: { floor: 0 } } );
	assert.equal( flat.neverPaysOff, true );
	assert.equal( flat.capped, false );
} );
