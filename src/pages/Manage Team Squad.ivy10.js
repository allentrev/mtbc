import wixWindow 				from 'wix-window';
import { authentication }   from 'wix-members-frontend';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } 		from 'public/objects/member';
import _ 						from 'lodash';
//Example			gTeams = _.sortBy(wAllTeams, ['gender','teamKey']);
import wixLocation 				from 'wix-location';


import { convertNulls }						from	'public/utility';
import { getAllMembers }					from 	'backend/backMember.jsw';


import { getTeamsByGender }					from	'public/objects/team.js';
import { getTeamsByCaptain }				from	'public/objects/team.js';

import { findTeamByKey }					from	'backend/backTeam.jsw';
import { bulkDeleteTeamSquad }				from	'public/objects/team.js';
import { ROLES } 							from	'public/objects/member';

import { saveSquadChanges }					from	'backend/backTeam.jsw';

import { getName } 							from	'public/objects/team.js';
import { loadTeamDropbox } 					from	'public/objects/team.js';
import { loadTeamSquadRepeaters } 			from	'public/objects/team.js';


//import { gTeamPlayers, gTeam}		from	'public/objects/team.js';

let gGender = "X";
let gTeam = {};

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
    let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
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
    
    [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
	
    if (isLoggedIn) {
        let wRoles = loggedInMemberRoles.toString();
        console.log("/page/ManageTeamSquad onReady/ Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
    } else {
        console.log("/page/ManageTeamSquad onReady/ Not signed in");
		//console.log("Not signed on");
		$w('#cstrpSelect').collapse();
		closeExit(1);
    }
	$w('#lblFirstName').text = "User"
	if (loggedInMember) {
		gGender = loggedInMember.gender;
		$w('#lblFirstName').text = loggedInMember.firstName;
		configureWindow();
	}

	$w('#rgpGender').value = gGender

	$w('#rptSquad').onItemReady(($item, itemData, index) => {
		loadSquad($item, itemData, index);
	});
});


async function configureWindow() {
	$w('#cstrpSelect').expand();
	if (isRequiredRole([ROLES.MANAGER, ROLES.ADMIN],loggedInMemberRoles)) {
		let wAllTeams = await getTeamsByGender(gGender);
		loadTeamDropbox("S", wAllTeams);
		$w('#cstrpSquad').collapse();
		$w('#cstrpError').collapse();
		$w('#cstrpButtons').expand();
		$w('#lblMessage').text = "";
	} else if (isRequiredRole([ROLES.CAPTAIN],loggedInMemberRoles)) {
		let wCaptainsTeams = await getTeamsByCaptain(loggedInMember.lstId);
		loadTeamDropbox("S", wCaptainsTeams);
		$w('#cstrpSquad').collapse();
		$w('#cstrpError').collapse();
		$w('#cstrpButtons').expand();
		$w('#lblMessage').text = "";
	} else {
		$w('#cstrpSquad').collapse();
		$w('#cstrpSelect').collapse();
		$w('#cstrpError').expand();
		$w('#cstrpButtons').expand();
		$w('#lblMessage').text = "This facility is restricted to the Manager or Team Captain roles";
	}
}

//===================================================== LOAD REPEATERS ==============================================
//

function loadSquad($item, itemData, index) {
	if (index === 0) {
		$item('#txtSquadPos').text = "#";
		$item('#txtSquadPlayer').text  = "Player";
		$item('#txtSquadNumPlayed').text  = "Played"
		$item('#chkSquadItem').hide();
	} else { 
		$item('#txtSquadPos').text = String(index);
		$item('#txtSquadPlayer').text  = convertNulls(itemData.name);
		$item('#txtSquadNumPlayed').text  = String(itemData.numPlayed);
		$item('#chkSquadItem').checked = false;
		$item('#chkSquadItem').show();
	}
}

//----------------------------------------------------- SUPPORTING FUNCTIONS ---------------------------------------
/**
function refreshRptSquad(wIn){
	$w('#rptSquad').forEachItem( ($item, itemData, index) => {
		if (index > 0) {
			let wRec = wIn[index]
			$item('#txtPos').text = String(index);
			$item('#txtPlayer').text  = wRec.name;
			$item('#txtNumPlayed').text  = String(wRec.numPlayed);
		}
	}); // grid repeat
}
*/
//===================================================== SELECT STRIP ===============================================
//

export async function rgpGender_change(event) {
	
	gGender = event.target.value;
	let wTeamsOfType = await getTeamsByGender(gGender);
	let wTeams = wTeamsOfType;
    if (isRequiredRole([ROLES.CAPTAIN],loggedInMemberRoles)) {
		wTeams = wTeamsOfType.filter (item => item.managerId === loggedInMember.lstId);
	}
	loadTeamDropbox("S", wTeams);
}

export async function drpTeams_change(event) {

	let wTeamKey = event.target.value;
	let wSurname = null;
	let wFirstName = null;

	$w('#imgWait').show();
	$w('#txtTeamId').text = wTeamKey;
	$w('#lblSaveMsg').hide();
	//let wTeam = await getLeagueTeam(wId);
	let wTeam = await findTeamByKey(wTeamKey);
	if (wTeam) { 
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	$w('#cstrpSquad').expand();
	$w('#btnSquadUp').scrollTo();

	await loadTeamSquadRepeaters();
}

export async function btnChangeTeam_click(event) {
	$w('#cstrpSquad').collapse();
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
	//let wTeam = await getLeagueTeam(wId);
	let wTeam = await findTeamByKey(wTeamKey);
	if (wTeam) { 
		gTeam = wTeam;
		[wSurname, wFirstName, gTeam.managerName, gTeam.managerEmail, gTeam.managerPhone] = await getName(wTeam.managerId);
	}
	await loadTeamSquadRepeaters(); 
}

//----------------------------------------------- SELECT SUPPORTING FUNCTIONS --------------------------------

function closeExit(pKey) { 
	const msg = [
		"I'm sorry, but you must be signed on to access this information",
		"You have not yet been registered with a team. Please contact a team captain to ask to join that team.",
		"This facility is only to be used by Managers and Team Captains",
		"There are no teams defined",
		"You have not been registered with any teams"
	]
	$w('#lblMessage').text = msg[pKey - 1];
	$w('#cstrpError').expand();
	$w('#cstrpButtons').expand();
}

//===================================================== SQUAD STRIP =================================================
//
export function chkSquadItem_click(event) {
	let wCount = countSquadSelectedItems();
	switch (wCount) {
		case 0:
			$w('#btnSquadPlayersDelete').collapse();
			break;
		case 1:
			$w('#btnSquadPlayersDelete').expand();
			break;
		default:
			$w('#btnSquadPlayersDelete').expand();
			break;
	}
}

export function btnSquadPlayersAdd_click(event) {

	const wGender  = $w('#rgpGender').value;
	const wCount = $w('#rptSquad').data.length;
	/** 
	 * if lstTeamSquad is empty for team, then count = 0, else it is 2 or higher, cos of header row
	 */
   	let wParams = {
		"seeds": "N",
	   	"mix": wGender,
	   	"type": 1,
	   	"noTeams": 30
   	}
   	$w('#boxErrorMsg').collapse();
   // {member} is {_id, memberId, firstName, surname, player, temNames, comPref, emailAddress, mobilePhone, homePhone}
	wixWindow.openLightbox("lbxSelectManyMembers", wParams)
	.then ( wMembers => {
		if (wMembers) {
			if (wMembers.length > 0) {
				$w('#cstrpButtons').expand();
				$w('#lblSaveMsg').hide();
				$w('#rptSquad').expand();
				$w('#boxNoSquad').collapse();
				$w('#boxSquadList').expand();
				let wDuplicates = [];
				let wNew = [];
				if (wCount === 0) { 
					initialiseTable(wMembers);
				} else {
					wDuplicates = appendTable(wMembers);
				}
				renumberSquad();
				if (wDuplicates.length > 0){ 
					let wList = "";
					if (wDuplicates.length === 1) {
						wList = wDuplicates[0].player + " already exists in the squad";
					} else { 
						for (let i = 0; i < wDuplicates.length; i++) {  
							if (i === wDuplicates.length-1) { 
								wList = wList + wDuplicates[i].player;
							} else {
								wList = wList + wDuplicates[i].player + ", ";
							}
						}
						wList = wList + " already exist in the squad";
					}
					$w('#lblErrorMsg').text = wList;
					$w('#lblErrorMsg').show();
					$w('#boxErrorMsg').expand();
				}
				//console.log("Add");
				//console.log($w('#rptSquad').data);
				if ($w('#rptSquad').data.length !== wCount) { 
					saveSquadChanges(gTeam.teamKey, $w('#rptSquad').data);
				}
			}
		}
	})
}

export async function btnSquadPlayersDelete_click(event) {
	let wSquad = $w('#rptSquad').data;
	$w('#boxErrorMsg').collapse();
	let wToDelete = [];
	let wDeleteList = [];
	$w('#rptSquad').forEachItem(($item,itemData, index) => {
		if ($item('#chkSquadItem').checked) { 
			let wDel = wSquad[index];
			wToDelete.unshift(wDel._id);
			wDeleteList.unshift(index);
		}
	});
	for (let wIndex of wDeleteList) { 
		let wX = wSquad.splice(wIndex,1);
	}
	let res = await bulkDeleteTeamSquad(wToDelete);
	let wText = "Delete complete: Deletes (" + String(res.removed) + ") Skipped (" + String(res.skipped) +
				 ") Errors (" + String(res.errors.length) + ")";
	$w('#btnSquadPlayersDelete').collapse();

	$w('#rptSquad').data = [];
	$w('#rptSquad').data = wSquad;
	renumberSquad();
}

export async function btnSquadPlayersLoadAll_click(event) {
	const wGender  = $w('#rgpGender').value;
	const wCount = $w('#rptSquad').data.length;

   	$w('#boxErrorMsg').collapse();

	$w('#imgWait').show();

	let [status, wMembers] = await getAllMembers();
	// {}
	let wPlayingMembers = wMembers.filter ( item => item.type === "Full");
	let wMembersOfType = wPlayingMembers;
	if (wGender !== "X") { 
		wMembersOfType = wPlayingMembers.filter (item => item.gender === wGender);
	}
	if (wMembersOfType) {
		if (wMembersOfType.length > 0) { 
			$w('#cstrpButtons').expand();
			$w('#lblSaveMsg').hide();
			$w('#rptSquad').expand();
			$w('#boxNoSquad').collapse();
			$w('#boxSquadList').expand();
			let wDBSet = wMembersOfType.map ( (item, index) => {
				return {
					_id: gTeam.teamKey + String(wCount + index + 1),
					teamId: gTeam._id,
					memberId: item.id,
					teamKey: gTeam.teamKey,
					player: item.player, 
					numPlayed: 0,
					contactpref: item.contactpref,
					email: item.email,
					mobilePhone: item.mobilePhone,
					homePhone: item.homePhone,
					emailSent: false
				}
			})
			if (wCount === 0) { 
				initialiseTable(wDBSet);
			} else {
				appendTable(wDBSet);
			}
			renumberSquad();

			if ($w('#rptSquad').data.length > 0) { 
				saveSquadChanges(gTeam.teamKey, $w('#rptSquad').data);
			}
		}
	}
	$w('#imgWait').hide();

}
//-----------------------------------------------SQUAD SUPPORTING FUNCTIONS -----------------------------------------

function countSquadSelectedItems() {
	let count = 0;
	$w('#rptSquad').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkSquadItem').checked) { count++ }
	})
	return count;
}

function renumberSquad(){
	$w('#rptSquad').forEachItem( ($item, itemData, index) => {
		if (index > 0) {
			$item('#txtSquadPos').text = String(index);
		}
	}); // grid repeat
}

function checkDuplicates(pMembers){

	let wSquad = $w('#rptSquad').data;
	let i = 0;
	let wDuplicates = [];
	let wInserts = [];
	for (let wMember of pMembers) {
		let wTemp = wSquad.filter (item => item.memberId === wMember.memberId);
		if (wTemp.length > 0) {
			wDuplicates.push(wMember);
		} else {
			wInserts.push(wMember);
		}
	}
	return [wInserts, wDuplicates];
}

export function initialiseTable(pMembers){
	const first = {"_id": gTeam.teamKey + "0", "name": ""};
	if (pMembers.length > 0) { 
		let wPlayers = pMembers.map ( (item, index) => {
			return {
				_id: gTeam.teamKey + String(index+1),
				teamId: gTeam._id,
				memberId: item.memberId,
				teamKey: gTeam.teamKey,
				name: item.player, 
				numPlayed: 0,
				comPref: item.comPref,
				emailAddress: item.emailAddress,
				mobilePhone: item.mobilePhone,
				homePhone: item.homePhone,
				emailSent: false
			}
		})
		let wSortedPlayers = _.sortBy(wPlayers, ['name']);

		wSortedPlayers.unshift(first);

		$w('#rptSquad').data = wSortedPlayers;
	} else {
		$w('#rptSquad').data = [];
	}
}

export function appendTable(pMembers){
	let wCurrentSquad = $w('#rptSquad').data;
	let first = wCurrentSquad.shift();
	let count = wCurrentSquad.length;

	let [wSetToInsert, wDuplicates] = checkDuplicates(pMembers);
	let wPlayers = [];
	if (wSetToInsert.length  > 0) {
		wPlayers = wSetToInsert.map ( (item, index) => { 
			return {
				_id: gTeam.teamKey + String(count + index + 1),
				teamId: gTeam._id,
				memberId: item.memberId,
				teamKey: gTeam.teamKey,
				name: item.player, 
				numPlayed: 0,
				comPref: item.comPref,
				emailAddress: item.emailAddress,
				mobilePhone: item.mobilePhone,
				homePhone: item.homePhone,
				emailSent: false
			}
		})
	}
	let wNewSquad = wCurrentSquad.concat(wPlayers);

	//sortBy(wNewSquad, {prop: "name"});
	let wNewSortedSquad = _.sortBy(wNewSquad, ['name']);

	wNewSortedSquad.unshift(first);
	
	//$w('#rptSquad').data = [];
	$w('#rptSquad').data = wNewSortedSquad; //not refresh, cos size of table can go up and down
	return wDuplicates;
}
//===================================================== BUTTONS STRIP ===============================================
//

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export function btnClose_click(event) {
	wixLocation.to("/");
}
