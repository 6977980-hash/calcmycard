<?php
/**
 * Metadata for the supporting long-tail SEO/AEO articles. Body copy
 * lives in /content/articles/{slug}.html. Each article links back to 1-3
 * calculators (internal linking) and targets one primary long-tail keyword
 * from the keyword research plan.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cmc_articles() {
	static $articles = null;
	if ( null !== $articles ) {
		return $articles;
	}

	$articles = array(

		'how-does-credit-card-interest-work' => array(
			'slug'             => 'how-does-credit-card-interest-work',
			'title'            => 'How Does Credit Card Interest Work? A Plain-English Example',
			'breadcrumb'       => 'How Does Credit Card Interest Work?',
			'seo_title'        => 'How Does Credit Card Interest Work? (With a Real Example)',
			'meta_description' => 'A plain-English walkthrough of how credit card interest actually works, with a real dollar example showing how your balance grows.',
			'target_keyword'   => 'how does credit card interest work example',
			'sources'          => array( 'cfpb-grace', 'cfpb-cash-advance' ),
			'related_calculators' => array( 'credit-card-interest-calculator', 'daily-periodic-rate-calculator' ),
		),

		'how-to-avoid-credit-card-interest' => array(
			'slug'             => 'how-to-avoid-credit-card-interest',
			'title'            => 'How to Avoid Credit Card Interest Completely',
			'seo_title'        => 'How to Avoid Credit Card Interest Completely (7 Ways)',
			'meta_description' => 'Seven practical ways to avoid paying credit card interest, from the grace period rule to 0% APR cards — and how to check if you\'re already paying more than you need to.',
			'target_keyword'   => 'how to avoid credit card interest',
			'sources'          => array( 'cfpb-grace', 'cfpb-cash-advance', 'cfpb-deferred' ),
			'related_calculators' => array( 'credit-card-interest-calculator', 'intro-apr-calculator' ),
		),

		'average-credit-card-interest-rate-2026' => array(
			'slug'             => 'average-credit-card-interest-rate-2026',
			'title'            => 'Average Credit Card Interest Rate in 2026',
			'seo_title'        => 'Average Credit Card Interest Rate in 2026: What\'s Normal?',
			'meta_description' => 'The latest Federal Reserve data on average credit card APRs (Q2 2026), what the two averages mean, and how to tell whether your card\'s rate is above or below average.',
			'target_keyword'   => 'average credit card interest rate',
			'sources'          => array( 'fed-g19' ),
			'related_calculators' => array( 'credit-card-apr-calculator', 'credit-card-interest-calculator' ),
		),

		'how-to-calculate-credit-card-interest' => array(
			'slug'             => 'how-to-calculate-credit-card-interest',
			'title'            => 'How to Calculate Credit Card Interest by Hand',
			'seo_title'        => 'How to Calculate Credit Card Interest (Formula + Steps)',
			'meta_description' => 'How to calculate credit card interest: the daily-rate formula, a worked example with purchases and payments, the monthly shortcut, and a calculator to try it.',
			'target_keyword'   => 'how to calculate credit card interest',
			'embed_calc'       => 'daily-periodic-rate-calculator',
			'sources'          => array( 'cfpb-grace' ),
			'related_calculators' => array( 'daily-periodic-rate-calculator', 'credit-card-interest-calculator' ),
		),

		'credit-card-grace-period-explained' => array(
			'slug'             => 'credit-card-grace-period-explained',
			'title'            => 'Credit Card Grace Period, Explained',
			'seo_title'        => 'Credit Card Grace Period Explained: How to Avoid Interest',
			'meta_description' => 'What a credit card grace period is, how it works, and the rule that usually keeps it: paying your full statement balance by the due date.',
			'target_keyword'   => 'credit card grace period explained',
			'sources'          => array( 'cfpb-grace', 'regz-1026-5', 'cfpb-cash-advance', 'cfpb-deferred' ),
			'related_calculators' => array( 'credit-card-interest-calculator' ),
		),

		'pay-in-full-vs-minimum-payment' => array(
			'slug'             => 'pay-in-full-vs-minimum-payment',
			'title'            => 'Is It Better to Pay Your Credit Card in Full or Make Minimum Payments?',
			'seo_title'        => 'Pay Credit Card in Full or Minimum? Here\'s the Real Answer',
			'meta_description' => 'Paying in full versus paying the minimum, compared with real numbers — and why the answer is almost always the same.',
			// Visible guide-card text (homepage, /guides/, related guides). Meta description above is left unchanged.
			'card_description' => 'Paying in full versus paying the minimum, compared with real numbers — and how the costs can differ dramatically.',
			'target_keyword'   => 'is it better to pay credit card in full or minimum',
			'sources'          => array( 'cfpb-grace', 'regz-1026-7', 'myfico-util' ),
			'related_calculators' => array( 'minimum-payment-calculator', 'credit-card-payoff-calculator', 'extra-payment-savings-calculator' ),
		),

		'what-is-a-good-credit-card-interest-rate' => array(
			'slug'             => 'what-is-a-good-credit-card-interest-rate',
			'title'            => 'What Is a Good Credit Card Interest Rate?',
			'seo_title'        => 'What Is a Good Credit Card Interest Rate in 2026?',
			'meta_description' => 'How to tell whether your credit card\'s interest rate is good, average, or high — and what actually determines the rate you\'re offered.',
			'target_keyword'   => 'what is a good credit card interest rate',
			'sources'          => array( 'fed-g19' ),
			'related_calculators' => array( 'credit-card-apr-calculator' ),
		),

		'how-to-calculate-minimum-payment-formula' => array(
			'slug'             => 'how-to-calculate-minimum-payment-formula',
			'title'            => 'How to Calculate Your Credit Card\'s Minimum Payment',
			'seo_title'        => 'How to Calculate Minimum Payment on a Credit Card',
			'meta_description' => 'Two common formulas issuers use to set your minimum payment, plus how to find yours on your statement and estimate next month\'s minimum.',
			'target_keyword'   => 'how to calculate minimum payment on credit card',
			'sources'          => array( 'regz-1026-7' ),
			'related_calculators' => array( 'minimum-payment-calculator' ),
		),

		'how-long-to-pay-off-credit-card-with-minimum-payment' => array(
			'slug'             => 'how-long-to-pay-off-credit-card-with-minimum-payment',
			'title'            => 'How Long Does It Take to Pay Off a Credit Card With Minimum Payments?',
			'seo_title'        => 'How Long to Pay Off a Credit Card Making Minimum Payments?',
			'meta_description' => 'Real examples showing how many years (and how much interest) it takes to pay off common credit card balances using only minimum payments.',
			'target_keyword'   => 'how long to pay off credit card with minimum payments',
			'sources'          => array( 'regz-1026-7' ),
			'related_calculators' => array( 'minimum-payment-calculator', 'credit-card-payoff-calculator', 'extra-payment-savings-calculator' ),
		),

		'balance-transfer-fees-explained' => array(
			'slug'             => 'balance-transfer-fees-explained',
			'title'            => 'Balance Transfer Fees, Explained (And When They\'re Worth It)',
			'seo_title'        => 'Balance Transfer Fees Explained: When Do They Pay Off?',
			'meta_description' => 'How balance transfer fees work, typical rates, and the simple math for deciding whether a transfer still saves you money after the fee.',
			'target_keyword'   => 'balance transfer fee',
			'sources'          => array( 'cfpb-bt-fee', 'cfpb-deferred', 'regz-1026-55' ),
			'related_calculators' => array( 'balance-transfer-calculator', 'debt-consolidation-vs-balance-transfer-calculator', 'intro-apr-calculator' ),
		),

		'credit-card-interest-calculator-excel-template' => array(
			'slug'             => 'credit-card-interest-calculator-excel-template',
			'title'            => 'Credit Card Interest Formula in Excel or Google Sheets',
			'seo_title'        => 'Credit Card Interest Excel Template + Formulas (Free)',
			'meta_description' => 'The Excel formula for calculating credit card interest, why most people get it wrong, and when a free online calculator is simply faster.',
			'target_keyword'   => 'credit card interest formula excel',
			'sources'          => array( 'cfpb-grace' ),
			'related_calculators' => array( 'credit-card-interest-calculator', 'daily-periodic-rate-calculator' ),
		),

		'how-to-pay-off-multiple-credit-cards-strategy' => array(
			'slug'             => 'how-to-pay-off-multiple-credit-cards-strategy',
			'title'            => 'How to Pay Off Multiple Credit Cards: A Step-by-Step Strategy',
			'seo_title'        => 'How to Pay Off Multiple Credit Cards (Step-by-Step)',
			'meta_description' => 'A step-by-step strategy for tackling multiple credit card balances at once, including how to choose between snowball and avalanche order.',
			'target_keyword'   => 'how to pay off multiple credit cards',
			'sources'          => array( 'regz-1026-53', 'myfico-util' ),
			'related_calculators' => array( 'debt-payoff-snowball-avalanche', 'credit-utilization-calculator', 'debt-consolidation-vs-balance-transfer-calculator', 'extra-payment-savings-calculator' ),
		),

		'student-credit-card-interest-guide' => array(
			'slug'             => 'student-credit-card-interest-guide',
			'title'            => 'A Student\'s Guide to Credit Card Interest',
			'seo_title'        => 'Student Credit Card Interest: What to Know Before You Swipe',
			'meta_description' => 'A beginner-friendly guide to how credit card interest works for students, common first-card mistakes, and how to build credit without paying interest.',
			'target_keyword'   => 'student credit card interest',
			'sources'          => array( 'cfpb-grace', 'myfico-util' ),
			'related_calculators' => array( 'credit-card-interest-calculator', 'credit-utilization-calculator' ),
		),

		'apr-vs-interest-rate-difference' => array(
			'slug'             => 'apr-vs-interest-rate-difference',
			'title'            => 'APR vs. Interest Rate: What\'s the Difference on a Credit Card?',
			'seo_title'        => 'APR vs. Interest Rate on Credit Cards: What\'s the Difference',
			'meta_description' => 'Why APR and interest rate mean almost the same thing on a credit card (but not on a mortgage), explained simply.',
			'target_keyword'   => 'apr vs interest rate credit card',
			'sources'          => array( 'cfpb-cash-advance', 'regz-1026-55', 'fed-g19' ),
			'related_calculators' => array( 'credit-card-apr-calculator', 'daily-periodic-rate-calculator' ),
		),

		'total-interest-multiple-credit-cards' => array(
			'slug'             => 'total-interest-multiple-credit-cards',
			'title'            => 'How to Calculate Total Interest Across Multiple Credit Cards',
			'seo_title'        => 'How to Calculate Total Interest Across Multiple Credit Cards',
			'meta_description' => 'How to add up interest costs across several credit cards at once, and why looking at your total (not just each card) changes your payoff strategy.',
			'target_keyword'   => 'how to calculate interest on multiple credit cards',
			'sources'          => array( 'regz-1026-53' ),
			'related_calculators' => array( 'debt-payoff-snowball-avalanche', 'credit-card-interest-calculator' ),
		),

		'credit-card-glossary' => array(
			'slug'             => 'credit-card-glossary',
			'title'            => 'Credit Card Glossary: Terms Explained in Plain English',
			'breadcrumb'       => 'Credit Card Glossary',
			'seo_title'        => 'Credit Card Glossary: APR, Grace Period & More Explained',
			'meta_description' => 'Plain-English definitions of credit card terms: APR, daily periodic rate, average daily balance, grace period, minimum payment, penalty APR, and more.',
			'target_keyword'   => 'credit card terms glossary',
			'sources'          => array( 'cfpb-grace', 'regz-1026-5', 'regz-1026-53', 'regz-1026-55' ),
			'related_calculators' => array( 'credit-card-interest-calculator', 'daily-periodic-rate-calculator', 'minimum-payment-calculator' ),
		),

		'credit-card-minimum-payment-study-2026' => array(
			'slug'             => 'credit-card-minimum-payment-study-2026',
			'title'            => 'The Minimum Payment Trap: How Long Each Big Issuer\'s Minimum Takes (2026 Study)',
			'breadcrumb'       => 'Minimum Payment Study 2026',
			'seo_title'        => 'Minimum Payments by Issuer: Chase, Citi, Discover & More (2026 Study)',
			'meta_description' => 'We ran Chase, Citi, Capital One, Discover and Amex minimum payment formulas on the same balance: 15 to 20 years and up to $11,529 interest on $5,000.',
			'target_keyword'   => 'credit card minimum payment by issuer',
			'sources'          => array( 'fed-g19', 'regz-1026-7' ),
			'related_calculators' => array( 'minimum-payment-calculator', 'credit-card-payoff-calculator' ),
		),

	);

	return $articles;
}

function cmc_get_article( $slug ) {
	$all = cmc_articles();
	return isset( $all[ $slug ] ) ? $all[ $slug ] : null;
}

function cmc_get_article_for_current_page() {
	if ( ! is_page() && ! is_single() ) {
		return null;
	}
	$slug = get_post_field( 'post_name', get_queried_object_id() );
	return cmc_get_article( $slug );
}

function cmc_get_article_body( $slug ) {
	$path = CMC_THEME_DIR . '/content/articles/' . $slug . '.html';
	if ( ! file_exists( $path ) ) {
		return '';
	}
	return file_get_contents( $path );
}
