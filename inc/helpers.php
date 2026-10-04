<?php
/**
 * Shared rendering helpers used across page-calculator.php, single.php, and
 * front-page.php: FAQ blocks, related-content modules (internal linking),
 * the author/trust box (E-E-A-T), and small utility functions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Render an FAQ list as accessible markup. The same $faqs array also feeds
 * FAQPage schema in inc/schema.php — one data source, two outputs.
 */
function cmc_render_faqs( array $faqs, $heading = 'Frequently Asked Questions' ) {
	if ( empty( $faqs ) ) {
		return;
	}
	echo '<section class="cmc-faq" aria-label="' . esc_attr( $heading ) . '">';
	echo '<h2>' . esc_html( $heading ) . '</h2>';
	foreach ( $faqs as $faq ) {
		echo '<div class="cmc-faq-item">';
		echo '<h3>' . esc_html( $faq['q'] ) . '</h3>';
		echo '<p>' . wp_kses_post( $faq['a'] ) . '</p>';
		echo '</div>';
	}
	echo '</section>';
}

/**
 * Render the "related calculators" internal-linking module for a calculator
 * page. Every calculator links to 3-4 siblings, and every sibling links
 * back — this is the internal-link mesh the SEO plan calls for.
 */
function cmc_render_related_calculators( array $slugs, $heading = 'Related Calculators' ) {
	if ( empty( $slugs ) ) {
		return;
	}
	echo '<div class="cmc-related">';
	echo '<h2>' . esc_html( $heading ) . '</h2>';
	echo '<div class="cmc-related-grid">';
	foreach ( $slugs as $slug ) {
		$calc = cmc_get_calculator( $slug );
		if ( ! $calc ) {
			continue;
		}
		$url = home_url( '/calculators/' . $slug . '/' );
		echo '<div class="cmc-related-card">';
		echo '<a href="' . esc_url( $url ) . '">' . esc_html( $calc['title'] ) . '</a>';
		echo '<p>' . esc_html( $calc['dek'] ) . '</p>';
		echo '</div>';
	}
	echo '</div></div>';
}

/**
 * Render the "related guides" module on a calculator page, or "related
 * calculators" module on an article page — cross-links content types.
 */
function cmc_render_related_articles( array $slugs, $heading = 'Related Guides' ) {
	if ( empty( $slugs ) ) {
		return;
	}
	echo '<div class="cmc-related">';
	echo '<h2>' . esc_html( $heading ) . '</h2>';
	echo '<div class="cmc-related-grid">';
	foreach ( $slugs as $slug ) {
		$article = cmc_get_article( $slug );
		if ( ! $article ) {
			continue;
		}
		$url = home_url( '/guides/' . $slug . '/' );
		echo '<div class="cmc-related-card">';
		echo '<a href="' . esc_url( $url ) . '">' . esc_html( $article['title'] ) . '</a>';
		echo '<p>' . esc_html( ! empty( $article['card_description'] ) ? $article['card_description'] : $article['meta_description'] ) . '</p>';
		echo '</div>';
	}
	echo '</div></div>';
}

/**
 * Given an article's related_calculators slugs, find calculators whose own
 * related list points back to a topic close to this article, so every
 * article also surfaces the right calculators automatically.
 */
/**
 * Guides related to a guide: other guides that point to at least one of
 * the same calculators (calculator -> guide -> guide -> calculator cluster).
 */
function cmc_articles_related_to_article( $slug, $limit = 3 ) {
	$all  = cmc_articles();
	$self = isset( $all[ $slug ] ) ? $all[ $slug ] : null;
	if ( ! $self ) {
		return array();
	}
	$scored = array();
	foreach ( $all as $other ) {
		if ( $other['slug'] === $slug ) {
			continue;
		}
		$shared = count( array_intersect( $self['related_calculators'], $other['related_calculators'] ) );
		if ( $shared > 0 ) {
			$scored[ $other['slug'] ] = $shared;
		}
	}
	arsort( $scored );
	return array_slice( array_keys( $scored ), 0, $limit );
}

function cmc_articles_related_to_calculator( $calc_slug, $limit = 3 ) {
	$matches = array();
	foreach ( cmc_articles() as $article ) {
		if ( in_array( $calc_slug, $article['related_calculators'], true ) ) {
			$matches[] = $article['slug'];
		}
		if ( count( $matches ) >= $limit ) {
			break;
		}
	}
	return $matches;
}

/**
 * The person behind the site. One place to change it; used by the byline,
 * the author box, the About page anchor, and the Article/WebPage schema.
 * No credentials are claimed beyond what's stated here.
 */
/**
 * How many calculators the site has, as a number and as a capitalized word
 * ("Thirteen"), so copy that mentions the count stays right as tools are added.
 */
function cmc_calculator_count() {
	return count( cmc_calculators() );
}

function cmc_calculator_count_word() {
	$words = array( 'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty' );
	$n     = cmc_calculator_count();
	return isset( $words[ $n ] ) ? $words[ $n ] : (string) $n;
}

function cmc_site_author() {
	return apply_filters( 'cmc_site_author', array(
		'name'     => 'Ali Ahmad',
		'role'     => 'Founder, CalcMyCard',
		'url'      => home_url( '/about/#ali-ahmad' ),
		'linkedin' => 'https://www.linkedin.com/in/ali-ahmad-chaudhry-12777486/',
	) );
}

/**
 * Calculator QA status shown in the author box and on the About /
 * Methodology pages. Update both values whenever the test suite
 * (calcmycard-qa/run.js) is re-run before a release.
 */
function cmc_qa_status() {
	return array(
		'cases'    => 66,
		'last_run' => '2026-09-25',
		// Calculators added after that run: checked against the worked
		// examples on their pages, not yet part of the automated suite.
		'not_in_suite' => array( 'cash-advance-calculator', 'biweekly-payment-calculator', 'credit-card-interest-charge-checker', 'fed-rate-change-credit-card-calculator' ),
	);
}

/**
 * Visible date + byline under the H1. Uses the page's real WordPress
 * publish/modified dates (the same values emitted as datePublished /
 * dateModified in the JSON-LD), and links the byline to the same profile
 * URL used as the schema author URL, so on-page and structured data agree.
 *
 * @param int    $post_id Page ID.
 * @param string $verb    'By' for guides, 'Built by' for calculators.
 */
function cmc_render_updated_line( $post_id, $verb = 'By' ) {
	$published = get_the_date( '', $post_id );
	$modified  = get_the_modified_date( '', $post_id );
	$author    = cmc_site_author();

	echo '<p class="cmc-updated">';
	if ( get_the_modified_date( 'Y-m-d', $post_id ) !== get_the_date( 'Y-m-d', $post_id ) ) {
		echo 'Updated <time datetime="' . esc_attr( get_the_modified_date( 'c', $post_id ) ) . '">' . esc_html( $modified ) . '</time>';
		echo ' &middot; Published <time datetime="' . esc_attr( get_the_date( 'c', $post_id ) ) . '">' . esc_html( $published ) . '</time>';
	} else {
		echo 'Published <time datetime="' . esc_attr( get_the_date( 'c', $post_id ) ) . '">' . esc_html( $published ) . '</time>';
	}
	echo ' &middot; ' . esc_html( $verb ) . ' <a href="' . esc_url( $author['url'] ) . '" rel="author">' . esc_html( $author['name'] ) . '</a>, ' . esc_html( preg_replace( '/,.*$/', '', $author['role'] ) );
	echo '</p>';
}

/**
 * Author / trust box at the bottom of every calculator and guide. States
 * who made the page and how it was checked — nothing more.
 *
 * @param string $kind 'calculator' or 'guide'.
 */
function cmc_render_author_box( $kind = 'guide' ) {
	$author = cmc_site_author();
	$qa     = cmc_qa_status();
	$post_id = get_queried_object_id();
	if ( $post_id ) {
		$date = get_the_modified_date( 'F j, Y', $post_id );
	} else {
		// Front page / archives have no single post: use the most recent
		// update to any published page on the site.
		$last = get_lastpostmodified( 'blog', 'page' );
		$date = $last ? mysql2date( 'F j, Y', $last ) : date_i18n( 'F j, Y', strtotime( $qa['last_run'] ) );
	}

	echo '<div class="cmc-author-box">';
	echo '<div>';
	echo '<h3>About the author: <a href="' . esc_url( $author['url'] ) . '" rel="author">' . esc_html( $author['name'] ) . '</a></h3>';
	echo '<p>' . esc_html( $author['name'] ) . ' is the founder of CalcMyCard. He builds and maintains the calculators and writes the guides on this site. ';
	$slug = $post_id ? get_post_field( 'post_name', $post_id ) : '';
	if ( 'calculator' === $kind && in_array( $slug, $qa['not_in_suite'], true ) ) {
		echo 'This calculator&rsquo;s results were checked against the hand-worked examples on this page before launch on October 4, 2026, including inputs that should trigger its error and warning messages. ';
	} elseif ( 'calculator' === $kind ) {
		echo 'This calculator&rsquo;s math was last checked on ' . esc_html( date_i18n( 'F j, Y', strtotime( $qa['last_run'] ) ) ) . ' against an automated test suite of ' . (int) $qa['cases'] . ' test cases, including edge cases such as 0% APR and payments that don&rsquo;t cover interest. ';
	} elseif ( 'guide' === $kind ) {
		echo 'Facts about credit card rules and rates are checked against the primary sources listed on this page. ';
	} else {
		echo 'Every calculator is checked against hand-worked examples (most also by an automated test suite), and facts in the guides link to their primary sources. ';
	}
	echo 'CalcMyCard is not a lender or financial adviser, and this page is educational, not personalized advice.</p>';
	echo '<p><a href="' . esc_url( $author['linkedin'] ) . '" target="_blank" rel="noopener me">' . esc_html( $author['name'] ) . ' on LinkedIn</a> &middot; <a href="' . esc_url( home_url( '/methodology/' ) ) . '">Methodology</a> &middot; <a href="' . esc_url( home_url( '/editorial-policy/' ) ) . '">Editorial policy</a> ' . ( $date ? '&middot; Last updated ' . esc_html( $date ) . '.' : '' ) . '</p>';
	echo '</div>';
	echo '</div>';
}

/**
 * AEO/GEO "direct answer" box: a short, quotable, extractable answer meant
 * to be the paragraph an AI Overview or answer engine lifts verbatim. Keep
 * these to 2-4 plain sentences with the number/fact stated directly.
 */
function cmc_render_answer_box( $label, $html ) {
	echo '<div class="cmc-answer-box">';
	echo '<span class="cmc-answer-label">' . esc_html( $label ) . '</span>';
	echo '<p>' . wp_kses_post( $html ) . '</p>';
	echo '</div>';
}

function cmc_render_ad_slot( $type = 'rectangle', $label = 'Advertisement' ) {
	// Before AdSense is approved and the publisher snippet is wired up via
	// the cmc_adsense_head_snippet filter, don't show a visible "slot"
	// placeholder to real visitors — an empty dashed box reading "activates
	// after AdSense approval" looks unfinished/broken on a live site. Once
	// the filter returns a real snippet, this renders the actual ad
	// container. Devs/theme builders can still see the visual placeholder
	// by defining CMC_SHOW_AD_PLACEHOLDERS as true (e.g. in a staging
	// wp-config.php) while laying out pages before AdSense is live.
	$adsense_configured = (bool) apply_filters( 'cmc_adsense_head_snippet', '' );
	$show_placeholder    = defined( 'CMC_SHOW_AD_PLACEHOLDERS' ) && CMC_SHOW_AD_PLACEHOLDERS;

	if ( ! $adsense_configured && ! $show_placeholder ) {
		return;
	}

	$class = 'cmc-ad-slot' . ( 'leaderboard' === $type ? ' leaderboard' : '' );
	if ( $adsense_configured ) {
		echo '<div class="' . esc_attr( $class ) . '">' . apply_filters( 'cmc_adsense_slot_' . $type, '', $type ) . '</div>'; // phpcs:ignore -- site owner controlled, trusted filter.
		return;
	}

	echo '<div class="' . esc_attr( $class ) . '" aria-hidden="true">' . esc_html( $label ) . ' — ' . esc_html( ucfirst( $type ) ) . ' slot (activates after AdSense approval)</div>';
}

/**
 * Fallback primary nav if no menu has been assigned in
 * Appearance > Menus yet, so the theme never ships broken navigation.
 */
function cmc_primary_nav_fallback() {
	echo '<ul>';
	echo '<li><a href="' . esc_url( home_url( '/calculators/' ) ) . '">Calculators</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/guides/' ) ) . '">Guides</a></li>';
	echo '<li><a href="' . esc_url( home_url( '/about/' ) ) . '">About</a></li>';
	echo '</ul>';
}

/**
 * Calculation-method disclosure shown directly above every calculator.
 *
 * Keeps the site's methodology statement consistent everywhere: all
 * payoff/interest tools use the simplified monthly model (APR / 12, see
 * assets/js/finance-math.js and /methodology/), while the Daily Periodic
 * Rate tool uses APR / 365 (or 360). The utilization tool involves no
 * interest math, so it gets no note.
 *
 * @param string $calc_id Calculator id from cmc_calculators().
 */
function cmc_render_calc_method_note( $calc_id ) {
	if ( 'utilization' === $calc_id ) {
		return;
	}

	if ( 'interestcheck' === $calc_id ) {
		$text = 'This checker applies simple daily interest (APR &divide; 365, or 360 if selected) to the average daily balance you enter. Issuers often compound daily and may carry several balances at different APRs, so small differences are normal.';
	} elseif ( 'biweekly' === $calc_id ) {
		$text = 'This calculator compares a monthly plan (APR &divide; 12 per month) with a bi-weekly plan (APR &times; 14 &divide; 365 per two weeks). Issuers charge daily interest on your average daily balance, so your actual savings may differ.';
	} elseif ( 'cashadvance' === $calc_id ) {
		$text = 'This calculator applies simple daily interest (cash advance APR &divide; 365) from the day you take the cash, with no grace period and no compounding. Issuers\' exact methods vary (daily compounding, how the fee is billed, payment allocation), so your actual statement may differ.';
	} elseif ( 'dpr' === $calc_id ) {
		$text = 'This calculator applies a daily periodic rate (APR &divide; 365, or 360 if selected) to the average daily balance you enter. Issuers\' exact methods vary (compounding, grace periods, fees), so your actual statement may differ.';
	} else {
		$text = 'This calculator uses a simplified monthly-interest model (APR &divide; 12). Credit-card issuers may calculate interest using daily periodic rates and average daily balances, so your actual statement may differ.';
	}

	echo '<p class="cmc-callout cmc-method-note" role="note"><strong>Calculation method:</strong> '
		. wp_kses_post( $text )
		. ' <a href="' . esc_url( home_url( '/methodology/' ) ) . '">See our methodology</a>.</p>';
}

/* ==========================================================================
   Sources (primary-source citations)
   ========================================================================== */
/**
 * Primary sources cited on CalcMyCard pages.
 *
 * Every factual claim about credit card rules or rates on the site should
 * trace back to one of these primary sources (Federal Reserve, CFPB,
 * Regulation Z, FICO). Pages list the sources they rely on via a 'sources'
 * key in inc/data-calculators.php / inc/data-articles.php, rendered as a
 * "Sources" list by cmc_render_sources().
 *
 * 'checked' is the date the link and the claim it supports were last
 * verified. Update it whenever you re-check a source.
 */

function cmc_sources() {
	return array(
		'fed-g19'           => array(
			'title'     => 'Consumer Credit – G.19 (credit card interest rates, Q2 2026)',
			'publisher' => 'Federal Reserve Board',
			'url'       => 'https://www.federalreserve.gov/releases/g19/current/default.htm',
			'checked'   => '2026-09-25',
		),
		'fed-fomc'          => array(
			'title'     => 'Federal Open Market Committee meeting calendars and statements (September 16, 2026 decision)',
			'publisher' => 'Federal Reserve Board',
			'url'       => 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
			'checked'   => '2026-10-04',
		),
		'cfpb-grace'        => array(
			'title'     => 'What is a grace period for a credit card?',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-grace-period-for-a-credit-card-en-47/',
			'checked'   => '2026-09-25',
		),
		'cfpb-cash-advance' => array(
			'title'     => 'Can I withdraw money from my credit card at an ATM?',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/ask-cfpb/can-i-withdraw-money-from-my-credit-card-at-an-atm-en-34/',
			'checked'   => '2026-09-25',
		),
		'cfpb-deferred'     => array(
			'title'     => 'I got a credit card promising no interest for a purchase if I pay in full within 12 months. How does this work?',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/ask-cfpb/i-got-a-credit-card-promising-no-interest-for-a-purchase-if-i-pay-in-full-within-12-months-how-does-this-work-en-40/',
			'checked'   => '2026-09-25',
		),
		'cfpb-bt-fee'       => array(
			'title'     => 'What is a balance transfer fee?',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-balance-transfer-fee-can-a-balance-transfer-fee-be-charged-on-a-zero-percent-interest-rate-offer-en-53/',
			'checked'   => '2026-09-25',
		),
		'regz-1026-5'       => array(
			'title'     => 'Regulation Z § 1026.5 – statements delivered at least 21 days before the due date',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/rules-policy/regulations/1026/5/',
			'checked'   => '2026-09-25',
		),
		'regz-1026-7'       => array(
			'title'     => 'Regulation Z § 1026.7(b)(12) – minimum payment warning on statements',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/rules-policy/regulations/1026/7/',
			'checked'   => '2026-09-25',
		),
		'regz-1026-9'       => array(
			'title'     => 'Regulation Z § 1026.9(c) – no advance notice needed when a variable APR changes with its index',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/rules-policy/regulations/1026/9/',
			'checked'   => '2026-10-04',
		),
		'regz-1026-53'      => array(
			'title'     => 'Regulation Z § 1026.53 – payments above the minimum go to the highest-APR balance first',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/rules-policy/regulations/1026/53/',
			'checked'   => '2026-09-25',
		),
		'regz-1026-55'      => array(
			'title'     => 'Regulation Z § 1026.55 – limits on raising APRs, including the 60-days-late rule',
			'publisher' => 'Consumer Financial Protection Bureau',
			'url'       => 'https://www.consumerfinance.gov/rules-policy/regulations/1026/55/',
			'checked'   => '2026-09-25',
		),
		'myfico-util'       => array(
			'title'     => 'What should my credit utilization ratio be?',
			'publisher' => 'myFICO',
			'url'       => 'https://www.myfico.com/credit-education/blog/credit-utilization-be',
			'checked'   => '2026-09-25',
		),
		'fico-high'         => array(
			'title'     => 'FICO Score High Achievers: Is age the only factor?',
			'publisher' => 'FICO',
			'url'       => 'https://www.fico.com/blogs/fico-score-high-achievers-age-only-factor',
			'checked'   => '2026-09-25',
		),
	);
}

/**
 * Render a "Sources" list for a page.
 *
 * @param string[] $keys Keys from cmc_sources().
 */
function cmc_render_sources( $keys ) {
	$all   = cmc_sources();
	$items = array();
	foreach ( (array) $keys as $key ) {
		if ( isset( $all[ $key ] ) ) {
			$items[] = $all[ $key ];
		}
	}
	if ( ! $items ) {
		return;
	}
	echo '<section class="cmc-sources" aria-label="Sources">';
	echo '<h2>Sources</h2><ol>';
	foreach ( $items as $s ) {
		printf(
			'<li><a href="%1$s" target="_blank" rel="noopener">%2$s</a> &mdash; %3$s. Checked %4$s.</li>',
			esc_url( $s['url'] ),
			esc_html( $s['title'] ),
			esc_html( $s['publisher'] ),
			esc_html( date_i18n( 'F j, Y', strtotime( $s['checked'] ) ) )
		);
	}
	echo '</ol></section>';
}
