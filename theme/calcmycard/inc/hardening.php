<?php
/**
 * Privacy, security, and head clean-up tweaks, plus /llms.txt.
 *
 * - The public REST users endpoint and author archives exposed the admin
 *   account's login slug and display name (an email address) to anyone.
 * - The custom logo's alt text came from the uploaded file name.
 * - The site publishes pages only, so the RSS/comments feeds, RSD and
 *   shortlink tags in <head> point at empty or unused endpoints.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Hide /wp-json/wp/v2/users from visitors who aren't logged in.
 */
function cmc_restrict_rest_users( $endpoints ) {
	if ( is_user_logged_in() ) {
		return $endpoints;
	}
	foreach ( array_keys( $endpoints ) as $route ) {
		if ( 0 === strpos( $route, '/wp/v2/users' ) ) {
			unset( $endpoints[ $route ] );
		}
	}
	return $endpoints;
}
add_filter( 'rest_endpoints', 'cmc_restrict_rest_users' );

/**
 * Send author archives (and ?author=N lookups) to the About page, which is
 * the real author page for this one-person site.
 */
function cmc_redirect_author_archives() {
	if ( is_author() || ( isset( $_GET['author'] ) && ! is_admin() ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		wp_safe_redirect( home_url( '/about/' ), 301 );
		exit;
	}
}
add_action( 'template_redirect', 'cmc_redirect_author_archives', 1 );

/**
 * Author links (e.g. in oEmbed data) should point to the About page too.
 */
add_filter( 'author_link', function () {
	return home_url( '/about/' );
} );

/**
 * Logo alt text: the site name, not the image's file name.
 */
add_filter( 'get_custom_logo_image_attributes', function ( $attr ) {
	$attr['alt'] = get_bloginfo( 'name', 'display' );
	return $attr;
} );

/**
 * Head clean-up.
 */
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );
remove_action( 'wp_head', 'feed_links', 2 );
remove_action( 'wp_head', 'feed_links_extra', 3 );
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );

/**
 * XML-RPC off (25 Oct 2026 audit, A25-018). Nothing on the site uses it
 * (no mobile app, no Jetpack), and xmlrpc.php answered system.listMethods
 * and pingback.ping for anyone, a common target for password guessing and
 * pingback abuse. The filters cover any XML-RPC call; the early exit makes
 * xmlrpc.php itself answer 403 instead of listing its methods. A full block
 * before WordPress loads would need an .htaccess rule on the server.
 */
add_filter( 'xmlrpc_enabled', '__return_false' );
add_filter( 'xmlrpc_methods', '__return_empty_array' );
add_filter( 'pings_open', '__return_false' );
add_filter( 'wp_headers', function ( $headers ) {
	unset( $headers['X-Pingback'] );
	return $headers;
} );
add_filter( 'bloginfo_url', function ( $output, $show ) {
	return 'pingback_url' === $show ? '' : $output;
}, 10, 2 );
if ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) {
	status_header( 403 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	echo 'XML-RPC is disabled on this site.';
	exit;
}

/**
 * Serve /llms.txt: a plain-text map of the site for AI assistants, built from
 * the same calculator and guide data the pages use, so it never drifts.
 */
function cmc_llms_txt() {
	$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	if ( '/llms.txt' !== $path ) {
		return;
	}

	$lines   = array();
	$lines[] = '# ' . get_bloginfo( 'name' );
	$lines[] = '';
	$lines[] = '> Free credit card calculators and plain-English guides for U.S. cardholders: interest, payoff time, minimum payments, balance transfers, utilization, and snowball vs. avalanche. Most calculators use a disclosed simplified monthly model (APR / 12); the Daily Periodic Rate, Cash Advance and Interest Charge Checker tools use daily interest (APR / 365 or 360). Built and maintained by Ali Ahmad. Educational estimates, not financial advice.';
	$lines[] = '';
	$lines[] = '## Calculators';
	$lines[] = '';
	foreach ( cmc_calculators() as $calc ) {
		$lines[] = sprintf( '- [%s](%s): %s', $calc['title'], home_url( '/calculators/' . $calc['slug'] . '/' ), $calc['dek'] );
	}
	$lines[] = '';
	$lines[] = '## Guides';
	$lines[] = '';
	foreach ( cmc_articles() as $article ) {
		$lines[] = sprintf( '- [%s](%s): %s', $article['title'], home_url( '/guides/' . $article['slug'] . '/' ), $article['meta_description'] );
	}
	$lines[] = '';
	$lines[] = '## About';
	$lines[] = '';
	$lines[] = '- [Methodology](' . home_url( '/methodology/' ) . '): the exact formulas behind every calculator and how they are tested.';
	$lines[] = '- [Editorial policy](' . home_url( '/editorial-policy/' ) . '): sourcing standards (Federal Reserve G.19, CFPB, Regulation Z, FICO) and corrections.';
	$lines[] = '- [About](' . home_url( '/about/' ) . ')';
	$lines[] = '- [Terms of Use](' . home_url( '/terms/' ) . '): estimates are educational, not financial advice; how the calculators may be used and embedded.';
	$lines[] = '';

	status_header( 200 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'X-Robots-Tag: noindex' );
	echo implode( "\n", $lines ); // phpcs:ignore WordPress.Security.EscapeOutput -- plain text built from theme data.
	exit;
}
add_action( 'parse_request', 'cmc_llms_txt', 0 );

/**
 * Bing Webmaster Tools and Google Search Console site verification, added at
 * the owner's request. Front page only; both check the home URL.
 */
function cmc_bing_site_verification() {
	if ( is_front_page() ) {
		echo '<meta name="msvalidate.01" content="3CA5D5A38222486BA11B6778E763417C" />' . "\n";
		// Google Search Console site verification (added 2026-10-14 at the owner's request).
		echo '<meta name="google-site-verification" content="ed5NfE-f6g0xgeK3YhxfCjW4C0QlU5jSj_OP-yeIbY8" />' . "\n";
	}
}
add_action( 'wp_head', 'cmc_bing_site_verification', 1 );

/**
 * Security headers (audit FIX-015). The host already sends
 * "Content-Security-Policy: upgrade-insecure-requests"; this adds the rest.
 * Calculator embeds (?embed=1) must stay frameable by any site, so they
 * get no frame-ancestors rule. HSTS covers calcmycard.com only (no
 * includeSubDomains), so it can't affect other hosts.
 *
 * Cache-Control (audit FIX-016): without it, Hostinger's CDN kept HTML for
 * hours after a deploy. s-maxage lets the CDN keep a page for 10 minutes;
 * LiteSpeed's own page cache still serves the copies it fetches.
 */
function cmc_send_security_headers() {
	if ( is_admin() || headers_sent() ) {
		return;
	}
	header( 'Strict-Transport-Security: max-age=31536000' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Referrer-Policy: strict-origin-when-cross-origin' );
	header( 'Permissions-Policy: camera=(), microphone=(), geolocation=()' );
	if ( ! isset( $_GET['embed'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
		header( "Content-Security-Policy: frame-ancestors 'self'" );
	}
	$has_cache_control = false;
	foreach ( headers_list() as $h ) {
		if ( 0 === stripos( $h, 'Cache-Control:' ) ) {
			$has_cache_control = true;
			break;
		}
	}
	if ( ! $has_cache_control && ! is_user_logged_in() && 'GET' === ( isset( $_SERVER['REQUEST_METHOD'] ) ? $_SERVER['REQUEST_METHOD'] : 'GET' ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		header( 'Cache-Control: public, max-age=0, s-maxage=600' );
	}
}
add_action( 'send_headers', 'cmc_send_security_headers' );

/**
 * Don't announce the WordPress version (audit FIX-019): no generator tag in
 * <head> or feeds.
 */
remove_action( 'wp_head', 'wp_generator' );
add_filter( 'the_generator', '__return_empty_string' );

/**
 * One 301 per duplicate URL form (audit FIX-018):
 * - /page/N/ on the front page and the static Calculators / Guides hubs,
 *   which have no second page;
 * - paths with capital letters, which WordPress otherwise serves as 200.
 */
function cmc_redirect_duplicate_urls() {
	if ( is_admin() || ! isset( $_SERVER['REQUEST_URI'] ) ) {
		return;
	}
	$uri   = wp_unslash( $_SERVER['REQUEST_URI'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$path  = (string) wp_parse_url( $uri, PHP_URL_PATH );
	$query = (string) wp_parse_url( $uri, PHP_URL_QUERY );

	if ( preg_match( '#^/(?:(calculators|guides)/)?page/\d+/?$#', $path, $m ) ) {
		wp_safe_redirect( home_url( empty( $m[1] ) ? '/' : '/' . $m[1] . '/' ), 301 );
		exit;
	}
	if ( preg_match( '/[A-Z]/', $path ) && 0 !== strpos( $path, '/wp-' ) ) {
		wp_safe_redirect( home_url( strtolower( $path ) ) . ( '' !== $query ? '?' . $query : '' ), 301 );
		exit;
	}
}
add_action( 'template_redirect', 'cmc_redirect_duplicate_urls', 0 );

/**
 * Root files the theme looks after, checked once a day (and after each
 * deploy, when the content sync runs):
 * - /favicon.ico (audit FIX-021): browsers and crawlers request it even
 *   though the pages link the site icon, and the server returned 404
 *   because no file existed. Copied from assets/images/favicon.ico.
 * - readme.html and license.txt (audit FIX-019) name the WordPress
 *   version. WordPress puts them back on core updates, hence the daily check.
 */
function cmc_maintain_root_files( $force = false ) {
	if ( ! $force && get_transient( 'cmc_root_files_checked' ) ) {
		return;
	}
	set_transient( 'cmc_root_files_checked', 1, DAY_IN_SECONDS );

	$icon = ABSPATH . 'favicon.ico';
	$src  = CMC_THEME_DIR . '/assets/images/favicon.ico';
	if ( is_readable( $src ) && ( ! file_exists( $icon ) || md5_file( $icon ) !== md5_file( $src ) ) && is_writable( ABSPATH ) ) {
		@copy( $src, $icon ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	}
	foreach ( array( 'readme.html', 'license.txt' ) as $file ) {
		if ( file_exists( ABSPATH . $file ) ) {
			@unlink( ABSPATH . $file ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
		}
	}
}
add_action( 'init', 'cmc_maintain_root_files', 100 );
