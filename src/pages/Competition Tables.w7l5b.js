// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow							from 'wix-window';

//import { getClubCompBookingByCompKey }		from 'public/objects/booking';
import { getActiveDivisionRoundBookings }	from 'public/objects/clubComp';
import { bulkUpdateClubCompBookings }		from 'public/objects/clubComp';

import { updateBookingGameScore }			from 'public/objects/clubComp';
//import { updateBookingPlayer }				from 'public/objects/booking';
import { getGamesPlayedCount }				from 'public/objects/clubComp';

import { formatDateString }					from 'public/fixtures';
import { loadLeagueTable }					from 'public/objects/clubComp';
import { loadL2Table }						from 'public/objects/clubComp';
import { addCompetitorGameScore } 			from 'public/objects/clubComp';
//import { updatePlayerScore }				from 'public/objects/openSingles.js';
import { loadStageCompetitors } 			from 'public/objects/clubComp';
import { updateCompetitionDivisionStatus }	from 'public/objects/clubComp';
import { updateClubComp }		 			from 'public/objects/clubComp';
import { getCountCompetitionOpenDivs }		from 'public/objects/clubComp';
import { getFirstActiveDiv }				from 'public/objects/clubComp';
import { SHAPE }							from 'public/objects/clubComp';
//import { sortBy }							from 'public/utility';
import _ from 'lodash';


	
//import { getCompBookings }					from 'public/objects/booking';
//import { loadCompCompetitors }				from 'public/objects/clubComp';



import { COMPETITION , STAGE, COMPETITOR }	from 'public/objects/clubComp';
import { COMPETITOR_TYPE }					from 'public/objects/clubComp';
import { BOOKING }							from 'public/objects/booking';
import { convertNull }						from 'public/objects/clubComp';
import { loadGlobalCompetitors }			from 'public/objects/clubComp';
import { loadCompetitions }					from 'public/objects/clubComp';
import { selectCompetition }				from 'public/objects/clubComp';
import { selectStage }						from 'public/objects/clubComp';
import { selectDivision	}					from 'public/objects/clubComp';
import { selectRound }						from 'public/objects/clubComp';
import { getFirstDiv }						from 'public/objects/clubComp';


const TEMP_HOLDER = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd";

let wCompRec;
let wStageRec;
let wMatchesInRound;
let wMatchesInNextRound = [];
let wRound;
let wStart = 0;

let wCache =[];
//let wData = [];
let wRole = "Admin";
let wId = "";
let isDivisionComplete = true;

let gYear = 2024;

let gCompetitions = [];

$w.onReady(async function () {

	let wYear =  new Date().getFullYear();
	gYear = wYear;
	;
	gCompetitions = await loadCompetitions(gYear);
	//let wGender = $w('#txtGender').text;//TODO REPLACE 
	let wGender = "L";
	if (wGender !== "L" && wGender !== "M" && wGender !== "X") {
		wGender = "M";
	}
	setCompetitionDropdown(wGender);
	$w('#rgpMix').value = wGender;
	
	//$w('#boxLabels').collapse();
	collapseDropdowns();
	if (gCompetitions) {
		$w('#boxLeagueTable').collapse();
		$w('#boxL2Table').collapse();
		$w('#boxKO').collapse();
		$w('#boxNothing').collapse
	}
	/** 
	console.log("wCompRec");
	console.log(wCompRec);
	console.log("wStageRec");
	console.log(wStageRec);
	console.log("Matches in Round");
	console.log(wMatchesInRound);
	console.log("Cache");
	console.log(wCache);
	// */
	
 	$w("#rptLGTable").onItemReady(async ($item, itemData, index) => {
		await loadLGTableLine($item, itemData, index);
	});

 	$w("#rptL2").onItemReady(async ($item, itemData, index) => {
		await loadL2TableLine($item, itemData, index);
	});

	$w('#rptR1').onItemReady(async  ($item, itemData, index) => {
		await loadKOLine($item, itemData, index,"1");
	});

	$w('#rptR2').onItemReady(async ($item, itemData, index) => {
		await loadKOLine($item, itemData, index, "2");
	});
	$w('#rptR3').onItemReady(async ($item, itemData, index) => {
		await loadKOLine($item, itemData, index, "3");
	});
});

//============================ Helper functions ===============================================

function collapseDropdowns() {
	$w('#drpStage').collapse();
	$w('#drpDivision').collapse();
	$w('#drpRound').collapse();
}

function buildCache( pCompRef, intStage, intDiv) {
	//ts("Build Cache");
	wCache = [];
	let wData = loadGlobalCompetitors();
	if (wData) {
		let wSet = wData.filter( (item) => item.skipId !== null);
		wCache = wSet.map ( (item) => {
			return {
				"_id": item._id,
				"skipId": item.skipId,
				"skip": item.skip,
				"teamNames": item.teamNames
			}
		})
	let wItem = {"_id": TEMP_HOLDER, "skipId": TEMP_HOLDER, "skip": "Temporary Holder",
			 "teamNames": ["Temporary Holder"]};
	wCache.push(wItem);
	}
	//console.log(wCache);
	//te("Build Cache"); 
}

function getMember (pId){
	try {
		if (pId === null || pId === "") {return ""};
		//console.log(pId);
		let wobj = wCache.find(wobj => wobj.skipId === pId);
		if (wobj) {
			return wobj;
		} else {
			console.log("/page CompetitionTables getMember" , pId, " Not found in cache");
			return false;
		}
	}
	catch ( err ) {
		console.log("/page CompetitionTables getMember try catch ", err);
			return false;
	}
}

//============================ Repeater handlers ===============================================

async function loadLGTable() {
	manageDropdowns();

	if (wStageRec.shape === "LG") {
		$w('#rptLGTable').data = [];
		let wData = await loadLeagueTable(wCompRec, wStageRec.stage, wStageRec.div);
		let wTeams = wData.filter( item => item.competitorId > 0);
		let first = {"_id": "1", "skip": "Player", "played": "Played", "pointsAgainst": "Against",
					"pointsFor": "For", "nextDiv": ""};
		wTeams.unshift(first);
		$w('#rptLGTable').data = wTeams;
		return wTeams;
	} else if (wStageRec.shape === "L2"){
		$w('#boxL2Table').expand();
		$w('#boxLeagueTable').collapse();
		$w('#boxKO').collapse();
		let firstD = {"_id": "1", "teamName": "Team", "played": "Played", "mWon": "Won",
					"mDrawn": "Drawn", "mLost": "Lost", "sWon": "Bonus", "pointsFor": "For",
					"pointsAgainst": "Against", "points": "Points"};
		let firstM = {"_id": "1", "teamName": "Team", "played": "P", "mWon": "W",
					"mDrawn": "D", "mLost": "L", "sWon": "B", "pointsFor": "F",
					"pointsAgainst": "A", "points": "Pts"};
		let wTeams = [];
		loadL2Table(wCompRec, wStageRec.stage, wStageRec.div)
		.then( (wResult) => {
			wTeams = wResult.filter( item => item.competitorId > 0);
			if(wixWindow.formFactor === "Mobile"){
				wTeams.unshift(firstM);
			} else { 
				wTeams.unshift(firstD);
			}
			$w('#rptL2').data = [];
			$w('#rptL2').data = wTeams;
		})
		return wTeams;
	}
}

function manageDropdowns() {
	if ($w('#drpStage').options.length > 1) { $w('#drpStage').expand()  } else { $w('#drpStage').collapse()};
	if ($w('#drpDivision').options.length > 1) { $w('#drpDivision').expand()} else { $w('#drpDivision').collapse()};
	if ($w('#drpRound').options.length > 1) { $w('#drpRound').expand()} else { $w('#drpRound').collapse()};
	//$w('#drpRound').collapse();
}

export function loadLGTableLine($item, itemData, index) {
		if (index === 0 ) {
			$item('#boxRow').style.backgroundColor = "#DEB887";
			$item("#txtPos").text = "#";
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


export function loadL2TableLine($item, itemData, index) {
	if (index === 0 ) {
		$item('#boxL2').style.backgroundColor = "#DEB887";
		$item("#txtL2Place").text = "#";
	} else {
		if (index < wStageRec.noPromote + 1){
			$item('#boxL2').style.backgroundColor = "rgba(255,255,51,0.8)";
		}
		$item("#txtL2Place").text = String(index);
	}
	$item("#txtL2Player").text = convertNull(itemData.teamName, "");
	$item("#txtL2Played").text = String(itemData.played);
	$item("#txtL2Win").text = String(itemData.mWon);
	$item("#txtL2Drawn").text = String(itemData.mDrawn);
	$item("#txtL2Lost").text = String(itemData.mLost);
	$item("#txtL2Bonus").text = String(itemData.sWon);
	$item("#txtL2PointsFor").text = String(itemData.pointsFor);
	$item("#txtL2PointsAgainst").text = String(itemData.pointsAgainst);
	$item("#txtL2Points").text = String(itemData.points);
}

async function loadKOLine($item, itemData, index, pRpt) {
	switch (pRpt) { 
		case "1":
			await loadKOLineDetail($item, itemData, '#txtDateR1', '#txtAR1', '#txtVR1', '#txtBR1');
			break;
		case "2":
			await loadKOLineDetail($item, itemData, '#txtDateR2', '#txtAR2', '#txtVR2', '#txtBR2');
			break;
		case "3":
			await loadKOLineDetail($item, itemData, '#txtDateR3', '#txtAR3', '#txtVR3', '#txtBR3');
			break;
	}
	return true;
}

async function loadKOLineDetail($item, itemData,pE1, pE2, pE3, pE4) {
	$item(pE1).text = formatDateString(itemData.dateRequired, "Short");
	if (itemData.playerAId === TEMP_HOLDER) { 
		$item(pE2).text = "tbd";
	}else { 
		$item(pE2).text = convertNull(getMember(itemData.playerAId).skip,"");
	}
	if (itemData.isBye === "Y"){
		$item(pE3). text = "Bye";
		$item(pE4).text = "";
	} else if (itemData.playerBId === TEMP_HOLDER) { 
		$item(pE4).text = "tbd";
	}else { 
		$item(pE4).text = convertNull(getMember(itemData.playerBId).skip,"");
		if (itemData.status === BOOKING.COMPLETED) { 
			let wScoreA = String(itemData.scoreA);
			let wScoreB = String(itemData.scoreB);
			$item(pE3).text = wScoreA + " v " + wScoreB;
		} else { 
			$item(pE3). text = "v";
		}
	}
	return true;
}
//============================ Dropdown event handlers ===============================================
export async function drpCompetition_change(event) {
	$w('#imgWait').show();
	clearAllBoxes();
	let wRef = event.target.value;

	let wResultObj = await selectCompetition(gYear, wRef);
	if (wResultObj) {
		wCompRec = wResultObj.competitionObj;
		wStageRec = wResultObj.stageDivObj;
		wRound = 1;
		if (wCompRec.status !== COMPETITION.IN_PROGRESS && wCompRec.status !== COMPETITION.OPEN) {
			$w('#imgWait').hide();
			$w('#boxLeagueTable').collapse();
			$w('#boxKO').collapse();
			$w('#boxL2Table').collapse();
			$w('#boxNothing').expand();
			$w('#cstrpKO').collapse();
			$w('#imgWait').hide();
			return false;
		}
		if (wCompRec.competitorType !== COMPETITOR_TYPE.TEAM) {
			buildCache();
		}
		switch (wCompRec.shape ){
			case "L2":
				$w('#boxLeagueTable').collapse();
				$w('#boxL2Table').expand();
				$w('#boxKO').collapse();
				$w('#boxNothing').collapse();
				$w('#cstrpKO').collapse();
				$w('#imgWait').hide();
				loadA();
				break;
			case "KO":
				$w('#boxLeagueTable').collapse();
				$w('#boxL2Table').collapse();
				$w('#boxNothing').collapse();
				if(wixWindow.formFactor === "Mobile"){  
					$w('#boxKO').expand();
					$w('#cstrpKO').collapse();
					$w('#imgWait').hide();
				} else { 
					$w('#boxKO').collapse();
					$w('#cstrpKO').expand();
					populateMatches(1);
					$w('#imgWait').hide();
				}
				break;
			default:
				$w('#boxLeagueTable').expand();
				$w('#boxL2Table').collapse();
				$w('#boxKO').collapse();
				$w('#boxNothing').collapse();
				$w('#cstrpKO').collapse();
				loadA();
		}
	} else {
			clearMatches();
			$w('#lblManagedMsg').text = "This competition has not been configured yet";
			$w('#lblStageState').text = "";
			$w('#lblDivisionState').text = "";
			$w('#lblRoundState').text = "";
			$w('#imgWait').hide();
			$w('#boxLeagueTable').collapse();
			$w('#boxKO').collapse();
			$w('#boxL2Table').collapse();
			$w('#boxNothing').expand();
			$w('#cstrpKO').collapse();
			$w('#imgWait').hide();
	};
}

function loadDropSeason(pYear){
	const wStartYear = 2019;
	let wOptions = [];
	for (let i = pYear; i >= wStartYear; i--){
		let wRec = {
			"label": String(i),
			"value": String(i)
		}
		wOptions.push(wRec);
	}
	$w('#drpSeason').options = wOptions;
	clearAllBoxes();
	/////$w('#drpSeason').value = String(pYear);		////
}

export function loadA() {
	let wResult = getFirstDiv();
	if (wResult) {
		wStageRec = wResult.divs[wResult.index];
		$w('#drpStage').value = wStageRec.stage ;
		let wResultObj = selectStage(parseInt(wStageRec.stage,10));
		if (wResultObj) {
			wStageRec = wResultObj.stageDivObj;
			loadLGTable();
		}
		$w('#imgWait').hide();
	}

}

export function drpStage_change(event) {
	//ts("drop stage change");
	$w('#imgWait').show();
	let wNewStage = parseInt(event.target.value,10);
	let wResultObj = selectStage(wNewStage);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		loadLGTable();
		$w('#imgWait').hide();
	}
	//te("drop stage change");
}

export function drpDivision_change(event) {
	//ts("drop div change");
	$w('#imgWait').show();
	let wNewDiv = parseInt(event.target.value,10);

	//$w('#txtTitle').text = wCompRec.title + " " + wNewDivision;
	let wResultObj = selectDivision(wStageRec.stage, wNewDiv);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		loadLGTable();
		$w('#imgWait').hide();
	}
}

export function drpRound_change(event) {
	//ts("drop round change");
	$w('#imgWait').show();
	wRound = parseInt(event.target.value,10);
	populateMatches(wRound);
	$w('#imgWait').hide();
	//te("drop round change");
}

function populateMatches(pRound) {
	//ts("pop Matches");
	manageDropdowns();
	let wMatchesInRound1 = selectRound(0,0, pRound);
	let wMatchesInRound2 = selectRound(0,0, pRound+1);
	let wMatchesInRound3 = selectRound(0,0, pRound+2);
	let wSortedRound1Matches = _.sortBy(wMatchesInRound1, ["matchKey"]);
	let wSortedRound2Matches = _.sortBy(wMatchesInRound2, ["matchKey"]);
	let wSortedRound3Matches = _.sortBy(wMatchesInRound3, ["matchKey"]);
	//console.log(wMatchesInRound1);
	//console.log(wMatchesInRound2);
	//console.log(wMatchesInRound3);
	if (wMatchesInRound1) {
		$w('#rptR1').data = [];
		$w('#rptR2').data = [];
		$w('#rptR3').data = [];
		$w('#rptR1').data = wSortedRound1Matches;
		$w('#rptR2').data = wSortedRound2Matches;
		$w('#rptR3').data = wSortedRound3Matches;
	} else {
		console.log("/page CompetitionTables populateMatches No matches found for round ", wCompRec.compRef, "0", "0", pRound);
	}
	//te("pop Matches");
}
export function clearMatches() {
	let wData = [];
	wMatchesInRound = [];
	$w('#imgWait').hide();
}

function clearAllBoxes() { 
	$w('#boxKO').collapse();
	$w('#boxL2Table').collapse();
	$w('#boxLeagueTable').collapse();
	$w('#boxNothing').collapse();
	$w('#cstrpKO').collapse();
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/


/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function rgpMix_change(event) {
	let wMix = event.target.value;
	setCompetitionDropdown(wMix);
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
