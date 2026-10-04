<?php
/**
 * Template Name: Article Page
 *
 * Renders any of the SEO/AEO guide articles. Copy comes from
 * /content/articles/{slug}.html; metadata (title, meta description, related
 * calculators) comes from cmc_articles() (inc/data-articles.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

$slug    = get_post_field( 'post_name', get_queried_object_id() );
$article = cmc_get_article( $slug );

if ( ! $article ) {
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

$body = cmc_get_article_body( $slug );
?>

<div class="cmc-page-hero">
	<div class="cmc-container">
		<?php cmc_render_breadcrumbs(); ?>
		<span class="cmc-eyebrow">Guide</span>
		<h1><?php echo esc_html( $article['title'] ); ?></h1>
		<?php cmc_render_updated_line( get_queried_object_id(), 'By' ); ?>
	</div>
</div>

<div class="cmc-container cmc-layout">

	<div class="cmc-main-col">
		<div class="cmc-content-narrow">
			<?php cmc_render_ad_slot( 'leaderboard', 'Advertisement' ); ?>

			<?php echo wp_kses_post( $body ); ?>

			<p class="cmc-disclaimer">This article is for general educational purposes and is not financial advice. Rates and figures cited reflect industry data available at the time of writing and can change.</p>

			<?php
			if ( ! empty( $article['sources'] ) ) {
				cmc_render_sources( $article['sources'] );
			}
			cmc_render_author_box( 'guide' );
			?>
		</div>

		<?php cmc_render_related_calculators( $article['related_calculators'], 'Try These Calculators' ); ?>
		<?php
		$more_guides = cmc_articles_related_to_article( $slug, 3 );
		if ( $more_guides ) {
			cmc_render_related_articles( $more_guides, 'Related Guides' );
		}
		?>
	</div>

	<aside class="cmc-sidebar">
		<?php cmc_render_ad_slot( 'rectangle', 'Advertisement' ); ?>
		<div class="cmc-related-card">
			<h4 style="margin-top:0;">More Guides</h4>
			<a href="<?php echo esc_url( home_url( '/guides/' ) ); ?>">Browse all guides &rarr;</a>
		</div>
	</aside>

</div>

<?php get_footer(); ?>
