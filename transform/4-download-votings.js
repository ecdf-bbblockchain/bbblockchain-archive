const fs = require("fs");

const projectsNames = ["LNDW 2022", "Bülow90", "Kietzer Feld"];

let allVotings = [];

// download json from server
fetch("https://interface.bbblockchain.de/projects").then((resp) => {
	// convert resp body to json
	return resp.json();
}).then((json) => {
	return json.projects.filter(project => projectsNames.indexOf(project.name) !== -1)
}).then(async (projectsJson) => {
	// download json from server in sync mode

	return projectsJson.map(async project => {
		return {
			...project,
			votings: await (await fetch("https://interface.bbblockchain.de/project/votings/" + project.address)).json(),
			multiVotings: await (await fetch("https://interface.bbblockchain.de/project/multiVotings/" + project.address)).json()
		}
	})
}).then(async projects => {
	return await Promise.all(projects);
}).then(async projects => {
	// projects w/o title
	return await Promise.all(projects.map(async project => {
		return {
			...project,
			votings: await Promise.all(project.votings.map(async voting => {
				const results = await (await fetch("https://interface.bbblockchain.de/project/voting/results/" + voting.address)).json();
				//console.log(results)

				if(voting.topic.length > 0) { 
					return {
						...voting,
						results: results.results.map(result => result.votes + "x " + result.option)
					};
				} else if(voting.rssPostUrl.length > 0) {
					body = await (await fetch(voting.rssPostUrl.replace("**CLOUD**", "cloud.bbblockchain.de") + "feed/rdf")).text();

					let r = /<question>"(.*)"<\/question>/;
					let m = body.match(r);

					return {
						...voting,
						body,
						topic: m[1],
						results: results.results.map(result => result.votes + "x " + result.option)
					}
				}
			}))
		}
	}))
}).then(async projects => {
	return await Promise.all(projects);
}).then(projects => {
	allVotings = projects;
	//console.log(JSON.stringify(projects, null, 2))
}).then(() => {
	fs.writeFileSync("votings.json", JSON.stringify(allVotings, null, 2));
}).then(() => {
	return projectsNames.map(projectName => {
		const project = allVotings.find(project => project.name === projectName);

		return {
			name: projectName,
			//address: project.address,
			votings: project.votings.map(projectVoting => {
				let timestamp = projectVoting.start;

				// timestamp to date
				let date = new Date(timestamp * 1000);
				// format date to yyyy-mm-dd with leading zeros
				let dateStr = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

				return {
					date: dateStr,
					topic: projectVoting.topic,
					results: projectVoting.results
				}
			}),
			multiVotings: project.multiVotings.map(multiVoting => {
				// console.log(multiVoting.results);

				return multiVoting.results.votings.map(voting => {
					let timestamp = multiVoting.start;

					// timestamp to date
					let date = new Date(timestamp * 1000);
					// format date to yyyy-mm-dd with leading zeros
					let dateStr = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);

					if(voting.options != "Freetext") {
						return {
							date: dateStr,
							topic: voting.topic,
							results: voting.options.map(option => option.votes + "x " + option.option)
						}
					} else {
						return {
							date: dateStr,
							topic: voting.topic,
							results: ["Freetexts (see JSON)"]
						}
					}
				})
			})
		}
	})
}).then((projects) => {
	return projects.map(project => {
		let multiVotings = project.multiVotings;

		// flatten multiVotings
		multiVotings = multiVotings.reduce((acc, val) => acc.concat(val), []);

		let unsortedVotings = [...project.votings, ...multiVotings];

		// sort votings
		let sortedVotings = unsortedVotings.sort((a, b) => {
			return new Date(a.date) - new Date(b.date);
		});

		return {
			...project,
			sortedVotings
		}
	});
}).then((projects) => {
	return projects.map(project => {
		let markdown = 	"| Topic | Date | Votes |\n" + 
						"|-------|------|-------|\n" +
						project.sortedVotings.map(voting => {
							return "| " + voting.topic + " | " + voting.date + " | " + voting.results[0] + " |\n" +
									voting.results.slice(1).map(result => "| &nbsp; | &nbsp; | " + result).join("\n") + "\n";
						}).join("");

		//console.log(markdown)
		fs.writeFileSync(project.name + ".md", markdown);
	})
})














