/**
 * CMCChart — a tiny dependency-free canvas chart helper. Three chart types
 * cover every calculator on the site: a donut (principal vs. interest
 * split), a line chart (balance declining over time), and a bar chart
 * (side-by-side comparisons, e.g. snowball vs. avalanche, transfer vs. stay).
 * No CDN, no library weight — just Canvas 2D.
 */
(function ( global ) {
	'use strict';

	var PALETTE = {
		brand: '#0e8fa3',
		brandLight: '#a6e3ec',
		accent: '#1e2a44',
		muted: '#586174',
		border: '#e3e6ee',
		warn: '#f0a020',
	};

	function prepCanvas( canvas ) {
		var dpr = global.devicePixelRatio || 1;
		var rect = canvas.getBoundingClientRect();
		var w = Math.max( 200, rect.width || canvas.clientWidth || 400 );
		var h = Math.max( 160, rect.height || canvas.clientHeight || 260 );
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		var ctx = canvas.getContext( '2d' );
		ctx.setTransform( dpr, 0, 0, dpr, 0, 0 );
		ctx.clearRect( 0, 0, w, h );
		return { ctx: ctx, w: w, h: h };
	}

	function drawDonut( canvas, data ) {
		var p = prepCanvas( canvas );
		var ctx = p.ctx, w = p.w, h = p.h;
		var cx = w * 0.32, cy = h / 2, r = Math.min( cx, cy ) - 10;
		var total = data.values.reduce( function ( a, b ) { return a + b; }, 0 ) || 1;
		var start = -Math.PI / 2;

		data.values.forEach( function ( v, i ) {
			var slice = ( v / total ) * Math.PI * 2;
			ctx.beginPath();
			ctx.moveTo( cx, cy );
			ctx.arc( cx, cy, r, start, start + slice );
			ctx.closePath();
			ctx.fillStyle = data.colors[ i ] || PALETTE.brand;
			ctx.fill();
			start += slice;
		} );

		// Donut hole
		ctx.beginPath();
		ctx.arc( cx, cy, r * 0.55, 0, Math.PI * 2 );
		ctx.fillStyle = '#fff';
		ctx.fill();

		// Legend
		var lx = w * 0.62, ly = h / 2 - ( data.labels.length * 22 ) / 2;
		ctx.font = '13px -apple-system, Arial, sans-serif';
		ctx.textBaseline = 'middle';
		data.labels.forEach( function ( label, i ) {
			ctx.fillStyle = data.colors[ i ] || PALETTE.brand;
			ctx.fillRect( lx, ly + i * 22, 12, 12 );
			ctx.fillStyle = PALETTE.muted;
			ctx.fillText( label, lx + 18, ly + i * 22 + 6 );
		} );
	}

	function drawLineChart( canvas, series, labels ) {
		var p = prepCanvas( canvas );
		var ctx = p.ctx, w = p.w, h = p.h;
		var padL = 46, padB = 24, padT = 14, padR = 14;
		var plotW = w - padL - padR;
		var plotH = h - padT - padB;

		var allValues = [];
		series.forEach( function ( s ) { allValues = allValues.concat( s.data ); } );
		var maxV = Math.max.apply( null, allValues.concat( [ 1 ] ) );
		var n = ( series[0] && series[0].data.length ) || 1;

		// Axes
		ctx.strokeStyle = PALETTE.border;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo( padL, padT );
		ctx.lineTo( padL, padT + plotH );
		ctx.lineTo( padL + plotW, padT + plotH );
		ctx.stroke();

		// Y labels (0, mid, max)
		ctx.fillStyle = PALETTE.muted;
		ctx.font = '11px -apple-system, Arial, sans-serif';
		ctx.textAlign = 'right';
		[ 0, 0.5, 1 ].forEach( function ( frac ) {
			var y = padT + plotH - frac * plotH;
			ctx.fillText( '$' + Math.round( maxV * frac ).toLocaleString(), padL - 6, y + 3 );
		} );

		series.forEach( function ( s ) {
			ctx.beginPath();
			s.data.forEach( function ( v, i ) {
				var x = padL + ( i / Math.max( 1, n - 1 ) ) * plotW;
				var y = padT + plotH - ( v / maxV ) * plotH;
				if ( i === 0 ) {
					ctx.moveTo( x, y );
				} else {
					ctx.lineTo( x, y );
				}
			} );
			ctx.strokeStyle = s.color || PALETTE.brand;
			ctx.lineWidth = 2.5;
			ctx.stroke();
		} );

		// X label: first / last
		if ( labels && labels.length ) {
			ctx.fillStyle = PALETTE.muted;
			ctx.textAlign = 'left';
			ctx.fillText( labels[0], padL, h - 4 );
			ctx.textAlign = 'right';
			ctx.fillText( labels[ labels.length - 1 ], padL + plotW, h - 4 );
		}
	}

	function drawBarChart( canvas, bars, opts ) {
		// bars: [{label, value, color, displayValue}]
		opts = opts || {};
		var p = prepCanvas( canvas );
		var ctx = p.ctx, w = p.w, h = p.h;
		var padL = 10, padR = 10, padT = 16, padB = 30;
		var plotW = w - padL - padR;
		var plotH = h - padT - padB;
		var maxV = Math.max.apply( null, bars.map( function ( b ) { return b.value; } ).concat( [ 1 ] ) );
		var gap = 24;
		var barW = ( plotW - gap * ( bars.length - 1 ) ) / bars.length;

		bars.forEach( function ( b, i ) {
			var barH = ( b.value / maxV ) * plotH;
			var x = padL + i * ( barW + gap );
			var y = padT + plotH - barH;
			ctx.fillStyle = b.color || PALETTE.brand;
			ctx.fillRect( x, y, barW, barH );

			ctx.fillStyle = PALETTE.text || '#1a2233';
			ctx.font = '12px -apple-system, Arial, sans-serif';
			ctx.textAlign = 'center';
			var displayValue = b.displayValue || ( ( opts.suffix || '$' ) === '%' ? Math.round( b.value ) + '%' : '$' + Math.round( b.value ).toLocaleString() );
			ctx.fillText( displayValue, x + barW / 2, y - 6 );
			ctx.fillStyle = PALETTE.muted;
			ctx.fillText( b.label, x + barW / 2, padT + plotH + 18 );
		} );
	}

	global.CMCChart = {
		palette: PALETTE,
		drawDonut: drawDonut,
		drawLineChart: drawLineChart,
		drawBarChart: drawBarChart,
	};

}( window ));
