/**
 * Bi-Weekly vs. Monthly Payment Calculator — compares paying a fixed amount
 * once a month with paying half of it every two weeks.
 *
 * Model: monthly plan charges APR ÷ 12 then applies the payment; bi-weekly
 * plan charges APR × 14 ÷ 365 per two-week period then applies half the
 * payment. 26 half-payments a year add up to 13 monthly payments, which is
 * where most of the saving comes from; paying sooner trims a little more
 * interest on top.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-biweekly' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 5000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 22.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 200, min: 0, step: '0.01', hint: 'The bi-weekly plan pays half of this every two weeks' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-saved', label: 'Interest saved paying bi-weekly', value: '', highlight: true },
				{ id: 'stat-sooner', label: 'Debt-free sooner by', value: '' },
				{ id: 'stat-monthly', label: 'Monthly plan: time / interest', value: '' },
				{ id: 'stat-biweekly', label: 'Bi-weekly plan: time / interest', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
		'</div>';

	// Simulate fixed payments per period at a per-period rate.
	function simulate( balance, ratePerPeriod, payment, maxPeriods ) {
		var interestTotal = 0, periods = 0;
		while ( balance > 0.005 && periods < maxPeriods ) {
			periods++;
			var interest = balance * ratePerPeriod;
			if ( payment <= interest ) {
				return { never: true };
			}
			interestTotal += interest;
			balance = Math.max( 0, balance + interest - payment );
		}
		return { never: balance > 0.005, periods: periods, interest: interestTotal };
	}

	function calc() {
		var balance = UI.num( root, 'balance' );
		var apr = UI.num( root, 'apr' );
		var payment = UI.num( root, 'payment' );
		var err = root.querySelector( '#err' );

		if ( balance <= 0 || payment <= 0 || apr < 0 ) {
			err.textContent = 'Enter a balance and monthly payment greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}

		var monthly = simulate( balance, F.monthlyRate( apr ), payment, 600 );
		var biweekly = simulate( balance, apr / 100 * 14 / 365, payment / 2, 1300 );

		if ( monthly.never ) {
			err.textContent = 'This monthly payment doesn\'t cover the interest (' + F.currency( balance * F.monthlyRate( apr ) ) + ' a month), so the balance never goes down. Enter a larger payment.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		// Bi-weekly periods → months (26 periods = 12 months).
		var biMonths = Math.ceil( biweekly.periods * 12 / 26 );
		var saved = monthly.interest - biweekly.interest;
		var sooner = Math.max( 0, monthly.periods - biMonths );

		root.querySelector( '#stat-saved' ).textContent = F.currency( Math.max( 0, saved ) );
		root.querySelector( '#stat-sooner' ).textContent = sooner ? F.monthsToYearsMonths( sooner ) : 'Under a month';
		root.querySelector( '#stat-monthly' ).textContent = F.monthsToYearsMonths( monthly.periods ) + ' / ' + F.currency( monthly.interest );
		root.querySelector( '#stat-biweekly' ).textContent = F.monthsToYearsMonths( biMonths ) + ' / ' + F.currency( biweekly.interest );

		C.drawBarChart( root.querySelector( '#chart-bar' ), [
			{ label: 'Monthly interest total', value: monthly.interest, color: C.palette.warn },
			{ label: 'Bi-weekly interest total', value: biweekly.interest, color: C.palette.accent },
		] );

		root.querySelector( '#answer' ).innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>Paying ' + F.currency( payment / 2 ) + ' every two weeks instead of ' + F.currency( payment ) + ' once a month saves about ' + F.currency( Math.max( 0, saved ) ) + ' in interest. Most of that comes from making 26 half-payments a year, which equals 13 monthly payments instead of 12, so you pay about ' + F.currency( payment ) + ' more each year. Paying the same yearly total monthly would save almost as much; check that your issuer applies extra payments right away and that more than one payment a month is allowed.</p>';
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
