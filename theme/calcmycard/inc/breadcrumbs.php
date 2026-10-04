<?php
/**
 * Simple breadcrumb trail — used both for on-page display and for
 * BreadcrumbList schema (see inc/schema.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Calculator: Home > Calculators > {Calculator title}
 * Guide:      Home > Guides > {Guide title, or its short 'breadcrumb' label}
 * Other page: Home > {Page title}
 */
function cmc_get_breadcrumb_trail() {
	$trail = array(
		array( 'label' => 'Home', 'url' => home_url( '/' ) ),
	);

	if ( ! is_page() ) {
		return $trail;
	}

	$slug = get_post_field( 'post_name', get_queried_object_id() );
	$calc = cmc_get_calculator( $slug );
	$article = $calc ? null : cmc_get_article( $slug );

	if ( $calc ) {
		$trail[] = array( 'label' => 'Calculators', 'url' => home_url( '/calculators/' ) );
		$trail[] = array( 'label' => $calc['title'], 'url' => get_permalink() );
	} elseif ( $article ) {
		$trail[] = array( 'label' => 'Guides', 'url' => home_url( '/guides/' ) );
		$trail[] = array( 'label' => ! empty( $article['breadcrumb'] ) ? $article['breadcrumb'] : $article['title'], 'url' => get_permalink() );
	} else {
		$trail[] = array( 'label' => get_the_title(), 'url' => get_permalink() );
	}

	return $trail;
}

function cmc_render_breadcrumbs() {
	$trail = cmc_get_breadcrumb_trail();
	if ( count( $trail ) < 2 ) {
		return;
	}
	echo '<nav class="cmc-breadcrumbs" aria-label="Breadcrumb">';
	$parts = array();
	foreach ( $trail as $i => $crumb ) {
		if ( $i === count( $trail ) - 1 ) {
			$parts[] = '<span aria-current="page">' . esc_html( $crumb['label'] ) . '</span>';
		} else {
			$parts[] = '<a href="' . esc_url( $crumb['url'] ) . '">' . esc_html( $crumb['label'] ) . '</a>';
		}
	}
	echo implode( ' &rsaquo; ', $parts );
	echo '</nav>';
}
