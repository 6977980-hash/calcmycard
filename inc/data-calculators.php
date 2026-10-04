<?php
/**
 * Single source of truth for all calculators: metadata, SEO fields,
 * FAQ content (also used to emit FAQPage schema), and internal-linking
 * relationships. Both the theme (page templates) and the WP-CLI content
 * importer (import/import-content.php) read this same file, so title,
 * slug, and copy never drift between the two.
 *
 * Long-form body copy lives in /content/calculators/{slug}.html (plain
 * HTML fragments) and is pulled in by page-calculator.php via
 * cmc_get_calculator_body(). Keeping prose out of this array keeps it
 * readable and avoids PHP string-escaping headaches in long copy.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cmc_calculators() {
	static $calculators = null;
	if ( null !== $calculators ) {
		return $calculators;
	}

	$calculators = array(

		'credit-card-interest-calculator' => array(
			'slug'             => 'credit-card-interest-calculator',
			'title'            => 'Credit Card Interest Calculator',
			'seo_title'        => 'Credit Card Interest Calculator — Estimate What You\'ll Pay',
			'meta_description' => 'Free credit card interest calculator. Enter your balance, APR, and payment to estimate how much interest you\'ll pay and how long payoff will take.',
			'h1'               => 'Credit Card Interest Calculator',
			'dek'              => 'Estimate how much of your next payment goes to interest versus principal — and what your balance could cost you over time.',
			'target_keyword'   => 'credit card interest calculator',
			'calc_id'          => 'interest',
			'js'               => 'calc-interest.js',
			'flagship'         => true,
			'sources'          => array( 'cfpb-grace', 'regz-1026-53', 'fed-g19' ),
			'related'          => array( 'credit-card-payoff-calculator', 'minimum-payment-calculator', 'daily-periodic-rate-calculator', 'credit-card-apr-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'How is credit card interest calculated?',
					'a' => 'Many issuers use a daily periodic rate: your APR divided by 365 (sometimes 360), applied to your average daily balance for each day of the billing cycle. This calculator simplifies that to a monthly rate (APR ÷ 12) applied to your balance, which works well for planning but may not match your statement to the cent.',
				),
				array(
					'q' => 'Why does my balance barely go down even though I\'m paying every month?',
					'a' => 'When your payment is close to the interest charge, most of it covers interest and only a small amount reduces the principal. On a $5,000 balance at 24.99% APR, about $104 of a $150 payment goes to interest in the first month. As the balance falls, more of each payment goes to principal.',
				),
				array(
					'q' => 'Is this calculator accurate for my exact statement?',
					'a' => 'No — it provides an estimate using a simplified monthly-interest model (APR ÷ 12). Many issuers calculate interest with a daily periodic rate applied to your average daily balance, and grace periods and fees also vary, so treat the result as a planning estimate rather than a statement-exact figure — always confirm against your official statement.',
				),
				array(
					'q' => 'Does this calculator include new purchases or fees?',
					'a' => 'No. It assumes you make no new charges and pay no fees while paying down the balance. New purchases, annual fees, or late fees would raise the balance and the interest, and lengthen payoff.',
				),
				array(
					'q' => 'How do I avoid paying credit card interest?',
					'a' => 'On cards with a grace period, paying your full statement balance by the due date each month typically avoids interest on purchases. If you already carry a balance, paying more each month, or moving it to a lower-rate offer, reduces the interest you pay.',
				),
				array(
					'q' => 'What\'s a good APR for a credit card?',
					'a' => 'It depends on your credit profile and the type of card. For context, the Federal Reserve\'s G.19 data put the average rate at 20.94% across all accounts and 22.15% on accounts charged interest in Q2 2026. The higher your APR, the more it matters to pay in full or pay the balance down quickly.',
				),
				array(
					'q' => 'What if my payment doesn\'t cover the interest?',
					'a' => 'If your monthly payment is smaller than the monthly interest, the balance never goes down. The calculator flags this so you know the payment needs to increase.',
				),
			),
		),

		'credit-card-payoff-calculator' => array(
			'slug'             => 'credit-card-payoff-calculator',
			'title'            => 'Credit Card Payoff Calculator',
			'seo_title'        => 'Credit Card Payoff Calculator — Find Your Debt-Free Date',
			'meta_description' => 'How long will it take to pay off your credit card, or what monthly payment clears it by your deadline? Get your debt-free date, total interest and a payoff schedule.',
			'h1'               => 'Credit Card Payoff Calculator',
			'dek'              => 'Enter your balance, APR, and monthly payment to see your estimated payoff date and total interest cost — then test how extra payments shorten it.',
			'target_keyword'   => 'credit card payoff calculator',
			'calc_id'          => 'payoff',
			'js'               => 'calc-payoff.js',
			'sources'          => array( 'regz-1026-7', 'cfpb-grace' ),
			'related'          => array( 'credit-card-interest-calculator', 'extra-payment-savings-calculator', 'biweekly-payment-calculator', 'debt-payoff-snowball-avalanche' ),
			'faqs'             => array(
				array(
					'q' => 'How long will it take to pay off my credit card?',
					'a' => 'It depends on your balance, APR, and monthly payment. For example, a $5,000 balance at 24% APR with $150 monthly payments takes about 56 months (4 years, 8 months) and roughly $3,300 in interest under the simplified monthly model. Enter your own numbers above for an estimated payoff date.',
				),
				array(
					'q' => 'How much should I pay to pay off my credit card in a year?',
					'a' => 'Choose "payment to be debt-free by a date" above and enter 12 months. For example, $5,000 at 22.99% APR takes about $470 a month to clear in 12 months, $262 a month for 24 months, or $194 a month for 36 months, assuming no new charges.',
				),
				array(
					'q' => 'What\'s the smallest payment that makes progress?',
					'a' => 'Your payment has to be larger than one month\'s interest, estimated here as balance × (APR ÷ 12). On $5,000 at 22.99%, that\'s about $96 a month; anything above it starts reducing the balance, and the calculator tells you if your payment falls short.',
				),
				array(
					'q' => 'Does paying more than the minimum really make a big difference?',
					'a' => 'Yes. Extra money goes straight to principal, which reduces the interest charged every month after. On a $5,000 balance at 22.99% APR, raising the payment from $175 to $225 cuts payoff by about a year and saves over $700 in interest in this calculator\'s estimate.',
				),
				array(
					'q' => 'Should I pay off my credit card in full or make payments?',
					'a' => 'On cards with a grace period, paying your full statement balance by the due date typically avoids interest on purchases. If you can\'t pay in full, paying as much above the minimum as your budget allows shortens payoff and reduces interest.',
				),
				array(
					'q' => 'Why is my estimated payoff date different from my statement\'s?',
					'a' => 'Many U.S. statements show how long payoff would take at the minimum payment, while this calculator uses the fixed payment you enter. It also uses a simplified monthly model (APR ÷ 12), while issuers may use a daily rate and average daily balance.',
				),
				array(
					'q' => 'Does this calculator account for new purchases?',
					'a' => 'No. It assumes you stop adding charges. Any new spending on the card will push the payoff date back.',
				),
				array(
					'q' => 'What if my APR changes?',
					'a' => 'Most card APRs are variable, so your rate can move with benchmark rates. The calculator assumes one fixed APR; re-run it with the new rate if yours changes.',
				),
			),
		),

		'minimum-payment-calculator' => array(
			'slug'             => 'minimum-payment-calculator',
			'title'            => 'Credit Card Minimum Payment Calculator',
			'seo_title'        => 'Credit Card Minimum Payment Calculator (Chase, Citi & More)',
			'meta_description' => 'Calculate your credit card minimum payment with your issuer\'s formula (Chase, Citi, Discover, Capital One, Amex) and see how long minimums only really take.',
			'h1'               => 'Credit Card Minimum Payment Calculator',
			'dek'              => 'Estimate your minimum payment under common formulas — and what paying only the minimum every month could cost.',
			'target_keyword'   => 'credit card minimum payment calculator',
			'calc_id'          => 'minpayment',
			'js'               => 'calc-minimum-payment.js',
			'sources'          => array( 'regz-1026-7', 'regz-1026-55' ),
			'related'          => array( 'credit-card-payoff-calculator', 'credit-card-interest-calculator', 'extra-payment-savings-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'How is a credit card minimum payment calculated?',
					'a' => 'Common minimum-payment formulas include a percentage of the balance, interest plus a percentage of principal, or a combination of these methods, often with a fixed dollar floor. Your cardholder agreement determines the actual formula. This calculator lets you model two common structures.',
				),
				array(
					'q' => 'Why is my minimum payment so low compared to my balance?',
					'a' => 'Minimums are usually a small percentage of the balance, so on a high-APR card much of the minimum goes to interest and only a small amount reduces the principal. That keeps the payment affordable but makes payoff slow.',
				),
				array(
					'q' => 'What happens if I only ever pay the minimum?',
					'a' => 'Payoff can take many years and cost more in interest than the original balance. In this calculator\'s example, $3,500 at 23.99% APR takes about 16½ years to repay at the minimum, with roughly $5,900 in interest. Compare against a fixed higher payment with the Credit Card Payoff Calculator.',
				),
				array(
					'q' => 'Where can I find my card\'s actual minimum payment formula?',
					'a' => 'It\'s in your cardholder agreement, usually in the section describing how the minimum payment is calculated. Your statement shows the resulting minimum amount due each month.',
				),
				array(
					'q' => 'Does my minimum payment change every month?',
					'a' => 'Usually, yes. Because it\'s typically based on your statement balance (and sometimes that month\'s interest), the minimum falls as your balance falls and rises if you add charges. Fees and past-due amounts may also be added.',
				),
				array(
					'q' => 'What happens if I pay less than the minimum?',
					'a' => 'The payment would generally be treated as late, which can mean a late fee, a possible penalty APR depending on your card\'s terms, and a negative mark on your credit report if it\'s 30 or more days past due.',
				),
				array(
					'q' => 'What is the minimum payment on a $10,000 credit card balance?',
					'a' => 'With the common formula of interest plus 1% of the balance, at 23.99% APR it is about $300 for the first month (roughly $200 of interest plus $100 of principal). Paying only the minimum from there would take about 21 years and cost about $18,200 in interest under this calculator\'s simplified monthly model.',
				),
				array(
					'q' => 'How do Chase, Citi, and Discover calculate the minimum payment?',
					'a' => 'Chase uses the greater of $40 or 1% of the balance plus interest and late fees. Citi uses the greater of $41 or 1% of the balance plus billed interest. Discover uses the greatest of $35, 2% of the balance, or $20 plus interest and late fees. Formulas can vary by card, so your cardmember agreement is the final word.',
				),
				array(
					'q' => 'Does this calculator match my issuer\'s formula?',
					'a' => 'Choose Chase, Citi, Discover, Capital One, or American Express to load that issuer\'s standard published formula, or set your own. It will match only if your card uses that structure. Percentages, dollar floors, and whether fees are included vary by card, and the calculator uses a simplified monthly-interest model (APR ÷ 12), so treat the result as an estimate.',
				),
			),
		),

		'balance-transfer-calculator' => array(
			'slug'             => 'balance-transfer-calculator',
			'title'            => 'Credit Card Balance Transfer Calculator',
			'seo_title'        => 'Balance Transfer Calculator — Is It Worth the Fee?',
			'meta_description' => 'Calculate how much a balance transfer could save you after fees. Compare your current card\'s interest cost against a 0% or low-APR transfer offer.',
			'h1'               => 'Credit Card Balance Transfer Calculator',
			'dek'              => 'Compare what you\'d pay by staying put versus transferring your balance — fees included — to see your real net savings.',
			'target_keyword'   => 'balance transfer calculator',
			'calc_id'          => 'balancetransfer',
			'js'               => 'calc-balance-transfer.js',
			'sources'          => array( 'cfpb-bt-fee', 'cfpb-deferred', 'regz-1026-55' ),
			'related'          => array( 'intro-apr-calculator', 'debt-consolidation-vs-balance-transfer-calculator', 'credit-card-interest-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'Is a balance transfer worth the transfer fee?',
					'a' => 'It can be when the interest you\'d save is larger than the fee. Transfer fees are often 3-5% of the amount moved. This calculator compares your estimated total cost of staying put with the cost of transferring, fee included, at the same monthly payment.',
				),
				array(
					'q' => 'What happens if I don\'t pay off the balance before the promo APR ends?',
					'a' => 'Any remaining balance starts accruing interest at the card\'s standard APR. On deferred-interest offers, interest may be charged back to the start of the promotion. To avoid a leftover balance, divide the transferred amount (including the fee) by the number of promo months and pay at least that much.',
				),
				array(
					'q' => 'Can I transfer a balance between cards from the same bank?',
					'a' => 'Generally no — many issuers won\'t let you transfer a balance to another card issued by the same bank. You\'ll usually need an offer from a different issuer.',
				),
				array(
					'q' => 'Is the transfer fee added to my balance?',
					'a' => 'Usually, yes. The fee is typically added to the new card\'s balance at the time of the transfer, which is how this calculator treats it.',
				),
				array(
					'q' => 'Can a late payment cancel my promotional rate?',
					'a' => 'On some cards, yes. Under federal rules (Regulation Z § 1026.55), an issuer can generally raise the rate on an existing promotional balance before the promo ends only if your minimum payment is more than 60 days late. A shorter late payment can still bring a late fee and a higher rate on new purchases after notice, so check your card\'s terms. Check the offer details before you transfer.',
				),
				array(
					'q' => 'Do new purchases on the transfer card get 0% too?',
					'a' => 'Not necessarily. Purchases may carry the regular purchase APR and, on some cards, may not get a grace period while a transferred balance remains. Many people avoid using the transfer card for new purchases during the promo.',
				),
				array(
					'q' => 'Does a balance transfer hurt my credit score?',
					'a' => 'Applying for a new card usually triggers a hard inquiry, and a new account lowers your average account age. On the other hand, a new credit limit can lower your overall utilization. The net effect depends on your credit profile.',
				),
			),
		),

		'debt-payoff-snowball-avalanche' => array(
			'slug'             => 'debt-payoff-snowball-avalanche',
			'title'            => 'Multi-Card Debt Payoff Calculator (Snowball vs. Avalanche)',
			'seo_title'        => 'Snowball vs. Avalanche Calculator — Pay Off Cards Faster',
			'meta_description' => 'Compare the debt snowball and debt avalanche methods across all your credit cards. See which strategy gets you debt-free faster and cheaper.',
			'h1'               => 'Multi-Card Debt Payoff Calculator: Snowball vs. Avalanche',
			'dek'              => 'Add every card you\'re carrying a balance on and see, side by side, which order of payoff — smallest balance first or highest APR first — saves you more.',
			'target_keyword'   => 'snowball vs avalanche calculator',
			'calc_id'          => 'multidebt',
			'js'               => 'calc-multi-debt.js',
			'sources'          => array( 'regz-1026-53' ),
			'related'          => array( 'credit-card-payoff-calculator', 'debt-consolidation-vs-balance-transfer-calculator', 'extra-payment-savings-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'What\'s the difference between the debt snowball and debt avalanche methods?',
					'a' => 'Both pay the minimum on every card and put extra money toward one target card. The snowball targets the smallest balance first, for quick wins; the avalanche targets the highest APR first, which usually minimizes total interest.',
				),
				array(
					'q' => 'Which method is faster?',
					'a' => 'It depends on your cards. The avalanche usually costs less in interest and is often faster in total, but the snowball clears individual cards sooner. Enter your own cards above to compare both.',
				),
				array(
					'q' => 'Can I combine both methods?',
					'a' => 'Yes — a common hybrid is to pay off any very small balances first for a quick win, then switch to avalanche order (highest APR first) for the rest.',
				),
				array(
					'q' => 'What happens when a card is paid off?',
					'a' => 'Its old minimum payment rolls over to the next target card. The calculator keeps your total monthly budget (all starting minimums plus your extra amount) the same every month, so each paid-off card speeds up the next one — the standard way both methods work.',
				),
				array(
					'q' => 'Should I close cards after paying them off?',
					'a' => 'Not necessarily. Closing a card removes its credit limit, which can raise your utilization, and eventually its history. If the card has no annual fee, many people keep it open and unused.',
				),
				array(
					'q' => 'Does this calculator include new purchases or fees?',
					'a' => 'No. It assumes no new charges and fixed minimum payments. Real minimums usually fall as balances fall, and new spending would lengthen the plan.',
				),
			),
		),

		'credit-card-apr-calculator' => array(
			'slug'             => 'credit-card-apr-calculator',
			'title'            => 'Credit Card APR Calculator',
			'seo_title'        => 'Credit Card APR Calculator — Convert APR to Real Dollar Cost',
			'meta_description' => 'Convert your credit card\'s APR into a real monthly and annual dollar cost based on your balance. Understand what your interest rate actually means.',
			'h1'               => 'Credit Card APR Calculator',
			'dek'              => 'Turn an abstract percentage into real numbers: see what your APR costs you per month and per year on your actual balance.',
			'target_keyword'   => 'credit card APR calculator',
			'calc_id'          => 'apr',
			'js'               => 'calc-apr.js',
			'sources'          => array( 'fed-g19', 'cfpb-cash-advance', 'regz-1026-55' ),
			'related'          => array( 'daily-periodic-rate-calculator', 'credit-card-interest-calculator', 'intro-apr-calculator', 'cash-advance-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'What does APR stand for and what does it mean?',
					'a' => 'APR stands for annual percentage rate — the yearly cost of borrowing, expressed as a percentage. On credit cards, many issuers apply it as a daily periodic rate (APR ÷ 365), so interest builds throughout the billing cycle.',
				),
				array(
					'q' => 'Is APR the same as interest rate?',
					'a' => 'For most credit cards, yes, since cards rarely charge separate upfront loan fees the way mortgages do — APR and interest rate are effectively the same number. On other loan types they can differ because APR bundles in certain fees.',
				),
				array(
					'q' => 'Why do cash advances and purchases have different APRs?',
					'a' => 'Issuers price transaction types differently. Cash advance APRs are commonly higher than purchase APRs, and cash advances typically begin accruing interest immediately and generally don\'t receive the same grace period that applies to purchases.',
				),
				array(
					'q' => 'What is a penalty APR?',
					'a' => 'Some cards have a higher penalty APR for late payments. Under federal rules (Regulation Z § 1026.55), it can generally apply to your existing balance only if your minimum payment is more than 60 days late, and to new transactions after advance notice. Your cardholder agreement lists whether your card has one and what triggers it.',
				),
				array(
					'q' => 'Why is the compounded annual cost higher than the simple one?',
					'a' => 'Because interest is charged on previous interest. If a $4,000 balance at 24.99% revolves for a year with no payments, simple interest is about $1,000, but monthly compounding brings it to about $1,122.',
				),
				array(
					'q' => 'Do I pay APR if I pay my balance in full?',
					'a' => 'On cards with a grace period, paying your full statement balance by the due date typically means no interest on purchases. APR matters when you carry a balance, take a cash advance, or use a feature without a grace period.',
				),
			),
		),

		'daily-periodic-rate-calculator' => array(
			'slug'             => 'daily-periodic-rate-calculator',
			'title'            => 'Daily Periodic Rate Calculator',
			'seo_title'        => 'Daily Periodic Rate Calculator — Convert APR to Daily Rate',
			'meta_description' => 'Convert your credit card APR into a daily periodic rate and estimate how much interest accrues on your balance each day.',
			'h1'               => 'Daily Periodic Rate Calculator',
			'dek'              => 'See the daily periodic rate typically derived from your APR, and how many dollars that adds up to per day and per billing cycle.',
			'target_keyword'   => 'daily periodic rate calculator',
			'calc_id'          => 'dpr',
			'js'               => 'calc-daily-periodic-rate.js',
			'sources'          => array( 'cfpb-grace' ),
			'related'          => array( 'credit-card-apr-calculator', 'credit-card-interest-calculator', 'minimum-payment-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'How do I calculate the daily periodic rate?',
					'a' => 'Divide your APR by 365 (some cards use 360). A 24% APR gives a daily periodic rate of about 0.0658%. Multiply that by your average daily balance and by the number of days in the billing cycle to estimate the interest charged.',
				),
				array(
					'q' => 'Why does my issuer use a daily rate instead of a monthly one?',
					'a' => 'A daily rate reflects a balance that changes day to day as purchases and payments post. Averaging those daily balances captures the timing of each transaction, rather than using a single snapshot.',
				),
				array(
					'q' => 'Does my card use 365 or 360 days?',
					'a' => 'Many use 365, but some use 360, which produces a slightly higher daily rate. Your cardholder agreement or statement usually shows the daily periodic rate or explains how it\'s calculated.',
				),
				array(
					'q' => 'What is an average daily balance?',
					'a' => 'It\'s the sum of your balance at the end of each day in the billing cycle, divided by the number of days. Payments made earlier in the cycle lower it more than the same payment made near the end.',
				),
				array(
					'q' => 'Why is the effective APR higher than my stated APR?',
					'a' => 'When interest compounds daily, you pay interest on previous interest. At 24.99% APR, daily compounding works out to an effective annual rate of about 28.4%.',
				),
				array(
					'q' => 'Why doesn\'t my result match my statement?',
					'a' => 'Issuers differ in whether they compound daily or total interest per cycle, which balances they include (for example, new purchases while you have a grace period), rounding, and minimum interest charges. Treat the result as an estimate.',
				),
			),
		),

		'extra-payment-savings-calculator' => array(
			'slug'             => 'extra-payment-savings-calculator',
			'title'            => 'Extra Payment Savings Calculator',
			'seo_title'        => 'Extra Payment Calculator — How Much Do You Save?',
			'meta_description' => 'Estimate how much time and interest you could save by adding extra payments to your credit card each month, compared with paying the minimum.',
			'h1'               => 'Extra Payment Savings Calculator',
			'dek'              => 'Add a fixed extra amount to your monthly payment and see an estimate of how many months and how many dollars in interest it could save you.',
			'target_keyword'   => 'extra payment credit card calculator',
			'calc_id'          => 'extrapayment',
			'js'               => 'calc-extra-payment.js',
			'sources'          => array( 'regz-1026-53' ),
			'related'          => array( 'credit-card-payoff-calculator', 'minimum-payment-calculator', 'debt-payoff-snowball-avalanche' ),
			'faqs'             => array(
				array(
					'q' => 'How much faster will I pay off my card with an extra $50 a month?',
					'a' => 'It depends on your balance, APR, and payment. On a $5,000 balance at 22.99% APR with a $150 payment, adding $50 cuts payoff from about 54 months to 35 and saves roughly $1,170 in interest in this calculator\'s estimate. Enter your numbers above for your own estimate.',
				),
				array(
					'q' => 'Is it better to make one extra payment or split it across the month?',
					'a' => 'On cards that use an average daily balance, paying earlier in the cycle can save slightly more than paying at the due date, but the difference is usually small. Paying extra consistently every month matters more than timing.',
				),
				array(
					'q' => 'Where does an extra payment go if I have balances at different APRs?',
					'a' => 'In the U.S., amounts above the minimum payment generally must go to the balance with the highest APR first. The minimum itself may be applied however your issuer chooses, often to the lowest-rate balance.',
				),
				array(
					'q' => 'Is a one-time lump sum worth it?',
					'a' => 'Yes. A lump sum reduces principal immediately, which lowers interest for every remaining month. This calculator models a fixed monthly extra amount; for a one-time payment, lower your starting balance to see the effect.',
				),
				array(
					'q' => 'Should I pay extra on my card or save the money?',
					'a' => 'Many people keep a basic emergency fund first so they don\'t have to borrow again when something unexpected happens, then put extra money toward high-interest debt. The right balance depends on your situation.',
				),
			),
		),

		'intro-apr-calculator' => array(
			'slug'             => 'intro-apr-calculator',
			'title'            => '0% Intro APR Calculator',
			'seo_title'        => '0% Intro APR Calculator — Plan Your Promo Period Payoff',
			'meta_description' => 'Calculate the monthly payment you need to pay off a purchase or balance before your 0% intro APR period ends — and what happens if you don\'t.',
			'h1'               => '0% Intro APR Calculator',
			'dek'              => 'Find the monthly payment required to clear your balance before the promotional 0% period ends, and see the cost if you fall short.',
			'target_keyword'   => '0% APR calculator',
			'calc_id'          => 'introapr',
			'js'               => 'calc-intro-apr.js',
			'sources'          => array( 'cfpb-deferred', 'regz-1026-55', 'regz-1026-53' ),
			'related'          => array( 'balance-transfer-calculator', 'credit-card-payoff-calculator', 'credit-card-apr-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'What happens if I don\'t pay off my balance before the 0% APR period ends?',
					'a' => 'Any remaining balance begins accruing interest at the card\'s standard go-to APR — and on some cards, deferred-interest promotions can retroactively charge interest back to the original purchase date if not paid in full by the deadline. Always check your card\'s specific terms.',
				),
				array(
					'q' => 'How do I make sure I pay off my balance in time?',
					'a' => 'Divide your balance by the number of months in the promotional period — that\'s the flat payment needed to reach zero when the promo ends. This calculator does that division for you and flags if your planned payment falls short.',
				),
				array(
					'q' => 'What\'s the difference between 0% APR and deferred interest?',
					'a' => 'With a true 0% APR, no interest accrues during the promo, and only the remaining balance is charged interest afterward. With deferred interest, interest builds in the background and may be charged back to the purchase date if the full balance isn\'t paid by the deadline.',
				),
				array(
					'q' => 'Is the minimum payment enough to clear a 0% balance in time?',
					'a' => 'Often not. The minimum can be lower than the balance divided by the promo months, so paying only the minimum may leave a balance when the promo ends.',
				),
				array(
					'q' => 'Can I lose my 0% rate early?',
					'a' => 'Under federal rules (Regulation Z § 1026.55), an issuer can generally end a promotional rate on your existing balance early only if your minimum payment is more than 60 days late. On deferred-interest plans, the CFPB notes that being more than 60 days late can also trigger the deferred interest. Check your card\'s terms.',
				),
				array(
					'q' => 'Do new purchases get the 0% rate too?',
					'a' => 'Only if the offer covers purchases. Some intro offers apply only to balance transfers, so new purchases would accrue interest at the regular purchase APR.',
				),
			),
		),

		'credit-utilization-calculator' => array(
			'slug'             => 'credit-utilization-calculator',
			'title'            => 'Credit Utilization Calculator',
			'seo_title'        => 'Credit Utilization Calculator — Check Your Ratio Instantly',
			'meta_description' => 'Calculate your credit utilization ratio across one or all your cards and see how it may be affecting your credit score.',
			'h1'               => 'Credit Utilization Calculator',
			'dek'              => 'Your utilization ratio is one of the biggest factors in your credit score after payment history. See yours instantly, per card and overall.',
			'target_keyword'   => 'credit utilization calculator',
			'calc_id'          => 'utilization',
			'js'               => 'calc-utilization.js',
			'sources'          => array( 'myfico-util', 'fico-high' ),
			'related'          => array( 'debt-payoff-snowball-avalanche', 'balance-transfer-calculator', 'credit-card-payoff-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'What is a good credit utilization ratio?',
					'a' => 'Lower is generally better. Staying under 30% is a common rule of thumb, but FICO says its data doesn\'t show a sudden score drop at 30%, and people with the highest FICO scores use a much smaller share of their limits than average. Utilization is based on the balances your issuers report, usually once per statement cycle.',
				),
				array(
					'q' => 'Does utilization matter per card or only overall?',
					'a' => 'Both. Scoring models look at your overall utilization across all cards and can also weigh individual card utilization — a card near its limit can hurt your score even if your overall utilization looks fine.',
				),
				array(
					'q' => 'Does paying in full each month mean 0% utilization?',
					'a' => 'Not necessarily. Issuers usually report your statement balance, so if you charge $1,500 and pay it in full after the statement closes, $1,500 may still be reported. Paying before the statement closing date can lower the reported amount.',
				),
				array(
					'q' => 'Is 0% utilization best?',
					'a' => 'Not always. Some scoring models may reward showing a small reported balance over none at all, but the difference is usually small compared with keeping utilization low and paying on time.',
				),
				array(
					'q' => 'Will closing a credit card affect my utilization?',
					'a' => 'It can. Closing a card removes its limit from your total available credit, which can raise your overall utilization if you carry balances on other cards.',
				),
				array(
					'q' => 'How quickly does lowering utilization help my score?',
					'a' => 'Scores are calculated from the balances your issuers most recently reported, so a lower balance can be reflected once it\'s reported, often within a cycle or two.',
				),
			),
		),

		'debt-consolidation-vs-balance-transfer-calculator' => array(
			'slug'             => 'debt-consolidation-vs-balance-transfer-calculator',
			'title'            => 'Debt Consolidation vs. Balance Transfer Calculator',
			'seo_title'        => 'Debt Consolidation vs. Balance Transfer — Which Saves More?',
			'meta_description' => 'Compare a fixed-rate debt consolidation loan against a balance transfer card side by side, including all fees, to see which option costs less.',
			'h1'               => 'Debt Consolidation vs. Balance Transfer Calculator',
			'dek'              => 'Two very different ways to tackle the same balance — compare total cost side by side before you decide.',
			'target_keyword'   => 'debt consolidation calculator',
			'calc_id'          => 'consolidationvstransfer',
			'js'               => 'calc-consolidation-vs-transfer.js',
			'sources'          => array( 'cfpb-bt-fee', 'cfpb-deferred', 'regz-1026-55' ),
			'related'          => array( 'balance-transfer-calculator', 'debt-payoff-snowball-avalanche', 'credit-card-payoff-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'Is a balance transfer or a debt consolidation loan better?',
					'a' => 'It depends on your credit and balance. A 0% balance transfer is usually cheapest if you can pay off the balance within the promo window. A fixed-rate personal loan can be better for larger balances or longer payoff timelines, since the rate doesn\'t expire and payments are fixed. Compare both above with your real numbers.',
				),
				array(
					'q' => 'Do both options affect my credit score the same way?',
					'a' => 'Both typically involve a hard inquiry when you apply. A balance transfer keeps the debt as revolving credit (affecting utilization); a consolidation loan converts it to installment debt, which can help your score if it lowers your card utilization.',
				),
				array(
					'q' => 'What is an origination fee?',
					'a' => 'It\'s a one-time fee some lenders charge to make a personal loan, often a percentage of the loan amount. Some add it to the amount you borrow and others deduct it from the money you receive; this calculator adds it to the loan.',
				),
				array(
					'q' => 'What if my balance is larger than the transfer card\'s limit?',
					'a' => 'Only part of the debt could move, and the rest would stay on the original card at its current APR. A consolidation loan may cover more of the balance, depending on the amount you\'re approved for.',
				),
				array(
					'q' => 'Why does the calculator assume a specific transfer payment?',
					'a' => 'To compare fairly, it assumes you pay (balance + fee) ÷ promo months, which clears the balance just as the promo ends. If you can\'t afford that payment, use the Balance Transfer Calculator to test a lower one.',
				),
				array(
					'q' => 'Can I pay off a consolidation loan early?',
					'a' => 'Many personal loans allow early payoff without a penalty, but check the loan agreement. Paying early reduces the total interest compared with this calculator\'s full-term estimate.',
				),
			),
		),

		'cash-advance-calculator' => array(
			'slug'             => 'cash-advance-calculator',
			'title'            => 'Cash Advance Calculator',
			'seo_title'        => 'Cash Advance Calculator — Fee, Interest & True Cost',
			'meta_description' => 'Estimate what a credit card cash advance really costs: the up-front fee, interest from day one at the cash advance APR, and the annualized cost.',
			'h1'               => 'Credit Card Cash Advance Calculator',
			'dek'              => 'See the full cost of a credit card cash advance: the fee, interest that starts the same day, and what it works out to per year.',
			'target_keyword'   => 'cash advance calculator',
			'calc_id'          => 'cashadvance',
			'js'               => 'calc-cash-advance.js',
			'sources'          => array( 'cfpb-cash-advance', 'regz-1026-53' ),
			'related'          => array( 'credit-card-apr-calculator', 'daily-periodic-rate-calculator', 'credit-card-interest-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'How much does a credit card cash advance cost?',
					'a' => 'Usually a fee of about 3-5% of the amount (often with a $10 minimum), plus interest at the cash advance APR from the day you take the money, plus any ATM operator fee. In this calculator\'s example, $500 repaid after 30 days costs about $40.94 in total.',
				),
				array(
					'q' => 'Is there a grace period on a cash advance?',
					'a' => 'Generally no. According to the CFPB, interest on a cash advance usually starts as soon as you take the money out, unlike purchases, which often have a grace period if you pay your statement balance in full.',
				),
				array(
					'q' => 'Why is the annualized cost so much higher than the APR?',
					'a' => 'Because the one-time fee is charged up front. A 5% fee on money you repay in 30 days works out to roughly 60% a year on its own, before any interest. The shorter the time you keep the cash, the higher the annualized cost of the fee.',
				),
				array(
					'q' => 'Does paying it back quickly help?',
					'a' => 'Yes, but only for the interest. Interest stops growing once the cash advance is repaid, but the fee is already charged and doesn\'t shrink.',
				),
				array(
					'q' => 'How are payments applied if I also have purchases on the card?',
					'a' => 'In the U.S., the amount you pay above the minimum generally must go to the balance with the highest APR first, which is often the cash advance. The minimum payment itself can be applied as the issuer chooses.',
				),
				array(
					'q' => 'Do convenience checks and cash-like purchases count as cash advances?',
					'a' => 'Often yes. Convenience checks, some money transfers, and buying gift cards or cryptocurrency can be treated as cash advances, with the same fee and APR. Check your cardholder agreement.',
				),
			),
		),

		'biweekly-payment-calculator' => array(
			'slug'             => 'biweekly-payment-calculator',
			'title'            => 'Bi-Weekly Credit Card Payment Calculator',
			'seo_title'        => 'Bi-Weekly vs. Monthly Credit Card Payment Calculator',
			'meta_description' => 'Does paying your credit card every two weeks save money? Compare bi-weekly and monthly payments: payoff time, interest saved, and where the saving comes from.',
			'h1'               => 'Bi-Weekly vs. Monthly Credit Card Payment Calculator',
			'dek'              => 'See how much paying half your payment every two weeks saves, and how much of it you would get just by paying a little more each month.',
			'target_keyword'   => 'biweekly credit card payment calculator',
			'calc_id'          => 'biweekly',
			'js'               => 'calc-biweekly.js',
			'sources'          => array( 'regz-1026-5', 'regz-1026-53' ),
			'related'          => array( 'extra-payment-savings-calculator', 'credit-card-payoff-calculator', 'credit-card-interest-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'Is it better to pay a credit card weekly, bi-weekly, or monthly?',
					'a' => 'Paying more often lowers your average daily balance a little, which trims interest, and bi-weekly payments add up to 13 monthly payments a year instead of 12. On $5,000 at 22.99% APR, $100 every two weeks instead of $200 a month saves about $248 in interest, but $208 of that comes from the extra money paid each year.',
				),
				array(
					'q' => 'Can I make more than one credit card payment a month?',
					'a' => 'Most issuers accept multiple payments in a billing cycle. Check how quickly yours posts payments, and make sure at least the minimum is paid by each due date.',
				),
				array(
					'q' => 'Does paying twice a month help my credit score?',
					'a' => 'It can, if it lowers the balance reported at your statement closing date, which lowers your credit utilization. Paying on time every month matters most.',
				),
				array(
					'q' => 'Why does the calculator say most of the saving comes from the extra payment?',
					'a' => 'Twenty-six half-payments a year equal thirteen full monthly payments, so a bi-weekly plan quietly pays one extra month each year. Paying that same yearly amount in monthly installments gets most of the same saving.',
				),
			),
		),

		'credit-card-interest-charge-checker' => array(
			'slug'             => 'credit-card-interest-charge-checker',
			'title'            => 'Credit Card Interest Charge Checker',
			'seo_title'        => 'Credit Card Interest Charge Checker — Is Your Bill Right?',
			'meta_description' => 'Check the interest charge on your credit card statement: compare it with what your APR should produce, see the APR it implies, and why it might be higher.',
			'h1'               => 'Credit Card Interest Charge Checker',
			'dek'              => 'Enter the numbers from your statement to see whether the interest charge matches your APR, and what to look for if it doesn\'t.',
			'target_keyword'   => 'how to calculate interest charge on credit card',
			'calc_id'          => 'interestcheck',
			'js'               => 'calc-interest-check.js',
			'sources'          => array( 'cfpb-grace', 'cfpb-cash-advance', 'regz-1026-55' ),
			'related'          => array( 'daily-periodic-rate-calculator', 'credit-card-interest-calculator', 'cash-advance-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'How is the interest charge on my credit card statement calculated?',
					'a' => 'Most issuers multiply your average daily balance by the daily periodic rate (APR ÷ 365) and by the number of days in the billing cycle, often compounding daily. A $2,033.33 average daily balance at 24.99% APR over 30 days comes to about $41.76.',
				),
				array(
					'q' => 'Why was I charged interest after paying my balance in full?',
					'a' => 'Usually it is residual (trailing) interest: interest that built up between your statement closing date and the day your payment arrived, after a month when you carried a balance. It typically stops once you pay in full two cycles in a row.',
				),
				array(
					'q' => 'Where do I find my average daily balance?',
					'a' => 'Many statements list it, with the APR and days in the cycle, in the interest charge calculation section near the end. If yours doesn\'t, use your statement balance for a rough check.',
				),
				array(
					'q' => 'What if my interest charge is much higher than expected?',
					'a' => 'Check for a cash advance or balance transfer at a higher APR, a lost grace period, a penalty APR after a late payment, or a promotional rate that ended. If none apply, ask your issuer to explain the charge.',
				),
			),
		),

		'fed-rate-change-credit-card-calculator' => array(
			'slug'             => 'fed-rate-change-credit-card-calculator',
			'title'            => 'Fed Rate Change Credit Card Calculator',
			'seo_title'        => 'Fed Rate Hike or Cut: Credit Card Interest Calculator',
			'meta_description' => 'What does a Fed rate hike or cut do to your credit card? Enter your balance, APR, and payment to see your new APR, monthly interest, and total cost.',
			'h1'               => 'Fed Rate Hike or Cut: What It Means for Your Credit Card',
			'dek'              => 'See how a Federal Reserve rate change moves your card\'s APR, this month\'s interest, and the total cost of paying off your balance.',
			'target_keyword'   => 'fed rate cut credit card interest',
			'calc_id'          => 'fedrate',
			'js'               => 'calc-fed-rate.js',
			'sources'          => array( 'fed-fomc', 'fed-g19', 'regz-1026-9' ),
			'related'          => array( 'credit-card-interest-calculator', 'balance-transfer-calculator', 'extra-payment-savings-calculator' ),
			'faqs'             => array(
				array(
					'q' => 'Does a Fed rate cut lower my credit card interest?',
					'a' => 'Yes, if your card has a variable APR, which most do. Your APR is the prime rate plus a margin, and the prime rate moves with the Fed, so a 0.25-point cut lowers your APR by 0.25 point, usually within one or two billing cycles. On a $5,000 balance that saves about $1.04 a month.',
				),
				array(
					'q' => 'How soon does a Fed rate change affect my credit card?',
					'a' => 'Banks usually change the prime rate the day after a Fed decision. Your card\'s APR then changes on the date your cardholder agreement sets, often the start of the next billing cycle, so you will usually see it on your next statement or the one after.',
				),
				array(
					'q' => 'Will my card issuer tell me before my APR changes?',
					'a' => 'Not necessarily. Federal rules don\'t require advance notice when a variable APR changes because the index it follows, such as the prime rate, changed. The new rate appears on your statement.',
				),
				array(
					'q' => 'Is it worth waiting for a Fed cut before paying off my card?',
					'a' => 'No. A 0.25-point cut saves about $1 a month on $5,000, while every dollar you pay now stops costing you your full APR. Paying even $10 more a month saves more than a quarter-point cut.',
				),
			),
		),

	);

	return $calculators;
}

/**
 * Look up a single calculator entry by slug.
 */
function cmc_get_calculator( $slug ) {
	$all = cmc_calculators();
	return isset( $all[ $slug ] ) ? $all[ $slug ] : null;
}

/**
 * Resolve the calculator entry (if any) tied to the currently-queried page,
 * matched by post slug. Used by functions.php to decide which JS to enqueue,
 * and by page-calculator.php to render the right content.
 */
function cmc_get_calculator_for_current_page() {
	if ( ! is_page() ) {
		return null;
	}
	$slug = get_post_field( 'post_name', get_queried_object_id() );
	return cmc_get_calculator( $slug );
}

/**
 * Load the long-form HTML body fragment for a calculator from
 * /content/calculators/{slug}.html. Returns an array with 'before' and
 * 'after' halves, split on the <!-- CALC_WIDGET --> marker so the template
 * can drop the interactive tool in between.
 */
function cmc_get_calculator_body( $slug ) {
	$path = CMC_THEME_DIR . '/content/calculators/' . $slug . '.html';
	if ( ! file_exists( $path ) ) {
		return array( 'before' => '', 'after' => '' );
	}
	$html = file_get_contents( $path );
	$parts = explode( '<!-- CALC_WIDGET -->', $html );
	return array(
		'before' => isset( $parts[0] ) ? $parts[0] : '',
		'after'  => isset( $parts[1] ) ? $parts[1] : '',
	);
}
