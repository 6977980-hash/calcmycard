<?php
/**
 * Bare calculator for iframes (?embed=1): the tool and a link back to the
 * full page, nothing else. See inc/embed.php.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$calc = cmc_get_calculator_for_current_page();
$url  = home_url( '/calculators/' . $calc['slug'] . '/' );
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'cmc-embed' ); ?>>
	<main class="cmc-embed-main">
		<h1 class="cmc-embed-title"><?php echo esc_html( $calc['h1'] ); ?></h1>
		<div id="cmc-calc-<?php echo esc_attr( $calc['calc_id'] ); ?>"
			 class="cmc-calculator"
			 data-calc="<?php echo esc_attr( $calc['calc_id'] ); ?>"
			 role="region"
			 aria-label="<?php echo esc_attr( $calc['title'] ); ?> tool">
			<noscript>This calculator requires JavaScript.</noscript>
		</div>
		<p class="cmc-embed-credit">Estimates only. <a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener">Full calculator, formula and FAQs at CalcMyCard &rarr;</a></p>
	</main>
	<?php wp_footer(); ?>
</body>
</html>
