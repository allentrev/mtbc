import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';
import wixLocation 				from 'wix-location';
//import * as AWS from 'aws-sdk';
//import { sms } from 'simple-sms'; 

import _ 						from 'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } 		from 'public/objects/member';


import { getNewestLeagues }	from	'backend/backTeam.jsw';
import { getNewestTeams }	from	'backend/backTeam.jsw';
import { saveRecord } from 'backend/backEvents.jsw';

import { findLstMember } 		from 	'public/objects/member';

import { sendSMS }				from 	'backend/sendSMS.jsw';
import { getTinyURL }			from 	'backend/sendSMS.jsw';

import { ROLES }   				from	'public/objects/member';


//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity } from 'public/objects/entity';
import { MODE } from 'public/objects/entity';
import { btnCreate_click, btnUpdate_click, btnDelete_click, btnCancel_click, btnCancellation_click } from 'public/objects/entity';
import { chkSelect_click,chkSelectAll_click, btnTop_click,doPgnListClick } from 'public/objects/entity';
import { doInpListNoPerPageChange } from 'public/objects/entity';
import { resetCommands, resetSection, getSelectStackId }  from 'public/objects/entity';
import { resetPagination, updatePagination } from 'public/objects/entity';
import { showError, updateGlobalDataStore, deleteGlobalDataStore } from 'public/objects/entity';
import { getTarget, getTargetItem, configureScreen} from 'public/objects/entity';
import { showWait, hideWait, getMode, setMode } from 'public/objects/entity';
import { getSelectStack, getSelectedItem} from 'public/objects/entity';
import { showGoToButtons, hideGoToButtons, populateEdit } from 'public/objects/entity';
//import { } from 'public/objects/entity';

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E"
});


let gRole = "";

let gGender = "L";
let gTeams = [];
let gTeam;

let gMode = "";

let gEvent = [];

//-----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();
const gYear = new Date().getFullYear();

$w.onReady(async function () {

    try {
        let status;

		let wRptTeamsFirst = {
			"_id": "1",
			"name": "Headerline"
		}
    
        //$w('#lblHdr1').text = `The following table summarises something....${gYear} season`;
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

        // end of esting fudge---------------
        [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
        if (isLoggedIn) {
            let wRoles = loggedInMemberRoles.toString();
            console.log("/page/MaintainTeam onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/MaintainTeam onReady Not signed in");
			showError("Team", 28);
			setTimeout(() => {
				wixLocation.to("/");
			}, 2000);
        }

        if (wixWindow.formFactor === "Mobile") {
            $w('#strTeam').collapse();
            $w('#strMobile').expand();
        } else {
            $w('#strMobile').collapse();
            $w('#strTeam').expand();
            $w('#inpTeamListNoPerPage').value = "15";
            $w('#inpLeagueListNoPerPage').value = "15";
            await loadListData();
            //await loadEventsDropDown();
            $w('#rgpLeagueChoice').value = "A";
            $w('#rgpTeamChoice').value = "A";
            await populateTeamEditDropDowns();

        
        }

        // Event Section event handlers
        $w('#strTeam').onViewportEnter ((event) => strTeam_viewportEnter(event));
        $w('#btnTeamACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnTeamAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnTeamADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnTeamASave').onClick((event) => btnTeamASave_click(event));
        $w('#btnTeamACancel').onClick((event) => btnCancel_click(event));
        $w('#btnTeamAToLeague').onClick((event) => doBtnTeamAToLeagueClick(event));
        //$w('#btnTeamACancellation').onClick((event) => doBtnCancellationClick(event));
        $w('#btnTeamEditManagerAdd').onClick((event) => btnTeamEditManagerAdd_click(event));
        $w('#btnTeamEditDayCaptainAdd').onClick((event) => btnTeamEditDayCaptainAdd_click(event));
        $w('#btnTeamEditManagerClear').onClick((event) => btnTeamEditManagerClear_click(event));
        $w('#btnTeamEditDayCaptainClear').onClick((event) => btnTeamEditDayCaptainClear_click(event));
		
        //$w('#drpTeamEditLeague').onClick((event) => drpTeamEditLeagueClick(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkTeamListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkTeamListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnTeamListTop').onClick((event) => btnTop_click(event));
        $w('#rgpTeamChoice').onChange((event) => drpTeamChoiceChange(event));
        $w('#rgpTeamEditGender').onChange((event) => drpTeamEditGenderChange(event));
		
        $w('#pgnTeamList').onClick((event) => doPgnListClick(event));
        $w('#inpTeamListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        //$w('#drpTeamEditRinks').onChange((event) => doDrpTeamtEditRinksChange(event));

        // League Section event handlers
        $w('#strLeague').onViewportEnter ((event) => strTeam_viewportEnter(event));
        $w('#btnLeagueACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnLeagueAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnLeagueADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnLeagueASave').onClick((event) => btnLeagueASave_click(event));
        $w('#btnLeagueACancel').onClick((event) => btnCancel_click(event));
        $w('#btnLeagueAToTeam').onClick((event) => doBtnLeagueAToTeamClick(event));
        //$w('#btnTeamACancellation').onClick((event) => doBtnCancellationClick(event));
        //$w('#drpTeamEditLeague').onClick((event) => drpTeamEditLeagueClick(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkLeagueListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkLeagueListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnLeagueListTop').onClick((event) => btnTop_click(event));
        $w('#rgpLeagueChoice').onChange((event) => drpLeagueChoiceChange(event));
        $w('#pgnLeagueList').onClick((event) => doPgnListClick(event));
        $w('#inpLeagueListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        //$w('#drpTeamEditRinks').onChange((event) => doDrpTeamtEditRinksChange(event));

        // Repeaters section
		$w('#rptTeamList').onItemReady(($item, itemData, index) => {
			loadRptTeamList($item, itemData, index);
		});
		$w('#rptLeagueList').onItemReady(($item, itemData, index) => {
			loadRptLeagueList($item, itemData, index);
		});
  		//-------------------------- Custom Validation -----------------------------------------		

		$w('#inpLeagueEditLeagueName').onCustomValidation( (value, reject) => {
			let wValue = String(value);
			if (wValue.length < 5 ) {
				reject ("League Name > 4 characters");
			}
		})

		$w('#inpTeamEditTeamName').onCustomValidation( (value, reject) => {
			let wValue = String(value);
			if (wValue.length < 5 ) {
				reject ("Team Name > 4 characters");
			}
		})

		$w('#inpLeagueEditLeagueKey').onCustomValidation( (value, reject) => {
			let wValue = value.toUpperCase();
			if (getMode() === MODE.CREATE){
				if (wValue.length < 2 ) {
					reject ("League Key > 1 character");
				}
				let wLeagues = getEntity("League");
				let wLeague = wLeagues.filter ( item => item.leagueKey === wValue);
				if (wLeague[0]) {
					reject ("Key must be unique");
				}
			}
		})
		
		$w('#inpTeamEditTeamKey').onCustomValidation( (value, reject) => { 
			let wValue = value.toUpperCase();
			if (getMode() === MODE.CREATE){ 
				if (wValue.length < 2 ) {
					reject ("Team Key > 1 character");
				}
				let wTeams = getEntity("Team"); 
				let wTeam = wTeams.filter ( item => item.teamKey === wValue);
				if (wTeam[0]) {
					reject ("Key must be unique");
				}
			}
		})
    }

	catch (err) {
		console.log("/page/MaintainTeam onReady Try-catch, err");
		console.log(err);
		//wixLocation.to("/syserror");
	}
});

// ------------------------------------------------ Load Data ---------------------------------------------------------
//
export async function loadListData () {
	try {

		let wResult = await getNewestTeams();
        let wTeams = wResult.teams;
		setEntity("Team", [...wTeams]);

		
		wResult = await getNewestLeagues();
        let wLeagues = wResult.leagues;
		setEntity("League", [...wLeagues]);
		if (wLeagues && wLeagues.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#boxLeagueChoice').expand();
			$w('#boxLeagueList').expand();
			$w('#boxLeagueNone').collapse();
			$w('#boxLeagueEdit').collapse();
			$w('#boxLeaguePrime').collapse();
			//await doLeagueView("");
			resetPagination("League");
			$w('#secLeague').collapse();
			$w('#secTeam').expand();
			$w('#secMobile').collapse();
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#boxLeagueChoice').collapse();
			$w('#boxLeagueList').collapse();
			$w('#boxLeagueNone').expand();
			$w('#boxLeagueEdit').collapse();
			$w('#boxLeaguePrime').collapse();
			$w('#secLeague').expand();
			$w('#secTeam').collapse();
			$w('#secMobile').collapse();
		}

		if (wTeams && wTeams.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#boxTeamChoice').expand();
			$w('#boxTeamList').expand();
			$w('#boxTeamNone').collapse();
			$w('#boxTeamEdit').collapse();
			$w('#boxTeamPrime').collapse();
			await doTeamView("");
			resetPagination("Team");
			$w('#secLeague').collapse();
			$w('#secTeam').expand();
			$w('#secMobile').collapse();
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#boxTeamChoice').collapse();
			$w('#boxTeamList').collapse();
			$w('#boxTeamNone').expand();
			$w('#boxTeamEdit').collapse();
			$w('#boxTeamPrime').collapse();
		}
	}

	catch (err) {
		console.log("/page/MaintainTeam loadListData Try catch, err");
		console.log(err);
	}
}
// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//

async function loadRptTeamList($item, itemData, index) {
		//console.log("Team");
		//console.log(itemData);
	if (index === 0) {
		$item('#txtTeamListGender').text = "Gender";
		$item('#txtTeamListTeamKey').text  = "Key";
		$item('#txtTeamListLeagueName').text  = "League";
		$item('#txtTeamListDivision').text  = "Division";
		$item('#txtTeamListTeamName').text  = "Team Name";
		$item('#lblTeamListManagerId').text   = "";
		$item('#txtTeamListManager').text  = "Team Manager";
		$item('#lblTeamListDayCaptainId').text   = "";
		$item('#txtTeamListDayCaptain').text  = "Day Captain";
		$item('#chkTeamListSelect').checked = false;
		$item('#chkTeamListSelect').hide();
	} else { 
		$item('#txtTeamListGender').text = itemData.gender;
		$item('#lblTeamListTeamKey').text  = itemData.teamKey;
		$item('#txtTeamListLeagueName').text  = itemData.leagueName;
		if (itemData.division === 0) { 
			$item('#txtTeamListDivision').text  = "";
		} else { 
			$item('#txtTeamListDivision').text  = String(itemData.division);
		}
		$item('#txtTeamListTeamName').text  = convertNulls(itemData.teamName);
		$item('#lblTeamListManagerId').text  = itemData.managerId;	
		$item('#txtTeamListManager').text  = await resolveName(itemData.managerId);
		$item('#lblTeamListDayCaptainId').text  = itemData.dayCaptainId;	
		$item('#txtTeamListDayCaptain').text  = await resolveName(itemData.dayCaptainId);
		$item('#chkTeamListSelect').checked = false;
	}
}

async function resolveName(pId){
	let wTempHolder = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd";
	let wName = "Vacant";
	if (pId !== wTempHolder){
		wName = await getName(pId);
	} 
	return wName;
}

async function loadRptLeagueList($item, itemData, index) {
	let wDivision = (itemData.division === 0) ? "" : String(itemData.division);
	if (index === 0) {
		$item('#lblLeagueListLeagueKey').text = "Key";
		$item('#lblLeagueListLeagueName').text  = "Name";
		$item('#lblLeagueListDivision').text  = "Division";
		$item('#lblLeagueListNoMatches').text  = "No. Matches";
		$item('#chkLeagueListSelect').checked = false;
		$item('#chkLeagueListSelect').hide();
	} else { 
		$item('#lblLeagueListLeagueKey').text = itemData.leagueKey;
		$item('#lblLeagueListLeagueName').text  = itemData.leagueName;
		$item('#lblLeagueListDivision').text  = wDivision;
		$item('#lblLeagueListNoMatches').text  = String(itemData.noMatches);
		$item('#chkLeagueListSelect').checked = false;
		$item('#chkLeagueListSelect').show();
	}
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {

    let wTarget = await btnCreate_click(event);
	if (wTarget === "Team") {
		await clearTeamEdit();
	} else {
		await clearLeagueEdit()
	}
}

export async function doBtnUpdateClick(event) {
    let wTarget = btnUpdate_click(event);
	if (wTarget === "Team") {
    	await populateTeamEdit();
	} else {
		await populateLeagueEdit();
	}
}

// =================================================Team Events ================================================
//
export async function drpTeamFilterType_change(event) {
    showWait("Team");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("Team");
}

export function doTeamViewChange (event) {
	let wView = event.target.value;
	doTeamView(wView);
}
export function doBtnTeamAToLeagueClick(event) {
    $w('#secTeam').collapse();
    $w('#secLeague').expand();
}

export async function drpEventEditLeagueClick (event){
    let wLeague = event.target.value;
    //console.log("League = ", wLeague);
}

export async function drpEventEditTeamClick (event){
    let wTeam = event.target.value;
    //console.log("Team = ", wTeam);

}

export async function drpTeamEditGenderChange(event) {
    let wValue = event.target.value;
	await populateTeamEditDropDowns(wValue);
}

export async function drpTeamChoiceChange(event) {
    showWait("Team");
    updatePagination("Team");
    hideWait("Team");
}

export async function btnTeamASave_click(event) {
    showWait("Team");
    let wResult;

    let wTeam = {
		"_id":	undefined,
		"teamKey": "",
		"leagueKey": "",
		"division": parseInt($w('#inpTeamEditDivision').value,10),
		"gender": $w('#rgpTeamEditGender').value,
		"teamName": $w('#inpTeamEditTeamName').value,
		"managerId": convertNulls($w('#lblTeamEditManagerId').text),
		"dayCaptainId": convertNulls($w('#lblTeamEditDayCaptainId').text),
    }
	//----------------------validate---------------------------------------
    
	if ($w('#inpTeamEditTeamKey').valid === false) {
        showError("Team", 32);
        $w('#inpTeamEditTeamKey').focus();
        $w('#btnTeamASave').enable();
        return;
    }
	
	if ($w('#inpTeamEditTeamName').valid === false) {
        showError("Team", 31);
        $w('#inpTeamEditTeamName').focus();
        $w('#btnTeamASave').enable();
        return;
	}
	
	//----------------------main section---------------------------------------
    
	switch (getMode()) { 
		case MODE.CREATE:
			wTeam._id = undefined;
			break;
		case MODE.UPDATE:
			//wClubComp._id = gSelectStack[0];
			wTeam._id = getSelectStackId();
			break;
		default:
			console.log ("/page/MaintainTeams Team Save mode = [" + getMode() + "]");
	}
	let wKey = $w('#inpTeamEditTeamKey').value;
	wTeam.teamKey = wKey.toUpperCase();
	let wLeagueKey = $w('#drpTeamEditLeague').value;
	let wLeagueBase = wLeagueKey.slice(0,2);
	if (wLeagueBase !== "FG"){ 
		wTeam.leagueKey = wLeagueKey.slice(0,-1);
	} else {
		wTeam.leagueKey = wLeagueKey; 
		wTeam.division = 0;
		$w('#inpTeamEditDivision').value = "0";
	}
	let result = await saveRecord("lstTeams", wTeam);
	
	if (result.status) {
		let updatedRecord = result.savedRecord;
		updateGlobalDataStore(updatedRecord, "Team");
		updatePagination("Team");
		showError("Team",7);
		resetCommands("Team");
	} else {
		console.log("/page/MaintainTeam btnTeamASave, save failed, error");
		console.log(result.error);
	}
	resetSection("Team");
	hideWait("Team");
	setMode( MODE.CLEAR);
}

export async function rgpTeamChoiceChange(event) {
    showWait("Team");
    updatePagination("Team");
    hideWait("Team");
}

export async function cstrpEvent_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}

export function doTeamView (pTarget) {
	if (pTarget === "P") {
		$w('#chkTeamListSelectAll').collapse();
		$w('#btnTeamListTop').collapse();
		$w('#rptTeamList').collapse();
	} else {
		$w('#chkTeamListSelectAll').expand();
		$w('#btnTeamListTop').expand();
		$w('#rptTeamList').expand();
	}
}

export function strTeam_viewportEnter(event) {
	//console.log("Viewport enter");
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}

// =================================================Team Supporting Functions =================================================
//
export function doBtnTeamToLeagueClick(event) {
    $w('#secTeam').collapse();
    $w('#secLeague').expand();
}

export async function clearTeamEdit() {
    
	if (getMode() === MODE.CREATE) {
		$w('#inpTeamEditTeamKey').enable();
	} else {
		$w('#inpTeamEditTeamKey').disable();
	}
	let wGender = $w('#rgpTeamChoice').value;
	if (wGender === "A"){
		wGender = "L";
		$w('#rgpTeamChoice').value = wGender;
		resetPagination("Team");
	}
	$w('#rgpTeamEditGender').value = wGender;
	$w('#inpTeamEditTeamKey').value = "";
	await populateTeamEditDropDowns(wGender);
	$w('#inpTeamEditDivision').value  = "0";
	$w('#inpTeamEditTeamName').value = "";
	$w('#inpTeamEditManager').value = "";
	$w('#lblTeamEditManagerId').text = "";
	$w('#inpTeamEditDayCaptain').value = "";
	$w('#lblTeamEditDayCaptainId').text = "";
}

export async function populateTeamEdit() {
    let wSelectedRecord = getSelectedItem("Team");
	let wGender = wSelectedRecord.gender;
	if (getMode() === MODE.CREATE){
		$w('#inpTeamEditTeamKey').enable();
	} else {
		$w('#inpTeamEditTeamKey').disable();
	}
	$w('#rgpTeamEditGender').value = wGender;
	let wLeagueKey = wSelectedRecord.leagueKey;
	if (wSelectedRecord.division !== 0) {
		wLeagueKey = wSelectedRecord.leagueKey + String(wSelectedRecord.division);
	}
	await populateTeamEditDropDowns(wGender);
	$w('#inpTeamEditTeamKey').value = wSelectedRecord.teamKey;
	$w('#drpTeamEditLeague').value = wLeagueKey;
	if (wSelectedRecord.division === 0 || wSelectedRecord.division === "") { 
		$w('#inpTeamEditDivision').value  = "";
	} else { 
		$w('#inpTeamEditDivision').value  = String(wSelectedRecord.division);
	}
	$w('#inpTeamEditTeamName').value = wSelectedRecord.teamName;

	if (wSelectedRecord.managerId) {
		$w('#inpTeamEditManager').value = convertNulls(await getName(wSelectedRecord.managerId));
		$w('#lblTeamEditManagerId').text = wSelectedRecord.managerId;
	} else {
		$w('#inpTeamEditManager').value = "";
		$w('#lblTeamEditManagerId').text = "";
	}
	if (wSelectedRecord.dayCaptainId) {
		$w('#inpTeamEditDayCaptain').value = convertNulls(await getName(wSelectedRecord.dayCaptainId));
		$w('#lblTeamEditDayCaptainId').text = wSelectedRecord.dayCaptainId;
	} else {
		$w('#inpTeamEditDayCaptain').value = "";
		$w('#lblTeamEditDayCaptainId').text = "";
	}
}

async function populateTeamEditDropDowns(pGender) {
	let wOptions = [{
			"label": "None found",
			"value": "0"
	}]
	let wLeagues = getEntity("League");
	let wLeaguesSelected = wLeagues.filter( item => item.gender === pGender);
	if (wLeaguesSelected.length > 0 ){
		wOptions = wLeaguesSelected.map ( item => {
			let wLabel = ""
			let wValue = "";
			if (item.division === 0) {
				wLabel = item.leagueName;
				wValue = item.leagueKey;
			} else {
				wLabel = item.leagueName + " Div " + String(item.division); 
				wValue = item.leagueKey + String(item.division);
			}
			return {
				"label": wLabel,
				"value": wValue
			}
		})
	}
	let wFirst = wOptions[0];
	let wValue = wFirst.value;
    $w('#drpTeamEditLeague').options = wOptions;
    $w('#drpTeamEditLeague').value = wValue;
}


export function btnTeamEditManagerClear_click(event) {
	$w('#inpTeamEditManager').value = "";
	$w('#lblTeamEditManagerId').text = "";
}

export function btnTeamEditDayCaptainClear_click(event) {
	$w('#inpTeamEditDayCaptain').value = "";
	$w('#lblTeamEditDayCaptainId').text = "";
}

export async function btnTeamEditManagerAdd_click(event) {
	let member = await wixWindow.openLightbox("lbxSelectMember");
	if (member) {
		$w('#inpTeamEditManager').value = member.fullName;
		$w('#lblTeamEditManagerId').text = member.id;
	} else {
		$w('#inpTeamEditManager').value = "";
		$w('#lblTeamEditManagerId').text = "";
	}
}

export async function btnTeamEditDayCaptainAdd_click(event) {
	let member = await wixWindow.openLightbox("lbxSelectMember");
	if (member) {
		$w('#inpTeamEditDayCaptain').value = member.fullName;
		$w('#lblTeamEditDayCaptainId').text = member.id;
	} else {
		$w('#inpTeamEditDayCaptain').value = "";
		$w('#lblTeamEditDayCaptainId').text = "";
	}
}

async function getName (pId) {
	if (pId === "") { return ""}
	let wPerson = await findLstMember(pId);
	if (wPerson) { 
		return wPerson.firstName + " " + wPerson.surname;
	}
	return "";
}

//**************************OLD TEAM CODE************************************************************************************************ */
//@@@@


export function convertNulls(pIn) {
  	//convert a null or equivalent into a X so that the dropdown displays blank
  	if (pIn === "" || pIn === " " || pIn === null  || typeof pIn === 'undefined') {
    	pIn = "";
  	}
  	return pIn;
}

export async function btnTest_click(event) {
	let wTest = "http://www.maidenheadtownbc.com/manage-team/players?res='Y'&teamKey='RSA'&eid='1234'&mid='2345'";
	let wTiny = await getTinyURL(wTest);
	//console.log("Tiny URL = ", wTiny);
	let wMsg = `Dear Tim. Here is a test message. Press here if you can play this match:\n ${wTiny}\n or here if you cannot:\n ${wTiny}`;
	let wNumber = "+6593210160";
	//let wNumber = "+447833451283";
	let res = await sendSMS(wNumber, wMsg);

	//const sms = require("simple-sms");
	//console.log("Before init");
	/**
	sms.init({ accessKeyId: "ASIAW3MECX2CKJPEF346",
			 secretAccesskey: "EZeUEOGLe5zWdAtnfXf0s4HzYjM0hnKoxmCu4QXl",
			 awsRegion: "eu-west-1" });
	console.log("after init");
	sms.send({ message: "Hello World!",
			 phoneNumber: "+6593210160",
			 senderId: "WillJ" })
		.then((result) => {
			 console.log("Sent!"); console.log(result); 
		})
		.catch((err) => {
		 console.log("eror");
		 console.log(err);
		})
	*/
}

// =================================================League Events ================================================
//

export async function drpLeagueChoiceChange(event) {
    showWait("League");
    updatePagination("League");
    hideWait("League");
}

export async function btnLeagueASave_click(event) {
    showWait("League");


    let wLeague = {
		"_id":	undefined,
		"leagueKey": "",
		"leagueName": $w('#inpLeagueEditLeagueName').value,
		"division": parseInt($w('#inpLeagueEditDivision').value,10),
		"noMatches": parseInt($w('#inpLeagueEditNoMatches').value,10),
		"startTime": $w('#tpkLeagueEditStartTime').value.substring(0,5),
		"duration":	parseFloat($w('#tpkLeagueEditDuration').value),
		"gender": $w('#rgpLeagueEditGender').value,
		"useType": 	$w('#rgpLeagueEditUseType').value,
		"dress": $w('#rgpLeagueEditDress').value,
		"urlResult": $w('#inpLeagueEditUrlResult').value,
		"urlLink": $w('#inpLeagueEditUrlLink').value
    }
	//----------------------validate---------------------------------------

	if ($w('#inpLeagueEditLeagueKey').valid === false) {
        showError("League", 32);
        $w('#inpLeagueEditLeagueKey').focus();
        $w('#btnLeagueASave').enable();
        return;
    }

	if ($w('#inpLeagueEditLeagueName').valid === false) {
        showError("League", 31);
        $w('#inpLeagueEditLeagueName').focus();
        $w('#btnLeagueASave').enable();
        return;
	}
	
	if ($w('#inpLeagueEditDivision').valid === false) {
        showError("League", 29);
        $w('#inpLeagueEditDivision').focus();
        $w('#btnLeagueASave').enable();
        return;
    }
	
	if ($w('#inpLeagueEditNoMatches').valid === false) {
        showError("League", 30);
        $w('#inpLeagueEditNoMatches').focus();
        $w('#btnLeagueASave').enable();
        return;
    }

	switch (getMode()) { 
		case MODE.CREATE:
			wLeague._id = undefined;
			break;
		case MODE.UPDATE:
			//wClubComp._id = gSelectStack[0];
			wLeague._id = getSelectStackId();
			break;
		default:
			console.log ("/page/MaintainTeams League Save mode = ", getMode());
	}

	let wKey = $w('#inpLeagueEditLeagueKey').value;
	wLeague.leagueKey = wKey.toUpperCase();

	let result = await saveRecord("lstLeagues", wLeague);
	if (result.status) {
		let updatedRecord = result.savedRecord;
		updateGlobalDataStore(updatedRecord, "League");
		updatePagination("League");
		showError("League",7);
		resetCommands("League");
	} else {
		console.log("/page/MaintainTeam btnTeamASave, League save failed, error");
		console.log(result.error);
	}
	resetSection("League");
	hideWait("League");
	setMode( MODE.CLEAR);
}

export async function rgpLeagueChoiceChange(event) {
    showWait("League");
    updatePagination("League");
    hideWait("League");
}


export function doLeagueView (pTarget) {
	if (pTarget === "P") {
		$w('#chkLeagueListSelectAll').collapse();
		$w('#btnLeagueListTop').collapse();
		$w('#rptLeagueList').collapse();
	} else {
		$w('#chkLeagueListSelectAll').expand();
		$w('#btnLeagueListTop').expand();
		$w('#rptLeagueList').expand();
	}
}

export function strLeague_viewportEnter(event) {
	//console.log("League Viewport enter");
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}


// =================================================Team Supporting Functions =================================================
//
export function doBtnLeagueAToTeamClick(event) {
    $w('#secTeam').expand();
    $w('#secLeague').collapse();
}


export async function clearLeagueEdit() {
    
	if (getMode() === MODE.CREATE) {
		$w('#inpLeagueEditLeagueKey').enable();
	} else {
		$w('#inpLeagueEditLeagueKey').disable();
	}

	$w('#inpLeagueEditLeagueKey').value = "";
	$w('#inpLeagueEditLeagueName').value = "";
	$w('#inpLeagueEditDivision').value  = "";
	$w('#inpLeagueEditNoMatches').value = "0";
	$w('#tpkLeagueEditStartTime').value = "10:00";
	$w('#tpkLeagueEditDuration').value = "03:00";
	$w('#rgpLeagueEditGender').value = "X";
	$w('#rgpLeagueEditUseType').value = "X";
	$w('#rgpLeagueEditDress').value = "N";
	$w('#inpLeagueEditUrlResult').value = "";
	$w('#inpLeagueEditUrlLink').value = "";
}

export async function populateLeagueEdit() {
    
    let wSelectedRecord = getSelectedItem("League");
	if (getMode() === MODE.CREATE) {
		$w('#inpLeagueEditLeagueKey').enable();
	} else {
		$w('#inpLeagueEditLeagueKey').disable();
	}
	$w('#inpLeagueEditLeagueKey').value = wSelectedRecord.leagueKey;
	$w('#inpLeagueEditLeagueName').value = wSelectedRecord.leagueName;
	$w('#inpLeagueEditDivision').value  = wSelectedRecord.division;
	$w('#inpLeagueEditNoMatches').value = wSelectedRecord.noMatches;
	$w('#tpkLeagueEditStartTime').value = wSelectedRecord.startTime;
	$w('#tpkLeagueEditDuration').value = String(wSelectedRecord.duration);
	$w('#rgpLeagueEditGender').value = wSelectedRecord.gender;
	$w('#rgpLeagueEditUseType').value = wSelectedRecord.useType;
	$w('#rgpLeagueEditDress').value = wSelectedRecord.dress;
	$w('#inpLeagueEditUrlResult').value = wSelectedRecord.urlResult;
	$w('#inpLeagueEditUrlLink').value = wSelectedRecord.urlLink;
}
