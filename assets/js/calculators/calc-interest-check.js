/**
 * Credit Card Interest Charge Checker — compares the interest charge on a
 * statement with what the daily-rate formula predicts, and backs out the
 * APR the charge implies.
 *
 * Expected = average daily balance × (APR ÷ 365 or 360) × days in cycle
 * (simple daily interest). Implied APR = charge ÷ (balance × days) × 365.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-interestcheck' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'charged', label: 'Interest charged on your statement ($)', value: 41.76, min: 0, step: '0.01' } ),
			UI.field( { id: 'balance', label: 'Average daily balance ($)', value: 2033.33, min: 0, step: '0.01', hint: 'Shown on many statements in the interest charge section; or use your statement balance for a rough check' } ),
			UI.field( { id: 'apr', label: 'Purchase APR on your statement (%)', value: 24.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'days', label: 'Days in billing cycle', value: 30, min: 1, step: '1' } ),
			UI.field( { id: 'basis', label: 'Days used by issuer', type: 'select', value: '365', options: [
				{ value: '365', label: '365 (most issuers)' },
				{ value: '360', label: '360 (some issuers)' },
			] } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-expected', label: 'Expected interest at your APR', value: '', highlight: true },
				{ id: 'stat-diff', label: 'Difference from your statement', value: '' },
				{ id: 'stat-implied', label: 'APR your charge implies', value: '' },
			] ) +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function calc() {
		var charged = UI.num( root, 'charged' );
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var days = UI.num( root, 'days' );
		var basis = UI.num( root, 'basis' ) || 365;
		var err = root.querySelector( '#err' );

		if ( charged < 0 || balance <= 0 || apr < 0 || days < 1 ) {
			err.textContent = 'Enter an average daily balance greater than 0, at least 1 day, and an interest charge and APR of 0 or more.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var expected = balance * ( apr / 100 / basis ) * days;
		var diff = charged - expected;
		var implied = charged / ( balance * days ) * basis * 100;
		var tolerance = Math.max( 1, expected * 0.03 );

		root.querySelector( '#stat-expected' ).textContent = F.currency( expected );
		root.querySelector( '#stat-diff' ).textContent = ( diff > -0.005 ? '+' : '−' ) + F.currency( Math.abs( diff ) );
		root.querySelector( '#stat-implied' ).textContent = F.percent( implied, 2 );

		var answer = root.querySelector( '#answer' );
		if ( Math.abs( diff ) <= tolerance ) {
			answer.innerHTML = '<span class="cmc-answer-label">Looks right</span><p>Your charge is within ' + F.currency( tolerance ) + ' of the ' + F.currency( expected ) + ' the daily-rate formula predicts. Small gaps usually come from daily compounding (which adds a little) and rounding.</p>';
		} else if ( diff > 0 ) {
			answer.innerHTML = '<span class="cmc-answer-label">Higher than expected</span><p>You were charged ' + F.currency( diff ) + ' more than the formula predicts, which works out to about ' + F.percent( implied, 2 ) + ' APR. Common reasons:</p><ul>' +
				'<li>Part of the balance is a cash advance or balance transfer at a higher APR.</li>' +
				'<li>You lost the grace period by not paying the previous statement in full, so new purchases accrued interest from the day they posted.</li>' +
				'<li>Residual (trailing) interest from the last cycle was billed this month.</li>' +
				'<li>A penalty APR applies after a late payment, or a promotional rate ended.</li>' +
				'<li>The average daily balance you entered is lower than the one on your statement.</li>' +
				'</ul><p>If none of these apply, ask your issuer to explain the charge.</p>';
		} else {
			answer.innerHTML = '<span class="cmc-answer-label">Lower than expected</span><p>You were charged ' + F.currency( -diff ) + ' less than the formula predicts. That usually means part of the balance had a 0% promotional rate or was covered by the grace period, or the average daily balance used was lower than the one you entered.</p>';
		}
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
