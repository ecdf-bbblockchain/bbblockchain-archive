const fs = require("fs");

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

// get all projects
const projects = rdfFiles.map(file => {
	// check if file contains searchStrings
	let rdf = fs.readFileSync(file, "utf8");

	// project regex
	const projectRegex = /<dc:subject><!\[CDATA\[([^\]]+)\]\]><\/dc:subject>/;

	// get regex groups
	const match = rdf.match(projectRegex);
	if(match) {
		return match[1];
	}
}).filter(e => e);

// unique projects
const uniqueProjects = [...new Set(projects)];

// make new directories if not exist
for(project of uniqueProjects) {
	if(!fs.existsSync(project)) {
		fs.mkdirSync(project);
	}
}

// Read all rdf files
const contents = rdfFiles.map(file => {
	let rdf = fs.readFileSync(file, "utf8");

	const projectRegex = /<dc:subject><!\[CDATA\[([^\]]+)\]\]><\/dc:subject>/;
	const contentRegex = /<content:encoded><!\[CDATA\[([^\]]+)\]\]><\/content:encoded>/;
	const authorRegex = /<dc:creator><!\[CDATA\[([^\]]+)\]\]><\/dc:creator>/;
	const titleRegex = /<title>([^<]+)<\/title>/;
	const dateRegex = /<dc:date>([\d]{4}-[\d]{2}-[\d]{2})T([\d]{2}:[\d]{2}:[\d]{2})Z[^<]+<\/dc:date>/;

	const matchProject = rdf.match(projectRegex);
	const matchAuthor = rdf.match(authorRegex);
	const matchContent = rdf.match(contentRegex);
	const matchTitle = rdf.match(titleRegex);
	const matchDate = rdf.match(dateRegex);

	if(projectRegex && matchAuthor && matchContent && matchTitle && matchDate) {
		const html = matchContent[1].replace(/https:\/\/d33buku1khvcng\.cloudfront\.net/g, "..");

		const date =  matchDate[1];
		const time =  matchDate[2];
		const author =  matchAuthor[1];
		const project =  matchProject[1];
		const title =  matchTitle[1];

		const fileName = project + "/Post " + date + "Z" + time + " by " + author + ".md";

		return {
				date,
				time,
				author,
				project,
				title,
				fileName,
				html
			};
	} else {
		console.log("Invalid regex: " + file);
	}
});

// Write markdown files
for(file of contents) {
	const md = 	"# " + file.title + "\n\n" +
					"- Author: " + file.author + "\n" + 
					"- Date: " + file.date + "\n" + 
					"- Time: " + file.name + "\n\n" + 
					"## Post"+ "\n\n" +
					file.html;
	
	fs.writeFileSync(file.fileName, md);
}

// Write projects overview
uniqueProjects.map(project => {
	// Get all project entries
	const projectContents = contents.filter(content => content.project === project);

	// sort projectContents by date
	projectContents.sort((a, b) => {
		return new Date(b.date + "Z" + b.time) - new Date(a.date + "Z" + a.time);
	});

	fs.writeFileSync(project + ".md",
		"| Date / Time | Author | Title |\n" +
		"|-------------|--------|-------|\n" +
		projectContents.map(content => "| " + content.date + " " + content.time + " | " + content.author + " | [" + content.title + "](./" + content.fileName.replace(/ /g, "%20") + ") |").join("\n")
	);
})

