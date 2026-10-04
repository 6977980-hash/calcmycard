<?php
/**
 * Plugin Name:       CalcMyCard Content Importer
 * Plugin URI:        https://calcmycard.com
 * Description:       Imports posts and pages from JSON or CSV, with SEO title, meta description, focus keyword and FAQ schema (Yoast / Rank Math aware).
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            CalcMyCard
 * License:           GPL-2.0-or-later
 * Text Domain:       calcmycard-content-importer
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CMCI_VERSION', '1.0.0' );
define( 'CMCI_DIR', plugin_dir_path( __FILE__ ) );

require_once CMCI_DIR . 'includes/class-cmci-importer.php';
require_once CMCI_DIR . 'includes/class-cmci-admin.php';
require_once CMCI_DIR . 'includes/class-cmci-schema.php';

add_action( 'plugins_loaded', function () {
	if ( is_admin() ) {
		new CMCI_Admin();
	}
	new CMCI_Schema();
} );
