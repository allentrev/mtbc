import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';
import wixLocation 				from 'wix-location';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } from 'public/objects/member';
import _ from 'lodash';

import { saveRecord } from 'backend/backEvents.jsw';
import { bulkSaveRecords } from 'backend/backEvents.jsw';
import {loadCommittee}			from 'backend/backOfficers.jsw';
import {loadOfficers}			from 'backend/backOfficers.jsw';
import { buildMemberCache }		from 'public/objects/member';
import { getFullName }		from 'public/objects/member';

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
            console.log("/page/MaintainOfficer onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/MaintainOFFICER onReady Not signed in");
        }

        if (wixWindow.formFactor === "Mobile") {
            $w('#strDesktop').collapse();
            $w('#strMobile').expand();
        } else {

            $w('#strMobile').collapse();
            $w('#strDesktop').expand();
            await loadOfficerDropdowns();
            $w('#drpOfficerChoice').value = "MB";
            $w('#inpOfficerListNoPerPage').value = "10";

        	await buildMemberCache();
            await loadListData();

        
        }

        // Event Section event handlers
        $w('#strOfficer').onViewportEnter ((event) => strOfficer_viewportEnter(event));
        $w('#btnOfficerACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnOfficerAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnOfficerADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnOfficerASave').onClick((event) => btnOfficerASave_click(event));
        $w('#btnOfficerACancel').onClick((event) => btnCancel_click(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkOfficerListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkOfficerListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnOfficerListTop').onClick((event) => btnTop_click(event));
        $w('#drpOfficerChoice').onChange((event) => drpOfficerChoiceChange(event));
        $w('#pgnOfficerList').onClick((event) => doPgnListClick(event));
        $w('#inpOfficerListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        $w('#btnOfficerAPrimeUp').onClick((event) => doBtnPrimeUp(event));
        $w('#btnOfficerAPrimeDown').onClick((event) => doBtnPrimeDown(event));
        $w('#btnOfficerEditHolderAdd').onClick((event) => doBtnOfficerEditHolderAdd());
        $w('#btnOfficerEditHolderClear').onClick((event) => doBtnOfficerEditHolderClear());

        // Repeaters section
        $w('#rptOfficerList').onItemReady(($item, itemData, index) => {
            loadRptOfficerList($item, itemData, index);
        })
  		//-------------------------- Custom Validation -----------------------------------------		
		const validateOfficerRefKey = () => (value, reject) => {

			let wValue = String(value).toUpperCase();
			let wItem  = getEntity("Officer").find( wItem => wItem.refKey === wValue);
			if (wItem){ 
				if (getMode() === MODE.CREATE) {
					reject("RefKey already used");
				}
			} else if (wValue === "" || wValue.length < 2) {
				reject("Must be at least 3 characters in length")
			}
		}

		$w('#inpOfficerEditRefKey').onCustomValidation (validateOfficerRefKey());

    }
	catch (err) {
		console.log("/page/MaintainOfficer onReady Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
});

// ------------------------------------------------ Load Data-----------------------------------------------------------------------
//
export async function loadListData () {
	try {
		let wResult =  await loadOfficers();
        let wOfficers = wResult.officers;
		setEntity("Officer", [...wOfficers]);
		$w('#strOfficer').expand();
		if (wOfficers && wOfficers.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#boxOfficerChoice').expand();
			$w('#boxOfficerList').expand();
			$w('#boxOfficerNone').collapse();
			$w('#boxOfficerEdit').collapse();
			$w('#boxOfficerPrime').collapse();
			await doOfficerView("");
			resetPagination("Officer");
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#boxOfficerChoice').expand();
			$w('#boxOfficerList').collapse();
			$w('#boxOfficerNone').expand();
			$w('#boxOfficerEdit').collapse();
			$w('#boxOfficerPrime').collapse();
		}
	}
	catch (err) {
		console.log("/page/MaintainEvent loadListData Try catch, err");
		console.log(err);
	}
}
// ------------------------------------------------Load Repeaters ----------------------------------------------------------
//

async function loadRptOfficerList($item, itemData, index) {
    if (index === 0) {
        $item('#chkOfficerListSelect').hide();
    } else {
        let wStatus;
        let wPerson = "";
        if (itemData.holderId === "") {
            wPerson = "Vacant";
        } else {
            [wStatus, wPerson] = await getFullName(itemData.holderId);
        }
        $item('#lblOfficerListRefKey').text = itemData.refKey;
        $item('#lblOfficerListPosition').text = itemData.position;
        $item('#lblOfficerListHolderId').text = itemData.holderId;
        $item('#lblOfficerListHolder').text = wPerson;
    }
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    btnCreate_click(event);
    await clearOfficerEdit();
}
export async function doBtnUpdateClick(event) {
    btnUpdate_click(event);
    await populateOfficerEdit();
}

// ================================================= Event Events ================================================
//
export async function drpOfficerFilterType_change(event) {
    showWait("Officer");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("Officer");
}
export function doOfficerViewChange (event) {
	let wView = event.target.value;
	doOfficerView(wView);
}
export function btnOfficerAToA_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export async function doBtnOfficerEditHolderAdd() {
	let member = await wixWindow.openLightbox("lbxSelectMember");
	if (member) {
		$w('#inpOfficerEditHolder').value = member.fullName;
		$w('#lblOfficerEditHolderId').text = member.id;
	} else {
		$w('#inpOfficerEditHolder').value = "";
		$w('#lblOfficerEditHolderId').text = "";
	}
}
export async function doBtnOfficerEditHolderClear() {
	$w('#inpOfficerEditHolder').value = "";
	$w('#lblOfficerEditHolderId').text = "";
}

export async function btnOfficerASave_click(event) {
    showWait("Officer");
    $w('#btnOfficerASave').disable();

    let wResult;

    if (getMode() === MODE.PRIME) {
        let wRptOfficers = $w('#rptOfficerList').data;
        wRptOfficers.shift();     //remove heading
        if (!wRptOfficers || wRptOfficers.length === 0) { return }
        else {
            wRptOfficers.forEach( (item, index) => {
                item.order = index;
                updateGlobalDataStore(item,"Officer");

            })
           
            //let wResult = {"status": true, "items": [], "error": null};
            let wResult = await bulkSaveRecords("lstOfficers", wRptOfficers);
            if (!wResult.status) {
                console.log("/page/MaintainOfficers doOfficerASave bulk save fail, err");
                console.log(wResult.error);
            }
        }
    } else {
        let wOfficer = {
            "_id": "",
            "committee": $w('#drpOfficerChoice').value,
            "refKey": $w('#inpOfficerEditRefKey').value,
            "position": $w('#inpOfficerEditPosition').value,
            "holderId": String($w('#lblOfficerEditHolderId').text),
            "order": parseInt($w('#lblOfficerEditOrder').value,10)
        }

        //  VALIDATIONS
        if (!$w('#inpOfficerEditRefKey').valid) {
		    $w('#inpOfficerEditRefKey').updateValidityIndication();
		    $w('#inpOfficerEditRefKey').focus();
            $w('#btnOfficerASave').enable();
		    showError("Officer",35);
		    return;
	    }

        //  Main section
        switch (getMode()) { 
            case MODE.CREATE:
                wOfficer._id = undefined;
                break;
            case MODE.UPDATE:
                wOfficer._id = getSelectStackId();
                break;
            default:
                console.log ("/page/MainainOfficert btnOfficerASave invalid mode = [" + getMode() + "]");
        }
        wResult = await saveRecord("lstOfficers", wOfficer);
        //let wResult = {"status": true, "savedRecord": {"_id": 123}, "error": null}
        //let res = false;
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wOfficer._id = wSavedRecord._id;
                    showError("Officer",8);
                    break;
                case MODE.UPDATE:
                    showError("Officer",7);
                    break;
                default:
                    console.log ("/page/MaintainOfficer btnOfficertASave invalid mode = [" + getMode() + "]");
            }
            updateGlobalDataStore(wSavedRecord,"Officer");
            updatePagination("Officer");
            resetCommands("Officer");
        } else {
            if (wResult.savedRecord){
                console.log("/page/MaintainOfficer btnSave saveRecord failed, savedRecord");
                console.log(wResult.savedRecord);
            } else {
                console.log("/page/MaintainOfficer btnSave saverecord failed, error");
                console.log(wResult.error);
            }
        }
    }
    resetSection("Officer");
    $w('#btnOfficerASave').enable();
    $w('#btnOfficerASave').label = "Save";
    hideWait("Officer");
	setMode(MODE.CLEAR);
}

export function doBtnPrimeUp(event){
    doRowMove("Up");
}

function doRowMove(pDirection){
    setMode(MODE.PRIME);
    $w('#btnOfficerASave').label = "Order";
    $w('#btnOfficerASave').show();
    $w('#btnOfficerAUpdate').hide();
    $w('#btnOfficerADelete').hide();
    let wData = $w('#rptOfficerList').data;
    if (parseInt($w('#inpOfficerListNoPerPage').value,10) < wData.length) {
        showError("Officer", 6);
        $w('#inpOfficerListNoPerPage').focus();
        return false;
    }
    let wItem = getSelectedItem("Officer");
    let wIndex = wData.findIndex(element => element._id === wItem._id);
    let wStatus = false;
    if (pDirection === "Up") {
        wStatus = moveElementUp(wData,wIndex);
    } else {
        wStatus = moveElementDown(wData,wIndex);
    } 
    if (wStatus) {
        updateRptOfficer(wData);
    }
}

function updateRptOfficer(pData){
    $w('#rptOfficerList').data = [];
    $w('#rptOfficerList').data = pData;
}

// Function to move an element up by one position
function moveElementUp(array, index) {
    if (index > 1 && index < array.length) {    //the first row has got the heading in it
        const temp = array[index];
        array[index] = array[index - 1];
        array[index - 1] = temp;
        return true; // Element moved successfully
    }
    return false; // Element cannot be moved up
}

// Function to move an element down by one position
function moveElementDown(array, index) {
    if (index >= 0 && index < array.length - 1) {
        const temp = array[index];
        array[index] = array[index + 1];
        array[index + 1] = temp;
        return true; // Element moved successfully
    }
    return false; // Element cannot be moved down
}

export function doBtnPrimeDown(event){
    doRowMove("Down");
}

export async function drpOfficerChoiceChange(event) {
    showWait("Officer");
    updatePagination("Officer");
    hideWait("Officer");
}

export async function strOfficer_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doOfficerView (pTarget) {
    $w('#chkOfficerListSelectAll').expand();
    $w('#btnOfficerListTop').expand();
    $w('#rptOfficerList').expand();
}
// ================================================= Event Supporting Functions =================================================
//
export async function clearOfficerEdit() {

    let wOfficers = getEntity("Officer");
    let wChoices = $w('#rptOfficerList').data;
    $w('#inpOfficerEditRefKey').enable();
    
    $w('#lblOfficerEditCommittee').value = $w('#drpOfficerChoice').value;
    $w('#inpOfficerEditRefKey').value = "";
    $w('#inpOfficerEditPosition').value = "";
    $w('#inpOfficerEditHolder').value = "";
    $w('#lblOfficerEditHolderId').text = "";
    $w('#lblOfficerEditOrder').value = String(wChoices.length-1);
}

export async function populateOfficerEdit() {
    
    let wSelectedRecord = getSelectedItem("Officer");
    let [wStatus, wPerson] = await getFullName(wSelectedRecord.holderId);

    $w('#inpOfficerEditRefKey').disable();

    $w('#lblOfficerEditCommittee').value = $w('#drpOfficerChoice').value;
    $w('#inpOfficerEditRefKey').value = wSelectedRecord.refKey;
    $w('#inpOfficerEditPosition').value = wSelectedRecord.position;
    $w('#inpOfficerEditHolder').value = wPerson;
    $w('#lblOfficerEditHolderId').text = wSelectedRecord.holderId;
    $w('#lblOfficerEditOrder').value = String(wSelectedRecord.order - 1);
}

export function loadOfficerDropdowns1(){

    let wOptions = [
        {"value": "Management Committee", "label": "MB"},
        {"value": "", "label": "MC"},
        {"value": "", "label": "LC"},
        {"value": "", "label": ""},
        {"value": "", "label": ""},
    ]
    $w('#drpOfficerChoice').options = wOptions;
}

async function loadOfficerDropdowns() {
	let wResult = await loadCommittee();
	if (wResult.status){
	    $w('#drpOfficerChoice').options = wResult.committees;
	    $w('#drpOfficerChoice').value = "MB";
	} else {
		console.log("/page/MaintainOfficers loadOfficerDropDowns error reading committee list");
	}
}
