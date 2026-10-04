/**
 * Global site behavior: mobile nav toggle only. Kept tiny on purpose —
 * calculator logic lives in its own per-page file.
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
}());
