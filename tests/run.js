var analyze = require('../src/index').analyze;
var compare = require('../src/index').compare;
var path = require('path');
var fs = require('fs');
var TEST_DIR = path.join(__dirname, '..', 'test-project');
var passed = 0, failed = 0;
function assert(c,n){if(c){passed++;console.log('  PASS: '+n)}else{failed++;console.error('  FAIL: '+n)}}
function run(){
  console.log('CodeSight Tests\n');
  var d = path.join(TEST_DIR,'src');
  fs.mkdirSync(d,{recursive:true});
  fs.writeFileSync(path.join(d,'app.js'),"// Entry\nfunction start(p){console.log('port '+p)}\nmodule.exports={start:start};\n");
  fs.writeFileSync(path.join(d,'utils.js'),"// Helpers\nfunction add(a,b){return a+b}\nmodule.exports={add:add};\n");
  var s=analyze(TEST_DIR);
  assert(s.files===2,'counts files');
  assert(s.functions>=2,'counts functions');
  assert(s.comments>=1,'counts comments');
  assert(s.exports>=2,'counts exports');
  assert(s.score>=0&&s.score<=100,'score in range');
  assert(compare(TEST_DIR,TEST_DIR).delta.files===0,'compare no diff');
  fs.rmSync(TEST_DIR,{recursive:true,force:true});
  console.log('\nResults: '+passed+' passed, '+failed+' failed');
  if(failed>0)process.exit(1);
}
run();
