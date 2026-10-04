/**
 * Daily Periodic Rate Calculator — converts APR to the true daily rate
 * issuers use, and applies it to an average daily balance over a billing
 * cycle.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-dpr' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'apr', label: 'APR (%)', value: 24.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'balance', label: 'Average daily balance', value: 3000, min: 0, step: '0.01', hint: 'The average of your balance across each day in the billing cycle' } ),
			UI.field( { id: 'days', label: 'Days in billing cycle', value: 30, min: 1, step: '1' } ),
			UI.field( { id: 'basis', label: 'Days used by issuer', type: 'select', value: '365', options: [
				{ value: '365', label: '365 (most issuers)' },
				{ value: '360', label: '360 (some issuers)' },
			] } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-dpr', label: 'Daily periodic rate', value: '', highlight: true },
				{ id: 'stat-daily-cost', label: 'Interest per day', value: '' },
				{ id: 'stat-cycle-cost', label: 'Interest this billing cycle', value: '' },
				{ id: 'stat-effective-apr', label: 'Effective APR (with daily compounding)', value: '' },
			] ) +
		'</div>';

	function calc() {
		var apr = UI.num( root, 'apr' );
		var balance = UI.num( root, 'balance' );
		var days = UI.num( root, 'days' );
		var basis = UI.num( root, 'basis' ) || 365;
		var err = root.querySelector( '#err' );

		if ( apr < 0 || balance < 0 || days <= 0 ) {
			err.textContent = 'Enter a valid APR, balance, and number of days.';
			err.style.display = 'block';
			return;
		}
		err.style.display = 'none';

		var dpr = ( apr / 100 ) / basis;
		var dailyCost = balance * dpr;
		var cycleCost = dailyCost * days;
		var effectiveApr = ( Math.pow( 1 + dpr, 365 ) - 1 ) * 100;

		root.querySelector( '#stat-dpr' ).textContent = F.percent( dpr * 100, 5 );
		root.querySelector( '#stat-daily-cost' ).textContent = F.currency( dailyCost );
		root.querySelector( '#stat-cycle-cost' ).textContent = F.currency( cycleCost );
		root.querySelector( '#stat-effective-apr' ).textContent = F.percent( effectiveApr, 2 );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
