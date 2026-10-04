<?php
/**
 * One-time content sync between the theme's data files and the database.
 *
 * Calculator and guide copy lives in the theme, but a few things only exist
 * in the database: the WordPress page itself, its Rank Math title and
 * description, and the body of plain pages like Methodology and About. When
 * CMC_CONTENT_SYNC changes, the next request:
 *
 * - creates any calculator page from cmc_calculators() that doesn't exist
 *   yet (published under /calculators/ with the Calculator Page template);
 * - copies seo_title / meta_description / target_keyword from the data
 *   files into each calculator and guide page's Rank Math fields;
 * - applies the text replacements listed in cmc_content_sync_replacements().
 *
 * Bump CMC_CONTENT_SYNC whenever any of the above should run again.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CMC_CONTENT_SYNC', '2026-10-04.1' );

function cmc_maybe_sync_content() {
	if ( get_option( 'cmc_content_sync' ) === CMC_CONTENT_SYNC ) {
		return;
	}
	if ( get_transient( 'cmc_content_sync_lock' ) ) {
		return;
	}
	set_transient( 'cmc_content_sync_lock', 1, 5 * MINUTE_IN_SECONDS );

	cmc_sync_calculator_pages();
	cmc_sync_seo_meta();
	cmc_sync_page_text();

	update_option( 'cmc_content_sync', CMC_CONTENT_SYNC );
	delete_transient( 'cmc_content_sync_lock' );

	// Purge LiteSpeed so the new titles and pages show at once.
	do_action( 'litespeed_purge_all' );
}
add_action( 'init', 'cmc_maybe_sync_content', 99 );

/**
 * Create missing calculator pages under /calculators/.
 */
function cmc_sync_calculator_pages() {
	$parent = get_page_by_path( 'calculators' );
	if ( ! $parent ) {
		return;
	}

	$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'orderby' => 'ID', 'fields' => 'ID' ) );
	$author = $admins ? (int) $admins[0] : (int) $parent->post_author;

	foreach ( cmc_calculators() as $calc ) {
		if ( get_page_by_path( 'calculators/' . $calc['slug'] ) ) {
			continue;
		}
		$id = wp_insert_post( array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $calc['title'],
			'post_name'    => $calc['slug'],
			'post_parent'  => $parent->ID,
			'post_author'  => $author,
			'post_content' => '',
			'post_excerpt' => $calc['meta_description'],
			'menu_order'   => 0,
		) );
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_wp_page_template', 'page-calculator.php' );
		}
	}
}

/**
 * Rank Math title, description and focus keyword from the data files.
 */
function cmc_sync_seo_meta() {
	$sets = array(
		'calculators' => cmc_calculators(),
		'guides'      => cmc_articles(),
	);
	foreach ( $sets as $section => $items ) {
		foreach ( $items as $item ) {
			$page = get_page_by_path( $section . '/' . $item['slug'] );
			if ( ! $page ) {
				continue;
			}
			if ( ! empty( $item['seo_title'] ) ) {
				update_post_meta( $page->ID, 'rank_math_title', $item['seo_title'] );
			}
			if ( ! empty( $item['meta_description'] ) ) {
				update_post_meta( $page->ID, 'rank_math_description', $item['meta_description'] );
			}
			if ( ! empty( $item['target_keyword'] ) && ! get_post_meta( $page->ID, 'rank_math_focus_keyword', true ) ) {
				update_post_meta( $page->ID, 'rank_math_focus_keyword', $item['target_keyword'] );
			}
		}
	}
}

/**
 * Exact text replacements in database-only pages, by page path.
 * A replacement is skipped if its old text isn't found, so a page edited
 * by hand is never mangled.
 */
function cmc_content_sync_replacements() {
	return array(
		'methodology' => array(
			'The same disclosure appears above every calculator on the site.' => 'The same disclosure appears above every interest and payoff calculator on the site.',
			'for anyone who wants that more granular figure.'                 => 'for anyone who wants that more granular figure. The <a href="/calculators/cash-advance-calculator/">Cash Advance Calculator</a> also uses simple daily interest (APR &divide; 365), because a cash advance starts accruing interest the day you take it.',
			'It covers all 12 calculators with 66 test cases,'               => 'It covers the original 12 calculators with 66 test cases,',
		),
		'about'       => array(
			'The suite has 66 test cases covering all 12 calculators,' => 'The suite has 66 test cases covering the original 12 calculators,',
		),
	);
}

function cmc_sync_page_text() {
	foreach ( cmc_content_sync_replacements() as $path => $pairs ) {
		$page = get_page_by_path( $path );
		if ( ! $page ) {
			continue;
		}
		$content = $page->post_content;
		foreach ( $pairs as $old => $new ) {
			if ( false !== strpos( $content, $old ) && false === strpos( $content, $new ) ) {
				$content = str_replace( $old, $new, $content );
			}
		}
		if ( $content !== $page->post_content ) {
			// Runs on a visitor's request, so keep kses from re-filtering markup the admin saved.
			kses_remove_filters();
			wp_update_post( array( 'ID' => $page->ID, 'post_content' => $content ) );
			kses_init();
		}
	}
}
