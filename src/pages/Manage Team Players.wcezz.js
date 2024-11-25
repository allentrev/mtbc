import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';

import _ from 'lodash';
//Example			gTeams = _.sortBy(wAllTeams, ['gender','teamKey']);
import { authentication } from 'wix-members-frontend';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } from 'public/objects/member';



import { convertNulls } from 'public/utility';

import { getTeamsByCaptain } from 'public/objects/team.js';
import { getTeamsByGender } from 'public/objects/team.js';
import { getTeamPlayer } from 'public/objects/team.js';
import { setRole } from 'public/objects/team.js';

//import { bulkSaveTeamPlayers }				from	'public/objects/team.js';
import { bulkSaveTeamPlayers } from 'backend/backTeam.jsw';
import { countMatchSelectedItems } from 'public/objects/team.js';
import { displayDayCaptain } from 'public/objects/team.js';
import { getDayCaptain } from 'public/objects/team.js';
import { insertDayCaptain } from 'public/objects/team.js';
import { updateDayCaptain } from 'public/objects/team.js';
import { deleteDayCaptain } from 'public/objects/team.js';
import { listTeamsForDayCaptain } from 'public/objects/team.js';

import { getName } from 'public/objects/team.js';
import { loadTeamDropbox } from 'public/objects/team.js';
import { loadTeamPlayerRepeaters } from 'public/objects/team.js';

import { findTeamByKey } from 'backend/backTeam.jsw';
import { bulkSaveTeamSquad } from 'public/objects/team.js';
import { bulkDeleteTeamSquad } from 'public/objects/team.js';
import { sendRequestAvailabilityEmail } from 'backend/email';
import { sendTeamSheet } from 'backend/email';
import { loadTeamPlayers } from 'public/objects/team.js';
import { loadTeamSquad } from 'public/objects/team.js';
import { loadTeamMatches } from 'public/objects/team.js';
import { getTeamPlayerStats } from 'public/objects/team.js';
import { getTeamSquadDetail } from 'public/objects/team.js';
import { getNumPlayersRequired } from 'public/objects/team.js';
import { updateTeamSquad } from 'public/objects/team.js';
import { updateTeamPlayers } from 'public/objects/team.js';
import { updateTeamMatches } from 'public/objects/team.js';

import { IsTeamPlayer } from 'public/objects/team.js';
import { getEvent } from 'public/objects/event.js';
import { refreshRptSquad } from 'public/objects/team.js';
import { refreshTeamPlayers } from 'public/objects/team.js';
import { getNumPlayersForTeam } from 'backend/backTeam.jsw';


import { parseStartDate } from 'public/fixtures';
import { findLstMember } from 'backend/backMember.jsw';
import { ROLES } from 'public/objects/member';

import { saveSquadChanges } from 'backend/backTeam.jsw';
import { savePlayerChanges } from 'backend/backTeam.jsw';
import { matchCompleted } from 'backend/backTeam.jsw';

import { gTeamPlayers, gRole } from 'public/objects/team.js';
import { gMatch } from 'public/objects/team.js';
import { EVENT_GAME_TYPE, USE_TYPE } from 'public/objects/event.js';


//let gRole = "";
//let gUser;
//let gGender = "M";
let gTeam;
//let gTeamPlayers;
//let loggedInMember.lstId;

let gMatchList = [];		// Used to provide input lists for the cstrpEmail
let gSquadList = [];
let gPlayerList = [];

const cRED = `rgb(227,171,157)`;
const cGREEN = `rgb(203,251,84)`;
const cAMBER = `rgb(247,223,141)`;

const DAILY_EMAIL_LIMIT = 90;
const DAILY_EMAIL_THRESHOLD = 70;

const shorten = (pIn) => pIn.substring(0, 6);

let loggedInMember;
let loggedInMemberRoles;
let gGender = "X";

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const gYear = new Date().getFullYear();
const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {
	try {
		let status;
		// for testing ------	------------------------------------------------------------------------
		//let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
		let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
		// let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
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
		// end of esting fudge------------------------------------------------------------------------------
		*/

		[status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

		if (isLoggedIn) {
			let wRoles = loggedInMemberRoles.toString();
			console.log("/page/maintainTeamPlayers onReady Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
		} else {
			console.log("/page/maintainTeamPlayers onReady Not signed in");
		}

		$w('#rgpGender').value = gGender;
		if (loggedInMember) {
			gGender = loggedInMember.gender;
			setRole(loggedInMemberRoles[0]);
			configureWindow();
		} else {
			// error route out
			$w('#cstrpSelect').collapse();
			closeExit(1);
		}

		$w('#rptSquad').onItemReady(($item, itemData, index) => {
			loadSquad($item, itemData, index);
		});

		$w('#rptMatches').onItemReady(($item, itemData, index) => {
			loadMatch($item, itemData, index);
		});

		$w('#rptPlayers').onItemReady(($item, itemData, index) => {
			loadPlayers($item, itemData, index);
		});

		$w('#rptSides').onItemReady(($item, itemData, index) => {
			loadSides($item, itemData, index);
		});

		$w('#rptSidesPlayers').onItemReady(($item, itemData, index) => {
			loadSidesPlayers($item, itemData, index);
		});
	}
	catch (err) {
		console.log("/page/maintainTeamPlayers onReady Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
});

async function configureWindow() {
	let wRes;
	$w('#cstrpSelect').expand();
	$w('#cstrpNotSignedOn').collapse();
	if (isRequiredRole([ROLES.MANAGER, ROLES.ADMIN], loggedInMemberRoles)) {
		let wTeams = await getTeamsByGender(gGender);
		loadTeamDropbox("P", wTeams);
	} else if (isRequiredRole([ROLES.CAPTAIN], loggedInMemberRoles)) {
		let wTeams = await getTeamsByCaptain(loggedInMember.lstId);
		loadTeamDropbox("P", wTeams);
	} else if (isRequiredRole([ROLES.PRESS, ROLES.COACH, ROLES.MEMBER, ROLES.DAY_CAPTAIN], loggedInMemberRoles)) {
		let wMyTeams = [];
		wMyTeams = await listTeamsForDayCaptain(loggedInMember.lstId);
		if (wMyTeams.length === 0) {
			$w('#cstrpSelect').collapse();
			closeExit(3);
		} else {
			gRole = ROLES.DAY_CAPTAIN;
			let wTeams = [];
			for (let wRec of wMyTeams) {
				// was let wTempTeam = await getLeagueTeamByTeamKey(wRec.teamKey);
				let wTempTeam = await findTeamByKey(wRec.teamKey);
				if (wTempTeam) { wTeams.push(wTempTeam) };
			}
			let wTeamsOfGender = wTeams.filter(item => item.gender === gGender);
			loadTeamDropbox("P", wTeamsOfGender);
		}
	} else {
		$w('#cstrpSelect').collapse();
		closeExit(3);
	}
	console.log("/page/maintainTeamPlayers configureWindow accessed by " + loggedInMember.lstId + " in role " + loggedInMemberRoles[0]);
}

//===================================================== LOAD REPEATERS ====================================================
//

function loadMatch($item, itemData, index) {
	if (index === 0) {
		$item('#txtMonth').text = "";
		$item('#txtDate').text = "Date";
		$item('#txtDay').text = "";
		$item('#txtSubject').text = "Sbject";
		$item('#txtHomeAway').text = "Venue";
		$item('#txtRinks').text = "Rinks";
		$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').expand();
		$item('#txtAvail').collapse();
		$item('#chkMatchItem').hide();
	} else {
		$item('#txtMonth').text = itemData.month;
		$item('#txtDate').text = itemData.date;
		$item('#txtDay').text = itemData.day;
		$item('#txtSubject').text = itemData.subject;
		$item('#txtHomeAway').text = itemData.venue;
		$item('#txtRinks').text = itemData.rink;
		$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').expand();
		$item('#txtAvail').collapse();
		$item('#txtNumRequired').text = String(itemData.numRequired);
		$item('#txtNumRequested').text = String(itemData.numRequest);
		$item('#txtNumAvailable').text = String(itemData.numAvail);
		$item('#chkMatchItem').checked = false;
	}
}

function loadSquad($item, itemData, index) {
	if (index === 0) {
		$item('#txtSquadPos').text = "#";
		$item('#txtSquadPlayer').text = "Player";
		$item('#txtSquadNumPlayed').text = "Played"
		$item('#chkSquadItem').hide();
		$item('#txtEmailSent').text = "Email Sent";
	} else {
		$item('#txtSquadPos').text = String(index);
		$item('#txtSquadPlayer').text = convertNulls(itemData.name);
		$item('#txtSquadNumPlayed').text = String(itemData.numPlayed);
		$item('#chkSquadItem').checked = false;
		$item('#chkSquadItem').show();
		$item('#txtEmailSent').text = (itemData.emailSent) ? "Yes" : "";
	}
}

function loadPlayers($item, itemData, index) {
	if (index === 0) {
		$item('#txtPlayersPos').text = "#";
		$item('#txtPlayersPlayer').text = "Player";
		$item('#txtPlayersAvail').text = "Available?"
		$item('#txtPlayersNumPlayed').text = "Played"
		$item('#chkPlayersItem').hide();
	} else {
		$item('#txtPlayersPos').text = String(index);
		$item('#txtPlayersPlayer').text = convertNulls(itemData.name);
		$item('#txtPlayersAvail').text = getAvailableState(itemData.status);
		$item('#txtPlayersNumPlayed').text = String(itemData.numPlayed);
		$item('#chkPlayersItem').checked = false;
		$item('#chkPlayersItem').show();
	}
}

function loadSidesPlayers($item, itemData, index) {
	$item('#txtSidesPos').text = String(index + 1);
	$item('#txtSidesPlayer').text = itemData.name;
	if (itemData.role === null) {
		$item('#boxSidesPlayer').style.backgroundColor = cGREEN;
	} else {
		$item('#boxSidesPlayer').style.backgroundColor = cRED;
	}
}

function loadSides($item, itemData, index) {
	let wGameType = gMatch.gameType;
	let wStr = String(itemData._id);
	if (wStr === "0") {
		$item('#txtSideName').text = "Reserves";
	} else {
		$item('#txtSideName').text = "Side " + String(index + 1);
	}
	let wTeam = itemData.team;
	switch (wGameType) {
		case EVENT_GAME_TYPE.SINGLES:
			$item('#btn1').label = getSidesData(wTeam[0], wStr);
			$item('#btn1').style.backgroundColor = getButtonColour(wTeam[0]);
			$item('#btn2').label = "";
			$item('#btn3').label = "";
			$item('#btn4').label = "";
			break;
		case EVENT_GAME_TYPE.DOUBLES:
		case EVENT_GAME_TYPE.PAIRS:
			$item('#btn1').label = getSidesData(wTeam[0], wStr);
			$item('#btn1').style.backgroundColor = getButtonColour(wTeam[0]);
			$item('#btn2').label = getSidesData(wTeam[1]);
			$item('#btn2').style.backgroundColor = getButtonColour(wTeam[1]);
			$item('#btn3').label = "";
			$item('#btn4').label = "";
			break;
		case EVENT_GAME_TYPE.TRIPLES:
			$item('#btn1').label = getSidesData(wTeam[0], wStr);
			$item('#btn1').style.backgroundColor = getButtonColour(wTeam[0]);
			$item('#btn2').label = getSidesData(wTeam[1], wStr);
			$item('#btn2').style.backgroundColor = getButtonColour(wTeam[1]);
			$item('#btn3').label = getSidesData(wTeam[2], wStr);
			$item('#btn3').style.backgroundColor = getButtonColour(wTeam[2]);
			$item('#btn4').label = "";
			break;
		case EVENT_GAME_TYPE.TYPE_X:
		case EVENT_GAME_TYPE.MIXED:
		case EVENT_GAME_TYPE.TYPE_R:
		case EVENT_GAME_TYPE.FOURS:
			$item('#btn1').label = getSidesData(wTeam[0], wStr);
			$item('#btn1').style.backgroundColor = getButtonColour(wTeam[0]);
			$item('#btn2').label = getSidesData(wTeam[1], wStr);
			$item('#btn2').style.backgroundColor = getButtonColour(wTeam[1]);
			$item('#btn3').label = getSidesData(wTeam[2], wStr);
			$item('#btn3').style.backgroundColor = getButtonColour(wTeam[2]);
			$item('#btn4').label = getSidesData(wTeam[3], wStr);
			$item('#btn4').style.backgroundColor = getButtonColour(wTeam[3]);
			break;
	}
}

//===================================================== SUPPORTING FUNCTIONS ====================================================

function getAvailableState(pStatus) {
	let wState = "";
	switch (pStatus) {
		case "N":
			wState = "Not available";
			break;
		case "A":
			wState = "Available";
			break;
		case "C":
			wState = "Confirmed";
			break;
		case "P":
			wState = "Played";
			break;
		default:
			wState = "Unknown";
			break;
	}
	return wState;
}

function getSidesData(pPlayer, pReserve) {
	let wName = pPlayer.player;
	let wText = pPlayer.pos;
	if (wText === "S") { wText = "Skip" };
	if (pReserve !== "0") {
		if (wText === "1") { wText = "Lead" };
	}
	if (wName) { wText = wName }
	return wText
}

function getButtonColour(pPlayer) {
	let wName = pPlayer.player;
	let wColour = cRED;
	//let wColour = `rgb(203,251,84)`;

	if (wName) { wColour = cGREEN }
	return wColour
}

export async function updateRepeatersForCaptain(pEventId, pPlayerId, pStatus) {

	let { wNumUnknown, wNumNotAvailable, wNumAvailable, wNumConfirmed } = getTeamPlayerStats(pEventId);
	$w('#rptMatches').forItems([pEventId], ($item) => {
		$item('#txtNumRequested').text = String(wNumUnknown + wNumNotAvailable + wNumAvailable + wNumConfirmed);
		$item('#txtNumAvailable').text = String(wNumAvailable + wNumConfirmed);
	})
	$w('#rptPlayers').forItems([pPlayerId], ($item) => {
		$item('#txtPlayersAvail').text = getAvailableState(pStatus);
	})
}
//===================================================== SELECT STRIP ===============================================
//

export async function rgpGender_change(event) {

	gGender = event.target.value;

	let wTeams = [];
	let wTeamsOfType = [];
	let wMyTeams = [];
	let wMyTeamsOfGender = [];
	switch (gRole) {
		case ROLES.CAPTAIN:
			wTeamsOfType = await getTeamsByGender(gGender);
			wTeams = wTeamsOfType.filter(item => item.managerId === loggedInMember.lstId);
			break;
		case ROLES.ADMIN:
		case ROLES.MANAGER:
			wTeams = await getTeamsByGender(gGender);
			break;
		case ROLES.DAY_CAPTAIN:
			wMyTeams = await listTeamsForDayCaptain(loggedInMember.lstId);
			if (wMyTeams.length > 0) {
				for (let wRec of wMyTeams) {
					// was let wTempTeam = await getLeagueTeamByTeamKey(wRec.teamKey);
					let wTempTeam = await findTeamByKey(wRec.teamKey);
					if (wTempTeam) { wTeamsOfType.push(wTempTeam) };
				}
			}
			wTeams = wTeamsOfType.filter(item => item.gender === gGender);
			break;
		default:
			break
	}

	loadTeamDropbox("P", wTeams);
}

export async function drpTeams_change(event) {

	let wTeamKey = event.target.value;
	let wSurname = null;
	let wFirstName = null;
	$w('#imgWait').show();
	$w('#txtTeamId').text = wTeamKey;
	$w('#lblSaveMsg').hide();
	$w('#lblDeleteMsg').hide();
	//let wTeam = await getLeagueTeam(wId);
	let wTeam = await findTeamByKey(wTeamKey);
	if (wTeam) {
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamPlayerRepeaters();
}

export async function btnChangeTeam_click(event) {

	$w('#cstrpMatches').collapse();
	closeStrips();
	$w('#boxTeamMember').collapse();
	$w('#boxdrpTeams').collapse();
	$w('#boxGeneral').expand();
	$w('#rgpGender').value = gGender;
	//await configureWindow();
}

export async function btnGo_click(event) {

	let wTeamKey = $w('#drpTeams').value;
	let wSurname = null;
	let wFirstName = null;

	$w('#imgWait').show();
	$w('#txtTeamId').text = wTeamKey;
	$w('#lblSaveMsg').hide();
	$w('#lblDeleteMsg').hide();
	//let wTeam = await getLeagueTeam(wId);
	let wTeam = await findTeamByKey(wTeamKey);
	if (wTeam) {
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamPlayerRepeaters();
}

//----------------------------------------------- SELECT SUPPORTING FUNCTIONS --------------------------------

function closeExit(pKey) {
	const msg = [
		"I'm sorry, but you must be signed on to access this information",
		"You have not yet been registered with a team. Please contact a team captain to ask to join that team.",
		"This facility is only to be used by Managers, Team Captains and a Day Captain",
		"There are no teams defined",
		"You have not been registered with any teams"
	]
	$w('#lblCloseMsg').text = msg[pKey - 1];
	$w('#cstrpNotSignedOn').expand();
	$w('#cstrpButtons').expand();
}
//===================================================== MATCHES STRIP ===============================================
//

export function chkMatchItem_change(event) {
	const wId = event.context.itemId;
	let wCount = countMatchSelectedItems();
	switch (gRole) {
		case ROLES.ADMIN:
		case ROLES.MANAGER:
		case ROLES.CAPTAIN:
		case ROLES.DAY_CAPTAIN:
			switch (wCount) {
				case 0:
					closeStrips();
					$w('#lblStep1').collapse();
					$w('#boxAvailability').collapse();
					$w('#boxMatchStatus').collapse();
					$w('#boxOtherCmds').collapse();
					$w('#boxErrorMsg').collapse();
					$w('#txtEventId').text = "";
					$w('#lblErrorMsg').text = "";
					break;
				case 1:
					$w('#lblStep1').expand();
					$w('#boxAvailability').expand();
					$w('#boxMatchStatus').expand();
					$w('#boxOtherCmds').expand();
					$w('#boxErrorMsg').collapse();
					$w('#btnAvailRqAll').expand();
					$w('#btnAvailRqSome').expand();
					$w('#btnAvailView').expand();
					$w('#btnAvailPrint').expand();
					$w('#btnAvailUpdate').collapse();
					$w('#txtEventId').text = getCheckedItemId();
					$w('#lblErrorMsg').text = "";
					break;
				default:
					$w('#lblStep1').expand();
					$w('#boxAvailability').expand();
					$w('#boxMatchStatus').collapse();
					$w('#boxOtherCmds').collapse();
					$w('#boxErrorMsg').collapse();
					$w('#btnAvailRqAll').expand();
					$w('#btnAvailRqSome').collapse();
					$w('#btnAvailView').collapse();
					$w('#btnAvailPrint').collapse();
					$w('#btnAvailUpdate').collapse();
					$w('#txtEventId').text = "";
					$w('#lblErrorMsg').text = "";
					break;
			}
			displayDayCaptain(wCount, gTeam);
			break;
		case ROLES.MEMBER:
			switch (wCount) {
				case 0:
					$w('#lblStep1').collapse();
					$w('#boxAvailability').collapse();
					$w('#boxMatchStatus').collapse();
					$w('#boxOtherCmds').collapse();
					$w('#boxErrorMsg').collapse();
					$w('#lblErrorMsg').text = "";
					$w('#txtEventId').text = "";
					break;
				case 1:
					$w('#lblStep1').expand();
					$w('#boxAvailability').expand();
					$w('#boxMatchStatus').collapse();
					$w('#boxOtherCmds').collapse();
					$w('#boxErrorMsg').collapse();
					$w('#btnAvailRqAll').collapse();
					$w('#btnAvailRqSome').collapse();
					$w('#btnAvailView').expand();
					$w('#btnAvailPrint').collapse();
					$w('#btnAvailUpdate').expand();
					$w('#txtEventId').text = getCheckedItemId();
					$w('#lblErrorMsg').text = "";
					break;
				default:
					$w('#lblStep1').collapse();
					$w('#boxMatchStatus').collapse();
					$w('#boxAvailability').collapse();
					$w('#boxOtherCmds').collapse();
					$w('#boxErrorMsg').expand();
					$w('#txtEventId').text = "";
					$w('#lblErrorMsg').text = "You may only select one match to work on";
					break;
			}
			displayDayCaptain(wCount, gTeam);
			break;
	}
}

export async function btnAvailRqAll_click(event) {
	gMatchList = [];
	gSquadList = [];
	const wMatchList = getSelectedMatches();
	if (wMatchList.length > 0) {
		let wSquad = $w('#rptSquad').data;
		if (wSquad.length > 1) {
			wSquad.shift();
			let wNoInSquad = wSquad.length;
			let wNoEmails = wMatchList.length * wNoInSquad;
			if (wNoEmails > DAILY_EMAIL_THRESHOLD) {
				showMatchError(1, 6)
			} else {
				$w('#lblEmailId').text = "AvailRq";
				$w('#lblEmailForce').text = "N";
				$w('#lblEmailHdr').text = `You are about to generate ${wNoEmails} requests`;
				gMatchList = wMatchList;
				gSquadList = wSquad;
				$w('#pBarEmail').targetValue = wNoEmails;
				$w('#cstrpEmail').expand();
				$w('#lblEmailHdr').scrollTo();
			}
		}
	}
}

export async function btnAvailRqSome_click(event) {
	await refreshMatchUpdate();
	$w('#cstrpSquad').expand();
	$w('#btnSquadUp').scrollTo();
	$w('#btnSquadPlayersDelete').collapse();
	$w('#boxSquadOther').expand();
}

export async function btnAvailView_click(event) {
	await refreshMatchUpdate();
	$w('#cstrpPlayers').expand();
	$w('#btnPlayersUp').scrollTo();
	$w('#boxPlayersAvailability').collapse();
	$w('#boxPlayersOther').collapse();
}

export async function btnAvailPrint_click(event) {
	await refreshMatchUpdate();

	let wEventId = $w('#txtEventId').text;

	let wMatches = $w('#rptMatches').data;
	let wMatch = wMatches.filter(item => item.eventId === wEventId);

	let wMatchTeamSquad = gTeamPlayers.filter(item => item.eventId === wEventId);
	let wPlayers = wMatchTeamSquad.filter(item => item.status === "A");
	let wList = [];
	for (let i = 0; i < 19; i++) {
		let wBL = [];
		let wLeft = wPlayers[i];
		let wRight = wPlayers[i + 19];
		if (wRight) {
			// case 1
			wBL = [String(i + 1), wPlayers[i].name, "", "", String(i + 20), wPlayers[i + 19].name, ""];
		} else if (wLeft) {
			//case 2
			wBL = [String(i + 1), wPlayers[i].name, "", "", String(i + 20), "", ""];
		} else {
			//case 3
			wBL = [String(i + 1), "", "", "", String(i + 20), "", ""];
		}
		wList.push(wBL);
	}

	let wGender = getGender(gTeam.gender);
	let wLeague = gTeam.league;
	let wTeam = gTeam.teamName;
	let wGameType = getGameType(gTeam.gameType);
	let wHomeAway = wMatch[0].venue;
	let wSubject = wMatch[0].subject;
	let wTime = wMatch[0].start;
	let wDate = wMatch[0].day + ", " + wMatch[0].date + " " + wMatch[0].month;
	let wNoMatches = gTeam.noMatches;
	let wCaptain = $w('#txtFullName').text;	// IS THIS ALWAYS TRUE???
	let wParams = {
		"gender": wGender, "league": wLeague, "team": wTeam, "gameType": wGameType, "homeAway": wHomeAway, "subject": wSubject, "time": wTime,
		"date": wDate, "noMatches": wNoMatches, "captain": wCaptain, "rows": wList
	};

	$w('#html1').postMessage(wParams);
}

export async function btnAvailUpdate_click(event) {
	await refreshMatchUpdate();
	// To get here the member must be logged on and in the team Squad.
	// steps:
	//	find TeamPlayer record for given event + member
	//	if it doesnt exist:
	//		creater if (condition) {
	// else
	//	update the record

	///// BIG NOTE FOR MANAGER ? CAPTAIN DONE ON PLAYERS STRIP

	let wData = $w('#rptMatches').data;
	let wEventId = $w('#txtEventId').text;	// ths is set by checking the select checkbox. Only i select allowed
	let wTeamPlayer = await getTeamPlayer(wEventId, loggedInMember.lstId);
	let wNewStatus = "A";
	if (wTeamPlayer) {
		let wOldStatus = wTeamPlayer.status;
		if (wOldStatus === "A") {
			wNewStatus = "N";
		}
		let wUpdatedTeamPlayer = wTeamPlayer;
		wUpdatedTeamPlayer.status = wNewStatus;
	}
	await updateTeamPlayerAvailability(wEventId, loggedInMember.lstId, wNewStatus);
	$w('#lblPlayersMsg').text = "Availability updated";
	$w('#lblPlayersMsg').show()
}

export async function btnOtherModifyList_click(event) {
	await refreshMatchUpdate();
}

export async function btnOtherTxTeamSheet_click(event) {
	gMatchList = [];
	gSquadList = [];
	$w('#imgMatchWait').show();
	await refreshMatchUpdate();
	let wMatchId = $w('#txtEventId').text;
	gMatch = await getEvent(wMatchId);

	await initialiseRptSidesPlayers();

	//	Build Players List
	let wPlayers = $w('#rptSidesPlayers').data;
	gSquadList = [];
	for (let wPlayer of wPlayers) {
		if (wPlayer.game !== null) {
			gSquadList.push(wPlayer);
		}
	}

	if (gSquadList.length > 1) {
		let wNoInSquad = gSquadList.length;
		let wNoEmails = wNoInSquad;
		$w('#lblEmailId').text = "TeamSheet";
		$w('#lblEmailForce').text = "N";
		$w('#lblEmailHdr').text = `You are about to generate ${wNoEmails} requests`;
		$w('#pBarEmail').targetValue = wNoEmails;
		$w('#cstrpEmail').expand();
		$w('#imgWait').hide();
		$w('#lblEmailHdr').scrollTo();
	}
}

export async function btnOtherPop_click(event) {
	await refreshMatchUpdate();
	let wMatchId = $w('#txtEventId').text;
	gMatch = await getEvent(wMatchId);
	initialiseRptSidesPlayers();
	initialiseRptSides();
	$w('#cstrpSides').expand();
	$w('#lblSidesTop').scrollTo();
}
//----------------------------------------------- MATCHES SUPPORTING FUNCTIONS --------------------------------

async function refreshMatchUpdate() {
	let wEventId = $w('#txtEventId').text;
	let wLastEventId = $w('#txtLastEventId').text;
	if (wEventId !== wLastEventId) {
		closeStrips();
		//change of event
		updateTeamSquad($w('#rptSquad').data, gTeamPlayers)
			.then(wTeamSquad => {
				refreshRptSquad(wTeamSquad);
				refreshTeamPlayers(wEventId);
				$w('#txtLastEventId').text = wEventId;
			})
	}
}

function closeStrips() {
	$w('#cstrpSquad').collapse();
	$w('#cstrpPlayers').collapse();
	$w('#cstrpSides').collapse();
	$w('#cstrpEmail').collapse();
	$w('#cstrpNotSignedOn').collapse();
	$w('#cstrpButtons').collapse();
}

function getCheckedItemId() {
	let wId = "";
	$w('#rptMatches').forEachItem(($item, itemData) => {
		if ($item('#chkMatchItem').checked) {
			wId = itemData._id;
		}
	})
	return wId;
}

function getSelectedMatches() {
	let wEventList = [];
	$w('#rptMatches').forEachItem(($item, itemData) => {
		if ($item('#chkMatchItem').checked) {
			wEventList.push(itemData.eventId);
		}
	})
	return wEventList;
}

function getGender(pGender) {
	let wGender = "";
	switch (pGender) {
		case "L":
			wGender = "Ladies'";
			break;
		case "M":
			wGender = "Men's";
			break;
		case "X":
			wGender = "Mixed";
			break;
	}
	return wGender;
}


function getGameType(pGameType) {
	let wGameType = "";
	switch (pGameType) {
		case EVENT_GAME_TYPE.SINGLES:
			wGameType = "Singles";
			break;
		case EVENT_GAME_TYPE.PAIRS:
		case EVENT_GAME_TYPE.DOUBLES:
			wGameType = "Doubles";
			break;
		case EVENT_GAME_TYPE.TRIPLES:
			wGameType = "Triples";
			break;
		case EVENT_GAME_TYPE.FOURS:
			wGameType = "Fours";
			break;
		case EVENT_GAME_TYPE.MIXED:
			wGameType = "Mixed";
			break;
		case EVENT_GAME_TYPE.TYPE_X:
			wGameType = "Unknown";
			break;
	}
	return wGameType;
}

function showMatchError(pErr, pSec) {
	let wMsg = ["This will break daily email limit. Please select fewer",
		"2"
	];

	$w('#lblErrorMsg').text = wMsg[pErr - 1];
	$w('#boxErrorMsg').expand();
	setTimeout(() => {
		$w('#boxErrorMsg').collapse();
	}, 1000 * pSec);
	return
}


export async function updateTeamPlayerAvailability(pEventId, pMemberId, pStatus) {
	let wTeamPlayer = await getTeamPlayer(pEventId, pMemberId);
	let wMember;
	if (wTeamPlayer) {
		wTeamPlayer.status = pStatus;
		let results = await bulkSaveTeamPlayers([wTeamPlayer]);
		if (results.errors.length > 0) {
			console.log("/page/maintainTeamPlayers UpdateTeamPlayerAvailability bulk save errors List:");
			results.errors.array.forEach(error => {
				console.log(error);
			});
		}
		wMember = gTeamPlayers.find(item => item.memberId === wTeamPlayer.playerId && item.eventId === pEventId);
		wMember.status = pStatus;
		await updateRepeatersForCaptain(pEventId, wMember._id, pStatus);
	} else {
		// this situation should not arise, but in here for completeness
		let wNewTeamPlayer = [{ "eventId": pEventId, "playerId": pMemberId, "teamKey": gTeam.teamKey, "game": null, "role": null, "status": pStatus }];
		let results = await bulkSaveTeamPlayers(wNewTeamPlayer);
		if (results.insertedItemIds.length > 0) {
			let wTeamPlayerId = results.insertedItemIds[0];
			let wTeamSquadDetail = await getTeamSquadDetail(gTeam._id, pMemberId);
			let wNewTeamPlayer2 = {
				_id: wTeamPlayerId,
				eventId: pEventId,
				teamId: gTeam._id,
				memberId: pMemberId,
				teamKey: gTeam.teamKey,
				name: wTeamSquadDetail.name,
				game: null,
				role: null,
				numPlayed: wTeamSquadDetail.numPlayed,
				status: "A"
			}
			gTeamPlayers.push(wNewTeamPlayer2);
			//refreshTeamPlayers(pEventId);
			await updateRepeatersForCaptain(pEventId, wTeamPlayerId, "A");
		}
		if (results.errors.length > 0) {
			console.log("/page/maintainTeamPlayers UpdateTeamPlayerAvailability bulk save errors List:");
			results.errors.array.forEach(error => {
				console.log(error);
			});
		}
	}
}
//===================================================== SQUAD STRIP ===============================================
//

export function btnSquadPlayersAdd_click(event) {

	const wGender = $w('#rgpGender').value;
	const wCount = $w('#rptSquad').data.length;

	let wParams = {
		"seeds": "N",
		"mix": wGender,
		"type": 1,
		"noTeams": 30
	}

	// {member} is {_id, firstName, surname, player, temNames}
	wixWindow.openLightbox("lbxSelectManyMembers", wParams)
		.then(wNewMembers => {
			if (wNewMembers) {
				if (wNewMembers.length > 0) {
					$w('#cstrpButtons').expand();
					$w('#btnSave').show();
					$w('#lblSaveMsg').hide();
					$w('#lblDeleteMsg').hide();
					$w('#rptSquad').expand();
					$w('#boxNoSquad').collapse();
					if (wCount === 0) {
						initialiseTable(wNewMembers, wCount);
					} else {
						appendTable(wNewMembers, wCount);
					}
				}
			}
		})
}

export async function btnSquadPlayersDelete_click(event) {
	let wSquad = $w('#rptSquad').data;
	let wToDelete = [];
	let wDeleteList = [];
	$w('#rptSquad').forEachItem(($item, itemData, index) => {
		if ($item('#chkSquadItem').checked) {
			let wDel = wSquad[index];
			wToDelete.unshift(wDel._id);
			wDeleteList.unshift(index);
		}
	});
	for (let wIndex of wDeleteList) {
		let wX = wSquad.splice(wIndex, 1);
	}
	let res = await bulkDeleteTeamSquad(wToDelete);
	let wText = "Delete complete: Deletes (" + String(res.removed) + ") Skipped (" + String(res.skipped) +
		") Errors (" + String(res.errors.length) + ")";
	$w('#lblDeleteMsg').text = wText;
	$w('#lblDeleteMsg').show();
	$w('#btnSquadPlayersDelete').collapse();

	$w('#rptSquad').data = [];
	$w('#rptSquad').data = wSquad;
}

export function btnSquadUp_click(event) {
	$w('#rptMatches').scrollTo();
}
export function chkSquadAll_change(event) {
	$w('#chkMatchItem').checked = !$w('#chkMatchItem').checked;
}

export function chkSquadItem_change(event) {
	let wCount = countSquadSelectedItems();
	switch (wCount) {
		case 0:
			$w('#boxSquadAvail').collapse();
			$w('#boxSquadOther').expand();
			$w('#boxSquadErrorMsg').collapse();
			$w('#btnSquadPlayersDelete').collapse();
			$w('#btnSetDayCaptain').collapse();
			$w('#btnSelectPlayer').collapse();
			break;
		case 1:
			$w('#boxSquadAvail').expand();
			$w('#boxSquadOther').expand();
			$w('#boxSquadErrorMsg').collapse();
			$w('#btnSquadPlayersDelete').expand();
			$w('#btnSelectPlayer').expand();
			if ($w('#btnDayCaptainClear').collapsed) {
				$w('#btnSetDayCaptain').expand();
			} else {
				$w('#btnSetDayCaptain').collapse();
			}
			break;
		default:
			$w('#boxSquadAvail').expand();
			$w('#boxSquadOther').expand();
			$w('#boxSquadErrorMsg').collapse();
			$w('#btnSquadPlayersDelete').expand();
			$w('#btnSelectPlayer').expand();
			$w('#btnSetDayCaptain').collapse();
			break;
	}
}

export async function btnSquadAvailRqtAvail_click(event) {

	let wEventId = $w('#txtEventId').text;
	gMatchList = [wEventId];
	gSquadList = [];
	$w('#rptSquad').forEachItem(($item, itemData, index) => {
		if ($item('#chkSquadItem').checked) {
			gSquadList.push(itemData);
		}
	});
	let wNoInSquad = gSquadList.length;
	if (wNoInSquad === 0) {
		console.log("/page/maintainTeamPlayers btnSquadAvailRqtAvail No squad member selected");
	} else {
		let wNoEmails = gMatchList.length * wNoInSquad;
		if (wNoEmails > DAILY_EMAIL_THRESHOLD) {
			showSquadError(1, 6)
		} else {
			$w('#lblEmailId').text = "AvailRq";
			$w('#lblEmailForce').text = "Y";
			$w('#lblEmailHdr').text = `You are about to generate ${wNoEmails} requests`;
			$w('#pBarEmail').targetValue = wNoEmails;
			$w('#cstrpEmail').expand();
			$w('#lblEmailHdr').scrollTo();
		}
	}
}

export async function btnDayCaptainClear_click(event) {
	let wEventId = $w('#txtEventId').text;
	let wRec = await getDayCaptain(wEventId);
	let res = await deleteDayCaptain(wRec._id);
	displayDayCaptain(1, gTeam);
	$w('#btnDayCaptainClear').collapse();
}

export async function btnSetDayCaptain_click(event) {
	let wEventId = $w('#txtEventId').text;
	gSquadList = [];
	$w('#rptSquad').forEachItem(($item, itemData, index) => {
		if ($item('#chkSquadItem').checked) {
			gSquadList.push(itemData);
		}
	});
	let wNoInSquad = gSquadList.length;
	if (wNoInSquad === 0) {
		console.log("/page/maintainTeamPlayers btnSetDayCaptain No squad member selected");
	} else if (wNoInSquad > 1) {
		console.log("/page/maintainTeamPlayers btnSetDayCaptain Too many selected");
	} else {
		let wMember = gSquadList[0];
		let wRec = {
			"eventId": wEventId,
			"memberId": wMember.memberId,
			"teamKey": wMember.teamKey,
			"name": wMember.name,
			"email": wMember.emailAddress,
			"mobile": wMember.mobilePhone,
			"phone": wMember.homePhone
		}
		let wDayCaptainId = await insertDayCaptain(wRec);
		if (wDayCaptainId) {
			console.log("/page/maintainTeamPlayers btnSetDayCaptain Created day captain ", wDayCaptainId, " for event ", wEventId);
			displayDayCaptain(1, gTeam);
			$w('#btnDayCaptainClear').expand();
		} else {
			console.log("/page/maintainTeamPlayers btnSetDayCaptain Failed to Create day captain for event ", wEventId);
		}
	}
}

export function btnSelectPlayer_click(event) {
	let wEventId = $w('#txtEventId').text;
	let wSquadList = [];
	$w('#rptSquad').forEachItem(($item, itemData, index) => {
		let wEmailSent = $item('#txtEmailSent').text;
		if ($item('#chkSquadItem').checked && wEmailSent !== "Yes") {
			wSquadList.push(itemData);
		}
	});
	let wNoInSquad = wSquadList.length;
	if (wNoInSquad === 0) {
		console.log("/page/maintainTeamPlayers btnSelectPlayer No squad member selected");
	} else {
		const wCount = $w('#rptPlayers').data.length;
		if (wCount === 0) {
			initialiseTable(wSquadList, wCount);
		} else {
			appendTable(wSquadList, wCount);
		}
		saveSquadChanges(gTeam.teamKey, $w('#rptSquad').data)
	}
}


export function chkAll_click(event) {
	$w('#chkSquadItem').checked = $w('#chkAll').checked;
}
//-----------------------------------------------SQUAD SUPPORTING FUNCTIONS --------------------------------

function countSquadSelectedItems() {
	let count = 0;
	$w('#rptSquad').forEachItem(($item, itemData, index) => {
		if ($item('#chkSquadItem').checked) { count++ }
	})
	return count;
}


export function initialiseTable(pNewMembers, pX) {
	const first = { "_id": gTeam.teamKey + "0", "name": "" };
	let wPlayers = pNewMembers.map((item, index) => {
		return {
			_id: gTeam.teamKey + String(index + 1),
			teamId: gTeam._id,
			memberId: item._id,
			teamKey: gTeam.teamKey,
			name: item.player,
			surname: item.surname,				//@@
			firstName: item.firstName,			//@@
			numPlayed: 0,
			comPref: item.comPref,
			emailAddress: item.email,
			mobilePhone: item.mobilePhone,
			homePhone: item.homePhone,
			emailSent: false
		}
	})
	//let wSortedPlayers = _.sortBy(wPlayers, ['name']);	// ['surname','firstName']
	let wSortedPlayers = _.sortBy(wPlayers, ['surname', 'firstName']);	// ['surname','firstName']
	wSortedPlayers.unshift(first);
	$w('#rptSquad').data = wSortedPlayers;
}

export function appendTable(pNewMembers, pX) {
	let wCurrentSquad = $w('#rptSquad').data;
	let count = wCurrentSquad.length;
	let wPlayers = pNewMembers.map((item, index) => {
		return {
			_id: gTeam.teamKey + String(count + index + 1),
			teamId: gTeam._id,
			memberId: item._id,
			teamKey: gTeam.teamKey,
			name: item.player,
			surname: item.surname,				//@@
			firstName: item.firstName,			//@@
			numPlayed: 0,
			comPref: item.comPref,
			emailAddress: item.email,
			mobilePhone: item.mobilePhone,
			homePhone: item.homePhone,
			emailSent: false
		}
	})

	let first = wCurrentSquad.shift();
	let wNewSquad = wCurrentSquad.concat(wPlayers);
	//let wSortedPlayers = _.sortBy(wNewSquad, ['name']);
	let wSortedPlayers = _.sortBy(wNewSquad, ['surname', 'firstName']);
	wSortedPlayers.unshift(first);
	$w('#rptSquad').data = wSortedPlayers; //not refresh, cos size of table can go up and down
}

function showSquadError(pErr, pSec) {
	let wMsg = ["This will break daily email limit. Please select fewer",
		"2"
	];

	$w('#lblSquadErrorMsg').text = wMsg[pErr - 1];
	$w('#boxSquadErrorMsg').expand();
	setTimeout(() => {
		$w('#boxSquadErrorMsg').collapse();
	}, 1000 * pSec);
	return
}

//===================================================== TEAMPLAYER STRIP ===============================================
//

export function chkPlayersItem_change(event) {
	let wCount = countSelectedItems($w('#rptPlayers'), '#chkPlayersItem');
	switch (wCount) {
		case 0:
			$w('#boxPlayersAvailability').collapse();
			$w('#boxPlayersOther').collapse();
			break;
		case 1:
			//$w('#btnSquadPlayersDelete').expand();
			$w('#boxPlayersAvailability').expand();
			$w('#boxPlayersOther').collapse();
			break;
		default:
			//$w('#btnSquadPlayersDelete').expand();
			$w('#boxPlayersAvailability').expand();
			$w('#boxPlayersOther').collapse();
			break;
	}
}

export function btnPlayersUp_click(event) {
	$w('#rptMatches').scrollTo();
}

export async function btnPlayersAvailUpdate_click(event) {

	let wPlayerList = [];
	let wEventId = $w('#txtEventId').text;

	$w('#rptPlayers').forEachItem(($item, itemData, index) => {
		if ($item('#chkPlayersItem').checked) {
			wPlayerList.push(itemData);
		}
	});
	let wNoInList = wPlayerList.length;
	if (wNoInList === 0) {
		console.log("/page/maintainTeamPlayers btnPlayersAvailUpdate No player selected");
	} else {
		for (let wMember of wPlayerList) {
			let wNewStatus = "A";
			let wOldStatus = wMember.status;
			if (wOldStatus === "A") {
				wNewStatus = "N";
			}
			await updateTeamPlayerAvailability(wEventId, wMember.memberId, wNewStatus);
		}
	}
}

export async function btnPlayersPlayersAvailRqt_click(event) {

	let wEventId = $w('#txtEventId').text;
	gMatchList = [wEventId];
	gSquadList = [];
	$w('#rptPlayers').forEachItem(($item, itemData, index) => {
		if ($item('#chkPlayersItem').checked) {
			if (itemData.status !== "A" && itemData.status !== "N") {
				let wRec = {
					"_id": "",
					"teamId": "",
					"memberId": itemData.memberId,
					"teamKey": itemData.teamKey,
					"name": itemData.name,
					"numPlayed": itemData.numPlayed,
					"emailSent": false,
					"comPref": "",
					"emailAddress": "",
					"mobilePhone": "",
					"homePhone": ""
				}
				gSquadList.push(wRec);
			}
		}
	});

	for (let wEntry of gSquadList) {	//got to do this outside of forEach loop above cos need to use await
		let wSquadMember = await getTeamSquadDetail(gTeam._id, wEntry.memberId);
		if (wSquadMember) {
			wEntry._id = wSquadMember._id;
			wEntry.teamId = wSquadMember.teamId;
			wEntry.comPref = wSquadMember.comPref;
			wEntry.emailAddress = wSquadMember.emailAddress;
			wEntry.mobilePhone = wSquadMember.mobilePhone;
			wEntry.homePhone = wSquadMember.homePhone;
		} else {
			console.log("/page/maintainTeamPlayers btnPlayersPlayersAvailRqt Team Squad record not found for = ", gTeam._id, wEntry.memberId);
		}
	}
	let wNoInSquad = gSquadList.length;
	if (wNoInSquad === 0) {
		console.log("/page/maintainTeamPlayers btnPlayersPlayersAvailRqtc  No player selected");
	} else {
		let wNoEmails = gMatchList.length * wNoInSquad;
		$w('#lblEmailHdr').text = `You are about to generate ${wNoEmails} requests`;
		$w('#pBarEmail').targetValue = wNoEmails;
		$w('#cstrpEmail').expand();
		$w('#lblEmailHdr').scrollTo();
	}
}


//-----------------------------------------------TEAMPLAYER SUPPORTING FUNCTIONS --------------------------------
//

function countSelectedItems(pRptr, pItem) {
	let count = 0;
	pRptr.forEachItem(($item, itemData, index) => {
		if ($item(pItem).checked) { count++ }
	})
	return count;
}


//===================================================== SIDES STRIP ===============================================
//

/* 
//	This handles click events arising from rptSidesPlayers containers. 
*/
export function cntSidesPlayers_click(event) {
	let wId = event.context.itemId;
	let wSidesPlayers = $w('#rptSidesPlayers').data;
	$w('#lblSidesPlayerId').text = "";
	$w('#lblSidesPlayerId').hide();
	let wPlayer = {};
	$w('#rptSidesPlayers').forItems([wId], ($item, itemData, index) => {
		wPlayer = itemData;
	})
	if (wPlayer.game === null || wPlayer.game === undefined) {
		$w('#lblSidesPlayerId').hide();
		$w('#lblSidesPlayerId').text = wPlayer._id;
		$w('#inpSelectedPlayer').value = wPlayer.name;
	} else {
		$w('#lblSidesPlayerId').show();
		$w('#lblSidesPlayerId').text = "Player already selected for a side";
		$w('#inpSelectedPlayer').value = "";
	}
}

/* 
//	This handles click events arising from rptSides buttons. 
*/
export function btnSide_click(event) {

	let wX = event.target.id;
	let wPlace = wX.slice(-1);
	let wSide = event.context.itemId;
	let $item = $w.at(event.context);
	let wColour = $item(`#${wX}`).style.backgroundColor;
	let wA = $w('#rptSides').data;
	$w('#btnSave').collapse();
	$w('#btnSaveSides').expand();
	$w('#cstrpButtons').expand();
	if (wColour === cRED) {
		processSelection(wSide, wPlace);
	} else {
		processDeSelection(wSide, wPlace);
	}
}

//-----------------------------------------------SIDES SUPPORTING FUNCTIONS --------------------------------

function configureRptSides() {

	let wGameType = gMatch.gameType;

	switch (wGameType) {
		case EVENT_GAME_TYPE.SINGLES:
			$w('#btn2').collapse();
			$w('#btn3').collapse();
			$w('#btn4').collapse();
			break;
		case EVENT_GAME_TYPE.PAIRS:
		case EVENT_GAME_TYPE.DOUBLES:
			$w('#btn2').expand();
			$w('#btn3').collapse();
			$w('#btn4').collapse();
			break;
		case EVENT_GAME_TYPE.TRIPLES:
			$w('#btn2').expand();
			$w('#btn3').expand();
			$w('#btn4').collapse();
			break;
		case EVENT_GAME_TYPE.TYPE_X:
		case EVENT_GAME_TYPE.TYPE_R:
		case EVENT_GAME_TYPE.MIXED:
		case EVENT_GAME_TYPE.FOURS:
			$w('#btn2').expand();
			$w('#btn3').expand();
			$w('#btn4').expand();
			break;
	}
}


function initialiseRptSidesPlayers() {

	let wEventId = $w('#txtEventId').text;
	let wMatchTeamSquad = gTeamPlayers.filter(item => item.eventId === wEventId);
	let wPlayers = wMatchTeamSquad.filter(item => ["A", "C", "P"].includes(item.status));
	if (wPlayers.length > 0) {
		let wSortedPlayers = _.sortBy(wPlayers, ['surname', 'firstName']);
		$w('#rptSidesPlayers').data = wSortedPlayers;
		$w('#lblSidesPlayerId').text = "";
		$w('#inpSelectedPlayer').value = "";
		$w('#icbtnLast').hide();
		$w('#icbtnNext').show();
		configureRptSides();
	} else {
		console.log("/page/MaintainTeamPlayers initialiseRptSidesPlayers No gTeamPlayers found");
	}
}

async function initialiseRptSides() {
	//	Now display modified sides repeater
	let wNoPerTeam = await getNumPlayersForTeam(gMatch);
	//console.log("PerTeam = ", wNoPerTeam, "No rinks = ", gMatch.rinks);

	let wSides = constructSidesArray(wNoPerTeam, gMatch.rinks);
	$w('#rptSides').data = wSides;
}

function constructSidesArray(pNoPerTeam, pNoRinks) {
	let wTeamPlayers = [];
	let wNoRinks = parseInt(pNoRinks, 10);
	let wNoPerTeam = parseInt(pNoPerTeam, 10);
	let wSides = [];
	//for (let i = 0; i < wNoMatches + 1; i++){ 
	for (let i = 0; i < wNoRinks + 1; i++) {
		let wTeam = [];
		let wK = String(i + 1);
		let wReserveRec = false;
		if (i === wNoRinks) {
			wK = "0";
			wReserveRec = true;
		}
		for (let j = 0; j < wNoPerTeam; j++) {
			let wRole = "";
			if (wReserveRec) {
				wRole = String(j + 1);
			} else {
				wRole = (j === wNoPerTeam - 1) ? "S" : String(j + 1);
			}
			let wPlayer = {
				"_id": null,
				"playerId": null,
				"pos": wRole,
				"player": "",
				"status": "A"
			}
			wTeam.push(wPlayer);
		}
		if (!wReserveRec) {
			if (wNoPerTeam > 1) {
				let wSkip = wTeam.pop();
				wTeam.unshift(wSkip);
			}
		}
		let wSideEntry = {
			"_id": wK,
			"eventId": null,
			"teamKey": null,
			"game": null,
			"team": wTeam
		}
		wSides.push(wSideEntry);
	}
	//console.log("Sides, gTeamplayerss, allocations, selectedplayers, otherplayers");
	//console.log(wSides);
	//console.log(gTeamPlayers);
	// Now, update wSides with appropriate entries from gTeamPlayers
	let wAllAllocations = gTeamPlayers.filter(item => item.game !== null);
	//console.log(wAllAllocations);
	let wSelectedPlayers = wAllAllocations.filter(item => item.game !== 0);	//players
	//console.log(wSelectedPlayers);
	let wOtherPlayers = wAllAllocations.filter(item => item.game === 0);		//reserves etc
	if (wSelectedPlayers) {
		for (let wPlayer of wSelectedPlayers) {
			let wGame = String(wPlayer.game);
			let wRole = wPlayer.role;
			let wGameRec = wSides.filter(item => item._id === wGame)
			if (wGameRec.length > 0) {
				let wGameTeam = wGameRec[0].team;
				wGameRec[0].eventId = wPlayer.eventId;
				wGameRec[0].teamKey = wPlayer.teamKey;
				wGameRec[0].game = wPlayer.game;
				let wGameTeamPlace = wGameTeam.filter(item => item.pos === wRole);
				if (wGameTeamPlace) {
					wGameTeamPlace[0]._id = wPlayer._id;
					wGameTeamPlace[0].playerId = wPlayer.memberId;
					wGameTeamPlace[0].player = wPlayer.name;
					wGameTeamPlace[0].status = "A";
				}
			}
		}
	} else {
		console.log("/page/MaintainTeamPlayers  constructSidesArray No selections found");
	}
	//	Display Reserves, etc
	if (wOtherPlayers) {
		for (let wPlayer of wOtherPlayers) {
			let wGame = 0;
			let wRole = wPlayer.role;
			let wGameRec = wSides.filter(item => item._id === String(wGame))
			if (wGameRec.length > 0) {
				let wGameTeam = wGameRec[0].team;
				wGameRec[0].eventId = wPlayer.eventId;
				wGameRec[0].teamKey = wPlayer.teamKey;
				wGameRec[0].game = wPlayer.game;
				let wPlace = wRole.substring(1);
				let wGameTeamPlace = wGameTeam.filter(item => item.pos === wPlace);
				if (wGameTeamPlace) {
					wGameTeamPlace[0]._id = wPlayer._id;
					wGameTeamPlace[0].playerId = wPlayer.memberId;
					wGameTeamPlace[0].player = wPlayer.name;
					wGameTeamPlace[0].status = "A";
				}
			}
		}
	} else {
		console.log("/page/MaintainTeamPlayers  constructSidesAarray No selections found");
	}
	return wSides;
}
/*
Take the contents of inpSelectedPlayer
update the team record
refresh the Sides repeater
disable the SIdePlayers entry
*/
function processSelection(pSide, pPlace) {
	//console.log("Process selection side place ", pSide, pPlace);		
	let wId = $w('#lblSidesPlayerId').text;	//id of record in rptSidesPlayer
	if (wId === "") {
		$w('#lblSidesPlayerId').text = "You need to select a player first";
		$w('#lblSidesPlayerId').show();
		return false;
	}

	let nPlace = parseInt(pPlace, 10) - 1;

	let wRptSidesPlayers = $w('#rptSidesPlayers').data;
	let wPlayers = wRptSidesPlayers.filter(item => item._id === wId)
	let wPlayer = wPlayers[0];
	if (wPlayer.eventId === undefined) {
		console.log("/page/MaintainTeamPlayers processSelection Cant find side player ", wId);
		return false;
	}

	let wRptSides = $w('#rptSides').data;
	let wSides = wRptSides.filter(item => item._id === pSide);
	let wSide = wSides[0];
	if (wSide.eventId === undefined) {
		console.log("/page/MaintainTeamPlayers processSelection Cant find side ", pSide);
		return false;
	}

	// Update Side data
	// top level 
	wSide.eventId = wPlayer.eventId;
	wSide.teamKey = wPlayer.teamKey;
	wSide.game = parseInt(pSide, 10);
	//	team level
	let wSidePlayer = wSide.team[nPlace];
	wSidePlayer._id = wPlayer._id;				//this is the id of the gTeamPlayers record
	wSidePlayer.playerId = wPlayer.memberId;
	wSidePlayer.player = wPlayer.name;
	wSidePlayer.surname = wPlayer.surname;			//@@
	wSidePlayer.firstName = wPlayer.firstName;		//@@
	//	Update wPlayer in wSidesPlayers
	wPlayer.game = parseInt(pSide, 10);
	if (pSide === "0") {
		//process a reserve or other place
		wPlayer.role = "R" + String(nPlace + 1);
	} else {
		//process a player place
		wPlayer.role = (nPlace === 0) ? "S" : String(nPlace);
	}
	let wSortedPlayers = _.sortBy(wRptSidesPlayers, ['surname', 'firstName']);
	$w('#rptSidesPlayers').data = wSortedPlayers;

	//	Update repeater displays
	let wX = "btn" + String(nPlace + 1);
	$w('#rptSides').data = wRptSides;
	$w('#rptSides').forItems([pSide], ($item) => {
		$item(`#${wX}`).label = wPlayer.name;
		$item(`#${wX}`).style.backgroundColor = cGREEN;
	})
	$w('#rptSidesPlayers').forItems([wId], ($item) => {
		$item('#boxSidesPlayer').style.backgroundColor = cRED;
	})
	$w('#lblSidesPlayerId').text = "";
	$w('#inpSelectedPlayer').value = "";
}

function processDeSelection(pSide, pPlace) {							// 0, 1 for reserve top

	const nPlace = parseInt(pPlace, 10) - 1;

	let wRptSides = $w('#rptSides').data;

	let wSides = wRptSides.filter(item => item._id === pSide);
	let wSide = wSides[0];

	let wSidePlayer = wSide.team[nPlace];
	let wId = wSidePlayer._id;

	let wRptSidesPlayers = $w('#rptSidesPlayers').data;
	let wPlayers = wRptSidesPlayers.filter(item => item._id === wId)
	let wPlayer = wPlayers[0];

	// Update wPlayer of wSidesPlayers
	wPlayer.game = null;
	wPlayer.role = null;
	$w('#rptSidesPlayers').data = wRptSidesPlayers;

	// Update SideData record
	wSide.eventId = wPlayer.eventId;
	wSide.teamKey = wPlayer.teamKey;
	wSide.game = parseInt(pSide, 10);

	// Update SidePlayer record
	wSidePlayer._id = null;
	wSidePlayer.playerId = null;
	wSidePlayer.player = "";
	wSidePlayer.surname = "";			//@@
	wSidePlayer.firstName = "";		//@@

	//	Update Sides display
	let wX = "btn" + String(nPlace + 1);
	$w('#rptSides').forItems([pSide], ($item) => {
		$item(`#${wX}`).style.backgroundColor = cRED;
		if (nPlace === 0) {
			if ($item('#txtSideName').text === "Reserves") {
				$item(`#${wX}`).label = "1";
			} else {
				$item(`#${wX}`).label = "Skip";
			}
		} else {
			$item(`#${wX}`).label = String(nPlace);
		}
	})
	$w('#rptSidesPlayers').forItems([wId], ($item) => {
		$item('#boxSidesPlayer').style.backgroundColor = cGREEN;
	})
	$w('#lblSidesPlayerId').text = "";
	$w('#inpSelectedPlayer').value = "";
}
//===================================================== EMAIL STRIP ===============================================
//

export async function btnEmailProceed_click(event) {

	let wId = $w('#lblEmailId').text;
	let wNoEmails = parseInt($w('#lblEmailHdr').text, 10);
	switch (wId) {
		case "AvailRq":
			if (wNoEmails > DAILY_EMAIL_LIMIT) {
				showEmailError(1, 6)
			} else {
				await sendAvailRq();
			}
			break;
		case "TeamSheet":
			await processTeamSheet();
			break;
	}
	$w('#cstrpEmail').collapse();
	$w('#rptMatches').scrollTo();
	$w('#lblEmailForce').text = "N";
}

export function btnEmailCancel_click(event) {
	$w('#cstrpEmail').collapse();
	$w('#rptMatches').scrollTo();
}
//-----------------------------------------------EMAIL SUPPORTING FUNCTIONS --------------------------------
async function sendAvailRq() {

	//const shorten = (pIn) => pIn.substring(0,6);

	let wToDB = [];
	let wToGL = [];
	let wToEmail = [];
	let wCount = 0;

	let wNotes = null;
	let wS = $w('#txtEmailNotes').value;
	let wForce = ($w('#lblEmailForce').text === "Y") ? true : false;

	wS = wS.trim();
	wNotes = (wS.length === 0) ? null : wS;

	for (let wMatchId of gMatchList) {
		let wMatch = await getEvent(wMatchId);
		let wDates = parseStartDate(wMatch.startDate); //{year, numMonth, date. hour. minute, strMonth. day, cardinal,
		//												 time, shortDate, longDate
		let wHomeAway = (wMatch.homeAway === "H") ? " home " : " away ";
		let wPlayDate = {
			strMonth: wDates.strMonth,
			date: wDates.date,
			day: wDates.day,
			start: wDates.time
		}
		let wSubject = wMatch.subject;
		let wLeague = gTeam.league;
		let wEmail = "";
		for (let wSquadPlayer of gSquadList) {
			wEmail = resolveEmail(wSquadPlayer.emailAddress);
			let wTPRec = IsTeamPlayer(wMatchId, wSquadPlayer.memberId);
			if (/* email has been sent */ wTPRec) {
				if (/* player has replied to email*/ wTPRec.status !== "U" && !wForce) {
					//skip to next squade member
					console.log("/page/MaintainTeamPlayers sendAvailRqt wSquadPlayer.memberId" + " is already a Team Player for event " + wMatchId);
				} else {
					// re-send email for those who have not responded
					let wNewEmailTeamPlayer = {
						"eventId": wMatchId, "playerId": wSquadPlayer.memberId, "teamKey": wSquadPlayer.teamKey,
						"name": wSquadPlayer.name, "date": wPlayDate, "time": wDates.time, "to": wEmail,
						"homeAway": wHomeAway, "subject": wSubject, "league": wLeague
					};
					wToEmail.unshift(wNewEmailTeamPlayer);
				}
			} else /* no email has yet been sent */ {
				//	send email, create DB record, update gTeamPlayers, update all repeaters
				let wNewEmailTeamPlayer = {
					"eventId": wMatchId, "playerId": wSquadPlayer.memberId, "teamKey": wSquadPlayer.teamKey,
					"name": wSquadPlayer.name, "date": wPlayDate, "time": wDates.time, "to": wEmail,
					"homeAway": wHomeAway, "subject": wSubject, "league": wLeague
				};
				wToEmail.unshift(wNewEmailTeamPlayer);
				let wNewDBTeamPlayer = {
					"eventId": wMatchId, "playerId": wSquadPlayer.memberId, "teamKey": wSquadPlayer.teamKey,
					"game": null, "role": null, "status": "U"
				};
				let wNewGLTeamPlayer = {
					"_id": null, "eventId": wMatchId, "memberId": wSquadPlayer.memberId, "teamKey": wSquadPlayer.teamKey,
					"game": null, "role": null, "status": "U", "teamId": gTeam._id,
					"name": wSquadPlayer.name, "numPlayed": wSquadPlayer.numPlayed
				};
				wToDB.unshift(wNewDBTeamPlayer);
				wToGL.unshift(wNewGLTeamPlayer);
			}
		}
	}
	//console.log("After prep, toEmail, toDB, toGL");
	//console.log(wToEmail);
	//console.log(wToDB);
	//console.log(wToGL);
	$w('#pBarEmail').targetValue = wToEmail.length;
	console.log("/page/MaintainTeamPlayers sendAvailRq Squadlist length = ", gSquadList.length, "email length = ", wToEmail.length);
	let wManagerName = "";
	let wManagerType = "T";

	if (gTeam.dayCaptainName) {
		wManagerName = gTeam.dayCaptainName;
		wManagerType = "D";
	} else {
		wManagerName = gTeam.managerName;
		wManagerType = "T";
	}
	for (let wMember of wToEmail) {

		let toEmail = {};
		$w('#pBarEmail').value = wCount;

		toEmail.shortEventId = shorten(wMember.eventId);
		toEmail.shortMemberId = shorten(wMember.playerId);
		toEmail.teamKey = wMember.teamKey;

		let wStartDate = { "day": wMember.date.day, "date": wMember.date.date, "month": wMember.date.strMonth };
		toEmail.startDate = wStartDate;
		toEmail.to = wMember.to;
		toEmail.name = wMember.name;
		toEmail.captain = wManagerName;
		toEmail.managerType = wManagerType;
		toEmail.proxy = (gRole === ROLES.MANAGER) ? true : false;
		toEmail.booker = $w('#txtFullName').text;
		toEmail.homeAway = wMember.homeAway;
		toEmail.subject = wMember.subject;
		toEmail.league = wMember.league;
		toEmail.start = wMember.time;
		toEmail.notes = wNotes;
		let res = await sendRequestAvailabilityEmail(toEmail);
		wCount++;
	}

	let results = await bulkSaveTeamPlayers(wToDB);
	//let results = false;
	if (results) {
		if (results.inserted === wToDB.length) {
			let wNewIds = results.insertedItemIds;
			wToDB.forEach((item, index) => {
				item._id = wNewIds[index];
			})
			wToGL.forEach((item, index) => {
				item._id = wNewIds[index];
			})
			let wNewTeamPlayers = gTeamPlayers.concat(wToGL);
			//gTeamPlayers = _.sortBy(wNewTeamPlayers, ['name']);
			gTeamPlayers = _.sortBy(wNewTeamPlayers, ['surname', 'firstName']);
			updateTeamMatches("P");
			updateTeamSquad($w('#rptSquad').data, gTeamPlayers)
				.then(wTeamSquad => {
					refreshRptSquad(wTeamSquad);
				})
			updateTeamPlayers(gTeamPlayers)
				.then(wTeamPlayers => {
					gTeamPlayers = wTeamPlayers;
					refreshTeamPlayers($w('#txtEventId').text);
				})
		} else {
			console.log("/page/MaintainTeamPlayers  sendAvailRq Some insertions failed. Only ", String(results.inserted), " were performed")
		}
		if (results.errors.length > 0) {
			console.log("/page/MaintainTeamPlayers  SendAvailRq bulk save errors List:");
			results.errors.array.forEach(error => {
				console.log(error);
			});
		}

	} else {
		console.log("/page/MaintainTeamPlayers sendAvailRq Bulk Save Team Players failed");
	}
}

function resolveEmail(pEmail) {
	let wEmail = "";
	if (pEmail) {
		wEmail = pEmail;
	} else if (gTeam.dayCaptainEmail) {
		wEmail = gTeam.dayCaptainEmail;
	} else if (gTeam.managerEmail) {
		wEmail = gTeam.managerEmail;
	}
	return wEmail;
}

async function processTeamSheet() {
	//console.log("sendTeamSheet", gMatchList, gSquadList");
	//console.log(gMatchList);
	//console.log(gSquadList);

	//const shorten = (pIn) => pIn.substring(0,6);

	let wToDB = [];
	//	let wToEmail = {};
	let wCount = 0;

	let wNotes = null;
	let wS = $w('#txtEmailNotes').value;
	wS = wS.trim();
	wNotes = (wS.length === 0) ? null : wS;
	//	Get Match Details
	let wMatchId = $w('#txtEventId').text;
	let wMatch = await getEvent(wMatchId);
	let wShortEventId = shorten(wMatchId);
	let wTeamKey = wMatch.team;

	let wDates = parseStartDate(wMatch.startDate); //{year, numMonth, date. hour. minute, strMonth. day, cardinal,
	//												 time, shortDate, longDate
	let wHomeAway = (wMatch.homeAway === "H") ? " home " : " away ";
	let wPlayDate = {
		strMonth: wDates.strMonth,
		date: wDates.date,
		day: wDates.day,
		start: wDates.time,
		longDate: wDates.longDate
	}
	let wSubject = wMatch.subject;
	let wLeague = gTeam.league;
	let wComPref = "M";
	let wEmailAddress = "";
	let wMobilePhone = "";
	let wHomePhone = "";

	// Build Sides List
	let wNoPerTeam = await getNumPlayersForTeam(wMatch);
	let wSidesArray = await constructSidesArray(wNoPerTeam, wMatch.rinks);
	let wSides = buildSidesHTML(wSidesArray);
	//wToEmail.sidesArray = wSidesArray;


	for (let wMember of gSquadList) {
		let wSquadMember = await getTeamSquadDetail(wMember.teamId, wMember.memberId);
		if (wSquadMember) {
			wComPref = wSquadMember.comPref;
			wEmailAddress = wSquadMember.emailAddress;
			wMobilePhone = wSquadMember.mobilePhone;
			wHomePhone = wSquadMember.homePhone;
		} else {
			console.log("/page/MaintainTeamPlayers processTeaamSheet Team Squad record not found for = ", wMember.teamId, wSquadMember.memberId);
		}

		let toEmail = {};
		$w('#pBarEmail').value = wCount;

		toEmail.shortEventId = wShortEventId;
		toEmail.shortMemberId = shorten(wMember.memberId);
		toEmail.teamKey = wTeamKey;
		toEmail.startDate = wPlayDate;
		toEmail.to = wEmailAddress;
		toEmail.name = wMember.name;
		toEmail.captain = (gTeam.dayCaptainId === null) ? gTeam.managerName : gTeam.dayCaptainName;
		toEmail.proxy = (gRole === ROLES.MANAGER) ? true : false;
		toEmail.booker = $w('#txtFullName').text;
		toEmail.homeAway = wHomeAway;
		toEmail.subject = wSubject;
		toEmail.league = wLeague;
		toEmail.start = wDates.time;
		toEmail.notes = wNotes; 9
		toEmail.sides = wSides;
		let res = await sendTeamSheet(toEmail);
		wCount++;
	}
}
//export function shorten(pIn){
//	console.log("shorten ", pIn);
//	return 	pIn.substring(0,6);
//}
export function buildSidesHTML(pSidesIn) {

	let wHdrBlock = `<style>table {border: 1px solid black;border-collapse: collapse;width: 40%;}
    th, td {border: 1px solid black;border-collapse: collapse;padding: 5px;padding-left: 10px;text-align: center;}
    .c1 {text-align: center;width: 15%;}
    .c2 {text-align: left;}
	</style>
	`;

	let wTeamName = "";
	let wPosition = "";
	let wName = "";
	let wNewRinkEnd = `</table><br>`;

	let wOut = [];
	for (let wSide of pSidesIn) {
		if (wSide.eventId === null) { continue };
		if (wSide.game === 0) {
			wTeamName = "Reserves";
		} else {
			wTeamName = "Side " + wSide.game;
		}
		let wTeam = wSide.team;
		let wNewRink = `<table><tr><td colspan="2">${wTeamName}</td></tr>`;
		wOut.push(wNewRink);
		for (let wPlayer of wTeam) {
			if (wPlayer.playerid === null) { continue };
			switch (wPlayer.pos) {
				case "S":
					wPosition = "Skip";
					break;
				case "1":
					wPosition = (wSide.game === 0) ? "1" : "Lead";
					break;
				case "2":
					wPosition = "2";
					break;
				case "3":
					wPosition = "3";
					break;
			}
			wName = wPlayer.player;
			let wNewPlayer = `<tr><td class="c1">${wPosition}</td><td class="c2">${wName}</td></tr>`;
			wOut.push(wNewPlayer);
		}
		wOut.push(wNewRinkEnd);
	};
	//wOut.push(wNewRinkEnd);
	let wSides = wHdrBlock;
	for (let wLine of wOut) {
		wSides = wSides + wLine + "\n";
	}
	return wSides;

}

function showEmailError(pErr, pSec) {
	let wMsg = ["This will break the daily email limit. Please select fewer",
		"2"
	];

	$w('#lblEmailErrorMsg').text = wMsg[pErr - 1];
	$w('#boxEmailError').expand();
	setTimeout(() => {
		$w('#boxEmailError').collapse();
	}, 1000 * pSec);
	return
}

//===================================================== BUTTONS STRIP ===============================================
//

export async function btnSave_click(event) {

	let wMembers = $w('#rptSquad').data;
	wMembers.shift();	//remove first entry which is a heading
	let wSquad = wMembers.map(item => {
		if (item._id.includes(gTeam.teamKey)) {
			return {
				teamId: item.teamId,
				memberId: item.memberId,
				teamKey: item.teamKey,
				name: item.name,
				numPlayed: item.numPlayed,
				comPref: item.comPref,
				emailAddress: item.emailAddress,
				mobilePhone: item.mobilePhone,
				homePhone: item.homePhone,
				emailSent: false
			}
		} else {
			return item;
		}
	})
	let results = await bulkSaveTeamSquad(wSquad);
	let wText = "Save complete: Inserts (" + String(results.inserted) + ") Updates (" + String(results.updated) +
		") Errors (" + String(results.errors.length) + ")";
	if (results.errors.length > 0) {
		console.log("/page/MaintainTeamPlayers BtnSave bulk save errors List:");
		results.errors.array.forEach(error => {
			console.log(error);
		});
	}

	$w('#lblSaveMsg').text = wText;
	$w('#lblSaveMsg').show();
	$w('#btnSave').hide();
}
export async function btnSaveSides_click(event) {
	let wSides = $w('#rptSidesPlayers').data;
	let wUpdate = wSides.map((item, index) => {
		return {
			"_id": item._id,
			"eventId": item.eventId,
			"playerId": item.memberId,
			"teamKey": item.teamKey,
			"game": item.game,
			"role": item.role,
			"status": item.status
		}
	})
	let res = await bulkSaveTeamPlayers(wUpdate);
	if (res.errors.length > 0) {
		console.log("/page/MaintainTeamPlayers BtnSaveSides bulk save errors List:");
		res.errors.array.forEach(error => {
			console.log(error);
		});
	}

	$w('#lblSaveMsg').text = "Inserted = " + res.inserted + " Updated = " + res.updated + " Skipped = " + res.skipped + " Errors = " + res.errors.length;
	$w('#lblSaveMsg').show();
	setTimeout(() => {
		$w('#lblSaveMsg').hide();
	}, 10000);

}

export function btnClose_click(event) {
	wixLocation.to("/");

}

export function btnViewAvailability_click(event) {
	$w('#btnViewAvailability').collapse();
	btnAvailView_click();
}

export function btnMatchCancelled_click(event) {
	wixLocation.to("/maintain-event");
}

export function btnMatchPostponed_click(event) {
	wixLocation.to("/maintain-event");
}

export async function btnMatchCompleted_click(event) {
	let wMatchId = $w('#txtEventId').text;
	let wPlayers = [];
	try {
		wPlayers = await matchCompleted(false, wMatchId);
	}
	catch (err) {
		if (err === 100) {
			$w('#boxErrorMsg').expand();
			$w('#txtEventId').text = "";
			$w('#lblErrorMsg').text = "You should only complete a match if all sides are complete";
			setTimeout(() => {
				$w('#boxErrorMsg').collapse();
			}, 7000);
		}
	}
	let wSquad = $w('#rptSquad').data;
	let wSquadToUpdate = [];
	for (let wPlayed of wPlayers) {
		let wSquadRec = wSquad.filter(item => item.memberId === wPlayed.playerId);
		if (wSquadRec) {
			wSquadRec[0].numPlayed = wSquadRec[0].numPlayed + 1;
			wSquadToUpdate.push(wSquadRec[0]);
		}
	}
	let res = await bulkSaveTeamSquad(wSquadToUpdate);
	refreshRptSquad(wSquad);						//re-displayes repeater
	$w('#txtLastEventId').text = wMatchId;
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/