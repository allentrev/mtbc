//------------------------------------------------------------------------------------------------------
//
//	The main pupose of this page is to show a visitor all the events held in the MTBC Google Calendar.
//
//	The calendar can be displayed in either Month or Agenda view if a desktop or tablet is being used.
//	If a mobile is used, only the Agenda option is given as there is not enough space on a mobile to 
//	properly didplay the Month calendar.
//
//------------------------------------------------------------------------------------------------------

import wixWindow 					from 'wix-window';
import wixLocation 					from 'wix-location';

import { getAllEventsForYear }		from 'backend/backEvents.jsw';
import { prepareRow }				from 'public/objects/event';
import { getRinksValue }         	from 'backend/backEvents.jsw';
import { EVENT }		         	from 'public/objects/event.js';

import { convertDuration }			from 'public/fixtures';
import { parseDateTimeFromInput }	from 'public/fixtures';
import { loadCalendars }			from 'public/objects/calendar';
import { formatDate }				from 'public/fixtures';
import { parseStartDate }			from 'public/fixtures';
import { formatDateString }			from 'public/fixtures';
import { DateToOrdinal }			from 'backend/backEvents.jsw';

let toCalendarRecord = {
	"summary": "",
	"location": "",
	"useType": "",
	"desc1": "",
	"desc2": "",
	"desc3": "",
	"desc4": "",
	"note": "",
	"startDate": "",
	"startDateTime": "",
	"endTime": "",
	"saveAllowed": false,
	"cancelled": false,
	"home": true
};

let gFilterList = [];
let gCals = [];
let gEventsInYear;
let gFromDate;
let gFromJDate;
let gToDate;
let gToJDate;
let gMode = "M";

$w.onReady(async function () {
	try {
		let wToday = new Date();
		wToday.setHours(10, 0, 0, 0);
		$w('#drpMode').value = gMode;
		[gFromDate, gToDate] = getFromToDates( new Date());
		
		let wResult = await getAllEventsForYear(gFromDate.getFullYear());
		//let wResult = await getAllEventsForYear(2023);
		gEventsInYear = wResult.events //wEventsInYear = await getAllEventsForYear(2022);
		//console.log(gEventsInYear);
		await loadCalendarData();
		await initialiseCalendarList();
		await modifyDate(0);	// display from today's date

		if(wixWindow.formFactor === "Mobile"){
			$w('#boxClosed').expand();
			$w('#boxOpen').collapse();
		}
		
		$w('#rptSchedule').onItemReady ( ($item, itemData, index) => {
			loadSchedule($item, itemData, index);
		})
		
		$w('#rptCalendar').onItemReady ( ($item, itemData, index) => {
			loadRptCalendar($item, itemData, index);
		})
	}
	catch (err){
		console.log("/page AllEvents onReady try-catch error, err");
		console.log(err);
		wixLocation.to("/syserror");
	}
});

async function initialiseCalendarList() {
	await setCalendarAll();
}

function getFromToDates(pDate){
	let wYear = pDate.getFullYear();
	let wMonth = pDate.getMonth();
	let wDate = pDate.getDate();
	let wFromDate = new Date(wYear, wMonth, wDate, 10, 0, 0);
	let wToDate = new Date(wYear, wMonth, wDate, 10, 0, 0);

	let wFromDayInWeek = 0;
	switch (gMode) {
		case "W":
			wFromDayInWeek = pDate.getDay()	//Sunday = 0
			if (wFromDayInWeek === 0) {
				wFromDate.setDate(wDate - 6);
			} else {
				wFromDate.setDate(wDate - wFromDayInWeek + 1);
			}
			wToDate.setDate(wFromDate.getDate() + 7);
			break;
		case "M":
			wMonth = pDate.getMonth();
			wFromDate = new Date(pDate.getFullYear(), wMonth, 1, 10, 0, 0);
			wToDate = new Date(pDate.getFullYear(), wMonth + 1, 1, 10, 0, 0);
			break;
		default:	//"S"
			wFromDate = pDate;
			wToDate = new Date (pDate.getFullYear(), 11, 1, 10, 0, 0);
			break;
	}
	return [wFromDate, wToDate];
}
async function loadRptCalendar($item, itemData, index) {
	let wRed = itemData.calColour[0];
	let wGreen = itemData.calColour[1];
	let wBlue = itemData.calColour[2];
	$item('#chkCalendar').style.backgroundColor = `rgb(${wRed},${wGreen},${wBlue})`;
	$item('#txtCalendar').text = itemData.name;
	$item('#txtCalendarAbr').text = itemData.abr;
}

async function loadSchedule($item, itemData, index) {
	let [wRed, wGreen, wBlue] = await getCalendarColour(itemData.calKey);
	let wDuration = await convertDuration(itemData.duration);
	let wDates = await parseDateTimeFromInput(itemData.startDate, itemData.startTime, wDuration);
	let wSubject = itemData.subject;
	let wVenue = (itemData.homeAway === "H") ? "Home" : "Away";
	if (itemData.status === EVENT.CANCELLED) {
		wSubject = wSubject + " (CANCELLED) ";
	}
	$item('#txtDate').text = String(wDates.start.nDate).padStart(2,"0");
	$item('#txtMonthDay').text = wDates.start.strMonth + ", " + wDates.start.strDay;
	$item('#boxCal').style.backgroundColor =  `rgb(${wRed},${wGreen},${wBlue})`;
	$item('#txtTime').text = itemData.startTime + " - " + wDates.end.strTime;
	$item('#txtVenue').text = wVenue;
	$item('#txtSubject').text = wSubject;
	$item('#lblId').text = itemData._id;
}

async function loadScheduleData(){

	function isInList(item) {
		let wTest = this.includes(item.calKey);
    	return wTest;
	}
	let wFilteredData = gEventsInYear.filter( isInList, gFilterList);
	//console.log(wFilteredData);
	let wDisplayData = wFilteredData.filter ( item => item.requiredJDate >= gFromJDate && item.requiredJDate < gToJDate);
	//console.log(gFromJDate, gToJDate);
	//console.log(wDisplayData);
	if (wDisplayData.length === 0){
		$w('#txtNoEvents').expand();
		$w('#rptSchedule').collapse();
	} else {
		$w('#txtNoEvents').collapse();
		$w('#rptSchedule').expand();
	}
	$w('#rptSchedule').data = wDisplayData;
}


async function modifyDate(pInc){
	let wMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	let wYear = parseInt(gFromDate.getFullYear(),10);
	let wMonth = parseInt(gFromDate.getMonth(),10);
	let wDate = parseInt(gFromDate.getDate(),10);
	let wTime = gFromDate.getTime();
	let wHeaderDate = "";
	switch (gMode) {
		case "W":
			gFromDate = new Date(wTime + (7 * pInc * 24 * 60 * 60 * 1000));
			gFromJDate = await DateToOrdinal(gFromDate);
			gToDate = new Date(gFromDate.getTime() + (7 * 24 * 60 * 60 * 1000));
			gToJDate = await DateToOrdinal(gToDate);
			wHeaderDate = formatDateString(gFromDate,"Long");
			break;
		case "M":	
			gFromDate = new Date(wYear, wMonth + pInc, 1, 10, 0, 0);
			gFromJDate = await DateToOrdinal(gFromDate);
			gToDate = new Date(wYear, wMonth + pInc + 1, 1, 10, 0, 0);
			gToJDate = await DateToOrdinal(gToDate);
			wHeaderDate = wMonths[gFromDate.getMonth()];
			break;
		default: // "S"
			gFromDate = new Date(wYear, wMonth, wDate + pInc, 10, 0, 0);
			gFromJDate = await DateToOrdinal(gFromDate);
			gToDate = new Date(wYear, 11, 1, 10, 0, 0);
			gToJDate = await DateToOrdinal(gToDate);
			wHeaderDate = formatDateString(gFromDate,"Long");
			break;
	}

	$w('#lblHeaderDate').text  = wHeaderDate;
	await loadScheduleData();
}

async function loadCalendarData() {
	gCals = await loadCalendars();
	$w('#rptCalendar').data = gCals;
}

export function txtClosed_click(event) {
	$w('#boxOpen').expand();
	$w('#boxClosed').collapse();
}

export async function btnBoxOpenClose_click(event) {
	$w('#boxOpen').collapse();
	$w('#boxClosed').expand();
	$w('#boxDetail').collapse();

	await loadScheduleData();
}

export function btnBoxDetailClose_click(event) {
	$w('#boxDetail').collapse();
	if(wixWindow.formFactor === "Mobile"){
		$w('#rptSchedule').scrollTo();
	}
}

export function drpMode_change(event) {
	let wNewDate = (gMode === "M") ? new Date(gFromDate.getFullYear(), gFromDate.getMonth(), 1, 10, 0, 0) : gFromDate;	
	gMode = event.target.value;
	[gFromDate, gToDate] = getFromToDates(wNewDate);
	modifyDate(0);
}

export async function btnHeaderToday_click(event) {
	let wToday = new Date();
	[gFromDate, gToDate] = getFromToDates(wToday);
	await modifyDate(0);
}

export async function btnHeaderLast_click(event) {
	await modifyDate(-1);
}

export async function btnHeaderNext_click(event) {
	await modifyDate(+1);
}

function getCalendarColour(pCalKey){
	let wCal = gCals.find(wCal => wCal.abr === pCalKey);
	if (wCal){
		return[wCal.calColour[0], wCal.calColour[1], wCal.calColour[2]];
	}else {
		return [255,255,255];
	}
}

export function chkCalendar_click(event) {
	let $item = $w.at(event.context);
	if ($item('#chkCalendar').checked) {
		addCalendarList($item('#txtCalendarAbr').text);
	} else  {
		popCalendarList($item('#txtCalendarAbr').text);
		$w('#chkCalendarAll').checked = false;
	}
}

function popCalendarList(pAbr){
	let wIdx = gFilterList.indexOf(pAbr);
	if (wIdx !== -1) {
		gFilterList.splice(wIdx, 1);
	}
}

function addCalendarList(pAbr){
	let wIdx = gFilterList.indexOf(pAbr);
	if (wIdx === -1) {
		gFilterList.push(pAbr);
	}
}

export async function chkCalendarAll_click(event) {
	if ($w('#chkCalendarAll').checked){
		await setCalendarAll();
	} else {
		$w('#chkCalendar').checked = false;
		gFilterList.length = 0;
	}
}

async function setCalendarAll(){
	$w('#chkCalendarAll').checked = true;
	let wCals = await loadCalendars();
	gFilterList = [];
	for (let wCal of wCals) {
		gFilterList.push(wCal.abr);
	}
	$w('#rptCalendar').forEachItem( ($item) => {
		$item('#chkCalendar').checked = true;
	})
}

export async function cntSchedule_click(event) {
	let $item = $w.at(event.context);
	let wId = $item('#lblId').text;
	let wEvent = gEventsInYear.find(item => item._id === wId);
	toCalendarRecord = await prepareRow(wEvent, toCalendarRecord);
	toCalendarRecord.cancelled = false;
	if (wEvent.status === EVENT.CANCELLED) {
		toCalendarRecord.cancelled = true;
	}
	toCalendarRecord.home = true;
	if (wEvent.homeAway === "A") {
		toCalendarRecord.home = false;
	}
	toCalendarRecord.startDate = wEvent.startDate;
	toCalendarRecord.startDateTime = wEvent.starTime;
	let wDuration = convertDuration(wEvent.duration);
	let dateResults = await parseDateTimeFromInput(wEvent.startDate, wEvent.startTime, wDuration);
	toCalendarRecord.startDateTime = wEvent.startTime;
	toCalendarRecord.endTime = dateResults.end.strTime;
	populateDetail(wEvent.rinks, toCalendarRecord);

	//console.log(wEvent);
	$w('#boxDetail').expand();
	$w('#boxDetail').scrollTo();
}

async function populateDetail(pRinks, pRecord){
	let wDesc =  pRecord.desc1 + pRecord.desc2 + pRecord.desc3 + pRecord.desc4 + "\n"
	$w('#txtTitle').text = pRecord.summary;
	$w('#txtDetailDate').text = formatDateString(pRecord.startDate, "Long");
	$w('#txtTimes').text = pRecord.startDateTime + " - " + pRecord.endTime;
	$w('#txtDesc').text = wDesc;
	if (pRecord.note) {
		if (pRecord.note.length > 0 ){
			$w('#txtNote').expand();
			$w('#txtNote').text = pRecord.note;
		} else {
			$w('#txtNote').collapse();
			$w('#txtNote').text = "";
		}

	} else {
		$w('#txtNote').collapse();
		$w('#txtNote').text = "";
	}
	
	if (pRecord.cancelled) { 
		$w('#txtCancelled').expand();
		$w('#btnDetailBookings').collapse();
	} else {
		$w('#txtCancelled').collapse();
		let wURL = ``;
		$w('#btnDetailBookings').collapse();
		if (pRecord.home) {
			let wRinks = await getRinksValue(6,pRinks);		// it doesnt matter what the max slots per day is as long as > 0
			if (wRinks > 0) {
				$w('#btnDetailBookings').expand();
				let wDate = pRecord.startDate;
				let wYear = wDate.getFullYear();
				let wMonth = wDate.getMonth();
				let wDay = wDate.getDate();
				let wURL = `/booking?requiredYear=${wYear}&requiredMonth=${wMonth}&requiredDay=${wDay}`;
				$w('#txtURL').text = wURL;
			}
		}
	}
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function btnDetailBookings_click(event) {
	wixLocation.to($w('#txtURL').text);
}