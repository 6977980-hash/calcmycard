<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
</main><!-- #cmc-main -->

<footer class="cmc-site-footer">
	<div class="cmc-container">
		<div class="cmc-footer-grid">
			<div>
				<h4><?php bloginfo( 'name' ); ?></h4>
				<p class="cmc-muted" style="max-width:320px;">Free, independent credit card calculators and guides. We are not a card issuer, lender, credit union, or financial adviser — just tested tools and plain-English explanations.</p>
			</div>
			<div>
				<h4>Calculators</h4>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/calculators/credit-card-interest-calculator/' ) ); ?>">Interest Calculator</a></li>
					<li><a href="<?php echo esc_url( home_url( '/calculators/credit-card-payoff-calculator/' ) ); ?>">Payoff Calculator</a></li>
					<li><a href="<?php echo esc_url( home_url( '/calculators/minimum-payment-calculator/' ) ); ?>">Minimum Payment</a></li>
					<li><a href="<?php echo esc_url( home_url( '/calculators/' ) ); ?>">All 12 Calculators &rarr;</a></li>
				</ul>
			</div>
			<div>
				<h4>Guides</h4>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/guides/how-does-credit-card-interest-work/' ) ); ?>">How Interest Works</a></li>
					<li><a href="<?php echo esc_url( home_url( '/guides/how-to-avoid-credit-card-interest/' ) ); ?>">How to Avoid Interest</a></li>
					<li><a href="<?php echo esc_url( home_url( '/guides/' ) ); ?>">All Guides &rarr;</a></li>
				</ul>
			</div>
			<div>
				<h4>Company</h4>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About Us</a></li>
					<li><a href="<?php echo esc_url( home_url( '/editorial-policy/' ) ); ?>">Editorial Policy</a></li>
					<li><a href="<?php echo esc_url( home_url( '/methodology/' ) ); ?>">Methodology</a></li>
					<li><a href="<?php echo esc_url( home_url( '/privacy-policy/' ) ); ?>">Privacy Policy</a></li>
					<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
				</ul>
			</div>
		</div>
		<div class="cmc-footer-bottom">
			<span>&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>. All calculations are estimates for educational purposes and are not financial advice.</span>
			<span>Built and maintained by <a href="<?php echo esc_url( home_url( '/about/#ali-ahmad' ) ); ?>">Ali Ahmad</a>.</span>
		</div>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
