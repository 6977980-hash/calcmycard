/**
 * CMCUI — tiny HTML-building helpers shared by every calculator script, so
 * each individual calc-*.js file only has to describe its own fields and
 * math, not repeat markup boilerplate.
 */
(function ( global ) {
	'use strict';

	function esc( s ) {
		return String( s == null ? '' : s ).replace( /[&<>"']/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ];
		} );
	}

	/**
	 * field({id,label,type,value,step,min,max,hint,prefix,suffix,options})
	 * type: 'number' (default), 'select' (needs options: [{value,label}])
	 */
	function field( f ) {
		var type = f.type || 'number';
		var wrapAttrs = '';
		var inputHtml;

		if ( type === 'select' ) {
			var opts = ( f.options || [] ).map( function ( o ) {
				var sel = ( String( o.value ) === String( f.value ) ) ? ' selected' : '';
				return '<option value="' + esc( o.value ) + '"' + sel + '>' + esc( o.label ) + '</option>';
			} ).join( '' );
			inputHtml = '<select id="' + esc( f.id ) + '">' + opts + '</select>';
		} else if ( type === 'text' ) {
			// Plain text fields (e.g. an editable card name) must NOT use
			// type="number" — a browser's native number input silently
			// discards a non-numeric value like "Card 1" and renders empty,
			// which is exactly the bug found in the Sept 2026 audit (default
			// card-name fields on the Utilization and Multi-Card calculators
			// showed blank instead of "Card 1"/"Card 2").
			inputHtml = '<input type="text" id="' + esc( f.id ) + '" value="' + esc( f.value ) + '"' +
				( f.maxlength != null ? ' maxlength="' + esc( f.maxlength ) + '"' : '' ) +
				' />';
		} else {
			inputHtml = '<input type="number" id="' + esc( f.id ) + '" value="' + esc( f.value ) + '"' +
				( f.step != null ? ' step="' + esc( f.step ) + '"' : ' step="any"' ) +
				( f.min != null ? ' min="' + esc( f.min ) + '"' : '' ) +
				( f.max != null ? ' max="' + esc( f.max ) + '"' : '' ) +
				' inputmode="decimal" />';
		}

		return (
			'<div class="cmc-field"' + wrapAttrs + '>' +
				'<label for="' + esc( f.id ) + '">' + esc( f.label ) + '</label>' +
				inputHtml +
				( f.hint ? '<span class="cmc-hint">' + esc( f.hint ) + '</span>' : '' ) +
			'</div>'
		);
	}

	function formGrid( fieldsHtml ) {
		return '<div class="cmc-calc-grid">' + fieldsHtml.join( '' ) + '</div>';
	}

	/**
	 * stats: [{id, label, value, highlight}]
	 */
	function statsRow( stats ) {
		return '<div class="cmc-result-stats">' + stats.map( function ( s ) {
			return (
				'<div class="cmc-stat' + ( s.highlight ? ' cmc-stat-highlight' : '' ) + '">' +
					'<div class="cmc-stat-label">' + esc( s.label ) + '</div>' +
					'<div class="cmc-stat-value" id="' + esc( s.id ) + '">' + esc( s.value || '—' ) + '</div>' +
				'</div>'
			);
		} ).join( '' ) + '</div>';
	}

	function table( headers, rows, opts ) {
		opts = opts || {};
		var thead = '<thead><tr>' + headers.map( function ( h ) { return '<th>' + esc( h ) + '</th>'; } ).join( '' ) + '</tr></thead>';
		var tbody = '<tbody>' + rows.map( function ( row ) {
			return '<tr>' + row.map( function ( cell ) { return '<td>' + esc( cell ) + '</td>'; } ).join( '' ) + '</tr>';
		} ).join( '' ) + '</tbody>';
		return '<div class="cmc-table-wrap"><table>' + thead + tbody + '</table></div>';
	}

	function errorBox( id ) {
		return '<p class="cmc-calc-error" id="' + esc( id ) + '"></p>';
	}

	/**
	 * Show or hide a calculator's results panel. Results are hidden while an
	 * input error is showing, so stale numbers from the last valid input
	 * never sit next to the error message.
	 */
	function toggleResults( root, visible ) {
		var results = root.querySelector( '#results' );
		if ( results ) {
			results.style.display = visible ? '' : 'none';
		}
	}

	function debounce( fn, wait ) {
		var t;
		return function () {
			var args = arguments, ctx = this;
			clearTimeout( t );
			t = setTimeout( function () { fn.apply( ctx, args ); }, wait || 150 );
		};
	}

	function onAnyChange( root, selector, handler ) {
		var els = root.querySelectorAll( selector );
		var debounced = debounce( handler, 120 );
		els.forEach( function ( el ) {
			el.addEventListener( 'input', debounced );
			el.addEventListener( 'change', debounced );
		} );
	}

	function num( root, id, fallback ) {
		var el = root.querySelector( '#' + id );
		if ( ! el ) {
			return fallback || 0;
		}
		var v = parseFloat( el.value );
		return isNaN( v ) ? ( fallback || 0 ) : v;
	}

	global.CMCUI = {
		esc: esc,
		field: field,
		formGrid: formGrid,
		statsRow: statsRow,
		table: table,
		errorBox: errorBox,
		toggleResults: toggleResults,
		debounce: debounce,
		onAnyChange: onAnyChange,
		num: num,
	};

}( window ));
