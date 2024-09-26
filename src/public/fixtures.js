//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor the list of fixtures for the specified team.
//	and a link made availble to access the member's area home panel.
//
//------------------------------------------------------------------------------------------------------
import {getCalendarEntrysByTeam}	from 'public/objects/event.js';
import {getAllEventsForYear}		from 'backend/backEvents.jsw';
import wixLocationFrontend from 'wix-location-frontend';

// Premium site URL: "https://www.domain.com/elephant?species=african-elephant"
// Free site URL: "https://user_name.wixsite.com/zoo/elephant?species=african-elephant"

let baseUrl = wixLocationFrontend.baseUrl;
// Premium site: "https://domain.com/"
// Free site: "https://user_name.wixsite.com/zoo/"
import {insertCalendarEvent}		from 'backend/createEvent.jsw';
import {processRinks}				from 'public/objects/event.js';
import {processDress}				from 'public/objects/event.js';
import { EVENT }					from 'public/objects/event.js';

let wDataIn = [];		// holds the list of events read from database	
let wDataOut = [];		// holds the list of events to be shown in the table. It is formed from wDatIn
let wLastMonth = ""

var toInsert = {
	"id": "",
	"month": "",
	"dayN": 0,
	"day": "",
    "subject": "",
	"type": "",
	"rink": "",
	"venue": "",
	"start": "",
	"dress": "",
	"pool": []
};

export async function loadTableData (pYear, pTeam) {
	wDataOut =[];
	let status;
	if (pTeam === "ALL") { 
		let wResult = await getAllEventsForYear(pYear);
		wDataIn = wResult.events;
	} else { 
		wDataIn = await getCalendarEntrysByTeam(pTeam);
	}
	if (wDataIn.length > 0) {
		wDataIn.forEach(processFixtureTableRow);
		wDataIn = [];
	}
    return wDataOut;
}

async function processFixtureTableRow (pEvent, count) {
	// process date & times
	processDate(pEvent.startDate);

	toInsert.start = pEvent.startTime;
	
	processFixtureTableLeagueGame(pEvent);
	if (pEvent.status === EVENT.CANCELLED) {
		toInsert.subject = toInsert.subject + " (CANCELLED)";
	}
	wDataOut[wDataOut.length] = {"month": toInsert.month, "date": toInsert.DayN.toString(),
								 "day": toInsert.day, "mix": toInsert.mix, "subject": toInsert.subject,
								 "type": toInsert.type, "rink": toInsert.rink, "venue":toInsert.venue,
								 "start":toInsert.start, "dress":toInsert.dress,
								 "pool": toInsert.pool, "id": toInsert.id};
}
	
function processFixtureTableLeagueGame(event){
	toInsert.id = event._id;
	toInsert.subject = event.subject;
	toInsert.type = processEventType(event);
	toInsert.mix = processMix(event);
	let wWhere = "";
	if (event.homeAway === "H") {
		toInsert.venue = "Home";
	} else {
		toInsert.venue = "Away";
	}
	toInsert.rink = processRinks(event);
	toInsert.dress = processDress(event);
}

function processEventType(event){
	let wType = "";
	let wTemp = "";
	switch (event.eventType){
		case "CE":
			wType = "Club";
			break;
		case "CG":
			wType = "Club";
			break;
		case "HG":
			wType = "Loan";
			break;
		case "FG":
			wType = "F";
			break;
		case "LG":
			wTemp = event.league.slice(0,2);
			switch (wTemp) {
				case "KL":
					wType = "KL";
					break;
				case "KV":
					wType = "KLV";
					break;
				case "TV":
					wType = "TVL";
					break;
				case "RS":
					wType = "RS";
					break;
			}
			break;
	}
	return wType;
}

function processMix(event){
	let wMix = "";
	switch (event.mix){
		case "X":
			wMix = "";
			break;
		case "M":
			wMix = "Men's";
			break;
		case "L":
			wMix = "Ladies";
			break;
	}
	return wMix;
}

//
//========================================================== Date & Duration Functions =====================================
export function processDate(pDate) {
	//TODO: utilise formatDate routine
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
		'July', 'Aug','Sept', 'Oct', 'Nov', 'Dec'
	];

	const days = [
		'Sun', 'Mon', 'Tue', "Wed", 'Thurs', 'Fri', 'Sat'
	];
	var strMonth = "";
	let wMonth = pDate.getMonth();
	if (wMonth === wLastMonth) {
		strMonth ="";
	} else {
		strMonth = months[wMonth];
		wLastMonth = wMonth;
	}

	let wDay = pDate.getDay();
	let wDate = pDate.getDate();
	const strDay = days[wDay];
	toInsert.month = strMonth;
	toInsert.DayN = wDate;
	toInsert.day = strDay;
}

export function formatDate(pDate) {

	const wOut = {
		"year": "",
		"month": "",
		"dayN": 0,
		"day": "",
		"cardinal": ""
	}
	
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
		'July', 'Aug','Sept', 'Oct', 'Nov', 'Dec'
	];

	const days = [
		'Sun', 'Mon', 'Tue', "Wed", 'Thurs', 'Fri', 'Sat'
	];

	let wYear = pDate.getFullYear();
	let wMonth = pDate.getMonth();
	const strMonth = months[wMonth];
	
	let wDay = pDate.getDay();
	let wDate = pDate.getDate();
	const strDay = days[wDay];
	let strCardinal = "";
	switch (wDate) {
		case 1:
		case 21:
		case 31:
			strCardinal="st";
			break;
		case 2:
		case 22:
			strCardinal="nd";
			break;
		case 3:
		case 23:
			strCardinal="rd";
			break;
		default:
			strCardinal="th";
			break;
	}
	wOut.year =wYear;
	wOut.month = strMonth;
	wOut.dayN = wDate;
	wOut.day = strDay;
	wOut.cardinal = strCardinal;
	//console.log(wOut);
	return wOut;
}

/*
/
/	Parameters@
/		pDate	Date	the start date to be parsed
/	Return
/		pOut			for 27th Jan 2022, at 16:30
/			year		Numeric	2022
/			numMonth	Numeric	0
/			date		Numeric	27
/			hour		Numeric	16
/			minute		Numeric	20
/			strMonth	String	Jan
			day			String	Thurs
/			cardinal	String	27th
/			time		String	18:30
/			shortDate	String	27 Jan 2022,
/			longDate	String	Thurs, 27th Jan 2022,
*/
export function parseStartDate(pDate) {

	const wOut = {
		"year": 0,
		"numMonth": 0,
		"date": 0,
		"hour": 0,
		"minute": 0,
		"strMonth": "",
		"day": "",
		"cardinal": "",
		"time": "",
		"shortDate": "",
		"longDate":	""
	}
	
	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
		'July', 'Aug','Sept', 'Oct', 'Nov', 'Dec'
	];

	const days = [
		'Sun', 'Mon', 'Tue', "Wed", 'Thurs', 'Fri', 'Sat'
	];

	let wYear = pDate.getFullYear();
	let wMonth = pDate.getMonth();
	const strMonth = months[wMonth];
	
	let wDay = pDate.getDay();
	let wDate = pDate.getDate();
	const strDay = days[wDay];
	let strCardinal = "";
	switch (wDate) {
		case 1:
		case 21:
		case 31:
			strCardinal="st";
			break;
		case 2:
		case 22:
			strCardinal="nd";
			break;
		case 3:
		case 23:
			strCardinal="rd";
			break;
		default:
			strCardinal="th";
			break;
	}
	let wHours = pDate.getHours();
	let wMinutes = pDate.getMinutes();
	let wTime = String(wHours).padStart(1,"0") + ":" + String(wMinutes).padStart(2,"0");
	wOut.year =wYear;
	wOut.numMonth = wMonth;
	wOut.date = wDate;
	wOut.hour = wHours;
	wOut.minute = wMinutes;
	wOut.strMonth = strMonth;
	wOut.day = strDay;
	wOut.cardinal = strCardinal;
	wOut.time = wTime
	wOut.shortDate = String(wDate) + " " + strMonth + " " + String(wYear);
	wOut.longDate = strDay + ", " + String(wDate) + strCardinal + " " + strMonth + " " + String(wYear);

	//console.log(wOut);
	return wOut;
}

export async function parseDateTimeFromInput(pDatePicker, pTimePicker, pDuration) {

	const months = [
		'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June',
		'July', 'Aug','Sept', 'Oct', 'Nov', 'Dec'
	];

	const days = [
		'Sun', 'Mon', 'Tue', "Wed", 'Thurs', 'Fri', 'Sat'
	];

	const results = {
		"start": {
			"dateTime": null,			// date
			"strDate": "",			// string
			"nDate": 0, 			// numeric dd	
			"nTime": 0,				// numeric
			"nHrs": 0,				// 0-23
			"nMins": 0,				// 0-59
			"strTime": "",			// string
			"strDay": "",			// string Mon - Sun
			"strMonth": ""			// string Jan - Dec
		},
		"end": {
			"dateTime": null,	
			"strDate": "",
			"nTime": 0,
			"strTime": "",
		},
		"duration": 0
	}

	let wHours = parseInt(pTimePicker.split(":")[0],10);
	let wMins = parseInt(pTimePicker.split(":")[1],10);
	results.start.nHrs = parseInt(wHours);
	results.start.nMins = parseInt(wMins);
	var wStartDateTime = new Date(pDatePicker.getFullYear(), pDatePicker.getMonth(), pDatePicker.getDate(), wHours, wMins);
	if (typeof pDuration === "string") {
		if (pDuration.includes(":")) {
			wHours = parseInt(pDuration.split(":")[0],10);
			wMins = parseInt(pDuration.split(":")[1],10);
		} else {
			console.log("/public/fixtures parseDateTimeFromOnput Invalid pDuration", pDuration);
			wHours = 2;
			wMins = 0;
		}
	} else {
			[wHours, wMins] = convertFPToHrsMins(pDuration);
	}
	var wEndDateTime = new Date(wStartDateTime);
	wEndDateTime.setHours(wStartDateTime.getHours() + wHours);
	wEndDateTime.setMinutes(wStartDateTime.getMinutes() + wMins);
	let wDuration = (wHours + (wMins / 60));
	results.start.dateTime = wStartDateTime;
	results.start.nDate = wStartDateTime.getDate();
	results.start.nTime = wStartDateTime.getTime();
	results.start.strDate = formatDateString(wStartDateTime);
	results.start.strTime = getTime(wStartDateTime);
	let wMonth = wStartDateTime.getMonth();
	results.start.strMonth = months[wMonth];
	let wDay = wStartDateTime.getDay();
	results.start.strDay = 	days[wDay];
	wStartDateTime.getDay();
	results.end.dateTime = wEndDateTime;
	results.end.nTime = wEndDateTime.getTime();
	results.end.strDate = formatDateString(wEndDateTime);
	results.end.strTime = getTime(wEndDateTime);
	results.duration = wDuration;
	return results;
}

export function formatDateString(pDate, pType = "Long"){
	const months = ['Jan', 'Feb', 'Mar', 'Apr','May','June','July', 'Aug', 'Sept','Oct', 'Nov','Dec'];
	const days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];

	const year = pDate.getFullYear();
	const date = pDate.getDate();
	const monthName = months[pDate.getMonth()];
	const dayName = days[pDate.getDay()];
	let stringDate = "";
	if (pType === "Short") {
		stringDate = `${dayName}, ${date} ${monthName}`;
	} else {
		stringDate = `${dayName}, ${date} ${monthName}  ${year}`;
	}
	return stringDate;
}

export function convertDuration(pDuration) {
  let wHours = Math.floor(pDuration);
  let wMin = pDuration % 1;
  return wHours.toString().padStart(2,0) + ":" + (60*wMin).toString().padStart(2,0);
}

export function getDuration(pStart, pEnd){
//	returns the number of minutes between pStart amd pEnd; pStart >= pEnd
	if (compareTime(pStart, "<", pEnd)) { return false}	
	if (compareTime(pStart, "=", pEnd)) { return 0}	
	let wMins = 0;
	let wAHours = parseInt(pStart.split(":")[0],10);
	let wAMins = parseInt(pStart.split(":")[1],10);
	let wBHours = parseInt(pEnd.split(":")[0],10);
	let wBMins = parseInt(pEnd.split(":")[1],10);
	if (wBMins > wAMins){
		wBHours++;
		wMins = (60-wBMins) + wAMins;
	} else {
		wMins = wAMins - wBMins;
	}
	wMins = wMins + 60*(wAHours-wBHours);
	return wMins;
}

export function getTime(pDate) {
  let wHours = pDate.getHours();
  let wMin = pDate.getMinutes();
  return wHours.toString().padStart(2,0) + ":" + wMin.toString().padStart(2,0);
}

export function compareTime(pATime, pOp, pBTime){
	//console.log(pATime + "/" + pOp + "/" + pBTime);
	let wAHours = parseInt(pATime.split(":")[0],10);
	let wAMins = parseInt(pATime.split(":")[1],10);
	let wBHours = parseInt(pBTime.split(":")[0],10);
	let wBMins = parseInt(pBTime.split(":")[1],10);

	let wATime = new Date();
	let wBTime = new Date();

	wATime.setHours(wAHours,wAMins,0,0);
	wBTime.setHours(wBHours,wBMins,0,0);
	switch (pOp) {
		case "=":
			return (wATime === wBTime);
			break;
		case "<":
			return (wATime < wBTime);
			break;
		case ">":
			return (wATime > wBTime);
			break;
		case ">=":
			return (wATime >= wBTime);
			break;
		case "<=":
			return (wATime <= wBTime);
			break;
		default:
			return false;
			break;
	}
}

export function toJulian(pDate){   //convert passed string to date object
	const dayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
   
	const dte = new Date(pDate);
	//initialize date variable
	const yy = dte.getFullYear()
	let julianDate = 0;
	//add days for previous months
	for (let i = 0; i < dte.getMonth(); i++) {
    	julianDate += dayCount[i];
	}
	//add days of the current month
	julianDate += dte.getDate();
	//check for leap year
	if (dte.getFullYear() % 4 == 0 && dte.getMonth() > 1) {
		julianDate++;
	}
	return String(yy) + String(julianDate).padStart(3,"0");	//yyddd
}

export function stringToDate(pIn, pSep){
	let res = pIn.split(pSep);
	let wDay = parseInt(res[0],10);
	let wMonth = parseInt(res[1],10);
	let wYear = parseInt(res[2],10);
	return new Date(wYear, wMonth-1, wDay, 10,0,0,0);
}

export function JulianToDate (pYear, pJDay){
	// convert a Julian number to a Gregorian Date.
    //    S.Boisseau / BubblingApp.com / 2014
    var a = n + 32044;
    var b = Math.floor(((4*a) + 3)/146097);
    var c = a - Math.floor((146097*b)/4);
    var d = Math.floor(((4*c) + 3)/1461);
    var e = c - Math.floor((1461 * d)/4);
    var f = Math.floor(((5*e) + 2)/153);

    var D = e + 1 - Math.floor(((153*f) + 2)/5);
    var M = f + 3 - 12 - Math.round(f/10);
    var Y = (100*b) + d - 4800 + Math.floor(f/10);

    return new Date(Y,M,D);
}

export function convertFPToHrsMins(pNum){
	let wHrs = (Math.floor(pNum));
	let wR = Math.round((pNum - Math.floor(pNum))*100);
	return [wHrs, Math.round(wR*0.6)];
}
