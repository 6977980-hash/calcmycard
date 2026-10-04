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
	$lines[] = '';

	status_header( 200 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'X-Robots-Tag: noindex' );
	echo implode( "\n", $lines ); // phpcs:ignore WordPress.Security.EscapeOutput -- plain text built from theme data.
	exit;
}
add_action( 'parse_request', 'cmc_llms_txt', 0 );
