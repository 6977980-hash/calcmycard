/**
 * Credit Utilization Calculator — per-card and overall utilization ratio,
 * with a plain-English rating against common scoring thresholds.
 */
(function () {
	'use strict';
	var root = document.getElementById( 'cmc-calc-utilization' );
	if ( ! root ) { return; }

	var F = window.CMCFinance, UI = window.CMCUI, C = window.CMCChart;

	var defaultCards = [
		{ name: 'Card 1', balance: 1200, limit: 5000 },
		{ name: 'Card 2', balance: 800, limit: 2000 },
	];

	function rowHtml( card, index ) {
		return (
			'<div class="cmc-calc-grid cmc-util-row" data-row="' + index + '" style="border-top:1px solid var(--cmc-border); padding-top:14px; margin-top:14px;">' +
				UI.field( { id: 'uname-' + index, label: 'Card name', type: 'text', value: card.name } ) +
				UI.field( { id: 'ubal-' + index, label: 'Current balance', value: card.balance, min: 0, step: '0.01' } ) +
				UI.field( { id: 'ulimit-' + index, label: 'Credit limit', value: card.limit, min: 1, step: '0.01' } ) +
				'<div class="cmc-field" style="justify-content:flex-end;"><button type="button" class="cmc-btn cmc-btn-secondary cmc-remove-util-row" data-row="' + index + '">Remove</button></div>' +
			'</div>'
		);
	}

	var rowCount = 0;
	function renderRows( cards ) {
		root.querySelector( '#util-container' ).innerHTML = cards.map( function ( c, i ) {
			rowCount = i + 1;
			return rowHtml( c, i );
		} ).join( '' );
	}

	root.innerHTML =
		'<div id="util-container"></div>' +
		'<div style="margin-top:14px;"><button type="button" class="cmc-btn cmc-btn-secondary" id="add-util-card">+ Add another card</button></div>' +
		UI.errorBox( 'err' ) +
		'<div class="cmc-results is-visible" id="results">' +
			UI.statsRow( [
				{ id: 'stat-overall', label: 'Overall utilization', value: '', highlight: true },
				{ id: 'stat-rating', label: 'Rating', value: '' },
				{ id: 'stat-target', label: 'Balance to hit 30% overall', value: '' },
				{ id: 'stat-target10', label: 'Balance to hit 10% overall', value: '' },
			] ) +
			'<div class="cmc-chart-wrap"><canvas id="chart-bar" height="220"></canvas></div>' +
			'<h3>Per-card utilization</h3>' +
			'<div id="table-wrap"></div>' +
		'</div>';

	renderRows( defaultCards );

	root.querySelector( '#add-util-card' ).addEventListener( 'click', function () {
		var idx = rowCount;
		root.querySelector( '#util-container' ).insertAdjacentHTML( 'beforeend', rowHtml( { name: 'Card ' + ( idx + 1 ), balance: 500, limit: 2000 }, idx ) );
		rowCount++;
		bindEvents();
		calc();
	} );

	function bindEvents() {
		root.querySelectorAll( '.cmc-remove-util-row' ).forEach( function ( btn ) {
			btn.onclick = function () {
				var row = root.querySelector( '.cmc-util-row[data-row="' + btn.getAttribute( 'data-row' ) + '"]' );
				if ( row && root.querySelectorAll( '.cmc-util-row' ).length > 1 ) {
					row.remove();
					calc();
				}
			};
		} );
		UI.onAnyChange( root, '#util-container input', calc );
	}

	function rating( pct ) {
		if ( pct <= 10 ) { return 'Excellent'; }
		if ( pct <= 30 ) { return 'Good'; }
		if ( pct <= 50 ) { return 'Fair — consider paying down'; }
		return 'High — likely hurting your score';
	}

	function readCards() {
		var rows = root.querySelectorAll( '.cmc-util-row' );
		var cards = [];
		rows.forEach( function ( row ) {
			var idx = row.getAttribute( 'data-row' );
			var nameEl = row.querySelector( '#uname-' + idx );
			cards.push( {
				name: nameEl ? nameEl.value : ( 'Card ' + idx ),
				balance: UI.num( root, 'ubal-' + idx ),
				limit: Math.max( 0, UI.num( root, 'ulimit-' + idx ) ),
			} );
		} );
		return cards;
	}

	function calc() {
		var cards = readCards();
		var err = root.querySelector( '#err' );

		// Cards with no credit limit entered can't have a utilization ratio,
		// so they're left out of the totals (and flagged in the table).
		var withLimit = cards.filter( function ( c ) { return c.limit > 0; } );
		var totalBalance = withLimit.reduce( function ( s, c ) { return s + c.balance; }, 0 );
		var totalLimit = withLimit.reduce( function ( s, c ) { return s + c.limit; }, 0 );

		if ( totalLimit <= 0 ) {
			err.textContent = 'Enter a credit limit greater than 0 for at least one card.';
			err.style.display = 'block';
			UI.toggleResults( root, false );
			return;
		}
		err.style.display = 'none';
		UI.toggleResults( root, true );

		var overallPct = ( totalBalance / totalLimit ) * 100;
		root.querySelector( '#stat-overall' ).textContent = F.percent( overallPct, 1 );
		root.querySelector( '#stat-rating' ).textContent = rating( overallPct );
		root.querySelector( '#stat-target' ).textContent = F.currency( Math.max( 0, totalBalance - totalLimit * 0.3 ) ) + ' to pay down';
		root.querySelector( '#stat-target10' ).textContent = F.currency( Math.max( 0, totalBalance - totalLimit * 0.1 ) ) + ' to pay down';

		C.drawBarChart( root.querySelector( '#chart-bar' ), withLimit.map( function ( c ) {
			var pct = ( c.balance / c.limit ) * 100;
			return { label: c.name, value: Math.round( pct * 10 ) / 10, color: pct > 30 ? C.palette.warn : C.palette.accent };
		} ), { suffix: '%' } );

		var rows = cards.map( function ( c ) {
			if ( c.limit <= 0 ) {
				return [ c.name, F.currency( c.balance ), '—', '—', 'Enter a credit limit' ];
			}
			var pct = ( c.balance / c.limit ) * 100;
			return [ c.name, F.currency( c.balance ), F.currency( c.limit ), F.percent( pct, 1 ), rating( pct ) ];
		} );
		root.querySelector( '#table-wrap' ).innerHTML = UI.table( [ 'Card', 'Balance', 'Limit', 'Utilization', 'Rating' ], rows );
	}

	bindEvents();
	calc();
	window.addEventListener( 'resize', UI.debounce( calc, 250 ) );
}());
