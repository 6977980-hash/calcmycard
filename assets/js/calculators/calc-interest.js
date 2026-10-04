/**
 * Credit Card Interest Calculator — the site's flagship tool.
 * Shows the principal/interest split of the next payment, total interest
 * to payoff, and a donut + balance-decline chart.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-interest' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 5000, min: 0, step: '0.01', hint: 'Your current statement balance' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 24.99, min: 0, step: '0.01', hint: 'Check your card statement or agreement' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 150, min: 0, step: '0.01', hint: 'What you plan to pay each month' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-interest-portion', label: "Interest in next payment", value: '' },
				{ id: 'stat-principal-portion', label: 'Principal in next payment', value: '' },
				{ id: 'stat-total-interest', label: 'Total interest until payoff', value: '', highlight: true },
				{ id: 'stat-months', label: 'Time to pay off', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-donut" height="220"></canvas></div>' +
			'<h3>Year-by-year breakdown</h3>' +
			'<div id="table-wrap"></div>' +
			'<div class="cmc-table-actions" id="table-actions"></div>' +
		'</div>';

	var lastSchedule = [];
	UI.tableActions( root, 'table-actions', function () {
		return {
			title: 'Credit card payoff schedule',
			filename: 'credit-card-interest-schedule.csv',
			headers: [ 'Month', 'Payment', 'Interest', 'Principal', 'Ending balance' ],
			rows: lastSchedule.map( function ( r ) {
				return [ r.month, r.payment.toFixed( 2 ), r.interest.toFixed( 2 ), r.principal.toFixed( 2 ), r.balance.toFixed( 2 ) ];
			} ),
		};
	} );

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || apr < 0 || payment <= 0 ) {
			err.textContent = 'Enter a balance greater than 0 and a monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		// Round this month's interest to the cent before splitting the payment,
		// so the two displayed parts always add back up to the payment.
		var monthlyInterest = Math.round( balance * F.monthlyRate( apr ) * 100 ) / 100;
		var principalPortion = Math.max( 0, payment - monthlyInterest );

		root.querySelector( '#stat-interest-portion' ).textContent = F.currency( Math.min( monthlyInterest, payment ) );
		root.querySelector( '#stat-principal-portion' ).textContent = F.currency( principalPortion );

		var result = F.amortize( { balance: balance, apr: apr, payment: payment } );

		if ( result.neverPaysOff ) {
			root.querySelector( '#stat-total-interest' ).textContent = 'Balance never shrinks';
			root.querySelector( '#stat-months' ).textContent = 'Never (payment too low)';
			lastSchedule = [];
			root.querySelector( '#table-actions' ).style.display = 'none';
			root.querySelector( '#table-wrap' ).innerHTML = '<p class="cmc-muted">Your payment doesn\'t cover the monthly interest (' + F.currency( monthlyInterest ) + '), so the balance will keep growing. Increase your payment to see a payoff timeline.</p>';
		} else {
			lastSchedule = result.schedule;
			root.querySelector( '#table-actions' ).style.display = '';
			root.querySelector( '#stat-total-interest' ).textContent = F.currency( result.totalInterest );
			root.querySelector( '#stat-months' ).textContent = F.monthsToYearsMonths( result.months );

			var rows = ( result.months > 36 ? F.annualSummary( result.schedule ) : result.schedule.map( function ( r ) {
				return { year: null, month: r.month, interest: r.interest, principal: r.principal, paid: r.payment, endBalance: r.balance };
			} ) );

			var isAnnual = result.months > 36;
			var tableRows = rows.map( function ( r ) {
				return [
					isAnnual ? ( 'Year ' + r.year ) : ( 'Month ' + r.month ),
					F.currencyRounded( r.interest ),
					F.currencyRounded( r.principal ),
					F.currencyRounded( r.endBalance ),
				];
			} );
			root.querySelector( '#table-wrap' ).innerHTML = UI.table( [ isAnnual ? 'Year' : 'Month', 'Interest Paid', 'Principal Paid', 'Ending Balance' ], tableRows );
		}

		C.drawDonut( root.querySelector( '#chart-donut' ), {
			labels: [ 'Principal', 'Interest (next payment)' ],
			values: [ Math.max( 0.01, principalPortion ), Math.max( 0.01, Math.min( monthlyInterest, payment ) ) ],
			colors: [ C.palette.accent, C.palette.brand ],
		} );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
