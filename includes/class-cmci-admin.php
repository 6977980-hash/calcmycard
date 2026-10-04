<?php
/**
 * Tools → CalcMyCard Importer admin screen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class CMCI_Admin {

	const SLUG = 'cmci-importer';

	private $results = null;
	private $error   = '';

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_init', array( $this, 'handle_upload' ) );
	}

	public function menu() {
		add_management_page(
			__( 'CalcMyCard Content Importer', 'calcmycard-content-importer' ),
			__( 'CalcMyCard Importer', 'calcmycard-content-importer' ),
			'edit_others_posts',
			self::SLUG,
			array( $this, 'render' )
		);
	}

	public function handle_upload() {
		if ( empty( $_POST['cmci_submit'] ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_others_posts' ) ) {
			wp_die( esc_html__( 'You are not allowed to import content.', 'calcmycard-content-importer' ) );
		}
		check_admin_referer( 'cmci_import', 'cmci_nonce' );

		if ( empty( $_FILES['cmci_file']['tmp_name'] ) || UPLOAD_ERR_OK !== (int) $_FILES['cmci_file']['error'] ) {
			$this->error = __( 'Please choose a file to upload.', 'calcmycard-content-importer' );
			return;
		}

		$importer = new CMCI_Importer( ! empty( $_POST['cmci_dry_run'] ) );
		$items    = $importer->parse_file(
			$_FILES['cmci_file']['tmp_name'],
			sanitize_file_name( wp_unslash( $_FILES['cmci_file']['name'] ) )
		);
		if ( is_wp_error( $items ) ) {
			$this->error = $items->get_error_message();
			return;
		}
		$this->results = $importer->import( $items );
	}

	public function render() {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'CalcMyCard Content Importer', 'calcmycard-content-importer' ); ?></h1>
			<p><?php esc_html_e( 'Upload a .json or .csv file. Items are matched by slug: existing posts are updated, new ones are created (as draft unless "status" is set).', 'calcmycard-content-importer' ); ?></p>

			<?php if ( $this->error ) : ?>
				<div class="notice notice-error"><p><?php echo esc_html( $this->error ); ?></p></div>
			<?php endif; ?>

			<form method="post" enctype="multipart/form-data">
				<?php wp_nonce_field( 'cmci_import', 'cmci_nonce' ); ?>
				<input type="file" name="cmci_file" accept=".json,.csv" required />
				<label style="margin-left:12px;">
					<input type="checkbox" name="cmci_dry_run" value="1" checked />
					<?php esc_html_e( 'Dry run (preview only, nothing is saved)', 'calcmycard-content-importer' ); ?>
				</label>
				<?php submit_button( __( 'Import', 'calcmycard-content-importer' ), 'primary', 'cmci_submit' ); ?>
			</form>

			<?php if ( is_array( $this->results ) ) : ?>
				<h2><?php esc_html_e( 'Results', 'calcmycard-content-importer' ); ?></h2>
				<table class="widefat striped">
					<thead><tr><th>Title</th><th>Action</th><th>ID</th><th>Details</th></tr></thead>
					<tbody>
					<?php foreach ( $this->results as $row ) : ?>
						<tr>
							<td><?php echo esc_html( $row['title'] ); ?></td>
							<td><?php echo esc_html( $row['action'] ); ?></td>
							<td><?php echo $row['id'] ? '<a href="' . esc_url( get_edit_post_link( $row['id'] ) ) . '">' . (int) $row['id'] . '</a>' : '&ndash;'; ?></td>
							<td><?php echo esc_html( $row['message'] ); ?></td>
						</tr>
					<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>

			<h2><?php esc_html_e( 'File format', 'calcmycard-content-importer' ); ?></h2>
			<p>Fields: <code>title</code> (required), <code>slug</code>, <code>post_type</code> (post/page), <code>status</code>, <code>content</code>, <code>excerpt</code>, <code>date</code>, <code>parent</code>, <code>categories</code>, <code>tags</code>, <code>featured_image</code>, <code>seo_title</code>, <code>meta_description</code>, <code>focus_keyword</code>, <code>canonical</code>, <code>faq</code>.</p>
			<p>CSV: separate categories/tags with <code>|</code>; write FAQ as <code>Question::Answer||Question::Answer</code>. See <code>samples/</code> in the plugin folder.</p>
		</div>
		<?php
	}
}
