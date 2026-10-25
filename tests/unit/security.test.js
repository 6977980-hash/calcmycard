// Server hardening guards (25 Oct 2026 audit, Phase 5). Runs offline on the
// theme files.
'use strict';
const test = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );

const THEME = path.join( __dirname, '..', '..', 'theme', 'calcmycard' );

test( 'A25-018: XML-RPC and pingbacks stay off', () => {
	const src = fs.readFileSync( path.join( THEME, 'inc', 'hardening.php' ), 'utf8' );
	assert.match( src, /add_filter\(\s*'xmlrpc_enabled',\s*'__return_false'\s*\)/ );
	assert.match( src, /add_filter\(\s*'xmlrpc_methods',\s*'__return_empty_array'\s*\)/ );
	assert.match( src, /unset\(\s*\$headers\['X-Pingback'\]\s*\)/ );
	assert.match( src, /defined\(\s*'XMLRPC_REQUEST'\s*\)[\s\S]{0,80}status_header\(\s*403\s*\)/ );
	assert.ok( fs.readFileSync( path.join( THEME, 'functions.php' ), 'utf8' ).includes( "/inc/hardening.php'" ) );
} );
