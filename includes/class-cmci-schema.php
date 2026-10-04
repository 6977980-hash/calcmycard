<?php
/**
 * Front-end output: FAQPage JSON-LD for imported FAQs, and fallback
 * meta description / canonical when no SEO plugin is active.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CMCI_Schema {

	public function __construct() {
		add_action( 'wp_head', array( $this, 'output_head' ), 5 );
		add_filter( 'pre_get_document_title', array( $this, 'document_title' ), 20 );
	}

	private function seo_plugin_active() {
		return defined( 'WPSEO_VERSION' ) || class_exists( 'RankMath' );
	}

	public function document_title( $title ) {
		if ( is_singular() && ! $this->seo_plugin_active() ) {
			$custom = get_post_meta( get_queried_object_id(), '_cmci_seo_title', true );
			if ( $custom ) {
				return $custom;
			}
		}
		return $title;
	}

	public function output_head() {
		if ( ! is_singular() ) {
			return;
		}
		$post_id = get_queried_object_id();

		if ( ! $this->seo_plugin_active() ) {
			$desc = get_post_meta( $post_id, '_cmci_meta_description', true );
			if ( $desc ) {
				printf( "<meta name=\"description\" content=\"%s\" />\n", esc_attr( $desc ) );
			}
		}

		$faq = get_post_meta( $post_id, CMCI_Importer::META_FAQ, true );
		if ( empty( $faq ) || ! is_array( $faq ) ) {
			return;
		}
		$entities = array();
		foreach ( $faq as $row ) {
			$entities[] = array(
				'@type'          => 'Question',
				'name'           => $row['question'],
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => wp_strip_all_tags( $row['answer'] ),
				),
			);
		}
		$schema = array(
			'@context'   => 'https://schema.org',
			'@type'      => 'FAQPage',
			'mainEntity' => $entities,
		);
		echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
	}
}
