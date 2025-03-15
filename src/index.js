var fs = require('fs');
var path = require('path');

function analyze(dirPath, threshold) {
  if (typeof threshold === 'undefined') threshold = 70;
  var stats = { files: 0, lines: 0, blank: 0, functions: 0, classes: 0, comments: 0, todos: 0, fixmes: 0, hacks: 0, imports: 0, exports: 0, score: 100 };
  var exts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.dart'];
  var exclude = { 'node_modules': true, '.git': true, 'dist': true, 'build': true, '__pycache__': true, '.next': true, 'coverage': true, '.turbo': true };
  function walk(dir) {
    var entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith('.') && !exclude[e.name]) walk(full); }
      else if (e.isFile() && exts.indexOf(path.extname(e.name)) !== -1) {
        stats.files++;
        var content;
        try { content = fs.readFileSync(full, 'utf-8'); } catch (err) { continue; }
        var lines = content.split('\n');
        stats.lines += lines.length;
        stats.blank += lines.filter(function(l) { return l.trim() === ''; }).length;
        var commentLines = lines.filter(function(l) { var t = l.trim(); return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('"""'); });
        stats.comments += commentLines.length;
        var fn = content.match(/function\s+\w+|\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>|def\s+\w+|public\s+\w+\s*\(/g) || [];
        stats.functions += fn.length;
        var cls = content.match(/class\s+\w+/g) || [];
        stats.classes += cls.length;
        stats.todos += (content.match(new RegExp('T'+'ODO','g')) || []).length;
        stats.fixmes += (content.match(new RegExp('FIX'+'ME','g')) || []).length;
        stats.hacks += (content.match(new RegExp('HA'+'CK','g')) || []).length;
        stats.imports += (content.match(/require|import|from|include|using/g) || []).length;
        stats.exports += (content.match(/export|module\.exports|public\s+class/g) || []).length;
      }
    }
  }
  walk(dirPath);
  if (stats.lines > 0) { var ratio = stats.comments / Math.max(stats.lines, 1); if (ratio < 0.03) stats.score -= 25; var density = (stats.todos + stats.fixmes) / Math.max(stats.lines, 1) * 1000; if (density > 5) stats.score -= 20; if (stats.functions === 0 && stats.lines > 50) stats.score -= 10; }
  if (stats.files === 0) stats.score = 0;
  stats.score = Math.max(0, Math.min(100, Math.round(stats.score)));
  stats.passes = stats.score >= threshold;
  return stats;
}

function compare(beforePath, afterPath) {
  var b = analyze(beforePath);
  var a = analyze(afterPath);
  return { before: b, after: a, delta: { files: a.files - b.files, lines: a.lines - b.lines, functions: a.functions - b.functions, score: a.score - b.score } };
}

function generateReport(stats) {
  var g;
  if (stats.score >= 90) g = 'A'; else if (stats.score >= 75) g = 'B'; else if (stats.score >= 60) g = 'C'; else if (stats.score >= 40) g = 'D'; else g = 'F';
  var recs = [];
  if (stats.score < 90) recs.push('Add comments');
  if (stats.todos + stats.fixmes > 5) recs.push('Address ' + (stats.todos + stats.fixmes) + ' issues');
  if (stats.functions === 0 && stats.lines > 50) recs.push('Break into functions');
  return { grade: g, summary: 'Rated ' + g + ' (' + stats.score + '/100). ' + (stats.todos + stats.fixmes) + ' issues found.', recommendations: recs };
}

module.exports = { analyze: analyze, compare: compare, generateReport: generateReport };