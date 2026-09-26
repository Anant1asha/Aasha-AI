#!/usr/bin/env node
/**
 * Aasha Foundation — Comprehensive E2E Test Suite: Class 8 Square and Cube Roots Chapter
 * =======================================================================================
 * File: Aasha-AI/tests/e2e_square_cube_suite.js
 * (Mirrors root tests/e2e_square_cube_suite.js for direct invocation inside Aasha-AI)
 */

const path = require('path');
const fs = require('fs');
const rootSuitePath = path.resolve(__dirname, '..', '..', 'tests', 'e2e_square_cube_suite.js');

if (fs.existsSync(rootSuitePath)) {
  const rootSuiteModule = require(rootSuitePath);
  module.exports = rootSuiteModule;

  if (require.main === module) {
    const { E2ESquareCubeTestSuite } = rootSuiteModule;
    const args = process.argv.slice(2);
    let customFile = null;
    const fileIdx = args.indexOf('--file');
    if (fileIdx !== -1 && args[fileIdx + 1]) {
      customFile = path.resolve(process.cwd(), args[fileIdx + 1]);
    }
    const suite = new E2ESquareCubeTestSuite(customFile);
    const success = suite.runAll();
    process.exit(success ? 0 : 1);
  }
} else {
  console.error("Root test suite not found at: " + rootSuitePath);
  process.exit(1);
}
