/**
 * Deferred Interest Calculator — "no interest if paid in full" promotions
 * (store cards, retail financing). Interest builds in the background at the
 * card's APR from the purchase date; if any of the promo balance is left at
 * the deadline, all of that interest is charged at once.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-deferred' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;
	var MAX_MONTHS = 120;
	var lastRows = [];

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Purchase amount on the promotion', value: 2000, min: 0, step: '0.01' } ),
			UI.field( { id: 'promoMonths', label: 'Promotion length (months)', value: 12, min: 1, step: '1', hint: '"No interest if paid in full within" this many months' } ),
			UI.field( { id: 'apr', label: 'Card APR (%)', value: 29.99, min: 0, step: '0.01', hint: 'The rate deferred interest builds at; store cards are often near 30%' } ),
			UI.field( { id: 'payment', label: 'Your monthly payment', value: 150, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-required', label: 'Payment needed to avoid deferred interest', value: '', highlight: true },
				{ id: 'stat-left', label: 'Promo balance left at the deadline', value: '' },
				{ id: 'stat-deferred', label: 'Deferred interest charged at the deadline', value: '' },
				{ id: 'stat-total', label: 'Total interest, including after the deadline', value: '' },
			] ) +
			'<div class="cmc-answer-box" id="answer"></div>' +
			'<details class="cmc-schedule"><summary>Month-by-month: deferred interest building up</summary><div id="schedule-wrap"></div></details>' +
			'<div class="cmc-table-actions" id="table-actions"></div>' +
		'</div>';

	UI.tableActions( root, 'table-actions', function () {
		return {
			title: 'Deferred interest schedule',
			filename: 'deferred-interest-schedule.csv',
			headers: [ 'Month', 'Payment', 'Promo balance left', 'Deferred interest so far' ],
			rows: lastRows,
		};
	} );

	function calc() {
		var balance = UI.num( root, 'balance' );
		var months = UI.num( root, 'promoMonths' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var err = root.querySelector( '#err' );

		if ( UI.aprTooHigh( root, [ 'apr' ] ) ) {
			return UI.fail( root, err, UI.APR_MAX_MSG );
		}
		var negative = UI.hasNegative( root, [ 'balance', 'promoMonths', 'apr', 'payment' ] );
		var msg = '';
		if ( negative ) {
			msg = UI.NEGATIVE_MSG;
		} else if ( balance <= 0 ) {
			msg = 'Enter a purchase amount greater than 0.';
		} else if ( months < 1 || months > MAX_MONTHS || Math.floor( months ) !== months ) {
			msg = 'Enter the promotion length as a whole number of months, from 1 to ' + MAX_MONTHS + '.';
		}
		if ( msg ) {
			err.textContent = msg;
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		// Round UP to the cent so paying the displayed amount always clears the balance.
		var required = Math.ceil( ( balance / months ) * 100 - 1e-9 ) / 100;
		var cushion = months > 1 ? Math.ceil( ( balance / ( months - 1 ) ) * 100 - 1e-9 ) / 100 : 0;

		// Each month, interest accrues at APR / 12 on the promo balance before
		// that month's payment. It is tracked, not added to the balance.
		var r = F.monthlyRate( apr );
		var left = balance, accrued = 0;
		lastRows = [];
		for ( var m = 1; m <= months; m++ ) {
			accrued += left * r;
			var paid = Math.min( payment, left );
			left = Math.max( 0, left - paid );
			if ( left < 0.005 ) { left = 0; }
			lastRows.push( [ m, F.currency( paid ), F.currency( left ), F.currency( accrued ) ] );
		}
		root.querySelector( '#schedule-wrap' ).innerHTML = UI.table( [ 'Month', 'Payment', 'Promo balance left', 'Deferred interest so far' ], lastRows );

		root.querySelector( '#stat-required' ).textContent = F.currency( required );
		var answer = root.querySelector( '#answer' );

		if ( left <= 0 ) {
			root.querySelector( '#stat-left' ).textContent = '$0.00 — paid in full';
			root.querySelector( '#stat-deferred' ).textContent = '$0.00 (' + F.currency( accrued ) + ' waived)';
			root.querySelector( '#stat-total' ).textContent = '$0.00';
			answer.innerHTML = '<span class="cmc-answer-label">You beat the deadline</span><p>At ' + F.currency( payment ) + '/month the purchase is paid off within the ' + months + '-month promotion, so the ' + F.currency( accrued ) + ' of interest that built up in the background is never charged. Make sure the last payment posts before the promotion\'s end date, which may come before your statement due date.</p>';
			return;
		}

		// Missed: the remainder plus all deferred interest now accrues at the APR.
		var owed = left + accrued;
		var minAfter = owed * r + 1;
		var afterPayment = Math.max( payment, minAfter );
		var after = F.amortize( { balance: owed, apr: apr, payment: afterPayment } );
		root.querySelector( '#stat-left' ).textContent = F.currency( left );
		root.querySelector( '#stat-deferred' ).textContent = F.currency( accrued );
		root.querySelector( '#stat-total' ).textContent = after.neverPaysOff ? ( after.capped ? 'More than 50 years to pay off' : 'Payment too low' ) :
			F.currency( accrued + after.totalInterest ) + ( afterPayment > payment ? ' (at ' + F.currency( afterPayment ) + '/mo after)' : '' );
		answer.innerHTML = '<span class="cmc-answer-label">You\'d miss the deadline</span><p>At ' + F.currency( payment ) + '/month you\'d still owe ' + F.currency( left ) + ' when the promotion ends, so about ' + F.currency( accrued ) + ' of deferred interest would be added at once, for a new balance of ' + F.currency( owed ) + ' at ' + F.percent( apr ) + '. Paying ' + F.currency( required ) + '/month avoids all of it' +
			( cushion ? ', and ' + F.currency( cushion ) + '/month finishes a month early, which leaves room for a late-posting payment.' : '.' ) + '</p>';
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
