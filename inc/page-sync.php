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
 * - applies the text replacements listed in cmc_content_sync_replacements();
 * - renames or unpublishes pages listed in cmc_moved_pages(), whose old
 *   URLs then 301 to the new ones (cmc_redirect_moved_pages()).
 *
 * Bump CMC_CONTENT_SYNC whenever any of the above should run again.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CMC_CONTENT_SYNC', '2026-10-10.1' );

function cmc_maybe_sync_content() {
	if ( get_option( 'cmc_content_sync' ) === CMC_CONTENT_SYNC ) {
		return;
	}
	if ( get_transient( 'cmc_content_sync_lock' ) ) {
		return;
	}
	set_transient( 'cmc_content_sync_lock', 1, 5 * MINUTE_IN_SECONDS );

	cmc_sync_moved_pages();
	cmc_sync_calculator_pages();
	cmc_sync_guide_pages();
	cmc_sync_seo_meta();
	cmc_sync_page_text();
	cmc_sync_calculator_count_text();

	update_option( 'cmc_content_sync', CMC_CONTENT_SYNC );
	delete_transient( 'cmc_content_sync_lock' );

	cmc_purge_page_cache();
}

/**
 * Purge LiteSpeed's cached copy of every published page so new titles and
 * text show at once. Deliberately not 'litespeed_purge_all': that also
 * flushes the object cache, which logged Rank Math out after every deploy.
 */
function cmc_purge_page_cache() {
	$ids = get_posts( array(
		'post_type'      => array( 'page', 'post' ),
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	) );
	foreach ( $ids as $id ) {
		do_action( 'litespeed_purge_post', $id );
	}
	do_action( 'litespeed_purge_url', home_url( '/' ) );
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
			// Set the focus keyword when empty, or when it still holds the old
			// target of a page we deliberately retargeted (a hand-set keyword
			// is left alone).
			$focus   = get_post_meta( $page->ID, 'rank_math_focus_keyword', true );
			$retired = cmc_retired_keywords();
			if ( ! empty( $item['target_keyword'] ) && ( ! $focus || in_array( $focus, $retired, true ) ) && $focus !== $item['target_keyword'] ) {
				update_post_meta( $page->ID, 'rank_math_focus_keyword', $item['target_keyword'] );
			}
			// Keep the WordPress page title (admin lists, fallbacks) in step
			// with the data file's title.
			if ( in_array( $item['slug'], array_keys( $retired ), true ) && $page->post_title !== $item['title'] ) {
				wp_update_post( array( 'ID' => $page->ID, 'post_title' => $item['title'] ) );
			}
		}
	}
}

/**
 * Pages retargeted after the GSC review of 2026-10-04: slug => old target
 * keyword. Their focus keyword and page title follow the data files.
 */
function cmc_retired_keywords() {
	return array(
		'daily-periodic-rate-calculator'     => 'daily periodic rate calculator',
		'how-does-credit-card-interest-work' => 'how does credit card interest work example',
		'credit-card-grace-period-explained' => 'credit card grace period explained',
	);
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
			'In practice, each calculator takes a monthly rate'              => 'In practice, each interest and payoff calculator takes a monthly rate',
			'because a cash advance starts accruing interest the day you take it.' => 'because a cash advance starts accruing interest the day you take it. The <a href="/calculators/credit-card-interest-charge-checker/">Interest Charge Checker</a> uses the same daily method to check a statement, and the <a href="/calculators/biweekly-payment-calculator/">Bi-Weekly Payment Calculator</a> charges APR &times; 14 &divide; 365 for each two-week period.',
			'It covers the original 12 calculators with 66 test cases,'      => 'It covers the site\'s original 12 calculators with 66 test cases (calculators added since launch, such as the Cash Advance, Bi-Weekly Payment and Interest Charge Checker tools, are checked against the hand-worked examples on their own pages),',
		),
		'about'       => array(
			'The suite has 66 test cases covering all 12 calculators,' => 'The suite has 66 test cases covering the original 12 calculators,',
			'Every calculator is checked with an automated test suite that loads' => 'The original calculators are checked with an automated test suite that loads',
			'The suite has 66 test cases covering the original 12 calculators,' => 'Calculators added since launch (Cash Advance, Bi-Weekly Payment and Interest Charge Checker) are checked against the hand-worked examples on their own pages. The suite has 66 test cases covering the site\'s original 12 calculators (Payoff Time has since been merged into the Payoff Calculator),',
			'(Cash Advance, Bi-Weekly Payment and Interest Charge Checker) are checked' => '(Cash Advance, Bi-Weekly Payment, Interest Charge Checker and Fed Rate Change) are checked',
		),
		'editorial-policy' => array(
			'an automated test suite runs every calculator in a real browser and compares its output with hand-worked examples and an independent reference implementation,' => 'every calculator\'s output is compared with hand-worked examples, and the original calculators are also run by an automated test suite in a real browser against an independent reference implementation,',
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

/**
 * Pages whose URL changed. 'to' => null means the page was merged into
 * another and is unpublished; otherwise it is renamed to the new slug.
 * Every 'from' path 301s to 'redirect'.
 */
function cmc_moved_pages() {
	return array(
		array(
			'from'     => 'calculators/payoff-time-calculator',
			'to'       => null,
			'redirect' => '/calculators/credit-card-payoff-calculator/',
		),
		array(
			'from'     => 'guides/credit-card-interest-calculator-for-multiple-cards',
			'to'       => 'total-interest-multiple-credit-cards',
			'redirect' => '/guides/total-interest-multiple-credit-cards/',
		),
	);
}

function cmc_sync_moved_pages() {
	foreach ( cmc_moved_pages() as $move ) {
		$page = get_page_by_path( $move['from'] );
		if ( ! $page ) {
			continue;
		}
		if ( null === $move['to'] ) {
			wp_update_post( array( 'ID' => $page->ID, 'post_status' => 'draft' ) );
		} else {
			wp_update_post( array( 'ID' => $page->ID, 'post_name' => $move['to'] ) );
		}
	}
}

function cmc_redirect_moved_pages() {
	$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$path = trim( (string) $path, '/' );
	foreach ( cmc_moved_pages() as $move ) {
		if ( $path === $move['from'] ) {
			wp_safe_redirect( home_url( $move['redirect'] ), 301 );
			exit;
		}
	}
}
add_action( 'template_redirect', 'cmc_redirect_moved_pages', 0 );

/**
 * Create missing guide pages under /guides/.
 */
function cmc_sync_guide_pages() {
	$parent = get_page_by_path( 'guides' );
	if ( ! $parent ) {
		return;
	}
	foreach ( cmc_articles() as $article ) {
		if ( get_page_by_path( 'guides/' . $article['slug'] ) ) {
			continue;
		}
		$id = wp_insert_post( array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $article['title'],
			'post_name'    => $article['slug'],
			'post_parent'  => $parent->ID,
			'post_author'  => (int) $parent->post_author,
			'post_content' => '',
			'post_excerpt' => $article['meta_description'],
		) );
		if ( $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_wp_page_template', 'page-article.php' );
		}
	}
}

/**
 * Keep "Twelve free credit card calculators"-style counts in the Rank Math
 * home and hub descriptions and the site tagline in step with
 * cmc_calculators().
 */
function cmc_sync_calculator_count_text() {
	$word    = cmc_calculator_count_word();
	$pattern = '/\\b(?:Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty|\\d+)(?= free (?:credit card )?calculators)/';
	$fix     = function ( $text ) use ( $pattern, $word ) {
		return is_string( $text ) ? preg_replace( $pattern, $word, $text ) : $text;
	};

	$titles = get_option( 'rank-math-options-titles' );
	if ( is_array( $titles ) && isset( $titles['homepage_description'] ) ) {
		$new = $fix( $titles['homepage_description'] );
		if ( $new !== $titles['homepage_description'] ) {
			$titles['homepage_description'] = $new;
			update_option( 'rank-math-options-titles', $titles );
		}
	}

	$tagline = get_option( 'blogdescription' );
	if ( $fix( $tagline ) !== $tagline ) {
		update_option( 'blogdescription', $fix( $tagline ) );
	}

	foreach ( array( 'calculators', '' ) as $path ) {
		$page = '' === $path ? get_post( (int) get_option( 'page_on_front' ) ) : get_page_by_path( $path );
		if ( ! $page ) {
			continue;
		}
		$desc = get_post_meta( $page->ID, 'rank_math_description', true );
		if ( $desc && $fix( $desc ) !== $desc ) {
			update_post_meta( $page->ID, 'rank_math_description', $fix( $desc ) );
		}
		// Rank Math falls back to the excerpt when a page has no description.
		if ( $page->post_excerpt && $fix( $page->post_excerpt ) !== $page->post_excerpt ) {
			wp_update_post( array( 'ID' => $page->ID, 'post_excerpt' => $fix( $page->post_excerpt ) ) );
		}
	}
}
