<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<div class="cmc-container cmc-content-narrow" style="padding: 60px 0; text-align:center;">
	<h1>Page Not Found</h1>
	<p class="cmc-muted">The page you're looking for doesn't exist. Try one of our calculators instead:</p>
	<p><a class="cmc-btn" href="<?php echo esc_url( home_url( '/calculators/' ) ); ?>">Browse All Calculators</a></p>
</div>
<?php get_footer(); ?>
