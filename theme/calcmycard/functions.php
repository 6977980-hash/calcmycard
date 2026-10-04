<?php
/**
 * CalcMyCard theme functions.
 *
 * A lightweight, dependency-light WordPress theme built specifically for a
 * credit-card-calculator authority site: fast, schema-rich, AEO/GEO-friendly,
 * and AdSense-layout-ready.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CMC_THEME_VERSION', '1.0.10' );
define( 'CMC_THEME_DIR', get_template_directory() );
define( 'CMC_THEME_URI', get_template_directory_uri() );

/**
 * Theme setup.
 */
function cmc_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array(
		'height'      => 80,
		'width'       => 240,
		'flex-height' => true,
		'flex-width'  => true,
	) );
	add_theme_support( 'responsive-embeds' );

	register_nav_menus( array(
		'primary' => __( 'Primary Menu', 'calcmycard' ),
		'footer'  => __( 'Footer Menu', 'calcmycard' ),
	) );
}
add_action( 'after_setup_theme', 'cmc_setup' );

/**
 * Assets.
 */
function cmc_enqueue_assets() {
	wp_enqueue_style( 'cmc-style', get_stylesheet_uri(), array(), CMC_THEME_VERSION );
	wp_enqueue_script( 'cmc-main', CMC_THEME_URI . '/assets/js/main.js', array(), CMC_THEME_VERSION, true );

	// Shared finance engine + chart helper load site-wide but are tiny (no external CDN dependency).
	wp_enqueue_script( 'cmc-finance-math', CMC_THEME_URI . '/assets/js/finance-math.js', array(), CMC_THEME_VERSION, true );
	wp_enqueue_script( 'cmc-chart', CMC_THEME_URI . '/assets/js/chart-helper.js', array( 'cmc-finance-math' ), CMC_THEME_VERSION, true );
	wp_enqueue_script( 'cmc-ui', CMC_THEME_URI . '/assets/js/ui-helper.js', array( 'cmc-finance-math' ), CMC_THEME_VERSION, true );

	// Per-page calculator script, only on pages that declare a calc id via page meta.
	$calc = cmc_get_calculator_for_current_page();
	if ( $calc && ! empty( $calc['js'] ) ) {
		$path = CMC_THEME_DIR . '/assets/js/calculators/' . $calc['js'];
		if ( file_exists( $path ) ) {
			wp_enqueue_script(
				'cmc-calc-' . $calc['calc_id'],
				CMC_THEME_URI . '/assets/js/calculators/' . $calc['js'],
				array( 'cmc-finance-math', 'cmc-chart', 'cmc-ui' ),
				CMC_THEME_VERSION,
				true
			);
		}
	}
}
add_action( 'wp_enqueue_scripts', 'cmc_enqueue_assets' );

/** Includes */
require_once CMC_THEME_DIR . '/inc/data-calculators.php';
require_once CMC_THEME_DIR . '/inc/data-articles.php';
require_once CMC_THEME_DIR . '/inc/schema.php';
require_once CMC_THEME_DIR . '/inc/seo-meta.php';
require_once CMC_THEME_DIR . '/inc/breadcrumbs.php';
require_once CMC_THEME_DIR . '/inc/helpers.php';
require_once CMC_THEME_DIR . '/inc/hardening.php';

/**
 * Register the "Calculator Page" and "Article Page" templates so editors can
 * assign them from Page Attributes even without touching code.
 */
function cmc_register_page_templates( $templates ) {
	$templates['page-calculator.php'] = __( 'Calculator Page', 'calcmycard' );
	$templates['page-hub.php']        = __( 'Calculators Hub', 'calcmycard' );
	return $templates;
}
add_filter( 'theme_page_templates', 'cmc_register_page_templates' );

/**
 * Widget areas (sidebar ad slots, footer).
 */
function cmc_widgets_init() {
	register_sidebar( array(
		'name'          => __( 'Sidebar', 'calcmycard' ),
		'id'            => 'sidebar-1',
		'before_widget' => '<div class="cmc-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h4>',
		'after_title'   => '</h4>',
	) );
}
add_action( 'widgets_init', 'cmc_widgets_init' );

/**
 * Performance: drop emoji scripts, block-library CSS on non-block pages, and
 * unnecessary generator meta tags — small Core Web Vitals wins.
 */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );

/**
 * AdSense / ads.txt friendliness: expose a filter so the site owner can drop
 * their publisher snippet in one place (Appearance > Theme File Editor is not
 * required — see readme for the recommended "Insert Headers and Footers"
 * plugin approach instead of editing this file directly).
 */
function cmc_head_ad_snippet() {
	$snippet = apply_filters( 'cmc_adsense_head_snippet', '' );
	if ( $snippet ) {
		echo $snippet; // phpcs:ignore -- site owner controlled, trusted filter.
	}
}
add_action( 'wp_head', 'cmc_head_ad_snippet', 1 );

/**
 * Hide WordPress core's built-in "Tools > Import" screen from the admin
 * menu. This site never needs it (Blogger/LiveJournal/RSS/etc. migration
 * importers) — all content comes from the "CalcMyCard Import" tool right
 * above it in the same Tools menu — and the two looking similar in the menu
 * has caused real mix-ups (clicking the wrong "Import"). This only hides
 * the menu item/page for logged-in admins; it does not touch, disable, or
 * conflict with the CalcMyCard Import plugin in any way — they are
 * completely separate tools that never call each other's code.
 */
add_action( 'admin_menu', function () {
	remove_submenu_page( 'tools.php', 'import.php' );
}, 999 );
