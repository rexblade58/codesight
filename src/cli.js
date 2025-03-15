#!/usr/bin/env node

var analyze = require('./index').analyze;
var path = require('path');
var fs = require('fs');

var args = process.argv.slice(2);
var cmd = args[0];

if (!cmd || cmd === '--help') {
  console.log('CodeSight - Code Quality Analyzer');
  console.log('  codesight analyze <dir>');
  process.exit(0);
}

if (cmd === 'analyze') {
  var dir = path.resolve(args[1] || '.');
  if (!fs.existsSync(dir)) { console.error('Not found: ' + dir); process.exit(1); }
  var s = analyze(dir);
  console.log('Files: ' + s.files);
  console.log('Lines: ' + s.lines);
  console.log('Functions: ' + s.functions);
  console.log('Comments: ' + s.comments);
  console.log('Score: ' + s.score + '/100');
}
