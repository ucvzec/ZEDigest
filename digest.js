/***
	The purpose of this progress is to make a daily / weekly digest of what we're doing in Soft 160, that can be send out via email
*/
const puppet = require("puppeteer");
const headless = true;

const path = require("path");
const config = require(path.resolve(__dirname+"/config.json"));

//this removes some goofs from html text that we don't want
function translateHTML(rawText){
	return rawText.replace(/&amp;/g,"&").replace(/&nbsp;/g," ");
}

async function grabDays(moduleIndex=0,snifDays=1){
	const browser = await puppet.launch({
		headless,
	});
	const page = await browser.newPage();
	await page.goto(config.soft160Site);
	let reading = await page.evaluate((params)=>{
		let found = [];
		const moduleElement = document.querySelectorAll(params.moduleSelector)[params.moduleIndex];
		const classList = Object.values(moduleElement.querySelectorAll(params.classDaySelector)).slice(0,params.snifDays);
		classList.forEach((day)=>{
			//this makes sure we don't try to provide more readings that day than there is.
			if(day.querySelector(params.readingsSelector) !== null){
				const textNodeArea = day.querySelector(params.readingsSelector).nextElementSibling;
				found.push(`${textNodeArea.innerHTML.match(new RegExp(params.regexRaw,"g")).join("\n")}`);
			}
		});
		return found;
	},Object.assign({moduleIndex,snifDays,regexRaw:"(?<=\>)[a-zA-Z 0-9.&;]+(?=\<)"},config.puppetInformation));
	
	await browser.close();
	
	reading.forEach((read)=>{
		console.log(translateHTML(read));
	});
	console.log('Done');
}
grabDays(0,1);

/*
	NOTES:
	H4 is used for the category headers, while H3 is used for the day header
	Regex to get the readings (?<=\>)[a-zA-Z 0-9.&;]+(?=\<)    global
	https://github.com/GoogleChrome/puppeteers
*/