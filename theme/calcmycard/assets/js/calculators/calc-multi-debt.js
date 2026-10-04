/**
 * Multi-Card Debt Payoff Calculator — snowball vs. avalanche, with a
 * dynamic add/remove card list. The only calculator on the site that
 * handles more than one card at once.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-multidebt' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	var defaultCards = [
		{ name: 'Card 1', balance: 1200, apr: 19.99, minPayment: 35 },
		{ name: 'Card 2', balance: 4500, apr: 26.99, minPayment: 95 },
		{ name: 'Card 3', balance: 2300, apr: 22.99, minPayment: 55 },
	];

	function cardRowHtml( card, index ) {
		return (
			'<div class="cmc-calc-grid cmc-card-row" data-row="' + index + '" style="border-top:1px solid var(--cmc-border); padding-top:14px; margin-top:14px;">' +
				UI.field( { id: 'name-' + index, label: 'Card name', type: 'text', value: card.name } ) +
				UI.field( { id: 'balance-' + index, label: 'Balance', value: card.balance, min: 0, step: '0.01' } ) +
				UI.field( { id: 'apr-' + index, label: 'APR (%)', value: card.apr, min: 0, step: '0.01' } ) +
				UI.field( { id: 'minpay-' + index, label: 'Minimum payment', value: card.minPayment, min: 0, step: '0.01' } ) +
				'<div class="cmc-field" style="justify-content:flex-end;"><button type="button" class="cmc-btn cmc-btn-secondary cmc-remove-row" data-row="' + index + '">Remove card</button></div>' +
			'</div>'
		);
	}

	var rowCount = 0;
	function renderCards( cards ) {
		var html = cards.map( function ( c, i ) {
			rowCount = i + 1;
			return cardRowHtml( c, i );
		} ).join( '' );
		root.querySelector( '#cards-container' ).innerHTML = html;
	}

	root.innerHTML =
		'<div id="cards-container"></div>' +
		'<div style="margin-top:14px;"><button type="button" class="cmc-btn cmc-btn-secondary" id="add-card">+ Add another card</button></div>' +
		UI.formGrid( [
			UI.field( { id: 'extra', label: 'Extra amount you can pay per month (total, across all cards)', value: 200, min: 0, step: '0.01' } ),
		] ) +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			'<div class="cmc-result-stats">' +
				'<div class="cmc-stat"><div class="cmc-stat-label">Snowball: time to debt-free</div><div class="cmc-stat-value" id="stat-snow-months"></div></div>' +
				'<div class="cmc-stat"><div class="cmc-stat-label">Snowball: total interest</div><div class="cmc-stat-value" id="stat-snow-interest"></div></div>' +
				'<div class="cmc-stat cmc-stat-highlight"><div class="cmc-stat-label">Avalanche: time to debt-free</div><div class="cmc-stat-value" id="stat-aval-months"></div></div>' +
				'<div class="cmc-stat cmc-stat-highlight"><div class="cmc-stat-label">Avalanche: total interest</div><div class="cmc-stat-value" id="stat-aval-interest"></div></div>' +
			'</div>' +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<div class="cmc-answer-box" id="answer"></div>' +
			'<h3>Payoff order</h3>' +
			'<div id="order-tables"></div>' +
		'</div>';

	renderCards( defaultCards );

	root.querySelector( '#add-card' ).addEventListener( 'click', function () {
		var container = root.querySelector( '#cards-container' );
		var idx = rowCount;
		container.insertAdjacentHTML( 'beforeend', cardRowHtml( { name: 'Card ' + ( idx + 1 ), balance: 1000, apr: 20, minPayment: 30 }, idx ) );
		rowCount++;
		bindRowEvents();
		calc();
	} );

	function bindRowEvents() {
		root.querySelectorAll( '.cmc-remove-row' ).forEach( function ( btn ) {
			btn.onclick = function () {
				var row = root.querySelector( '.cmc-card-row[data-row="' + btn.getAttribute( 'data-row' ) + '"]' );
				if ( row && root.querySelectorAll( '.cmc-card-row' ).length > 1 ) {
					row.remove();
					calc();
				}
			};
		} );
		UI.onAnyChange( root, '#cards-container input', calc );
	}

	function readCards() {
		var rows = root.querySelectorAll( '.cmc-card-row' );
		var cards = [];
		rows.forEach( function ( row ) {
			var idx = row.getAttribute( 'data-row' );
			var nameEl = row.querySelector( '#name-' + idx );
			cards.push( {
				name: nameEl ? nameEl.value : ( 'Card ' + idx ),
				balance: UI.num( root, 'balance-' + idx ),
				apr: UI.num( root, 'apr-' + idx ),
				minPayment: UI.num( root, 'minpay-' + idx ),
			} );
		} );
		return cards.filter( function ( c ) { return c.balance > 0; } );
	}

	function calc() {
		var cards = readCards();
		var extra = UI.num( root, 'extra' );
		var err = root.querySelector( '#err' );

		if ( ! cards.length ) {
			err.textContent = 'Add at least one card with a balance greater than 0.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var snow = F.simulateMultiCardPayoff( cards, extra, 'snowball' );
		var aval = F.simulateMultiCardPayoff( cards, extra, 'avalanche' );

		root.querySelector( '#stat-snow-months' ).textContent = snow.neverPaysOff ? 'Never' : F.monthsToYearsMonths( snow.months );
		root.querySelector( '#stat-snow-interest' ).textContent = snow.neverPaysOff ? '—' : F.currency( snow.totalInterest );
		root.querySelector( '#stat-aval-months' ).textContent = aval.neverPaysOff ? 'Never' : F.monthsToYearsMonths( aval.months );
		root.querySelector( '#stat-aval-interest' ).textContent = aval.neverPaysOff ? '—' : F.currency( aval.totalInterest );

		if ( snow.neverPaysOff && aval.neverPaysOff ) {
			root.querySelector( '#answer' ).innerHTML = '<span class="cmc-answer-label">Payments too low</span><p>Your total monthly payment of ' + F.currency( snow.monthlyBudget ) + ' (all minimums plus your extra amount) doesn\'t outpace the interest on these cards, so neither method reaches a zero balance within 50 years. Increase the extra amount to see a payoff plan.</p>';
			root.querySelector( '#order-tables' ).innerHTML = '';
			C.drawBarChart( root.querySelector( '#chart-bar' ), [] );
			return;
		}

		C.drawBarChart( root.querySelector( '#chart-bar' ), [
			{ label: 'Snowball interest', value: snow.neverPaysOff ? 0 : snow.totalInterest, color: C.palette.warn },
			{ label: 'Avalanche interest', value: aval.neverPaysOff ? 0 : aval.totalInterest, color: C.palette.accent },
		] );

		var diff = snow.totalInterest - aval.totalInterest;
		var answer = root.querySelector( '#answer' );
		if ( snow.neverPaysOff !== aval.neverPaysOff ) {
			answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>At this payment level only the ' + ( snow.neverPaysOff ? 'avalanche' : 'snowball' ) + ' method reaches a zero balance within 50 years. Increasing your extra amount would make both methods work.</p>';
		} else if ( diff > 1 ) {
			answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>The avalanche method (highest APR first) saves you about ' + F.currency( diff ) + ' in interest compared to the snowball method for these cards. The snowball method may still be worth it if paying off small balances first keeps you motivated to stick with the plan.</p>';
		} else {
			answer.innerHTML = '<span class="cmc-answer-label">Bottom line</span><p>For these specific balances and rates, snowball and avalanche cost about the same — so pick whichever order keeps you most motivated to stay consistent.</p>';
		}

		var orderHtml = '<div class="cmc-calc-grid">';
		orderHtml += '<div><h4>Snowball order</h4>' + UI.table( [ 'Card', 'Paid off in' ], snow.payoffOrder.map( function ( p ) { return [ p.name, 'Month ' + p.month ]; } ) ) + '</div>';
		orderHtml += '<div><h4>Avalanche order</h4>' + UI.table( [ 'Card', 'Paid off in' ], aval.payoffOrder.map( function ( p ) { return [ p.name, 'Month ' + p.month ]; } ) ) + '</div>';
		orderHtml += '</div>';
		root.querySelector( '#order-tables' ).innerHTML = orderHtml;
	}

	bindRowEvents();
	UI.onAnyChange( root, '#extra', calc );
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
