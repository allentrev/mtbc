import wixWindow							from 'wix-window';
import wixLocation 							from 'wix-location';

//import { getNewClubCompBookings }			from 'public/objects/booking';
//import { getAllNewStageBookings }			from 'public/objects/booking';
import { getNewDivisionRoundBookings }		from 'public/objects/clubComp';
import { getNewDivisionAllBookings }		from 'public/objects/clubComp';
import { bulkUpdateClubCompBookings }		from 'public/objects/clubComp';
import { BOOKING }							from 'public/objects/booking';

import { COMPETITION, STAGE}				from 'public/objects/clubComp';
import { COMPETITOR, COMPETITOR_TYPE }		from 'public/objects/clubComp';
import { convertNull }						from 'public/objects/clubComp';
import { loadCompetitions }					from 'public/objects/clubComp';
import { selectCompetition }				from 'public/objects/clubComp';
import { activateCompetition }				from 'public/objects/clubComp';
import { selectStage }						from 'public/objects/clubComp';
import { selectDivision	}					from 'public/objects/clubComp';
//import { getCompetitionStages }				from 'public/objects/clubComp';
import { getCompetitionAllDivisions }		from 'public/objects/clubComp';
import { updateCompetitionDivisionStatus }	from 'public/objects/clubComp';
import { updateEP5Bookings }				from 'public/objects/clubComp';
import { loadGlobalStages }					from 'public/objects/clubComp';
import { loadGlobalBookings }				from 'public/objects/clubComp';
import { loadDivCompetitors }				from 'public/objects/clubComp';
import { loadDivPool }						from 'public/objects/clubComp';
import { bulkUpdateCompetitors }			from 'public/objects/clubComp';

//import { getActiveDivisionRoundBookings }	from 'public/objects/clubComp';
//import { getCompetition }					from 'public/objects/clubComp';
//import { getCompetitions }					from 'public/objects/clubComp';
//import { getCompetitionUniqueDivisions }	from 'public/objects/clubComp';
//import { fillRoundOptions }					from 'public/objects/clubComp';
import { getStage }							from 'public/objects/clubComp';


let wCompRec;
let wStageRec;
let gCompetitions = [];

/**
 * these are used to hold the repeaters data. Cant use the data property since once set, it is immutable and
 * we need to update this data with the competitors returned from the lightbox
 */
let wSeedsRptData = [];
let wOtherRptData = [];
let wPoolRptData = [];

let gYear = 2023;

$w.onReady(async function () {

	let wInput = wixLocation.query.compRef;
	if (wInput) {
		console.log("Input = ", wInput);
	}

	if (wixWindow.formFactor === "Mobile"){
		$w('#cstrpDesktop').collapse();
		$w('#cstrpMobile').expand();
	} else {
		$w('#cstrpDesktop').expand();
		$w('#cstrpMobile').collapse();

		gCompetitions = await loadCompetitions(gYear);
		if (gCompetitions) {
			//wCompRec = wResultObj.competitionObj;
			//wStageRec = wResultObj.stageDivObj;
			$w('#lblRoundLabel').collapse();	//Round is not used on this page`
			$w('#drpRound').collapse();
			$w('#lblRoundState').collapse();
			let wGender = $w('#txtGender').text;
			if (wGender !== "L" && wGender !== "M" && wGender !== "X") {
				wGender = "L";
			}
			setCompetitionDropdown(wGender);
			$w('#rgpMix').value = wGender;
		} else {
			$w('#boxPlayersInput').collapse();
			$w('#drpCompetition').options = [{"label": "No competitions", "value": "X"}]
		}

		$w('#rptSeeds').onItemReady( ($item, itemData, index) => {
			loadSeeds($item, itemData);
		});

		$w('#rptOthers').onItemReady(($item, itemData, index) => {
			loadOthers($item, itemData, index);
		});

		$w('#rptPool').onItemReady(($item, itemData, index) => {
			loadPool($item, itemData, index);
		});
		//$w('#chkOtherSelect').onClick( $item => {
		//	chkOtherSelect_click($item);
		//})
	}
});

function loadSeeds($item, itemData) {
	$item('#txtSeed').text = itemData._id;
	$item('#txtPlayerSeed').text  = "unallocated";
	$item('#inpSeedHcp').value = 0;
}

function loadOthers($item, itemData, index) {
	let wNoSeeds = parseInt(wStageRec.seeds,10);
	$item('#txtOther').text = "C" + String(wNoSeeds + index + 1).padStart(2,"0");
	$item('#inpOtherHcp').value = parseInt(convertNull(itemData.hcp,"0"),10);
	$item('#txtPlayerOther').text  = convertNull(itemData.skip,"");
	switch (wCompRec.gameType) {
		case 1:
			break;
		case 2:
			$item('#txtPlayerOther2').text  = convertNull(itemData.teamNames[1],"");
			break;
		case 3:
			$item('#txtPlayerOther2').text  = convertNull(itemData.teamNames[1],"");
			$item('#txtPlayerOther3').text  = convertNull(itemData.teamNames[2],"");
			break;
		case 4:
			$item('#txtPlayerOther2').text  = convertNull(itemData.teamNames[1],"");
			$item('#txtPlayerOther3').text  = convertNull(itemData.teamNames[2],"");
			$item('#txtPlayerOther4').text  = convertNull(itemData.teamNames[3],"")
			break;
		default:
			$item('#txtPlayerOther2').text  = convertNull(itemData.teamNames[1],"");
			$item('#txtPlayerOther3').text  = convertNull(itemData.teamNames[2],"");
			$item('#txtPlayerOther4').text  = convertNull(itemData.teamNames[3],"");
			break;
		}
}


function loadPool($item, itemData, index) {
	//console.log("LO ", index);
	$item('#txtPoolCount').text = "C" + String(index + 1).padStart(2,"0");
	$item('#txtPoolName').text  = convertNull(itemData.player, "");
}

export function drpCompetition_change(event) {
	$w('#imgWait').show();
	let wNewCompRef = event.target.value;
	selectCompetition(gYear, wNewCompRef)
	.then ( wResultObj => {
		if (wResultObj) {
			wCompRec = wResultObj.competitionObj;
			wStageRec = wResultObj.stageDivObj;
			if (wStageRec) {
				$w('#boxPlayersInput').expand();
				populatePlayers();
				$w('#imgWait').hide();
				return;
			}
		}
		clearRepeaters();
		$w('#lblManagedMsg').text = "Competition is not configured properly";
		$w('#lblStageState').text = "";
		$w('#lblDivisionState').text = "";
		$w('#lblRoundState').text = "";
		$w('#boxPlayersInput').collapse();
	})
}

export function drpStage_change(event) {
	$w('#imgWait').show();
	let wNewStage = parseInt(event.target.value,10);
	let wResultObj = selectStage(wNewStage);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		populatePlayers();
		$w('#imgWait').hide();
		return;
	}
	clearRepeaters();
}

export function drpDivision_change(event) {
	$w('#imgWait').show();
	let wNewDiv = parseInt(event.target.value,10);
	let wResultObj = selectDivision(wStageRec.stage, wNewDiv);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			populatePlayers();
			$w('#imgWait').hide();
			return;
		}
	}
	clearRepeaters();
}

function clearRepeaters() {
	let wData = [];
	$w('#rptSeeds').data = wData;
	$w('#rptOthers').data = wData;
	wSeedsRptData = [];
	wOtherRptData = [];
	wPoolRptData= [];
	$w('#imgWait').hide();
	return [];
}

export function populatePlayers() {
	let wData = clearRepeaters();

	configureLayout();
	//wData = await loadCompetitors(wCompRec.compRef, wStageRec.stage, wStageRec.div);
	wData = loadDivCompetitors(wStageRec.stage, wStageRec.div);
	let wSeeds = wData.filter ( item => item.seed !== 0);
	let wOther = wData.filter ( item => item.seed === 0);
	let wSet = loadDivPool(wStageRec.stage, wStageRec.div); //only contains competitorId = 0
	if (wStageRec.handicapped){
		$w('#chkHcp').checked = true;
		$w('#inpOtherHcp').show();
		$w('#lblOtherHcp').show();
	} else {
		$w('#chkHcp').checked = false;
		$w('#inpOtherHcp').hide();
		$w('#lblOtherHcp').hide();
	}
	if (wSeeds.length === 0 && wOther.length === 0) { return };
	if (wSeeds.length !== 0) {
		loadRepeater($w('#rptSeeds'), wSeeds);
	}
	if (wOther.length !== 0) {
		loadRepeater($w('#rptOthers'), wOther);
	}
	if (wSet.length !== 0) {
		loadRepeater($w('#rptPool'), wSet);
	}
}

export function configureLayout() {
	//console.log("Configure Layout, CompRec");
	//console.log(wCompRec);
	/**
	 * TODO: put in proper code to handle the edit situation
	 */
	//if (wCompRec.status === COMPETITION.NEW && wStageRec.status === STAGE.NEW) {
	
	$w('#chkHcp').checked = wStageRec.handicapped;
	if (wStageRec.handicapped) {
		$w('#inpSeedHcp').show();
		$w('#inpOtherHcp').show();
	} else {
		$w('#inpSeedHcp').hide();
		$w('#inpOtherHcp').hide();
	}
	if (wStageRec.seeds > 0) {
		//console.log("seeds");
		$w('#chkSeeds').checked = true;
		$w('#inpNoSeeds').value = wStageRec.seeds;
		$w('#inpNoSeeds').show();
		$w('#boxSeedsInput').expand();
		$w('#icbtnSeedsUp').hide();
		$w('#icbtnSeedsDown').hide();
		if (wStageRec.seeds < wStageRec.noTeams) {
			$w('#boxOthersInput').expand();
		}
	} else {
		//console.log("seeds else");
		$w('#chkSeeds').checked = false;
		$w('#inpNoSeeds').hide();
		$w('#boxSeedsInput').collapse();
		$w('#boxOthersInput').expand();
		$w('#icbtnOthersUp').hide();
		$w('#icbtnOthersDown').hide();
		//$w('#btnRandom').hide();
	}
	$w('#btnOtherGetPlayers').label = "Get Players";
	$w('#lblOthers').text = "Teams";
	if (wCompRec.gameType === 1) { 
		$w('#rgpPool').collapse();
	} else { 
		$w('#rgpPool').expand();
	}
	configureOtherRepeater();
}

function configureOtherRepeater(){ 
	switch (wCompRec.gameType) {
		case 1:
			$w('#txtPlayerOther2').hide();
			$w('#txtPlayerOther3').collapse();
			$w('#txtPlayerOther4').collapse();
			$w('#rgpPool').collapse();
			break;
		case 2:
			$w('#txtPlayerOther2').show();
			$w('#txtPlayerOther3').collapse();
			$w('#txtPlayerOther4').collapse();
			$w('#rgpPool').expand();
			break;
		case 3:
			$w('#txtPlayerOther2').show();
			$w('#txtPlayerOther3').expand();
			$w('#txtPlayerOther4').collapse();
			$w('#rgpPool').expand();
			break;
		case 4:
			$w('#txtPlayerOther2').show();
			$w('#txtPlayerOther3').expand();
			$w('#txtPlayerOther4').expand();
			$w('#rgpPool').expand();
			break;
		default:
			$w('#txtPlayerOther2').show();
			$w('#txtPlayerOther3').expand();
			$w('#txtPlayerOther4').expand();
			break;
	}
}

function loadRepeater($item, pRecs){
	//console.log("load repeater ", $item.id);
	let wData = [];
	let wTeamNames = [];
	let wPool = [];
	switch ($item.id) {
		case "rptPool":
			wPoolRptData = pRecs; // only contains competitorId = 0
			wTeamNames = wPoolRptData[0].teamNames;
			//let wPool = [{"_id": "01", "player": "Trevor Allen"},{"_id": "02", "player": "Sarah AllEn"}];
			wPool = wTeamNames.map( (member, index) => {
				let wRec = {"_id": String(index+1), "player": member};
				return wRec;
	 		}) 
			$item.data = wPool;
			break;
		default:
			for (let i=0; i < pRecs.length; i++){
				let wPlayer = {...pRecs[i]};
				if (wCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
					wPlayer.skip = wPlayer.teamName;
				} else {
					wPlayer.skip = wPlayer.teamNames[0];
				}
				wData.push(wPlayer);
			}
			$item.data = wData;
			if ($item.id === "rptSeeds") {
				wSeedsRptData = wData;
			} else {
				wOtherRptData = wData;
			}
			break;
	}
}

function refreshOtherRepeater (pStart, pRec ){
	//console.log("refresh repeater, itemData + pRec data", pRec.length);
	let wNoSeeds = parseInt(wStageRec.seeds,10);
	let count = 0;
	$w('#rptOthers').forEachItem( ($item, itemData, index) => {
		if ($item('#chkOtherGet').checked){
			let wItem = pRec[count];
			if(wItem) {
				console.log(wItem.teamNames[0], wItem._id);
				wOtherRptData[index].skipId = wItem._id;
				wOtherRptData[index].skip = wItem.teamNames[0];
				wOtherRptData[index].competitorId = wNoSeeds + index + 1;
				wOtherRptData[index].seed = 0;
				wOtherRptData[index].hcp = parseInt($item('#inpOtherHcp').value,10);
				wOtherRptData[index].teamNames = wItem.teamNames;
				wOtherRptData[index].teamIds = wItem.teamIds;
				$item('#txtOther').text = "C" + String(wNoSeeds + index + 1).padStart(2,"0");
				$item('#txtPlayerOther').text  = convertNull(wItem.teamNames[0],"");
				switch (wCompRec.gameType) {
					case 1:
						break;
					case 2:
						$item('#txtPlayerOther2').text  = convertNull(wItem.teamNames[1],"");
						break;
					case 3:
						$item('#txtPlayerOther2').text  = convertNull(wItem.teamNames[1],"");
						$item('#txtPlayerOther3').text  = convertNull(wItem.teamNames[2],"");
						break;
					case 4:
						$item('#txtPlayerOther2').text  = convertNull(wItem.teamNames[1],"");
						$item('#txtPlayerOther3').text  = convertNull(wItem.teamNames[2],"");
						$item('#txtPlayerOther4').text  = convertNull(wItem.teamNames[3],"")
						break;
					default:
						$item('#txtPlayerOther2').text  = convertNull(wItem.teamNames[1],"");
						$item('#txtPlayerOther3').text  = convertNull(wItem.teamNames[2],"");
						$item('#txtPlayerOther4').text  = convertNull(wItem.teamNames[3],"");
						break;
				}
				count++;
			}
		}
	})
}

export function btnRandom_click(event) {
	let wMembers = $w('#rptOthers').data;
	let wOrder =   wMembers.map((p,i) => i);
	shuffleArray(wOrder);
	let wNewMembers = [];
	for (let i = 0; i < wMembers.length; i++) {
		wNewMembers.push(wMembers[wOrder[i]]);
	};
	let wReNumbered = wNewMembers.map( (item, index) => {
		item.competitorId = index +1;
		return item;
	})
	$w('#rptOthers').data = [];
	$w('#rptOthers').data = wReNumbered;
}

export function btnRandomPool_click(event) {
	let wMembers = $w('#rptPool').data;
	let wOrder =   wMembers.map((p,i) => i);
	shuffleArray(wOrder);
	let wNewMembers = [];
	for (let i = 0; i < wMembers.length; i++) {
		wNewMembers.push(wMembers[wOrder[i]]);
	};
	let wReNumbered = wNewMembers.map( (item, index) => {
		item.competitorId = index +1;
		return item;
	})
	$w('#rptPool').data = [];
	$w('#rptPool').data = wReNumbered;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

export function btnOtherGetPlayers_click(event) {
	let count = 0;
   	$w('#rptOthers').forEachItem ( ($item, index) => {
		if ($item('#chkOtherGet').checked) {
			count++;
	   	}
   	})

	let wType = parseInt(wCompRec.gameType,10);

	if ($w('#rgpPool').value === "N") { 
	   	wType = 1;
	}

   	let wParams = {
		"seeds": "N",
	   	"mix": wCompRec.mix,
	   	"type": wType,
	   	//"noTeams": wStageRec.noTeams - wStageRec.seeds
	   	"noTeams": count
   	}
   // {member} is {_id, firstName, surname, player, temNames}
	wixWindow.openLightbox("lbxSelectManyMembers", wParams)
	.then ( wMembers => { 
		if (wMembers) {
			count = 0;
			refreshOtherRepeater( 0, wMembers);
			$w('#btnPopulate').enable();
			$w('#btnRandom').enable();
			clearAllTeamSelections();
		}
	})
}

export function btnSeedsGetPlayers_click(event) {
   let wParams = {
	   "Seeds": "Y",
	   "Mix": wCompRec.mix,
	   "Type": parseInt(wCompRec.gameType,10),
	   "noTeams": parseInt(wStageRec.seeded,10)
   }
	wixWindow.openLightbox("lbxSelectManyMembers", wParams)
	.then ( wMembers => { 
		if (wMembers) {
			$w('#rptSeeds').data = wMembers;
			$w('#btnPopulate').enable();
		}
	})
}

export function cntSeed_click(event) {
	console.log("cnt click");
    let $item = $w.at(event.context);
	//$item('#chkOtherSelect').checked = !($item('#chkOtherSelect').checked);
}


export function icbtnSeedsUp_click(event) {
	// Add your code for this event here: 
}

export function icbtnSeedsDown_click(event) {
	// Add your code for this event here: 
}


export function icbtnOthersUp_click(event) {
	// Add your code for this event here: 
}

export function icbtnOthersDown_click(event) {
	// Add your code for this event here: 
}
/**
 * this function takes the list of competitors created on this page to populate the 
 * bookings records for the current stage of this competition, and of
 * the competition stage. To do this follow the rules:
 * 		a) if a KO, then populate only round 1
 *		b) if League, then populate all rounds 
 */
export async function btnPopulate_click(event) {
	if (wStageRec.status === STAGE.COMPLETED) {showErrorMessage(8); return}
	if (wStageRec.status === STAGE.ACTIVE) {showErrorMessage(9); return}
	$w('#imgWait').show();
	const reducer = (accumulator, item) => {
		if (item.status === COMPETITOR.ACTIVE) {
			accumulator++;
		}
		return accumulator;
	};
	
	let wTemp = mergeLists();
	let wMembers = wTemp.filter ( item => item.competitorId !== 0);	//filter out pool record
	let wMembersCount = wMembers.reduce(reducer, 0);
	if (wMembersCount !== wStageRec.noTeams) { //all players need to be named to populate bookings
		showErrorMessage(4);
		return;
	}
	console.log(wMembers);
	//	================= now update all booking records ==================================
	switch (wStageRec.shape) {
		case "KO2":
		case "KO":	
			updateKOBookings(wMembers)
			.then ( async (result) => {
				showErrorMessage(2);
				updateCompetitionDivisionStatus(wStageRec._id, STAGE.SCHEDULED);
				$w('#btnActivate').enable();
				$w('#imgWait').hide();
			})
			break;
		case "EP5":	
			updateEP5Bookings(wMembers, wStageRec)
			.then ( async (result) => {
				showErrorMessage(2);
				updateCompetitionDivisionStatus(wStageRec._id, STAGE.SCHEDULED);
				$w('#btnActivate').enable();
				$w('#imgWait').hide();
			})
			break;
		case "LG":
		case "L2":
			updateLGBookings(wMembers)
			.then ( async (result) => {
				showErrorMessage(2);
				updateCompetitionDivisionStatus(wStageRec._id, STAGE.SCHEDULED);
				$w('#btnActivate').enable();
				$w('#imgWait').hide();
			})
			.catch ( (err) => {
				console.log(err);
				showErrorMessage(3);
				$w('#imgWait').hide();
			})
			break;
		default:
			break;
	}
}

function mergeLists() {
	let wMembers = [];
	if (wStageRec.seeds > 0) {
		/**
		 * concatenate seeds and other to one list
		 * 
		 * add in seeds and handicap data that may have been input
		 */
		/** $w('#rptSeeds').forEachItem ( ($item, itemData, index) => {
			if ($item('#chkSeedSelect').checked){
				let wRec = wOtherRptData[index];
				wMembers.push(wRec);
			}
		})
		$w('#rptOthers').forEachItem ( ($item, itemData, index) => {
			if ($item('#chkOtherSelect').checked){
				let wRec = wOtherRptData[index];
				wMembers.push(wRec);
			}
		})
		*/
		wMembers = [...wSeedsRptData, ...wOtherRptData];
	} else {
		$w('#rptOthers').forEachItem ( ($item, itemData, index) => {
			wOtherRptData[index].hcp = parseInt($item('#inpOtherHcp').value,10);
		})
		wMembers = [...wPoolRptData, ...wOtherRptData]; // it is what is in wPoolRptData that counts
	}
	return wMembers;
}
export function btnSaveCompetitors_click(event) {
	//if (wStageRec.status === STAGE.COMPLETED) {showErrorMessage(8); return}
	//if (wStageRec.status === STAGE.ACTIVE) {showErrorMessage(9); return}
	$w('#imgWait').show();
	let wMergedMembers = mergeLists();
	let wMembers = wMergedMembers.map ( (obj) => {
		if (obj.skipId === null || obj.skipId === undefined) {
			return obj;
		} else { 
			obj.status = COMPETITOR.ACTIVE;
			return obj;
		}
	})
	
	console.log("Bulk update");
	console.log(wMembers);
	let res = bulkUpdateCompetitors(wMembers);
	showErrorMessage(2);
	$w('#imgWait').hide();
}

async function  updateKOBookings(pStageCompetitors) {
	let wBookings = await getNewDivisionRoundBookings(wStageRec.stage, wStageRec.div, 1);
	console.log(wBookings);
	if (wBookings) {
		wBookings.forEach( (item, index) => {
			if (item.status === BOOKING.NEW) {
				item.status = (item.isBye === "Y") ?  BOOKING.OPEN: BOOKING.READY;
			} 
			let wPlayerAKey = wStageRec.bracket[0][index][0];	//[round][match][player]
			let wPlayerBKey = wStageRec.bracket[0][index][1];
			if (wPlayerAKey === 0) {
				item.playerAId = pStageCompetitors[wPlayerBKey-1].skipId; 
				item.playerBId = null; 
			}else if (wPlayerBKey === 0){
				item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
				item.playerBId = null; 
			} else {
				item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
				item.playerBId = pStageCompetitors[wPlayerBKey-1].skipId;
			}
		})
		bulkUpdateClubCompBookings(wBookings);
		return true;
	} else {
		console.log("Pages/Maintain Competitors/ Did not find any KO bookings");
		return false;
	}
}

async function  updateLGBookings(pStageCompetitors) {
	//console.log("wstagecompetitors");
	//console.log(pStageCompetitors);

	let wBookings = await getNewDivisionAllBookings(wCompRec.compRef, wStageRec.stage, wStageRec.div);
	let wNoMatchesPerRound = (Math.floor(parseInt(wStageRec.noTeams,10) / 2)) + parseInt(wStageRec.noByes,10);
	let wNoMatches = wNoMatchesPerRound * parseInt(wStageRec.noRounds,10);
	console.log("Found " + String(wBookings.length) + " records: Required " + String(wNoMatches) );
	if (wNoMatches !== wBookings.length) {
		console.log("Error");
		return Promise.reject("No of bookings mis-match");
	}
	let wBracket = wStageRec.bracket;
	console.log("Bracket", wNoMatches, wBookings.length);
	console.log(wBracket);
	if (wBookings) {
		console.log("index, matchKey, round, match, playerA, playerB, No bookings = ", wBookings.length);
		wBookings.forEach( (item, index) => {
			if (item.status === BOOKING.NEW) { 
				item.status = (item.isBye === "Y") ?  BOOKING.OPEN: BOOKING.READY;
			} 
			let wRound = parseInt(item.round,10) - 1;
			let wMatchKey = item.matchKey;
			let wMatch = parseInt(wMatchKey.slice(-2),10) - 1;
			console.log(index, wMatchKey, wRound, wMatch);
			let wPlayerAKey = wBracket[wRound][wMatch][0];
			let wPlayerBKey = wBracket[wRound][wMatch][1];
			console.log(index, wMatchKey, wRound, wMatch, wPlayerAKey, wPlayerBKey);
			if (wCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
				if (wPlayerAKey === null) {
					item.playerAId = pStageCompetitors[wPlayerBKey-1].skip; 
				}else if (wPlayerBKey === null){
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skip; 
					item.playerBId = null; 
				} else {
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skip; 
					item.playerBId = pStageCompetitors[wPlayerBKey-1].skip;
				}
			} else  { 
				if (wPlayerAKey === null) {
					item.playerAId = pStageCompetitors[wPlayerBKey-1].skipId; 
				}else if (wPlayerBKey === null){
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
					item.playerBId = null; 
				} else {
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
					item.playerBId = pStageCompetitors[wPlayerBKey-1].skipId;
				}
			}
		})
		//console.log("wBookings");
		//console.log(wBookings);

		bulkUpdateClubCompBookings(wBookings);
		return true;
	} else {
		showErrorMessage(3);
		return false;
	} 
}


/**
 * this function is only available once all initial stages have been populated.
 * Its role is to set the competition into its start state as follows:
 * 
 * 	- competition record: status N -> O, current stage = 1
 *	- first stage record: status N -> O
 *	- each booking record of status N or O: status -> O 
 */

export async function btnActivate_click(event) {
	const countUnreadyDivs = (accumulator, item) => {
		if (item.status !== STAGE.SCHEDULED) {
			accumulator++;
		}
		return accumulator;
	};
	$w('#btnActivate').disable();
	$w('#imgWait').show();
	if (wCompRec.status === COMPETITION.OPEN) {showErrorMessage(5); return}
	if (wCompRec.status === COMPETITION.CLOSED) {showErrorMessage(6); return}
	if (wCompRec.status === COMPETITION.NEW) {showErrorMessage(12); return}
	if (wCompRec.status === COMPETITION.IN_PROGRESS) {showErrorMessage(11); return}
	let wDivs = await getCompetitionAllDivisions(0);
	let wDivsOpenCount = wDivs.reduce(countUnreadyDivs, 0);
	console.log("divs open = + wDivs", wDivsOpenCount);
	console.log(wDivs);
	if (wDivsOpenCount > 0) { showErrorMessage(7); return};
	wStageRec = getStage(0);
	console.log("wStageRec");
	console.log(wStageRec);
	if (wStageRec.status !== STAGE.SCHEDULED) { showErrorMessage(7); return}
	let res = await activateCompetition(wCompRec.compRef);
	if (res) {
		wCompRec.status = COMPETITION.OPEN;
		for (let wDiv of wDivs){
			console.log("Div loop, wDiv");
			console.log(wDiv);
			updateCompetitionDivisionStatus(wDiv._id, STAGE.ACTIVE);
			//if (!res) {console.log("Division status fail following competition activation"); return}
		}
		wStageRec.status = STAGE.ACTIVE; 	//this is the curent stage/div
		showErrorMessage(2);
	} else {
		console.log("Competition activation fail");
		showErrorMessage(10);
	}
	$w('#imgWait').hide();
}

export function chkOtherControl_change(event) {
	$w('#chkOtherGet').checked = !($w('#chkOtherGet').checked);
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
		"Activation failed",
        "Competition is in progress",
        "Competition is not schedules",
    ];

    $w('#txtErrorMsg').text = wMsg[pMsg - 1];
    $w('#txtErrorMsg').show();
	$w('#imgWait').hide();
    setTimeout(() => {
    	$w('#txtErrorMsg').hide();
    }, 8000);
    return
}



export function chkHcp_change(event) {

	if ($w('#chkHcp').checked) {
		$w('#lblOtherHcp').show();
		$w('#inpOtherHcp').show();
	} else {
		$w('#lblOtherHcp').hide();
		$w('#inpOtherHcp').hide();
	}

}

export function inpOtherHcp_change(event) {
    let $item = $w.at(event.context);
	let wHcp = event.target.value;
	$item('#chkOtherControl').checked = true;
}


/**
*	Adds an event handler that runs when an input element's value
 is changed.
*	 @param {$w.Event} event
*/
export function rgpPool_change(event) {
	//TODO: check if we need to test number per side and hide/show fields accordingly
	let wisAll = $w('#rgpPool').value;
	if (wisAll === "N") {
		$w('#boxGetPool').expand();
		$w('#btnOtherGetPlayers').label = "Get Skips";
		$w('#lblOthers').text = "Skips";
		$w('#txtPlayerOther2').hide();
	} else {
		$w('#boxGetPool').collapse();
		$w('#btnOtherGetPlayers').label = "Get Team";
		$w('#lblOthers').text = "Teams";
		$w('#txtPlayerOther2').show();
	}
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function btnGetPoolPlayers_click(event) {
/**
	let wMembers = [	
		{"_id": "16dde405-5e92-4f72-bb64-d8e8a5f840cf",
			"firstName": "Ron",
			"surname": "Aitken",
			"player": "Ron Aitken",
			"teamNames": ["Ron Aitken"]},
		{"_id": "c1abd622-8685-4d11-bf62-e4d865f78ccf",
			"firstName": "Brian",
			"surname": "Allaway",
			"player": "Brian Allaway",
			"teamNames": ["Brian Allaway"]},
		{"_id": "4b582647-7f95-4bf7-a46f-8003c44ad449",
			"firstName": "Sue",
			"surname": "Allaway",
			"player": "Sue Allaway",
			"teamNames": ["Sue Allaway"]},
		{"_id": "7e864e0b-e8b1-4150-8962-0191b2c1245e",
			"firstName": "Trevor",
			"surname": "Allen",
			"player": "Trevor Allen",
			"teamNames": ["Trevor Allen"]},
		{"_id": "91eab866-e480-4ddc-9512-d27bbbed2f10",
			"firstName": "Sarah",
			"surname": "Allen",
			"player": "Sarah Allen",
			"teamNames": ["Sarah Allen"]},
		{"_id": "d3980912-b4b5-48a6-8568-1d562dabf037",
			"firstName": "John",
			"surname": "Barrett",
			"player": "John Barrett",
			"teamNames": ["John Barrett"]},
		{"_id": "3378660a-7509-41df-b0ff-526f42087504",
			"firstName": "Jeff",
			"surname": "Beal",
			"player": "Jeff Beal",
			"teamNames": ["Jeff Beal"]},
		{"_id": "c4b474fd-cd07-4e30-94b2-888302aed91a",
			"firstName": "Mike",
			"surname": "Beale",
			"player": "Mike Beale",
			"teamNames": ["Mike Beale"]},
		{"_id": "e02afa2b-ef85-4992-9903-8015039f283a",
			"firstName": "Martin",
			"surname": "Behmber",
			"player": "Martin Behmber",
			"teamNames": ["Martin Behmber"]},
		{"_id": "c587e38c-76af-4147-8803-a2b35cdd8fb0",
			"firstName": "Clive",
			"surname": "Behmber",
			"player": "Clive Behmber",
			"teamNames": ["Clive Behmber"]},
		{"_id": "45e02681-98fd-4a73-ab0c-a2cc96e00e37",
			"firstName": "Iris",
			"surname": "Blackburn",
			"player": "Iris Blackburn",
			"teamNames": ["Iris Blackburn"]},
		{"_id": "37d5e65e-9a08-43fd-bc14-34727f65339b",
			"firstName": "Christine",
			"surname": "Bond",
			"player": "Christine Bond",
			"teamNames": ["Christine Bond"]}
	];
	// */
	let wNoTeams = parseInt(wStageRec.noTeams);
	let wType = parseInt(wCompRec.gameType,10);
	let wNoInTable = $w('#rptPool').data.length;
	let count = wNoTeams * (wType -1) - wNoInTable;

	let wParams = {
		"seeds": "N",
	   	"mix": wCompRec.mix,
	   	"type": 1,					// getting a pool, so get individuals
	   	//"noTeams": wStageRec.noTeams - wStageRec.seeds
	   	"noTeams": count
   	}
   // {member} is {_id, firstName, surname, player, temNames}
	wixWindow.openLightbox("lbxSelectManyMembers", wParams)
	.then ( wMembers => { 
		if (wMembers) {
			console.log(wMembers);
			let wTableMembers = $w('#rptPool').data;
			count = wTableMembers.length;
			let wExtraTeamNames = wMembers.map( (wMember, index) => { 
				return {"_id": String(wNoInTable + index + 1), "player": wMember.player};
			})
			let wTeamNames = [...wTableMembers, ...wExtraTeamNames];
			let wPoolSet = wTeamNames.map( member => { 
				return member.player
			})
			wPoolRptData[0].teamNames = wPoolSet;
			$w('#rptPool').data = wTeamNames;
		}
	})

}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function btnMoveOut_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function icnMoveRight_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function icnMoveLeft_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

let wSelectedPool = null;
let wSelectedTeams = [];
let wSelectedTeam = {"id": "", "name": ""};

export function boxOthers_click(event) {
	let $item = $w.at(event.context);
	let wId = event.context.itemId;
	if (wSelectedPool !== null) {
		console.log("Do Pool Move")
		return;
	}
	//if (wCompRec.status === COMPETITION.OPEN){
	//	console.log("Do Withdrwal");
	//} else {
		$w('#btnOtherGetPlayers').label = "Update";
		$w('#btnOthersDelete').show();
	//}	
	makeTeamSelection($item, wId);
	console.log(wSelectedTeams);
//	$item('#chkOtherGet').checked = !($item('#chkOtherGet').checked);
	
}

export function boxPool_click(event) {
	let $item = $w.at(event.context);
	let wId = event.context.itemId;
	makePoolSelection($item, wId);
}

function makePoolSelection(pItem, pId){
	clearPoolSelection();
	if (pId === wSelectedPool) { wSelectedPool = null; return};
	pItem('#boxPool').style.backgroundColor = "#737373";
	wSelectedPool = pId;
}

function clearPoolSelection(){
	if (wSelectedPool === null) { return };
	$w('#rptPool').forItems( [wSelectedPool], ($cell) => { 
		$cell('#boxPool').style.backgroundColor = "rgba(207,207,155,1.0)";
	})
}

function makeTeamSelection(pItem, pId){
	let x = isInSelectedTeams(pId);
	if (x > -1) { clearTeamSelection(pId); wSelectedTeams.splice(x,1); buttonReset(); return};
	pItem('#boxOthers').style.backgroundColor = "#737373";
	let wTeam = {"id": pId, "name": pItem('#txtPlayerOther').text};
	pItem('#chkOtherGet').checked = true;
	wSelectedTeams.push(wTeam);
}

function clearTeamSelection(pId){
	if (wSelectedTeams.length === 0) { return };
	$w('#rptOthers').forItems( [pId], ($cell) => { 
		$cell('#boxOthers').style.backgroundColor = "rgba(207,207,155,1.0)";
		$cell('#chkOtherGet').checked = false;
	})
}

function clearAllTeamSelections() {
	for (let wTeam of wSelectedTeams) { 
		clearTeamSelection(wTeam.id)
	}
	wSelectedTeams = [];
	buttonReset();
}

function buttonReset() {
	$w('#btnOthersDelete').hide();
	if ($w('#rgpPool').value === "N") { 
		$w('#btnOtherGetPlayers').label = "Get Skips";
	} else { 
		$w('#btnOtherGetPlayers').label = "Get Team";
	}
}


function isInSelectedTeams (pId){
	let x = wSelectedTeams.findIndex(team => team.id === pId);
	return x;
}

export function btnOthersDelete_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function button1_click(event) {
	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 
}

/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export function btnAllocate_click(event) {
	configureOtherRepeater();
	let wPoolPlayers = $w('#rptPool').data;
	let wUpdatedPlayers = [];
	let wNumPoolPlayers = wPoolPlayers.length;
	let wNumPerSide = wCompRec.gameType - 1;
	let count = 0;
	$w('#rptOthers').forEachItem( ($item, itemData, index) => {
		if ($item('#chkOtherGet').checked){
			if (itemData.skipId !== null) {
				let wTeamPlayer = itemData;
				let wTeamArray = wTeamPlayer.teamNames;
				let wPoolName = "";
				for (let j=0; j < wNumPerSide; j++) { 
					if (wNumPoolPlayers < wNumPerSide) { break }			//run out of pool players to allocate
					wPoolName = wPoolPlayers.shift();
					wPoolRptData[0].teamNames.shift(); 
					wTeamArray.push(wPoolName.player);
				}
				wUpdatedPlayers.push(wTeamPlayer);
			}
		}
		count++;
	})
	refreshOtherRepeater( 0, wUpdatedPlayers);
	$w('#rptPool').data = wPoolPlayers;
}
//				wOtherRptData[index].skip = wItem.teamNames[0];


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
	let wManagedOptionSet = wManagedSet.map(item => {
        return {
            	"label": item.title,
           		"value": item.compRef
        	}
    	})
    
    $w('#drpCompetition').options = wManagedOptionSet;
}	
