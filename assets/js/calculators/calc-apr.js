/**
 * Credit Card APR Calculator — converts an abstract APR percentage into
 * real monthly/annual dollar costs on a given balance.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-apr' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Balance carried', value: 4000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'APR (%)', value: 24.99, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-monthly', label: 'Cost this month', value: '', highlight: true },
				{ id: 'stat-daily', label: 'Cost per day', value: '' },
				{ id: 'stat-annual-simple', label: 'Cost per year (simple)', value: '' },
				{ id: 'stat-annual-eff', label: 'Cost per year (compounded monthly)', value: '' },
			] ) +
			'<div id="table-wrap"></div>' +
		'</div>';

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var err = root.querySelector( '#err' );

		if ( balance < 0 || apr < 0 ) {
			err.textContent = 'Enter values of 0 or greater.';
			err.style.display = 'block';
			return;
		}
		err.style.display = 'none';

		var monthlyCost = balance * F.monthlyRate( apr );
		var dailyCost = balance * F.dailyPeriodicRate( apr );
		var annualSimple = balance * ( apr / 100 );
		var ear = Math.pow( 1 + F.monthlyRate( apr ), 12 ) - 1;
		var annualEff = balance * ear;

		root.querySelector( '#stat-monthly' ).textContent = F.currency( monthlyCost );
		root.querySelector( '#stat-daily' ).textContent = F.currency( dailyCost );
		root.querySelector( '#stat-annual-simple' ).textContent = F.currency( annualSimple );
		root.querySelector( '#stat-annual-eff' ).textContent = F.currency( annualEff );

		var rows = [];
		var bal = balance, cumulative = 0;
		for ( var m = 1; m <= 12; m++ ) {
			var interest = bal * F.monthlyRate( apr );
			cumulative += interest;
			rows.push( [ 'Month ' + m, F.currencyRounded( interest ), F.currencyRounded( cumulative ) ] );
			bal += interest; // illustrative: assumes no payments, balance revolves untouched
		}
		root.querySelector( '#table-wrap' ).innerHTML =
			'<h3>If this balance revolved untouched for 12 months</h3>' +
			'<p class="cmc-muted">Illustrative only — assumes no payments or new charges, just to show how APR compounds if a balance is never paid down.</p>' +
			UI.table( [ 'Month', 'Interest Charged', 'Cumulative Interest' ], rows );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
