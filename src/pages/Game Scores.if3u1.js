import wixWindow 							from 'wix-window';
import { authentication }   from 'wix-members-frontend';
import _ 						from 'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } 		from 'public/objects/member';

import { getActiveDivisionRoundBookings }	from 'public/objects/clubComp';
import { getCompetitionAllDivisions }		from 'public/objects/clubComp';
import { getCompetitorSkipId }				from 'public/objects/clubComp';
import { getTeamCompetitor }				from 'public/objects/clubComp';
import { bulkUpdateCompetitors }			from 'public/objects/clubComp';

import { bulkUpdateClubCompBookings }		from 'public/objects/clubComp';
import { getAllNewStageBookings }			from 'public/objects/clubComp';
import { getAllStageBookings }				from 'public/objects/clubComp';


import { updateBookingGameScore }			from 'public/objects/clubComp';
//import { updateBookingPlayer }				from 'public/objects/booking';
import { getGamesPlayedCount }				from 'public/objects/clubComp';

import { formatDateString }					from 'public/fixtures';
import { loadLeagueTable }					from 'public/objects/clubComp';
import { loadEP5Table }						from 'public/objects/clubComp';
import { addCompetitorGameScore } 			from 'public/objects/clubComp';
import { addCompetitorEP5GameScore }		from 'public/objects/clubComp';
import { updateEP5Bookings }				from 'public/objects/clubComp';

//import { updatePlayerScore }				from 'public/objects/openSingles.js';
import { loadStageCompetitors } 			from 'public/objects/clubComp';
import { updateCompetitionDivisionStatus }	from 'public/objects/clubComp';
import { updateClubComp }		 			from 'public/objects/clubComp';
import { getCountCompetitionOpenDivs }		from 'public/objects/clubComp';
import { loadDivCompetitors } 				from 'public/objects/clubComp';
//import { getCompBookings }					from 'public/objects/booking';
//import { loadCompCompetitors }				from 'public/objects/clubComp';


import { COMPETITION , STAGE, COMPETITOR }	from 'public/objects/clubComp';
import { COMPETITOR_TYPE }					from 'public/objects/clubComp';
import { SHAPE }							from 'public/objects/clubComp';
import { BOOKING }							from 'public/objects/booking';
import { convertNull }						from 'public/objects/clubComp';
import { loadGlobalCompetitors }			from 'public/objects/clubComp';
import { loadCompetitions }					from 'public/objects/clubComp';
import { selectCompetition }				from 'public/objects/clubComp';
import { selectStage }						from 'public/objects/clubComp';
import { selectDivision	}					from 'public/objects/clubComp';
import { selectRound }						from 'public/objects/clubComp';
//import { getCompetitions }						from 'public/objects/clubComp';

import { ROLES }   				from	'public/objects/member';

const COMPREF = Object.freeze({
  OP02:			"OP02",
  SEND5:		"5SEND"
});

const TEMP_HOLDER = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd";

let wCompRec;
let wStageRec;
let wMatchesInRound;
let wMatchesInNextRound = [];
let wRound;
let wStart = 0;

let wPromotionList = [];
let wSelectedId = null;

let gMemberCache =[];
//let wData = [];
let wRole = "Admin";
let wId = "";
let isDivisionComplete = false;

let gCompetitions = [];


let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const gYear = new Date().getFullYear();
const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {
	let status;
// for testing ------	------------------------------------------------------------------------
	//let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
	let wUser = {"_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{"title": "Manager"}]}; //Me
	//let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
	/**
	Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
	Sarah Allen		91eab866-e480-4ddc-9512-d27bbbed2f10	ab308621-7664-4e93-a7aa-a255a9ee6867
	Trevor Allen	7e864e0b-e8b1-4150-8962-0191b2c1245e	88f9e943-ae7d-4039-9026-ccdf26676a2b
	Tony Stuart		28f0e772-9cd9-4d2e-9c6d-2aae23118552	5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9
	John Mitchell	40a77121-3265-4f0c-9c30-779a05366aa9	5132409b-6d6a-41c4-beb7-660b2360054e
	Tony Roberts	4d520a1b-1793-489e-9511-ef1ad3665be2	af7b851d-c5e5-49a6-adc9-e91736530794
	Cliff Jenkins	d81b1e42-6e92-43d0-bc1e-a5985a25487a	c287a94e-d333-40aa-aea6-11691501571e
	Tim Eales		2292e639-7c69-459b-a609-81c63202b1ac	6e5b5de1-214f-4b03-badf-4ae9a6918f77
	Yoneko Stuart	93daeee8-3d4b-40cc-a016-c88e93af1559	957faf19-39cd-47ca-9b81-5a0c2863bb87
	*/

	// end of esting fudge---------------

    
    [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

    if (isLoggedIn) {
        let wRoles = loggedInMemberRoles.toString();
        console.log("/page/MaintainScores onReady Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
    } else {
        console.log("/page/MaintainScores onReady Not signed in");
    }

	gCompetitions = await loadCompetitions(gYear);
	let wGender = loggedInMember.gender;//TODO REPLAVCE
	if (wGender !== "L" && wGender !== "M" && wGender !== "X") {
		wGender = "M";
	}
	setCompetitionDropdown(wGender);
	$w('#rgpMix').value = wGender;

	$w('#boxDrops').collapse();
	$w('#boxCompetitors').collapse();
	$w('#boxLeagueTable').collapse();
	$w('#btnPlayers').hide();
	$w('#chkChanged').hide();
	$w('#boxSave').collapse();
	$w('#btnSave').disable();

	$w('#rptGames').onItemReady ( ($item, itemData, index) => {
		loadLine($item, itemData);
	})

 	$w("#rptLGTable").onItemReady(async ($item, itemData, index) => {
		await loadLGTableLine($item, itemData, index);
	});

 	$w("#rptEP5").onItemReady(async ($item, itemData, index) => {
		await loadEP5TableLine($item, itemData, index);
	});

 	$w("#rptNextDiv").onItemReady(async ($item, itemData, index) => {
		await loadRptNextDiv($item, itemData, index);
	});
});

//============================ Helper functions ===============================================
//TODO RENAME gMemberCache as its confused with gMember
function buildCache( pCompRef, intStage, intDiv) {
	//ts("Build Cache");
	gMemberCache = [];
	let wData = loadGlobalCompetitors();
	if (wData) {
		let wSet = wData.filter( (item) => item.skipId !== null);
		gMemberCache = wSet.map ( (item) => {
			return {
				"_id": item._id,
				"skipId": item.skipId,
				"skip": item.skip,
				"teamNames": item.teamNames
			}
		})
		let wItem = {"_id": TEMP_HOLDER, "skipId": TEMP_HOLDER, "skip": "Temporary Holder",
			 "teamNames": ["Temporary Holder"]};
		gMemberCache.push(wItem);
	}
	//console.log(gMemberCache);
	//te("Build Cache"); 
}

function getMember (pId){
	try {
		if (pId === null || pId === "") {return ""};
		//console.log(pId);
		let wobj = gMemberCache.find(wobj => wobj.skipId === pId);
		if (wobj) {
			return wobj;
		} else {
			console.log("/page/MaintainScore getMember" , pId, " Not found in cache");
			console.log(gMemberCache);
			return false;
		}
	}
	catch ( err ) {
		console.log("/page/MaintainScore getMember try catch ", err);
			return false;
	}
}

//============================ Repeater handlers ===============================================

async function loadLGTable() {
	if (wStageRec.shape === SHAPE.LEAGUE) {
		$w('#boxLeagueTable').expand();
		$w('#boxLGTable').expand();
		$w('#rptLGTable').data = [];
		let wData = await loadLeagueTable(wCompRec, wStageRec.stage, wStageRec.div);
		let wTableData = wData.filter(item => item.competitorId > 0);
		let first = {"_id": "1", "skip": "Player", "played": "Played", "pointsAgainst": "Against",
					"pointsFor": "For", "nextDiv": "Next"};
		wTableData.unshift(first);
		$w('#rptLGTable').data = wTableData;
		return wData;
	} else {
		$w('#boxLeagueTable').collapse();
		return [];
	}
}

function loadLine($item, itemData){
	//console.log("loadLine : itemData");
	//console.log(itemData);
	$w('#imgWait').hide();
	if (typeof itemData.playerAId === 'undefined' || itemData.playerAId === "") {
		//console.log("playerAId undefined");
		itemData.playerAId = null;
	}
	if (typeof itemData.playerBId === 'undefined' || itemData.playerBId === "") {
		//console.log("PlayerB undefined");
		itemData.playerBId = null;
	}
	$item("#txtDateRequired").text = formatDateString(itemData.dateRequired, "Short");
	if (itemData.isBye === "Y" ) {
		$item('#inpA').hide();
		$item('#inpB').hide();
		if (itemData.status === BOOKING.OPEN) {
			$item('#chkChanged').checked = true;
			//const loggedInMember = await currentMember.getMember();	// returns current member object if logged in, else is undefined
			if (loggedInMember) {
				if (isRequiredRole(["Manager", "Admin"],loggedInMemberRoles)) {
					$w('#btnSave').enable();
				}
			}
		} else if (itemData.status === BOOKING.READY) {
			$item('#txtDateRequired').text = "N/S";
			$item('#chkChanged').checked = false;	
		} else {
			$item('#chkChanged').checked = false;		//a) must already have been processed
		}
		if (itemData.playerAId === null || itemData.playerAId === ""){
			$item('#txtPlayerA').text = "Bye";
			$item("#txtPlayerB").text = (getMember(itemData.playerBId)).teamNames[0];
		} else {
			$item("#txtPlayerA").text = (getMember(itemData.playerAId)).teamNames[0];
			$item('#txtPlayerB').text = "Bye";
		}
 
	} else /** We have a real game entry */ {
		if (itemData.playerAId === null) {
			$item("#txtPlayerA").text = "Not determined yet";
			$item('#inpA').hide();
			$item('#inpB').hide();
		} else {
			$item("#txtPlayerA").text = parseTeam(itemData.playerAId);
		}
		if (itemData.playerBId === null) {
			$item("#txtPlayerB").text = "Not determined yet";
			$item('#inpA').hide();
			$item('#inpB').hide();
		} else {
			$item("#txtPlayerB").text = parseTeam(itemData.playerBId);
		}
		if (itemData.scoreA || itemData.scoreB ) {
			$item('#inpA').show();
			$item('#inpB').show();
			$item("#inpA").value = String(itemData.scoreA);
			$item("#inpB").value = String(itemData.scoreB);
			$item('#chkChanged').checked = false;
		}
		if (itemData.status === BOOKING.READY) {
			$item('#txtDateRequired').text = "N/S";
			$w('#txtRequiredBy').text = "Required By: " + formatDateString(itemData.dateRequired, "Short");
			$w('#txtRequiredBy').show();
			$item('#inpA').show();
			$item('#inpB').show();
			$w('#lblWinner').show();
			$item('#chkWinA').hide();
			$item('#chkWinB').hide();
			$item('#chkChanged').checked = false;	
		}
	}
}

export function parseTeam(pData){
	if (wCompRec.competitorType === COMPETITOR_TYPE.TEAM){
		return pData;
	} else { 
		return getMember(pData).teamNames[0];
	}	
}

export function loadLGTableLine($item, itemData, index) {
		if (index === 0 ) {
			$item('#boxRow').style.backgroundColor = "#DEB887";
			$item("#txtPos").text = "Pos";
			$item("#txtPlayer").text = itemData.skip;
			$item("#txtGamesPlayed").text = itemData.played;
			$item("#txtShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtShotsFor").text = itemData.pointsFor;
			$item("#txtDiv").text = itemData.nextDiv;
			$item("#txtDiv").show();
		} else {
			if (index < wStageRec.noPromote + 1){
				$item('#boxRow').style.backgroundColor = "rgba(255,255,51,0.8)";
			}
			$item("#txtPos").text = String(index);
			$item("#txtPlayer").text = convertNull(itemData.skip, "");
			$item("#txtGamesPlayed").text = String(itemData.played);
			$item("#txtShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtShotsFor").text = String(itemData.pointsFor);
			$item("#txtDiv").text = "";
			$item("#txtDiv").hide();
		}
	}
export function loadEP5TableLine($item, itemData, index) {
	if (index === 0 ) {
		$item('#boxEP5').style.backgroundColor = "#DEB887";
		$item("#txtEP5Place").text = "Pos";
	} else {
		if (index < wStageRec.noPromote + 1){
			$item('#boxEP5').style.backgroundColor = "rgba(255,255,51,0.8)";
		}
		$item("#txtEP5Place").text = String(index);
	}
	$item("#txtEP5Player").text = convertNull(itemData.skip, "");
	$item("#txtEP5MWin").text = String(itemData.mWon);
	$item("#txtEP5SWin").text = String(itemData.sWon);
	$item("#txtEP5SDrawn").text = String(itemData.sDrawn);
	$item("#txtEP5PointsFor").text = String(itemData.pointsFor);
}

export function loadRptNextDiv($item, itemData, index) {
	if (index === 0 ) {
		$item('#boxNextDiv').style.backgroundColor = "#DEB887";
		$item("#txtNext").text = "#";
		$item("#txtDivision").text = "Division";
		$item("#txtNoTeams").text = "No Teams";
		$item("#txtNoLeft").text = "No Left";
	} else {
		$item("#txtNext").text = String(index);
		$item("#txtDivision").text = itemData.division;
		$item("#txtNoTeams").text = itemData.noTeams;
		$item("#txtNoLeft").text = itemData.noLeft;
		if (itemData.competitor.length > 2) { 
			$item('#txtPromotees').expand();
		} else {
			$item('#txtPromotees').collapse();
		}
		$item('#txtPromotees').text = convertNull(itemData.competitor,"\n"); 
	}
}

//============================ Dropdown event handlers ===============================================

export function drpCompetition_change(event) {
//ts("drop comp change");
	resetStores();
	resetDropdowns();
	$w('#imgWait').show();
	let wRef = event.target.value;
	//if (wRef === "5END"){ 
	//	$w('#boxNothing').expand();
	//	$w('#imgWait').hide();
	//	return;
	//};
	selectCompetition(gYear, wRef)
	.then ( wResultObj => {
			if (wResultObj) {
				wCompRec = wResultObj.competitionObj;
				wStageRec = wResultObj.stageDivObj;
				wRound = 1;
				if (wCompRec.status !== COMPETITION.IN_PROGRESS && wCompRec.status !== COMPETITION.OPEN) {
					$w('#imgWait').hide();
					$w('#boxLeagueTable').collapse();
					$w('#boxEP5Table').collapse();
					$w('#boxNothing').expand();
					$w('#imgWait').hide();
					return false;
				}
				if (wStageRec) {
					wMatchesInRound = wResultObj.matchesInRoundArray;
					if (wMatchesInRound) {
						$w('#boxCompetitors').expand();
						showGames();
						$w('#imgWait').hide();
						//te("drop comp change");
						return;
					}
				}
			}
			clearMatches();
			$w('#lblManagedMsg').text = "This competition has not been configured yet";
			$w('#lblStageState').text = "";
			$w('#lblDivisionState').text = "";
			$w('#lblRoundState').text = "";
						$w('#imgWait').hide();
			$w('#boxLeagueTable').collapse();
			$w('#boxNothing').expand();
			$w('#imgWait').hide();
			//te("drop comp change");
	})
	.catch( err => {

	})
}

function resetStores(){
	wCompRec = {};			//selectComp
	wStageRec = {};			//selectComp
	wMatchesInRound = [];		//selectComp
	wMatchesInNextRound.length = 0;
	wRound =1;
	wStart = 0;

	wPromotionList.length = 0;
	wSelectedId = null;

}

function resetDropdowns() {
	$w('#boxNothing').collapse();
	$w('#boxCompetitors').collapse();
	$w('#boxLeagueTable').collapse();
	$w('#boxDrops').collapse();
}

export function drpStage_change(event) {
	//ts("drop stage change");
	$w('#imgWait').show();
	let wNewStage = parseInt(event.target.value,10);
	wRound = 1;

	let wResultObj = selectStage(wNewStage);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			wMatchesInRound = wResultObj.matchesInRoundArray;
			if (wMatchesInRound) {
				//console.log("drpStage change");
				showGames();
				$w('#imgWait').hide();
				//te("drop stage change");
				return;
			}
		}
	}
	clearMatches();
	//te("drop stage change");
}

export function drpDivision_change(event) {
	//ts("drop div change");
	$w('#imgWait').show();
	let wNewDiv = parseInt(event.target.value,10);
	wRound = 1;

	//$w('#txtTitle').text = wCompRec.title + " " + wNewDivision;
	let wResultObj = selectDivision(wStageRec.stage, wNewDiv);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			wMatchesInRound = wResultObj.matchesInRoundArray;
			if (wMatchesInRound) {
				//console.log("drpdivision change");

				showGames();
				$w('#imgWait').hide();
				//te("drop div change");
				return;
			}
		}
	}
	clearMatches();
	//te("drop div change");
}

function setCompetitionDropdown(pMix) {
    let wGenderSet = gCompetitions.filter(item => item.mix === pMix);
    //let wManualSet = wGenderSet.filter(item => item.maintainedBy === "M");
    let wManagedSet = wGenderSet.filter(item => item.maintainedBy === "A");
    let wOptions = [];
    /**
	let wManualOptionSet = wManualSet.map(item => {
        return {
            "label": item.title,
            "value": item.compRef
        }
    })
    */

	let wManagedOptionSet = wManagedSet.map(item => {
        return {
            	"label": item.title,
           		"value": item.compRef
        	}
    	})
	if (wManagedOptionSet && wManagedOptionSet.length > 0) {
		$w('#boxNoCompetitions').collapse();
		$w('#drpCompetition').expand();
	    $w('#drpCompetition').options = wManagedOptionSet;
	} else {
		$w('#drpCompetition').collapse();
		$w('#boxNoCompetitions').expand();
		//
	}
}	

export function showGames() {
	manageDropdowns();
	$w('#rptGames').expand();

	if (wCompRec.compRef === COMPREF.SEND5){
		$w('#txtTitle').text = wCompRec.title + " Round " + wStageRec.round;
	} else {
		$w('#txtTitle').text = wCompRec.title + " " + wStageRec.division + " Day 1";
	}
	if (wCompRec.competitorType !== COMPETITOR_TYPE.TEAM) {
		buildCache(wCompRec.compRef, wStageRec.stage, wStageRec.div);
	}
	//$w('#lblWinner').hide(ave_
	//$w('#chkWinA').hide();
	//$w('#chkWinB').hide();
	let wSortedMatches = _.sortBy(wMatchesInRound, ["matchKey"]);
	$w('#txtRequiredBy').text = "Required By: ";
	$w('#txtRequiredBy').hide();
	$w('#rptGames').data = wSortedMatches;
	let wElementList = $w('TextInput');			//this  affects all controls of TextInput type
	$w('#btnFixtureList').collapse();
	if (loggedInMember) {
		if (isRequiredRole(["Manager", "Admin"],loggedInMemberRoles)) {
			$w('#btnFixtureList').expand();
			if (wCompRec.status === COMPETITION.OPEN) {
				$w('#boxSave').expand();
				$w('#btnSave').enable();
				wElementList.enable();
				loadLGTable();
			} else {
				$w('#boxSave').collapse();
				wElementList.disable();
				$w('#btnSave').disable();
			}
		}
	}
	return true;
}


async function manageDropdowns() {
	$w('#boxDrops').expand();
	if ($w('#drpStage').options.length > 1) { $w('#drpStage').expand()  } else { $w('#drpStage').collapse()};
	if ($w('#drpDivision').options.length > 1) { $w('#drpDivision').expand()} else { $w('#drpDivision').collapse()};
	if ($w('#drpRound').options.length > 1) { $w('#drpRound').expand()} else { $w('#drpRound').collapse()};
	//$w('#drpRound').collapse();
}

export async function loadLGRptTable() {
	$w('#boxLGTable').expand();
	$w('#boxEP5Table').collapse();
	let first = {"_id": "1", "skip": "Player", "played": "Played", "pointsAgainst": "Against",
				"pointsFor": "For", "nextDiv": "Next"};
	loadLeagueTable(wCompRec, wStageRec.stage, wStageRec.div)
	.then( async  (wResult) => {
		let wTeams = wResult.filter( item => item.competitorId > 0);
		wTeams.unshift(first);
		$w('#rptLGTable').data = [];
		$w('#rptLGTable').data = wTeams;
	})
	return;
}

export async function loadEP5RptTable() {
	//.log("loadEP5table");
	$w('#boxLGTable').collapse();
	$w('#boxLeagueTable').expand();
	$w('#boxEP5Table').expand();
	let first = {"_id": "1", "skip": "Team", "played": "Played", "mWon": "Matches Won",
				"sWon": "Sets Won", "sDrawn": "Drawn", "pointsFor": "For"};
	loadEP5Table(wCompRec, wStageRec.stage, wStageRec.div)
	.then( (wResult) => {
		let wTeams = wResult.filter( item => item.competitorId > 0);
		wTeams.unshift(first);
		$w('#rptEP5').data = [];
		$w('#rptEP5').data = wTeams;
	})
	return;
}

export function drpRound_change(event) {
	//ts("drop round change");
	$w('#imgWait').show();
	wRound = parseInt(event.target.value,10);
	if (wCompRec.compRef === COMPREF.SEND5){
		$w('#txtTitle').text = wCompRec.title + " Round " + String(wRound);
				/**
		 * if (wRound === 2){ 
			$w('#lblWinner').show()
			$w('#chkWinA').show();
			$w('#chkWinB').show();
		} else {
			$w('#lblWinner').hide()
			$w('#chkWinA').hide();
			$w('#chkWinB').hide();
		}
		*/
	} else {
		$w('#txtTitle').text = wCompRec.title + " " + wStageRec.division + " Day " + String(wRound);
	}
	populateMatches(wRound);
	//te("drop round change");
}

function populateMatches(pRound) {
	$w('#btnSave').disable();
	wMatchesInRound = selectRound(wStageRec.stage, wStageRec.div, wRound);
	if (wMatchesInRound) {
		$w('#imgWait').hide();
		let wSortedMatches = _.sortBy(wMatchesInRound, ["matchKey"]);
		$w('#txtRequiredBy').text = "Required By: ";
		$w('#txtRequiredBy').hide();
		$w('#rptGames').data = wSortedMatches;
		let wElementList = $w('TextInput');
		if (loggedInMember) {
			if (isRequiredRole(["Manager", "Admin"],loggedInMemberRoles)) {
				if (wCompRec.status === COMPETITION.OPEN) {
					wElementList.enable();
				} else {
					wElementList.disable();
					$w('#btnSave').disable();
				}
			}
		}
	} else {
		console.log("/page/MaintainScore populateMatches No matches found for round ", wCompRec.compRef, wStageRec.stage, wStageRec.div, pRound);
	}
	//te("pop Matches");
}

function ts(pFunc){
	return;
	//wStart = Date.now();
	//console.log(pFunc + " start ");
}

function te(pFunc){
	return;
	let wNow = Date.now();
	let wmSecs1 = wNow - wStart;
	//let wmSecs2 = (wNow - pLast)/1000;
	let wDur = " ms";
	if (wmSecs1 > 1000){
		wDur = " s";
		wmSecs1 = wmSecs1 /1000;
	}
	wStart = wNow;
	//console.log(pFunc, wmSecs2, wmSecs1, wDur);
	console.log(pFunc + " finsh", wmSecs1, wDur);
	return wNow;
}

export function clearMatches() {
	let wData = [];
	wMatchesInRound = [];
	tidyUp();
	wSelectedId = null;

	$w('#rptGames').data = wData;
	$w('#imgWait').hide();
}

//================================= Button event handlers ===================================

export async function btnSave_click(event) {
	$w('#btnSave').disable();
	//console.log("Matches in next round", wRound, wStageRec.noRounds);
	//console.log(wStageRec);
	$w('#imgWait').show();
	if (wRound < wStageRec.noRounds) {
		wMatchesInNextRound = getActiveDivisionRoundBookings( wStageRec.stage, wStageRec.div, wRound + 1);
		if (!wMatchesInNextRound) {
			//console.log("No matches found in next round");
			wMatchesInNextRound = [];
		}
	} else {
		wMatchesInNextRound = [];
	}
	//console.log("Matches in next round ", wRound + 1);
	//console.log(wMatchesInNextRound);
	$w('#txtErrorMsg').hide();
	let wSaveList =[];
	$w('#rptGames').forEachItem( ($item, itemData, index) => { 
		let wX = processTableRow($item, itemData, index);
		if (wX) {
			wSaveList.push(wX)
		}
	})
	//console.log("Savelist");
	//console.log(wSaveList);

	for (let wObj of wSaveList){
		let res = await processLine(wObj);
		//console.log("Res from processLine");
		//console.log(res);
		if (res) {  
			$w('#rptGames').forItems([wObj.id], ($item) => { 
				$item('#chkChanged').checked = false;
			})
		}
	}
	if (wStageRec.shape === SHAPE.KO) { // store any promotions made in processLine for KO
		let res = await bulkUpdateClubCompBookings(wMatchesInNextRound);
	}
	$w('#lblRoundState').text = "Changes saved for this round";
	/**
	 * Now check if the end of Stage/Division condition is met.
	 * If so, either move to the next stage/division, closing the current one, if there is another one
	 * or, close current stage/division AND the competition
	 */
	let wNoMatches = 0;
	if (wStageRec.shape === SHAPE.KO){
		wNoMatches = wStageRec.noTeams - 1 + wStageRec.noByes;
		if (wStageRec.noPromote === 4) { 
			wNoMatches = wNoMatches + 1;
		}
	} else if (wStageRec.shape === SHAPE.LEAGUE){
		wNoMatches = wStageRec.noRounds * parseInt($w('#rptGames').data.length,10);
		await loadLGTable();
	} else if (wStageRec.shape === SHAPE.EP5){
		wNoMatches = wStageRec.noRounds * 6;
	}
	let wNoPlayed = await getGamesPlayedCount(BOOKING.COMPLETED, wStageRec.compRef, wStageRec.stage, wStageRec.div);
	//console.log("In Div " + String(wStageRec.div) + ": Played " + String(wNoPlayed) + " out of " + String(wNoMatches));

	if (wNoPlayed === wNoMatches) {
		//console.log("Division finished ", wStageRec.compRef, wStageRec.stage, wStageRec.div);
		let res = await processEndOfDivision();
		if (!res) { console.log("/page/MaintainScore btnSave processEndOfDivision fail"); return false }
	} else {
		//console.log("Division still open", wCompRec.compRef);
		if (wCompRec.compRef === COMPREF.SEND5) {
			loadEP5RptTable();
		} else if (wCompRec.compRef === COMPREF.OP02) {
			loadLGRptTable();
		} else { 
			$w('#btnSave').disable();
		}
	}
	$w('#imgWait').hide();
	//console.log("End of Save");
}

async function processEndOfDivision() {
	//console.log("processEndOfDivision ", String(wStageRec.stage +1), wCompRec.noStages);
	let matchResults = [];
	if (wCompRec.compRef === COMPREF.SEND5) {
		matchResults = await processEndOfEP5Division();
	}
	let res = await closeDivision(); //just updates div status
	let   wNoOpenDivs = await getCountCompetitionOpenDivs(wStageRec.compRef, wStageRec.stage);
	//console.log("Div count 1 = ", wNoOpenDivs); // reading this early avoids any timng issues with status  update
	if (!res) { console.log("/page/MaintainScore processEndOfDivision closeDiv fail"); return false }
	if /** no more open divisions */ (wNoOpenDivs === 0) {
		if /** no more stages */ ((wStageRec.stage + 1) >= wCompRec.noStages) {
			res = await closeCompetition();
			if (!res) { console.log("/page/MaintainScore processEndOfDivision closeCompetition fail"); return false }
		} else {
			res = await goToNextStage(matchResults);
			if (!res) { console.log("/page/MaintainScore processEndOfDivision goToNextStage fail"); return false }
		}
	} else {
		console.log("/page/MaintainScore processEndOfDivision Another division needs completing: count = ", wNoOpenDivs);
	}
	return true;
}

async function processEndOfEP5Division(){
	let winner = [];
	let second = [];

	let wCompetitors = await loadDivCompetitors(wStageRec.stage, wStageRec.div);
	const wMatches = wStageRec.bracket[0];
	for (let wMatch of wMatches){
		const wCompAId = wMatch[0];
		const wCompBId = wMatch[1];
		const wCompA = wCompetitors.filter (team => team.competitorId === wCompAId);
		const wCompB = wCompetitors.filter (team => team.competitorId === wCompBId);
		let wOutcome = await calcDivEP5Winner(wCompA[0], wCompB[0]);
		let res = await	addCompetitorEP5GameScore(wCompA[0]._id, wOutcome[0], 0, wOutcome[1], 0, 0, 0, 0, 0, 0);
		res = await	addCompetitorEP5GameScore(wCompB[0]._id, wOutcome[1], 0, wOutcome[0], 0, 0, 0, 0, 0, 0);
		if (wOutcome[0] === 1) {
			winner.push(wCompAId);
			second.push(wCompBId);
		} else { 
			winner.push(wCompBId);
			second.push(wCompAId);
		}
	}
	return [winner, second];
}

async function calcDivEP5Winner(pA, pB) { 
	if (pA.sWon > pB.sWon) { 
		return [1,0];
	} else if (pA.sWon < pB.sWon) { 
		return [0,1];
	} else if (pA.sWon === pB.sWon) {
		if (pA.sDrawn > pB.sDrawn) { 
			return  [1,0];
		} else if (pA.sDrawn < pB.sDrawn) { 
			return [0,1];
		} else if (pA.sDrawn === pB.sDrawn ){ 
			let wData = {"playerA": pA.teamNames[0], "playerB": pB.teamNames[0]}
			let wWinner = await wixWindow.openLightbox("lbxConfirmWinner", wData);
			if (wWinner === "A") { 
				return [1,0];
			} else { 
				return [0,1];
			}
		} else {
			console.log("/page/MaintainScore calcDivEP5Winner Impossible case");
			return [0,0];
		}
	}
}

async function goToNextStage(pMatchResults) {
	//console.log("GoToNextStage");
	let wDivs = await getCompetitionAllDivisions(wStageRec.stage+1);
	//console.log(wDivs[0]);
	if (wCompRec.compRef === COMPREF.SEND5) {
		if (wDivs[0].shape === SHAPE.EP5){
			let wMembers  = promoteEP5Players(pMatchResults);
			let res = await updateEP5Bookings(wMembers, wStageRec);
		} else { 
			console.log("/page/MaintainScore goToNextStage Do promote to final KO");
		}
	}
	//TODO: Consider, divs may not be populated yet
	for (let wDiv of wDivs) { 
		//let res = await updateCompetitionDivisionStatus(wDiv._id, STAGE.ACTIVE);
	}
	return true;
}

async function closeDivision() {
	//console.log("closeDivision");
	let res = await updateCompetitionDivisionStatus(wStageRec._id, STAGE.COMPLETED);
	if (!res) { console.log("/page/MaintainScore closeDivision fail"); return false }
	return true;
}

async function closeCompetition() {
	//console.log("closeComp");
	let wComp;

	wComp = {...wCompRec};
	wComp.status = COMPETITION.CLOSED;
	if (wStageRec.shape === SHAPE.KO) {	
		wComp.winnerNames = wCompRec.winnerNames;
		wComp.secondNames = wCompRec.secondNames;
	} else {
		let wLGData = await loadLGTable();
		wComp.winnerNames = wLGData[1].teamNames;
		wComp.secondNames = wLGData[2].teamNames;
	}
	let res = updateClubComp(wCompRec._id, wComp);
	if (!res) { console.log("/page/MaintainScore closeCompetition fail"); return false }
	return true;
}

//=================================== process the game line ==================================
function processTableRow($item, itemData, index) {
	//console.log("GS1 processTableRow");
	if ($item('#chkChanged').checked) {
		let wWinner = "";
		let wWalkover = false;
		if ($item('#chkWinA').checked) {
			wWinner = "A";
			wWalkover = true;
		} else if ($item('#chkWinB').checked){ 
			wWinner = "B";
			wWalkover = true;
		}
		let wA = convertNull($item('#inpA').value,0);
		let wB = convertNull($item('#inpB').value,0);
		let wBye = (itemData.isBye === "Y" ? true : false);
		let wItem = {"id": itemData._id, "isBye": wBye, "isWalkover": wWalkover, "winner": wWinner,
						"scoreA": wA, "scoreB": wB, "rec": itemData };
		return wItem;
	} else {
		return false;
	}
}

async function processLine(pItem) {
try {
	
	// This assumes that you cannot have a bye straight into a finals match
	//console.log("");
	///console.log("GS1 doLine");
	//console.log(pItem);
	let wBooking = pItem.rec;
	let res = true;
	if (pItem.isBye) {
		if (wBooking.status === BOOKING.OPEN ) {
			res = await doNewBye(pItem);
		} else {
			//console.log("GS3 Skip KO Bye");
		}
	} else if(pItem.isWalkover) {
		res = await doWalkover(pItem);
	} else {
		if (wBooking.status === BOOKING.OPEN) {
			res = await doNewResult(pItem);
		} else if (wBooking.status === BOOKING.COMPLETED) {
			//console.log("GS3 DoUpdate");
			res = await doUpdateResult(pItem)
		} else {
			console.log("/page/MaintainScore processLine GS3 booking status = ", wBooking.status);
		}
	}
	return res;
}
catch ( err ) {
	console.log("/page/MaintainScore processLine try catch ", err);
}}

//------------------------------- generic line process-----------------------------------------
async function doNewBye (pItem) {
try {
	let pData = pItem.rec;
	//console.log("GS4 doNewBye -->", "#" + pData.playerAId + "#", "#" + pData.playerBId + "#");
	let wPlayer;
	if (pData.playerAId === null || pData.playerAId === "") {
		wPlayer = pData.playerBId;
	} else {
		wPlayer = pData.playerAId;	
	}
	const playerCompId = (getMember(wPlayer))._id;

	let res = await updateBookingGameScore(pData._id, BOOKING.COMPLETED, 0, 0);		//updates status of the booking record
	//console.log("update booking game score status = ", res);
	if (!res) {  
		console.log("/page/MaintainScore doNewBye updateBookingGameScore failed for booking id = " + pData._id);
		return false;
	}
	if (wStageRec.shape === SHAPE.KO ) { 
		await updateKOResults();
		if (wRound < wStageRec.noRounds) {
			res = await promoteWinner(pData.matchKey, wPlayer, false);
			if (!res) {
				console.log("/page/MaintainScore doNewBye Promote Winner failed for " + pData.matchKey, wPlayer);
				return false;
			}
		} /** just drop through if hit last round */
	} else { /** Process League Game */
		res = await	addCompetitorGameScore(playerCompId,0,0,0, 1, 0, 0, 0, 0);				// will increment no played`
		if (!res) {
			console.log("/page/MaintainScore doNewBye addCompetitorGameScore failed for " + pItem("#txtPlayerA").text);
			return false;
		}
	}
	return true;
}
catch ( err ) {
	console.log("/page/MaintainScore doNewBye try-catch ", err);
	return false;
}}

async function doWalkover (pItem) {
try {
	let pData = pItem.rec;
	//console.log("GS4 doWalkover -->", "#" + pData.playerAId + "#", "#" + pData.playerBId + "#");
	let wPlayer;
	let wScoreA = 0;
	let wScoreB = 0;
	if (pItem.winner === "B") {
		wPlayer = pData.playerBId;
		wScoreA = 0;
		wScoreB = 1;
	} else {
		wScoreA = 1;
		wScoreB = 0;
		wPlayer = pData.playerAId;	
	}
	const playerCompId = (getMember(wPlayer))._id;
	//TODO: replace this deleted status by a new status WalkOver and follow thru whole site
	// the problem being that now dont see the entry in the games score list, so cant reverse the action
	let res = await updateBookingGameScore(pData._id, BOOKING.COMPLETED, wScoreA, wScoreB);		//updates status of the booking record
	if (!res) {  
		console.log("/page/MaintainScore doWalkOver UpdateBookingGameScore failed for booking id = " + pData._id);
		return false;
	}
	if (wStageRec.shape === SHAPE.KO ) { 
		await updateKOResults();
		if (wRound < wStageRec.noRounds) {
			res = await promoteWinner(pData.matchKey, wPlayer, false);
			if (!res) {
				console.log("/page/MaintainScore doWalkOver Promote Winner failed for " + pData.matchKey, wPlayer);
				return false;
			}
		} /** just drop through if hit last round */
	} else { /** Process League Game */
		res = await	addCompetitorGameScore(playerCompId,0,0,0, 1, 0, 0, 0, 0);				// will increment no played`
		if (!res) {
			console.log("/page/MaintainScore doWalkOver addCompetitorGameScore failed for " + pItem("#txtPlayerA").text);
			return false;
		}
	}
	return true;
}
catch ( err ) {
	console.log("/page/MaintainScore doWalkover try catch ", err);
	return false;
}}


async function doNewResult (pItem) {
try {
	//console.log("GS4 doNewResult");
	let pData = pItem.rec;
	const playerAId = pData.playerAId;
	const playerBId = pData.playerBId;
	let playerACompId = "";
	let playerBCompId = "";
	if (wCompRec.competitorType !== COMPETITOR_TYPE.TEAM) {
		playerACompId = (getMember(playerAId))._id;
		playerBCompId = (getMember(playerBId))._id;
	} else { 
		playerACompId = (getTeamCompetitor(playerAId))._id;
		playerBCompId = (getTeamCompetitor(playerBId))._id;
	}
	const wWinner = pItem.winner;
	const wScoreA = parseInt(convertNull(pItem.scoreA,0),10);
	const wScoreB = parseInt(convertNull(pItem.scoreB,0),10);
	
	//let res = true;
	let res = await updateBookingGameScore(pData._id, BOOKING.COMPLETED, wScoreA, wScoreB);		//updates status of the booking record
	if (!res) {
		console.log("/page/MaintainScore doNewResult UpdateBookingGameScore failed for booking id = " + pData._id);
		return false;
	}

	if (wStageRec.shape === SHAPE.KO ) {
		// Note that Knock Out games dont record totals per competitor
		let wOutcome = calcWinner( playerAId, wScoreA, playerBId, wScoreB);
		if (wOutcome) {
			let wWinnerId = wOutcome[0];
			let wSecondId = wOutcome[1];
			await updateKOResults();
			if (wRound < wStageRec.noRounds) {
				//console.log("match, round, noRounds", wRound, wStageRec.noRounds);
				res = await promoteWinner(pData.matchKey, wWinnerId, false);
				if (!res) {
					console.log("/page/MaintainScore doNewResult KO Promote Winner failed for " + pData.matchKey, wWinnerId);
					return false;
				}
				if (wStageRec.noPromote === 4){
					//console.log("Type 4");
					if /** a semi-final match */ (wRound === wStageRec.noRounds - 1) {
						//console.log("semi final match");
						res = await promoteWinner(pData.matchKey, wSecondId,true);
						if (!res) {
							console.log("/page/MaintainScore doNewResult KO Promote Runner Up failed for " + pData.matchKey, wSecondId);
							return false;
						}
					}
				} else {
					console.log("/page/MaintainScore doNewResult KO noPromte <> 4 (do 2)");
				}
			} else {
				//console.log("Finals")
				const wGameMatch = parseInt(pData.matchKey.slice(10),10);
				if /** the final */ (wGameMatch === 1) { 
					//console.log("The final");
					wCompRec.winnerNames = (getMember(wWinnerId)).teamNames;
					wCompRec.secondNames = (getMember(wSecondId)).teamNames;
				}
			}
		} else {
			console.log("/page/MaintainScore doNewResult There was a tie in the knock out round.")
		}
	} else if (wStageRec.shape === SHAPE.TRIPLE) { /** Process Triple League Game */
		let wOutcome = calcL2Winner(wScoreA, wScoreB);
		/**
		 * 	0 = mWin
		 *  1 = mDrawn
		 *  2 = mLost
		 * 	3 = sWon (Bonus)
		 *  4 = points
		 */
		//res = true;
		//console.log(playerAId, wOutcome[0], wOutcome[1], wOutcome[2], wScoreA, wScoreB, wOutcome[3], wOutcome[4]);
		res = await	addCompetitorGameScore(playerACompId,wOutcome[0], wOutcome[1],wOutcome[2], 1,
		 									wScoreA, wScoreB, wOutcome[3], wOutcome[4]);				// will increment no played`
		if (!res) {
			console.log("/page/MaintainScore doNewResult Triple addCompetitorGameScoreA failed for " + pItem("#txtPlayerA").text);
			return false;
		}
		wOutcome = calcL2Winner(wScoreB, wScoreA);
		//console.log(playerBId, wOutcome[0], wOutcome[1], wOutcome[2], wScoreB, wScoreA, wOutcome[3], wOutcome[4]);
		res = await addCompetitorGameScore(playerBCompId, wOutcome[0], wOutcome[1],wOutcome[2], 1,
											 wScoreB, wScoreA, wOutcome[3], wOutcome[4]);
		if (!res) {
			console.log("/page/MaintainScore doNewResult Triple addCompetitorGameScoreB for " + pItem("#txtPlayerB").text);
			return false;
		}
	} else if (wStageRec.shape === SHAPE.LEAGUE) { /** Process League Game */
		let wOutcome = calcLGWinner(wScoreA, wScoreB);
		/**
		 * 	0 = mWin
		 *  1 = mDrawn
		 *  2 = mLost
		 */
		res = await	addCompetitorGameScore(playerACompId,wOutcome[0], wOutcome[1],wOutcome[2], 1, wScoreA, wScoreB, 0, 0);				// will increment no played`
		if (!res) {
			console.log("/page/MaintainScore doNewResult LG addCompetitorGameScoreA failed for " + pItem("#txtPlayerA").text);
			return false;
		}
		res = await addCompetitorGameScore(playerBCompId, wOutcome[2], wOutcome[1],wOutcome[0], 1, wScoreB, wScoreA, 0, 0);
		if (!res) {
			console.log("/page/MaintainScore doNewResult LG addCompetitorGameScoreB failed for " + pItem("#txtPlayerB").text);
			return false;
		}
	} else if (wStageRec.shape === SHAPE.EP5) {
		//console.log("wRound = ", wRound);
		let wOutcome = calcEP5Winner(wScoreA, wScoreB);
		res = await	addCompetitorEP5GameScore(playerACompId, 0, 0, 0, wOutcome[1], wOutcome[2], 1, 0, wScoreA, wScoreB);				// will increment no played`
		if (!res) {
			console.log("/page/MaintainScore doNewResult EP5 addCompetitorGameScoreA failed for " + pItem("#txtPlayerA").text);
			return false;
		}
		wOutcome = calcEP5Winner(wScoreB, wScoreA);
		res = await addCompetitorEP5GameScore(playerBCompId, 0, 0, 0, wOutcome[1], wOutcome[2], 1, 0, wScoreB, wScoreA);
		if (!res) {
			console.log("/page/MaintainScore doNewResult EP5 addCompetitorGameScoreB failed for " + pItem("#txtPlayerB").text);
			return false;
		}
	}
	return true;
}
catch ( err ) {
	console.log("/page/MaintainScore doNewResult try catch ", err);
	return false;
}}

function calcWinner(pPlayerAId, pScoreA, pPlayerBId, pScoreB) {
	if (pScoreA > pScoreB) {
		return  [pPlayerAId,pPlayerBId];
	} else if (pScoreA === pScoreB) {
		return false;
	} else {
		return [pPlayerBId, pPlayerAId];
	} 
}

function calcLGWinner(pScoreA, pScoreB) {
	if (pScoreA > pScoreB) {
		return  [1,0,0];
	} else if (pScoreA === pScoreB) {
		return [0,1,0];
	} else {
		return [0,0,1];
	} 
}


function calcL2Winner(pScoreA, pScoreB) {
	/**
	 * 	win = 4; draw = 2; loss =0
	 * win bonus 1 per 5+ shots
	 * lose bonus 1 for 4 or less
	 * 
	 * 	0 = mWin
	 *  1 = mDrawn
	 *  2 = mLost
	 * 	3 = sWon (Bonus)
	 *  4 = points
	 */
	let wBonus = 0;
	if /** A draw */(pScoreA === pScoreB) {
		return  [0, 1, 0, 0, 2];
	} else if /** A Wins */(pScoreA > pScoreB) {
		const wDiff = pScoreA - pScoreB;
		wBonus = Math.floor(wDiff / 5);
		return [1, 0, 0, wBonus, 4 + wBonus];
	} else /** B Wins */{
		const wLoss = pScoreB - pScoreA;
		if (wLoss <= 4) {
			wBonus = 1;
		}
		return [0, 0, 1, wBonus, 0 + wBonus];
	} 
}

function calcEP5Winner(pScoreA, pScoreB) {
	if (pScoreA > pScoreB) {
		return  [0,1,0];
	} else if (pScoreA === pScoreB) {
		return [0,0,1];
	} else {
		return [0,0,0];
	} 
}

async function updateKOResults() { 
	//console.log("updateKOResults");
	return true;
}

async function doUpdateResult(pItem) {
try {
	//console.log("GS4 doUpdateResult");
	let pData = pItem.rec;
	const playerAId = pData.playerAId;
	const playerACompId = (getMember(playerAId))._id;
	const playerBId = pData.playerBId;
	const playerBCompId = (getMember(playerBId))._id;
	const wNewScoreA = parseInt(convertNull(pItem.scoreA,0),10);
	const wNewScoreB = parseInt(convertNull(pItem.scoreB,0),10);

	let wForDeltaA = wNewScoreA - pData.scoreA;
	let wForDeltaB = wNewScoreB - pData.scoreB;
	let wAgainstDeltaA = wNewScoreB - pData.scoreB;
	let wAgainstDeltaB = wNewScoreA - pData.scoreA;
	//console.log("Client[Game Score]" + pData._id +
	//				`booking updated with A = ${wNewScoreA} (${wForDeltaA}/${wAgainstDeltaA}) v` +
	//				` ${wNewScoreB} (${wForDeltaB}/${wAgainstDeltaB}) = B`);

	let res = await updateBookingGameScore(pData._id, BOOKING.COMPLETED, wNewScoreA, wNewScoreB);		//updates the booking record
	if (!res) {
		console.log("/page/MaintainScore doUpdateResult UpdateBookingGameScore failed for booking id = " + pData._id);
		return false;
	}
	
	if (wStageRec.shape ===  SHAPE.KO) { 
		let wNewWinner = calcWinner( playerAId, wNewScoreA, playerBId, wNewScoreB)[0];
		if (wNewWinner) {
			let wOldWinner = calcWinner(playerAId, pData.scoreA, playerBId, pData.scoreB)[0];
			if (wNewWinner !== wOldWinner){ 
				res = await promoteWinner(pData.matchKey, wNewWinner,false);
				console.log("/page/MaintainScore doUpdateResult Switch the promoted player");
			}
		} else {
			console.log("/page/MaintainScore doUpdateResult There was a tie in the knock out round update.")
		}
	} else {
		let wOutcome = calcLGWinner(wNewScoreA, wNewScoreB);
		//TODO Add logic todetermine game result delta
		res = await addCompetitorGameScore(playerACompId, wOutcome[0],wOutcome[0],wOutcome[0], 0, wForDeltaA, wAgainstDeltaA, 0, 0);
		if (!res) {
			console.log("/page/MaintainScore doUpdateResult addCompetitorGameScoreA failed for " + pItem("#txtPlayerA").text);
			return false;
		}
		res = await addCompetitorGameScore(playerBCompId, wOutcome[1],wOutcome[1],wOutcome[1], 0, wForDeltaB, wAgainstDeltaB, 0, 0);
		if (!res) {
			console.log("/page/MaintainScore doUpdateResult addCompetitorGameScoreB failed for " + pItem("#txtPlayerB").text);
			return false;
		}
	}
	return true;
}
catch ( err ) {
	console.log("/page/MaintainScore doUpdateResult try catch ", err);
	return false;
}}

/**
 * process change event on either inpA or inpB
 */
export function inp_change(event) {
	$w('#btnSave').enable();
	let $item = $w.at(event.context);
	$item('#chkChanged').checked = true;
}

async function promoteWinner(pGame, pPlayerId, pRunnerUpMatch){
try {
	//console.log("GS5 promoteWinner " + pPlayerId + " in game " + pGame);
	//let wGame = "S01D00R01M07";	//in pData.matchKey
	//pGame = wGame;
	const wGameStage = pGame.slice(0,3);
	const wGameDiv = parseInt(pGame.slice(4,6),10);
	const wGameRound = parseInt(pGame.slice(7,9),10);
	const wGameMatch = parseInt(pGame.slice(10),10);
	let wNewRound = wGameRound + 1;
	if (wNewRound > wStageRec.noRounds) {
	//	console.log("No more rounds in this stage");
		return false;
	} else {
		let wNewMatch = (wGameMatch % 2 === 0) ? Math.floor(wGameMatch / 2) : Math.floor((wGameMatch / 2) + 1);
		if (pRunnerUpMatch) {
			wNewMatch = wNewMatch + 1;
		}
		const wNewPlayer = (wGameMatch % 2 === 0) ? "B" : "A";
		const wNewGameKey = wGameStage + "D" + String(wGameDiv).padStart(2,"0") + 
							"R" + String(wNewRound).padStart(2,"0") + "M" + String(wNewMatch).padStart(2,"0");
		//console.log( "GS5 PW", pGame, wNewGameKey, wNewPlayer);
		let wNewBooking = await getNextRoundBooking(wNewGameKey);//wNewBooking is the booking record in wMatchesInNextRound
		if (!wNewBooking){
			console.log("/page/MaintainScore promoteWinner - didnt find comp booking ", wNewGameKey);
			return false;
		}
		if (wNewPlayer === "A") {
			wNewBooking.playerAId = pPlayerId;
		} else {
			wNewBooking.playerBId = pPlayerId;
		}
		if (wNewBooking.pPlayerA !== TEMP_HOLDER && wNewBooking.pPlayerB !== TEMP_HOLDER) {
			wNewBooking.status = BOOKING.READY;
		}
		return true;
	}
}
catch ( err ) {
	console.log("/page/MaintainScore promoteWinner try catch ", err);
	return false;
}}

function getNextRoundBooking (pNewGameKey){
try {
	//console.log("GS6 getNextRoundBooking ", pNewGameKey)
	if (pNewGameKey === null) {return false};
	let wobj = wMatchesInNextRound.find(wobj => wobj.matchKey === pNewGameKey);
	if (wobj) {
		return wobj;
	} else {
		console.log("/page/MaintainScore getNextRoundBooking no match", pNewGameKey);
		return false;
	}
}
catch ( err ) {
	console.log("/page/MaintainScore getNextRoundBooking try catch ", err);
	return false;
}}

async function loadNextDivLGTable() {
	let wDivs = [
		// this entry is a holder for the table headings row
		{"_id": "0", "div": "1", "division": "Ladder A", "noTeams": "4",
		 "noLeft": "3", "competitor": "Tevor Allen"}
	];

	const reducer = (accumulator, item) => {
		return accumulator + item.teamNames[0] + "\n"; 
	};
	
	//QUERY this returns all competitors in the stage, not div
	let wDataArray = await loadStageCompetitors(wCompRec, wStageRec.stage + 1);
	let count = 1;
	for (let wRec of wDataArray){ 
		let wDiv = wRec.div;
		let wItem = wDivs.find(elem => elem.div === wDiv);
		if (typeof wItem === "undefined") {
			let wCompetitors = wDataArray.filter( item => item.div === wDiv)
										.filter( item => item.skipId !== TEMP_HOLDER)
										.filter( item => item.skipId !== null );
			let wTemp = wCompetitors.reduce( reducer, "");
			wItem = {"_id": String(count), "div": wDiv, "division": wRec.division,
					 "noTeams": "0", "noLeft": "0", "competitor": wTemp};
			wDivs.push(wItem);
			count++;
		 }
		wItem.noTeams = String(parseInt(wItem.noTeams,10) + 1);
		if (wRec.status === "N") { 
			wItem.noLeft = String(parseInt(wItem.noLeft,10) + 1);
		}
	}
	$w('#rptNextDiv').data = wDivs;
}


async function loadNextDivKOTable(pDiv) {
	let wDivs = [
		// this entry is a holder for the table headings row
		{"_id": "0", "div": "1", "division": "Ladder A", "noTeams": "4",
		 "noLeft": "3", "competitor": "Tevor Allen"}
	];

	const reducer = (accumulator, item) => {
		return accumulator + item.teamNames[0] + "\n"; 
	};
	
	//QUERY this returns all competitors in the stage, not div
	let wNoTeams  = pDiv.noTeams;
	let wDataArray = await loadStageCompetitors(wCompRec, wStageRec.stage + 1);
	let wCompetitors = wDataArray.filter( item => item.competitorId < 3)
								.filter( item => item.skipId !== TEMP_HOLDER)
								.filter( item => item.skipId !== null);
	let wTemp = wCompetitors.reduce( reducer, "");
	let wItem = {"_id": "1", "div": "0", "division": "Final",
				"noTeams": "2", "noLeft": String(2 - wCompetitors.length), "competitor": wTemp};
	wDivs.push(wItem);
	if (wNoTeams === 4) {
		let wCompetitors = wDataArray.filter( item => item.competitorId > 2)
									.filter( item => item.skipId !== TEMP_HOLDER)
									.filter( item => item.skipId !== null);
		let wTemp = wCompetitors.reduce( reducer, "");
		let wItem = {"_id": "2", "div": "0", "division": "3rd/4th",
					"noTeams": "2", "noLeft": String(2 - wCompetitors.length), "competitor": wTemp};
		wDivs.push(wItem);
	}
	$w('#rptNextDiv').data = wDivs;
}

export function boxNextDiv_click(event) {
	if (!wSelectedId) {return};
	let wName = "";
	let $item = $w.at(event.context);
	let wNoLeft  = parseInt($item('#txtNoLeft').text,10);
	let wDiv = parseInt($item('#txtNext').text,10);
	$item('#txtNoLeft').text = String(wNoLeft - 1);
	$w('#rptLGTable').forItems([wSelectedId], ($rec, itemData, index) => {
		$rec('#txtDiv').text = String(wDiv);
		$rec('#txtDiv').show();
		$rec('#boxRow').style.backgroundColor = "rgba(255,255,255,1)";
		wName = $rec('#txtPlayer').text;
	})
	if ($item('#txtPromotees').collapsed) { 
		$item('#txtPromotees').text = wName;
		$item('#txtPromotees').expand();
	} else { 
		$item('#txtPromotees').text = $item('#txtPromotees').text + "\n" + wName;
	}
	let wCompetitorSkipId = getCompetitorSkipId(wSelectedId);
	let wX = {"id": wCompetitorSkipId, "div": wDiv};
	wPromotionList.push(wX);
	wSelectedId = null;
	$w('#boxPromote').expand();
	$w('#btnPromote').label = "Promote " + String(wPromotionList.length);
}

export function boxRow_click(event) {
	let wItemId = event.context.itemId;
	if (wSelectedId === wItemId) {return};
	if (wSelectedId) { 
		$w('#rptLGTable').forItems([wSelectedId], ($item, itemData, index) => {
			$item('#boxRow').style.backgroundColor = "rgba(255,255,255,1)";
		})
	}
	wSelectedId = wItemId;
	$w('#rptLGTable').forItems([wItemId], ($item, itemData, index) => {
		$item('#boxRow').style.backgroundColor = "rgba(255,155,51,0.8)";
	})
}

export async function btnPromote_click(event) {
	if (wPromotionList.length > 0) {
		let wSortedPromotionList = _.sortBy(wPromotionList, ["div"]);
		let wAllFrom = await loadStageCompetitors(wCompRec, wStageRec.stage);
		let wAllTo = await loadStageCompetitors(wCompRec, wStageRec.stage + 1);
		if (wAllFrom.length === 0) {console.log("/page/MaintainScore btnPromote From empty"); return}
		if (wAllTo.length === 0) {console.log("/page/MaintainScore btnPromote To empty"); return}
		if (wAllFrom.length === wAllTo.length) {console.log("/page/MaintainScore btnPromote From = To"); return}

		let wUpdateList = [];
		for (let wTeam of wSortedPromotionList){
			let wCompFrom = wAllFrom.filter( fromSide => fromSide.skipId === wTeam.id);
			let wSetTo = wAllTo.filter( toSide => toSide.div === (wTeam.div - 1))
								.filter( toSide => toSide.status === "N");
			
			if (wSetTo.length !== 0) { 
				let wCompTo = wSetTo[0];
				wCompTo.status = "P";
				wCompTo.teamIds = wCompFrom[0].teamIds;
				wCompTo.teamNames = wCompFrom[0].teamNames;
				wCompTo.seed = wCompFrom[0].seed;
				wCompTo.skip = wCompFrom[0].skip;
				wCompTo.skipId = wCompFrom[0].skipId;
				wUpdateList.push(wCompTo);
			} else { 
				showPromoteMsg(3);
				break;
			} 
		}
		let res = bulkUpdateCompetitors(wUpdateList);
		if (res) {
			showPromoteMsg(1);
		} else {
			showPromoteMsg(4);
		}
		wUpdateList = [];
		tidyUp();
	} else { 
		showPromoteMsg(2);
	}
}

function tidyUp() {
	wPromotionList = [];
	if (wPromotionList.length === 0) {
		$w('#btnPromote').label = "Promote";
	} else { 
		$w('#btnPromote').label = "Promote " + String(wPromotionList.length);

	}
}

function showPromoteMsg(pMsg) {
	let wMsg = ["Promotions completed ok",
				"You have not promoted any teams",
				"No promotion slots found", 
				"Promotion save failed"
	];

	$w('#txtPromoteMsg').text = wMsg[pMsg-1];
	$w('#txtPromoteMsg').show();
	setTimeout(() => {
		$w('#txtPromoteMsg').hide();
	}, 5000);
	return
}

async function updateStageBookings() {
	if (wPromotionList.length > 0) {
		let wSortedPromotionList = _.sortBy(wPromotionList, ["div"]);
		wMatchesInNextRound = getAllNewStageBookings( wStageRec.stage+1);
		//console.log("Intro, stage, promotion list, minr");
		//console.log(wStageRec);
		//console.log(wPromotionList);
		//console.log(wMatchesInNextRound);
		if (wMatchesInNextRound.length === 0 ) {
			console.log("/page/MaintainScore updateStageBookings No matches found in next round");
			wMatchesInNextRound = [];
		} else if ( wMatchesInNextRound.length > 1) {
			console.log("/page/MaintainScore updateStageBookings  > 1 found");
			wMatchesInNextRound = [];
		}
		for (let wCompetitor of wSortedPromotionList){
			let res = "";
			
			let wStage = wStageRec.stage + 1;
			let wDiv = wCompetitor.div-1;
			let wMatchKey = "S" + String(wStage).padStart(2,"0") + "D" + String(wDiv).padStart(2,"0") + "R00M01";
			let wMatches = wMatchesInNextRound.filter( item => item.matchKey === wMatchKey);
			let wMatch = wMatches[0];
			if (wMatch.playerAId === TEMP_HOLDER) { 
				wMatch.playerAId = wCompetitor.id;
			} else if (wMatch.playerBId === TEMP_HOLDER) { 
				wMatch.playerBId = wCompetitor.id
			} else { 
				console.log("/page/MaintainScore updateStageBookings Didnt find any open places");
			}
			if (wMatch.playerAId !== TEMP_HOLDER && wMatch.playerBId !== TEMP_HOLDER){ 
				wMatch.status = BOOKING.OPEN;
			}
		}
		console.log("/page/MaintainScore updateStageBookings Before update, matchesin nextround");
		console.log(wMatchesInNextRound);
		//let res = await bulkUpdateClubCompBookings(wMatchesInNextRound);
		tidyUp();
	}
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
*	 @param {$w.Event} event
*/
export function chkWinB_change(event) {
	let $item = $w.at(event.context);
 	$item('#chkWinA').checked = false;
	$item('#chkChanged').checked = true;
	$w('#btnSave').enable();
}

export function chkWinA_change(event) {
	let $item = $w.at(event.context);
 	$item('#chkWinB').checked = false;
	$item('#chkChanged').checked = true;
	$w('#btnSave').enable();
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export async function promoteEP5Players(pMatchResults) { 
	let winner = pMatchResults[0];
	let second = pMatchResults[1];

	let w2 = await loadDivCompetitors(wStageRec.stage, wStageRec.div);
	let wCompToList = await loadDivCompetitors(wStageRec.stage + 1, 0);
	let wMem1  = w2.filter( item => item.competitorId === winner[4])
	let wMem2  = w2.filter( item => item.competitorId === winner[5])
	let wMem3  = w2.filter( item => item.competitorId === second[4])
	let wMem4  = w2.filter( item => item.competitorId === second[5])
	let wMem5  = w2.filter( item => item.competitorId === winner[0])
	let wMem6  = w2.filter( item => item.competitorId === winner[1])
	let wMem7  = w2.filter( item => item.competitorId === second[0])
	let wMem8  = w2.filter( item => item.competitorId === second[1])
	let wMem9  = w2.filter( item => item.competitorId === winner[2])
	let wMem10 = w2.filter( item => item.competitorId === winner[3])
	let wMem11 = w2.filter( item => item.competitorId === second[2])
	let wMem12 = w2.filter( item => item.competitorId === second[3])

	let wMembers = [...wMem1,...wMem2,...wMem3,...wMem4,...wMem5,...wMem6,
					...wMem7,...wMem8,...wMem9,...wMem10,...wMem11,...wMem12];
	let wCompFromList = wMembers.map( (item, index) => { 
		item.competitorId = index+1;
		return item;
	})

	let wUpdateList = [];

	for (let wCompFrom of wCompFromList){
		let wTemp = wCompToList.filter ( item => item.competitorId === wCompFrom.competitorId);
		let wCompTo = wTemp[0];
		wCompTo.status = "P";
		wCompTo.teamIds = wCompFrom.teamIds;
		wCompTo.teamNames = wCompFrom.teamNames;
		wCompTo.seed = wCompFrom.seed;
		wCompTo.skip = wCompFrom.skip;
		wCompTo.skipId = wCompFrom.skipId;
		wCompTo.mWon = wCompFrom.mWon ;
		wCompTo.mDrawn = wCompFrom.mDrawn;
		wCompTo.mLost = wCompFrom.mLost ;
		wCompTo.sWon = wCompFrom.sWon;
		wCompTo.sDrawn = wCompFrom.sDrawn;
		wCompTo.played = wCompFrom.played;
		wCompTo.pointsFor = wCompFrom.pointsFor;
		wCompTo.pointsAgainst = wCompFrom.pointsAgainst;
		wCompTo.points = wCompFrom.points;
		wUpdateList.push(wCompTo);
	}
	let res = bulkUpdateCompetitors(wUpdateList);
	if (res) {
		showPromoteMsg(1);
		return wUpdateList;
	} else {
		showPromoteMsg(4);
		return [];
	}
}

export async function btnTest_click(event) {
	await goToNextStage([]);
}


/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function btnFixtureList_click(event) {
	let wNoRounds = wStageRec.noRounds;
	let wLine = {};
	let wDoc = [];
	for (let i=1; i<wNoRounds+1; i++) {
		let wRoundMatches = selectRound(wStageRec.stage, wStageRec.div, i);
		//console.log("Round = ", i);
		//console.log(wRoundMatches);
		let wGamesToPlay = wRoundMatches.filter ( item => item.isBye === "N")
										.filter ( item => item.status !== BOOKING.NEW);
		let wRoundDates = wRoundMatches.filter (  item => item.status === BOOKING.NEW);
		let wRoundByes = wRoundMatches.filter (  item => item.isBye === "Y");
		let wDR = "";
		if (wRoundDates.length > 0) { 
			wDR = wRoundDates[0].dateRequired;
		} else if (wRoundByes.length > 0) { 
			wDR = wRoundByes[0].dateRequired;
		} else { 
			wDR = "Date Required unknown";
		}
		if (Object.prototype.toString.call(wDR) === '[object Date]') { 
			wLine = {"type": "R", "round": i, "dateRequired": formatDateString(wDR, "Short")};
		} else { 
			wLine = {"type": "R", "round": i, "dateRequired": "Unknown"};
		}
		wDoc.push(wLine);
		if (wGamesToPlay.length > 0) { 
			for (let wGame of wGamesToPlay) { 
				let pA = getMember(wGame.playerAId).teamNames[0];
				let pB = getMember(wGame.playerBId).teamNames[0];
				wLine = {"type": "M", "dateRequired": formatDateString(wGame.dateRequired, "Short"),
						 "pA": pA, "scoreA": wGame.scoreA,
						 "pB": pB, "scoreB": wGame.scoreB};
				wDoc.push(wLine);
			}
		}
	}
	//.log(wDoc);
	$w('#html1').postMessage(wDoc); 
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export async function btnRefresh_click(event) {

	const countActiveDivs = (accumulator, item) => {
		if (item.status === STAGE.ACTIVE) {
			accumulator++; 
		}
		return accumulator++; 
	};
	
	loadLGRptTable();
	let wDivs = await getCompetitionAllDivisions(wStageRec.stage);
	let wOpenCount = wDivs.reduce(countActiveDivs,0);
	if (wOpenCount > 0) {
		console.log("/page/MaintainScore btnRefresh There are still matches to play in this stage"); 
		wDivs = await getCompetitionAllDivisions(wStageRec.stage+1);
		let wNextDiv = wDivs[0];
		//console.log(wNextDiv);
		await loadNextDivKOTable(wNextDiv);
		return
	};		// There are still matches to be played in this STage divs
	let wStage = parseInt(wStageRec.stage,10);
	if /** there is another stage to play, so do promotions */ (wStage < wCompRec.noStages -1) {
		console.log("/page/MaintainScore btnRefresh	 Move to next stage");
		//await loadNextDivTable();	//should be done from  gotonextstage
	} else /** no more to do */{ 
		console.log("/page/MaintainScore btnRefresh Competition is completed");
	} 

}

/**
 *	Adds an event handler that runs when the element is double-clicked.
 *	 @param {$w.MouseEvent} event
 */
export function boxRow_dblClick(event) {
	let wItemId = event.context.itemId;
	if (wSelectedId === wItemId) { 
		wSelectedId = null;
		$w('#rptLGTable').forItems([wItemId], ($item, itemData, index) => {
			$item('#boxRow').style.backgroundColor = "rgba(255,255,255,1)";
		})
	}
}


function showErrorMessage(pMsg) {
    let wMsg = ["Player already used",
        "Records updated OK ",
        "No of bookings mis-match",
        "Not all players have been named",
        "Competition is already open",
        "Competition is completed",
		"Populate Stage/Division before activating",
		"Stage is completed",
		"Stage has been started",
		"Activation failed"
    ];

    $w('#txtErrorMsg').text = wMsg[pMsg - 1];
    $w('#txtErrorMsg').show();
	$w('#imgWait').hide();
    setTimeout(() => {
    	$w('#txtErrorMsg').hide();
    }, 8000);
    return
}

export function rgpMix_change(event) {
	let wMix = event.target.value;
	setCompetitionDropdown(wMix);
}