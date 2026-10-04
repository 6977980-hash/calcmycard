/**
 * Global site behavior: mobile nav toggle, and the rate chart drawn from
 * any table marked data-cmc-rate-chart or data-cmc-bar-chart (so updating the table updates the
 * chart). Calculator logic lives in its own per-page file.
 */
(function () {
	'use strict';
	document.addEventListener( 'DOMContentLoaded', function () {
		var toggle = document.getElementById( 'cmc-nav-toggle' );
		var nav = document.getElementById( 'cmc-primary-nav' );
		if ( ! toggle || ! nav ) {
			return;
		}
		toggle.addEventListener( 'click', function () {
			var isOpen = nav.classList.toggle( 'is-open' );
			toggle.setAttribute( 'aria-expanded', isOpen ? 'true' : 'false' );
		} );
	} );

	/**
	 * Line chart (inline SVG) from a table whose rows are
	 * period | series A % | series B %, with the series names in <thead>.
	 */
	function drawRateChart( table ) {
		var heads = [].map.call( table.querySelectorAll( 'thead th' ), function ( th ) { return th.textContent.trim(); } );
		var rows = [].map.call( table.querySelectorAll( 'tbody tr' ), function ( tr ) {
			var td = tr.querySelectorAll( 'td' );
			return [ td[0].textContent.trim(), parseFloat( td[1].textContent ), parseFloat( td[2].textContent ) ];
		} ).filter( function ( r ) { return ! isNaN( r[1] ) && ! isNaN( r[2] ); } );
		if ( rows.length < 2 ) {
			return;
		}
		var W = 640, H = 270, L = 40, B = 46, T = 16, plotH = H - B - T, plotW = W - L - 10;
		var all = [];
		rows.forEach( function ( r ) { all.push( r[1], r[2] ); } );
		var lo = Math.floor( Math.min.apply( null, all ) ) - 1, hi = Math.ceil( Math.max.apply( null, all ) ) + 0.5;
		var y = function ( v ) { return T + plotH - ( v - lo ) / ( hi - lo ) * plotH; };
		var colors = [ '#0e8fa3', '#c27400' ];
		var gw = plotW / rows.length;
		var x = function ( i ) { return L + gw * i + gw / 2; };
		var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Average credit card interest rates by period, from the table below" style="width:100%;height:auto;display:block">';
		for ( var g = Math.ceil( lo ); g <= hi; g++ ) {
			svg += '<line x1="' + L + '" x2="' + ( W - 10 ) + '" y1="' + y( g ) + '" y2="' + y( g ) + '" stroke="#e3e6ee"/><text x="' + ( L - 6 ) + '" y="' + ( y( g ) + 4 ) + '" font-size="11" text-anchor="end" fill="#586174">' + g + '%</text>';
		}
		// Lines rather than bars: the axis doesn't start at 0.
		[ 1, 2 ].forEach( function ( k ) {
			svg += '<polyline fill="none" stroke-width="2.5" stroke="' + colors[ k - 1 ] + '" points="' + rows.map( function ( r, i ) { return x( i ) + ',' + y( r[k] ); } ).join( ' ' ) + '"/>';
			rows.forEach( function ( r, i ) {
				var above = k === 2 || r[2] - r[1] > 0.3;
				svg += '<circle cx="' + x( i ) + '" cy="' + y( r[k] ) + '" r="4" fill="' + colors[ k - 1 ] + '"><title>' + r[0] + ': ' + r[k] + '%</title></circle>' +
					'<text x="' + x( i ) + '" y="' + ( y( r[k] ) + ( k === 2 && above ? -9 : 17 ) ) + '" font-size="10" text-anchor="middle" fill="#141a28">' + r[k].toFixed( 2 ) + '%</text>';
			} );
		} );
		rows.forEach( function ( r, i ) {
			svg += '<text x="' + x( i ) + '" y="' + ( H - B + 16 ) + '" font-size="11" text-anchor="middle" fill="#586174">' + r[0] + '</text>';
		} );
		[ 1, 2 ].forEach( function ( k ) {
			var lx = L + ( k - 1 ) * 230;
			svg += '<rect x="' + lx + '" y="' + ( H - 16 ) + '" width="10" height="10" rx="2" fill="' + colors[ k - 1 ] + '"/><text x="' + ( lx + 15 ) + '" y="' + ( H - 7 ) + '" font-size="11" fill="#141a28">' + ( heads[k] || '' ) + '</text>';
		} );
		svg += '</svg>';
		var fig = document.createElement( 'figure' );
		fig.className = 'cmc-rate-chart';
		fig.innerHTML = svg;
		var wrap = table.closest( '.cmc-example-wrap' ) || table;
		wrap.parentNode.insertBefore( fig, wrap );
	}

	/**
	 * Horizontal bar chart (inline SVG) from a table marked
	 * data-cmc-bar-chart="N": one bar per row, labelled with the row's first
	 * cell, sized by the number in column N and showing that cell's text.
	 * Bars start at zero.
	 */
	function drawBarChart( table ) {
		var col = parseInt( table.getAttribute( 'data-cmc-bar-chart' ), 10 ) || 1;
		var rows = [].map.call( table.querySelectorAll( 'tbody tr' ), function ( tr ) {
			var td = tr.querySelectorAll( 'td, th' );
			return td[ col ] ? [ td[0].textContent.trim(), parseFloat( td[ col ].textContent.replace( /[^0-9.]/g, '' ) ), td[ col ].textContent.trim() ] : null;
		} ).filter( function ( r ) { return r && ! isNaN( r[1] ); } );
		if ( ! rows.length ) {
			return;
		}
		var max = Math.max.apply( null, rows.map( function ( r ) { return r[1]; } ) );
		var W = 640, L = 110, R = 130, rowH = 34, H = rows.length * rowH + 8;
		var esc = function ( t ) { return t.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ); };
		var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc( table.getAttribute( 'data-cmc-bar-label' ) || 'Bar chart of the table below' ) + '" style="width:100%;height:auto;display:block">';
		rows.forEach( function ( r, i ) {
			var y = 4 + i * rowH, w = ( W - L - R ) * r[1] / max;
			svg += '<text x="' + ( L - 8 ) + '" y="' + ( y + 19 ) + '" font-size="13" text-anchor="end" fill="#141a28">' + esc( r[0] ) + '</text>' +
				'<rect x="' + L + '" y="' + ( y + 4 ) + '" width="' + w.toFixed( 1 ) + '" height="' + ( rowH - 12 ) + '" rx="3" fill="' + ( r[1] === max ? '#c27400' : '#0e8fa3' ) + '"/>' +
				'<text x="' + ( L + w + 8 ) + '" y="' + ( y + 19 ) + '" font-size="13" fill="#141a28">' + esc( r[2] ) + '</text>';
		} );
		svg += '</svg>';
		var fig = document.createElement( 'figure' );
		fig.className = 'cmc-rate-chart';
		fig.innerHTML = svg;
		var wrap = table.closest( '.cmc-example-wrap' ) || table;
		wrap.parentNode.insertBefore( fig, wrap );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		[].forEach.call( document.querySelectorAll( 'table[data-cmc-rate-chart]' ), drawRateChart );
		[].forEach.call( document.querySelectorAll( 'table[data-cmc-bar-chart]' ), drawBarChart );
	} );
}());
