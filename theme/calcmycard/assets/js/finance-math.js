/**
 * CMCFinance — shared vanilla-JS financial math engine used by all 12
 * CalcMyCard calculators. No dependencies, no external requests: every
 * number a user types stays in the browser.
 *
 * Methodology note (also stated in each calculator's FAQ): interest is
 * modeled using a monthly rate of APR / 12, applied to the balance
 * remaining at the start of each month, iterated month by month. This is
 * a simplified approach; issuers may instead use a daily periodic rate on
 * the average daily balance, so results are estimates (this is disclosed
 * above every calculator via cmc_render_calc_method_note()). The dedicated Daily Periodic Rate calculator exposes
 * the true APR / 365 figure for users who want that specific number.
 */
(function (global) {
	'use strict';

	function monthlyRate( aprPercent ) {
		return ( Number( aprPercent ) || 0 ) / 100 / 12;
	}

	function dailyPeriodicRate( aprPercent ) {
		return ( Number( aprPercent ) || 0 ) / 100 / 365;
	}

	/**
	 * Build a month-by-month amortization schedule for a single balance
	 * paid down with a fixed payment (optionally plus a fixed extra
	 * amount). Stops when the balance reaches zero or maxMonths is hit.
	 *
	 * @return {
	 *   months, totalInterest, totalPaid, schedule: [...],
	 *   neverPaysOff: bool, finalPayment
	 * }
	 */
	function amortize( opts ) {
		var balance   = Math.max( 0, Number( opts.balance ) || 0 );
		var apr       = Number( opts.apr ) || 0;
		var payment   = Math.max( 0, Number( opts.payment ) || 0 );
		var extra     = Math.max( 0, Number( opts.extra ) || 0 );
		var maxMonths = opts.maxMonths || 600; // 50-year hard stop
		var r         = monthlyRate( apr );

		var schedule = [];
		var totalInterest = 0;
		var totalPaid = 0;
		var month = 0;
		var neverPaysOff = false;

		if ( balance <= 0 ) {
			return { months: 0, totalInterest: 0, totalPaid: 0, schedule: [], neverPaysOff: false };
		}

		var fullPayment = payment + extra;

		while ( balance > 0.005 && month < maxMonths ) {
			month++;
			var interest = balance * r;
			var thisPayment = Math.min( fullPayment, balance + interest );
			var principal = thisPayment - interest;

			if ( principal <= 0 ) {
				// Payment doesn't even cover interest — balance will never shrink.
				neverPaysOff = true;
				break;
			}

			balance = Math.max( 0, balance - principal );
			totalInterest += interest;
			totalPaid += thisPayment;

			schedule.push( {
				month: month,
				payment: thisPayment,
				interest: interest,
				principal: principal,
				balance: balance,
			} );
		}

		if ( month >= maxMonths && balance > 0.005 ) {
			neverPaysOff = true;
		}

		return {
			months: neverPaysOff ? null : month,
			totalInterest: totalInterest,
			totalPaid: totalPaid,
			schedule: schedule,
			neverPaysOff: neverPaysOff,
		};
	}

	/**
	 * Closed-form months-to-payoff (fast, no schedule needed) — used when we
	 * only need the headline number, e.g. for quick comparisons.
	 */
	function monthsToPayoff( balance, apr, payment ) {
		var r = monthlyRate( apr );
		balance = Number( balance ) || 0;
		payment = Number( payment ) || 0;
		if ( balance <= 0 ) {
			return 0;
		}
		if ( r === 0 ) {
			return payment > 0 ? Math.ceil( balance / payment ) : null;
		}
		var minRequired = balance * r;
		if ( payment <= minRequired ) {
			return null; // never pays off
		}
		var n = -Math.log( 1 - ( balance * r ) / payment ) / Math.log( 1 + r );
		return Math.ceil( n );
	}

	/**
	 * Estimate a typical issuer minimum payment.
	 * method: 'percent' -> percent * balance (floor applied)
	 *         'percent_plus_interest' -> max(percent*balance, interestThisMonth + 1% principal) with floor
	 */
	function estimateMinimumPayment( opts ) {
		var balance = Math.max( 0, Number( opts.balance ) || 0 );
		var apr     = Number( opts.apr ) || 0;
		var percent = opts.percent != null ? Number( opts.percent ) : 2; // percent as e.g. 2 for 2%
		var floor   = opts.floor != null ? Number( opts.floor ) : 25;
		var method  = opts.method || 'percent_plus_interest';

		if ( balance <= 0 ) {
			return 0;
		}

		var flatPercent = balance * ( percent / 100 );
		var result;

		if ( method === 'percent' ) {
			result = flatPercent;
		} else {
			// Interest + a slice of principal (1% by default). Some issuers
			// (e.g. Discover) add a fixed dollar amount instead of a percent.
			var interest = balance * monthlyRate( apr );
			var principalPct = opts.interestPlusPercent != null ? Number( opts.interestPlusPercent ) : 1;
			var principalFixed = opts.interestPlusFixed != null ? Number( opts.interestPlusFixed ) : 0;
			result = Math.max( flatPercent, interest + balance * ( principalPct / 100 ) + principalFixed );
		}

		result = Math.max( result, floor );
		return Math.min( result, balance + balance * monthlyRate( apr ) ); // never exceed payoff amount
	}

	/**
	 * Simulate paying only the recalculated minimum payment every month
	 * (the realistic "minimum payment only" scenario, since issuers
	 * recompute your minimum from the current balance each statement).
	 */
	function simulateMinimumOnly( opts ) {
		var balance = Math.max( 0, Number( opts.balance ) || 0 );
		var apr = Number( opts.apr ) || 0;
		var maxMonths = opts.maxMonths || 600;
		var r = monthlyRate( apr );
		var totalInterest = 0, totalPaid = 0, month = 0;
		var schedule = [];
		var neverPaysOff = false;

		while ( balance > 0.005 && month < maxMonths ) {
			month++;
			var interest = balance * r;
			var minPay = estimateMinimumPayment( {
				balance: balance, apr: apr,
				percent: opts.percent, floor: opts.floor, method: opts.method,
				interestPlusPercent: opts.interestPlusPercent, interestPlusFixed: opts.interestPlusFixed,
			} );
			var payment = Math.min( minPay, balance + interest );
			var principal = payment - interest;

			if ( principal <= 0 ) {
				neverPaysOff = true;
				break;
			}

			balance = Math.max( 0, balance - principal );
			totalInterest += interest;
			totalPaid += payment;
			schedule.push( { month: month, payment: payment, interest: interest, principal: principal, balance: balance } );
		}

		if ( month >= maxMonths && balance > 0.005 ) {
			neverPaysOff = true;
		}

		return {
			months: neverPaysOff ? null : month,
			totalInterest: totalInterest,
			totalPaid: totalPaid,
			schedule: schedule,
			neverPaysOff: neverPaysOff,
		};
	}

	/**
	 * Simulate multi-card payoff under either the snowball (smallest balance
	 * first) or avalanche (highest APR first) method, with the standard
	 * "rollover": the total monthly budget (every card's starting minimum +
	 * the extra amount) stays the same each month, so when a card is paid
	 * off, the money that was going to it rolls to the next target.
	 *
	 * Each month: (1) interest accrues on every open card (APR / 12);
	 * (2) each open card gets its minimum (capped at its balance);
	 * (3) whatever is left of the budget goes to the target card, and any
	 * remainder after clearing it goes to the next target in the same month.
	 */
	function simulateMultiCardPayoff( cards, extraPerMonth, order ) {
		// Deep copy so repeated calls (snowball vs avalanche) don't interfere.
		var working = cards.map( function ( c, i ) {
			return {
				id: i,
				name: c.name || ( 'Card ' + ( i + 1 ) ),
				balance: Math.max( 0, Number( c.balance ) || 0 ),
				apr: Math.max( 0, Number( c.apr ) || 0 ),
				minPayment: Math.max( 0, Number( c.minPayment ) || 0 ),
			};
		} ).filter( function ( c ) { return c.balance > 0; } );

		extraPerMonth = Math.max( 0, Number( extraPerMonth ) || 0 );
		var budget = working.reduce( function ( s, c ) { return s + c.minPayment; }, 0 ) + extraPerMonth;

		var totalInterest = 0;
		var month = 0;
		var maxMonths = 600;
		var payoffOrder = [];

		function isOpen( c ) { return c.balance > 0.005; }

		while ( working.some( isOpen ) && month < maxMonths ) {
			month++;

			working.forEach( function ( c ) {
				if ( isOpen( c ) ) {
					var interest = c.balance * monthlyRate( c.apr );
					c.balance += interest;
					totalInterest += interest;
				}
			} );

			var left = budget;
			working.forEach( function ( c ) {
				if ( ! isOpen( c ) || left <= 0 ) {
					return;
				}
				var pay = Math.min( c.minPayment, c.balance, left );
				c.balance -= pay;
				left -= pay;
			} );

			var targets = working.filter( isOpen ).sort( function ( a, b ) {
				var d = order === 'avalanche' ? ( b.apr - a.apr ) : ( a.balance - b.balance );
				return d !== 0 ? d : a.id - b.id; // stable tie-break: input order
			} );
			for ( var t = 0; t < targets.length && left > 0; t++ ) {
				var extraPay = Math.min( left, targets[ t ].balance );
				targets[ t ].balance -= extraPay;
				left -= extraPay;
			}

			working.forEach( function ( c ) {
				if ( ! isOpen( c ) && ! c.done ) {
					c.done = true;
					c.balance = 0;
					payoffOrder.push( { name: c.name, month: month } );
				}
			} );
		}

		var never = working.some( isOpen );
		return {
			months: never ? null : month,
			totalInterest: totalInterest,
			payoffOrder: payoffOrder,
			neverPaysOff: never,
			monthlyBudget: budget,
		};
	}

	/**
	 * Roll a monthly amortization schedule up into one row per year
	 * (interest paid, principal paid, ending balance) — used for the
	 * on-page table whenever a payoff takes longer than ~3 years, so the
	 * table stays short and scannable instead of dumping 200+ rows.
	 */
	function annualSummary( schedule ) {
		var years = [];
		var current = null;
		schedule.forEach( function ( row ) {
			var yearIndex = Math.floor( ( row.month - 1 ) / 12 );
			if ( ! current || current.year !== yearIndex + 1 ) {
				current = { year: yearIndex + 1, interest: 0, principal: 0, paid: 0, endBalance: row.balance };
				years.push( current );
			}
			current.interest += row.interest;
			current.principal += row.principal;
			current.paid += row.payment;
			current.endBalance = row.balance;
		} );
		return years;
	}

	function currency( num ) {
		num = Number( num ) || 0;
		return '$' + num.toLocaleString( 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 } );
	}

	function currencyRounded( num ) {
		num = Math.round( Number( num ) || 0 );
		return '$' + num.toLocaleString( 'en-US' );
	}

	function percent( num, decimals ) {
		decimals = decimals == null ? 2 : decimals;
		return ( Number( num ) || 0 ).toFixed( decimals ) + '%';
	}

	function monthsToYearsMonths( totalMonths ) {
		if ( totalMonths == null ) {
			return 'Never (payment too low)';
		}
		var years = Math.floor( totalMonths / 12 );
		var months = totalMonths % 12;
		var parts = [];
		if ( years > 0 ) {
			parts.push( years + ( years === 1 ? ' year' : ' years' ) );
		}
		if ( months > 0 || years === 0 ) {
			parts.push( months + ( months === 1 ? ' month' : ' months' ) );
		}
		return parts.join( ', ' );
	}

	global.CMCFinance = {
		monthlyRate: monthlyRate,
		dailyPeriodicRate: dailyPeriodicRate,
		amortize: amortize,
		monthsToPayoff: monthsToPayoff,
		estimateMinimumPayment: estimateMinimumPayment,
		simulateMinimumOnly: simulateMinimumOnly,
		simulateMultiCardPayoff: simulateMultiCardPayoff,
		annualSummary: annualSummary,
		currency: currency,
		currencyRounded: currencyRounded,
		percent: percent,
		monthsToYearsMonths: monthsToYearsMonths,
	};

}( window ));
