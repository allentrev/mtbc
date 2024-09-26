//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is give a MEMBER the means to maintain the list of winners and runners-up
//	in the last Club Championship.
//
//	This facility can only ne peformed on a tablet or desktop due to space requirements.
//
//	TODO: Implement role checking to ensure only a Manager or higher does this 
//	TODO: Do a code review of this page and previous. Feel uncomfortable with it as it stands.
//------------------------------------------------------------------------------------------------------
import wixWindow 			from 'wix-window';

import {addTeam}			from 'public/objects/team.js';
import {getClubCompGames}	from 'public/objects/clubCompGame.js';
import {updateClubCompGame}	from 'public/objects/clubCompGame.js';

let wDataIn = [];
let wDataOut = [];
let wTeamData = [];
let wRow = [];
let wTeamRow =[];
let wControl = [];
let wIdx = 0;
let wTeamIdx = 0;
let wColName = "";


var toInsertRow = {
    "mix": "",
	"title": "",
	"type": "",
	"winner": "",
	"second": ""
};

var toInsertTeamRow = {
	"place": "",
	"member": ""
}

var toInsertControl = {
	"id": "",
    "changed": ""
};

$w.onReady(function () {
	//TODO: write your page related code here...
	$w('#text33').text = wixWindow.formFactor;
	console.log(wixWindow.formFactor);
	if(wixWindow.formFactor === "Mobile"){
		$w('#cstrpTeam').collapse();
		$w('#columnStrip1').collapse();
		$w('#columnStrip2').collapse();
		$w('#cstrpMobile').expand();
	} else {
		$w('#cstrpMobile').collapse();
		$w('#cstrpTeam').collapse();
		$w('#columnStrip1').expand();
		$w('#columnStrip2').expand();
		loadTableData();
	}
});

// ------------------------------------------------ Page level Stuff ----------------------------------------------------------
export function drpMix_change(event) {
	wDataIn = [];
	wDataOut = [];
	wTeamRow = [];
	wControl = [];
	loadTableData();
	$w('#txtStep2').show();
}

export function btnSave_click(event) {
	var i;
	for (i = 0; i < wControl.length; i++) {
		let wItem = wControl[i];
		if (wItem.changed === "Y") {
			updateClubCompGame(wItem.id, wDataOut[i].winner, wDataOut[i].second);
		}
	}
	$w('#btnAddName').hide();
	$w('#btnClearName').hide();
	$w('#txtStep2').hide();
	$w('#txtStep3').hide();
}

export async function loadTableData () {
	let wMix = $w('#drpMix').value 
	wDataIn = await getClubCompGames(wMix);
	if (wDataIn) {
		wDataIn.forEach(processRow);
	}
	$w('#tblGames').rows = wDataOut;
}

async function processRow (pEvent, count) {
	toInsertRow.mix ="";
	toInsertRow.title ="";
	toInsertRow.type ="";
	toInsertRow.winner="";
	toInsertRow.second="";

	toInsertControl.id ="";
	toInsertControl.changed = "";

	if (pEvent.type === "S"){
		processSingleGame(pEvent);
	} else {
		processTeamGame(pEvent);
	}
	//console.log("Id = " + pEvent._id)
	//console.log("Mix = " + pEvent.mix);
	//console.log("Title = " + pEvent.title);
	//console.log("Type = " + pEvent.type);
	//console.log("Winner = " + pEvent.winner);
	//console.log("Second = " + pEvent.second);
	wDataOut[wDataOut.length] = {"title": toInsertRow.title, "type": toInsertRow.type, "winner": toInsertRow.winner, "second": toInsertRow.second};
	wControl[wControl.length] = {"id": toInsertControl.id, "changed": toInsertControl.changed};
}
	
function processSingleGame(event){
	toInsertRow.title = event.title;
	toInsertRow.type = event.type;
	toInsertRow.winner = removeNulls(event.winner);
	toInsertRow.second = removeNulls(event.second);
	toInsertControl.id = event._id;
	toInsertControl.changed = "N";
}

function processTeamGame(event){
	toInsertRow.title = event.title;
	toInsertRow.type = event.type;
	toInsertRow.winner = removeNulls(event.winner);
	toInsertRow.second = removeNulls(event.second);
	toInsertControl.id = event._id;
	toInsertControl.changed = "N";
}

function removeNulls(pIn){
	if (pIn === null || pIn === undefined ) {
		return "";
	} else {
		return pIn;
	}
}

// ------------------------------------------------ Games Table Code ----------------------------------------------------------

export function tblGames_cellSelect(event) {
	wIdx = event.cellRowIndex;
	wRow = wDataOut[wIdx]; 
	wColName = indexFromColId(event.cellColumnId);
	$w('#btnAddName').show();
	$w('#btnClearName').show();
	$w('#txtStep3').show();
}

export function btnAddName_click(event) {
	if (wRow.type === "S") {
		wixWindow.openLightbox("lbxSelectMember")	// could return a success result
    		.then( (member)   => {
				if (member) {
					wRow[wColName] = member.fullName;
					//console.log(member);
					$w('#tblGames').updateRow(wIdx, wRow);
					$w("#btnSave").show();
					$w('#grpSaveChanges').show();
					wControl[wIdx].changed = "Y";
				} else {event
					console.log("Page X: Select lightbox failed");	
				}
        	}); //then}
	} else {
		let wNum = convertToNumber(wRow.type);
		$w("#tblTeam").rows = [];
		wTeamData=[];
		$w('#cstrpTeam').expand()
			.then( (strip) => {
				var i;
				for (i = 0; i < wNum; i++) {
					toInsertTeamRow.place = (i+1).toString();
					toInsertTeamRow.member = "";
					wTeamData[wTeamData.length] = {"place": toInsertTeamRow.place, "member": toInsertTeamRow.member};
				}
				$w("#tblTeam").rows = wTeamData;
			}
		);
	}
}

export function btnClearName_click(event) {
	wRow[wColName] = "";
	$w('#tblGames').updateRow(wIdx, wRow);
	wDataOut[wIdx][wColName] = "";
	$w("#btnSave").show();
	$w('#grpSaveChanges').show();
	if (testForChange()) {
		wControl[wIdx].changed = "Y";
	} else {
		wControl[wIdx].changed = "N";
	}
}

function indexFromColId(pIn) {
  let wStr = "";
  switch (pIn) {
	  case "Title":
		  wStr = "title";
		  break;
	  case "Type":
		  wStr = "type";
		  break;
	  case "Winner":
		  wStr = "winner";
		  break;
	  case "Runner Up":
		  wStr = "second";
		  break;
	  default:
		  wStr = "winner"
		  break;
  }
  return wStr;
}

function convertToNumber(pIn) {
  let wNum = 0;
  switch (pIn) {
	  case "S":
		  wNum = 1;
		  break;
	  case "D":
		  wNum = 2;
		  break;
	  case "T":
		  wNum = 3;
		  break;
	  case "F":
		  wNum = 4;
		  break;
	  default:
		  wNum = 1
		  break;
  }
  return wNum;
}

function testForChange() {
	let wTest = false;
	if (removeNulls(wDataIn[wIdx].winner) === wDataOut[wIdx].winner) {
	} else {
		wTest = true;
	}
	if (removeNulls(wDataIn[wIdx].second) === wDataOut[wIdx].second) {
	} else {
		wTest = true;
	}
	return wTest
}

// ------------------------------------------------ Team Table Code ----------------------------------------------------------

export function tblTeam_cellSelect(event) {
	wTeamIdx = event.cellRowIndex;
	wTeamRow = wTeamData[wTeamIdx]; 
	//wColName = indexFromColId(event.cellColumnId);
	$w('#btnTeamAdd').show();
	$w('#btnTeamClear').show();

}

export async function btnSaveTeam_click(event) {
	let wTeam = $w('#tblTeam').rows;
	let wResult = await addTeam(wTeam);
	if (wResult) {
		wRow[wColName] = wResult;
		$w('#tblGames').updateRow(wIdx, wRow);
		wDataOut[wIdx][wColName] = wResult;
		wControl[wIdx].changed = "Y";
		$w('#btnSave').show();
		wTeam=[];
		$w('#tblTeam').rows=[];
		wTeamData = [];
		wTeamRow =[];
		wTeamIdx = 0;
		$w('#cstrpTeam').collapse();
	} else {
		console.log("Page: Maintain Club Comp: btnSaveTeam Fail");
	}
	//$w("#strpTeam").collapse(); 
}

export function btnTeamAdd_click(event) {
	if (wRow.type !== "S") {
		wixWindow.openLightbox("lbxSelectMember")	// could return a success result
    		.then( (member)   => {
				if (member) {
					wTeamRow["member"] = member.fullName;
					//console.log(member);
					$w('#tblTeam').updateRow(wTeamIdx, wTeamRow);
					$w("#btnSaveTeam").show();
				} else {event
					console.log("Page X: Select lightbox failed");	
				}
        	}); //then}
	}
}

export function btnTeamClear_click(event) {
	wTeamRow["member"] = "";
	$w('#tblTeam').updateRow(wTeamIdx, wTeamRow);
	$w("#btnSaveTeam").show();
}