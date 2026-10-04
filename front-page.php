<?php
/**
 * Homepage: hub for all calculators. Targets the broad "credit card
 * calculators" intent while each individual calculator page targets its own
 * specific primary/long-tail keyword (see inc/data-calculators.php).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
$calculators = cmc_calculators();
$articles    = cmc_articles();
?>

<div class="cmc-page-hero cmc-page-hero--home">
	<div class="cmc-container cmc-hero-grid">
		<div class="cmc-hero-copy">
			<span class="cmc-eyebrow"><?php echo (int) cmc_calculator_count(); ?> Free Tools &middot; No Sign-Up</span>
			<h1>Credit Card Interest &amp; Payoff Calculators</h1>
			<p class="cmc-dek"><?php echo esc_html( cmc_calculator_count_word() ); ?> free calculators to help you estimate what your credit card costs — and how to pay it off faster. Built by Ali Ahmad, with every calculator checked against hand-worked examples and every rule linked to its CFPB, Federal Reserve, or Regulation Z source.</p>
		</div>
		<div class="cmc-hero-art" aria-hidden="true">
			<img src="<?php echo esc_url( CMC_THEME_URI . '/assets/images/hero-calculator.svg' ); ?>" width="480" height="400" alt="" decoding="async" fetchpriority="high" />
		</div>
	</div>
</div>

<div class="cmc-container" style="padding: 10px 0 10px;">
	<?php cmc_render_ad_slot( 'leaderboard', 'Advertisement' ); ?>
</div>

<div class="cmc-container" style="padding-bottom: 20px;">

	<?php
	// Flagship answer box for the site's primary target keyword.
	cmc_render_answer_box(
		'Quick Answer',
		'A credit card interest calculator shows how much of your payment goes to interest versus principal, based on your balance, APR, and payment amount. Many issuers apply a daily periodic rate (your APR &divide; 365) to your average daily balance; most of our calculators use a simplified monthly model (APR &divide; 12), so your statement may differ. Use the <a href="' . esc_url( home_url( '/calculators/credit-card-interest-calculator/' ) ) . '">Credit Card Interest Calculator</a> below to see your estimated interest and payoff results.'
	);
	?>

	<h2>All <?php echo (int) cmc_calculator_count(); ?> Calculators</h2>
	<div class="cmc-hub-grid">
		<?php foreach ( $calculators as $calc ) : ?>
			<div class="cmc-hub-card">
				<h3><a href="<?php echo esc_url( home_url( '/calculators/' . $calc['slug'] . '/' ) ); ?>"><?php echo esc_html( $calc['title'] ); ?></a></h3>
				<p class="cmc-muted"><?php echo esc_html( $calc['dek'] ); ?></p>
				<a class="cmc-hub-cta" href="<?php echo esc_url( home_url( '/calculators/' . $calc['slug'] . '/' ) ); ?>">Open calculator &rarr;</a>
			</div>
		<?php endforeach; ?>
	</div>

	<h2>Popular Guides</h2>
	<div class="cmc-hub-grid">
		<?php
		$featured_slugs = array( 'how-does-credit-card-interest-work', 'how-to-avoid-credit-card-interest', 'average-credit-card-interest-rate-2026', 'pay-in-full-vs-minimum-payment' );
		foreach ( $featured_slugs as $aslug ) :
			$a = cmc_get_article( $aslug );
			if ( ! $a ) {
				continue;
			}
			?>
			<div class="cmc-hub-card">
				<h3><a href="<?php echo esc_url( home_url( '/guides/' . $a['slug'] . '/' ) ); ?>"><?php echo esc_html( $a['title'] ); ?></a></h3>
				<p class="cmc-muted"><?php echo esc_html( ! empty( $a['card_description'] ) ? $a['card_description'] : $a['meta_description'] ); ?></p>
			</div>
		<?php endforeach; ?>
	</div>
	<p><a href="<?php echo esc_url( home_url( '/guides/' ) ); ?>">See all <?php echo (int) count( cmc_articles() ); ?> guides &rarr;</a></p>

	<?php
	cmc_render_faqs( array(
		array(
			'q' => 'Is CalcMyCard actually free to use?',
			'a' => 'Yes. Every calculator on this site is completely free, requires no sign-up, and does not store or transmit the numbers you enter.',
		),
		array(
			'q' => 'How accurate are these calculators?',
			'a' => 'They use clearly disclosed formulas designed for planning estimates. Most payoff and interest calculators use a simplified monthly model (APR ÷ 12), while our Daily Periodic Rate Calculator provides a separate daily-rate estimate. Your actual statement may differ because card issuers can use daily periodic rates, average daily balances, fees, and card-specific terms.',
		),
		array(
			'q' => 'Do you sell my data or require an account?',
			'a' => 'No. There is no account, no login, and no data collection tied to the calculators themselves. See our Privacy Policy for details on site analytics and advertising.',
		),
	), 'Frequently Asked Questions' );

	cmc_render_author_box( 'site' );
	?>
</div>

<?php get_footer(); ?>
