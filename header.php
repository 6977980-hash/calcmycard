<?php
/**
 * Theme header: skip link, sticky nav, and a leaderboard ad slot placed
 * below the nav (a common AdSense-approved placement that doesn't hurt
 * Core Web Vitals since it's not render-blocking above the fold content).
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="cmc-skip-link" href="#cmc-main">Skip to content</a>

<header class="cmc-site-header">
	<div class="cmc-container cmc-header-inner">
		<?php if ( has_custom_logo() ) : ?>
			<div class="cmc-logo cmc-logo--custom">
				<?php the_custom_logo(); ?>
			</div>
		<?php else : ?>
			<a class="cmc-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
				<span class="cmc-logo-mark" aria-hidden="true">&#36;</span>
				<span><?php bloginfo( 'name' ); ?></span>
			</a>
		<?php endif; ?>

		<button class="cmc-nav-toggle" aria-expanded="false" aria-controls="cmc-primary-nav" id="cmc-nav-toggle" aria-label="Toggle navigation menu">
			<span aria-hidden="true">&#9776;</span>
		</button>

		<nav class="cmc-primary-nav" id="cmc-primary-nav" aria-label="Primary">
			<?php
			if ( has_nav_menu( 'primary' ) ) {
				wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false ) );
			} else {
				cmc_primary_nav_fallback();
			}
			?>
		</nav>
	</div>
</header>

<main id="cmc-main">
