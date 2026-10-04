<?php
/**
 * Parses JSON/CSV and creates or updates posts, matched by slug + post type.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CMCI_Importer {

	const META_FAQ = '_cmci_faq';

	/** @var bool */
	private $dry_run;

	public function __construct( $dry_run = false ) {
		$this->dry_run = (bool) $dry_run;
	}

	/**
	 * Turn an uploaded file into a list of item arrays.
	 *
	 * @return array|WP_Error
	 */
	public function parse_file( $path, $filename ) {
		$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );
		$raw = file_get_contents( $path );
		if ( false === $raw || '' === trim( $raw ) ) {
			return new WP_Error( 'cmci_empty', __( 'The file is empty.', 'calcmycard-content-importer' ) );
		}
		$raw = preg_replace( '/^\xEF\xBB\xBF/', '', $raw );

		if ( 'json' === $ext ) {
			$data = json_decode( $raw, true );
			if ( JSON_ERROR_NONE !== json_last_error() ) {
				return new WP_Error( 'cmci_json', sprintf( __( 'Invalid JSON: %s', 'calcmycard-content-importer' ), json_last_error_msg() ) );
			}
			if ( isset( $data['items'] ) && is_array( $data['items'] ) ) {
				$data = $data['items'];
			} elseif ( isset( $data['title'] ) ) {
				$data = array( $data );
			}
			return is_array( $data ) ? array_values( $data ) : array();
		}

		if ( 'csv' === $ext ) {
			return $this->parse_csv( $raw );
		}

		return new WP_Error( 'cmci_type', __( 'Only .json and .csv files are supported.', 'calcmycard-content-importer' ) );
	}

	private function parse_csv( $raw ) {
		$handle = fopen( 'php://temp', 'r+' );
		fwrite( $handle, $raw );
		rewind( $handle );

		$header = fgetcsv( $handle );
		if ( ! $header ) {
			return new WP_Error( 'cmci_csv', __( 'CSV has no header row.', 'calcmycard-content-importer' ) );
		}
		$header = array_map( function ( $h ) {
			return sanitize_key( trim( $h ) );
		}, $header );

		$items = array();
		while ( ( $row = fgetcsv( $handle ) ) !== false ) {
			if ( array( null ) === $row ) {
				continue;
			}
			$row  = array_pad( $row, count( $header ), '' );
			$item = array_combine( $header, array_slice( $row, 0, count( $header ) ) );

			// CSV: "a|b" lists and "faq" as JSON or "Q::A||Q::A".
			foreach ( array( 'categories', 'tags' ) as $list ) {
				if ( isset( $item[ $list ] ) && '' !== $item[ $list ] ) {
					$item[ $list ] = array_map( 'trim', explode( '|', $item[ $list ] ) );
				}
			}
			if ( ! empty( $item['faq'] ) ) {
				$item['faq'] = $this->parse_csv_faq( $item['faq'] );
			}
			$items[] = $item;
		}
		fclose( $handle );
		return $items;
	}

	private function parse_csv_faq( $value ) {
		$json = json_decode( $value, true );
		if ( is_array( $json ) ) {
			return $json;
		}
		$faq = array();
		foreach ( explode( '||', $value ) as $pair ) {
			$parts = explode( '::', $pair, 2 );
			if ( 2 === count( $parts ) ) {
				$faq[] = array( 'question' => trim( $parts[0] ), 'answer' => trim( $parts[1] ) );
			}
		}
		return $faq;
	}

	/**
	 * Import a list of items.
	 *
	 * @return array Per-item results: [ 'title', 'action', 'id', 'message' ].
	 */
	public function import( array $items ) {
		$results = array();
		foreach ( $items as $i => $item ) {
			$results[] = is_array( $item )
				? $this->import_item( $item )
				: array( 'title' => '#' . ( $i + 1 ), 'action' => 'error', 'id' => 0, 'message' => __( 'Item is not an object.', 'calcmycard-content-importer' ) );
		}
		return $results;
	}

	private function import_item( array $item ) {
		$title = isset( $item['title'] ) ? sanitize_text_field( $item['title'] ) : '';
		if ( '' === $title ) {
			return array( 'title' => '(no title)', 'action' => 'error', 'id' => 0, 'message' => __( 'Missing title.', 'calcmycard-content-importer' ) );
		}

		$post_type = isset( $item['post_type'] ) ? sanitize_key( $item['post_type'] ) : 'post';
		if ( ! post_type_exists( $post_type ) ) {
			return array( 'title' => $title, 'action' => 'error', 'id' => 0, 'message' => sprintf( __( 'Unknown post type "%s".', 'calcmycard-content-importer' ), $post_type ) );
		}

		$slug     = sanitize_title( ! empty( $item['slug'] ) ? $item['slug'] : $title );
		$existing = get_page_by_path( $slug, OBJECT, $post_type );
		$statuses = array( 'publish', 'draft', 'pending', 'private', 'future' );
		$status   = isset( $item['status'] ) && in_array( $item['status'], $statuses, true ) ? $item['status'] : 'draft';

		$postarr = array(
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_type'    => $post_type,
			'post_status'  => $status,
			'post_content' => isset( $item['content'] ) ? wp_kses_post( $item['content'] ) : '',
			'post_excerpt' => isset( $item['excerpt'] ) ? sanitize_textarea_field( $item['excerpt'] ) : '',
		);
		if ( ! empty( $item['date'] ) && strtotime( $item['date'] ) ) {
			$postarr['post_date'] = gmdate( 'Y-m-d H:i:s', strtotime( $item['date'] ) );
		}
		if ( ! empty( $item['parent'] ) && 'page' === $post_type ) {
			$parent = get_page_by_path( sanitize_title( $item['parent'] ), OBJECT, 'page' );
			if ( $parent ) {
				$postarr['post_parent'] = $parent->ID;
			}
		}

		$action = $existing ? 'updated' : 'created';
		if ( $this->dry_run ) {
			return array( 'title' => $title, 'action' => 'would be ' . $action, 'id' => $existing ? $existing->ID : 0, 'message' => '/' . $slug );
		}

		if ( $existing ) {
			$postarr['ID'] = $existing->ID;
			$post_id       = wp_update_post( wp_slash( $postarr ), true );
		} else {
			$post_id = wp_insert_post( wp_slash( $postarr ), true );
		}
		if ( is_wp_error( $post_id ) ) {
			return array( 'title' => $title, 'action' => 'error', 'id' => 0, 'message' => $post_id->get_error_message() );
		}

		if ( 'post' === $post_type ) {
			if ( ! empty( $item['categories'] ) ) {
				wp_set_post_categories( $post_id, $this->term_ids( (array) $item['categories'], 'category' ) );
			}
			if ( ! empty( $item['tags'] ) ) {
				wp_set_post_tags( $post_id, array_map( 'sanitize_text_field', (array) $item['tags'] ) );
			}
		}

		$this->save_seo( $post_id, $item );

		if ( isset( $item['faq'] ) ) {
			$faq = $this->clean_faq( $item['faq'] );
			if ( $faq ) {
				update_post_meta( $post_id, self::META_FAQ, $faq );
			} else {
				delete_post_meta( $post_id, self::META_FAQ );
			}
		}

		if ( ! empty( $item['featured_image'] ) ) {
			$this->set_featured_image( $post_id, esc_url_raw( $item['featured_image'] ), $title );
		}

		return array( 'title' => $title, 'action' => $action, 'id' => $post_id, 'message' => get_permalink( $post_id ) );
	}

	private function term_ids( array $names, $taxonomy ) {
		$ids = array();
		foreach ( $names as $name ) {
			$name = sanitize_text_field( $name );
			if ( '' === $name ) {
				continue;
			}
			$term = term_exists( $name, $taxonomy );
			if ( ! $term ) {
				$term = wp_insert_term( $name, $taxonomy );
			}
			if ( ! is_wp_error( $term ) ) {
				$ids[] = (int) $term['term_id'];
			}
		}
		return $ids;
	}

	/**
	 * Writes SEO fields to whichever SEO plugin is active; falls back to own meta.
	 */
	private function save_seo( $post_id, array $item ) {
		$map = array(
			'seo_title'        => array( '_yoast_wpseo_title', 'rank_math_title', '_cmci_seo_title' ),
			'meta_description' => array( '_yoast_wpseo_metadesc', 'rank_math_description', '_cmci_meta_description' ),
			'focus_keyword'    => array( '_yoast_wpseo_focuskw', 'rank_math_focus_keyword', '_cmci_focus_keyword' ),
			'canonical'        => array( '_yoast_wpseo_canonical', 'rank_math_canonical_url', '_cmci_canonical' ),
		);
		$yoast    = defined( 'WPSEO_VERSION' );
		$rankmath = class_exists( 'RankMath' );

		foreach ( $map as $field => $keys ) {
			if ( ! isset( $item[ $field ] ) || '' === $item[ $field ] ) {
				continue;
			}
			$value = 'canonical' === $field ? esc_url_raw( $item[ $field ] ) : sanitize_text_field( $item[ $field ] );
			if ( $yoast ) {
				update_post_meta( $post_id, $keys[0], $value );
			}
			if ( $rankmath ) {
				update_post_meta( $post_id, $keys[1], $value );
			}
			update_post_meta( $post_id, $keys[2], $value );
		}
	}

	private function clean_faq( $faq ) {
		$clean = array();
		foreach ( (array) $faq as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$q = isset( $row['question'] ) ? sanitize_text_field( $row['question'] ) : '';
			$a = isset( $row['answer'] ) ? wp_kses_post( $row['answer'] ) : '';
			if ( '' !== $q && '' !== $a ) {
				$clean[] = array( 'question' => $q, 'answer' => $a );
			}
		}
		return $clean;
	}

	private function set_featured_image( $post_id, $url, $title ) {
		if ( ! $url || get_post_meta( $post_id, '_cmci_image_source', true ) === $url ) {
			return;
		}
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$attachment_id = media_sideload_image( $url, $post_id, $title, 'id' );
		if ( ! is_wp_error( $attachment_id ) ) {
			set_post_thumbnail( $post_id, $attachment_id );
			update_post_meta( $attachment_id, '_wp_attachment_image_alt', $title );
			update_post_meta( $post_id, '_cmci_image_source', $url );
		}
	}
}
