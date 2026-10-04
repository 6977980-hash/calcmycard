/**
 * Credit Card Payoff Calculator — headline output is a real calendar
 * payoff date and month count, plus an automatic "add $50/mo" comparison,
 * a balance decline chart, and a milestone table (25%/50%/75%/90%/100%
 * paid down). It absorbed the former Payoff Time Calculator.
 *
 * Two modes: "I know my payment" (how long?) and "I have a deadline"
 * (what payment pays it off in N months?). The goal payment is the
 * standard amortizing payment, B × r ÷ (1 − (1 + r)^−n), rounded up to
 * the cent, then run through the same schedule.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-payoff' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'mode', label: 'What do you want to find?', type: 'select', value: 'time', options: [
				{ value: 'time', label: 'How long it takes at my payment' },
				{ value: 'goal', label: 'The payment to be debt-free by a date' },
			] } ),
			UI.field( { id: 'balance', label: 'Current balance', value: 5000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 22.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 175, min: 0, step: '0.01' } ),
			UI.field( { id: 'months', label: 'Pay it off in (months)', value: 24, min: 1, max: 600, step: '1', hint: '12 = 1 year, 24 = 2 years, 36 = 3 years' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-date', label: 'Debt-free date', value: '', highlight: true },
				{ id: 'stat-months', label: 'Time to pay off', value: '' },
				{ id: 'stat-payment', label: 'Monthly payment', value: '' },
				{ id: 'stat-interest', label: 'Total interest paid', value: '' },
				{ id: 'stat-total', label: 'Total amount paid', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-line" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
			'<div class="cmc-answer-box" id="whatif" style="display:none;"></div>' +
			'<div id="milestones"><h3>Milestones along the way</h3><div id="table-wrap"></div>' +
				'<details class="cmc-schedule"><summary>Month-by-month schedule</summary><div id="schedule-wrap"></div></details>' +
				'<div class="cmc-table-actions" id="table-actions"></div>' +
			'</div>' +
		'</div>';

	var lastSchedule = [];
	UI.tableActions( root, 'table-actions', function () {
		return {
			title: 'Credit card payoff schedule',
			filename: 'credit-card-payoff-schedule.csv',
			headers: [ 'Month', 'Payment', 'Interest', 'Principal', 'Ending balance' ],
			rows: lastSchedule.map( function ( r ) {
				return [ r.month, r.payment.toFixed( 2 ), r.interest.toFixed( 2 ), r.principal.toFixed( 2 ), r.balance.toFixed( 2 ) ];
			} ),
		};
	} );

	function show( id, visible ) {
		root.querySelector( '#' + id ).closest( '.cmc-field' ).style.display = visible ? '' : 'none';
	}

	function goalPayment( balance, apr, months ) {
		var r = F.monthlyRate( apr );
		var p = r === 0 ? balance / months : balance * r / ( 1 - Math.pow( 1 + r, -months ) );
		return Math.ceil( p * 100 - 1e-9 ) / 100;
	}

	function addMonths( date, months ) {
		// Work from the 1st of the month so e.g. Jan 31 + 1 month can't
		// overflow into March.
		var d = new Date( date.getFullYear(), date.getMonth(), 1 );
		d.setMonth( d.getMonth() + months );
		return d;
	}

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var goal = root.querySelector( '#mode' ).value === 'goal';
		var months = Math.round( UI.num( root, 'months' ) );
		show( 'payment', ! goal );
		show( 'months', goal );
		var payment = goal ? ( balance > 0 && months >= 1 ? goalPayment( balance, apr, months ) : 0 ) : UI.num( root, 'payment' );
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || payment <= 0 || ( goal && ( months < 1 || months > 600 ) ) ) {
			err.textContent = goal ? 'Enter a balance greater than 0 and a payoff time between 1 and 600 months.' : 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var result = F.amortize( { balance: balance, apr: apr, payment: payment } );
		root.querySelector( '#stat-payment' ).textContent = F.currency( payment );
		var minRequired = balance * F.monthlyRate( apr );
		var answer = root.querySelector( '#answer' );
		var chart = root.querySelector( '#chart-line' ).parentNode;

		if ( result.neverPaysOff ) {
			root.querySelector( '#stat-date' ).textContent = 'Never at this payment';
			root.querySelector( '#stat-months' ).textContent = '—';
			root.querySelector( '#stat-interest' ).textContent = '—';
			root.querySelector( '#stat-total' ).textContent = '—';
			root.querySelector( '#whatif' ).style.display = 'none';
			root.querySelector( '#milestones' ).style.display = 'none';
			lastSchedule = [];
			chart.style.display = 'none';
			answer.innerHTML = '<span class="cmc-answer-label">Payment too low</span><p>Your payment of ' + F.currency( payment ) + ' doesn\'t cover the ' + F.currency( minRequired ) + ' in monthly interest, so the balance will never go down. You need to pay more than ' + F.currency( minRequired ) + ' per month just to make progress.</p>';
			return;
		}
		root.querySelector( '#milestones' ).style.display = '';
		chart.style.display = '';

		var payoffDate = addMonths( new Date(), result.months );
		var dateStr = payoffDate.toLocaleDateString( 'en-US', { month: 'long', year: 'numeric' } );

		root.querySelector( '#stat-date' ).textContent = dateStr;
		root.querySelector( '#stat-months' ).textContent = F.monthsToYearsMonths( result.months );
		root.querySelector( '#stat-interest' ).textContent = F.currency( result.totalInterest );
		root.querySelector( '#stat-total' ).textContent = F.currency( result.totalPaid );
		lastSchedule = result.schedule;
		root.querySelector( '#schedule-wrap' ).innerHTML = UI.table( [ 'Month', 'Payment', 'Interest', 'Principal', 'Balance' ], result.schedule.map( function ( r ) {
			return [ r.month, F.currency( r.payment ), F.currency( r.interest ), F.currency( r.principal ), F.currency( r.balance ) ];
		} ) );
		if ( goal ) {
			answer.innerHTML = '<span class="cmc-answer-label">Payment you need</span><p>To pay off ' + F.currency( balance ) + ' at ' + F.percent( apr ) + ' APR in ' + months + ' month' + ( months === 1 ? '' : 's' ) + ', pay <strong>' + F.currency( payment ) + ' a month</strong>. You\'d pay ' + F.currency( result.totalInterest ) + ' in interest and be debt-free in ' + dateStr + ', assuming no new charges.</p>';
		} else answer.innerHTML = '<span class="cmc-answer-label">How long it takes</span><p>At ' + F.currency( payment ) + '/month on a ' + F.currency( balance ) + ' balance at ' + F.percent( apr ) + ' APR, it takes <strong>' + result.months + ' month' + ( result.months === 1 ? '' : 's' ) + ' (' + F.monthsToYearsMonths( result.months ) + ')</strong> to reach a zero balance, and you\'ll pay ' + F.currency( result.totalInterest ) + ' in interest. Your payment must stay above ' + F.currency( minRequired ) + ' (one month\'s interest) to make progress.</p>';

		var milestones = [ 0.25, 0.5, 0.75, 0.9, 1.0 ];
		var rows = [];
		var targetIdx = 0;
		result.schedule.forEach( function ( row ) {
			var paidDownFraction = 1 - ( row.balance / balance );
			while ( targetIdx < milestones.length && paidDownFraction >= milestones[ targetIdx ] - 0.0001 ) {
				rows.push( [ Math.round( milestones[ targetIdx ] * 100 ) + '% paid off', 'Month ' + row.month, F.currencyRounded( row.balance ) + ' remaining' ] );
				targetIdx++;
			}
		} );
		root.querySelector( '#table-wrap' ).innerHTML = UI.table( [ 'Milestone', 'Reached at', 'Balance Remaining' ], rows );

		var withExtra = F.amortize( { balance: balance, apr: apr, payment: payment, extra: 50 } );
		var whatif = root.querySelector( '#whatif' );
		if ( ! withExtra.neverPaysOff && withExtra.months < result.months ) {
			var monthsSaved = result.months - withExtra.months;
			var interestSaved = result.totalInterest - withExtra.totalInterest;
			whatif.style.display = 'block';
			whatif.innerHTML = '<span class="cmc-answer-label">What if you added $50/month?</span><p>You\'d be debt-free ' + monthsSaved + ' month' + ( monthsSaved === 1 ? '' : 's' ) + ' sooner and save ' + F.currency( interestSaved ) + ' in interest. Try the <a href="/calculators/extra-payment-savings-calculator/">Extra Payment Savings Calculator</a> to test your own amount.</p>';
		} else {
			whatif.style.display = 'none';
		}

		var labels = [ 'Now' ];
		var balances = [ balance ];
		result.schedule.forEach( function ( row ) {
			balances.push( row.balance );
			labels.push( 'M' + row.month );
		} );
		// Downsample to at most ~40 points for a clean line.
		var step = Math.max( 1, Math.ceil( balances.length / 40 ) );
		var sBalances = balances.filter( function ( _, i ) { return i % step === 0; } );
		var sLabels = labels.filter( function ( _, i ) { return i % step === 0; } );

		C.drawLineChart( root.querySelector( '#chart-line' ), [
			{ data: sBalances, color: C.palette.brand },
		], sLabels );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
