<?php
/**
 * Template Name: Calculators Hub
 *
 * Reused for both the /calculators/ index (lists all 12 tools) and the
 * /guides/ index (lists all 15 articles), decided by the page slug.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
$slug    = get_post_field( 'post_name', get_queried_object_id() );
$is_guides = ( 'guides' === $slug );
?>

<div class="cmc-page-hero">
	<div class="cmc-container">
		<?php cmc_render_breadcrumbs(); ?>
		<h1><?php echo $is_guides ? 'Credit Card Guides' : 'All Credit Card Calculators'; ?></h1>
		<p class="cmc-dek">
			<?php echo $is_guides
				? 'Plain-English answers to the questions people search most about credit card interest, payoff strategy, and APR.'
				: cmc_calculator_count_word() . ' free calculators covering every stage of paying down (or avoiding) credit card interest.'; ?>
		</p>
	</div>
</div>

<div class="cmc-container" style="padding: 30px 0 60px;">
	<?php if ( $is_guides ) : ?>
		<div class="cmc-hub-grid">
			<?php foreach ( cmc_articles() as $a ) : ?>
				<div class="cmc-hub-card">
					<h3><a href="<?php echo esc_url( home_url( '/guides/' . $a['slug'] . '/' ) ); ?>"><?php echo esc_html( $a['title'] ); ?></a></h3>
					<p class="cmc-muted"><?php echo esc_html( ! empty( $a['card_description'] ) ? $a['card_description'] : $a['meta_description'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	<?php else : ?>
		<div class="cmc-hub-grid">
			<?php foreach ( cmc_calculators() as $c ) : ?>
				<div class="cmc-hub-card">
					<h3><a href="<?php echo esc_url( home_url( '/calculators/' . $c['slug'] . '/' ) ); ?>"><?php echo esc_html( $c['title'] ); ?></a></h3>
					<p class="cmc-muted"><?php echo esc_html( $c['dek'] ); ?></p>
					<a class="cmc-hub-cta" href="<?php echo esc_url( home_url( '/calculators/' . $c['slug'] . '/' ) ); ?>">Open calculator &rarr;</a>
				</div>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>
</div>

<?php get_footer(); ?>
