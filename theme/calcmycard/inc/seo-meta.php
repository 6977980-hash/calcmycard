<?php
/**
 * Fallback SEO meta (title, description, canonical, Open Graph) so the site
 * is fully optimized even before an SEO plugin is configured. If RankMath or
 * Yoast is active and has its own title/description set for a page, this
 * backs off and lets the plugin win — no duplicate tags.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cmc_seo_plugin_active() {
	return defined( 'RANK_MATH_VERSION' ) || defined( 'WPSEO_VERSION' );
}

function cmc_current_meta_description() {
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		$calc = cmc_get_calculator( $slug );
		if ( $calc ) {
			return $calc['meta_description'];
		}
		$article = cmc_get_article( $slug );
		if ( $article ) {
			return $article['meta_description'];
		}
	}
	if ( is_front_page() ) {
		return get_bloginfo( 'description' );
	}
	return '';
}

function cmc_current_seo_title() {
	if ( is_page() ) {
		$slug = get_post_field( 'post_name', get_queried_object_id() );
		$calc = cmc_get_calculator( $slug );
		if ( $calc && ! empty( $calc['seo_title'] ) ) {
			return $calc['seo_title'] . ' | ' . get_bloginfo( 'name' );
		}
		$article = cmc_get_article( $slug );
		if ( $article && ! empty( $article['seo_title'] ) ) {
			return $article['seo_title'] . ' | ' . get_bloginfo( 'name' );
		}
	}
	return '';
}

/**
 * Filter the <title> tag (only kicks in when no SEO plugin owns it).
 */
function cmc_filter_document_title( $title ) {
	if ( cmc_seo_plugin_active() ) {
		return $title;
	}
	$custom = cmc_current_seo_title();
	return $custom ? $custom : $title;
}
add_filter( 'pre_get_document_title', 'cmc_filter_document_title', 20 );

/**
 * Meta description + canonical + basic Open Graph/Twitter tags.
 */
function cmc_output_meta_tags() {
	if ( cmc_seo_plugin_active() ) {
		return; // Let RankMath/Yoast own meta + canonical + OG.
	}

	$description = cmc_current_meta_description();
	if ( $description ) {
		printf( '<meta name="description" content="%s" />' . "\n", esc_attr( $description ) );
		printf( '<meta property="og:description" content="%s" />' . "\n", esc_attr( $description ) );
		printf( '<meta name="twitter:description" content="%s" />' . "\n", esc_attr( $description ) );
	}

	$canonical = cmc_current_canonical();
	if ( $canonical ) {
		// Self-referencing canonical on every indexable URL.
		printf( '<link rel="canonical" href="%s" />' . "\n", esc_url( $canonical ) );
	}
	printf( '<meta property="og:type" content="website" />' . "\n" );
	printf( '<meta property="og:site_name" content="%s" />' . "\n", esc_attr( get_bloginfo( 'name' ) ) );
	if ( $canonical ) {
		printf( '<meta property="og:url" content="%s" />' . "\n", esc_url( $canonical ) );
	}
	printf( '<meta property="og:image" content="%s" />' . "\n", esc_url( cmc_default_social_image() ) );
	printf( '<meta name="twitter:card" content="summary_large_image" />' . "\n" );
	printf( '<meta name="twitter:image" content="%s" />' . "\n", esc_url( cmc_default_social_image() ) );
	// Robots directives are added through the core wp_robots filter below
	// (not printed here), so there is only ever one robots meta tag.
}
add_action( 'wp_head', 'cmc_output_meta_tags', 2 );

/**
 * Site-wide fallback share image, used for og:image/twitter:image when a
 * page has no featured image of its own (true for every page on this site
 * today, since none have featured images set).
 */
function cmc_default_social_image() {
	return get_template_directory_uri() . '/assets/images/social-share-default.png';
}

/**
 * Is the current request an indexable URL?
 *
 * 404s, internal search results, previews, and feeds are not indexable, so
 * they get no canonical and a noindex robots directive instead.
 */
function cmc_is_indexable_request() {
	if ( is_404() || is_search() || is_preview() || is_feed() || is_attachment() ) {
		return false;
	}
	return true;
}

/**
 * Self-referencing canonical URL for the current request.
 *
 * - Singular pages/posts (every calculator, guide, and static page) use
 *   wp_get_canonical_url(), i.e. the post's own permalink, e.g.
 *   https://calcmycard.com/calculators/credit-card-interest-calculator/
 *   (it also handles multi-page posts correctly).
 * - The front page is always the site root.
 * - Archives/listing pages use their own clean path (paged URLs point to
 *   themselves, e.g. /guides/page/2/).
 * - Query strings (utm_*, fbclid, ?replytocom, etc.) are never included, so
 *   tracking variants consolidate onto the clean URL.
 *
 * Returns '' for non-indexable requests.
 */
function cmc_current_canonical() {
	if ( ! cmc_is_indexable_request() ) {
		return '';
	}

	if ( is_front_page() ) {
		$paged = max( 1, (int) get_query_var( 'paged' ), (int) get_query_var( 'page' ) );
		return $paged > 1 ? get_pagenum_link( $paged, false ) : home_url( '/' );
	}

	if ( is_singular() ) {
		$url = wp_get_canonical_url( get_queried_object_id() );
		if ( $url ) {
			return $url;
		}
	}

	global $wp;
	$path = isset( $wp->request ) ? trim( $wp->request, '/' ) : '';
	return '' === $path ? home_url( '/' ) : home_url( user_trailingslashit( $path ) );
}

/**
 * Remove WordPress core's own rel=canonical (printed on singular pages) when
 * the theme is outputting it, so each page has exactly one canonical tag.
 * If RankMath/Yoast is active they handle this themselves.
 */
function cmc_remove_core_canonical() {
	if ( ! cmc_seo_plugin_active() ) {
		remove_action( 'wp_head', 'rel_canonical' );
	}
}
add_action( 'after_setup_theme', 'cmc_remove_core_canonical' );

/**
 * Robots directives via core's wp_robots API (WordPress 5.7+), so they merge
 * with core's own (e.g. the "discourage search engines" setting) instead of
 * producing a second robots tag. Core already adds max-image-preview:large on
 * public sites and noindex on search results; this adds noindex for the
 * other non-indexable requests (404s, previews, attachments).
 */
function cmc_filter_wp_robots( $robots ) {
	if ( cmc_seo_plugin_active() ) {
		return $robots;
	}
	if ( ! cmc_is_indexable_request() ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
		unset( $robots['max-image-preview'] );
	}
	return $robots;
}
add_filter( 'wp_robots', 'cmc_filter_wp_robots' );
