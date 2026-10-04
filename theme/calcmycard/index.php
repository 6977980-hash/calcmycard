<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
get_header();
?>
<div class="cmc-container cmc-content-narrow" style="padding: 30px 0 60px;">
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : the_post(); ?>
			<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
			<?php the_excerpt(); ?>
		<?php endwhile; ?>
	<?php else : ?>
		<p>Nothing found.</p>
	<?php endif; ?>
</div>
<?php get_footer(); ?>
