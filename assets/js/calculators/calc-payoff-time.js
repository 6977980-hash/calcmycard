/**
 * Credit Card Payoff Time Calculator — answers "how many months?" directly,
 * with a milestone table (25%/50%/75%/100% paid down) rather than a
 * calendar date or chart, which is what the sibling Payoff Calculator does.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-payofftime' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 4200, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 23.49, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 160, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-months', label: 'Months to pay off', value: '', highlight: true },
				{ id: 'stat-years', label: 'In years', value: '' },
				{ id: 'stat-min-required', label: 'Minimum payment to ever pay this off', value: '' },
			] ) +
			'<div class="cmc-answer-box" id="answer"></div>' +
			'<h3>Milestones along the way</h3>' +
			'<div id="table-wrap"></div>' +
		'</div>';

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || payment <= 0 ) {
			err.textContent = 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var minRequired = balance * F.monthlyRate( apr );
		root.querySelector( '#stat-min-required' ).textContent = F.currency( minRequired ) + ' / month';

		var result = F.amortize( { balance: balance, apr: apr, payment: payment } );
		var answer = root.querySelector( '#answer' );

		if ( result.neverPaysOff ) {
			root.querySelector( '#stat-months' ).textContent = 'Never';
			root.querySelector( '#stat-years' ).textContent = '—';
			answer.innerHTML = '<span class="cmc-answer-label">Payment too low</span><p>Your payment of ' + F.currency( payment ) + ' doesn\'t cover the ' + F.currency( minRequired ) + ' in monthly interest, so the balance will never go down. You need to pay at least ' + F.currency( minRequired + 1 ) + ' per month just to make progress.</p>';
			root.querySelector( '#table-wrap' ).innerHTML = '';
			return;
		}

		root.querySelector( '#stat-months' ).textContent = result.months + ( result.months === 1 ? ' month' : ' months' );
		root.querySelector( '#stat-years' ).textContent = ( result.months / 12 ).toFixed( 1 ) + ' years';
		answer.innerHTML = '<span class="cmc-answer-label">Direct answer</span><p>At ' + F.currency( payment ) + '/month on a ' + F.currency( balance ) + ' balance at ' + F.percent( apr ) + ' APR, it will take <strong>' + F.monthsToYearsMonths( result.months ) + '</strong> to reach a zero balance, and you\'ll pay ' + F.currency( result.totalInterest ) + ' in total interest.</p>';

		var milestones = [ 0.25, 0.5, 0.75, 0.9, 1.0 ];
		var rows = [];
		var targetIdx = 0;
		result.schedule.forEach( function ( row, i ) {
			var paidDownFraction = 1 - ( row.balance / balance );
			while ( targetIdx < milestones.length && paidDownFraction >= milestones[ targetIdx ] - 0.0001 ) {
				rows.push( [ Math.round( milestones[ targetIdx ] * 100 ) + '% paid off', 'Month ' + row.month, F.currencyRounded( row.balance ) + ' remaining' ] );
				targetIdx++;
			}
		} );
		root.querySelector( '#table-wrap' ).innerHTML = UI.table( [ 'Milestone', 'Reached at', 'Balance Remaining' ], rows );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
