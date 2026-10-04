/**
 * Debt Consolidation vs. Balance Transfer Calculator — compares a fixed-rate
 * personal loan against a balance-transfer card, total cost side by side.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-consolidationvstransfer' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Total balance to pay off', value: 8000, min: 0, step: '0.01' } ),
		] ) +
		'<h3 style="margin-top:24px;">Option A: Balance Transfer Card</h3>' +
		UI.formGrid( [
			UI.field( { id: 'feePercent', label: 'Transfer fee (%)', value: 3, min: 0, step: '0.1' } ),
			UI.field( { id: 'promoApr', label: 'Promo APR (%)', value: 0, min: 0, step: '0.01' } ),
			UI.field( { id: 'promoMonths', label: 'Promo period (months)', value: 18, min: 1, step: '1' } ),
			UI.field( { id: 'goToApr', label: 'APR after promo (%)', value: 24.99, min: 0, step: '0.01' } ),
		] ) +
		'<h3 style="margin-top:24px;">Option B: Debt Consolidation Loan</h3>' +
		UI.formGrid( [
			UI.field( { id: 'loanApr', label: 'Fixed loan APR (%)', value: 12.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'loanTerm', label: 'Loan term (months)', value: 36, min: 1, step: '1' } ),
			UI.field( { id: 'originationFee', label: 'Origination fee (%)', value: 2, min: 0, step: '0.1' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-transfer-cost', label: 'Balance transfer: total cost', value: '' },
				{ id: 'stat-loan-cost', label: 'Consolidation loan: total cost', value: '' },
				{ id: 'stat-loan-payment', label: 'Consolidation loan: monthly payment', value: '' },
				{ id: 'stat-winner', label: 'Cheaper option', value: '', highlight: true },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function simulateBlended( balance, apr1, months1, apr2, payment ) {
		var r1 = F.monthlyRate( apr1 ), r2 = F.monthlyRate( apr2 );
		var bal = balance, month = 0, totalInterest = 0, neverPaysOff = false;
		while ( bal > 0.005 && month < 600 ) {
			month++;
			var rate = month <= months1 ? r1 : r2;
			var interest = bal * rate;
			var pay = Math.min( payment, bal + interest );
			var principal = pay - interest;
			if ( principal <= 0 ) { neverPaysOff = true; break; }
			bal = Math.max( 0, bal - principal );
			totalInterest += interest;
		}
		return { months: neverPaysOff ? null : month, totalInterest: totalInterest, neverPaysOff: neverPaysOff };
	}

	function loanPayment( principal, apr, months ) {
		var r = F.monthlyRate( apr );
		if ( r === 0 ) { return principal / months; }
		return principal * r / ( 1 - Math.pow( 1 + r, -months ) );
	}

	function calc() {
		var balance = UI.num( root, 'balance' );
		var feePercent = UI.num( root, 'feePercent' );
		var promoApr = UI.num( root, 'promoApr' );
		var promoMonths = UI.num( root, 'promoMonths' );
		var goToApr = UI.num( root, 'goToApr' );
		var loanApr = UI.num( root, 'loanApr' );
		var loanTerm = UI.num( root, 'loanTerm' );
		var originationFee = UI.num( root, 'originationFee' );
		var err = root.querySelector( '#err' );

		if ( balance < 0 || promoMonths < 1 || loanTerm < 1 ) {
			err.textContent = 'Enter a balance of 0 or more, a promo period of at least 1 month, and a loan term of at least 1 month.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		// Option A: assume the user pays off the transferred balance across
		// the promo period using a flat payment sized to just clear it,
		// then continues at the same flat payment if anything remains.
		var fee = balance * ( feePercent / 100 );
		var flatPayment = ( balance + fee ) / promoMonths;
		var transferSim = simulateBlended( balance + fee, promoApr, promoMonths, goToApr, flatPayment );
		var transferCost = transferSim.neverPaysOff ? null : ( transferSim.totalInterest + fee );

		// Option B: fixed-rate installment loan.
		var origFee = balance * ( originationFee / 100 );
		var payment = loanPayment( balance + origFee, loanApr, loanTerm );
		var totalPaid = payment * loanTerm;
		var loanCost = ( totalPaid - balance ) ; // interest + fees beyond principal

		root.querySelector( '#stat-transfer-cost' ).textContent = transferCost == null ? 'Never pays off' : F.currency( transferCost );
		root.querySelector( '#stat-loan-cost' ).textContent = F.currency( loanCost );
		root.querySelector( '#stat-loan-payment' ).textContent = F.currency( payment ) + '/mo';

		var answer = root.querySelector( '#answer' );

		if ( transferCost != null ) {
			var winner = transferCost < loanCost ? 'Balance Transfer' : 'Consolidation Loan';
			root.querySelector( '#stat-winner' ).textContent = winner;
			var diff = Math.abs( transferCost - loanCost );
			answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>Based on these numbers, the <strong>' + winner + '</strong> option costs about ' + F.currency( diff ) + ' less in total fees and interest. Remember: the balance transfer estimate assumes you can pay it off within the promo window at a flat ' + F.currency( flatPayment ) + '/month — if your budget can\'t support that, the fixed loan payment of ' + F.currency( payment ) + '/month may be more realistic.</p>';
			C.drawBarChart( root.querySelector( '#chart-bar' ), [
				{ label: 'Balance Transfer', value: transferCost, color: C.palette.accent },
				{ label: 'Consolidation Loan', value: loanCost, color: C.palette.brand },
			] );
		} else {
			root.querySelector( '#stat-winner' ).textContent = 'Consolidation Loan';
			answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>The balance transfer option doesn\'t fully pay off within the assumptions given — the fixed-rate consolidation loan is the more predictable option here since its payment and payoff date are both fixed in advance.</p>';
			C.drawBarChart( root.querySelector( '#chart-bar' ), [
				{ label: 'Consolidation Loan', value: loanCost, color: C.palette.brand },
			] );
		}
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
