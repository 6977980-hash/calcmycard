<?php
/**
 * JSON-LD structured data, emitted as ONE connected @graph per page:
 *
 *   Every page ....... Organization (#organization) + WebSite (#website)
 *   Calculator pages . WebPage + FAQPage (#webpage), WebApplication
 *                      (#calculator), BreadcrumbList (#breadcrumb)
 *   Guide pages ...... WebPage (#webpage), Article (#article),
 *                      BreadcrumbList (#breadcrumb)
 *   Other pages ...... WebPage (#webpage), BreadcrumbList (#breadcrumb)
 *
 * Honesty rules (Google structured-data guidelines):
 *   - No Review, AggregateRating, or rating of any kind — we have none.
 *   - No invented people. The author is Ali Ahmad, the site's founder
 *     (see cmc_schema_author() below); there is no separate editorial team.
 *   - No FinancialService / expert credentials we can't substantiate.
 *   - Dates are the real post dates from WordPress, and the same dates are
 *     shown on the page (see cmc_render_updated_line()).
 *   - Every FAQ in the schema is rendered visibly on the same page.
 *
 * SEO plugins:
 *   - RankMath (Schema module on): our nodes are MERGED into RankMath's own
 *     @graph via the 'rank_math/json_ld' filter. Any node RankMath already
 *     outputs (same @id, or same singleton type such as Organization,
 *     WebSite, BreadcrumbList, WebPage, Article) is kept as RankMath's and
 *     ours is skipped, so there's one graph and no duplicates. RankMath and
 *     this theme use the same @id scheme (#organization, #website,
 *     {url}#webpage, {url}#breadcrumb), so references resolve.
 *   - Yoast: we only output the nodes it can't build (WebApplication + FAQ).
 *   - No plugin: we output the full graph ourselves.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cmc_json_ld( $data ) {
	echo '<script type="application/ld+json">' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
}

/**
 * Site name/tagline as plain text. WordPress stores these HTML-escaped
 * (e.g. "&amp;"), which would otherwise leak into the JSON-LD.
 */
function cmc_schema_bloginfo( $key ) {
	$value = get_bloginfo( $key );
	// Decode until stable, in case the value was saved double-escaped.
	for ( $i = 0; $i < 3; $i++ ) {
		$decoded = html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		if ( $decoded === $value ) {
			break;
		}
		$value = $decoded;
	}
	return $value;
}

/* --------------------------------------------------------------------------
 * Stable @id helpers
 * ----------------------------------------------------------------------- */

function cmc_schema_id( $fragment, $url = null ) {
	return ( $url ? $url : home_url( '/' ) ) . '#' . $fragment;
}

function cmc_schema_page_url() {
	$url = function_exists( 'cmc_current_canonical' ) ? cmc_current_canonical() : '';
	return $url ? $url : get_permalink( get_queried_object_id() );
}

/* --------------------------------------------------------------------------
 * Images
 * ----------------------------------------------------------------------- */

/**
 * Organization logo, in order of preference:
 *   1. RankMath's Knowledge Graph logo (Titles & Meta > Local SEO), if set,
 *      so the homepage and inner pages show the same logo;
 *   2. the Site Icon (square, 512px);
 *   3. the Customizer Site Logo, only if it's at least 112x112 (Google's
 *      minimum for Organization logos — a wide 240x80 lockup doesn't
 *      qualify).
 * Returns null if none qualifies — we don't invent a logo.
 */
function cmc_schema_logo() {
	$candidates = array();
	if ( class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'get_settings' ) ) {
		$candidates[] = (int) \RankMath\Helper::get_settings( 'titles.knowledgegraph_logo_id' );
	}
	$candidates[] = (int) get_option( 'site_icon' );
	$candidates[] = (int) get_theme_mod( 'custom_logo' );

	foreach ( array_filter( $candidates ) as $id ) {
		$img = wp_get_attachment_image_src( $id, 'full' );
		if ( $img && (int) $img[1] >= 112 && (int) $img[2] >= 112 ) {
			return array(
				'@type'  => 'ImageObject',
				'@id'    => cmc_schema_id( 'logo' ),
				'url'    => $img[0],
				'width'  => (int) $img[1],
				'height' => (int) $img[2],
			);
		}
	}
	return null;
}

/**
 * Primary image for a page: its featured image if one is set, otherwise the
 * site's default 1200x630 share image (the same image used for og:image).
 */
function cmc_schema_primary_image( $post_id, $page_url ) {
	if ( has_post_thumbnail( $post_id ) ) {
		$img = wp_get_attachment_image_src( get_post_thumbnail_id( $post_id ), 'full' );
		if ( $img ) {
			return array(
				'@type'  => 'ImageObject',
				'@id'    => cmc_schema_id( 'primaryimage', $page_url ),
				'url'    => $img[0],
				'width'  => (int) $img[1],
				'height' => (int) $img[2],
			);
		}
	}
	return array(
		'@type'  => 'ImageObject',
		'@id'    => cmc_schema_id( 'primaryimage', $page_url ),
		'url'    => cmc_default_social_image(),
		'width'  => 1200,
		'height' => 630,
	);
}

/* --------------------------------------------------------------------------
 * Site-level nodes
 * ----------------------------------------------------------------------- */

function cmc_schema_organization() {
	$org = array(
		'@type' => 'Organization',
		'@id'   => cmc_schema_id( 'organization' ),
		'name'  => cmc_schema_bloginfo( 'name' ),
		'url'   => home_url( '/' ),
	);
	$logo = cmc_schema_logo();
	if ( $logo ) {
		$org['logo']  = $logo;
		$org['image'] = array( '@id' => $logo['@id'] );
	}
	/**
	 * Real, official profiles only (e.g. your X/LinkedIn page URLs).
	 * Empty by default — nothing is listed that doesn't exist.
	 */
	$same_as = array_values( array_filter( (array) apply_filters( 'cmc_schema_same_as', array() ) ) );
	if ( $same_as ) {
		$org['sameAs'] = $same_as;
	}
	return $org;
}

function cmc_schema_website() {
	return array(
		'@type'      => 'WebSite',
		'@id'        => cmc_schema_id( 'website' ),
		'name'       => cmc_schema_bloginfo( 'name' ),
		'url'        => home_url( '/' ),
		'inLanguage' => get_bloginfo( 'language' ),
		'publisher'  => array( '@id' => cmc_schema_id( 'organization' ) ),
	);
}

/**
 * Author for guides and calculators: Ali Ahmad (a real, named person),
 * with his profile on the About page and his LinkedIn as sameAs. Only the
 * role he actually holds (founder) is stated — no invented credentials.
 * Change the person in cmc_site_author() (inc/helpers.php).
 */
function cmc_schema_author() {
	$a = function_exists( 'cmc_site_author' ) ? cmc_site_author() : null;
	if ( ! $a ) {
		return array(
			'@type' => 'Organization',
			'@id'   => cmc_schema_id( 'organization' ),
		);
	}
	$person = array(
		'@type'    => 'Person',
		'@id'      => cmc_schema_id( 'author-ali-ahmad' ),
		'name'     => $a['name'],
		'url'      => $a['url'],
		'jobTitle' => 'Founder',
		'worksFor' => array( '@id' => cmc_schema_id( 'organization' ) ),
	);
	if ( ! empty( $a['linkedin'] ) ) {
		$person['sameAs'] = array( $a['linkedin'] );
	}
	return apply_filters( 'cmc_schema_author', $person );
}

/* --------------------------------------------------------------------------
 * Page-level nodes
 * ----------------------------------------------------------------------- */

function cmc_schema_breadcrumb( array $crumbs, $page_url ) {
	$items = array();
	$last  = count( $crumbs ) - 1;
	foreach ( $crumbs as $i => $crumb ) {
		$item = array(
			'@type'    => 'ListItem',
			'position' => $i + 1,
			'name'     => $crumb['label'],
		);
		// The current page is the last item; Google allows omitting its URL,
		// but we include the canonical so the list is unambiguous.
		$item['item'] = ( $i === $last ) ? $page_url : $crumb['url'];
		$items[]      = $item;
	}
	return array(
		'@type'           => 'BreadcrumbList',
		'@id'             => cmc_schema_id( 'breadcrumb', $page_url ),
		'itemListElement' => $items,
	);
}

function cmc_schema_webpage( $post_id, $page_url, $name, $description, $types = 'WebPage', $has_breadcrumb = true ) {
	$page = array(
		'@type'         => $types,
		'@id'           => cmc_schema_id( 'webpage', $page_url ),
		'url'           => $page_url,
		'name'          => $name,
		'isPartOf'      => array( '@id' => cmc_schema_id( 'website' ) ),
		'inLanguage'    => get_bloginfo( 'language' ),
		'datePublished' => get_the_date( 'c', $post_id ),
		'dateModified'  => get_the_modified_date( 'c', $post_id ),
		'primaryImageOfPage' => array( '@id' => cmc_schema_id( 'primaryimage', $page_url ) ),
	);
	if ( $description ) {
		$page['description'] = $description;
	}
	if ( $has_breadcrumb ) {
		$page['breadcrumb'] = array( '@id' => cmc_schema_id( 'breadcrumb', $page_url ) );
	}
	return $page;
}

function cmc_schema_faq_questions( array $faqs ) {
	$entities = array();
	foreach ( $faqs as $faq ) {
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $faq['q'],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => wp_strip_all_tags( $faq['a'] ),
			),
		);
	}
	return $entities;
}

/**
 * The calculator itself: a free, browser-based tool. No rating/review
 * properties — we have no genuine ratings to report.
 */
function cmc_schema_calculator( array $calc, $page_url ) {
	return array(
		'@type'               => 'WebApplication',
		'@id'                 => cmc_schema_id( 'calculator', $page_url ),
		'name'                => $calc['title'],
		'url'                 => $page_url,
		'description'         => $calc['meta_description'],
		'applicationCategory' => 'FinanceApplication',
		'operatingSystem'     => 'Any',
		'browserRequirements' => 'Requires JavaScript',
		'isAccessibleForFree' => true,
		'offers'              => array(
			'@type'         => 'Offer',
			'price'         => '0',
			'priceCurrency' => 'USD',
		),
		'publisher'           => array( '@id' => cmc_schema_id( 'organization' ) ),
		'creator'             => cmc_schema_author(),
		'mainEntityOfPage'    => array( '@id' => cmc_schema_id( 'webpage', $page_url ) ),
	);
}

function cmc_schema_article( array $article, $post_id, $page_url ) {
	$headline = $article['title'];
	if ( function_exists( 'mb_strlen' ) && mb_strlen( $headline ) > 110 ) {
		$headline = mb_substr( $headline, 0, 107 ) . '...';
	}
	$author = cmc_schema_author();
	return array(
		'@type'            => 'Article',
		'@id'              => cmc_schema_id( 'article', $page_url ),
		'headline'         => $headline,
		'description'      => $article['meta_description'],
		'url'              => $page_url,
		'image'            => array( '@id' => cmc_schema_id( 'primaryimage', $page_url ) ),
		'datePublished'    => get_the_date( 'c', $post_id ),
		'dateModified'     => get_the_modified_date( 'c', $post_id ),
		'author'           => array( $author ),
		'publisher'        => array( '@id' => cmc_schema_id( 'organization' ) ),
		'mainEntityOfPage' => array( '@id' => cmc_schema_id( 'webpage', $page_url ) ),
		'isPartOf'         => array( '@id' => cmc_schema_id( 'webpage', $page_url ) ),
		'inLanguage'       => get_bloginfo( 'language' ),
		'articleSection'   => 'Guides',
	);
}

/* --------------------------------------------------------------------------
 * Graph builder + output
 * ----------------------------------------------------------------------- */

/**
 * Is RankMath's Schema (rich snippet) module running? If so, it prints its
 * own JSON-LD and we merge into it instead of printing a second block.
 */
function cmc_rank_math_schema_active() {
	if ( ! defined( 'RANK_MATH_VERSION' ) ) {
		return false;
	}
	if ( class_exists( '\RankMath\Helper' ) && method_exists( '\RankMath\Helper', 'is_module_active' ) ) {
		return (bool) \RankMath\Helper::is_module_active( 'rich-snippet' );
	}
	return true;
}

/**
 * Build the full list of graph nodes for the current request.
 *
 * @param bool $minimal Only the nodes an SEO plugin can't build (Yoast mode).
 * @return array List of schema nodes (no @context).
 */
function cmc_build_schema_graph( $minimal = false ) {
	if ( ! cmc_is_indexable_request() ) {
		return array();
	}

	$graph = array();
	if ( ! $minimal ) {
		$graph[] = cmc_schema_organization();
		$graph[] = cmc_schema_website();
	}

	if ( is_front_page() ) {
		if ( $minimal ) {
			return $graph;
		}
		$post_id  = (int) get_option( 'page_on_front' );
		$page_url = home_url( '/' );
		$page     = array(
			'@type'      => 'WebPage',
			'@id'        => cmc_schema_id( 'webpage', $page_url ),
			'url'        => $page_url,
			'name'       => wp_get_document_title(),
			'isPartOf'   => array( '@id' => cmc_schema_id( 'website' ) ),
			'about'      => array( '@id' => cmc_schema_id( 'organization' ) ),
			'inLanguage' => get_bloginfo( 'language' ),
		);
		if ( cmc_schema_bloginfo( 'description' ) ) {
			$page['description'] = cmc_schema_bloginfo( 'description' );
		}
		if ( $post_id ) {
			$page['datePublished'] = get_the_date( 'c', $post_id );
			$page['dateModified']  = get_the_modified_date( 'c', $post_id );
		}
		$graph[] = $page;
		return $graph;
	}

	if ( ! is_page() ) {
		return $graph;
	}

	$post_id  = get_queried_object_id();
	$page_url = cmc_schema_page_url();
	$slug     = get_post_field( 'post_name', $post_id );
	$calc     = cmc_get_calculator( $slug );
	$article  = $calc ? null : cmc_get_article( $slug );

	if ( $calc ) {
		if ( $minimal ) {
			$graph[] = array(
				'@type'      => 'FAQPage',
				'@id'        => cmc_schema_id( 'faq', $page_url ),
				'url'        => $page_url,
				'mainEntity' => cmc_schema_faq_questions( $calc['faqs'] ),
			);
			$tool              = cmc_schema_calculator( $calc, $page_url );
			$tool['publisher'] = array(
				'@type' => 'Organization',
				'name'  => cmc_schema_bloginfo( 'name' ),
				'url'   => home_url( '/' ),
			);
			unset( $tool['mainEntityOfPage'] );
			$graph[] = $tool;
			return $graph;
		}
		$page               = cmc_schema_webpage( $post_id, $page_url, $calc['seo_title'], $calc['meta_description'], array( 'WebPage', 'FAQPage' ) );
		$page['mainEntity'] = cmc_schema_faq_questions( $calc['faqs'] );
		$page['hasPart']    = array( '@id' => cmc_schema_id( 'calculator', $page_url ) );
		$graph[]            = $page;
		$graph[]            = cmc_schema_primary_image( $post_id, $page_url );
		$graph[]            = cmc_schema_breadcrumb( cmc_get_breadcrumb_trail(), $page_url );
		$graph[]            = cmc_schema_calculator( $calc, $page_url );
		return $graph;
	}

	if ( $minimal ) {
		return $graph;
	}

	if ( $article ) {
		$graph[] = cmc_schema_webpage( $post_id, $page_url, $article['seo_title'], $article['meta_description'] );
		$graph[] = cmc_schema_primary_image( $post_id, $page_url );
		$graph[] = cmc_schema_article( $article, $post_id, $page_url );
		$graph[] = cmc_schema_breadcrumb( cmc_get_breadcrumb_trail(), $page_url );
		return $graph;
	}

	// Hubs (/calculators/, /guides/) and static pages (About, Methodology, ...).
	$type    = in_array( $slug, array( 'calculators', 'guides' ), true ) ? 'CollectionPage' : ( 'about' === $slug ? 'AboutPage' : ( 'contact' === $slug ? 'ContactPage' : 'WebPage' ) );
	$graph[] = cmc_schema_webpage( $post_id, $page_url, get_the_title( $post_id ), cmc_current_meta_description(), $type );
	$graph[] = cmc_schema_primary_image( $post_id, $page_url );
	$graph[] = cmc_schema_breadcrumb( cmc_get_breadcrumb_trail(), $page_url );
	return $graph;
}

/**
 * Standalone output (no SEO plugin, Yoast, or RankMath with its Schema
 * module turned off).
 */
function cmc_output_schema() {
	if ( cmc_rank_math_schema_active() ) {
		return; // Merged into RankMath's graph instead — see below.
	}
	$minimal = defined( 'WPSEO_VERSION' );
	$graph   = cmc_build_schema_graph( $minimal );
	if ( $graph ) {
		cmc_json_ld( array(
			'@context' => 'https://schema.org',
			'@graph'   => $graph,
		) );
	}
}
add_action( 'wp_head', 'cmc_output_schema', 5 );

/**
 * RankMath: merge our nodes into its @graph, skipping anything it already
 * provides, so the page has exactly one connected graph.
 */
function cmc_merge_into_rank_math_graph( $data, $jsonld = null ) {
	if ( ! is_array( $data ) ) {
		return $data;
	}
	$singletons = array( 'Organization', 'Person', 'WebSite', 'BreadcrumbList', 'WebPage', 'CollectionPage', 'AboutPage', 'ContactPage', 'FAQPage', 'Article', 'BlogPosting', 'NewsArticle' );

	$have_ids   = array();
	$have_types = array();
	foreach ( $data as $node ) {
		if ( ! is_array( $node ) ) {
			continue;
		}
		if ( ! empty( $node['@id'] ) ) {
			$have_ids[ $node['@id'] ] = true;
		}
		foreach ( (array) ( isset( $node['@type'] ) ? $node['@type'] : array() ) as $t ) {
			$have_types[ $t ] = true;
		}
	}

	foreach ( cmc_build_schema_graph() as $i => $node ) {
		if ( ! empty( $node['@id'] ) && isset( $have_ids[ $node['@id'] ] ) ) {
			// Same entity already in RankMath's graph: keep RankMath's node,
			// but fill in properties it left out (e.g. Organization url/logo).
			foreach ( $data as $k => $existing ) {
				if ( is_array( $existing ) && isset( $existing['@id'] ) && $existing['@id'] === $node['@id'] ) {
					$data[ $k ] = $existing + $node;
				}
			}
			continue;
		}
		$dup = false;
		foreach ( (array) $node['@type'] as $t ) {
			if ( in_array( $t, $singletons, true ) && isset( $have_types[ $t ] ) ) {
				$dup = true;
				break;
			}
		}
		if ( $dup ) {
			continue;
		}
		$data[ 'cmc_' . $i ] = $node;
	}
	return $data;
}
add_filter( 'rank_math/json_ld', 'cmc_merge_into_rank_math_graph', 99, 2 );

/**
 * Keep RankMath's breadcrumb labels (visible + BreadcrumbList schema) in
 * line with the theme's trail, e.g. "How Does Credit Card Interest Work?"
 * instead of the full H1.
 */
function cmc_rank_math_breadcrumb_items( $crumbs ) {
	if ( ! is_array( $crumbs ) || ! is_page() || is_front_page() ) {
		return $crumbs;
	}
	$trail = cmc_get_breadcrumb_trail();
	$last  = end( $trail );
	$keys  = array_keys( $crumbs );
	$k     = end( $keys );
	if ( $last && null !== $k && isset( $crumbs[ $k ][0] ) ) {
		$crumbs[ $k ][0] = $last['label'];
	}
	return $crumbs;
}
add_filter( 'rank_math/frontend/breadcrumb/items', 'cmc_rank_math_breadcrumb_items', 20 );
