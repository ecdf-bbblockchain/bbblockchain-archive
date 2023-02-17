const fs = require("fs");

// Find all directories
let dirs = [];
let allFiles = [];
let found = ["./index.php", "./wp-content"];

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

//console.log(rdfFiles);

// get all files 
const rdfWpFiles = rdfFiles.map(rdfFile => {
	// file content without line breaks
	const fileTxt = fs.readFileSync(rdfFile, "utf8").replace(/[\r]/g, "").replace(/[\t]/g, "").replace(/[\n]/g, "");

	var r = /<bbbwpfiles postId="[\d]+" author="[\w]+">\[(.+)\]<\/bbbwpfiles>/;

	// check if regex matches and get all groups
	const match = r.exec(fileTxt);
	if(match) {
		//console.log(match[1].split(","));
		return match[1].split(",");
	} else {
		return [];
	}
}).reduce((a, b) => a.concat(b), [])
.map(path => path.replace("\"https:\\/\\/d33buku1khvcng.cloudfront.net\\", ""))
.map(path => path.replace(/"$/, ""))
.map(path => "." + path.replace(/\\/g, ""));

// get all wpFiles
const wpFiles = allFiles.filter(f => f.startsWith("./wp-content/"));

// get all wpFiles that are not in rdfWpFiles
const otherWpFiles = wpFiles.filter(f => !rdfWpFiles.includes(f));

// Delete other files
for(file of otherWpFiles) {
	console.log("Deleted " + file);
	fs.unlinkSync(file);
}