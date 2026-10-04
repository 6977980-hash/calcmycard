/**
 * Credit Card Minimum Payment Calculator — estimates this month's minimum
 * payment, then simulates the full "minimum payments only" scenario so
 * users see the real long-term cost.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-minpayment' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 3500, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 23.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'method', label: 'Minimum payment formula', type: 'select', value: 'percent_plus_interest', options: [
				{ value: 'percent_plus_interest', label: 'Interest + 1% of balance (a common formula)' },
				{ value: 'percent', label: 'Flat % of balance only' },
			] } ),
			UI.field( { id: 'percent', label: 'Minimum payment %', value: 2, min: 0, step: '0.1', hint: 'Varies by card; check your cardholder agreement' } ),
			UI.field( { id: 'floor', label: 'Minimum payment floor ($)', value: 25, min: 0, step: '1' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-min', label: "This month's minimum payment", value: '', highlight: true },
				{ id: 'stat-months', label: 'Time to pay off (minimum only)', value: '' },
				{ id: 'stat-interest', label: 'Total interest (minimum only)', value: '' },
				{ id: 'stat-total', label: 'Total paid (minimum only)', value: '' },
			] ) +
			'<div class="cmc-answer-box" id="warnbox"></div>' +
			'<div class="cmc-chart-wrap"><canvas id="chart-line" height="220"></canvas></div>' +
		'</div>';

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var method = root.querySelector( '#method' ).value;
		var percent = UI.num( root, 'percent' );
		var floor = UI.num( root, 'floor' );
		var err = root.querySelector( '#err' );

		if ( balance < 0 ) {
			err.textContent = 'Enter a balance greater than 0.';
			err.style.display = 'block';
			return;
		}
		err.style.display = 'none';

		var minPay = F.estimateMinimumPayment( { balance: balance, apr: apr, percent: percent, floor: floor, method: method } );
		root.querySelector( '#stat-min' ).textContent = F.currency( minPay );

		var sim = F.simulateMinimumOnly( { balance: balance, apr: apr, percent: percent, floor: floor, method: method } );

		if ( sim.neverPaysOff ) {
			root.querySelector( '#stat-months' ).textContent = 'Never at this rate';
			root.querySelector( '#stat-interest' ).textContent = '—';
			root.querySelector( '#stat-total' ).textContent = '—';
		} else {
			root.querySelector( '#stat-months' ).textContent = F.monthsToYearsMonths( sim.months );
			root.querySelector( '#stat-interest' ).textContent = F.currency( sim.totalInterest );
			root.querySelector( '#stat-total' ).textContent = F.currency( sim.totalPaid );
		}

		var warn = root.querySelector( '#warnbox' );
		if ( ! sim.neverPaysOff && sim.totalInterest > balance ) {
			warn.innerHTML = '<span class="cmc-answer-label">Reality check</span><p>Paying only the minimum on this balance costs ' + F.currency( sim.totalInterest ) + ' in interest — more than the original ' + F.currency( balance ) + ' balance — and takes ' + F.monthsToYearsMonths( sim.months ) + '. See the <a href="/calculators/extra-payment-savings-calculator/">Extra Payment Savings Calculator</a> to see how much a bigger payment saves.</p>';
		} else if ( sim.neverPaysOff ) {
			warn.innerHTML = '<span class="cmc-answer-label">Reality check</span><p>At this balance and APR, the minimum payment formula you selected doesn\'t outpace interest — the balance would never fully shrink under a pure minimum-payment plan in practice issuers set floors to prevent this, but it signals you need to pay more than the minimum.</p>';
		} else {
			warn.innerHTML = '';
		}

		if ( ! sim.neverPaysOff ) {
			var balances = [ balance ].concat( sim.schedule.map( function ( r ) { return r.balance; } ) );
			var step = Math.max( 1, Math.ceil( balances.length / 40 ) );
			var sBalances = balances.filter( function ( _, i ) { return i % step === 0; } );
			C.drawLineChart( root.querySelector( '#chart-line' ), [ { data: sBalances, color: C.palette.warn } ], [ 'Now', 'Payoff' ] );
		}
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
