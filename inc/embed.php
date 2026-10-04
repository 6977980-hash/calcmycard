<?php
/**
 * Embeddable calculators: /calculators/{slug}/?embed=1 renders just the
 * calculator (no header, footer, or ads) for other sites to show in an
 * iframe, and each calculator page offers the copy-paste embed code. The
 * code carries a plain link to the full calculator page, which is what
 * earns the backlink.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cmc_is_embed_request() {
	return isset( $_GET['embed'] ) && cmc_get_calculator_for_current_page(); // phpcs:ignore WordPress.Security.NonceVerification
}

add_filter( 'template_include', function ( $template ) {
	if ( cmc_is_embed_request() ) {
		header( 'X-Robots-Tag: noindex, follow' );
		return CMC_THEME_DIR . '/embed-calculator.php';
	}
	return $template;
}, 99 );

add_filter( 'wp_robots', function ( $robots ) {
	if ( cmc_is_embed_request() ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}
	return $robots;
}, 99 );

/**
 * The iframe + attribution snippet for a calculator.
 */
function cmc_embed_code( array $calc ) {
	$url = home_url( '/calculators/' . $calc['slug'] . '/' );
	return '<iframe src="' . esc_url( $url . '?embed=1' ) . '" title="' . esc_attr( $calc['title'] ) . '" width="100%" height="720" style="border:1px solid #e2e5ec;border-radius:8px;max-width:760px;" loading="lazy"></iframe>' . "\n"
		. '<p style="font-size:13px;margin:6px 0 0;"><a href="' . esc_url( $url ) . '">' . esc_html( $calc['title'] ) . '</a> by CalcMyCard</p>';
}

/**
 * "Embed this calculator" box on calculator pages.
 */
function cmc_render_embed_box( array $calc ) {
	$id = 'cmc-embed-code-' . $calc['calc_id'];
	?>
	<details class="cmc-embed-box">
		<summary>Embed this calculator on your site</summary>
		<p>Free for blogs, newsletters and community sites. Copy this code into your page's HTML:</p>
		<textarea id="<?php echo esc_attr( $id ); ?>" readonly rows="5" onclick="this.select()"><?php echo esc_textarea( cmc_embed_code( $calc ) ); ?></textarea>
		<button type="button" class="cmc-btn cmc-btn-secondary" onclick="var t=document.getElementById('<?php echo esc_js( $id ); ?>');t.select();if(navigator.clipboard){navigator.clipboard.writeText(t.value);}else{document.execCommand('copy');}this.textContent='Copied';">Copy code</button>
	</details>
	<?php
}
