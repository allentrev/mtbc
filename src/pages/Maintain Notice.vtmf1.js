import wixWindow from 'wix-window';
import { authentication } from 'wix-members';
import wixLocation 				from 'wix-location';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } from 'public/objects/member';
import _ from 'lodash';

import { getAllNotices} from 'backend/backNotices.web.js';
import { loadDlistOptions } from 'backend/backSystem.jsw';
import { updateEventStatus } from 'backend/backEvents.jsw';
import { saveRecord } from 'backend/backEvents.jsw';
import { bulkDeleteRecords } from 'backend/backEvents.jsw';
import { DateToOrdinal } from 'backend/backEvents.jsw';
import { getCalKey } from 'backend/backEvents.jsw';
import { processEventType }			from 'public/objects/booking';

import { processEventBookings }         from 'backend/backBookings.jsw';
import { addBookings } from 'backend/backBookings.jsw';

import { getNewAllTeamOptions } from 'backend/backTeam.jsw';
import { getNewAllLeagueOptions } from 'backend/backTeam.jsw';
import { validateTeamLeagueDropdowns } from 'backend/backTeam.jsw';
 
import { formatDateString } from 'public/fixtures';
import { parseDateTimeFromInput } from 'public/fixtures';

import { getRinksAndSlots } from 'public/objects/booking';
import { getNoFreeRinks } from 'public/objects/booking';
import { getStartSlot } from 'public/objects/booking';
import { getEndSlot } from 'public/objects/booking';
import { initialiseRinksArray } from 'public/objects/booking';

import { EVENT, EVENT_TYPE } from 'public/objects/event';
import { EVENT_GAME_TYPE, USE_TYPE } from 'public/objects/event';

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

//let gFirstOption = [{
//    "label": "",
//    "value": "X"
//}]

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E"
});

//-----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = true;
const gYear = new Date().getFullYear();
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {

    try {
        let status;
        
        //$w('#lblHdr1').text = `The following table summarises something....${gYear} season`;
        // for testing ------	------------------------------------------------------------------------
        //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
        //let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
        let wUser = { "_id": "612f172a-1591-4aec-a770-af673bbc207b", "loggedIn": true, "roles": [{ "title": "Captain" }] }; //Sarah
        //let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
        /**
        Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
        Julia Allen		16b77976-37d1-41df-a328-4433d2d40cbc	612f172a-1591-4aec-a770-af673bbc207b
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
            console.log("/page/MaintainNotice onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/MaintainNotice onReady Not signed in");
        	showError("Notice", 28);
			setTimeout(() => {
				wixLocation.to("/");
			}, 2000);
}
        
        if (wixWindow.formFactor === "Mobile") {
            $w('#strDesktop').collapse();
            $w('#strMobile').expand();
        } else {
            $w('#strMobile').collapse();
            $w('#strDesktop').expand();
            await loadNoticesDropDown();
            await populateNoticeEditDropDowns();
            $w('#drpNoticeChoice').value = "A";
            $w('#inpNoticeListNoPerPage').value = "15";

            await loadListData();
        
        }

        // Notice Section Notice handlers
        $w('#strNotice').onViewportEnter ((event) => strNotice_viewportEnter(event));
        $w('#btnNoticeACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnNoticeAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnNoticeADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnNoticeASave').onClick((event) => btnNoticeASave_click(event));
        $w('#btnNoticeACancel').onClick((event) => btnCancel_click(event));
        //$w('#btnEventAToCanEvent').onClick((event) => doBtnEventAToCanEventClick(event));
        $w('#btnNoticeACancellation').onClick((event) => doBtnCancellationClick(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkNoticeListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkNoticeListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnNoticeListTop').onClick((event) => btnTop_click(event));
        $w('#drpNoticeChoice').onChange((event) => drpNoticeChoiceChange(event));
        $w('#pgnNoticeList').onClick((event) => doPgnListClick(event));
        $w('#inpNoticeListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));

        $w('#drpNoticeEditTargetType').onChange((event) => doDrpNoticeEditTargetTypeChange(event));
        //$w('#drpNoticeEditHomeAway').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#tpkNoticeEditStartTime').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#tpkNoticeEditDuration').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#dpkNoticeEditStartDate').onChange((event) => doDrpNoticeEditRinksChange(event));

        //----------------------------Repeaters section-------------------------------------------
        $w('#rptNoticeList').onItemReady(($item, itemData, index) => {
            loadRptNoticeList($item, itemData, index);
        })
  		//-------------------------- Custom Validation -----------------------------------------		

        //  None
    }
	catch (err) {
		console.log("/page/MaintainNotice onReady Try-catch, err");
		console.log(err);
		if (!gTest)  { wixLocation.to("/syserror") };
	}
});

// ------------------------------------------------ Load Data --------------------------------------------------------
//
export async function loadListData () {
	try {
		let wResult =  await getAllNotices(loggedInMember.lstId, gYear);
        if (wResult && wResult.status){
            let wNotices = wResult.notices;
            setEntity("Notice", [...wNotices]);
            $w('#strNotice').expand();
            if (wNotices && wNotices.length > 0) {
                //gItemsToDisplay = [...gCompetitions];
                $w('#boxNoticeChoice').expand();
                $w('#boxNoticeList').expand();
                $w('#boxNoticeNone').collapse();
                $w('#boxNoticeEdit').collapse();
                $w('#boxNoticePrime').collapse();
                await doNoticeView("");
                resetPagination("Notice");
            } else {
                //gItemsToDisplay = [...gReferences];
                $w('#boxNoticeChoice').expand();
                $w('#boxNoticeList').collapse();
                $w('#boxNoticeNone').expand();
                $w('#boxNoticeEdit').collapse();
                $w('#boxNoticePrime').collapse();
            }
        } else {
    		console.log("/page/MaintainNotice loadListData Error return, err");
            console.log(wResult.error);
        }
	}
	catch (err) {
		console.log("/page/MaintainNotice loadListData Try-catch, err");
		console.log(err);
	}
}
// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//

function loadRptNoticeList($item, itemData, index) {
    let wTargetType = "A";
    let wTarget = "";
    switch (itemData.targetType) {
        case "A":
            wTargetType = "All"
            break;
        case "D":
            wTargetType = "DList"
            wTarget = itemData.target || "";
            break;
        case "S":
            wTargetType = "Select"
            wTarget = itemData.target || "";
            break;
        default:
            wTargetType = "All"
            break;
    }
    if (index === 0) {
        $item('#lblNoticeListTargetType').text = "TYpe";
        $item('#lblNoticeListTarget').text = "Target";
        $item('#lblNoticeListTitle').text = "Title";
        $item('#chkNoticeListSelect').hide();
    } else {
        $item('#chkNoticeListSelect').show();
        $item('#lblNoticeListTargetType').text = wTargetType;
        $item('#lblNoticeListTarget').text = wTarget;
        $item('#lblNoticeListTitle').text = itemData.title.trim();
        $item('#chkNoticeListSelect').checked = false;
    }
}
// ------------------------------------------------ Load Dropdowns-----------------------------------------------
//
export async function loadNoticesDropDown() {
    let wOptions = [
        { "label": "All Members", "value": "A" },
        { "label": "Test 1", "value": "1" },
        { "label": "Test 2", "value": "2" },
        { "label": "Test 3", "value": "3" }
    ];

    $w('#drpNoticeChoice').options = wOptions;
    $w('#drpNoticeChoice').value = "A";
    drpNoticeChoiceChange();
}


async function populateNoticeEditDropDowns() {
    let wNoticeEditOptions = [
        { "label": "Club Members", "value": "A" },
        { "label": "DList", "value": "D" },
        { "label": "Select", "value": "S" }
    ];

    $w('#drpNoticeEditTargetType').options = wNoticeEditOptions;
    $w('#drpNoticeEditTargetType').value = "A";

    const wResult  = await loadDlistOptions();
    if (wResult && wResult.status){
        let wNoticeEditDlist = wResult.options;
        $w('#drpNoticeEditDlist').options = wNoticeEditDlist;
        $w('#drpNoticeEditDlist').selectedIndex = 0;;
    } else {
        console.log("/page/MaintainNotice populateNoticeEditDropdowns no dlist found");
    }
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    btnCreate_click(event);
    await clearNoticeEdit();
}
export async function doBtnUpdateClick(event) {
    btnUpdate_click(event);
    await populateNoticeEdit();
}
export async function doBtnCancellationClick(event) {
    btnCancellation_click(event);
    await populateNoticeEdit();
}

// ================================================= Notice Events ================================================
//
export async function drpNoticeFilterType_change(event) {
    showWait("Notice");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("Notice");
}

function doDrpNoticeEditTargetTypeChange (event){
	let wTargetType = event.target.value;
    configureBoxes(wTargetType);
}

export function doNoticeViewChange (event) {
	let wView = event.target.value;
	doNoticeView(wView);
}
export function btnNoticeAToB_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}

export async function btnNoticeASave_click(event) {
    try{
        showWait("Notice");
        $w('#btnNoticeASave').disable();
        //-------------------------------------VALIDATIONS-----------------------------------
        const wPublish = ($w('#rgpNoticeEditPublish').value === "N") ? false : true;
        const wTransmit = ($w('#rgpNoticeEditTransmit').value === "N") ? false : true;
        if (!$w('#inpNoticeEditTitle').valid) {
            showError("Notice", 22);
            hideWait("Notice");
            $w('#inpNoticeEditTitle').focus();
            return
        }
        if ( !wPublish && !wTransmit ) {
            showError("Notice", 22);
            hideWait("Notice");
            $w('#rgpNoticeEditPublish').focus();
            return
        }
        //-------------------------------------Main section----------------------------------
        let wNotice = {
            "_id": "",
            "title": $w('#inpNoticeEditTitle').value,
            "targetType": $w('#drpNoticeEditTargetType').value,
            "target": null,
            "urgent": $w('#rgpNoticeEditUrgent').value,
            "picture": $w('#imgNoticeEditPicture').src,
            "message": $w('#inpNoticeEditMessage').value.trim(),
            "status": "O",
            "source": null
        }

        let wResult;
        wResult = {"status": true, "savedRecord": {}, "error": ""}
        switch (wNotice.targetType) {
            case "A":
                wNotice.target = null;    
                break;
            case "D":
                wNotice.target = $w('#drpNoticeEditDlist').value    
                break;
            case "S":
                wNotice.target = $w('#rptNoticeEditDlist').data;
                break;
            default:
                console.log ("/page/MaintainNotice btnNoticeSave invalid targetType = [" + wNotice.targetType + "]");
                break;
        }
        switch (getMode()) {
            case MODE.CREATE:
                wNotice._id = undefined;
                break;
                //console.log(wMember);
            case MODE.UPDATE:
                wNotice._id = getSelectStackId();
                break;
            default:
                console.log ("/page/MaintainNotice btnNoticeSave invalid mode = [" + getMode() + "]");
        }
        // Save record performed in switch code blocks above;
        if (wPublish) {    
            wResult = await saveRecord("lstNotices", wNotice);
            if (wResult  && wResult.status){
                let wSavedRecord = wResult.savedRecord;
                switch (getMode()) { 
                    case MODE.CREATE:
                        wNotice._id = wSavedRecord._id;
                        wNotice._createdDate = wSavedRecord._createdDate;
                        showError("Notice",8);
                        break;
                    case MODE.UPDATE:
                        showError("Notice",7);
                        break;
                    default:
                        console.log ("/page/MaintainNotice btnNoticeASave invalid mode = [" + getMode() + "]");
                }
                updateGlobalDataStore(wSavedRecord,"Notice");
                updatePagination("Notice");
                resetCommands("Notice");
            } else {
                if (wResult && wResult.savedRecord){
                    console.log("/page/MaintainNotice btnNoticeASave_click saveRecord failed, savedRecord, error");
                    console.log(wResult.savedRecord);
                    console.log(wResult.error);
                } else if(wResult){
                    console.log("/page/MaintainNotice btnNoticeASave_click saverecord failed, error");
                    console.log(wResult.error);
                } else {
                    console.log("/page/MaintainNotice btnNoticeASave_click wResult undefined")
                    console.log(wResult.error);
                }
            }
        }
        if (wTransmit) {
            //send message
        }
        resetSection("Notice");
        $w('#btnNoticeASave').enable();
        hideWait("Notice");
        setMode(MODE.CLEAR);
    }
	catch (err) {
		console.log("/page/MaintainNotice btnNoticeASave_click Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
}

export async function drpNoticeChoiceChange(event) {
    showWait("Notice");
    updatePagination("Notice");
    hideWait("Notice");
}

export async function cstrpNotice_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doNoticeView (pTarget) {
	if (pTarget === "P") {
		$w('#chkNoticeListSelectAll').collapse();
		$w('#btnNoticeListTop').collapse();
		$w('#rptNoticeList').collapse();
	} else {
		$w('#chkNoticeListSelectAll').expand();
		$w('#btnNoticeListTop').expand();
		$w('#rptNoticeList').expand();
	}
}

export function strNotice_viewportEnter(event) {
    //console.log("Viewport")
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
// ================================================= Notice Supporting Functions =================================================
//
export async function clearNoticeEdit() {
    
    $w('#drpNoticeEditTargetType').value = "A";
    configureBoxes("A");

    $w('#inpNoticeEditTitle').value = "";
    $w('#rgpNoticeEditUrgent').value = "N";
    $w('#rgpNoticeEditPublish').value = "Y";
    $w('#rgpNoticeEditTransmit').value = "Y";
    $w('#drpNoticeEditDlist').selectedIndex = 0;
	$w('#imgNoticeEditPicture').src = null;

    $w('#inpNoticeEditMessage').value = "";
    $w('#inpNoticeEditTitle').focus();

}

function configureBoxes (pTargetType){
    switch (pTargetType) {
        case "A":
            $w('#boxNoticeEditPublish').expand();
            $w('#boxNoticeEditDlist').collapse();
            $w('#boxNoticeEditSelect').collapse();
            break;
        case "D":
            $w('#boxNoticeEditPublish').collapse();
            $w('#boxNoticeEditDlist').expand();
            $w('#boxNoticeEditSelect').collapse();
            break;
        case "S":
            $w('#boxNoticeEditPublish').collapse();
            $w('#boxNoticeEditDlist').collapse();
            $w('#boxNoticeEditSelect').expand();
            break;
        default:
            $w('#boxNoticeEditPublish').expand();
            $w('#boxNoticeEditDlist').collapse();
            $w('#boxNoticeEditSelect').collapse();
            console.log("pages/MaintainNotice drpNoticeEditTargetTypeChange Invalid Target Type, ", wTargetType);
            break;
    }
}
// TODO sort it

export async function populateNoticeEdit() {
    
    let wSelectedRecord = getSelectedItem("Notice");
    configureBoxes(wSelectedRecord.targetType);

    let wPublish = (wSelectedRecord.targetType === "A") ? "Y" : "N";
    let wTarget = (wSelectedRecord.targetType === "A") ? null : wSelectedRecord.target;

    $w('#inpNoticeEditTitle').value = wSelectedRecord.title;
    if (wTarget && wTarget === "D") {
        $w('#drpNoticeEditDlist').value = wSelectedRecord.target[0];
    }
    if (wTarget && wTarget === "S") {
        $w('#drpNoticeEditDlist').value = wSelectedRecord.target[0];
    }
    $w('#rgpNoticeEditUrgent').value = wSelectedRecord.urgent;
    $w('#rgpNoticeEditPublish').value = wPublish;
    $w('#rgpNoticeEditTransmit').value = "Y";
    $w('#inpNoticeEditMessage').value = wSelectedRecord.message;
	$w('#imgNoticeEditPicture').src = wSelectedRecord.src;

    $w('#inpNoticeEditTitle').focus();

}

async function processRecord(pTarget, pItem) {
    //console.log("Process Record pItem");
    //console.log(pItem);

    let wReturn = {
        "NoticeUpdate": {},
        "NoticeBookings": []
    }
    let wNoticeUpdate = {};
    let wSavedRec = {};

    let wTownTeamsInLeague = {};
    let wNoticeBookings = [];
    let wId = "";
    let wBookingsToSave = [];
    let res;
    let wResult;
    let wResult2;
    //let wLeagueKey = "";
    //let wLeagueDivision = 0;
    switch (pTarget) {
    case "Notice":
        wReturn = await processNoticeRecord(pItem);
        wNoticeUpdate = wReturn.NoticeUpdate;
        wNoticeBookings = wReturn.NoticeBookings;
        //console.log("case Notice - Notice Update + bookings returned");
        //console.log(wNoticeUpdate);
        //console.log(wNoticeBookings);
        wResult = await saveRecord("lstNotices", wNoticeUpdate);
        if (wResult.status){
            wSavedRec  = wResult.savedRecord;
            //console.log("wId = ", wId);
            if (wNoticeBookings) {
                if (wNoticeBookings.length > 0) {
                    /** 
                    wBookingsToSave = wNoticeBookings.map(item => {
                        let wItem = { ...item };
                        wItem.NoticeId = wSavedRec._id;
                        return wItem;
                    })
                    */
                    let wResult = await processNoticeBookings(wSavedRec._id, wNoticeBookings) ;
                }
            }
        } else {
            if (wResult.savedRecord) {
                console.log("/page/MaintainNotice ProcessRecord, save failed, savedRecord", wResult.savedRecord);
            } else {
                console.log("/page/MaintainNotice ProcessRecord, save failed, error", wResult.error);
            }
        }
        //console.log("Res of builk booking");
        //console.log(res);
        break;
    }
    return wSavedRec;
}


export function btnUpload_click(event) {
	$w('#txtNoticeErrMsg').hide();
	if($w("#uplNoticeEditPhoto").value.length > 0) {
    $w("#txtNoticeErrMsg").text = `Uploading ${$w("#uplNoticeEditPhoto").value[0].name}`;
    $w("#uplNoticeEditPhoto").startUpload()
      .then( (uploadedFile) => {
        $w("#txtNoticeErrMsg").text = "Upload successful";
        $w("#imgNoticeEditPicture").src = uploadedFile.url;
		$w('#btnNoticeASave').show();
      })
      .catch( (uploadError) => {
        $w("#txtNoticeErrMsg").text = "File upload error";
        console.log(`/page/UpdateNotice btnUpload Page Update Notice: Error: ${uploadError.errorCode}`);
        console.log(uploadError.errorDescription);
      });
  	} else {
    	$w("#txtNoticeErrMsg").text = "Please choose a file to upload.";
  	}
}

export function btnClear_click(event) {
	$w('#txtNoticeErrMsg').hide();
	$w('#btnNoticeASave').show();
	$w('#imgNoticeEditPicture').src = null;
}
