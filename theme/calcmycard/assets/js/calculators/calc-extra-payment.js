/**
 * Extra Payment Savings Calculator — compares a base payment against that
 * payment plus a chosen extra amount, and also tables out several common
 * extra amounts so users can see the pattern.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-extrapayment' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 5000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 22.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Current monthly payment', value: 150, min: 0, step: '0.01' } ),
			UI.field( { id: 'extra', label: 'Extra amount to add per month', value: 50, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-months-saved', label: 'Months saved', value: '', highlight: true },
				{ id: 'stat-interest-saved', label: 'Interest saved', value: '', highlight: true },
				{ id: 'stat-new-payoff', label: 'New payoff time', value: '' },
				{ id: 'stat-old-payoff', label: 'Original payoff time', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<h3>What different extra amounts would save you</h3>' +
			'<div id="table-wrap"></div>' +
		'</div>';

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var extra = UI.num( root, 'extra' );
		var err = root.querySelector( '#err' );

		if ( balance < 0 || payment <= 0 ) {
			err.textContent = 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			return;
		}
		err.style.display = 'none';

		var base = F.amortize( { balance: balance, apr: apr, payment: payment } );
		var withExtra = F.amortize( { balance: balance, apr: apr, payment: payment, extra: extra } );

		root.querySelector( '#stat-old-payoff' ).textContent = base.neverPaysOff ? 'Never' : F.monthsToYearsMonths( base.months );
		root.querySelector( '#stat-new-payoff' ).textContent = withExtra.neverPaysOff ? 'Never' : F.monthsToYearsMonths( withExtra.months );

		if ( ! base.neverPaysOff && ! withExtra.neverPaysOff ) {
			var monthsSaved = base.months - withExtra.months;
			var interestSaved = base.totalInterest - withExtra.totalInterest;
			root.querySelector( '#stat-months-saved' ).textContent = monthsSaved + ( monthsSaved === 1 ? ' month' : ' months' );
			root.querySelector( '#stat-interest-saved' ).textContent = F.currency( interestSaved );

			C.drawBarChart( root.querySelector( '#chart-bar' ), [
				{ label: 'Interest (current)', value: base.totalInterest, color: C.palette.warn },
				{ label: 'Interest (with extra)', value: withExtra.totalInterest, color: C.palette.accent },
			] );
		} else {
			root.querySelector( '#stat-months-saved' ).textContent = '—';
			root.querySelector( '#stat-interest-saved' ).textContent = '—';
		}

		var amounts = [ 25, 50, 100, 150, 200, 300 ];
		var rows = amounts.map( function ( amt ) {
			var r = F.amortize( { balance: balance, apr: apr, payment: payment, extra: amt } );
			if ( base.neverPaysOff || r.neverPaysOff ) {
				return [ '+' + F.currencyRounded( amt ) + '/mo', '—', '—' ];
			}
			return [
				'+' + F.currencyRounded( amt ) + '/mo',
				( base.months - r.months ) + ' months sooner',
				F.currency( base.totalInterest - r.totalInterest ) + ' saved',
			];
		} );
		root.querySelector( '#table-wrap' ).innerHTML = UI.table( [ 'Extra Payment', 'Time Saved', 'Interest Saved' ], rows );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
