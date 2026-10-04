<?php
/**
 * Template Name: Calculator Page
 *
 * Renders any of the calculator pages. Which calculator, its copy, and
 * its FAQs all come from cmc_calculators() (inc/data-calculators.php),
 * matched by the page's slug — so adding a 13th calculator later only
 * requires a new data entry + JS file, never a new template.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$slug = get_post_field( 'post_name', get_queried_object_id() );
$calc = cmc_get_calculator( $slug );

if ( ! $calc ) {
	// Not a recognized calculator slug — fall back to normal page content.
	while ( have_posts() ) :
		the_post();
		?>
		<div class="cmc-container cmc-content-narrow" style="padding:40px 0;">
			<?php the_content(); ?>
		</div>
		<?php
	endwhile;
	get_footer();
	return;
}

$body           = cmc_get_calculator_body( $slug );
$related_guides = cmc_articles_related_to_calculator( $slug, 3 );
?>

<div class="cmc-page-hero cmc-page-hero--calc">
	<div class="cmc-container">
		<?php cmc_render_breadcrumbs(); ?>
		<span class="cmc-eyebrow">Free Calculator</span>
		<h1><?php echo esc_html( $calc['h1'] ); ?></h1>
		<p class="cmc-dek"><?php echo esc_html( $calc['dek'] ); ?></p>
		<?php cmc_render_updated_line( get_queried_object_id(), 'Built by' ); ?>
	</div>
</div>

<div class="cmc-container cmc-layout">

	<div class="cmc-main-col">

		<?php
		/*
		 * Page structure (same for every calculator):
		 *   H1 (hero) -> calculation-method note -> calculator ->
		 *   Quick Answer -> How the Calculator Works -> Formula -> Example ->
		 *   When the Result May Differ -> next steps (all from the
		 *   /content/calculators/{slug}.html body) -> Related Calculators ->
		 *   FAQ -> disclaimer -> author box -> Related Guides.
		 */
		cmc_render_calc_method_note( $calc['calc_id'] );
		?>

		<!-- Interactive calculator mount point: fully rendered by
		     /assets/js/calculators/<?php echo esc_html( $calc['js'] ); ?> -->
		<div id="cmc-calc-<?php echo esc_attr( $calc['calc_id'] ); ?>"
			 class="cmc-calculator"
			 data-calc="<?php echo esc_attr( $calc['calc_id'] ); ?>"
			 role="region"
			 aria-label="<?php echo esc_attr( $calc['title'] ); ?> tool">
			<noscript>This calculator requires JavaScript. Please enable it in your browser to use the interactive tool.</noscript>
		</div>

		<?php
		$body_html = trim( $body['before'] . $body['after'] );
		if ( '' !== $body_html ) :
			?>
			<div class="cmc-content-narrow cmc-calc-guide"><?php echo wp_kses_post( $body_html ); ?></div>
		<?php endif; ?>

		<?php cmc_render_related_calculators( $calc['related'] ); ?>

		<div class="cmc-content-narrow">
			<?php cmc_render_faqs( $calc['faqs'] ); ?>

			<p class="cmc-disclaimer">This calculator provides estimates for educational purposes only and is not financial, tax, or legal advice. Most results use a simplified monthly-interest model (APR &divide; 12); your card issuer may use a daily periodic rate and average daily balance, plus its own fees and grace period rules, so your actual figures may differ &mdash; always confirm against your official statement.</p>

			<?php
			if ( ! empty( $calc['sources'] ) ) {
				cmc_render_sources( $calc['sources'] );
			}
			cmc_render_embed_box( $calc );
			cmc_render_author_box( 'calculator' );
			?>
		</div>

		<?php if ( ! empty( $related_guides ) ) : ?>
			<?php cmc_render_related_articles( $related_guides ); ?>
		<?php endif; ?>

	</div>

	<aside class="cmc-sidebar">
		<?php cmc_render_ad_slot( 'rectangle', 'Advertisement' ); ?>
		<div class="cmc-related-card">
			<h4 style="margin-top:0;">All <?php echo (int) cmc_calculator_count(); ?> Calculators</h4>
			<p class="cmc-muted" style="font-size:0.85rem;">Explore the full CalcMyCard toolkit.</p>
			<a href="<?php echo esc_url( home_url( '/calculators/' ) ); ?>">Browse all calculators &rarr;</a>
		</div>
		<?php cmc_render_ad_slot( 'rectangle', 'Advertisement' ); ?>
	</aside>

</div>

<?php get_footer(); ?>
