import wixWindow							from 'wix-window';


import { loadCompetitions }					from 'public/objects/clubComp';
import { selectCompetition }				from 'public/objects/clubComp';
import { updateCompetitionDivisionBracket }	from 'public/objects/clubComp';
import { selectStage }						from 'public/objects/clubComp';
import { selectDivision	}					from 'public/objects/clubComp';
//import { getCompetitionStages }				from 'public/objects/clubComp';
//import { getCompetitionDivisions }			from 'public/objects/clubComp';
//import { bulkUpdateCompetitors }			from 'public/objects/clubComp';
//import { getOpenSinglesDivisions }	from 'public/objects/openSingles';
//import { getOpenSinglesCompetitors}	from 'public/objects/openSingles';
//import { bulkSaveOpenSingles}		from 'public/objects/openSingles';
//import { deleteOpenSingles}			from 'public/objects/openSingles';

//let wCache =[];
//let wPlayers = [];
//let wLadder = "A";
//let wDay = 0;
//let wCount = 0;

				
const wFreeColour=  "#CFCF9B";
const wSelectedColour = "#FFA500";
const wNotInUseColour = "rgba(180,180,180, 0.3)";
const wBookedColour = "#F2BF5E";
const cNOTINUSE = "#FFFFFF";
const cYELLOW = "rgba(242,242,12,0.5)";
const cYELLOW2 = "rgba(196,199,10,0.5)";
const cORANGE = "rgba(242,191,94,0.5)";


let wCompRec;
let wStageRec;
let wMatchesInRound;

let wNewBracket;
let wRounds = [];

let gYear = 2022;

$w.onReady(async function () {

	if (wixWindow.formFactor === "Mobile"){
		$w('#cstrpDesktop').collapse();
		$w('#cstrpMobile').expand();
	} else {
		$w('#cstrpDesktop').expand();
		$w('#cstrpMobile').collapse();

		let wResultObj = await loadCompetitions();
		if (wResultObj) {
			//wCompRec = wResultObj.competitionObj;
			//wStageRec = wResultObj.stageDivObj;
			//wNewBracket = wStageRec.bracket;
			//let wNoPlayers = wStageRec.noTeams;
			//let wNoRounds = wStageRec.noRounds;
			//let wRound = parseInt($w('#drpRound').value,10);
			//let wNoMatchesPerRound = wNewBracket.length;
			//populateMatches(wRound);
			//populateRounds(wNoRounds);
		} else {
			$w('#boxPlayersInput').collapse();
		}	
	}	
	/**
	console.log(wResultObj);
	console.log("wCompRec");
	console.log(wCompRec);
	console.log("wStageRec");
	console.log(wStageRec);
	console.log(wNewBracket);
	// */

	$w('#rptMatches').onItemReady(async ($item, itemData, index) => {
		await loadMatches($item, itemData, index);
	});

	$w('#rptRounds').onItemReady(async ($item, itemData, index) => {
		await loadRound($item, itemData, index);
	});
})
/** 
 maybe get ans from forum on how to do this. So left in here as a comment for the moment

	const validatePlayer = (otherPlayerElementId) => (value, reject) => {
		console.log("Im in");
		console.log(otherPlayerElement);
		let otherPlayerElement = $w(otherPlayerElementId);
        let wItem  = wPlayers[value];
        if (wItem) {
            otherPlayerElement.validity.valid = false;
            otherPlayerElement.updateValidityIndication();
            reject("Player already used");
        } else {
  			otherPlayerElement.validity.valid = true;
  			otherPlayerElement.resetValidityIndication();
        }
	};

	$w("#inpA").onCustomValidation(validatePlayer("#inpA"));
	$w("#inpB").onCustomValidation(validatePlayer("#inpB"));
// */


async function loadMatches($item, itemData, index) {
	$item('#lblMatch').text = String(index + 1);
	$item('#inpA').value  = itemData.playerAKey;
	$item('#inpB').value = itemData.playerBKey;
}

async function loadRound($item, itemData, index) {
	$item('#lblRound').text = String(itemData.num);
	$item('#boxRound').style.backgroundColor = cORANGE;
}

export async function drpCompetition_change(event) {
	$w('#imgWait').show();
	let wNewCompRef = event.target.value;
	let wResultObj = await selectCompetition(gYear, wNewCompRef);
	if (wResultObj){ 
		wCompRec = wResultObj.competitionObj;
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			wNewBracket = wStageRec.bracket;
			if (wNewBracket) {
				populateMatches(1);
				populateRounds(wStageRec.noRounds);
				$w('#drpStage').selectedIndex = 0;
				$w('#drpDivision').selectedIndex =0;
				$w('#drpRound').selectedIndex =0;
				$w('#btnValidate').show();
				$w('#imgWait').hide();
				return;
			}
		}
	}
	$w('#lblCompetitionState').text = "Competition is not configured properly";
	$w('#lblStageState').text = "";
	$w('#lblDivisionState').text = "";
	$w('#lblRoundState').text = "";
	$w('#boxPlayersInput').collapse();
}

export async function drpStage_change(event) {
	$w('#imgWait').show();
	let wNewStage = parseInt(event.target.value,10);
	let wResultObj = await selectStage(wNewStage);
	if (wResultObj) { 
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			wNewBracket = wStageRec.bracket;
			if (wNewBracket) {
				populateMatches(1);
				populateRounds(wStageRec.noRounds);
				$w('#drpDivision').selectedIndex =0;
				$w('#drpRound').selectedIndex =0;
				$w('#imgWait').hide();
				return;
			}
		}	
	}
}

export async function drpDivision_change(event) {
	$w('#imgWait').show();
	let wNewDiv = parseInt(event.target.value,10);
	let wResultObj = await selectDivision(wStageRec.stage, wNewDiv);
	if (wResultObj) {
		wStageRec = wResultObj.stageDivObj;
		if (wStageRec) {
			wNewBracket = wStageRec.bracket;
			if (wNewBracket) {
				populateMatches(1);
				populateRounds(wStageRec.noRounds);
				$w('#drpRound').selectedIndex =0;

				$w('#imgWait').hide();
				return;
			}
		}
	}
}

export async function drpRound_change(event) {
	$w('#imgWait').show();
	let wRound = parseInt(event.target.value,10);
	refreshMatches(wRound);
	$w('#imgWait').hide();
}

function  populateMatches(pRound) {
	// pRound is 1...n
	//	clear old data. The issue here is that the divisions of a stage may have a different number of rounds, and matches per round.
	let wData = [];
	$w('#rptMatches').data = wData;
	// set up for new configuration
	let wBracket = wStageRec.bracket;
	let wBracketForRound = wBracket[pRound - 1];
	let wNoMatchesPerRound = wBracketForRound.length;
	let wX = wBracketForRound.map( (item, index) => {
		return [item[0], item[1]]
	})
	for (let i = 0; i < wNoMatchesPerRound; i++) {
		let wItem = {"_id": "M" + String(i).padStart(2,"0"), "playerAKey": String(wX[i][0]),
					 "playerBKey": String(wX[i][1])};
		wData.push(wItem);
	}
	console.log("populate for round", wCompRec.compRef, wStageRec.stage, wStageRec.div, pRound);
	$w('#rptMatches').data = wData;
}

function refreshMatches(pRound) {
	// pRound is 1...n
	console.log("Refresh  for round", wCompRec.compRef, wStageRec.stage, wStageRec.div, pRound);
	let wBracket = wStageRec.bracket;
	let wBracketForRound = wBracket[pRound - 1];
	let wX = wBracketForRound.map( (item, index) => {
		return [item[0], item[1]]
	})
	$w('#rptMatches').forEachItem( ($item, itemData, index) => {
		$item('#lblMatch').text = String(index + 1);
		$item('#inpA').value = wX[index][0];
		$item('#inpB').value = wX[index][1];
	})
}

function populateRounds(pNoRounds) {
	// pNoRound is 0...n-1
	let wData = [];
	$w('#rptRounds').data = wData;
	wRounds = [];
	for (let i = 1; i <= pNoRounds; i++) {
		let wItem = { "_id": "R" + String(i).padStart(2,"0"), "num": String(i).padStart(1,"0")}
		wData.push(wItem);
		wRounds.push(false);	
	}
	$w('#rptRounds').data = wData;
}

function  updateRound(pRound) {
	// pRound is 1...n
	console.log("Update Round = ", pRound);
	wRounds[pRound - 1] = true;
	let wRoundKey = "R" + String(pRound).padStart(2,"0");
	$w('#rptRounds').forItems([wRoundKey], ($item, itemData, index) => {
		$item('#boxRound').style.backgroundColor = cYELLOW2;
	})
	let wRoundBracket = [];
	$w('#rptMatches').forEachItem( ($item, itemData, index) => {
		let wTempGame = [parseInt($item('#inpA').value,10), parseInt($item('#inpB').value,10)];
		wRoundBracket.push(wTempGame);
	})
	wNewBracket.splice(pRound - 1,1,wRoundBracket);
}

export function btnSave_click(event) {
	updateCompetitionDivisionBracket(wStageRec._id, wNewBracket)
	.then ( (res) => {
		console.log(res);
		showErrorMessage(2);
		$w('#boxHdr').show();
	})
}

export function btnNext_click(event) {
	let wRound = parseInt($w('#drpRound').value,10);
	updateRound(wRound);
	if (wRound >= wRounds.length) {
		$w('#btnNext').hide();
	} else  { 
		$w('#drpRound').value = String(wRound + 1);
		refreshMatches(wRound + 1) ;
	}
}

export function btnReset_click(event) {
	let wRound = parseInt($w('#drpRound').value,10);
	let wNoPlayers = wStageRec.noTeams;
	refreshMatches(wRound);
}

export function inpPlayer_change(event) {
	$w('#btnNext').show();
	$w('#btnSave').show();
	$w('#btnReset').show();
}

function showErrorMessage(pMsg) {
    let wMsg = ["Player already used",
        "Records updated OK ",
        "Please correct input errors",
        "The database record was not saved",
        "Cannot delete a Ladder game. Use Move instead",
        "Must be a manager to make or edit Competition booking"
    ];

    $w('#txtErrorMsg').text = wMsg[pMsg - 1];
    $w('#txtErrorMsg').show();
    setTimeout(() => {
    	$w('#txtErrorMsg').hide();
    }, 8000);
    return
}

export async function btnValidate_click(event) {
	let wNoRounds = wStageRec.noRounds;
	for (let i = 1; i <= wNoRounds; i++) {
		$w('#drpRound').value = String(i);
		populateMatches(i);
		let wData = $w('#rptMatches').data;
		console.log(" Round ", String(i));
		console.log(wData);0
		await sleep(5000);
	}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}