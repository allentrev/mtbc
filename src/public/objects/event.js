//------------------------------------------------------------------------------------------------------
//
//	EVENT OBJECT
//
//  Desc:   The "" table holds a record for each
//
//  Usage:  1)	Add Event page
//			2)	Maintain Event page
//			3)	Upload Calendar Events page
//			4)	Week At A Glance page
//			5)	lbxMaintainEvent lightbox
//			6)	fixtures.js
//------------------------------------------------------------------------------------------------------
import wixData from 'wix-data';

/**
 * Enum for Event object status values
 * @readonly
 * @enum {String}
 */

export const EVENT = Object.freeze({
  NEW:		"N",						// new, and no bookings generated yet
  ACTIVE:	"A",						// event has been processed for bookings
  COMPLETED:"C",						// event completed.If a CanEvent, means been primed to live
  DELETED:	"D"	,						// deleted
  CANCELLED: "X"						// shown as cancelled in fixture list. Bookings deleted
});

export const EVENT_TYPE = Object.freeze({
  CLUB_GAME:		"CG",
  NATIONAL_GAME:	"CN",
  COUNTY_GAME:		"CC",
  CLUB_EVENT:		"CE",
  LOAN_GAME:		"HG",
  LEAGUE_GAME:		"LG",
  FRIENDLY_GAME:	"FG",
  INTER_CLUB_GAME:	"EG"
});

export const LEAGUE = Object.freeze({
//	Pre-2023 values
  KL1:	"KL1",
  KL2:	"KL2",
  KL3:	"KL3",
  KV1:	"KV1",
  KV2:	"KV2",
  KV3:	"KV3",
  RSL:	"RSL",
  TVL:	"TVL",
//	Post-2023 values
  KLE:	"KLE",
  KLVE:	"KLVE",
  KLVCE:	"KLVCE",
  RS:	"RS",
  TV:	"TV",
  // Ad hoc leagues
  MINI_LEAGUE_1:	"MLG1"
});

export const PLAYED_AT = Object.freeze({
  HOME:	"H",
  AWAY:	"A"
});

export const MIX = Object.freeze({
  LADIES:	"L",
  MENS:		"M",
  MIXED:	"X"
});

export const EVENT_GAME_TYPE = Object.freeze({
  TYPE_X:	"X",
  TYPE_R:	"R",
  MIXED:	"M",
  FOURS:	"F",
  TRIPLES:	"T",
  PAIRS:	"P",
  DOUBLES:	"D",
  SINGLES:	"S",
  DOUBLE_FOURS:			"DF",
  MIXED_DOUBLE_FOURS:	"MF",
  TOP_CLUB_TRIPLES:		"TT",
  CLUB_CHAMP_TRIPLES:	"CT",
  MIXED_PAIRS:			"MP"
});

export const USE_TYPE = Object.freeze({
	COMPETITION:	"C",
	FRIENDLY:		"F",
	LOAN:			"H",
	LEAGUE:			"L",
	NATIONAL:		"N",
	COUNTY:			"B",
	TOURNAMENT:		"T",
	UNKNOWN:		"X"
});

const gYear = new Date().getFullYear();

//let wCalendarKey;
let wHomeLocation = "Maidenhead Town Bowls Club, Maidenhead, SL6 6HL";
//------------------------------------------------------------------------------------------------------
//
//	Function:	getAllEventsForWeek
//
//  Inputs:		pWeek	Date	week start date
//	Output:		o2		Object	Set of event items
//				false	Boolean	No events found
//
//	TODO:	Get rid of hard coded year
//------------------------------------------------------------------------------------------------------
export async function getAllEventsForWeek(pWeek) {
		const endDate = new Date (pWeek);
		const weekStart = pWeek.getDate();
		endDate.setDate(weekStart + 7);
		const results = await wixData.query("lstEvents")
    		.ge("startDate", pWeek)
    		.lt("startDate", endDate)
			.ne("status", EVENT.DELETED)
    		.ascending("startDate")
			.limit(30)
			.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			return results.items;
		}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getFixtureCalendarEntrys
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//	TODO:	Get rid of hard coded year
//------------------------------------------------------------------------------------------------------
export async function getFixtureCalendarEntrys(pCalendarKey) {
		let wYear = new Date(gYear,0,1)
       	const results = await wixData.query("lstEvents")
    		.eq("calKey", pCalendarKey)
			.gt("startDate", wYear)
			.ne("status", EVENT.DELETED)
    		.ascending("requiredJDate")
    		.ascending("startTime")
			.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			return results.items;
		}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getUploadCalendarEntrys
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//	TODO:	Get rid of hard coded year
//------------------------------------------------------------------------------------------------------
export async function getUploadCalendarEntrys(pCalendarKey) {
		let wRole;
		let wYear = new Date(gYear,0,1)
       	const results = await wixData.query("lstEvents")
    		.eq("calKey", pCalendarKey)
			.eq("uploadStatus",EVENT.NEW)
			.gt("startDate", wYear)
    		.ascending("startDate")
			.find();
		if (results.items.length ===  0) {
			return [];
		} else {
			return results.items;
		//	console.log("Type = " + wRole);
		}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//	TODO:	Get rid of hard coded year
//------------------------------------------------------------------------------------------------------
export async function getCalendarEntrysByTeam(pTeam) {
		let wRole;
		let wYear = new Date(gYear,0,1)
       	const results = await wixData.query("lstEvents")
    		.eq("team", pTeam)
			.gt("startDate", wYear)
			.ne("status", EVENT.DELETED)
    		.ascending("startDate")
			.find();
		return results.items;
}

export async function getEventByShortId (pId) {
	const results = await wixData.query("lstEvents")
		.startsWith('_id', pId)
		.find();
	if (results.items.length ===  0) {
		return false;
	} else if(results.items.length > 1){
		return false;
	} else {
		return results.items[0];
	}
}

export async function getEvent (pId) {
	const result = await wixData.get("lstEvents", pId);
	if (result) {
		return result;
	} else {
		return false;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	insertEvent
//
//  Inputs:		pRec	Object	toInsert record
//	Output:		id		String	nidentifier of the inserted record
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function insertEvent(pRec) {
  	try {
    	// create an item
        // add the item to the collection
        let results = await wixData.insert("lstEvents", pRec)
  		if	(results) {
			let item = results; 
			return item._id;
		} else {
			// console.log("Insert else");
			return false;
		}
	  }
	catch (error) {
		console.log("/public/objects/event insertEvent TryCatch " + error);
		console.log(pRec);
		return false;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function loadEvents() {
	let res = await wixData.query('lstEvents').limit(1000).find();
	if (res.items.length ===  0) {
		return "Not found";
	} else {
		//console.log("Events = " + res.items.length);
		return res.items;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	updateDBEvent
//
//  Inputs:		pEvent	Object	Event class of updated event
//	Output:		true	Boolean	DB update success
//				false	Boolean	DB update failed
//
//  Desc:       Updates database event record with contents of input event instance. 

//				calKey and eventId cannot be changed
//------------------------------------------------------------------------------------------------------
export async function updateDBEvent(pEvent) {
	// update an item in the collection
    return wixData.get("lstEvents", pEvent._id)
  		.then( async (item) => {
    		item.subject = pEvent.subject;
    		item.startDate = pEvent.startDate;
    		item.startTime = pEvent.startTime;
    		item.requiredYear = parseInt(pEvent.requiredYear,10);
    		item.requiredJDate = parseInt(pEvent.requiredJDate,10);
    		item.uploadStatus = pEvent.uploadStatus;
    		item.status = pEvent.status;
    		item.team = pEvent.team;
    		item.homeAway = pEvent.homeAway;
    		item.dress = pEvent.dress;
    		item.eventType = pEvent.eventType;
    		item.mix = pEvent.mix;
    		item.duration = parseFloat(pEvent.duration);
    		item.rinks = pEvent.rinks;
    		item.useType = pEvent.useType;
    		item.gameType = pEvent.gameType;
     		item.league = pEvent.league;
    		item.summary = pEvent.summary;
        await wixData.update("lstEvents", item);
  		return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/events updateDBEvent catch error", err);
			return false;
  		} );
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	updateEventUploadStatus	
//
//  Inputs:		pId			String	id of event record
//				pEventId	String	Id of event in Google Calendar
//	Output:		true		boolean	update OK
//				false		Boolean	update failed
//
//------------------------------------------------------------------------------------------------------
//TODO: this is deprecated since removal of Google Calendars. Status are a funny value
export async function updateEventUploadStatus(pId, pCalEventId) {
    let item = await wixData.get("lstEvents", pId)
	if (item) {
		item.uploadStatus = EVENT.ACTIVE;
		if (item.homeAway === PLAYED_AT.HOME) {
    		item.uploadStatus = "Y";
		}
		item.eventId = pCalEventId;
		let res = await wixData.update("lstEvents", item);
		if (res) {
  			return true;
		} else {
			console.log("/public/objects/event updateEventUploadStatus: ID " + pId + " not updated")
			return false;	
		}
	} else {
			console.log("/public/objects/event updateEventUploadStatus: cant find event in DB");
			return false;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	updateBulkEventUploadStatus	
//
//  Inputs:		pList	array	ids of event record to update
//	Output:		true	boolean	update OK
//				false	Boolean	update failed
//
//------------------------------------------------------------------------------------------------------
export async function updateBulkEventUploadStatus(pList) {

	var i;
	for (i = 0; i < pList.length; i++) {
		let res = await updateEventUploadStatus(pList[i]);
		if (!res) {
			return false;
			break;
		}
	}
	return true;
}

export async function prepareRow(pEvent, pCalendarRecord){

	let pCalendar = {
		"summary": "",
		"location": "",
		"useType": "",
		"desc1": "",
		"desc2": "",
		"desc3": "",
		"desc4": "",
		"note": ""
	};
	//console.log(pEvent);
	if (pEvent.eventType === EVENT_TYPE.FRIENDLY_GAME){
		pCalendar = processFriendlyGame(pEvent,pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.INTER_CLUB_GAME) {
		pCalendar = processInterClubLeagueGame(pEvent, pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.CLUB_GAME) {
		pCalendar = processClubGame(pEvent, pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.NATIONAL_GAME) {
		pCalendar = processNationalGame(pEvent, pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.COUNTY_GAME) {
		pCalendar = processCountyGame(pEvent, pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.LOAN_GAME) {
		pCalendar = processLoan(pEvent, pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.LEAGUE_GAME) {
		pCalendar = processLeagueGame(pEvent,pCalendarRecord);
	} else if (pEvent.eventType === EVENT_TYPE.CLUB_EVENT) {
		pCalendar = processClubEvent(pEvent,pCalendarRecord);
	} else {
		console.log("/public/objects/event prepareRow Page Upload Calender Events: Unknown event type");
	}
	pCalendar.note = (pEvent.summary) ? pEvent.summary.trim() : "" ;
	//console.log(pCalendar);
	return pCalendar;
}

export function processFriendlyGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	let wWhere = "";
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
    let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary ="Maidenhead Town v " + event.subject;
		pCalendar.location = "";
		//pCalendar.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject + " v Maidenhead Town";
		pCalendar.location = "";
	}
	pCalendar.summary = wFullSummary +  " (" + wWhere + ")";
	//---------------------------------------------process use type----------------------
	let wUseType = "Friendly";
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//pCalendar.dress = wDress;
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = wFullSummary + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 =wMix + wWhere.toLowerCase() + " " + wUseType.toLowerCase() + " game\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress;

    return pCalendar;
}

export function processClubGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	let wWhere = "";
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary =event.subject;
		pCalendar.summary = event.subject;
		//pCalendar.location = wHomeLocation;
		pCalendar.location = "";
	} else {
		wWhere = "Away";
		wFullSummary = event.subject;
		pCalendar.summary = event.subject + " (" + wWhere + ")";
		pCalendar.location = "";
	}
	//---------------------------------------------process use type----------------------
	let wUseType = "";
	if (event.useType === USE_TYPE.COMPETITION) {
		wUseType = "Competition";
	} else if (event.useType === USE_TYPE.FRIENDLY) {
		wUseType = "Friendly";
	} else if (event.useType === USE_TYPE.TOURNAMENT) {
		wUseType = "Tournament";
	}
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = wFullSummary + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 = wMix + wWhere.toLowerCase() + " club " + wUseType.toLowerCase()+ " game\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 
    return pCalendar;
}

export function processNationalGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	let wWhere = "";
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary ="Maidenhead Town v " + event.subject;
		pCalendar.location = "";
		//pCalendar.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject + " v Maidenhead Town";
		pCalendar.location = "";
	}
	pCalendar.summary = wFullSummary +  " (" + wWhere + ")";
	
	//---------------------------------------------process use type----------------------
	let wUseType = "";
	if (event.useType === USE_TYPE.COMPETITION) {
		wUseType = "Competition";
	} else if (event.useType === USE_TYPE.FRIENDLY) {
		wUseType = "Friendly";
	} else if (event.useType === USE_TYPE.TOURNAMENT) {
		wUseType = "Tournament";
	} else if (event.useType === USE_TYPE.NATIONAL) {
		wUseType = "National";
	} else if (event.useType === USE_TYPE.COUNTY) {
		wUseType = "County";
	}
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	let wGameTypeDesc = "";
	switch (event.gameType) {
		case "DF":
			wGameTypeDesc = "Double Fours"
			break;
		case "MF":
			wGameTypeDesc = "Mixed Double Fours"
			break;
		case "TT":
			wGameTypeDesc = "Top Club Triples"
			break;
		case "CT":
			wGameTypeDesc = "Club Championship Triples"
			break;
		case "MP":
			wGameTypeDesc = "Mixed Pairs"
			break;
		default:	//"X"
			break;
	}
	pCalendar.desc1 = wGameTypeDesc + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 = wMix + wWhere.toLowerCase() + " club " + wUseType.toLowerCase()+ " game\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 
    return pCalendar;
}

export function processCountyGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	let wWhere = "";
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary ="Maidenhead Town v " + event.subject;
		pCalendar.location = "";
		//pCalendar.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject + " v Maidenhead Town";
		pCalendar.location = "";
	}
	pCalendar.summary = wFullSummary +  " (" + wWhere + ")";

	//---------------------------------------------process use type----------------------
	let wUseType = "";
	if (event.useType === USE_TYPE.COMPETITION) {
		wUseType = "Competition";
	} else if (event.useType === USE_TYPE.FRIENDLY) {
		wUseType = "Friendly";
	} else if (event.useType === USE_TYPE.TOURNAMENT) {
		wUseType = "Tournament";
	} else if (event.useType === USE_TYPE.NATIONAL) {
		wUseType = "National";
	} else if (event.useType === USE_TYPE.COUNTY) {
		wUseType = "County";
	}
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	let wGameTypeDesc = "";
	pCalendar.desc1 = wFullSummary + "\n";
	
	//---------------------------------------------process description----------------
	pCalendar.desc2 = wMix + wWhere.toLowerCase() + " club " + wUseType.toLowerCase()+ " game\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 
    return pCalendar;
}

export function processLoan(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	//	not relevant
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process summary line-----------------
	pCalendar.summary = event.subject;
	pCalendar.location = "";
	//toInsert.location = wHomeLocation";
	//---------------------------------------------process use type----------------------
	let wUseType = "Home Loan use";
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = event.subject + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 = wUseType + "\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 

    return pCalendar;

}

export function bulkSaveEvents(pData) {

	return wixData.bulkUpdate("lstEvents", pData)
  		.then( (results) => {
			//console.log("Events bulk save results");
			//console.log(results);
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/events bulkSaveEvents Catch " + errorMsg);
			return false;
		});
}


export function processLeagueGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	let wLeague = "";
	let wLongTeam = "";
	let wShortTeam = "";
	//---------------------------------------------process league & team-------------
	if (!(event.team == null)){
		wLongTeam = event.team;
	}
	if (event.league === LEAGUE.KL1) {
		wLeague = "Kennet League Division 1";
	} else if (event.league === LEAGUE.KL2) {
		wLeague = "Kennet League Division 2";
	} else if (event.league === LEAGUE.KL3) {
		wLeague = "Kennet League Division 3";
	} else if (event.league === LEAGUE.KV1) {
		wLeague = "Kennet KLV Division 1";
	} else if (event.league === LEAGUE.KV2) {
		wLeague = "Kennet KLV Division 2";
	} else if (event.league === LEAGUE.RSL) {
		wLeague = "Royal Shield League";
		wLongTeam = "Maidenhead Town";
		wShortTeam = "Royal Shield"
	} else if (event.league === LEAGUE.TVL) {
		wLeague = "Thames Valley League";
		wLongTeam = "Maidenhead Town";
		wShortTeam = "TVL"
	}
	if (wLongTeam === "KLA") {
		wLongTeam = "Maidenhead Town A"
		wShortTeam = "Kennet A"
	} else if (wLongTeam === "KLB") {
		wLongTeam = "Maidenhead Town B"
		wShortTeam = "Kennet B"
	} else if (wLongTeam === "KVA") {
		wLongTeam = "Maidenhead Town A"
		wShortTeam = "KLV A"
	} else if (wLongTeam === "KVB") {
		wLongTeam = "Maidenhead Town B"
		wShortTeam = "KLV B"
	} else if (wLongTeam === "KVC") {
		wLongTeam = "Maidenhead Town C"
		wShortTeam = "KLV C"
	}
	//---------------------------------------------process where-----------------------

	let wWhere = "";
	
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary = wLongTeam + " v " + event.subject + "\n" + wLeague;
		pCalendar.summary = wShortTeam + " (" + wWhere +")";
		pCalendar.location = "";
		//toInsert.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject + " v " + wLongTeam + "\n" + wLeague;
		pCalendar.summary = wShortTeam + " (" + wWhere + ")";
		pCalendar.location = "";
	}
	//---------------------------------------------process use type----------------------
	let wUseType="League game";
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = wFullSummary + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 =wMix + wWhere.toLowerCase() + " " + wUseType.toLowerCase()+ "\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 

    return pCalendar;
}


export function processInterClubLeagueGame(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	let wLeague = "";
	let wLongTeam = "";
	let wShortTeam = "";
	//---------------------------------------------process league & team-------------
	if (event.league === LEAGUE.MINI_LEAGUE_1) {
		wLeague = "Mini League " + event.summary.trim();
		wLongTeam = "Maidenhead Town " + event.team.trim();
		wShortTeam = "Mini League " + event.team.trim();
	}
	//---------------------------------------------process where-----------------------

	let wWhere = "";
	
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary = wLongTeam + " v " + event.subject + "\n" + wLeague;
		pCalendar.summary = wShortTeam + " (" + wWhere +")";
		pCalendar.location = "";
		//toInsert.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject + " v " + wLongTeam + "\n" + wLeague;
		pCalendar.summary = wShortTeam + " (" + wWhere + ")";
		pCalendar.location = "";
	}
	//---------------------------------------------process use type----------------------
	let wUseType="League game";
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = wFullSummary + "\n";
	
	//---------------------------------------------process description----------------
	pCalendar.desc2 =wMix + wWhere.toLowerCase() + " " + wUseType.toLowerCase()+ "\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 

    return pCalendar;
}

export function processClubEvent(event, pCalendar){
	//---------------------------------------------initialise-----------------------
	//	not relevant
	//---------------------------------------------process league & team-------------
	//	not relevant
	//---------------------------------------------process where-----------------------
	let wWhere = "";
	//---------------------------------------------process rinks-----------------------
	let wRinks = processRinks(event);
	//---------------------------------------------process mix-----------------------
	let wMix = processMix(event);
	//---------------------------------------------process summary line-----------------
	let wFullSummary = ""
	if (event.homeAway === PLAYED_AT.HOME) {
		wWhere = "Home";
		wFullSummary =event.subject;
		pCalendar.summary = event.subject;
		pCalendar.location = "";
		//toInsert.location = wHomeLocation;
	} else {
		wWhere = "Away";
		wFullSummary = event.subject;
		pCalendar.summary = event.subject + " (" + wWhere + ")";
		pCalendar.location = "";
	}
	//---------------------------------------------process use type----------------------
	let wUseType = "Club Event";
	pCalendar.useType= wUseType;
	//---------------------------------------------process dress-----------------------
	let wDress = processDress(event);
	//---------------------------------------------process summary field-----------------
	pCalendar.desc1 = wFullSummary + "\n";
	//---------------------------------------------process description----------------
	pCalendar.desc2 =wMix + wWhere.toLowerCase() + " " + wUseType.toLowerCase()+ "\n";
	pCalendar.desc3 = "";
	if (wRinks !== "") {
		pCalendar.desc3 = wRinks + "\n";
	}
	pCalendar.desc4 = wDress; 
    return pCalendar;

}

export function processRinks(event) {
	//---------------------------------------------process rinks-----------------------
	let wRinks = "";
	switch (event.rinks) {
		case "0":
			wRinks = "";
			break;
		case "A":
			wRinks = "All rinks";
			break;
		default:
			if (event.mix === MIX.MIXED) {
				wRinks = event.rinks + "mxd";
			} else {
				wRinks = event.rinks.toString();
			}
			switch (event.gameType) {
				case EVENT_GAME_TYPE.FOURS:
					wRinks = wRinks + "R";
					break;
				case EVENT_GAME_TYPE.TRIPLES:
					wRinks = wRinks + "T";
					break;
				case EVENT_GAME_TYPE.PAIRS:
				case EVENT_GAME_TYPE.DOUBLES:
					wRinks = wRinks + "P";
					break;
				case EVENT_GAME_TYPE.SINGLES:
					wRinks = wRinks + "S";
					break;
				case EVENT_GAME_TYPE.TYPE_X:
					wRinks = wRinks + "R";
					break;
				default:
					wRinks = wRinks + "R";
					break;
			}
			break;
	}
	return wRinks;
}	

export function processDress(event) {
	let wDress = event.dress;
	switch (wDress) {
		case "G":
			wDress = "Greys";
			break;
		case "W":
			wDress = "Whites";
			break;
		case "Q":
			wDress = "Ask re dress code";
			break;
		case "X":
			wDress = "";
			break;
		default:
			wDress = "";
			break;
	}
	return wDress;
}

export function processMix(event) {
	let wMix = event.mix;
	switch (wMix) {
		case MIX.LADIES:
			wMix = "Ladies' ";
			break;
		case MIX.MENS:
			wMix = "Men's ";
			break;
		case MIX.MIXED:
			wMix = "Mixed ";
			break;
		default:
			wMix = "Mixed ";
			break;
	}
	return wMix;
}

export function convertNullsToX (pIn) {
  	//convert a null or equivalent into a X so that the dropdown displays blank
  	if (pIn === "" || pIn === " " || pIn === null  || typeof pIn === 'undefined') {
    	pIn = "X";
  	}
  	return pIn;
}

export function convertUndefinedToNull (pIn) {
  	if (typeof pIn === 'undefined') {
    	pIn = null;
  	}
	return pIn;
}

export function convertXToNull (pIn) {
	// the converse of convertNullsToX
	if (pIn === "X") {
    	pIn = null;
  	}
  	return pIn;
}
