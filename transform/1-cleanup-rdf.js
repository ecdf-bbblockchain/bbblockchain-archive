const fs = require("fs");

// Filter for projects
const projects = ["Kietzer Feld", "Bülow90", "LNDW"];

// Find all directories
let dirs = [];
let allFiles = [];
let found = ["./index.php"];

while(dir = found.pop()) {
	// add dir to dirs
	dirs.push(dir);

	// read all directory from dir
	let directories = fs.readdirSync(dir).map(f => dir + "/" + f).filter(f => fs.statSync(f).isDirectory());

	// add directories to found
	found = [...found, ...directories];
}

// Get all rdf files
let rdfFiles = dirs.filter((dir) => {
	// read all files from given dir
	const files = fs.readdirSync(dir).map(f => dir + "/" + f).filter(f => fs.statSync(f).isFile());

	// append allFiles
	allFiles = [...allFiles, ...files];

	// check if rdf is present
	return files.filter((file) => file.endsWith("rdf")).length > 0; 
}).map(dir => dir + "/rdf");

// show all project related rdf files
const searchStrings = projects.map(project => "<dc:subject><![CDATA[" + project + "]]></dc:subject>");
rdfFiles = rdfFiles.filter(file => {
	// check if file contains searchStrings
	let rdf = fs.readFileSync(file, "utf8");

	return searchStrings.map(str => rdf.includes(str)).reduce((a, b) => a || b);
});

// Get all files that are not in rdfFiles
let otherFiles = allFiles.filter(file => !rdfFiles.includes(file));

// Delete other files
for(file of otherFiles) {
	console.log("Deleted " + file);
	fs.unlinkSync(file);
}


