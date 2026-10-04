/**
 * Cash Advance Calculator — the up-front fee plus interest that starts on
 * day one (no grace period), and what that adds up to as an annualized cost.
 *
 * Model: fee = max(fee % × amount, minimum fee), added to the balance;
 * interest = (amount + fee) × (cash advance APR ÷ 365) × days until repaid,
 * simple daily interest with no compounding. The optional ATM fee is paid
 * up front and is not part of the card balance.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-cashadvance' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'amount', label: 'Cash advance amount', value: 500, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Cash advance APR (%)', value: 29.99, min: 0, step: '0.01', hint: 'Usually higher than your purchase APR; check your statement' } ),
			UI.field( { id: 'feePercent', label: 'Cash advance fee (%)', value: 5, min: 0, step: '0.1', hint: 'Commonly 3-5% of the amount' } ),
			UI.field( { id: 'minFee', label: 'Minimum fee ($)', value: 10, min: 0, step: '1', hint: 'Many cards charge whichever is greater' } ),
			UI.field( { id: 'days', label: 'Days until you repay it', value: 30, min: 1, step: '1' } ),
			UI.field( { id: 'atmFee', label: 'ATM operator fee ($)', value: 3, min: 0, step: '0.01', hint: 'Charged by the ATM owner, if any' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-total', label: 'Total cost of this cash advance', value: '', highlight: true },
				{ id: 'stat-fee', label: 'Cash advance fee', value: '' },
				{ id: 'stat-interest', label: 'Interest until repaid', value: '' },
				{ id: 'stat-effective', label: 'Annualized cost', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function calc() {
		var amount = UI.num( root, 'amount' );
		var apr = UI.num( root, 'apr' );
		var feePercent = UI.num( root, 'feePercent' );
		var minFee = UI.num( root, 'minFee' );
		var days = UI.num( root, 'days' );
		var atmFee = UI.num( root, 'atmFee' );
		var err = root.querySelector( '#err' );

		if ( amount <= 0 || days < 1 || apr < 0 || feePercent < 0 || minFee < 0 || atmFee < 0 ) {
			err.textContent = 'Enter an amount greater than 0, at least 1 day, and fees and APR of 0 or more.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var fee = Math.max( amount * ( feePercent / 100 ), minFee );
		var balance = amount + fee;
		var dailyInterest = balance * F.dailyPeriodicRate( apr );
		var interest = dailyInterest * days;
		var total = fee + interest + atmFee;
		var annualized = ( total / amount ) * ( 365 / days ) * 100;

		root.querySelector( '#stat-total' ).textContent = F.currency( total );
		root.querySelector( '#stat-fee' ).textContent = F.currency( fee );
		root.querySelector( '#stat-interest' ).textContent = F.currency( interest );
		root.querySelector( '#stat-effective' ).textContent = F.percent( annualized, 1 );

		C.drawBarChart( root.querySelector( '#chart-bar' ), [
			{ label: 'Cash advance fee', value: fee, color: C.palette.warn },
			{ label: 'Interest', value: interest, color: C.palette.brand },
			{ label: 'ATM fee', value: atmFee, color: C.palette.accent },
		] );

		root.querySelector( '#answer' ).innerHTML =
			'<span class="cmc-answer-label">Bottom line</span><p>Borrowing ' + F.currency( amount ) + ' for ' + days + ' day' + ( days === 1 ? '' : 's' ) +
			' costs about ' + F.currency( total ) + ', or ' + F.percent( annualized, 1 ) + ' a year once the fee is counted. Interest adds about ' +
			F.currency( dailyInterest ) + ' every day until it\'s repaid, and there is usually no grace period. The same amount spent as a purchase and paid in full by the due date would typically cost $0 in interest.</p>';
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
