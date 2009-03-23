load("lib/js/writeFile.js");
load("lib/js/base2.js");
load("lib/js/Packer.js");
load("lib/js/Words.js");

// arguments
var inFile = arguments[0];
var outFile = arguments[1] || inFile.replace(/\.js$/, ".pack.js");

// options
var base62 = true;
var shrink = true;

var script = readFile(inFile);
var header = script.match(/\/\*(.|\n|\r)*?\*\//)[0];
var packer = new Packer;
var packedScript = packer.pack(script, base62, shrink);

writeFile(outFile, header + "\n" + packedScript);
