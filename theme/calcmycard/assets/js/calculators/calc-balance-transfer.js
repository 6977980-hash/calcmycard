/**
 * Credit Card Balance Transfer Calculator — nets the transfer fee against
 * interest saved, comparing "stay put" vs. "transfer" at the same monthly
 * payment until each balance is fully paid off.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-balancetransfer' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Balance to transfer', value: 6000, min: 0, step: '0.01' } ),
			UI.field( { id: 'currentApr', label: 'Current card APR (%)', value: 24.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Monthly payment you can make', value: 300, min: 0, step: '0.01' } ),
			UI.field( { id: 'feePercent', label: 'Balance transfer fee (%)', value: 3, min: 0, step: '0.1', hint: 'Typically 3-5% of the amount transferred' } ),
			UI.field( { id: 'promoApr', label: 'Promotional APR (%)', value: 0, min: 0, step: '0.01' } ),
			UI.field( { id: 'promoMonths', label: 'Promotional period (months)', value: 15, min: 1, step: '1' } ),
			UI.field( { id: 'goToApr', label: 'APR after promo ends (%)', value: 24.99, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-fee', label: 'Transfer fee', value: '' },
				{ id: 'stat-stay-cost', label: 'Cost if you stay put', value: '' },
				{ id: 'stat-transfer-cost', label: 'Cost if you transfer (incl. fee)', value: '' },
				{ id: 'stat-savings', label: 'Your net savings', value: '', highlight: true },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function simulateBlended( balance, apr1, months1, apr2, payment ) {
		var r1 = F.monthlyRate( apr1 ), r2 = F.monthlyRate( apr2 );
		var bal = balance, month = 0, totalInterest = 0, neverPaysOff = false;
		var maxMonths = 600;
		while ( bal > 0.005 && month < maxMonths ) {
			month++;
			var rate = month <= months1 ? r1 : r2;
			var interest = bal * rate;
			var pay = Math.min( payment, bal + interest );
			var principal = pay - interest;
			if ( principal <= 0 ) { neverPaysOff = true; break; }
			bal = Math.max( 0, bal - principal );
			totalInterest += interest;
		}
		if ( month >= maxMonths && bal > 0.005 ) { neverPaysOff = true; }
		return { months: neverPaysOff ? null : month, totalInterest: totalInterest, neverPaysOff: neverPaysOff };
	}

	function calc() {
		var balance = UI.num( root, 'balance' );
		var currentApr = UI.num( root, 'currentApr' );
		var payment = UI.num( root, 'payment' );
		var feePercent = UI.num( root, 'feePercent' );
		var promoApr = UI.num( root, 'promoApr' );
		var promoMonths = UI.num( root, 'promoMonths' );
		var goToApr = UI.num( root, 'goToApr' );
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || payment <= 0 ) {
			err.textContent = 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var fee = balance * ( feePercent / 100 );
		var stay = F.amortize( { balance: balance, apr: currentApr, payment: payment } );
		var transfer = simulateBlended( balance + fee, promoApr, promoMonths, goToApr, payment );

		root.querySelector( '#stat-fee' ).textContent = F.currency( fee );

		var stayCost = stay.neverPaysOff ? null : stay.totalInterest;
		var transferCost = transfer.neverPaysOff ? null : ( transfer.totalInterest + fee );

		root.querySelector( '#stat-stay-cost' ).textContent = stayCost == null ? 'Never pays off' : F.currency( stayCost );
		root.querySelector( '#stat-transfer-cost' ).textContent = transferCost == null ? 'Never pays off' : F.currency( transferCost );

		var answer = root.querySelector( '#answer' );
		if ( stayCost != null && transferCost != null ) {
			var savings = stayCost - transferCost;
			root.querySelector( '#stat-savings' ).textContent = F.currency( savings );
			if ( savings > 0 ) {
				answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>Transferring this balance saves you about ' + F.currency( savings ) + ' compared to staying on your current card, even after the ' + F.currency( fee ) + ' transfer fee.</p>';
			} else {
				answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>Based on these numbers, staying on your current card actually costs about ' + F.currency( -savings ) + ' less than transferring — the fee outweighs the interest savings at this payment level. Try a longer promo period or a higher payment.</p>';
			}
			C.drawBarChart( root.querySelector( '#chart-bar' ), [
				{ label: 'Stay put', value: stayCost, color: C.palette.warn },
				{ label: 'Transfer', value: transferCost, color: C.palette.accent },
			] );
		} else {
			root.querySelector( '#stat-savings' ).textContent = '—';
			answer.innerHTML = '<span class="cmc-answer-label">Increase your payment</span><p>At this payment amount, one or both scenarios never fully pay off. Increase your monthly payment above to get a valid comparison.</p>';
		}
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
