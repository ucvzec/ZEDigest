/***
	The purpose of this progress is to make a daily / weekly digest of what we're doing in Soft 160, that can be send out via email
*/
const puppet = require("puppeteer");

const devMode = false;

const path = require("path");
const config = require(path.resolve(__dirname+"/config.json"));

//this removes some goofs from html text that we don't want
function translateHTML(rawText){
	return String(rawText).replace(/&amp;/g,"&").replace(/&nbsp;/g," ");
}

async function grabDays(moduleIndex=0,daysCount=1,startDay=0){
	const browser = await puppet.launch({
		devtools:devMode,
	});
	const page = await browser.newPage();
	await page.goto(config.soft160Site);
	let reading = await page.evaluate((params)=>{
		let readingList = [];

		const moduleElement = document.querySelectorAll(params.moduleSelector)[params.moduleIndex];
		const classList = Object.values(moduleElement.querySelectorAll(params.classDaySelector)).slice(params.startDay,params.daysCount+params.startDay);

		let day;
		let readingInfo;

		for(let x=0;x!=classList.length;++x){
			day = classList[x];

			//this makes sure we don't try to provide more readings that day than there is.
			readingInfo = day.innerHTML.match(/((?<=<a href="https:\/\/cse\.unl\.edu\/SEN1">)|(?<=<a href="http:\/\/cse\.unl\.edu\/~cbourke\/ComputerScienceOne\.pdf">))[a-zA-Z -.0-9]*(?=<\/a>)/g); 
			
			readingList=readingList.concat(day.innerHTML.match(/(?<=>)[()a-zA-Z ,0-9&;.:-]*(?=<)/));
			if(readingInfo !== null){
				//day title

				//reading information
				readingList=readingList.concat(readingInfo);
			}
		}
		return readingList;
	},Object.assign({moduleIndex,daysCount,startDay},config.puppetInformation));
	//(?<=\>)[a-zA-Z 0-9.&;]+(?=\<)
	//doesn't close the browser if we're in dev mode.
	(!devMode?await browser.close():"");
	return reading;
}
/*
reading.forEach((read)=>{
	console.log(translateHTML(read));
});
console.log('Done');
*/

async function checkUpdate(lastUpdateHeader){
	let results = await grabDays(0,1);
	let candidateHeader = results[0];
	if(candidateHeader !== lastUpdateHeader){
		results.forEach((line)=>{
			console.log(translateHTML(line));
		});
		lastUpdateHeader = candidateHeader;
	}else{
		//nothing new
		(devMode?console.log("Nothing new."):"");
	}
	return lastUpdateHeader;
}

async function notfoLoop(){
	const oneHourTime = 3600000;
	const hoursBetweenChecks  = 2;

	var lastUpdateHeader= await checkUpdate(lastUpdateHeader);
	let hourInterval = setInterval(async function(){
		lastUpdateHeader = await checkUpdate(lastUpdateHeader);
	},oneHourTime*hoursBetweenChecks);
}

notfoLoop();

//going to use AWS SES for sending notification emails in the future.