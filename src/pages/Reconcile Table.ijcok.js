// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow						from 'wix-window';
import { loadOpenSinglesTable }			from 'public/objects/openSingles.js';

import {getAllActiveDivisionBookings}	from 'public/objects/booking';
import {getClubCompBookingsForPerson}	from 'public/objects/booking';
import {updateGameScore}				from 'public/objects/booking';
import {formatDateString}				from 'public/fixtures';
import {getLstFullName}					from 'public/objects/member.js';
import { addGameScore } 				from 'public/objects/openSingles.js';
import { updatePlayerScore }			from 'public/objects/openSingles.js';
import { getOpenSinglesCompetitors} 	from 'public/objects/openSingles.js';
import { getLadderBookingsForPerson }	from 'public/objects/booking';

let wPlayed = "Played";

/** @TODO refactor this module to use div not division */
let wCache =[];
let wData = [];
let wComp = "";
let wTitle = "";
let wDivision = "";
let wDay = 0;
let wRole = "Admin";
let wId = "";
let wPlayerId = "";

let sWon = 0;
let sLoss = 0;
let sDraw = 0;
let sFor = 0;
let sAgainst = 0;

$w.onReady(async function () {

	if (wixWindow.formFactor === "Mobile") {
		wPlayed = "#";
	}
	wComp = "OP01";
	wTitle = "Open Pairs";
	wDivision = "Ladder A";
	$w('#txtTitle').text = wTitle + " " + wDivision;

	$w('#drpCompetition').value = wComp;
	$w('#drpLadder').value = "A";

	wData = await loadCompetitors(wComp, wDivision);
	$w('#rptGroupA').data = wData;

 	$w("#rptGroupA").onItemReady( ($item, itemData, index) => {
		loadRepeaterA($item, itemData, index);
	 });

 	$w("#rptGroupB").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterB($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
});

export async function drpCompetition_change(event) {
	let x = $w('#drpCompetition').selectedIndex;
	let options = $w('#drpCompetition').options;
	wComp = options[x].value;
	wTitle = options[x].label;
	$w('#txtTitle').text = wTitle + " " + wDivision;
	wData = await loadCompetitors(wComp, wDivision);
	$w('#rptGroupA').data = [];
	$w('#rptGroupA').data = wData;
}

export async function drpLadder_change(event) {
	wDivision = "Ladder " + event.target.value;	
	$w('#txtTitle').text = wTitle + " " + wDivision;

	wData = await loadCompetitors(wComp, wDivision);
	$w('#rptGroupA').data = [];
	$w('#rptGroupA').data = wData;
}

export async function loadCompetitors(pComp, pDivision) {
	$w('#imgWait').show();
	wCache = [];
	wData = await getOpenSinglesCompetitors(pComp, pDivision);
	// await buildCache(wData);
	$w('#imgWait').hide();
	return wData;
}

async function loadRepeaterA($item, itemData, index) {
		// item holds: title, picture, message, createdDate
	//if (index < 5){
	//	$item('#boxA').style.backgroundColor = "rgba(255,255,51,0.8)";
	//}
	let wPos = String(index+1);
	wPlayerId = itemData.competitor;
	let wLine = {"_id": wPos, "playerId": wPlayerId, "name": itemData.name, "played": 0, "won": 0, "lost": 0, "draw": 0, "pointsAgainst": 0, "pointsFor": 0};
	wCache.push(wLine);
	$item("#txtPos").text = wPos;
	$item("#txtPlayer").text = itemData.name;
	$item("#txtGamesPlayed").text = String(itemData.played);
	$item("#txtShotsAgainst").text = String(itemData.pointsAgainst);
	$item("#txtShotsFor").text = String(itemData.pointsFor);
	$item('#txtPD').text = String(itemData.pointsFor - itemData.pointsAgainst);
	$item('#txtPoints').text = String(itemData.pointsFor);
	$item('#txtWonCalc').text = String(0);
	$item('#txtDrawCalc').text = String(0);
	$item('#txtLostCalc').text = String(0);
	$item("#txtAgainstCalc").text = String(0);
	$item("#txtForCalc").text = String(0);
	$item('#txtPDCalc').text = String(0);
	$item('#txtPointsCalc').text = String(0);
	$item('#chkUpdate').value = false;
}


async function loadRepeaterB($item, itemData, index) {
	let wMember;
	if (itemData._id === "End"){
		$item('#txtDate').text = "";
		$item("#txtBPlayer").text = "";
		$item("#txtAgainst").text = String(itemData.pointsAgainst);
		$item("#txtFor").text = String(itemData.pointsFor);
		$item("#txtDraw").text = String(itemData.draw);
		$item("#txtWon").text = String(itemData.won);
		$item("#txtLoss").text = String(itemData.loss);
		return;
	}

	$item('#txtDate').text = formatDateString(itemData.dateRequired, "Short");
	if (itemData.playerAId === wPlayerId){
		wMember = wCache.find( (wMember => wMember.playerId === itemData.playerBId));
		$item("#txtBPlayer").text = wMember.name;
		$item("#txtAgainst").text = String(itemData.scoreB);
		$item("#txtFor").text = String(itemData.scoreA);
		sFor = sFor + itemData.scoreA
		sAgainst = sAgainst + itemData.scoreB
		if (itemData.scoreA === itemData.scoreB){
			$item("#txtLoss").text = "";
			$item("#txtDraw").text = String(1);
			sDraw = sDraw + 1;
			$item("#txtWon").text = "";
		} else if (itemData.scoreA > itemData.scoreB){
			$item("#txtDraw").text = "";
			$item("#txtWon").text = String(1);
			sWon = sWon + 1;
			$item("#txtLoss").text = "";
		} else {
			$item("#txtDraw").text = "";
			$item("#txtLoss").text = String(1);
			sLoss = sLoss + 1;
			$item("#txtWon").text = "";
		}
	} else {
		wMember = wCache.find( (wMember => wMember.playerId === itemData.playerAId));
		$item("#txtBPlayer").text = wMember.name;
		$item("#txtAgainst").text = String(itemData.scoreA);
		$item("#txtFor").text = String(itemData.scoreB);
		sFor = sFor + itemData.scoreB
		sAgainst = sAgainst + itemData.scoreA
		if (itemData.scoreA === itemData.scoreB){
			$item("#txtLoss").text = "";
			$item("#txtDraw").text = String(1);
			sDraw = sDraw + 1;
			$item("#txtWon").text = "";
		} else if (itemData.scoreA > itemData.scoreB){
			$item("#txtDraw").text = "";
			$item("#txtLoss").text = String(1);
			sLoss = sLoss + 1;
			$item("#txtWon").text = "";
		} else {
			$item("#txtDraw").text = "";
			$item("#txtWon").text = String(1);
			sWon = sWon + 1;
			$item("#txtLoss").text = "";
		}
	}
}

export async function btnStart_click(event) {
	$w('#imgWait').show();
	//	read all game records and store in cache
	//	read each repeater entry and update it from cache
	let wRes = await getAllActiveDivisionBookings(wComp, wDiv);
	for (let i = 0; i<wRes.length; i++) {
		let wRec = wRes[i];
		if (wRec.status === "P"){
			storeRecInCache(wRec);
		}
	}
	$w('#imgWait').hide();
	$w('#rptGroupA').forEachItem(async ($item, itemData, index) => {
		let wLine = wCache.find( (wLine => wLine.playerId === itemData.competitor));
		$item('#txtPlayedCalc').text = String(wLine.played);
		$item('#txtWonCalc').text = String(wLine.won);
		$item('#txtLostCalc').text = String(wLine.lost);
		$item('#txtDrawCalc').text = String(wLine.draw);
		$item('#txtForCalc').text = String(wLine.pointsFor);
		$item('#txtAgainstCalc').text = String(wLine.pointsAgainst);
		$item('#txtPDCalc').text = String(wLine.pointsFor - wLine.pointsAgainst);
		$item('#txtPoints').text = String(wLine.pointsFor);
	})
}

function storeRecInCache(pItem){
	let wPlayerAId = pItem.playerAId;
	let wPlayerBId = pItem.playerBId;
	let wScoreA = parseInt(pItem.scoreA,10);
	let wScoreB = parseInt(pItem.scoreB,10);
	// for player A
	let wA = wCache.find( (wA => wA.playerId === wPlayerAId ));
	let wB = wCache.find( (wB => wB.playerId === wPlayerBId ));
	if (!wA){ console.log(wPlayerAId); return};
	if (!wB){ console.log(wPlayerBId); console.log(wCache); return}
	wA.played = wA.played + 1;
	wA.pointsFor = wA.pointsFor + wScoreA;
	wA.pointsAgainst = wA.pointsAgainst + wScoreB;
	if (wScoreA === wScoreB){
		wA.draw = wA.draw + 1;
		wB.draw = wB.draw + 1;
	} else if (wScoreA > wScoreB){
		wA.won = wA.won + 1;
		wB.lost = wB.lost + 1;
	} else {
		wA.lost = wA.lost + 1;
		wB.won = wB.won + 1;
	}
	// for Player B
	wB.played = wB.played + 1;
	wB.pointsFor = wB.pointsFor + wScoreB;
	wB.pointsAgainst = wB.pointsAgainst + wScoreA;
}

export async function boxA_click(event) {
	$w('#rptGroupB').scrollTo();
	let $item = $w.at(event.context);
	let wPos = $item("#txtPos").text;
	let wLine = wCache.find( (wLine => wLine._id === wPos));
	wPlayerId = wLine.playerId;
	let wName = wLine.name;
	console.log(wName);
	let wGames = await getClubCompBookingsForPerson(wComp, wDivision,"P", wPlayerId);
	console.log(wGames);
	$w('#rptGroupB').data = [];
	sWon = sLoss = sDraw = sAgainst = sFor = 0;
	$w('#rptGroupB').data = wGames;
	let wCell = {"_id": "End", "won": sWon, "loss": sLoss, "draw": sDraw, "pointsAgainst": sAgainst, "pointsFor": sFor};
	wGames.push(wCell);
	$w('#rptGroupB').data = wGames;

}
