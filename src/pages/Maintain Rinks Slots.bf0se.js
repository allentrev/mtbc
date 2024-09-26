import wixWindow				from 'wix-window';

import {getCurrentTimeSlots}		from 'public/objects/booking';
import {updateSettings}				from 'public/objects/system.js';
import {getSettingsRinkArray}		from 'public/objects/booking';
import {getSettingsSlotArray}		from 'public/objects/booking';
import {compareTime}				from 'public/fixtures';
//import {DateToOrdinal}				from 'backend/backEvents.jsw';

const cMonths =["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const dow = ["Dte", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let wData = [];

let w_data_change = false;

let wRinksArray = [];
let wSlotsArray = [];

let w_selected_cell = "";
let w_last_selected_cell = "";
let wSelectedSlotCell = "";
let wLastSelectedSlotCell = "";

let w_today = new Date();
let w_month = w_today.getMonth();
let w_year = w_today.getFullYear();

const COLOUR = Object.freeze({
	FREE:		"rgba(207,207,155,0.5)",
	SELECTED:	"rgba(173,43,12,0.4)",
	NOT_IN_USE:	"rgba(180,180,180, 0.3)",
	BOOKED:		"#F2BF5E"
});

//TODO: review Time Ranges section
$w.onReady(async function () {

	let rinkRes = await getSettingsRinkArray();
	if (rinkRes) {
		wRinksArray = rinkRes;
	}
	let slotRes = await getSettingsSlotArray();
	if (slotRes) {
		wSlotsArray = slotRes;
	}

	$w('#txtMonth').text = cMonths[w_month];

 	$w("#rptRinks2").onItemReady( ($item, itemData, index) => {
		if (index < 8) {
			$item('#txtVal2').show();
			$item('#txtVal2').text = itemData.val;
		} else {
			let wDy = itemData._id[1];
			if (wDy === "1"){
				$item('#txtVal2').show();
				$item('#txtVal2').text = itemData.val;
			} else {
				$item('#txtVal2').text = itemData.val;
				$item('#txtOrd2').text = itemData.ord;
				$item('#boxRink2').style.backgroundColor = COLOUR.FREE;

			}
		}
	});
 	$w("#rptSlots").onItemReady( ($item, itemData, index) => {
		if (index < 8) {
			$item('#txtSlotsVal').show();
			$item('#txtSlotsVal').text = itemData.val;
		} else {
			let wDy = itemData._id[1];
			if (wDy === "1"){
				$item('#txtSlotsVal').show();
				$item('#txtSlotsVal').text = itemData.val;
			} else {
				$item('#txtSlotsVal').text = itemData.val;
				$item('#txtSlotsOrd').text = itemData.ord;
				$item('#boxSlots').style.backgroundColor = COLOUR.FREE;

			}
		}
	});
});

async function refreshRptRinks2(pIn){
	//console.log("refreshRinks2");
	//console.log($w('#rptGridM').data);
	//console.log(pIn);
	$w('#rptRinks2').forEachItem( ($item, itemData, index) => {
		if (index < 8) {
			//doNothing
		} else {
			let wItem = pIn[index];
			let wDy = wItem._id[1];
			if (wDy === 1){
				$item('#txtVal2').show();
				$item('#txtVal2').text = wItem.val;
			} else {
				$item('#txtVal2').text = wItem.val;
				$item('#txtOrd2').text = wItem.ord;
			}
		}
	});
}
async function refreshRptSlots(pIn){
	//console.log("refreshSlots");
	//console.log($w('#rptGridM').data);
	//console.log(pIn);
	$w('#rptSlots').forEachItem( ($item, itemData, index) => {
		if (index < 8) {
			//doNothing
		} else {
			let wItem = pIn[index];
			let wDy = wItem._id[1];
			if (wDy === 1){
				$item('#txtSlotsVal').show();
				$item('#txtSlotsVal').text = wItem.val;
			} else {
				$item('#txtSlotsVal').text = wItem.val;
				$item('#txtSlotsOrd').text = wItem.ord;
			}
		}
	});
}
//----------------check these
//
function loadData() {

	for ( let j= 0; j < 5; j++) {
		for (let i = 0; i < 8 ; i++){
			if (j === 0){
				//header row
				wData.push({"_id": String(j+1) + String(i+1), "val": dow[i]});
			}else {
				if (i=== 0) {
					// row hdr
					wData.push({"_id": String(j+1) + String(i+1), "val": ""});
				} else {
					//row content
					wData.push({"_id": String(j+1) + String(i+1), "val": ""});
				}
			}
		}
	}
	$w("#rptRinks2").data = wData;
}

export async function loadTimeSlots() {
	wData = await getCurrentTimeSlots();
	$w("#repeater1").data = wData;
	if (wData && wData.length === 0 ){
		console.log("/page/MaintainRinksSlots loadTimeSlots no slots");
	}
}


//	========================================= RINKs SECTION ========================================================
//

export async function btnLoad_click(event) {
	$w('#imgWait').show();
	let w_start = new Date(w_year, w_month, 1);
	let w_day = w_start.getDay();
	w_start.setDate(w_start.getDate() - w_day+1);
	wData = await doMonth(w_start);
	$w('#txtMonth').text = cMonths[w_month];
	$w('#rptRinks2').data = wData;
	
	$w('#imgWait').hide();
	$w('#btnLoad2').hide();
}

export async function btnUpdate_click(event) {
	$w('#imgWait').show();
	let w_id = $w('#lblId').text;
	let wJDate = parseInt($w('#lblOrd').text,10);
	let wData = $w('#rptRinks2').data;
	let wNewValue = parseInt($w('#inpNewValue').value,10) || 0;
	$w("#rptRinks2").forItems( [w_id], ($olditem, olditemData, oldindex) => {
			$olditem('#txtVal2').text = String(wNewValue);
	});
	wRinksArray[wJDate -1] = wNewValue;
	w_data_change = true;
	clearSelection2();
	showMsg(1,4);
	$w('#imgWait').hide();
}

export async function btnDefault_click(event) {
	$w('#imgWait').show();
	let wOrd = parseInt($w('#lblOrd').text,10);
	let wNewVal = parseInt($w('#inpNewValue').value,10) || 0;

	for (let i = (wOrd-1); i<wRinksArray.length; i++){
		wRinksArray[i] = wNewVal;
	}

	let res = await updateSettings(wRinksArray, wSlotsArray);
	wRinksArray=[];
	res = await getSettingsRinkArray();
	if (res) {
		wRinksArray = res;
	}
	let w_start = new Date(w_year, w_month, 1);
	let w_day = w_start.getDay();
	w_start.setDate(w_start.getDate() - w_day+1);
	wData = await doMonth(w_start);
	res = await refreshRptRinks2(wData);

	clearSelection2();
	showMsg(1,4);
	$w('#imgWait').hide();
}

export async function btnSaveRinks_click(event) {
	$w('#imgWait').show();
	if (saveRinksinMonth()) {
		let res = await updateSettings(wRinksArray, wSlotsArray);
		wRinksArray=[];
		res = await getSettingsRinkArray();
		if (res) {
			wRinksArray = res;
		}
	}
	$w('#ibtnNext').show();
	$w('#ibtnPrevious').show();
	showMsg(2,5);
	$w('#imgWait').hide();
}	


export function cntVal2_click(event) {
	let w_id = event.context.itemId;
	if (w_id === w_selected_cell) {return};			// clicked itself
	let $item = $w.at(event.context);
	$w('#lblId').text = w_id;
	$w('#lblOrd').text = $item('#txtOrd2').text;
	$w('#lblVal2').text = $item('#txtVal2').text;
	makeSelection2(w_id);
}

export async function ibtnPrevious_click(event) {
	$w('#imgWait').show();
	w_month--;
	let w_next = new Date (w_year, w_month, 1);
	let w_day = w_next.getDay();
	w_next.setDate(w_next.getDate() - w_day+1);
	$w('#txtMonth').text = cMonths[w_month]
	let wArr = doMonth(w_next);
	if (w_month === 1){ $w('#ibtnPrevious').hide()};
	 $w('#ibtnNext').show()
	let res = await refreshRptRinks2(wArr);
	$w('#imgWait').hide();
}

export async function ibtnNext_click(event) {
	$w('#imgWait').show();
	w_month++;
	let w_next = new Date (w_year, w_month, 1);
	let w_day = w_next.getDay();
	w_next.setDate(w_next.getDate() - w_day+1);
	$w('#txtMonth').text = cMonths[w_month]
	let wArr = doMonth(w_next);
	if (w_month === 10){ $w('#ibtnNext').hide()};
	 $w('#ibtnPrevious').show()
	let res = await refreshRptRinks2(wArr);
	$w('#imgWait').hide();
}
//	========================================= RINKS SUPPORTING FUNCTIONS ========================================================
//

function saveRinksinMonth() {
	w_data_change = false;
	clearSelection2();
	$w('#rptRinks2').forEachItem( ($item, itemData, index) => {
		let wWk = parseInt(itemData._id[0],10);
		let wDy = parseInt(itemData._id[1],10);
		if (wWk !== 1) {
			if (wDy !== 1) {
				let wOrd = parseInt($item('#txtOrd2').text,10);
				let wNewVal = parseInt($item('#txtVal2').text,10) || 0;
				let wOldVal = parseInt(itemData.val,10) || 0;
				if (wNewVal !== wOldVal) {
					wRinksArray[wOrd-1] = wNewVal;
					w_data_change = true;
				}
			}
		}
	});
	return w_data_change;
}

export function doMonth(pDate) {

	const dow = ["Dte", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	let wArray = [];
	
	let wX = new Date(pDate);
	let wDay = String(wX.getDate()) + "/" + String(wX.getMonth()+1);
	let wOrd = DateToOrdinal(pDate);
	let x = 0;
	let y = 1;
	let z = 0;
	
	for (let i = 0; i < 8 ; i++){
		wArray.push({"_id": "1" + String(i+1), "ord": String(i), "val": dow[i]});
	}

	do {
		wArray.push({"_id": String(y+1) +"1", "ord": String(wOrd), "val": wDay});
		for (let k=1; k<8; k++){
			wArray.push({"_id": String(y+1) + String(k+1), "ord": String(wOrd + 7*x +k-1), "val": String(wRinksArray[ wOrd + 7*x +k-2])});
		}
		y++;
		x++;
		pDate.setDate(pDate.getDate() + 7);
		wDay = String(pDate.getDate()) + "/" + String(w_month+1);
		if (z > 10) { break} ;
		z++;
	} while (pDate.getMonth() === w_month);
	return wArray;
}	

function makeSelection2(pCellId){
	let w_id = $w('#lblId').text;
	//console.log("Rinks mks last id", "*" + w_last_selected_cell + "*", "<" + w_id + ">");
	if (w_last_selected_cell !== "") {
		$w("#rptRinks2").forItems( [w_last_selected_cell], ($olditem, olditemData, oldindex) => {
				$olditem('#boxRink2').style.backgroundColor = COLOUR.FREE;
		});
	}
	w_last_selected_cell = w_id;
	//console.log("Rinks mks", w_last_selected_cell);
	$w("#rptRinks2").forItems( [w_id], ($olditem, olditemData, oldindex) => {
			$olditem('#boxRink2').style.backgroundColor = COLOUR.SELECTED;
	});

	w_selected_cell = pCellId;
}

function clearSelection2(){
	//console.log("clearSelect");
	if (w_selected_cell === "") {return};
	$w("#rptRinks2").forItems([ w_last_selected_cell], ($olditem, olditemData, oldindex) => {
		$olditem('#boxRink2').style.backgroundColor = COLOUR.FREE;
	});
		//no previous selection
	w_selected_cell = "";
	w_last_selected_cell = "";
}

//	========================================= SLOT MAIN SECTION ========================================================
//

export async function btnSlotLoad_click(event) {
	$w('#imgSlotsWait').show();
	let w_start = new Date(w_year, w_month, 1);
	let w_day = w_start.getDay();
	w_start.setDate(w_start.getDate() - w_day+1);
	wData = await doSlotsMonth(w_start);
	$w('#txtSlotsMonth').text = cMonths[w_month]
	$w('#rptSlots').data = wData;
	
	$w('#imgSlotsWait').hide();
	$w('#btnSlotLoad').hide();
}

export async function ibtnSlotNext_click(event) {
	$w('#imgSlotsWait').show();
	w_month++;
	let w_next = new Date (w_year, w_month, 1);
	let w_day = w_next.getDay();
	w_next.setDate(w_next.getDate() - w_day+1);
	$w('#txtSlotsMonth').text = cMonths[w_month]
	let wArr = doSlotsMonth(w_next);
	if (w_month === 10){ $w('#ibtnSlotNext').hide()};
	 $w('#ibtnSlotPrevious').show()
	let res = await refreshRptSlots(wArr);
	$w('#imgSlotsWait').hide();
}

export async function ibtnSlotPrevious_click(event) {
	$w('#imgSlotsWait').show();
	w_month--;
	let w_next = new Date (w_year, w_month, 1);
	let w_day = w_next.getDay();
	w_next.setDate(w_next.getDate() - w_day+1);
	$w('#txtSlotsMonth').text = cMonths[w_month]
	let wArr = doSlotsMonth(w_next);
	if (w_month === 1){ $w('#ibtnSlotPrevious').hide()};
	 $w('#ibtnSlotNext').show()
	let res = await refreshRptSlots(wArr);
	$w('#imgSlotsWait').hide();
}

export async function btnSlotSave_click(event) {
	$w('#imgSlotsWait').show();
	if (saveSlotsinMonth()) {
		let res = await updateSettings(wRinksArray, wSlotsArray);
		wSlotsArray=[];
		res = await getSettingsSlotArray();
		if (res) {
			wSlotsArray = res;
		}
	}
	$w('#ibtnSlotNext').show();
	$w('#ibtnSlotPrevious').show();
	showMsg(2,5);
	$w('#imgSlotsWait').hide();
}

export async function btnSlotUpdate_click(event) {
	$w('#imgSlotsWait').show();
	let w_id = $w('#lblSlotsId').text;
	let wJDate = parseInt($w('#lblSlotsOrd').text,10);
	let wData = $w('#rptSlots').data;
	let wNewValue = String($w('#inpNewRange').value) + "/" + String($w('#inpNewSlots').value);
	let wNewArrayValue = {
		"range": String($w('#inpNewRange').value),
		"slots": String($w('#inpNewSlots').value)
	}
	$w("#rptSlots").forItems( [w_id], ($olditem, olditemData, oldindex) => {
			$olditem('#txtSlotsVal').text = String(wNewValue);
	});
	wSlotsArray[wJDate -1] = wNewArrayValue;
	w_data_change = true;
	clearSlotSelection();
	showMsg(1,4);
	$w('#imgWait').hide();
}

export async function btnSlotDefault_click(event) {
	$w('#imgSlotsWait').show();
	let wOrd = parseInt($w('#lblSlotsOrd').text,10);
	let wNewArrayValue = {
		"range": String($w('#inpNewRange').value),
		"slots": String($w('#inpNewSlots').value)
	}
	for (let i = (wOrd-1); i<wRinksArray.length; i++){
		wSlotsArray[i] = wNewArrayValue;
	}

	let res = await updateSettings(wRinksArray, wSlotsArray);
	wSlotsArray=[];
	res = await getSettingsSlotArray();
	if (res) {
		wSlotsArray = res;
	}
	let w_start = new Date(w_year, w_month, 1);
	let w_day = w_start.getDay();
	w_start.setDate(w_start.getDate() - w_day+1);
	wData = await doSlotsMonth(w_start);
	res = await refreshRptSlots(wData);

	clearSlotSelection();
	showMsg(1,4);
	$w('#imgSlotsWait').hide();

	//btnLoad_click();
}

export function cntSlots_click(event) {
	let w_id = event.context.itemId;
	//console.log("cntSots click w_wid", w_id);
	if (w_id === wSelectedSlotCell) {return};			// clicked itself
	let $item = $w.at(event.context);
	$w('#lblSlotsId').text = w_id;
	$w('#lblSlotsOrd').text = $item('#txtSlotsOrd').text;
	let wEntry = $item('#txtSlotsVal').text;
	let wOldRange = wEntry.split("/");
	let wRange = parseInt(wOldRange[0], 10) || 0;
	let wNoSlots = parseInt(wOldRange[1], 10) || 0;
	$w('#lblOldRange').text = String(wRange);
	$w('#lblOldSlots').text = String(wNoSlots);
	makeSlotSelection(w_id);
}

//	========================================= SLOT MAIn SUPPORTING FUNCTIONS ========================================================
//

function saveSlotsinMonth() {
	w_data_change = false;
	clearSlotSelection();
	$w('#rptSlots').forEachItem( ($item, itemData, index) => {
		let wWk = parseInt(itemData._id[0],10);
		let wDy = parseInt(itemData._id[1],10);
		if (wWk !== 1) {
			if (wDy !== 1) {
				let wOrd = parseInt($item('#txtSlotsOrd').text,10);
				let wNewArrayVal = {
					"range": String($w('#inpNewRange').value),
					"slots": String($w('#inpNewSlots').value)
				}
				let wNewVal = String($w('#inpNewRange').value) + "/" + String($w('#inpNewSlots').value);
				let wOldVal = itemData.val;
				if (wNewVal !== wOldVal) {
					wSlotsArray[wOrd-1] = wNewArrayVal;
					w_data_change = true;
				}
			}
		}
	});
	return w_data_change;
}


function makeSlotSelection(pCellId){
	let w_id = $w('#lblSlotsId').text;
	//console.log("mks last id", "*" + wLastSelectedSlotCell + "*", "*" + w_id + "*");
	if (wLastSelectedSlotCell !== "") {
		$w("#rptSlots").forItems( [wLastSelectedSlotCell], ($olditem, olditemData, oldindex) => {
				$olditem('#boxSlots').style.backgroundColor = COLOUR.FREE;
		});
	}
	wLastSelectedSlotCell = w_id;
	$w("#rptSlots").forItems( [w_id], ($olditem, olditemData, oldindex) => {
			$olditem('#boxSlots').style.backgroundColor = COLOUR.SELECTED;
	});

	wSelectedSlotCell = pCellId;
}

function clearSlotSelection(){
	//console.log("clearSelect");
	if (wSelectedSlotCell === "") {return};
	$w("#rptSlots").forItems( [wLastSelectedSlotCell], ($olditem, olditemData, oldindex) => {
		$olditem('#boxSlots').style.backgroundColor = COLOUR.FREE;
	});
		//no previous selection
	wSelectedSlotCell = "";
	wLastSelectedSlotCell = "";
}

export function doSlotsMonth(pDate) {

	const dow = ["Dte", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	let wArray = [];
	
	let wX = new Date(pDate);
	let wDay = String(wX.getDate()) + "/" + String(wX.getMonth()+1);
	let wOrd = DateToOrdinal(pDate);
	let x = 0;
	let y = 1;
	let z = 0;
	
	for (let i = 0; i < 8 ; i++){
		wArray.push({"_id": "1" + String(i+1), "ord": String(i), "val": dow[i]});
	}

	do {
		wArray.push({"_id": String(y+1) +"1", "ord": String(wOrd), "val": wDay});
		for (let k=1; k<8; k++){
			let wVal = wSlotsArray[ wOrd + 7*x +k-2];
			wArray.push({"_id": String(y+1) + String(k+1), "ord": String(wOrd + 7*x +k-1), "val": String(wVal.range) + "/" + String(wVal.slots)});
		}
		y++;
		x++;
		pDate.setDate(pDate.getDate() + 7);
		wDay = String(pDate.getDate()) + "/" + String(w_month+1);
		if (z > 10) { break} ;
		z++;
	} while (pDate.getMonth() === w_month);
	return wArray;
}	

//	========================================= SLOTS RANGES SECTION ========================================================
//
export function btnPlus_click(event) {
	$w('#lblMsg').hide();
	let dataArray = $w("#repeater1").data;
	let wX = dataArray.length - 1;
	let wSlot = {};
	let wId = dataArray[wX].slotId + 1;
	wSlot._id = wId.toString();
	wSlot.slotId = wId;
	wSlot.timeFrom = dataArray[wX].timeFrom;
	wSlot.timeTo = dataArray[wX].timeTo;
	dataArray.push(wSlot)
	$w("#repeater1").data = dataArray;
	$w('#btnMinus').enable();
}

export function btnMinus_click(event) {
	$w('#lblMsg').hide();
	let dataArray = $w("#repeater1").data;
	dataArray.pop();
	$w("#repeater1").data = dataArray;
	if (dataArray.length === 1) {
		$w('#btnMinus').disable();
	}
	$w('#btnResetSlots').enable();
	$w('#btnSaveSlots').enable();
	$w('#dtpkrSlotsEffective').enable();
}

export function btnResetSlots_click(event) {
	loadTimeSlots();
	$w('#btnSaveSlots').disable();
	$w('#dtpkrSlotsEffective').disable();
}

export function btnSaveSlots_click(event) {
	if (slotsValid()) {
		$w('#lblMsg').show();
		$w('#btnSaveSlots').disable();
		$w('#dtpkrSlotsEffective').disable();
	}
}

export async function slotsValid() {
	let w_valid = true;
	var w_last_to = "";
	var w_this_from = "";
	$w("#repeater1").forEachItem( ($item, itemData, index) => {
			if (index === 0) {
				w_last_to = $item('#tmpkrTo').value;
			} else {
				w_this_from = $item('#tmpkrFrom').value;
				if (compareTime(w_this_from, "<", w_last_to)) {
					$item('#lblSlotError').text = "Must be later than last";
					$item('#lblSlotError').show();
					w_valid = false;
				}
				w_last_to = $item('#tmpkrTo').value;
			}
	});
	return w_valid;
}

export function tmpkrFrom_change(event) {
	let $item = $w.at(event.context);
	$item('#lblSlotError').hide();
	let w_from = $item('#tmpkrFrom').value;
	let w_to = $item('#tmpkrTo').value;
	if (compareTime(w_to, ">", w_from)) {
		$w('#lblMsg').hide();
		$w('#btnSaveSlots').enable();
		$w('#dtpkrSlotsEffective').enable();
		$w('#btnResetSlots').enable();
	} else {
		$item('#lblSlotError').text = "To must be after From";
		$item('#lblSlotError').show();
	}
}

export function tmpkrTo_change(event) {
	let $item = $w.at(event.context);
	$item('#lblSlotError').hide();
	let w_from = $item('#tmpkrFrom').value;
	let w_to = $item('#tmpkrTo').value;
	if (compareTime(w_to, ">", w_from)) {
		$w('#lblMsg').hide();
		$w('#btnSaveSlots').enable();
		$w('#dtpkrSlotsEffective').enable();
		$w('#btnResetSlots').enable();
	} else {
		$item('#lblSlotError').text = "To must be after From";
		$item('#lblSlotError').show();
	}
}

//	========================================= SUPPORTING FUNCTIONS ========================================================
//

function showMsg(pErr, pSec, pControl = "lblRinksMsg") {
	let wSecs = pSec * 1000;
	let wMsg = ["Changes recorded",				// 1
				"Changes saved",
				" 1", 
				"ge",
				"ne",									// 5
		"Last Message"
	];

	$w(`#${pControl}`).text = wMsg[pErr-1];
	$w(`#${pControl}`).show();
	setTimeout(() => {
		$w(`#${pControl}`).hide();
	}, wSecs);
}

/**
 * Summary:	Convert Date to Ordinal Day
 * 
 * Description: Converts the given date string to an ordinal date.	
 * NOTE:	This function is duplicated here as it needs to be addrerssed in the same block as its called from
 * 			to avoid it returning a Promise unstead of a synchronous value
 * 
 * @function
 * @param { Date} pDate - The Date object to convert.
 * 
 * @returns {number} The ordinal date (day of the year), or -1 if the input is invalid.
 */
export function DateToOrdinal(pDate){
	try {
		const dayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (typeof pDate === "string"){ return -1}
		const dte = new Date(pDate);
		//initialize date variable
		const yy = dte.getFullYear()
		let julianDate = 0;
		//add days for previous months
		for (let i = 0; i < dte.getMonth(); i++) {
			julianDate = julianDate + dayCount[i];
		}
		//add days of the current month
		julianDate = julianDate + dte.getDate();
		//check for leap year
		if (dte.getFullYear() % 4 == 0 && dte.getMonth() > 1) {
			julianDate++;
		}

		return parseInt(julianDate,10);
	}
	catch (err) {
		console.log("/page/MaintainRinksSlots DateToOrdinal Try-catch, err");
		console.log(err);
		return -1;
	}
}
