import wixLocation 							from 	'wix-location';
import { currentMember } 					from 	'wix-members';

import { convertNulls }						from 	'public/utility.js';
import { setUpMemberDetails }				from 	'public/objects/member';
import { getTeamSquadDetail }				from 	'public/objects/team.js';
import { getTeamSquadsByMember }			from	'public/objects/team.js';
import { getTeamPlayer }					from	'public/objects/team.js';
//import { bulkSaveTeamPlayers }				from	'public/objects/team.js';
import { bulkSaveTeamPlayers }				from	'backend/backTeam.jsw';

import { updateTeamPlayerStatus }			from	'backend/data.jsw';

import { findTeamByKey }					from	'backend/backTeam.jsw';
import { formatDateString }					from 	'public/fixtures';
import { getEventByShortId }				from 	'public/objects/event.js';
import { findLstMemberByShortId }				from 	'backend/backMember.jsw';
import { loadTeamMatches }					from	'public/objects/team.js';
import { loadTeamPlayers }					from	'public/objects/team.js';
//import { loadTeamSquad }					from	'public/objects/team.js';
import { loadTeamDropbox }					from	'public/objects/team.js';
import { closeExit }						from	'public/objects/team.js';
import { getName }							from	'public/objects/team.js';
import { loadTeamMemberRepeaters }			from	'public/objects/team.js';
import { getAvailableState }				from	'public/objects/team.js';

import { ROLES }							from	'public/objects/member';

import { gTeamPlayers, gTeam, gRole}		from	'public/objects/team.js';
import { gUser, gGender, gUserId, gMatch}	from	'public/objects/team.js';


//let gRole = "";
//let gUser;
//let gGender = "M";
let gTeams;
//let gTeam;
let gEvent;
//let gTeamPlayers;
let gTeamPlayerId;

let loggedInMember = undefined;

//let gUserId;

let gParams;

$w.onReady(async function (){

	// for testing ------	------------------------------------------------------------------------
	//let wLoggedIn  = false;
	//let wUser = {"id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "roles": [{"name": "Full"}], "loggedIn":true};		// trev admin
	//let wUser = {"id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true};		//Sarah captain
//let wUser = {"id": "5132409b-6d6a-41c4-beb7-660b2360054e", "roles": [{"name": "Full"}], "loggedIn": true};		//John Mitchell tem player
	//let wUser = {"id": "1470f30e-987b-4ca0-8224-be8456b7dd7f", "roles": [{"name": "Full"}], "loggedIn": true};		//Carole team player
	//let wUser = {"id": "7e451a8f-0a88-4d70-92cf-0ec1149447f3", "loggedIn": true};		//Kim Eales member

	//gUserId = "91eab866-e480-4ddc-9512-d27bbbed2f10";	//Sarah		captain RSA
	//gUserId = "009c1ce7-a3c3-4d23-b111-c415c544272e";	//Carole Williams member	
	//gUserId = "93daeee8-3d4b-40cc-a016-c88e93af1559";	//Yoneko member, but not in Squad	
	
	//gUserId = "91eab866-e480-4ddc-9512-d27bbbed2f10";	//Sarah		captain KLA
	//gUserId = "7e864e0b-e8b1-4150-8962-0191b2c1245e";	//Me		manager
	//gUserId = "89aacf14-2058-4fe2-be8f-ae01bfb3d114";	//Kim Eales member
	
	//gRole   = ADMIN;
	//gRole = MEMBER
	//gGender = "L";

	gParams = {
		"res": "N",
		"mid": "7e864e", 	//40a77121-3265-4f0c-9c30-779a05366aa9 John Mitchell
		"eid": "238d50", 	//7ef73f10-a691-4e56-8c00-d8a4a140a32f Henley KLV C
		"teamKey": "FGX"
	}
	// also see line 186 setting Query + 19+20 in setupmemberdetails
	// end of esting fudge------------------------------------------------------------------------------

	//let wUser = await currentMember.getMember();

	loggedInMember = await currentMember.getMember();	// returns current member object if logged in, else is undefined
	if (loggedInMember) {
		gUser = await setUpMemberDetails(false, loggedInMember);
		gRole = gUser.role;
		gUserId = gUser.lstId;
		gGender=gUser.gender;
	} else {
		console.log("/page/MaintainTeamMember onReady Manage Team Member: No user logged on");
	}

	let {wResult, wStatus, wTeamKey, wEventId, wMemberId} = await autoEntry();
	if (wResult){
		let wSubject = (gEvent) ? gEvent.subject : "";
		let wTeam = (gTeam) ? gTeam.teamName : "";
		let wLeague = (gTeam) ? gTeam.league : "";
		let wDate = (gEvent) ? formatDateString(gEvent.startDate,"short") : new Date();
		let wFirstName = gUser.firstName;
		configureDropGender();
		gRole = ROLES.MEMBER;	
		$w('#imgAutoWait').show();
		$w('#lblAutoUser').text = `Hello ${wFirstName},`
		$w('#cstrpSelect').collapse();
		$w('#cstrpNotSignedOn').collapse();
		$w('#cstrpAutoUpdate').expand();
		$w('#cstrpButtons').collapse();
		switch (wStatus) {
			case "V":
				$w('#lblAutoTeam').text = `You asked to see who was available for the
					${wTeam} team against ${wSubject} game on ${wDate} in the ${wLeague} league`;
				$w('#lblAutoResult').collapse();
				$w('#lblAutoMsg').collapse();
				doViewAvailability();
				break;
			case "C":
				$w('#btnViewMoreMatches').expand();
				$w('#lblAutoResult').expand();
				$w('#lblAutoMsg').expand();
				$w('#lblAutoTeam').text = `Thank you for confirming receipt of team sheet for the
					${wTeam} team against ${wSubject} game on ${wDate} in the ${wLeague} league`;
				$w('#lblAutoResult').text = "";
				$w('#lblAutoMsg').text = "Please wait while your request is processed.";
				performAutoUpdate(wTeamKey, wEventId, wMemberId, wStatus);
				break;
			case "N":
			case "A":
				$w('#btnViewMoreMatches').expand();
				$w('#lblAutoResult').expand();
				$w('#lblAutoMsg').expand();
				$w('#lblAutoTeam').text = `Thank you for reporting your availability for the
					${wTeam} team against ${wSubject} game on ${wDate} in the ${wLeague} league`;
				$w('#lblAutoResult').text = (wStatus === "A") ? "Your availability has been noted " : "Your non-avalability has been noted"
				$w('#lblAutoMsg').text = "Please wait while your request is processed.";
				performAutoUpdate(wTeamKey, wEventId, wMemberId, wStatus);
				break;
		}
	}/** if not auto entry */ else {
		//if (wLoggedIn) {		// FOR TESTING
		if (loggedInMember) {
			// proceed into process depending what role is signed in
			configureDropGender();
			configureWindow();
		} else { 
			// error route out

			closeExit(1);
		}
	}

	$w('#rptMatches').onItemReady(($item, itemData, index) => {
		loadMatches($item, itemData, index);
	});

	$w('#rptPlayers').onItemReady(($item, itemData, index) => {
		loadPlayers($item, itemData, index);
	});
});


async function configureWindow() {
	$w('#cstrpSelect').expand();
	$w('#cstrpNotSignedOn').collapse();
	$w('#cstrpAutoUpdate').collapse();
	switch (gRole) {
		case ROLES.VISITOR:{
			$w('#cstrpSelect').collapse();
			$w('#cstrpNotSignedOn').expand();
			break;
		}
		case ROLES.ADMIN:
		case ROLES.MANAGER:
		case ROLES.CAPTAIN:
		case ROLES.PRESS:
		case ROLES.COACH:
			gRole = ROLES.MEMBER;					// this page is for team player roles only
			let w1Teams = await getTeamSquadsByMember(gUserId);
			if (w1Teams.length === 1){ 
				let wTeam = w1Teams[0];
				let wTeams = [];
				let wRec = await findTeamByKey(wTeam.teamKey);
				wTeams.push(wRec);
				await loadTeamDropbox("M", wTeams);
			} else { 
				await loadTeamDropbox("M", w1Teams);
			}
			break;
		case ROLES.MEMBER:
			let w2Teams = await getTeamSquadsByMember(gUserId);
			if (w2Teams.length === 1){ 
				let wTeam = w2Teams[0];
				let wTeams = [];
				let wRec = await findTeamByKey(wTeam.teamKey);
				wTeams.push(wRec);
				await loadTeamDropbox("M", wTeams);
			} else { 
				await loadTeamDropbox("M", w2Teams);
			}
			break;
		default: {
			console.log("/page/MaintainTeamMember configureWindow  Error: Visitor");
			$w('#cstrpSelect').collapse();
			$w('#cstrpNotSignedOn').expand();
			break;
		}
	}
}

//=================================================== MEMBER SMS/EMAIL RESPONSE PROCESS ===========================================
//

export async function autoEntry(){
	let wQuery = wixLocation.query;
	let wResult = false;
	let wStatus;
	let wTeamKey;
	let wEventId;
	let wMemberId;
	//wQuery = gParams;
	if (wQuery.res === undefined) {
		wResult = false;
		wTeamKey = "";
		wStatus = "";
		wEventId = "";
		wMemberId = "";
		gTeam = null;
		gEvent = null;
		//gUser = null;
	} else { 
		//	Validate all main fields to prevent fraudulent entry
		wTeamKey = wQuery.teamKey;
		wStatus = String(wQuery.res);
		wEventId = String(wQuery.eid);
		wMemberId = String(wQuery.mid);
		//console.log("Query, ", wStatus, wTeamKey, wEventId, wMemberId);
		//	check validity of paramrters
		gTeam = await findTeamByKey(wTeamKey);
		gEvent = await getEventByShortId (wEventId);
		gUser = await findLstMemberByShortId(wMemberId);	//this is lstMembers record
		let wTemp  = await getTeamPlayer(gEvent._id, gUser._id);
		gTeamPlayerId = wTemp._id;
		if (gTeamPlayerId === undefined){ 
			console.log("/page/MaintainTeamMember autoEntry Cannot find TeamPlayerRec for ", gEvent._id, gUser._id);
			return false;
		}
		$w('#txtEventId').text = gEvent._id;
		wMemberId = gUser._id;
		wEventId = gEvent._id;
		gUserId = gUser._id;
		if (wStatus === undefined) {
			console.log("/page/MaintainTeamMember autoEntry Status undefined");
			wResult = false; 
		} else if (wStatus !== "V" && wStatus !== "N" && wStatus !== "A" && wStatus !== "C") { 
			wResult = false;
		} else { 
			wResult = true;
		}
	}
	return {wResult, wStatus, wTeamKey, wEventId, wMemberId};
	//if (wEid === undefined) { return false}
	//if (wMid === undefined) { return false}

}

async function doViewAvailability () {
	let wEventId = $w('#txtEventId').text;
	//console.log("doViewAvailability, eventId", wEventId);
	//$w('#imgCommandWait').show();
	$w('#imgAutoWait').show();
	$w('#cstrpButtons').collapse();
	$w('#boxPlayersCommands').expand();
	$w('#ibtnUp').hide();
	let p1 = loadTeamPlayers(gTeam);
	let p2 = loadTeamMatches (gTeam);
	Promise.all([p1,p2]).then(function(values) {
		gTeamPlayers = values[0];
		updateTeamPlayers()
		.then ( result => {
			//console.log(gTeamPlayers);
			refreshTeamPlayers(wEventId);
			closeWaitImages();
		})
		$w('#cstrpPlayers').expand();
		$w('#imgPlayersWait').scrollTo();
		refreshTeamMatches();
	});
}

function closeWaitImages() { 
	$w('#imgAutoWait').hide();
	//$w('#imgCommandWait').hide();
	$w('#imgMatchWait').hide();
	$w('#imgPlayersWait').hide();
	$w('#imgWait').hide();
}

export async function performAutoUpdate(pTeamKey, pEventId, pMemberId, pStatus) { 
	//console.log("PerformAutoUpdate, teamKey, eventId, memberId, pSTatus gTeamPlayerId", pTeamKey, pEventId, pMemberId, pStatus, gTeamPlayerId);
	//$w('#imgCommandWait').show();
	$w('#imgWait').show();
	$w('#btnViewMoreMatches').disable();
	$w('#btnClose').disable();
	let res = await updateTeamPlayerStatus(gTeamPlayerId, pStatus);	//updates DB directly
	if (res) {
		$w('#lblAutoMsg').text = "Press Close to load the home page or View More.... to look at other matches in the league";
	} else {
		$w('#lblAutoMsg').text = "Something went wrong, please contact webmaster";
	}
	$w('#btnClose').enable();
	$w('#btnViewMoreMatches').enable();
	closeWaitImages();
	$w('#cstrpButtons').expand();
}

//===================================================== SELECT STRIP ===============================================
//

function configureDropGender() { 
	let wMale = [
		{"label": "Mens", "value": "M"},
		{"label": "Mixed", "value": "X"},
		{"label": "All", "value": "A"},
	]
	let wFemale = [
		{"label": "Ladies", "value": "L"},
		{"label": "Mixed", "value": "X"},
		{"label": "All", "value": "A"},
	]
	$w('#rgpGender').options = (gGender === "L") ? wFemale : wMale;
	$w('#rgpGender').value = "A";
}
/**
function showTeamMemberBox(pKey, pLeague, pTeam){
	const msg = [
		`${gUser.firstName}, you are the captain of the ${pTeam} team in the ${pLeague} league`,
		`${gUser.firstName}, you are a member of the ${pTeam} team in the ${pLeague} league`
	]
	$w('#lblTeamMemberMsg').text = msg[pKey - 1];
	$w('#boxGeneral').collapse();
	$w('#boxNoTeam').collapse();
	$w('#boxTeamMember').expand();
	$w('#cstrpSelect').expand();
	$w('#cstrpButtons').collapse();
}

async function loadTeamDropbox() {
	$w('#rgpGender').value = gGender;
	let wTeams = await getTeamSquadsByMember(gUserId);
	if (wTeams.length === 0) { 
		$w('#cstrpSelect').collapse();
		closeExit(2);
	} else if (wTeams.length === 1) {
		let wTeam = wTeams[0];

		let wRec = await findTeamByKey(wTeam.teamKey);
		let wLeague = wRec.league;
		let wTeamName = wRec.teamName;
		showTeamMemberBox(2, wLeague, wTeamName);
		gTeam = wRec;
		$w('#cstrpMatches').expand();
		$w('#imgWait').show();
		let p1 = loadTeamPlayers(gTeam);
		let p2 = loadTeamMatches(gTeam);
		Promise.all([p1,p2]).then(function(values) {
			gTeamPlayers = values[0];
			let wMatches = values[1];
			let wEventId = (wMatches.length > 0) ? wMatches[1]._id : null;	//first entry is rptr hdr
			$w('#txtEventId').text = (wEventId === null) ? "" : wEventId;

			updateTeamPlayers()
			.then ( result => { 
				refreshTeamPlayers(wEventId);
				closeWaitImages();
			})
		})
	} else {
		$w('#boxTeamMember').collapse();
		$w('#boxNoTeam').collapse();
		$w('#boxGeneral').expand();
		$w('#cstrpSelect').expand();
		let wOptions = [];
		for (let wItem of wTeams){ 
			let wOption = await formDrpEntry(wItem);
			wOptions.push(wOption);	
		}
		let wDrpOptions = drpTeamOptions(wOptions, $w('#rgpGender').value);
		if (wDrpOptions.length > 0) {
			//$w('#drpTeams').options = []; 
			$w('#drpTeams').options = wDrpOptions;
			$w('#drpTeams').value = wDrpOptions[0].value;
			$w('#boxdrpTeams').show();
		} else { 
			$w('#drpTeams').options = [];
			$w('#boxdrpTeams').hide();
		}
	}
}

async function formDrpEntry(pItem){ 
	let wRec = await findTeamByKey(pItem.teamKey);
	let wLeague = wRec.league;
	let wDiv = wRec.division;
	let wTeam = wRec.teamName;
	let wEntry = "";
	if (parseInt(wDiv,10) === 0) { 
		wEntry = `${wLeague} - ${wTeam}`;
	} else { 
		wEntry = `${wLeague} Div ${wDiv} - ${wTeam}`;
	}
	return {"label": wEntry, "value": wRec.teamKey, "gender": wRec.gender}

}

function drpTeamOptions(pOptions, pValue) {
	let wTemp;
	if (pValue === "A") {
		wTemp = pOptions
	} else { 
		wTemp = pOptions.filter( item => item.gender === pValue);
	}
	let wTeamsOfType = wTemp.map ( item => {
		return {
			label: item.label,
			value: item.value
		}
	})
	return wTeamsOfType;
}
*/
export async function rgpGender_change(event) {
	let wGender = event.target.value;
	closeStrips("A");
	let wTeams = await getTeamSquadsByMember(gUserId);
	let wOptions = [];
	loadTeamDropbox("M", wTeams);
}

export async function btnGo_click(event) {
	$w('#imgWait').show();
	let wSurname = null;
	let wFirstName = null;

	let wTeamKey = $w('#drpTeams').value;
	if (!wTeamKey) { return };
	$w('#txtTeamId').text = wTeamKey;
	$w('#lblSaveMsg').hide();
	//let wTeam = await getLeagueTeam(wId);
	let wTeam = await findTeamByKey(wTeamKey);
	if (wTeam) { 
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamMemberRepeaters(); 
}

export async function drpTeams_change(event) {

	let wTeamKey = event.target.value;
	let wSurname = null;
	let wFirstName = null;

	closeStrips("A");
	let wTeam = await findTeamByKey(wTeamKey);
	$w('#imgWait').show();
	if (wTeam) { 
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamMemberRepeaters();
}
export async function btnChangeTeam_click(event) {

	$w('#cstrpMatches').collapse();
	closeStrips("A");
	$w('#boxTeamMember').collapse();
	$w('#boxdrpTeams').collapse();
	$w('#boxGeneral').expand();
	$w('#rgpGender').value = gGender;
	await configureWindow();
}
//===================================================== LOAD REPEATERS ====================================================
//
function loadPlayers($item, itemData, index) {
	if (index === 0) {
		$item('#txtPlayersPos').text = "#";
		$item('#txtPlayersPlayer').text  = "Player";
		$item('#txtPlayersAvail').text  = "Available?"
		$item('#txtPlayersNumPlayed').text  = "Played"
	} else { 
		$item('#txtPlayersPos').text = String(index);
		$item('#txtPlayersPlayer').text  = convertNulls(itemData.name);
		$item('#txtPlayersAvail').text  = getAvailableState(itemData.status);
		$item('#txtPlayersNumPlayed').text  = String(itemData.numPlayed);
	}
}

function loadMatches($item, itemData, index) {
	if (index === 0) {
		$item('#txtMonth').text = "";
		$item('#txtDate').text  = "Date";
		$item('#txtDay').text  = "";
		$item('#txtSubject').text  = "Sbject";
		$item('#txtHomeAway').text  = "Venue";
		$item('#txtRinks').text  = "Rinks";
		if (gRole === "Member") { 
			$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').collapse();
			//$item('#txtNumRequested').text  = "";
			//$item('#txtNumAvailable').text  = "";
			//$item('#txtNumAvailable').text  = "";
			$item('#txtAvail').expand();
			$item('#txtAvail').text = "Your Availability";
		} else { 
			$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').expand();
			$item('#txtAvail').collapse();
			//$item('#txtNumRequired').text  = "Required";
			//$item('#txtNumRequested').text  = "Requested";
			//$item('#txtNumAvailable').text  = "Available";
		}
		$item('#chkSelect').hide();
	} else { 
		$item('#txtMonth').text = itemData.month;
		$item('#txtDate').text  = itemData.date;
		$item('#txtDay').text  = itemData.day;
		$item('#txtSubject').text  = itemData.subject;
		$item('#txtHomeAway').text  = itemData.venue;
		$item('#txtRinks').text  = itemData.rink;
		if (gRole === "Member") { 
			$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').collapse();
			//$item('#txtNumRequired').text  = "";
			//$item('#txtNumRequested').text  = "";
			//$item('#txtNumAvailable').text  = "";
			$item('#txtAvail').expand();
			$item('#txtAvail').text = getAvailableState(itemData.avail);
		} else { 
			$item('#txtNumRequired, #txtNumRequested, #txtNumAvailable').expand();
			$item('#txtAvail').collapse();
			$item('#txtNumRequired').text  = String(itemData.numRequired);
			$item('#txtNumRequested').text  = String(itemData.numRequest);
			$item('#txtNumAvailable').text  = String(itemData.numAvail);
		}
		$item('#chkSelect').checked = false;
	}
}

//===================================================== SUPPORTING FUNCTIONS ====================================================

export async function updateRepeatersForMember(pEventId, pTeamPlayerId, pStatus){
	//console.log("updateRepeatersForMember, pEventId, pTEamPlayerId, pSTatus ", pEventId, pTeamPlayerId, pStatus);
	//let wMatches = $w('#rptMatches').data;
	//const index = wMatches.findIndex(match => match._id === pEventId);
	//console.log(index);
	//let wTemp = wMatches[index];
	//wTemp.avail = getAvailableState(pStatus);
	$w('#rptMatches').forItems([pEventId], ($item) => {
		$item('#txtAvail').text = getAvailableState(pStatus);
		$item('#txtNumRequested').text = "0";
		$item('#txtNumAvailable').text = "0";
	})
	
	$w('#rptPlayers').forItems([pTeamPlayerId], ($item) => {
		$item('#txtPlayersAvail').text = getAvailableState(pStatus);
	})
}

//===================================================== MATCHES FUNCTIONS ===================================================
//
async function refreshTeamMatches(){

	//console.log("RefreshTeamMatches");
	let wMatchList = $w('#rptMatches').data;
	let wFirstRec= wMatchList.shift();
	let wUserTeamPlayers = gTeamPlayers.filter ( item => item.memberId === gUserId);	//get TeamPlayer rec, if exists
	if (wMatchList) {
		$w('#boxNoMatches').collapse();
		const wNoMatches = wMatchList.length;
		if (wNoMatches === 0) {
			//console.log("RefreshTeamMatches Done 1");
			return
		} else { 
			for (let wMatch of wMatchList) {
				let wMatchPlayerSet = wUserTeamPlayers.filter ( item => item.eventId === wMatch.eventId);
				let wMatchPlayer = wMatchPlayerSet[0];
				if (wMatchPlayer) { 
					wMatch.avail = wMatchPlayer.status;
				} else {
					wMatch.avail = "U";
				}
			}
			wMatchList.unshift(wFirstRec);
			$w('#rptMatches').data = [];
			$w('#rptMatches').data = wMatchList;
			//console.log("RefreshTeamMatches Done 2");
			return wMatchList;
		}
	} else { 
		$w('#boxMatchList').collapse();
		$w('#boxNoMatches').expand();
	}
	//console.log("RefreshTeamMatches Done 3");
}

export function chkSelect_change(event) {
	// calculate how many buttons checked
	// if 0, then clear stuff
	// if 1 then do single tea stuff
	// else do multiple stuff
	const wId = event.context.itemId;
	let wCount = countMatchSelectedItems();
	closeStrips("M");
	switch (wCount) {
		case 0:
			$w('#lblStep1').collapse();
			$w('#boxAvailability').collapse();
			$w('#boxOtherCmds').collapse();
			$w('#boxErrorMsg').collapse();
			$w('#lblErrorMsg').text = "";
			$w('#txtEventId').text = "";
			break;
		case 1:
			$w('#lblStep1').expand();
			$w('#boxAvailability').expand();
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
			$w('#boxAvailability').collapse();
			$w('#boxOtherCmds').collapse();
			$w('#boxErrorMsg').expand();
			$w('#txtEventId').text = "";
			$w('#lblErrorMsg').text = "You may only select one match to work on";
			break;
	}
}

function closeStrips(pScope) {
	$w('#cstrpAutoUpdate').collapse();
	$w('#cstrpButtons').collapse();
	$w('#cstrpNotSignedOn').collapse();
	$w('#cstrpPlayers').collapse();
	if (pScope === "A") { 
		$w('#cstrpMatches').collapse();
	}
}

function getCheckedItemId(){
	let wId = "";
	$w('#rptMatches').forEachItem( ($item, itemData) =>  { 
		if ($item('#chkSelect').checked) {
			wId = itemData._id;
		}
	})
	return wId;
}

function countMatchSelectedItems() {
	let count = 0;
	$w('#rptMatches').forEachItem( ($item) =>  { 
		if ($item('#chkSelect').checked) { count++}
	})
	return count;
}

export function btnAvailView_click(event) {
	//console.log("btnAvailView_click");
	let wEventId = $w('#txtEventId').text;
	refreshTeamPlayers(wEventId);
	$w('#cstrpPlayers').expand();
	$w('#imgPlayersWait').scrollTo();
}

export async function btnAvailUpdate_click(event) {
	await updateStatus($w('#imgMatchWait'));
}

async function updateStatus(pItem){
	pItem.show();
	let wEventId =  $w('#txtEventId').text;	// ths is set by checking the select checkbox. Only i select allowed
	let wStatus = false;
	let wTeamPlayer = await getTeamPlayer(wEventId, gUserId);
	let wNewStatus = "A";
	if (wTeamPlayer) { 
		let wOldStatus = wTeamPlayer.status;
		switch (wOldStatus) {
			case "A": 
				wNewStatus = "N";
				wStatus = true;
				break;
			case "N": 
				wNewStatus = "A";
				wStatus = true;
				break;
			case "U": 
				wNewStatus = "A";
				wStatus = true;
				break;
			case "C":
				showMatchesError(1);
				$w('#imgMatchWait').hide();
				wStatus = false;
				break; 
			case "P":
				showMatchesError(2);
				$w('#imgMatchWait').hide();
				wStatus = false;
				break; 
		}
	} else { 
			showMatchesError(3);
			wStatus = false;
	}
	if (wStatus) {
		let wUpdatedTeamPlayer = wTeamPlayer;
		wUpdatedTeamPlayer.status = wNewStatus;
		await updateTeamPlayerAvailability(wEventId, gUserId, wNewStatus);
	}
	pItem.hide();
	return wStatus;
}

export async function updateTeamPlayerAvailability(pEventId, pMemberId, pStatus) {
	//console.log("updateTeamPlayerAvailability, pEventId, pMemberId, pSTatus ",pEventId, pMemberId, pStatus);
	let wTeamPlayer = await getTeamPlayer(pEventId, pMemberId);
	if (wTeamPlayer) { 
		wTeamPlayer.status = pStatus;
		//onsole.log("Update TeamPlayer status");
		let results = await bulkSaveTeamPlayers([wTeamPlayer]);
		wTeamPlayer = gTeamPlayers.find( item  => item.memberId === wTeamPlayer.playerId && item.eventId === pEventId);
		wTeamPlayer.status = pStatus;
		await updateRepeatersForMember(pEventId, wTeamPlayer._id, pStatus);
	} else { 
		// this arises when a member Asks to Update availability for another match, when not previously asked
		//onsole.log("create TeamPlayer", pEventId, pMemberId, pStatus);
		let wNewTeamPlayer = [{ "eventId": pEventId, "playerId": pMemberId, "teamKey": gTeam.teamKey, "game": null, "role": null, "status": pStatus}];
		let results = await bulkSaveTeamPlayers(wNewTeamPlayer); //TODO - need to get InsertedId for below
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
			await updateRepeatersForMember(pEventId, wTeamPlayerId, "A");
		}
	}
}

function showMatchesError(pCode){

	let wMsg = ["Please call your captain directly to change your availability",
				"The game has been played",
				"You have not yet been invited to play in this match"
	];

	$w('#lblErrorMsg').text = wMsg[pCode-1];
	$w('#boxErrorMsg').expand();
	setTimeout(() => {
		$w('#boxErrorMsg').collapse();
	}, 8000);
	return
}

//===================================================== TEAMPLAYERS FUNCTIONS ===================================================
//

function refreshTeamPlayers(pEventId){
	const rptPlayersFirst = {"_id": gTeam.teamKey + "0", "name": ""};
	//console.log("refreshTeamPlayers ", pEventId);

	let wMatchTeamPlayers = gTeamPlayers.filter( item => item.eventId === pEventId);
	if (wMatchTeamPlayers) { 
		const wPlayersSize = wMatchTeamPlayers.length;
		if (wPlayersSize === 0) { 
			$w('#boxPlayersList').collapse();
			$w('#boxNoPlayers').expand()	
			$w('#rptPlayers').data = [];
		} else { 
			$w('#boxPlayersList').expand();
			$w('#boxNoPlayers').collapse();
			wMatchTeamPlayers.unshift(rptPlayersFirst);
			$w('#rptPlayers').data = wMatchTeamPlayers;
		}
	} else { 
		$w('#boxPlayersList').collapse();
		$w('#boxNoPlayers').expand()	
		$w('#rptPlayers').data = [];
	}
}

export function ibtnUp_click(event) {
	$w('#cstrpPlayers').collapse();
	$w('#imgMatchWait').scrollTo();
}

export async function btnPlayersUpdateAvailability_click(event) {
	await updateStatus($w('#imgPlayersWait'));
}

export async function btnPlayerOtherViewOtherMatches_click(event) {
	$w('#cstrpSelect').expand();
	$w('#boxGeneral').expand();

	let w1Teams = await getTeamSquadsByMember(gUserId);
	//console.log(w1Teams);
	if (w1Teams.length === 1){ 
		let wTeam = w1Teams[0];
		let wTeams = [];
		let wRec = await findTeamByKey(wTeam.teamKey);
		wTeams.push(wRec);
		await loadTeamDropbox("M", wTeams);
	} else { 
		await loadTeamDropbox("M", w1Teams);
	}
}

//===================================================== BUTTOMS STRIP ===============================================
//

export async function btnViewMoreMatches_click(event) {
	$w('#cstrpAutoUpdate').collapse();
	$w('#cstrpButtons').collapse();
	$w('#cstrpSelect').expand();
	let w1Teams = await getTeamSquadsByMember(gUserId);
	if (w1Teams.length === 1){ 
		let wTeam = w1Teams[0];
		let wTeams = [];
		let wRec = await findTeamByKey(wTeam.teamKey);
		wTeams.push(wRec);
		await loadTeamDropbox("M", wTeams);
	} else { 
		await loadTeamDropbox("M", w1Teams);
	}
	$w('#imgWait').show();
	let wTeam = await findTeamByKey(gTeam.teamKey);
	let wSurname = null;
	let wFirstName = null;

	$w('#imgWait').show();
	if (wTeam) { 
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamMemberRepeaters();
}

export function btnClose_click(event) {
	wixLocation.to("/");
}
//--------------------------------------------------- supporting functions -------------------------------------------------------
async function updateTeamPlayers() {
	for (let wPlayer of gTeamPlayers) {
		let wShortId = wPlayer.memberId.substring(0,6);
		let wMember = await findLstMemberByShortId(wShortId);
		if (wMember) { 
			wPlayer.name = wMember.firstName + " " + wMember.surname;
		} else { 
			console.log("/page/MaintainTeamMember updateTeamPlayers Couldnt find player = ", wShortId);
			return false;
		}
	}
	return true;
}


/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
