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
	// Values passed in the page URL (from a "Copy link to these results"
	// link) prefill the matching fields.
	var urlParams = ( function () {
		try { return new URLSearchParams( global.location.search ); } catch ( e ) { return null; }
	}() );

	function field( f ) {
		var type = f.type || 'number';
		if ( urlParams && urlParams.has( f.id ) ) {
			f = Object.assign( {}, f, { value: urlParams.get( f.id ) } );
		}
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

	function csvCell( v ) {
		var s = String( v == null ? '' : v );
		return /[",\n]/.test( s ) ? '"' + s.replace( /"/g, '""' ) + '"' : s;
	}

	/**
	 * Buttons to download a table as CSV or print it. getData() returns
	 * { title, filename, headers, rows } at click time, so the file always
	 * matches the current inputs.
	 */
	function tableActions( root, id, getData ) {
		var bar = root.querySelector( '#' + id );
		if ( ! bar ) {
			return;
		}
		bar.innerHTML = '<button type="button" class="cmc-btn cmc-btn-secondary cmc-btn-small" data-act="csv">Download CSV</button> ' +
			'<button type="button" class="cmc-btn cmc-btn-secondary cmc-btn-small" data-act="print">Print</button>';
		bar.addEventListener( 'click', function ( e ) {
			var act = e.target && e.target.getAttribute( 'data-act' );
			if ( ! act ) {
				return;
			}
			var d = getData();
			if ( act === 'csv' ) {
				var csv = [ d.headers ].concat( d.rows ).map( function ( r ) { return r.map( csvCell ).join( ',' ); } ).join( '\r\n' );
				var a = document.createElement( 'a' );
				a.href = URL.createObjectURL( new Blob( [ csv ], { type: 'text/csv;charset=utf-8' } ) );
				a.download = d.filename;
				document.body.appendChild( a );
				a.click();
				setTimeout( function () { URL.revokeObjectURL( a.href ); a.remove(); }, 0 );
			} else {
				var w = global.open( '', '_blank' );
				if ( ! w ) {
					return;
				}
				w.document.write( '<!doctype html><html><head><meta charset="utf-8"><title>' + esc( d.title ) + '</title>' +
					'<style>body{font:13px/1.4 system-ui,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 8px;text-align:right}th:first-child,td:first-child{text-align:left}</style></head><body>' +
					'<h1 style="font-size:18px">' + esc( d.title ) + '</h1>' + table( d.headers, d.rows ) +
					'<p style="color:#666">Estimate from ' + esc( global.location.origin + global.location.pathname ) + '. Simplified model; your statement may differ.</p></body></html>' );
				w.document.close();
				w.focus();
				w.print();
			}
		} );
	}

	/**
	 * "Copy link to these results" under every calculator: the link carries
	 * the current inputs, and field() reads them back on load.
	 */
	function addShareBars() {
		document.querySelectorAll( '.cmc-calculator' ).forEach( function ( root ) {
			if ( root.querySelector( '.cmc-share-bar' ) || ! root.querySelector( 'input, select' ) ) {
				return;
			}
			var bar = document.createElement( 'div' );
			bar.className = 'cmc-share-bar';
			bar.innerHTML = '<button type="button" class="cmc-btn cmc-btn-secondary cmc-btn-small">Copy link to these results</button><span class="cmc-share-msg" role="status"></span>';
			root.appendChild( bar );
			bar.querySelector( 'button' ).addEventListener( 'click', function () {
				var params = new URLSearchParams();
				root.querySelectorAll( 'input[id], select[id]' ).forEach( function ( el ) {
					if ( el.value !== '' ) {
						params.set( el.id, el.value );
					}
				} );
				var url = global.location.origin + global.location.pathname + '?' + params.toString();
				var msg = bar.querySelector( '.cmc-share-msg' );
				var done = function () { msg.textContent = ' Link copied'; };
				if ( navigator.clipboard && navigator.clipboard.writeText ) {
					navigator.clipboard.writeText( url ).then( done, function () { global.prompt( 'Copy this link:', url ); } );
				} else {
					global.prompt( 'Copy this link:', url );
				}
			} );
		} );
	}
	// Calculator scripts load after this file and render on load, so wait.
	global.addEventListener( 'load', addShareBars );

	global.CMCUI = {
		tableActions: tableActions,
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
