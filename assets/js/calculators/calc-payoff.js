/**
 * Credit Card Payoff Calculator — headline output is a real calendar
 * payoff date, plus an automatic "add $50/mo" comparison and a balance
 * decline chart.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-payoff' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	root.innerHTML =
		UI.formGrid( [
			UI.field( { id: 'balance', label: 'Current balance', value: 5000, min: 0, step: '0.01' } ),
			UI.field( { id: 'apr', label: 'Interest rate (APR %)', value: 22.99, min: 0, step: '0.01' } ),
			UI.field( { id: 'payment', label: 'Monthly payment', value: 175, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-date', label: 'Debt-free date', value: '', highlight: true },
				{ id: 'stat-months', label: 'Time to pay off', value: '' },
				{ id: 'stat-interest', label: 'Total interest paid', value: '' },
				{ id: 'stat-total', label: 'Total amount paid', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-line" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="whatif" style="display:none;"></div>' +
		'</div>';

	function addMonths( date, months ) {
		// Work from the 1st of the month so e.g. Jan 31 + 1 month can't
		// overflow into March.
		var d = new Date( date.getFullYear(), date.getMonth(), 1 );
		d.setMonth( d.getMonth() + months );
		return d;
	}

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

		var result = F.amortize( { balance: balance, apr: apr, payment: payment } );

		if ( result.neverPaysOff ) {
			root.querySelector( '#stat-date' ).textContent = 'Never at this payment';
			root.querySelector( '#stat-months' ).textContent = '—';
			root.querySelector( '#stat-interest' ).textContent = '—';
			root.querySelector( '#stat-total' ).textContent = '—';
			root.querySelector( '#whatif' ).style.display = 'none';
			return;
		}

		var payoffDate = addMonths( new Date(), result.months );
		var dateStr = payoffDate.toLocaleDateString( 'en-US', { month: 'long', year: 'numeric' } );

		root.querySelector( '#stat-date' ).textContent = dateStr;
		root.querySelector( '#stat-months' ).textContent = F.monthsToYearsMonths( result.months );
		root.querySelector( '#stat-interest' ).textContent = F.currency( result.totalInterest );
		root.querySelector( '#stat-total' ).textContent = F.currency( result.totalPaid );

		var withExtra = F.amortize( { balance: balance, apr: apr, payment: payment, extra: 50 } );
		var whatif = root.querySelector( '#whatif' );
		if ( ! withExtra.neverPaysOff && withExtra.months < result.months ) {
			var monthsSaved = result.months - withExtra.months;
			var interestSaved = result.totalInterest - withExtra.totalInterest;
			whatif.style.display = 'block';
			whatif.innerHTML = '<span class="cmc-answer-label">What if you added $50/month?</span><p>You\'d be debt-free ' + monthsSaved + ' month' + ( monthsSaved === 1 ? '' : 's' ) + ' sooner and save ' + F.currency( interestSaved ) + ' in interest. Try the <a href="/calculators/extra-payment-savings-calculator/">Extra Payment Savings Calculator</a> to test your own amount.</p>';
		} else {
			whatif.style.display = 'none';
		}

		var labels = [ 'Now' ];
		var balances = [ balance ];
		result.schedule.forEach( function ( row ) {
			balances.push( row.balance );
			labels.push( 'M' + row.month );
		} );
		// Downsample to at most ~40 points for a clean line.
		var step = Math.max( 1, Math.ceil( balances.length / 40 ) );
		var sBalances = balances.filter( function ( _, i ) { return i % step === 0; } );
		var sLabels = labels.filter( function ( _, i ) { return i % step === 0; } );

		C.drawLineChart( root.querySelector( '#chart-line' ), [
			{ data: sBalances, color: C.palette.brand },
		], sLabels );
	}

	UI.onAnyChange( root, 'input, select', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
