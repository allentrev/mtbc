import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';
import wixLocation 				from 'wix-location';
import wixSiteFrontend from 'wix-site-frontend';
import _ from 'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';

import { saveRecord } from 'backend/backEvents.jsw';
import { bulkSaveRecords } from 'backend/backEvents.jsw';
import {loadReferenceData}			from 'backend/backSystem.jsw';

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

let gNoRefItems = 0;
let loggedInMember;
let loggedInMemberRoles;

// for testing ----------------------------------------------------------------------------------------------------
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
            console.log("/page/MaintainReferenceData onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/MaintainReferenceData onReady Not signed in");
        }

        if (wixWindow.formFactor === "Mobile") {
            $w('#strDesktop').collapse();
            $w('#strMobile').expand();
        } else {

            $w('#strMobile').collapse();
            $w('#strDesktop').expand();
            await loadStandingDataDropdowns();
            $w('#drpStandingDataChoice').value = "A";
            $w('#inpStandingDataListNoPerPage').value = "15";

            await loadListData();
       
        }

        // Event Section event handlers
        $w('#strStandingData').onViewportEnter ((event) => strStandingData_viewportEnter(event));
        $w('#btnStandingDataACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnStandingDataAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnStandingDataADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnStandingDataASave').onClick((event) => btnStandingDataASave_click(event));
        $w('#btnStandingDataACancel').onClick((event) => btnCancel_click(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkStandingDataListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkStandingDataListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnStandingDataListTop').onClick((event) => btnTop_click(event));
        $w('#drpStandingDataChoice').onChange((event) => drpStandingDataChoiceChange(event));
        $w('#pgnStandingDataList').onClick((event) => doPgnListClick(event));
        $w('#inpStandingDataListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));

        // Repeaters section
        $w('#rptStandingDataList').onItemReady(($item, itemData, index) => {
            loadRptStandingDataList($item, itemData, index);
        })
  		//-------------------------- Custom Validation -----------------------------------------		

		const validateStandingDataRefKey = () => (value, reject) => {

			let wValue = String(value).toUpperCase();
			let wItem  = getEntity("StandingData").find( wItem => wItem.refKey === wValue);
			if (wItem){ 
				if (getMode() === MODE.CREATE) {
					reject("RefKey already used");
				}
			} else if (wValue === "" || wValue.length < 5) {
				reject("Must be at least 5 characters in length")
			} else if (!wValue.startsWith("SD")) {
                reject("Must start with the letters SD");
            }
		}

		$w('#inpStandingDataEditRefKey').onCustomValidation (validateStandingDataRefKey());
    }
	catch (err) {
		console.log("/page/MaintainReferenceData onReady Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
});

// ------------------------------------------------ Load Data-----------------------------------------------------------------------
//
export async function loadListData () {
	try {
		let wResult =  await loadReferenceData();
        let wReferenceData = wResult.refData;

        let wStandingData = wReferenceData.filter ( item => (item.refKey && item.refKey.includes("SD")))
		setEntity("StandingData", [...wStandingData]);
		$w('#strStandingData').expand();
        gNoRefItems = wStandingData.length;

		if (wStandingData && wStandingData.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#boxStandingDataChoice').expand();
			$w('#boxStandingDataList').expand();
			$w('#boxStandingDataNone').collapse();
			$w('#boxStandingDataEdit').collapse();
			$w('#boxStandingDataPrime').collapse();
			await doStandingDataView("");
			resetPagination("StandingData");
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#boxStandingDataChoice').expand();
			$w('#boxStandingDataList').collapse();
			$w('#boxStandingDataNone').expand();
			$w('#boxStandingDataEdit').collapse();
			$w('#boxStandingDataPrime').collapse();
		}
	}
	catch (err) {
		console.log("/page/MaintainReferenceData loadListData Try catch, err");
		console.log(err);
	}
}
// ------------------------------------------------Load Repeaters ----------------------------------------------------------
//

async function loadRptStandingDataList($item, itemData, index) {
    if (index === 0) {
        $item('#chkStandingDataListSelect').hide();
    } else {
        $item('#drpStandingDataListWebPage').value = itemData.webPage;
        $item('#lblStandingDataListRefKey').text = itemData.refKey;
        $item('#lblStandingDataListName').text = itemData.name;
        $item('#lblStandingDataListValue').text = itemData.value;
    }
}
// ------------------------------------------------Load Dropdowns---------------------------------------------------------
//

export async function loadStandingDataDropdowns(){

    let wFirstRow = {"value": "A", "label": "All"};

    let wSiteMap = await wixSiteFrontend.getSiteStructure();
    let wPages = wSiteMap.pages;
    let wSortedPages = _.sortBy(wPages, ["name"]);
    let wOptions = wSortedPages.map ( item => {
        return {
            "label": item.name,
            "value": item.name
        }
    })
    wOptions.unshift(wFirstRow);

    $w('#drpStandingDataChoice').options = wOptions;
    $w('#drpStandingDataEditWebPage').options = wOptions;
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    btnCreate_click(event);
    await clearStandingDataEdit();
}
export async function doBtnUpdateClick(event) {
    btnUpdate_click(event);
    await populateStandingDataEdit();
}

// ================================================= Event Events ================================================
//
export async function drpStandingDataFilterType_change(event) {
    showWait("StandingData");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("StandingData");
}
export function doStandingDataViewChange (event) {
	let wView = event.target.value;
	doStandingDataView(wView);
}
export function btnStandingDataAToA_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}

export async function btnStandingDataASave_click(event) {
    showWait("StandingData");
    $w('#btnStandingDataASave').disable();

    let wResult;
    //-------------------------------------Validations----------------------------------------------
	if (!$w('#inpStandingDataEditRefKey').valid) {
		$w('#inpStandingDataEditRefKey').updateValidityIndication();
		$w('#inpStandingDataEditRefKey').focus();
		showError("StandingData",33);
        $w('#btnStandingDataASave').enable();
		return;
	}
	if (!$w('#inpStandingDataEditName').valid) {
		$w('#inpStandingDataEditName').updateValidityIndication();
		$w('#inpStandingDataEditName').focus();
        $w('#btnStandingDataASave').enable();
		return;
	}
	if (!$w('#inpStandingDataEditValue').valid) {
		$w('#inpStandingDataEditValue').updateValidityIndication();
		$w('#inpStandingDataEditValue').focus();
        $w('#btnStandingDataASave').enable();
		showError("StandingData",34);
		return;
	}

    //-------------------------------------Main------------------------------------------------------
    if (getMode() === MODE.PRIME) {
        let wRptStandingData = $w('#rptStandingDataList').data;
        wRptStandingData.shift();     //remove heading
        if (!wRptStandingData || wRptStandingData.length === 0) { return }
        else {
            wRptStandingData.forEach( (item, index) => {
                item.order = index;
                updateGlobalDataStore(item,"StandingData");

            })
           
            //let wResult = {"status": true, "items": [], "error": null};
            let wResult = await bulkSaveRecords("lstSettings", wRptStandingData);
            if (!wResult.status) {
                console.log("/page/MaintainReferenceData doStandingDataASave bulk save fail, err");
                console.log(wResult.error);
            }
        }
    } else {
        let wStandingData = {
            "_id": "",
            "title": $w('#inpStandingDataEditRefKey').value.toUpperCase(),
            "webPage": $w('#drpStandingDataChoice').value,
            "refKey": $w('#inpStandingDataEditRefKey').value.toUpperCase(),
            "name": $w('#inpStandingDataEditName').value,
            "value": $w('#inpStandingDataEditValue').value
        }

        //  VALIDATIONS
        let wItemNo = $w('#inpStandingDataEditRefKey').value.substring(2);
        let wNoRefItem = parseInt(wItemNo,10);
        //  Main section
        switch (getMode()) { 
            case MODE.CREATE:
                wStandingData._id = undefined;
                break;
            case MODE.UPDATE:
                wStandingData._id = getSelectStackId();
                break;
            default:
                console.log ("/page/MainainReferenceData btnStandingDataASave invalid mode = [" + getMode() + "]");
        }
        wResult = await saveRecord("lstSettings", wStandingData);
        //let wResult = {"status": true, "savedRecord": {"_id": 123}, "error": null}
        //let res = false;
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wStandingData._id = wSavedRecord._id;
                    gNoRefItems = wNoRefItem; 
                    showError("StandingData",8);
                    break;
                case MODE.UPDATE:
                    showError("StandingData",7);
                    break;
                default:
                    console.log ("/page/MaintainReferenceData btnStandingDataASave invalid mode = [" + getMode() + "]");
            }
            updateGlobalDataStore(wSavedRecord,"StandingData");
            updatePagination("StandingData");
            resetCommands("StandingData");
        } else {
            if (wResult.savedRecord){
                console.log("/page/MaintainReferenceData btnSave saveRecord failed, savedRecord");
                console.log(wResult.savedRecord);
            } else {
                console.log("/page/MaintainReferenceData btnSave saverecord failed, error");
                console.log(wResult.error);
            }
        }
    }
    resetSection("StandingData");
    $w('#btnStandingDataASave').enable();
    $w('#btnStandingDataASave').label = "Save";
    hideWait("StandingData");
	setMode(MODE.CLEAR);
}

export async function drpStandingDataChoiceChange(event) {
    showWait("StandingData");
    updatePagination("StandingData");
    hideWait("StandingData");
}

export async function strStandingData_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doStandingDataView (pTarget) {
    $w('#chkStandingDataListSelectAll').expand();
    $w('#btnStandingDataListTop').expand();
    $w('#rptStandingDataList').expand();
}
// ================================================= Event Supporting Functions =================================================
//
export async function clearStandingDataEdit() {

    let wStandingDatas = getEntity("StandingData");
    let wChoices = $w('#rptStandingDataList').data;
    $w('#drpStandingDataEditWebPage').enable();
    $w('#inpStandingDataEditRefKey').enable();
    $w('#inpStandingDataEditName').enable();
    $w('#inpStandingDataEditValue').enable();
    
    $w('#drpStandingDataEditWebPage').value = $w('#drpStandingDataChoice').value;
    $w('#inpStandingDataEditRefKey').value = "SD" + String(gNoRefItems + 1).padStart(3,"0");
    $w('#inpStandingDataEditName').value = "";
    $w('#inpStandingDataEditValue').value = "";
}

export async function populateStandingDataEdit() {
    
    let wSelectedRecord = getSelectedItem("StandingData");
    $w('#drpStandingDataEditWebPage').disable();
    $w('#inpStandingDataEditRefKey').disable();
    $w('#inpStandingDataEditName').enable();
    $w('#inpStandingDataEditValue').enable();

    $w('#drpStandingDataEditWebPage').value = wSelectedRecord.webPage;
    $w('#inpStandingDataEditRefKey').value = wSelectedRecord.refKey;
    $w('#inpStandingDataEditName').value = wSelectedRecord.name;
    $w('#inpStandingDataEditValue').value = wSelectedRecord.value;
}
