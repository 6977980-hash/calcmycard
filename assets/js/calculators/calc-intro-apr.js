/**
 * 0% Intro APR Calculator — required flat payment to clear a balance before
 * the promo ends, and the cost if the planned payment falls short.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-introapr' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Balance (purchase or transferred amount)', value: 3000, min: 0, step: '0.01' } ),
			UI.field( { id: 'promoMonths', label: 'Promotional 0% period (months)', value: 18, min: 1, step: '1' } ),
			UI.field( { id: 'plannedPayment', label: 'Your planned monthly payment', value: 150, min: 0, step: '0.01' } ),
			UI.field( { id: 'goToApr', label: 'APR after the promo ends (%)', value: 24.99, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-required', label: 'Payment needed to clear it in time', value: '', highlight: true },
				{ id: 'stat-shortfall', label: 'Balance left if you underpay', value: '' },
				{ id: 'stat-postpromo-interest', label: 'Interest if remainder isn\'t paid off', value: '' },
			] ) +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function calc() {
		var balance = UI.num( root, 'balance' );
		var promoMonths = UI.num( root, 'promoMonths' );
		var plannedPayment = UI.num( root, 'plannedPayment' );
		var goToApr = UI.num( root, 'goToApr' );
		var err = root.querySelector( '#err' );

		if ( balance < 0 || promoMonths <= 0 ) {
			err.textContent = 'Enter a balance greater than 0 and at least 1 promotional month.';
			err.style.display = 'block';
			return;
		}
		err.style.display = 'none';

		// Round UP to the cent so paying the displayed amount always clears the balance.
		var required = Math.ceil( ( balance / promoMonths ) * 100 - 1e-9 ) / 100;
		root.querySelector( '#stat-required' ).textContent = F.currency( required );

		var paidDuringPromo = Math.min( balance, plannedPayment * promoMonths );
		var remainder = Math.max( 0, balance - paidDuringPromo );

		root.querySelector( '#stat-shortfall' ).textContent = remainder > 0 ? F.currency( remainder ) : '$0.00 — fully paid off';

		var answer = root.querySelector( '#answer' );

		if ( remainder <= 0 ) {
			root.querySelector( '#stat-postpromo-interest' ).textContent = '$0.00';
			answer.innerHTML = '<span class="cmc-answer-label">You\'re on track</span><p>At ' + F.currency( plannedPayment ) + '/month, you\'ll pay off the full balance before the promotional period ends — no interest at all, as long as the offer isn\'t a deferred-interest promotion (check your card\'s terms).</p>';
		} else {
			var afterResult = F.amortize( { balance: remainder, apr: goToApr, payment: Math.max( plannedPayment, remainder * F.monthlyRate( goToApr ) + 1 ) } );
			root.querySelector( '#stat-postpromo-interest' ).textContent = afterResult.neverPaysOff ? 'Payment too low' : F.currency( afterResult.totalInterest );
			answer.innerHTML = '<span class="cmc-answer-label">You\'ll fall short</span><p>At ' + F.currency( plannedPayment ) + '/month you\'ll still owe about ' + F.currency( remainder ) + ' when the promo ends. That remainder starts accruing interest at ' + F.percent( goToApr ) + ' — increase your payment to at least ' + F.currency( required ) + '/month to avoid this entirely.</p>';
		}
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
}());
