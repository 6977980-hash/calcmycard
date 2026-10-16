// Loads theme/calcmycard/assets/js/finance-math.js (a browser script that
// attaches CMCFinance to window) into a Node vm context for unit tests.
'use strict';
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const vm = require( 'node:vm' );

const SRC = path.join( __dirname, '..', 'theme', 'calcmycard', 'assets', 'js', 'finance-math.js' );

module.exports = function loadFinance() {
	const sandbox = { window: {} };
	vm.createContext( sandbox );
	vm.runInContext( fs.readFileSync( SRC, 'utf8' ), sandbox, { filename: SRC } );
	return sandbox.window.CMCFinance;
};
