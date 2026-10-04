/**
 * Fed Rate Change Calculator — what a Federal Reserve rate hike or cut does
 * to a variable-rate credit card.
 *
 * Model: variable card APRs are the prime rate plus a fixed margin, and the
 * prime rate moves by the same amount as the federal funds target, so the
 * card APR moves by the Fed change. Interest uses the site's monthly model
 * (APR ÷ 12) with the same fixed monthly payment before and after. Fixed-rate
 * cards don't move with the Fed.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-fedrate' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Card balance', value: 5000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Current APR (%)', value: 22.15, min: 0, step: '0.01', hint: 'On your statement. 22.15% is the Fed\'s latest average for accounts charged interest' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 200, min: 0, step: '0.01' } ),
			UI.field( { id: 'change', label: 'Fed rate change', type: 'select', value: '0.25', options: [
				{ value: '-1', label: 'Cut of 1.00 point' },
				{ value: '-0.75', label: 'Cut of 0.75 point' },
				{ value: '-0.5', label: 'Cut of 0.50 point' },
				{ value: '-0.25', label: 'Cut of 0.25 point' },
				{ value: '0.25', label: 'Hike of 0.25 point' },
				{ value: '0.5', label: 'Hike of 0.50 point' },
				{ value: '0.75', label: 'Hike of 0.75 point' },
				{ value: '1', label: 'Hike of 1.00 point' },
			] } ),
			UI.field( { id: 'ratetype', label: 'Card rate type', type: 'select', value: 'variable', options: [
				{ value: 'variable', label: 'Variable APR (most cards)' },
				{ value: 'fixed', label: 'Fixed APR' },
			] } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-month', label: 'Change in this month\'s interest', value: '', highlight: true },
				{ id: 'stat-apr', label: 'New APR', value: '' },
				{ id: 'stat-total', label: 'Change in total interest to payoff', value: '' },
				{ id: 'stat-time', label: 'Payoff time', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	function signed( amount ) {
		var s = F.currency( Math.abs( amount ) );
		if ( Math.abs( amount ) < 0.005 ) { return F.currency( 0 ); }
		return ( amount > 0 ? '+' : '−' ) + s;
	}

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var change = parseFloat( root.querySelector( '#change' ).value ) || 0;
		var fixed = root.querySelector( '#ratetype' ).value === 'fixed';
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || payment <= 0 || apr < 0 ) {
			err.textContent = 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}

		var newApr = fixed ? apr : Math.max( 0, apr + change );
		var before = F.amortize( { balance: balance, apr: apr, payment: payment } );
		var after = F.amortize( { balance: balance, apr: newApr, payment: payment } );

		if ( before.neverPaysOff || after.neverPaysOff ) {
			err.textContent = 'This payment doesn\'t cover the interest (' + F.currency( balance * F.monthlyRate( Math.max( apr, newApr ) ) ) + ' a month), so the balance never goes down. Enter a larger payment.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var monthDiff = balance * F.monthlyRate( newApr ) - balance * F.monthlyRate( apr );
		var totalDiff = after.totalInterest - before.totalInterest;

		root.querySelector( '#stat-month' ).textContent = signed( monthDiff );
		root.querySelector( '#stat-apr' ).textContent = F.percent( newApr );
		root.querySelector( '#stat-total' ).textContent = signed( totalDiff );
		root.querySelector( '#stat-time' ).textContent = before.months === after.months ?
			'No change (' + before.months + ' months)' : before.months + ' \u2192 ' + after.months + ' months';

		C.drawBarChart( root.querySelector( '#chart-bar' ), [
			{ label: 'Total interest at ' + F.percent( apr ), value: before.totalInterest, color: C.palette.warn },
			{ label: 'Total interest at ' + F.percent( newApr ), value: after.totalInterest, color: C.palette.accent },
		] );

		var text;
		if ( fixed ) {
			text = 'A fixed APR doesn\'t follow the Fed, so this change leaves your rate at ' + F.percent( apr ) + '. Issuers can still change a fixed rate for new purchases after giving you 45 days\' notice.';
		} else if ( change > 0 ) {
			// Smallest whole-dollar increase in the payment that keeps total
			// interest at or below what the old APR would have cost.
			var extra = 0;
			while ( extra < 5000 && F.amortize( { balance: balance, apr: newApr, payment: payment + extra } ).totalInterest > before.totalInterest ) {
				extra++;
			}
			text = 'A ' + change.toFixed( 2 ) + '-point Fed hike would raise your APR to ' + F.percent( newApr ) + ' within a billing cycle or two, adding about ' + F.currency( monthDiff ) + ' to this month\'s interest and ' + F.currency( totalDiff ) + ' over the life of the balance. Paying ' + F.currency( extra ) + ' more a month would more than cancel it out.';
		} else {
			text = 'A ' + Math.abs( change ).toFixed( 2 ) + '-point Fed cut would lower your APR to ' + F.percent( newApr ) + ', saving about ' + F.currency( -monthDiff ) + ' on this month\'s interest and ' + F.currency( -totalDiff ) + ' in total if you keep paying ' + F.currency( payment ) + ' a month. Keep the payment the same so the saving goes to your balance.';
		}
		root.querySelector( '#answer' ).innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>' + text + '</p>';
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
