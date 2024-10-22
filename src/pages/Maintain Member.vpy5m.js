import wixWindow from 'wix-window';
import { authentication }   from 'wix-members';
import wixLocation 				        from 'wix-location';

import _, { values } from 'lodash';

import { saveRecord }               from 'backend/backEvents.jsw';

import { saveImportMemberRecord }   from 'backend/backMember.jsw';
import { createMember }             from 'backend/backMember.jsw';
import { deleteLstMember }          from 'backend/backMember.jsw';
import { getAllMembers2 }           from 'backend/backMember.jsw';
import { getAllImportMembers }      from 'backend/backMember.jsw';
import { isUnique }                 from 'backend/backMember.jsw';

import { bulkSaveRecords }              from 'backend/backEvents.jsw';
import { STATUS }                       from "public/objects/member";
import { retrieveSessionMemberDetails } from 'public/objects/member';
import { buildMemberCache }             from 'public/objects/member';
import { isRequiredRole }               from 'public/objects/member';

//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity } from 'public/objects/entity';
import { MODE } from 'public/objects/entity';
import { drpChoice_change, btnCreate_click, btnUpdate_click, btnDelete_click, btnCancel_click, btnCancellation_click } from 'public/objects/entity';
import { chkSelect_click,chkSelectAll_click, btnTop_click,doPgnListClick } from 'public/objects/entity';
import { doInpListNoPerPageChange, doChkSelectAll, doEntityASaveClick } from 'public/objects/entity';
import { resetCommands, resetSection, getSelectStackId }  from 'public/objects/entity';
import { resetPagination, updatePagination } from 'public/objects/entity';
import { showError, updateGlobalDataStore, deleteGlobalDataStore } from 'public/objects/entity';
import { getTarget, getTargetItem, configureScreen} from 'public/objects/entity';
import { showWait, hideWait, getMode, setMode } from 'public/objects/entity';
import { getSelectStack, getSelectedItem} from 'public/objects/entity';
import { showGoToButtons, hideGoToButtons } from 'public/objects/entity';
import { gFL} from 'public/objects/entity';

///let gMembers = [];
///let gMembersToDisplay = [];

let gWixUpdates = [];
let gSkipped = [];

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E"
});

let gManOutline = "wix:image://v1/88f9e9_cf010bd242a247d897c0d82796abf866~mv2.jpg/man_outline.jpg#originWidth=570&originHeight=561";
let gWomanOutline = "wix:image://v1/88f9e9_7c906da184a746b1add8536f47c445c6~mv2.jpg/woman_outline.jpg#originWidth=549&originHeight=531";


const USERNAME_LENGTH = 3;

const gUploadedColour = `rgba(145,145,145,0.5)`;
const gAvailableColour = `rgba(207,207,155,0.5)`;

const capitalize = s => s && s[0].toUpperCase() + s.slice(1);

let gMode = MODE.CLEAR;

let gSelectLeftStack = [];
let gSelectRightStack = [];

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
            console.log("/page/Maintain Member onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/Maintain Member onReady Not signed in");
        }

        if (wixWindow.formFactor === "Mobile") {
            $w('#boxMemberDashboard').collapse();//
            $w('#secDesktop').collapse();//
            $w('#secMobile').collapse()//;
            $w('#secCustom').collapse();
            $w('#secMember').expand();//
            $w('#secSync').collapse();
            $w('#secLocker').collapse();
            $w('#inpMemberListNoPerPage').value = "10";
            $w('#inpLockerListNoPerPage').value = "20";
            $w('#btnMemberAToSync').disable();
            $w('#btnMemberAToCustom').disable();
        } else {
            $w('#secDesktop').expand();
            $w('#secMobile').collapse();
            $w('#secCustom').collapse();
            $w('#secLocker').collapse();
            $w('#secSync').collapse();
            $w('#secMember').expand();
            $w('#strMember').scrollTo();
            $w('#inpMemberListNoPerPage').value = "20";
            $w('#inpLockerListNoPerPage').value = "20";


            //ensure these are set before loadtabledata
            
            showDashboard();
        }
        buildMemberCache();
        await loadMembers();
        if (wixWindow.formFactor !== "Mobile") {
            updateDashboard();
        }
    //
        // Member Section event handlers
        //
        $w('#strMember').onViewportEnter ((event) => strMember_viewportEnter(event));
        $w('#btnMemberACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnMemberAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnMemberADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnMemberASave').onClick((event) => btnMemberASave_click(event));
        $w('#btnMemberACancel').onClick((event) => btnCancel_click(event));
        $w('#btnMemberAToSync').onClick((event) => btnMemberAToSync_click(event));
        $w('#btnMemberAToLocker').onClick((event) => btnMemberAToLocker_click(event));
        $w('#btnMemberAConvert').onClick((event) => btnMemberAConvert_click(event));
        $w('#drpMemberChoiceType').onClick((event) => drpChoice_change(event));
        $w('#drpMemberChoiceStatus').onClick((event) => drpChoice_change(event));
        $w('#chkMemberListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkMemberListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnMemberListTop').onClick((event) => btnTop_click(event));
        $w('#pgnMemberList').onClick((event) => doPgnListClick(event));
        $w('#inpMemberListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        $w('#inpMemberEditMobilePhone').onChange((event) => inpPhone_change(event));
        $w('#inpMemberEditHomePhone').onChange((event) => inpPhone_change(event));
        $w('#upbMemberEditPhoto').onChange((event) => upbMemberEditPhoto_change(event));
        $w('#btnMemberEditClearPhoto').onClick((event) => btnMemberEditClearPhoto_click(event));
        $w('#inpMemberEditUsername').onChange((event) => inpMemberEditUsername_change(event));
        $w('#btnMemberEditMoreDisplay').onClick((event) => btnMemberEditMoreDIsplayClick());

        // Custom Section event handlers
         //
         $w('#btnMemberAToCustom').onClick((event) => doCustom());
         $w('#btnCustomOpen').onClick((event) => processCustomOpen());
         $w('#btnCustomClose').onClick((event) => processCustomClose());
         $w('#btnCustomProcess').onClick((event) => processCustomGo());
        
        // Sync Section event handlers
        //
        $w('#btnLstImp').onClick((event) => doStage1(event));
        $w('#btnFieldValue').onClick((event) => doStage2(event));
        $w('#btnLstVWix').onClick((event) => doStage3(event));
        $w('#btnSyncClose').onClick((event) => processCustomClose());
        $w('#btnLstAmend').onClick((event) => btnLstAmend_click(event));
        $w('#btn2AmendSave').onClick((event) => btn2AmendSave_click(event));
        $w('#btn3AmendSave').onClick((event) => btn3AmendSave_click(event));
        $w('#btnAmendCancel').onClick((event) => btnAmendCancel_click());
        $w('#btnLstPast').onClick((event) => btnLstPast_click(event));
        $w('#btnLstTest').onClick((event) => btnLstTest_click(event));
        $w('#btnImpNewFull').onClick((event) => btnImpNew_click("F", event));
        $w('#btnImpNewSocial').onClick((event) => btnImpNew_click("S", event));
        $w('#btnLstRegister').onClick((event) => btnLstRegister_click(event));
        $w('#btnWixUpdate').onClick((event) => btnLstAmend_click(event));
        $w('#btnWixDelete').onClick((event) => btnWixDelete_click(event));

        $w('#chk2').onClick((event) => chkSyncSelect_click("2", event));
        $w('#chk3').onClick((event) => chkSyncSelect_click("3",event));
        $w('#boxRpt2').onClick((event) => boxRpt_click("2", event));
        $w('#boxRpt3').onClick((event) => boxRpt_click("3", event));

        // Locker Section event handlers
        //
        $w('#btnLockerASave').onClick((event) => btnLockerASave_click(event));
        $w('#btnLockerAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnLockerACancel').onClick((event) => btnCancel_click(event));
        $w('#btnLockerAToMember').onClick((event) => processCustomClose());
        $w('#chkLockerListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkLockerListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnLockerListTop').onClick((event) => btnTop_click(event));
        $w('#pgnLockerList').onClick((event) => doPgnListClick(event));
        $w('#inpLockerListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        $w('#btnLockerEditHolderAdd').onClick((event) => doBtnLockerEditHolderAdd());
        $w('#btnLockerEditHolderClear').onClick((event) => doBtnLockerEditHolderClear());

        // Repeaters section
        
        $w('#rptMemberList').onItemReady(($item, itemData, index) => {loadRptMemberList($item, itemData, index)});
        $w('#rptLockerList').onItemReady(($item, itemData, index) => {loadRptLockerList($item, itemData, index)});
        $w('#rptLockerListDuplicates').onItemReady(($item, itemData, index) => {loadRptLockerListDuplicates($item, itemData, index)});
        $w('#rpt2').onItemReady(($item, itemData, index) => {loadRptN("2",$item, itemData)});
        $w('#rpt3').onItemReady(($item, itemData, index) => {loadRptN("3",$item, itemData)});

        //-------------------------- Custom Validation -----------------------------------------		

        $w('#inpMemberEditLoginEmail').onCustomValidation (validateLoginEmail);

        
        $w('#inpMemberEditPostCode').onCustomValidation((value, reject) => {
            let regExp = new RegExp(`^(([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) [0-9][A-Z]{2}$`);
            if (!regExp.test(value)) {
                reject(`PostCode format invalid`);
            }
        });
    }
	catch (err) {
		console.log("/page/Maintain Member onReady Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
});

// ------------------------------------------------Load Repeaters ----------------------------------------------------------
//
function loadRptMemberList($item, itemData, index) {
    //console.log("Item,", index);
    //console.log(itemData)
;    //let wSelected = isSelected(itemData._id);
    if (wixWindow.formFactor === "Mobile") {
        $item('#lblMemberListLocker').hide();
        $item('#lblMemberListMobilePhone').hide();
    }

    if (index === 0) {
        $item('#chkMemberListSelect').hide();
    } else {
        let wMobilePhone = itemData.mobilePhone === "no phone #" ? "" : hyphenatePhoneNumber(itemData.mobilePhone);
        $item('#lblMemberListFirstName').text = itemData.firstName;
        $item('#lblMemberListSurname').text = itemData.surname;
        $item('#lblMemberListMobilePhone').text = wMobilePhone;
        $item('#lblMemberListLocker').text = itemData.locker.join(",");
        $item('#chkMemberListSelect').checked = false;
    }
}

function loadRptLockerList($item, itemData, index) {
    //console.log("Locker Item,", index);
    //console.log(itemData);
    //let wSelected = isSelected(itemData._id);

    if (index === 0) {
        $item('#chkLockerListSelect').hide();
    } else {
        $item('#lblLockerListLocker').text = String(itemData.lockerNo);
        $item('#lblLockerListOwner').text = itemData.ownerName || "free";
        $item('#chkLockerListSelect').checked = false;
    }
}

function loadRptLockerListDuplicates($item, itemData, index) {
    //console.log("DUp Item,", index);
    //console.log(itemData);
    //let wSelected = isSelected(itemData._id);
    
    $item('#lblLockerListDuplicateIndex').text = String(itemData.lockerNo);
    $item('#lblLockerListDuplicateOwner').text = itemData.ownerName;
}

// ------------------------------------------------Load Data ---------------------------------------------------------
//

export async function loadMembers() {
    //console.log("load Members");
    try{
        showWait("Member");
        let wAllMembers = await getAllMembers2();
        if (wAllMembers){ 
            //let wAllMembers = wResults.members;
            setEntity("Member", [...wAllMembers]);
            resetSection("Member");
        } else {
            console.log("/page/Maintain Member loadMembers read failed, err" );
            //console.log(wResults.error);
        }
        await doMemberView("");
        resetPagination("Member");
        hideWait("Member");
    }
	catch (err) {
		console.log("/page/Maintain Member loadMembers Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    let wTarget = getTarget(event, "A");
    btnCreate_click(event);
    await clearEdit(wTarget);
}
export async function doBtnUpdateClick(event) {
    let wTarget = getTarget(event, "A");
    btnUpdate_click(event);
    await populateEdit(wTarget);
}

// ----------------------------------------------Entity Event Supporting Functions -------------------------------------------------
//

function clearEdit(pTarget) {

    switch (pTarget) {
        case "Member":
            $w('#inpMemberEditUsername').value = "";
            $w('#inpMemberEditLoginEmail').value = "";
            $w('#inpMemberEditFirstName').value = "";
            $w('#inpMemberEditSurname').value = "";
            $w('#inpMemberEditMix').value = "L";
            $w('#drpMemberEditType').value = "Full";
            ////$w('#lblMemberEditStartType').text = "Full";
            $w('#dpkMemberEditDateLeft').value = new Date();
            $w('#rgpMemberEditContactPref').value = "E";
            $w('#rgpMemberEditAllowShare').value = "Y";
            $w('#inpMemberEditContactEmail').value = "";
            $w('#inpMemberEditAltEmail').value = "";
            $w('#inpMemberEditMobilePhone').value = "";
            $w('#inpMemberEditHomePhone').value = "";
            $w('#inpMemberEditLocker').value = "";
            $w('#inpMemberEditAddrLine1').value = "";
            $w('#inpMemberEditAddrLine2').value = "";
            $w('#inpMemberEditTown').value = "";
            $w('#inpMemberEditPostCode').value = "";
            $w('#inpMemberEditLstId').value = "";
            $w('#inpMemberEditWixId').value = "";
            $w('#imgMemberEditPhoto').src = gWomanOutline;
            break;
        case "Locker":
            $w('#txtLockerEditLocker').text = "";
            $w('#inpLockerEditHolder').value = "";
            $w('#lblLockerEditHolderId').text = "";
            $w('#lblLockerEditOldHolderId').text = "";
            break;
        default:
            console.log("/MaintainMember clearEditBox Invalid switch key", pTarget)
            break;
    }
}

function populateEdit(pTarget) {

    let wSelected = getSelectedItem(pTarget);

    let wStatusPendingOptions = [{"label": "Pending", "value": "Pending"},
                                {"label": "Active", "value": "Active"},
                                {"label": "Past", "value": "Past"}];
    let wStatusActiveOptions = [{"label": "Active", "value": "Active"},
                                {"label": "Wait", "value": "Wait"},
                                {"label": "Past", "value": "Past"},
                                {"label": "Pending", "value": "Pending"}];
    let wStatusWaitOptions = [{"label": "Wait", "value": "Wait"},
                                {"label": "Actiive", "value": "Active"},
                                {"label": "Past", "value": "Past"}];
    let wStatusPastOptions = [{"label": "Past", "value": "Past"},
                                {"label": "Actiive", "value": "Active"}];

    //console.log(pSelected);
    let wPhotoSrc = (wSelected.gender === "M") ? gManOutline : gWomanOutline;
    switch (pTarget) {
    case "Member":
        $w('#inpMemberEditLoginEmail').disable();
        if /* new username based account */ (wSelected.loginEmail.includes("mtbc")) {
            $w('#inpMemberEditUsername').enable();
            $w('#btnMemberAConvert').hide();
        } else {
            $w('#inpMemberEditUsername').disable();
            $w('#btnMemberAConvert').show();
        }
        let wMobilePhone = wSelected.mobilePhone === "no phone #" ? "" : hyphenatePhoneNumber(wSelected.mobilePhone);
        let wHomePhone = wSelected.homePhone === "no phone #" ? "" : hyphenatePhoneNumber(wSelected.homePhone);
        switch (wSelected.status){
            case "Pending":
                $w('#drpMemberEditNewStatus').options = wStatusPendingOptions;
                break;
            case "Active":
                $w('#drpMemberEditNewStatus').options = wStatusActiveOptions;
                break;
            case "Wait":
                $w('#drpMemberEditNewStatus').options = wStatusWaitOptions;
                break;
            case "Past":
                $w('#drpMemberEditNewStatus').options = wStatusPastOptions;
                break;
        }
        if ( wSelected.dateLeft instanceof Date) {
            $w('#dpkMemberEditDateLeft').show();
            $w('#dpkMemberEditDateLeft').value = wSelected.dateLeft;
        } else {
            $w('#dpkMemberEditDateLeft').hide();
        }
        $w('#inpMemberEditUsername').value = wSelected.username || "";
        $w('#inpMemberEditLoginEmail').value = wSelected.loginEmail || "";
        $w('#inpMemberEditFirstName').value = wSelected.firstName || "";
        $w('#inpMemberEditSurname').value = wSelected.surname;
        $w('#inpMemberEditMix').value = wSelected.gender;
        $w('#drpMemberEditType').value = wSelected.type;
        $w('#txtMemberEditOldStatus').text = wSelected.status;
        $w('#drpMemberEditNewStatus').value = wSelected.status;
        ////$w('#lblMemberEditStartType').text = pSelected.type;
        $w('#rgpMemberEditContactPref').value = wSelected.contactpref;
        $w('#rgpMemberEditAllowShare').value = wSelected.allowshare;
        $w('#inpMemberEditContactEmail').value = wSelected.contactEmail;
        $w('#inpMemberEditAltEmail').value = wSelected.altEmail;

        $w('#inpMemberEditMobilePhone').value = wMobilePhone;
        $w('#inpMemberEditHomePhone').value = wHomePhone;
        $w('#inpMemberEditLocker').value = wSelected.locker.join(",");
        $w('#inpMemberEditAddrLine1').value = wSelected.addrLine1 || "";
        $w('#inpMemberEditAddrLine2').value = wSelected.addrLine2 || "";
        $w('#inpMemberEditTown').value = wSelected.town || "";
        $w('#inpMemberEditPostCode').value = wSelected.postCode || "";
        $w('#inpMemberEditLstId').value = wSelected._id;
        $w('#inpMemberEditWixId').value = wSelected.wixId;
        $w('#imgMemberEditPhoto').src = wSelected.photo || wPhotoSrc;
        break;
    case "Locker":
        $w('#txtLockerEditLocker').text = String(wSelected.lockerNo);
        $w('#inpLockerEditHolder').value = wSelected.ownerName;
        $w('#lblLockerEditHolderId').text = wSelected.ownerId;
        $w('#lblLockerEditOldHolderId').text = wSelected.ownerId;
        break;
    default:
        console.log("/MaintainMember populateEdit Invalid switch key", pTarget)
        break;
    }
}

export function doMemberView (pViewType){
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkMemberListSelectAll').collapse();
        $w('#btnMemberListTop').collapse();
        $w('#rptMemberList').collapse();
    } else {
        $w('#chkMemberListSelectAll').expand();
        $w('#btnMemberListTop').expand();
        $w('#rptMemberList').expand();
    }
    return true;
}

export function doLockerView (pViewType){
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkLockerListSelectAll').collapse();
        $w('#btnLockerListTop').collapse();
        $w('#rptLockerList').collapse();
    } else {
        $w('#chkLockerListSelectAll').expand();
        $w('#btnLockerListTop').expand();
        $w('#rptLockerList').expand();
    }
    return true;
}

// ================================================= Member Events =================================================
//

export function btnMemberAToSync_click(event) {
    $w('#secMember').collapse();
    $w('#secLocker').collapse();
    $w('#secSync').expand();
    $w('#ancSyncStart').scrollTo();
}

export function btnMemberAToLocker_click(event) {
    $w('#secMember').collapse();
    $w('#secSync').collapse();
    $w('#secLocker').expand();
    loadLockers();
}

export function btnMemberAConvert_click(event) {
    $w("TextInput").disable();
    $w('#inpMemberEditUsername').enable();
    $w('#inpMemberEditUsername').focus();
    $w('#btnMemberAConvert').hide();
    setMode(MODE.CONVERT);
}

export function btnMembersAToReferences_click(event) {
    $w('#secMember').collapse();
}
export function btnMembersAToKennetTeams_click(event) {
    $w('#secMember').collapse();
}

export async function btnMemberASave_click(event) {
    try{
        showWait("Member");
        $w('#btnMemberASave').disable();
        //-------------------------------------VALIDATIONS-----------------------------------
        const wContactEmail = $w('#inpMemberEditContactEmail').value.trim() || "";
        const wContactMobile = $w('#inpMemberEditMobilePhone').value.trim() || "";
        let wContactPref = $w('#rgpMemberEditContactPref').value;
        const wLoginEmail = $w('#inpMemberEditLoginEmail').value.trim() || "";
        const wUsername = $w('#inpMemberEditUsername').value.trim() || "";

        if (wUsername === "" && wLoginEmail === "") {
            showError("Member", 38);
            hideWait("Member");
            $w('#inpMemberEditUsername').focus();
            return
        }    
        if (!$w('#inpMemberEditFirstName').valid) {
            showError("Member", 39);
            hideWait("Member");
            $w('#inpMemberEditFirstName').focus();
            return
        }

        if (!$w('#inpMemberEditSurname').valid) {
            showError("Member", 39);
            hideWait("Member");
            $w('#inpMemberEditSurname').focus();
            return
        }

        if (!$w('#inpMemberEditLoginEmail').valid) {
            $w(`#txtMemberErrMsg`).text = $w('#inpMemberEditLoginEmail').validationMessage;
            showError("Member", 22);
            hideWait("Member");
            $w('#inpMemberEditLoginEmail').focus();
            return
        }
        if (!$w('#inpMemberEditContactEmail').valid) {
            $w(`#txtMemberErrMsg`).text = $w('#inpMemberEditContactEmail').validationMessage;
            showError("Member", 41);
            hideWait("Member");
            $w('#inpMemberEditContactEmail').focus();
            return
        }

        if (wContactPref === "E" || wContactPref === "B" ) {
            if (wContactEmail === "") {
                showError("Member", 36);
                hideWait("Member");
                $w('#inpMemberEditContactEmail').focus();
                return
            }    
        }

        if (wContactPref === "S" || wContactPref === "B" ) {
            if (wContactMobile === "") {
                showError("Member", 37);
                hideWait("Member");
                $w('#inpMemberEditMobilePhone').focus();
                return
            }    
        }
        if (wContactEmail === "" && wContactMobile === "") {
            $w('#rgpMemberEditContactPref').value === "N";
            wContactPref = "N";
        }

        //-------------------------------------Main section----------------------------------
        let wMember = {
            "_id": "",
            "username": wUsername,
            "loginEmail": wLoginEmail,
            "firstName": capitalize($w('#inpMemberEditFirstName').value),
            "surname": capitalize($w('#inpMemberEditSurname').value),
            "gender": $w('#inpMemberEditMix').value,
            "type": $w('#drpMemberEditType').value,
            "status": $w('#drpMemberEditNewStatus').value,
            "contactpref": wContactPref,
            "allowshare": $w('#rgpMemberEditAllowShare').value,
            "contactEmail": wContactEmail,
            "altEmail": $w('#inpMemberEditAltEmail').value,
            "mobilePhone": await formPhoneString("mobile", wContactMobile),
            "homePhone": await formPhoneString("home", $w('#inpMemberEditHomePhone').value),
            "locker": [],
            "addrLine1": $w('#inpMemberEditAddrLine1').value,
            "addrLine2": $w('#inpMemberEditAddrLine2').value,
            "town": $w('#inpMemberEditTown').value,
            "postCode": $w('#inpMemberEditPostCode').value,
            "wixId": $w('#inpMemberEditWixId').value,
            "photo": $w("#imgMemberEditPhoto").src || ""
        }

        wMember.locker = ($w('#inpMemberEditLocker').value).split(",").map(Number) || [];
        let wPhoto = $w("#imgMemberEditPhoto").src;
        if (wPhoto === "") {
            wPhoto = ($w('#inpMemberEditMix').value === "M") ? gManOutline : gWomanOutline;
        }
        wMember.photo = wPhoto;
        let res;
        let wResult;
        wResult = {"Status": true, "savedRecord": { "_id": "1234"}, "error": ""}
        switch (getMode()) {
            case MODE.CREATE:
                wMember.dateLeft = undefined;
                wMember.status = STATUS.PENDING;
                wMember._id = undefined;
                //console.log(wMember);
                //let [createMemberStatus, createMemberMsg] = await createMember(wMember);
                //if (createMemberStatus) {
                if (!gTest) { wResult = await createMember(wMember) };
                if (wResult && wResult.status) {
                    if ($w('#inpMemberEditLoginEmail').value.includes("mtbc")) {
                        $w('#lblMTBCCount').text = updateMTBCUsernameCount();
                    }
                    (wContactPref === "N") ? showError("Member", 40) : showError("Member", 23);
                } else {
                    (wContactPref === "N") ? showError("Member", 40) : showError("Member", 7);
                    console.log("/page/MaintainMember btnMemberASave_click creatememberstatus msg,msg");
                    console.log(wResult.error);
                }
                break;
            case MODE.UPDATE:
                let wNewStatus = $w('#drpMemberEditNewStatus').value;
                let wOldStatus = $w('#txtMemberEditOldStatus').text;
                if ( wNewStatus !== wOldStatus) {
                    //  a status change has occured
                    switch (wNewStatus) {
                        case "Pending":
                        case "Active":
                            wMember.dateLeft = undefined;
                            break;
                        case "Wait":
                            wMember.dateLeft = new Date();
                            break;
                        case "Past":
                            if ( $w('#dpkMemberEditDateLeft').hidden) {
                                wMember.dateLeft = new Date();
                            } else {
                                wMember.dateLeft = $w('#dpkMemberEditDateLeft').value;
                            }
                            break;
                    }
                }

                wMember._id = getSelectStackId();
                wResult = await saveRecord("lstMembers", wMember);
                break;
            case MODE.CONVERT:
            /**
             * Here we have a LST and a Wix record.
             * Modify the LST record to update the Username, loginemail, set PENDING to force passsword change
             * Modify the Wix record to change its loginEmail
             * Generate a new session token for Lst
             * Create a new MTBC entry using Session Token + LST id
             */
            
                break;
            default:
                console.log ("/page/Maintain Member btnMemberSave invalid mode = [" + getMode() + "]");
        }
        // Save record performed in switch code blocks above;
        if (wResult  && wResult.status){
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wMember._id = wSavedRecord._id;
                    (wContactPref === "N")? showError("Member", 40) : showError("Member",8);
                    break;
                case MODE.UPDATE:
                    (wContactPref === "N") ? showError("Member", 40) : showError("Member",7);
                    break;
                default:
                    console.log ("/page/MaintainMember btnMemberASave invalid mode = [" + getMode() + "]");
            }
            updateGlobalDataStore(wSavedRecord,"Member");
            updatePagination("Member");
            resetCommands("Member");
        } else {
            if (wResult && wResult.savedRecord){
                console.log("/page/MaintainMember btnMemberASave_click saveRecord failed, savedRecord, error");
                console.log(wResult.savedRecord);
                console.log(wResult.error);
            } else if(wResult){
                console.log("/page/MaintainMember btnMemberASave_click saverecord failed, error");
                console.log(wResult.error);
            } else {
                console.log("/page/MaintainMember btnMemberASave_click wResult undefined")
                console.log(wResult.error);
            }
        }
        resetSection("Member");
        $w('#btnMemberASave').enable();
        hideWait("Member");
        setMode(MODE.CLEAR);
    }
	catch (err) {
		console.log("/page/Maintain Member btnMemberASave_click Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
}

function updateMTBCUsernameCount(){
    let wMTBCCount = parseInt($w('#lblMTBCCount').text,10);
    wMTBCCount++;
    return String(wMTBCCount);
}

export async function drpMemberChoiceType_change(event) {
    //console.log("FilterTypeChoice_change");
    showWait("Member");
    let wType = event.target.value;
    let wStatus = $w('#drpMemberChoiceStatus').value;
    ////displayMemberTableData(wType, wStatus);
    hideWait("Member");
}

export async function drpMemberChoiceStatus_change(event) {
    //console.log("FilterStatusChoice_change");
    showWait("Member");
    let wStatus = event.target.value;
    let wType = $w('#drpMemberChoiceType').value;
    ////displayMemberTableData(wType, wStatus);
    hideWait("Member");

//export async function drpFixtureChoiceTeamChange (event) {
//    drpChoice_change(event);
//}

    //configureScreen(wTarget);
configureScreen("Member");

}

export function strMember_viewportEnter(event) {
    //console.log("viewportEnter");

    //displayMemberTableData($w('#drpMemberChoiceType').value, $w('#drpMemberChoiceStatus').value);
}

// ================================================= Members Supporting Functions =================================================
//

export function showDashboard() {
    let wNoTotal = 0;
    let wNoLadies = 0;
    let wNoMen = 0;
    let wNoSocial = 0;
    let wNoFull = 0;
    let wNoWait = 0;
    let wNoTest = 0;
    let wNoPast = 0;
    let wNoJoined = 0;
    let wNoLeft = 0;
    let wRow = [ {"total": wNoTotal, "ladies": wNoLadies , "men": wNoMen ,"social": wNoSocial, "full": wNoFull, 
                    "wait": wNoWait, "test": wNoTest, "past": wNoPast, "joined": wNoJoined, "left": wNoLeft}
    ];

    $w('#tblMemberDashboard').rows = wRow;
}

export function updateDashboard() {
    const locale = 'en-GB';

    const options = {
        //weekday: 'long',
        month: 'short',
        //day: 'numeric',
        year: 'numeric',
    };
    
    let wYearStart = new Date(gYear-1, 8, 1);
    let wMembers = getEntity("Member");
    let wNoSocial = wMembers.filter ( item => item.type === "Social" && item.status === "Active").length;
    let wNoFull = wMembers.filter ( item => item.type === "Full" && item.status === "Active").length;
    let wNoLadies = wMembers.filter ( item => item.gender === "L" && item.status === "Active" && item.type !== "Test").length;
    let wNoMen = wMembers.filter ( item => item.gender === "M" && item.status === "Active" && item.type !== "Test").length;
    let wNoWait = wMembers.filter ( item => item.type === "Wait").length;
    let wNoTest = wMembers.filter ( item => item.type === "Test").length;
    let wNoTotal = wNoSocial + wNoFull;
    let wPast = wMembers.filter ( item => item.status === "Past");
    let wNoPast = wPast.length;
    let wNewMembersSet = wMembers.filter ( item => item._createdDate > wYearStart);
    let wNoJoined = wNewMembersSet.length;
    let wOldMembersSet = wMembers.filter ( item => item.status === "Past" && item.dateLeft !== undefined && item.dateLeft > wYearStart);
    let wNoLeft = wOldMembersSet.length;
    let wRow = [ {"total": wNoTotal, "ladies": wNoLadies , "men": wNoMen ,"social": wNoSocial, "full": wNoFull, 
                    "wait": wNoWait, "test": wNoTest, "past": wNoPast, "joined": wNoJoined, "left": wNoLeft}
    ];

    $w('#lblMTBCCount').text = getMTBCMaxValue(wMembers);

    $w('#lblSinceDate').text = wYearStart.toLocaleDateString(locale, options);

    $w('#tblMemberDashboard').rows = wRow;
}
export function getMTBCMaxValue(pDataset){
    //  Determine the highest MTBCnn value and display +1
    let wMTBCMaxValue = 0;
    let wMTBCRecs = pDataset.filter ( item => item.loginEmail.includes("mtbc"));
    let wMTBCIds = wMTBCRecs.map ( item => {
        let x = item.loginEmail.indexOf("@");
        return parseInt(item.loginEmail.substring(4,x),10);
    })
    wMTBCMaxValue = Math.max(...wMTBCIds) + 1;
    return String(wMTBCMaxValue);
}

export function alreadyExists(pLoginEmail) {
    let wRec = gLstMembers.filter ( item => item.loginEmail === pLoginEmail);
    if (wRec.length > 0) {
        return true};
    return false;
}
export async  function validateLoginEmail (value, reject){

        if (gMode === MODE.UPDATE) { return};
		let wValue = String(value).trim();
		if (wValue === "" || wValue.length < 3) {
			reject("Enter a meaningful title");
            return;
		}
        if (!wValue.includes("@")) {
            reject("Enter a valid email address format");
            return;
        }
        if (alreadyExists(wValue)) {
            reject("Email address already used");
            return;
        }
        if (wValue.includes("mtbc")) {
            $w('#inpMemberEditContactEmail').value = "";
        } else { 
            $w('#inpMemberEditContactEmail').value = wValue;
        }
}

export function btnMemberEditClearPhoto_click(event) {
    let wGender = $w('#inpMemberEditMix').value || "L";
    let wPhoto = (wGender === "L") ?  gWomanOutline:  gManOutline;
    $w("#imgMemberEditPhoto").src = wPhoto;
}

export function upbMemberEditPhoto_change(event) {
    showWait("Member");
    $w('#btnMemberASave').disable();
    $w("#txtMemberErrMsg").expand();
    if ($w("#upbMemberEditPhoto").value.length > 0) {
        $w("#txtMemberErrMsg").text = "Uploading " + $w("#upbMemberEditPhoto").value[0].name;
        $w("#upbMemberEditPhoto").uploadFiles()
            .then((uploadedFiles) => {
                $w("#txtMemberErrMsg").text = "Upload successful";
                $w("#imgMemberEditPhoto").src = uploadedFiles[0].fileUrl;
                setTimeout(() => {
                    $w('#btnMemberASave').enable();
                    $w("#txtMemberErrMsg").collapse();
                    hideWait("Member");
                }, 3500);
            })
            .catch((uploadError) => {
                $w("#txtMemberErrMsg").text = "File upload error";
                console.log("/MaintainMember File upload error: " + uploadError.errorCode);
                console.log("/MaintainMember ", uploadError.errorDescription);
                setTimeout(() => {
                    $w('#btnMemberASave').enable();
                    $w("#txtMemberErrMsg").collapse();
                    hideWait("Member");
                }, 2500);
            });
    } else {
        $w("#txtMemberErrMsg").text = "Please choose a file to upload.";
        setTimeout(() => {
            $w('#btnMemberASave').enable();
            $w("#txtMemberErrMsg").collapse();
            hideWait("Member");
        }, 2500);
    }
}

export function inpPhone_change(event) {
    let wControl = event.target;
    let wNumberInput = event.target.value;
    let wNumber = hyphenatePhoneNumber(wNumberInput);
    if (wNumber === "-1") {
        showError("Member", 4, 11);
        wControl.focus();
    } else {
        wControl.value = wNumber;
        wControl.resetValidityIndication();
    }
}

export function btnMemberEditMoreDIsplayClick() {
    let wButton = $w('#btnMemberEditMoreDisplay').label;
    let wBits = wButton.split(" ");
    let wState = wBits[0];
    if (wState === "Show") {
        $w('#boxMemberEditMore').expand();
        $w('#btnMemberEditMoreDisplay').label = "Hide ^";
    } else {
        $w('#boxMemberEditMore').collapse();
        $w('#btnMemberEditMoreDisplay').label = "Show V";
    }
}

export function inpMemberEditUsername_change(event) {
    let wUsername = event.target.value;
    if (wUsername.length < USERNAME_LENGTH) {
            $w('#inpMemberEditUsername').updateValidityIndication();
            showError("Member", 24);
            $w('#inpMemberEditUsername').focus();
            return
    } else {
        $w('#inpMemberEditLoginEmail').value = setMTBCUsername();
        $w('#inpMemberEditLoginEmail').disable();
    }
}
function setMTBCUsername(){
    let wMTBCCount = parseInt($w('#lblMTBCCount').text,10);
    console.log("/page/MaintainMember inpEditUsername_change MTBC Count =  ", wMTBCCount);
    return `mtbc${wMTBCCount}@maidenheadtownbc.com`;
}

function hyphenatePhoneNumber(pPhoneNumber) {
    let wDisplayNumber = "";
    if (pPhoneNumber === null || pPhoneNumber === "" || pPhoneNumber === undefined) return "";
    let wNumber = pPhoneNumber.trim();
    let wNumberNoSpaces = wNumber.replace(/\s/g, "");
    let wModifiedNumber = wNumberNoSpaces.replaceAll("-", "");
    let wInputLength = wModifiedNumber.length;
    let wAreaCode = "";
    let wGroup1 = "";
    let wGroup2 = "";
    switch (wInputLength) {
    case 11:
        wAreaCode = wModifiedNumber.substring(0, 5);
        wGroup1 = wModifiedNumber.substring(5, 8);
        wGroup2 = wModifiedNumber.substring(8);
        wDisplayNumber = wAreaCode + "-" + wGroup1 + "-" + wGroup2;
        break;
    case 10:
        if (parseInt(wModifiedNumber[0], 10) !== 0) {
            wModifiedNumber = "0" + wModifiedNumber;
            wAreaCode = wModifiedNumber.substring(0, 5);
            wGroup1 = wModifiedNumber.substring(5, 8);
            wGroup2 = wModifiedNumber.substring(8);
            wDisplayNumber = wAreaCode + "-" + wGroup1 + "-" + wGroup2;
        } else {
            wDisplayNumber = "-1";
        }
        break;
    case 6:
        wGroup1 = wModifiedNumber.substring(0, 3);
        wGroup2 = wModifiedNumber.substring(3);
        wDisplayNumber = wGroup1 + "-" + wGroup2;
        break;
    case 0:
        wDisplayNumber = "-1";
        break;
    default:
        wDisplayNumber = "-1";
        break;
    }
    return wDisplayNumber;
}

// ================================================= FROM USER MAINTENANCE =================================================
//
//  This section runs tests against the Import, LST and Wix datasets to ensure they are in sync. It is a 2 stage process:
//  Stage 1 compares Lst against Import, and ensures Lst is in step with Import. Import is the master dataset.
//  Stage 2 compares Wix against Lst , and ensures they are in step. Lst is taken as the master dataset.  
//

import { getActiveWixMembers } from 'backend/backMember.jsw';
import { getFlattenedWixMember } from 'backend/backMember.jsw';
import { getWixMembersTestData } from 'backend/backMember.jsw';
import { updateWixMember } from 'backend/backMember.jsw';
import { updateLstMember } from 'backend/backMember.jsw';
import { bulkSaveLstMember } from 'backend/backMember.jsw';
import { convertNull } from 'backend/backMember.jsw';
import { formPhoneString } from 'backend/backMember.jsw';

let gMsgCount = 0;

let gWixMembers = [];
let gLstMembers = [];
let gImpMembers = [];
let gStage = "Lst-Import";

let gMessages = [];

export async function doStage1(event) {
    //  A = LSt B = Import  C = Wix
    // Arrays containing elements common to A, B, and C

    gMessages.length = 0;
    showMessage(gStage);
    $w('#tblProgress').rows = gMessages;
    showMessage("Loading Lst Members");         //B
    let promiseA = loadLstMembersData();
    showMessage("Loading Wix Members");      //C
    let promiseC = loadWixMembersData();
    showMessage("Loading Import Members");      //C
    let promiseB = loadImpMembersData();
    Promise.all([promiseA, promiseB,promiseC]).then(async ()=>{
        if (reconcileMTBCValues()){
            messageDone(0);
            const onlyA = unique(gLstMembers, gImpMembers);
            const onlyB = unique(gImpMembers, gLstMembers);
            //console.log("gLst, gImp,onlyB, onlyC");
            //console.log(onlyB);
            //console.log(onlyC);
            if (onlyA.length > 0 || onlyB.length > 0) {
                showMessage("Reconcile Lst with Import");
                reconcileDatasets(onlyA, onlyB);
            } else {
                gStage = "Field-Values";
                messageDone(3);
            }
        } else {
            showMessage("MTBC Max Value disparity");
            messageDone(5);
        }
    })
}

export async function doStage2(event){
    gMessages.length = 0;
    showMessage(gStage);
    $w('#tblProgress').rows = gMessages;
    showMessage("Loading Lst Members");         //B
    let promiseA = loadLstMembersData();
    showMessage("Loading Import Members");      //C
    let promiseB = loadImpMembersData();
    Promise.all([promiseA,promiseB]).then(async()=>{
        showMessage("Synchronise Lst field values");
        synchroniseFieldValues();
        gStage = "Lst-Wix";
        messageDone(3);
        showMessage("Sync done " + gStage)
    })
}

export async function doStage3(event){

    gMessages.length = 0;
    showMessage(gStage);
    $w('#tblProgress').rows = gMessages;
    showMessage("Loading Lst Members");         //B
    let promiseA = loadLstMembersData();
    showMessage("Loading Wix Members");      //C
    let promiseC = loadWixMembersData();

    Promise.all([promiseA,promiseC]).then(()=>{
        gStage = "Lst-Wix";
        messageDone(3);
        showMessage("Reconcile Lst with Wix");
        const onlyC = unique(gWixMembers, gLstMembers);
        const onlyD = unique(gLstMembers, gWixMembers);
        if (onlyC.length > 0 || onlyD.length > 0) {
            reconcileDatasets(onlyD, onlyC);
        } else {
            gStage = "End";
            messageDone(4);
        }
    })
}

function reconcileMTBCValues(){
    showMessage("Reconcile MTBC values");
    if (gLstMembers){
        if (gWixMembers){
            let wLstMaxValue = getMTBCMaxValue(gLstMembers);
            let wWixMaxValue = getMTBCMaxValue(gWixMembers);
            if (wLstMaxValue === wWixMaxValue){
                showMessage("MTBC values agree");
                messageDone(4);
                messageDone(5);
                return true;
            } else {
                showMessage(`Lst Max Value = ${wLstMaxValue} Wix Max Value = ${wWixMaxValue}`);
                return false;
            } 
        } else {
            showMessage("Wix Members Load fail")
            return false;
        }
    } else {
        showMessage("Lst Members Load fail")
        return false;
    }
}

function reconcileDatasets(pA, pB){
    $w('#boxLstCompare').expand();
    $w('#txtRightHdr').text = (gStage === "Lst-Import") ? "The following members are in Import only" :
                                                "The following members are in Wix only" ;
    if (gStage === "Lst-Import") {
        $w('#boxStage1Commands').expand();
        $w('#boxStage2Commands').collapse();
    } else {
        $w('#boxStage1Commands').collapse();
        $w('#boxStage2Commands').expand();
    }
    if (pA && pA.length > 0) {
        $w('#rpt2'). show()    
        $w('#txt2None').hide();
        $w('#rpt2').data = pA;
    } else {
        $w('#rpt2'). hide()    
        $w('#txt2None').show();
    }
    if (pB && pB.length > 0) {
        $w('#rpt3'). show()    
        $w('#txt3None').hide();
        $w('#rpt3').data = pB;
    } else {
        $w('#rpt3'). hide()    
        $w('#txt3None').show();
    }
}

function synchroniseFieldValues(){
    // Once the Lst entries are confirmed, need to check each entry to ensure main data fields agree.
    // The assumption is that the Import spreadsheet is the master source. Therefore, any discrepancy, copy the Import
    // value to the Lst record. (However, there is a possibility that the member may chose to amend their data online
    // through their Profile Edit. This does generate an update email to the Membership Officer, so it is assumed that 
    // these changes will be in the spreadsheet). The fields comapred are address fields and telephone fields. Lockers
    // dealt with seperately in its own section.  
    //for (let wMember of gLstMembers){

    //
    let wFieldNames = ["addrLine1", "addrLine2", "town", "postCode", "homePhone", "mobilePhone", "contactEmail"];
    let wImpFieldNames = ["add1", "add2", "add3", "postcode", "home", "mobile", "email"];
    let wChangeList = [];
    //let wLstMember = gLstMembers[1];
    for (let wLstMember of gLstMembers){
        let wLstIn;
        let wImpIn;
        let wLst = "";
        let wImp = "";
        let wChanged = false;
        let wMsg = "";
        let wImpMember = gImpMembers.find( item => item.key === wLstMember.key);
        if (wImpMember){
            for (let i = 0; i < 7; i++) {
                let wFK = wFieldNames[i];
                let wImpFK = wImpFieldNames[i];
                wLstIn = wLstMember[wFK];
                wImpIn = wImpMember[wFK];
                wLst = (wLstIn && wLstIn.length > 0) ? wLstIn.trim() : null;
                wImp = (wImpIn && wImpIn.length > 0) ? wImpIn.trim() : null;
                if (wFK.includes("Phone")){
                    if (wImpIn && wImpIn.length === 6){
                        wLst = wLst.slice(-6);
                    }    
                    if(!wImp){
                        wLst = "no phone #";
                    }
                    wImp = (wImp) ? wImp.replace(/-/g, "") : null;
                    wImp = (wImp ==="0") ? "no phone #" : wImp;
                }   
                if (wLst !== wImp) {
                    if (wImp === "" || wImp === null || wImp === undefined){
                        wLst = (wFK.includes("Phone")) ? "no phone #" : null;
                    } else {
                        wChanged = true;
                        if (wLst){
                            if (wImp){
                                wMsg = wMsg + `field ${wFK} changed from ${wLst} to ${wImp}\n`;
                            } else {
                                wMsg = wMsg + `field ${wFK} changed from ${wLst} to null\n`;
                            }
                        } else {
                            if (wImp){
                                wMsg = wMsg + `field ${wFK} changed from null to ${wImp}\n`;
                            } else {
                                wMsg = wMsg + `field ${wFK} not changed - is null\n`;
                            }
                        }
                        wLst = wImp;
                    }
                } else {
                    if (wLst && wLst.length < wLstIn.length) {
                        if (wFK !== "homePhone") {
                            wChanged = true;
                            wMsg = wMsg + `field ${wFK} trimmed from ${String(wLstIn.length)} to ${String(wLst.length)}\n`;
                        }
                    }
                }
            } // for i 1 to 7 loop
            if (wChanged) {
                //save record
                //let wResult  await savedRecord("lstMember", wLstMember);
                let wResult.status = true;
                if (wResult && wResult.status){
                    let wOut = `The following changes were made to ${wLstMember.key}'s Lst record:\n` + wMsg + "\n";
                    console.log(wOut);
                    wChangeList.push(wOut);
                    $w('#btnLstAmend').hide();
                    removeFromSet("2", wMember2._id);
                    removeFromSet("3", wMember3._id);
                    $w('#boxLstAmend').collapse();
                    showMsg(1,0,`Import name ${wTargetMember.firstName} ${wTargetMember.surname} updated`);
                } else {
                    console.log("/MaintainMember synchroniseFieldValues sendMsg failed, error");
                    console.log(wResult.error);
                }
                    wChanged = false;
            }
        } else {
            console.log(`/MaintainMember synchroniseFieldValues Cant find member ${wLstMember.key}`);
        }
    }   // for of gLstMembers
    if (wChangeList && wChangeList.length > 0) {
        let wParams = {    
            "changeList": wChangeList
        }

        wResult = await sendMsg("E", "WEB", null, null, false, "MemberAmendFieldValues", wParams);
         //let wResult.status = true;
        if (wResult && wResult.status){
            console.log("/MaintainMember synchroniseFieldValues sendMsg OK");
        } else {
            console.log("/MaintainMember synchroniseFieldValues sendMsg failed, error");
            console.log(wResult.error);
        }
    }    
    return true;
}

//------------------------------------------------------------
// Example arrays
const A = [{ id: 1 }, { id: 2 }, { id: 3 }];
const B = [{ id: 2 }, { id: 3 }, { id: 4 }];
const C = [{ id: 3 }, { id: 4 }, { id: 5 }];

// Helper function to find unique elements in an array
const unique = (array, ...excludeArrays) => {
    return array.filter(item => 
        !excludeArrays.some(excludeArray => 
            excludeArray.some(excludeItem => excludeItem.key === item.key)
        )
    );
};
/**
    // Arrays containing elements from A and B, not C
    const AandBnotC = gWixMembers.filter(a => 
        gLstMembers.some(b => b.key === a.key) && 
        !gImpMembers.some(c => c.key === a.key)
    );
    console.log("Only Wix and Lst, not Imp");
    console.log(AandBnotC);

    // Arrays containing elements from B and C, not A
    const BandCnotA = gLstMembers.filter(b => 
        gImpMembers.some(c => c.key === b.key) && 
        !gWixMembers.some(a => a.key === b.key)
    );
    console.log("Only Lst and Imp, not Wix");
    console.log(BandCnotA);

    // Arrays containing elements from A and C, not B
    const AandCnotB = gWixMembers.filter(a => 
        gImpMembers.some(c => c.key === a.key) && 
        !gLstMembers.some(b => b.key === a.key)
    );
    console.log("Only Wix and Imp, not LSt");
    console.log(AandCnotB);

    // Arrays containing elements common to A, B, and C
    const AandBandC = gWixMembers.filter(a => 
        gLstMembers.some(b => b.key === a.key) && 
        gImpMembers.some(c => c.key === a.key)
    );
*/
    /**
    if (onlyA.length > 0) {
        $w('#rpt1'). show()    
        $w('#txt1None').hide();
        $w('#rpt1').data = onlyA;
    } else {
        $w('#rpt1'). hide()    
        $w('#txt1None').show();
    }
    */
    /**
    if (AandBnotC.length > 0) {
        $w('#rpt4'). show()    
        $w('#txt4None').hide();
        $w('#rpt4').data = AandBnotC;
    } else {
        $w('#rpt4'). hide()    
        $w('#txt4None').show();
    }
    if (BandCnotA.length > 0) {
        $w('#rpt5'). show()    
        $w('#txt5None').hide();
        $w('#rpt5').data = BandCnotA;
    } else {
        $w('#rpt5'). hide()    
        $w('#txt5None').show();
    }
    if (AandCnotB.length > 0) {
        $w('#rpt6'). show()    
        $w('#txt6None').hide();
        $w('#rpt6').data = AandCnotB;
    } else {
        $w('#rpt6'). hide()    
        $w('#txt6None').show();
    }

    if (BandC.length > 0) {
        $w('#rpt7'). show()    
        $w('#txt7None').hide();
        $w('#rpt7').data = BandC;
    } else {
        $w('#rpt7'). hide()    
        $w('#txt7None').show();
    }
    */


//============================================================
function loadRptN(pN, pItem, pRec) {
     
    let wControl1 = `#txt${pN}Player`;
    let wControl2 = `#chk${pN}`;
    if (pN === "2") {
        pItem(`#lbl2Status`).text = pRec.status;
    }
    pItem(wControl1).text = pRec.key;
    pItem(wControl2).checked = false;
}

function loadRptUpdates(pItem, pRec) {
    let wId = pRec._id.substring(0, 8);
    let wStatus = "";
    switch (pRec.status) {
    case "F":
        wStatus = "Fail";
        break;
    case "D":
        wStatus = "Done";
        break;
    default:
        wStatus = "";
        break;
    }
    pItem('#txtWixUpdateId').text = wId;
    pItem('#txtWixUpdateName').text = pRec.name;
    pItem('#txtWixUpdateField').text = pRec.fieldName || "";
    pItem('#txtWixUpdateWixValue').text = pRec.wixValue || "";
    pItem('#txtWixUpdateLstValue').text = pRec.lstValue || "";
    pItem('#txtWixUpdateStatus').text = wStatus;
    pItem('#chkWixUpdateSelect').checked = false;
}

function loadRptSkipped(pItem, pRec) {
    let wId = pRec._id.substring(0, 8);
    pItem('#txtSkippedId').text = wId;
    pItem('#txtSkippedName').text = pRec.name;
    pItem('#txtSkippedField').text = pRec.fieldName || "";
    pItem('#txtSkippedWixValue').text = pRec.wixValue || "";
    pItem('#txtSkippedLstValue').text = pRec.lstValue || "";
    pItem('#chkSkippedSelect').checked = false;
}

async function loadWixMembersData() {
    //console.log("loadWix`MembersData", gTest);

    let wWixMembers = [];
    //if (gTest) {
    //    wWixMembers = await getWixMembersTestData();
    //} else {
        let wWixContactsMembers = await getActiveWixMembers();
        for (let wMember of wWixContactsMembers){
            let wTempMember = wMember;
            wTempMember.key = wTempMember.name;
            gWixMembers.push(wTempMember);
        }
        (gStage = "Lst-Import") ? messageDone(2) : messageDone(3);
        /**  
        let count = 1;
        $w('#pbrLoading').targetValue = wWixContactsMembers.length-1;
        $w('#pbrLoading').value = 0;
        for (let wTmpMember of wWixContactsMembers) {
            $w('#pbrLoading').value = count;
            let wFullWixMember = await getFlattenedWixMember(wTmpMember._id);
            wFullWixMember.key = wFullWixMember.firstName + " " + wFullWixMember.lastName;
            if (wFullWixMember) {
                wWixMembers.push(wFullWixMember);
            }count++;
            //if (count > 20) {break}
        $w('#lblCount').text = String(count) + ` of ${wWixContactsMembers.length}`;
        }
    //}
    $w('#btnSyncStart').enable();
    gWixMembers = wWixMembers;
    console.log(gWixMembers);
    */
}

async function loadLstMembersData() {

    let wAll = await getAllMembers2();
    gLstMembers = wAll.filter (item => item.username !== "ClubHouse")
                        .filter( item => item.status !== "Past")
                        .filter( item => item.type !== "Test");
    for (let wMember of gLstMembers ) {
        wMember.key = wMember.fullName;
    }
    messageDone(1);
}

async function loadImpMembersData() {

    gImpMembers = await getAllImportMembers();
    messageDone(2);
}

function showMessage(pMsg) {

    let wMsg = { "idx": "", "msg": "", "status": "" };
    wMsg.msg = pMsg;
    wMsg.idx = String(gMessages.length + 1);
    gMessages.push(wMsg);
    $w('#tblProgress').rows = gMessages;

}

function messageDone(pN) {
    //let wMsgCount = gMessages.length;
    ///let wMsg = gMessages[wMsgCount - 1];
    let wMsg = gMessages[pN];
    if (wMsg) {
        wMsg.status = "Done";
        $w('#tblProgress').rows = gMessages;
    }
}
//------------------------------------------
    
let wLast2Id = null;
let wLast3Id = null;
let wMember2 = {};
let wMember3 = {};

export function boxRpt_click(pN, event){
    let wItem = $w.at(event.context);
    let wId = event.context.itemId;
    let wLast = (pN === "2") ? wLast2Id : wLast3Id;
    if (wId === wLast) { return }
    const data = $w(`#rpt${pN}`).data;
    
    let wMember= data.find(
      (item) => item._id === wId,
    )
    makeSelection(pN, wItem);   
    if (wLast) {
        clearSelection (pN, wLast)
    }
    if (pN === "2") {
        wLast2Id = wId;
        wMember2 = {...wMember};
    } else {
        wLast3Id = wId;
        wMember3 = {...wMember};
    }
    function makeSelection(pN, pItem){
        pItem(`#boxRpt${pN}`).style.backgroundColor = COLOUR.SELECTED;
        switch (gStage) {
            case "Lst-Import":
                $w('#btnLstAmend').show();
                break;
            case "Lst-Wix":
                $w('#btnWixUpdate').show();
                break;
        }
    }
    
    function clearSelection(pN, pId){
        $w(`#rpt${pN}`).forItems ([pId] , ($item) =>{
            $item(`#boxRpt${pN}`).style.backgroundColor = COLOUR.FREE;
        })
    }
    }

export function clearAllSelection(pN){
    $w(`#rpt${pN}`).forEachItem( ($item) =>{
        $item(`#boxRpt${pN}`).style.backgroundColor = COLOUR.FREE;
    })
}

export function chkSyncSelect_click(pN, pEvent){
    let wControl = $w.at(pEvent.context);
    let wId = pEvent.context.itemId;
	let wItem = getSyncTargetItem(pN, wId);
    if (wControl(`#chk${pN}`).checked) {
        pushToSelectStack(wItem, wId, pN);
    } else { 
        pullFromSelectStack(wItem, wId, pN);
    }
    configureSyncCommands(pN);
}

function configureSyncCommands(pN) {
    let wSelectedStack = [];
    if (pN === "2" ) {    
        wSelectedStack = [...gSelectLeftStack];
    } else {
        wSelectedStack = [...gSelectRightStack];
    }
    let wSelectedStackCount = wSelectedStack.length;
    if (gStage === "Lst-Import"){
        if (pN === "2"){
            switch (wSelectedStackCount) {
                case 0:
                    $w('#btnLstPast').hide();
                    $w('#btnLstTest').hide();
                    break;
                case 1:
                    $w('#btnLstPast').show();
                    $w('#btnLstTest').show();
                    break;
                default:
                    $w('#btnLstPast').show();
                    $w('#btnLstTest').show();
                    break;
            }
        } /** pN = 3 */ else {
            switch (wSelectedStackCount) {
                case 0:
                    $w('#btnImpNewFull').hide();
                    $w('#btnImpNewSocial').hide();
                    break;
                case 1:
                    $w('#btnImpNewFull').show();
                    $w('#btnImpNewSocial').show();
                    break;
                default:
                    $w('#btnImpNewFull').show();
                    $w('#btnImpNewSocial').show();
                    break;
            }
        } //else
    } else if (gStage === "Lst-Wix"){
        if (pN === "2"){
            switch (wSelectedStackCount) {
                case 0:
                    $w('#btnLstRegister').hide();
                    break;
                case 1:
                    $w('#btnLstRegister').show();
                    break;
                default:
                    $w('#btnLstRegister').show();
                    break;
            }
        } /** pN === 3 */ else {
            switch (wSelectedStackCount) {
                case 0:
                    $w('#btnWixUpdate').hide();
                    $w('#btnWixDelete').hide();
                    break;
                case 1:
                    $w('#btnWixUpdate').show();
                    $w('#btnWixDelete').show();
                    break;
                default:
                    $w('#btnWixUpdate').hide();
                    $w('#btnWixDelete').show();
                    break;
            }
        }
    } // gStage = Lst-Wix
}    

export function pullFromSelectStack(pRec, pId, pN) {

    //console.log("Pull from Select Stack");
	//	Updates the gEntities record
	pRec.selected = false;
    if (pN === "2") {
        let x = gSelectLeftStack.findIndex( item => item === pId);
        if (x > -1) {
            gSelectLeftStack.splice(x,1);
        }
    } else {
        let x = gSelectRightStack.findIndex( item => item === pId);
        if (x > -1) {
            gSelectRightStack.splice(x,1);
        }
    }
}

function removeFromSet(pN, pId){

    let wRpt = $w(`#rpt${pN}`);
    let wTxtNone = $w(`#txt${pN}None`); 
    let wOnlyLeft = [];
    let wOnlyRight = [];
    if (pN === "2") {
        wOnlyLeft = wRpt.data;
        let x = wOnlyLeft.findIndex( item => item._id === pId);
        if (x > -1) {
            wOnlyLeft.splice(x,1);
        }
        if (wOnlyLeft.length === 0){
           wRpt.collapse();
           wTxtNone.expand();
        } else {
           wRpt.expand();
           wTxtNone.collapse();
           wRpt.data = wOnlyLeft;
        }
    } else {  
        wOnlyRight = wRpt.data;
        let x = wOnlyRight.findIndex( item => item._id === pId);
        if (x > -1) {
            wOnlyRight.splice(x,1);
        }
        if (wOnlyRight.length === 0){
           wRpt.collapse();
           wTxtNone.expand();
        } else {
           wRpt.expand();
           wTxtNone.collapse();
           wRpt.data = wOnlyRight;
        }
    }
    if (wOnlyLeft.length === 0 && wOnlyRight.length === 0) {
           $w('#txtRefresh').expand();
           messageDone();
    } else {
           $w('#txtRefresh').collapse();
    }
}

/**
 * Summary:	Adds the specified ID from the selection stack and updates the list counter.
 *
 * @function
 * @param {string} pId - The ID to be removed from the selection stack.
 * 
 * @returns {void}
 */
export function pushToSelectStack(pRec, pId, pN) {
	//console.log("Push to Select Stack");
	//	Updates the gEntities record
	pRec.selected = true;
    if (pN === "2") {
        let x = gSelectLeftStack.findIndex( item => item === pId);
        if (x === -1){
            gSelectLeftStack.push(pId);
        }
    } else {
        let x = gSelectRightStack.findIndex( item => item === pId);
        if (x === -1){
            gSelectRightStack.push(pId);
        }
    }
}

export function getSyncTargetItem (pTarget, pId){
    if (gStage === "Lst-Import") {
        switch (pTarget) {
            case "2":
                return gLstMembers.find( wItem => wItem._id === pId);
                break;
            case "3":
                return gImpMembers.find( wItem => wItem._id === pId);
                break;
            }
    } else {
        switch (pTarget) {
            case "2":
                return gLstMembers.find( wItem => wItem._id === pId);
                break;
            case "3":
                return gWixMembers.find( wItem => wItem._id === pId);
                break;
            }

    }
}
/**
export function getSyncSelectedItem(pN, pTarget) {
    let wSelectedItem = {};
    let wSelectedStack = [];
    if (pN === "2") {    
        wSelectedStack = [...gSelectLeftStack];
    } else {
        wSelectedStack = [...gSelectRightStack];
    }
    if (wSelectedStack.length === 1) {
        let wSelectedItemId = wSelectedStack[0];
        switch (pTarget) {
            case "2":
                wSelectedItem = gLstMembers.find(item => item._id === wSelectedItemId)
                if (wSelectedItem === -1) {
                    console.log("/public/objects/entity getSelectedItem Lst Not found", pTarget, wSelectedItemId);
                }
                break;
            case "3":
                //wSelectedItem = $w(`#rptMemberList`).data[pPointer];
                //wSelectedItem = $w(`#rptMemberList`).data.find(item => item._id === pPointer)
                wSelectedItem = gImpMembers.find(item => item._id === wSelectedItemId)
                if (wSelectedItem === -1) {
                    console.log("/public/objects/entity getSelectedItem Imp Not found", pTarget, wSelectedItemId);
                }
                break;
        }
    }
    return wSelectedItem;
}
*/
//-------------------------------------- Stage 1: Lst v Import
//
export async function btnLstAmend_click(event) {
//  This is where we have corresponding entries in each side, but they differ only in name.
//  It ban be entered by pressing btnLstAMend in Stage 1, or by btnWixUpdate in Stage2;
//  For Lst-Import reconciliation, either the Lst value or the Import value can be amended.
//  For Lst-Wix reconciliation, then the Lst value is immutable.
//  So, action is to update the Wix record with the Lst values.
    console.log("Btn Lst Update click", gStage);
    $w('#inpLstAmendWebFirstName').value = wMember2.firstName;
    $w('#inpLstAmendWebSurname').value = wMember2.surname;
    $w('#inpLstAmendMasterFirstName').value = wMember3.firstName;
    $w('#inpLstAmendMasterSurname').value = (gStage === "Lst-Import") ? wMember3.surname : wMember3.lastName;
    if (gStage === "Lst-Import"){
        $w('#btn2AmendSave').enable();
        $w('#boxLstAmend').expand();
        $w('#txt2Caption').text = "Web data";
        $w('#txt3Caption').text = "Master data";
        $w('#btn2AmendSave').label = "Update Web Data";
        $w('#btn3AmendSave').label = "Update Import Data";
    } else {
        $w('#btn2AmendSave').enable();
        $w('#boxLstAmend').expand();
        $w('#txt2Caption').text = "Lst data";
        $w('#txt3Caption').text = "Wix data";
        $w('#btn2AmendSave').disable();
        $w('#btn3AmendSave').label = "Update Wix Data";
    }
}

export async function btn2AmendSave_click(event) {
    // Set up from btnLstAmend
    // Update the Lst value with the Import values
    console.log("Btn Lst Amend Save click", gStage);
    showStageWait(1);
    let wMember = getSyncTargetItem("2",wMember2._id);
    if (gStage === "Lst-Import"){
        wMember.firstName = $w('#inpLstAmendMasterFirstName').value;
        wMember.surname =  $w('#inpLstAmendMasterSurname').value;
        let wResult = await saveRecord("lstMembers", wMember);
        if (wResult  && wResult.status){
            let wSavedRecord = wResult.savedRecord;
            updateGlobalDataStore(wSavedRecord,"Member");
            updatePagination("Member");
            $w('#btnLstAmend').hide();
            removeFromSet("2", wMember2._id);
            removeFromSet("3", wMember3._id);
            $w('#boxLstAmend').collapse();
            showMsg(1,0,`LST name ${wMember.firstName} ${wMember.surname} updated`);
        } else {
            console.log("MaintainMember btn2AmendSave saverecord fail");
            console.log(wResult.error);
            showMsg(1,0,`LST name ${wMember.firstName} ${wMember.surname} update failed`);
        }
    } else {
        console.log("MaintainMember btn2AmendSave wrong state", gStage);
        showMsg(1,0,`LST name ${wMember.firstName} ${wMember.surname} wrong stage`);
    }
}

export async function btn3AmendSave_click(event) {
    // Set up from btnLstAmend
    // Update the Wix value with the ImportLst values
    console.log("Btn Imp Amend Save click", gStage);
    let wTargetMember = getSyncTargetItem("3",wMember3._id);
    if (gStage === "Lst-Import"){
        showStageWait(1);
        //  Update the IMport record and send Email to Membership secretary to update Master membership spreadsheet
        let wOldName = wTargetMember.firstName + " " + wTargetMember.surname;
        wTargetMember.firstName = $w('#inpLstAmendWebFirstName').value;
        wTargetMember.surname =  $w('#inpLstAmendWebSurname').value;
        let wResult = await saveImportMemberRecord(wTargetMember);
        //  Send message to Membership secreatry

        if (wResult  && wResult.status){
            let wParams = {    
                "oldName": wOldName,
                "newName": wTargetMember.firstName + " " + wTargetMember.surname
            }
    
            wResult = await sendMsg("E", "WEB", null, null, false, "MemberAmendImportName", wParams);
            //let wResult.status = true;
            if (wResult && wResult.status){
                console.log("/MaintainMember btn3AmendSave sendMsgToJob OK for ", wTargetMember._id);
                $w('#btnLstAmend').hide();
                removeFromSet("2", wMember2._id);
                removeFromSet("3", wMember3._id);
                $w('#boxLstAmend').collapse();
                showMsg(1,0,`Import name ${wTargetMember.firstName} ${wTargetMember.surname} updated`);
            } else {
                console.log("/MaintainMember btn3AmendSave sendMsgToJob failed, error");
                console.log(wResult.error);
            }
        } else {
            console.log("MaintainMember btn3AmendSave saverecord fail");
            console.log(wResult.error);
            showMsg(1,0,`Import name ${wTargetMember.firstName} ${wTargetMember.surname} update failed`);
        }
    } else if (gStage === "Lst-Wix"){
        showStageWait(2);
        //  Update the Wix record
        let wFirstName = $w('#inpLstAmendWebFirstName').value.trim();
        let wSurname = $w('#inpLstAmendWebSurname').value.trim();
        wTargetMember.firstName = wFirstName;
        wTargetMember.lastName =  wSurname;
        wTargetMember._id = wMember3._id;
        let wResult = await updateWixMember(wTargetMember);
        $w('#btnLstAmend').hide();
        removeFromSet("2", wMember2._id);
        removeFromSet("3", wMember3._id);
        $w('#boxLstAmend').collapse();
        showMsg(2,0,`Wix name ${wFirstName} ${wSurname} updated`);
    } else {
        console.log("MaintainMember btn3AmendSave wrong state", gStage);
        showMsg(2,0,`Wix name ${wTargetMember.firstName} ${wTargetMember.lastName} updated`);
    }
}

export function btnAmendCancel_click(){
    $w('#inpLstAmendWebFirstName').value = "";
    $w('#inpLstAmendWebSurname').value = "";
    $w('#inpLstAmendMasterFirstName').value = "";
    $w('#inpLstAmendMasterSurname').value = "";
    $w('#btnLstAmend').hide();
    $w('#btnWixUpdate').hide();
    $w('#btnWixDelete').hide();
    $w('#btnLstRegister').hide();
    
    
    wLast2Id = null;
    wLast3Id = null;
    clearAllSelection(2);
    clearAllSelection(3);
    $w('#boxLstAmend').collapse();
}

export async function btnLstPast_click(event) {
    // There is an entry in Lst but not in Import. This is the case for members who have left the club or who
    // have passed away.
    $w('#btnLstPast').disable();
    await updateLstMembers("btnLstPast", "2", "Past");
    $w('#btnLstPast').enable();
}


export async function btnLstTest_click(event) {
    // There is an entry in Lst but not in Import. This is the case for decvelopment members used in local testing
    $w('#btnLstTest').disable();
    await updateLstMembers("btnLstTest", "2", "");
    $w('#btnLstTest').enable();
}

async function updateLstMembers(pSource, pN, pStatus) {
    showStageWait(1);
    let wUpdateStack = [];
    let wToday = new Date();
    for (let wMemberId of gSelectLeftStack) {
        let wMember = gLstMembers.find(item => item._id === wMemberId)
        if (wMember) {
            if (pSource === "btnLstPast"){ 
                wMember.status = pStatus;
                wMember.dateLeft = wToday;
            } else {
                wMember.type = "Test";
            }
            wUpdateStack.push(wMember);
            removeFromSet(pN, wMemberId);
        } else {
            console.log("/MaintainMember ${pSource} Lst Not found", wMemberId);
        }
    }
    if (wUpdateStack && wUpdateStack.length > 0) {
        let wResult = await bulkSaveRecords("lstMembers", wUpdateStack);
        let wUpdateArray = wResult.results.updatedItemIds;
        let wUpdates = wUpdateArray.toString();
        let wErrors = wResult.results.errors.length;        
        console.log(`/MaintainMember ${pSource} Bulk Members Save: ${wUpdates} updated, ${wErrors} errors`);
        if (pN === "2") {
            gSelectLeftStack.length = 0;
            $w('#chk2').checked = false;
        } else {
            gSelectRightStack.length = 0;
            $w('#chk3').checked = false;
        }
        showMsg(1,0,`${pSource} Bulk Members Save: ${String(wUpdateArray.length)} updated, ${wErrors} errors`)
    } else {
        console.log(`/MaintainMember ${pSource} Bulk Members Save: Nothing to update`);
        showMsg(1,0,"Nothing to update");
    }
}

export async function btnImpNew_click(pType, event) {
//  These are entries in Import but not in Lst. These are the new members joined this year. 
//  pType shows which button was pressed: F = Full member, S = Soceial member

    console.log("Btn Imp New click", gStage, pType);
    $w('#lblErrMsg').text = "";
    let wErrMsg = "";
    let wType = (pType === "F") ? "Full" : "Social"
    let wItemIds = [...gSelectRightStack];
    for (let wItemId of wItemIds){
        showStageWait(1);
        let wImportMember = gImpMembers.find(item => item._id === wItemId);
        if (wImportMember) {
            wImportMember.loginEmail = setMTBCUsername();
            wImportMember.type = wType;
            let wResult = await createNewMember(wImportMember);
            if (wResult && wResult.status){
                removeFromSet("3", wMember3._id);
                $w('#lblMTBCCount').text = updateMTBCUsernameCount();
                showMsg(1,0, `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} created`);
            } else {
                // add error result error message to wErrMsg string
                if (wErrMsg.length === 0){
                    wErrMsg = wResult.error;
                } else {
                    wErrMsg = wErrMsg + "\n" + wResult.error;
                }
            showMsg(1,0, `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} creation errors`);
            }
        } else { 
            console.log("/MaintainMember btnImpNew Member Not found", wItemId);
            showMsg(1,0, `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} creation member not found`);
        }
    }
    if (wErrMsg.length > 1){
        $w('#lblErrMsg').text = wErrMsg;
    }
}

async function createNewMember(pMember){
    let wMember = {
        "_id": undefined,
        "username": "",
        "loginEmail": pMember.loginEmail,
        "firstName": pMember.firstName,
        "surname": pMember.surname,
        "gender": pMember.gender,
        "type": pMember.type,
        "status": "Pending",
        "contactpref": "E",
        "allowshare": "Y",
        "contactEmail": pMember.contactEmail,
        "altEmail": "",
        "mobilePhone": pMember.mobilePhone,
        "homePhone": pMember.homePhone,
        "locker": pMember.locker,
        "addrLine1": pMember.addrLine1,
        "addrLine2": pMember.addrLine2,
        "town": pMember.town,
        "postCode": pMember.postCode,
        "wixId": pMember.wixId,
        "photo": ""
    }

    let wUsername = capitalize(pMember.surname) + pMember.firstName[0].toUpperCase();
    let res;
    let wResult;
    if (await isUnique(wUsername)) {
        let wPhoto = (pMember.gender === "M") ? gManOutline : gWomanOutline;
    
        wResult = {"Status": true, "savedRecord": { "_id": "1234"}, "error": ""}
        wMember.username = wUsername;
        wMember.dateLeft = undefined;
        wMember.status = STATUS.PENDING;
        wMember._id = undefined;
        wMember.photo = wPhoto;
        //console.log(wMember);
        wResult = await createMember(wMember);
        if (wResult  && wResult.status){
            let wSavedRecord = wResult.savedRecord;
            updateGlobalDataStore(wSavedRecord,"Member");
            updatePagination("Member");
        } else {
            console.log("MaintainMember createNewMember createMember fail");
            console.log(wResult.error);
        }
    } else {
        console.log("MaintinMember createNewMember username is not unique", wUsername);
        wResult = {"Status": false, "savedRecord": { "_id": "1234"}, "error":  `${wUsername} Username not unique`}
    }
    return wResult;
}
//---------------------------from LST & Wix compare-------------------------
//
export async function btnLstRegister_click(event) {

    console.log("btnLstRegister", gStage);
//  These are LST entries that are in both LST and Import, but not in Wix. This covers old LST 
//  members who were in the club, but they never registered. 
//
//  So, the LST entry will beturned into a Username based LST account, and a Wix record set up for them
//  by registering them. Will also need to generate a Login Token for that user, and create a new MTBC
//  record for the user.
//  1) Create new mmber (Lst, Wix, MTBC) using details from old Lst
//  2) Delete existing Lst member

    const pN = "2";
    let wUpdateStack = [];
    let wToday = new Date();
    $w('#lblErrMsg').text = "";
    let wErrMsg = "";
    for (let wMemberId of gSelectLeftStack) {
        showStageWait(2);
        let wLstMember = gLstMembers.find(item => item._id === wMemberId)
        if (wLstMember) {
            wLstMember.loginEmail = setMTBCUsername();
            let wOldLstId = wLstMember._id;
            wLstMember._id = undefined;
            let wResult = await createNewMember(wLstMember);
            if (wResult && wResult.status){
                removeFromSet("2", wMember2._id);
                await deleteLstMember(wOldLstId);
                $w('#lblMTBCCount').text = updateMTBCUsernameCount();
                showMsg(2,0, `New Wix member ${wLstMember.firstName} ${wLstMember.surname} created`);
            } else {
                // add error result error message to wErrMsg string
                if (wErrMsg.length === 0){
                    wErrMsg = wResult.error;
                } else {
                    wErrMsg = wErrMsg + "\n" + wResult.error;
                }
                showMsg(2,0, `New Wix member ${wLstMember.firstName} ${wLstMember.surname} creation errors`);
            }
        } else { 
            console.log("/MaintainMember btnLstRegister Member Not found", wMemberId);
            showMsg(2,0, `New Wix member: not found`);
        }
    }
    if (wErrMsg.length > 1){
        $w('#lblErrMsg').text = wErrMsg;
    }
}

export async function btnWixDelete_click(event) {
//  This is a Wix member that no longer exists in LST (and hence in Import). It is probably the relic
//  of a once regsitered member, where the Lst record has been deleted and the Wix member left dangling.
//  Therefore, the only action to take is to delete the Wix record to keep everything aligned.
//
    console.log("btnWixDelete", gStage)
    const pN = "3";
    for (let wMemberId of gSelectRightStack) {
        showStageWait(2);
        let wMember = gWixMembers.find(item => item._id === wMemberId)
        if (wMember) {
            await deleteWixMembers([wMemberId]);
            removeFromSet(pN, wMemberId);            
            showMsg(2,0, `Wix member ${wMember.firstName} ${wMember.lastName} deletedd`);
        } else {
            console.log("/MaintainMember btnWixDelete Wix member Not found", wMemberId);
            showMsg(2,0, `Wix member not found`);
        }
    }
    gSelectRightStack.length = 0;
    $w(`#chk${pN}`).checked = false;
}

//----DEPRECATED------------------------------------------
//---------------------------------------------- from btnSyncStart2 ------------------------------
async function syncWixToLst() {
    //console.log("syncWixtoLst");

    function isNotALstMember(pId) {
        let wMember = gLstMembers.filter(item => item.wixId === pId);
        if (wMember) {
            return false
        }
        return true;
    }

    $w('#boxWixSync').expand();
    let wWixMembers = gWixMembers.filter(item => isNotALstMember(item._id))
    if (wWixMembers.length > 0) {
        $w('#rptWixSync').data = wWixMembers;
        $w('#rptWixSync').expand();
        $w('#txtWixSyncNoneFound').collapse();
    } else {
        $w('#rptWixSync').data = [];
        $w('#rptWixSync').collapse();
        $w('#txtWixSyncNoneFound').expand();
    }
}
// WAS FROM btnSuncStart2
export async function checkEachWixMember() {
    //console.log("checkEachWixMember");

    let count = 1;
    $w('#pbrLoading').targetValue = gWixMembers.length - 2;
    $w('#pbrLoading').value = 0;
    //console.log("g Arrays: Wix & Lst");
    //console.log(gWixMembers);
    //console.log(gLstMembers);
    for (let wWixMember of gWixMembers) {
        $w('#pbrLoading').value = count;
        $w('#lblCount').text = String(count) + " " + wWixMember.firstName + " " + wWixMember.lastName;

        ////console.log("");
        ////console.log(wWixMember._id, "+++++++++++++++Wix Member+++++++++++++++++++++++++++++++++=", count);
        //console.log(wWixMember);
        let res = await compareMember(count, wWixMember);
        //console.log("Updated Member");
        //console.log(wUpdatedWixMember);
        //console.log(wUpdatedLstMember);
        ////console.log(wWixMember._id, "+++++++++++++++Wix Member End+++++++++++++++++++++++++++++=", res);
        //console.log("");
        //if (count > 6) {break;}
        count++;
        ////if (count > 10) { break }
    }
}

export async function compareMember(pCount, pWixMember) {

    try {
        let wWixMember = pWixMember;
        let wLstIdx = gLstMembers.findIndex(obj => obj.wixId === wWixMember._id);
        if (wLstIdx === -1) {
            console.log("/page/MaintainMember Couldnt find ", pWixMember._id, " in gLstMembers");
            return false;
        }
        let wLstMember = gLstMembers[wLstIdx];
        //console.log("Before");
        //console.log(wWixMember);
        //console.log(wLstMember);
        let wWixUpdate = false;
        let wLstUpdate = false;
        let wSkip = false;
        [wSkip, wWixUpdate, wLstUpdate] = await compareField(0, wWixMember, wLstMember, "contactEmail", wWixUpdate, wLstUpdate);
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(1, wWixMember, wLstMember, "altEmail", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(2, wWixMember, wLstMember, "gender", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(3, wWixMember, wLstMember, "contactpref", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(4, wWixMember, wLstMember, "homePhone", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(5, wWixMember, wLstMember, "mobilePhone", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(6, wWixMember, wLstMember, "surname", wWixUpdate, wLstUpdate)};
        if (!wSkip) { [wSkip, wWixUpdate, wLstUpdate] = await compareField(7, wWixMember, wLstMember, "firstName", wWixUpdate, wLstUpdate)};
        //console.log("After");
        //console.log(wWixMember);
        //console.log(wLstMember);
        let wReturnStatus = true;
        let wStatus = "N";
        let res = true;
        let wFullName = wLstMember.firstName + " " + wLstMember.surname;
        if (!wSkip) {
            if (wWixUpdate) {
                if (!gTest) {
                    //console.log("UpdateWix");
                    //console.log(wWixMember);
                    res = await updateWixMember(wWixMember);
                }
                if (res) {
                    console.log("/page/MaintainMember compareMember ", pCount, " : Wix Member ", wWixMember._id, wFullName, " updated ok");
                    wStatus = "D";
                } else {
                    wReturnStatus = false;
                    wStatus = "F";
                    console.log("/page/MaintainMember compareMember ", pCount, " : Wix Member ", wWixMember._id, wFullName, " update failed")
                }
                await updateRepeaterStatus(wWixMember._id, wStatus);
            }
            if (wLstUpdate) {
                let res = await updateLstMember(wLstMember);
                if (res) {
                    console.log("/page/MaintainMember compareMember ", pCount, " : Lst Member ", wLstMember._id, wFullName, " updated ok")
                } else {
                    console.log("/page/MaintainMember compareMember ", pCount, " : Lst Member ", wLstMember._id, wFullName, " update failed")
                    wReturnStatus = false;
                }
            }
            if (!wWixUpdate && !wLstUpdate) {
                console.log("/page/MaintainMember compareMember ", pCount, " : No difference in Wix & Lst member " + wFullName);
            }
        } else {
            console.log("/page/MaintainMember compareMember ", pCount, " : Comparison skipped for member", wLstMember.wixId, wLstMember._id, wFullName);
        }
        $w('#rptWixUpdates').data = gWixUpdates;
        $w('#rptSkipped').data = gSkipped;

        return wReturnStatus;
    }
    catch (error) {
	    console.log("/page/Maintain Members/ compareMember TryCatch " + error, pWixMember._id);
		return false;
	}

}

async function updateRepeaterStatus(pId, pStatus) {
    let wData = gWixUpdates.filter(item => item._id.substring(0, item._id.length - 2) === pId);
    wData.forEach(item => item.status = pStatus);
}

export async function compareField(pOffSet, pWixMember, pLstMember, pLstFieldName, pWixUpdate, pLstUpdate) {

    let wWixFlag = false;
    let wLstFlag = false;

    let wWixUpdateTmp = false;
    let wLstUpdateTmp = false;
    let wSkip = false;
    let wWixFieldName = "";
    
    switch (pLstFieldName) {
    case "surname":
        wWixFieldName = "lastName";
        break;
    default:
        wWixFieldName = pLstFieldName;
        break;
    }
    let wAIn = String(pWixMember[wWixFieldName]);
    let wBIn = String(pLstMember[pLstFieldName]);
    //console.log(wAIn, wBIn, typeof wAIn, typeof wBIn);
    let wA = await convertNull(wAIn);
    let wB = await convertNull(wBIn);
    if (wA === null || wA === "null") {
        if (wB === null || wB === "null") {
            //console.log("case 0" , pLstFieldName, wA, wB);
            //console.log("Case 0, null, null");
        } else {
            addRecToList("U", pOffSet, wWixFieldName, pWixMember, pLstMember);
            wA = wB;
            wWixUpdateTmp = true;
            pWixMember[wWixFieldName] = wB;
            //console.log("Case 1", pLstFieldName, wA, wB);
            //console.log("Case 1, null, y");
        }
    } else {
        if (wB === null || wB === "null") {
            wB = wA;
            wLstUpdateTmp = true;
            pLstMember[pLstFieldName] = wA;
            //console.log("Case 2", pLstFieldName, wA, wB);
            //console.log("Case 2, x, null");
        } else {
            if (wA === wB) {
                //console.log(pField, wA, wB);
                //console.log("Case 3A", pLstFieldName, wA, wB);
            } else {
                let wFullname = pLstMember.firstName + " " + pLstMember.surname;
                let wAction = await selectAction(wFullname, pLstFieldName, wA, wB);
                switch (wAction) {
                case "W": // keep the Wix value
                    wSkip = false;
                    wB = wA;
                    pLstMember[pLstFieldName] = wA;
                    wLstUpdateTmp = true;
                    break;
                case "M": // keep the MTBC value
                    addRecToList("U", pOffSet, wWixFieldName, pWixMember, pLstMember);
                    wSkip = false;
                    wA = wB;
                    pWixMember[wWixFieldName] = wB;
                    wWixUpdateTmp = true;
                    break;
                case "S": // Skip the field, no changes made
                    wSkip = true;
                    wLstUpdateTmp = false;
                    wWixUpdateTmp = false;
                    addRecToList("S", pOffSet, wWixFieldName, pWixMember, pLstMember);
                    break;
                }
                //console.log("Case 3B", pLstFieldName, wA, wB);
                //console.log("Case 3B, x, y, x ne y");
            }
        }
    }
    wWixFlag = (wWixUpdateTmp) ? true : pWixUpdate;
    wLstFlag = (wLstUpdateTmp) ? true : pLstUpdate;
    //console.log("-------------------------------------------", pLstFieldName, wWixFlag, wLstFlag);
    return [wSkip, wWixFlag, wLstFlag];

}

function addRecToList(pList, pOffSet, pFieldName, pWixMember, pLstMember) {
    //console.log("addrectolist", pList, pFieldName, pWixMember[pFieldName], pLstMember[pFieldName]);
    let wRec = {
        "_id": pWixMember._id + String(pOffSet).padStart(2, "0"),
        "name": pWixMember.firstName + " " + pWixMember.lastName,
        "fieldName": pFieldName,
        "wixValue": pWixMember[pFieldName],
        "lstValue": pLstMember[pFieldName],
        "status": "N"
    }

    if (pList === "S") {
        gSkipped.push(wRec);
    } else {
        gWixUpdates.push(wRec);
    }
}

async function selectAction(pLstFullName, pLstFieldName, pWixValue, pLstValue) {
    let lbxContext = {
        "fullName": pLstFullName,
        "fieldName": pLstFieldName,
        "wixValue": pWixValue,
        "lstValue": pLstValue
    }

    let res = await wixWindow.openLightbox("lbxSelectAction", lbxContext);
    return res; //either M, W, or S(kip)
}

export async function btnSyncStart2_click(event) {
    showMessage("Checking all Wix members are in web site database");
    await syncWixToLst();
    //messageDone();
    showMessage("Checking each Wix members' details");
    await checkEachWixMember();
    //messageDone();
}

export function btnSyncClose_click(event) {
    $w('#secMember').expand();
    $w('#secSync').collapse();
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
import wixData from 'wix-data';
import { deleteWixMembers } from 'backend/backMember.jsw';

export async function btnAdmin_click(event) {
    //await loadWixMembersData();
    //console.log(gWixMembers);
    
	let res1 = await wixData.query('lstMembers')
		.ascending("surname")
		.ascending("firstName")
		.limit(500)
		.find();
	gLstMembers = [...res1.items];
    //console.log("gLstMembers");
    //console.log(gLstMembers);
    let res = await wixData.query('test')
		.ascending("surname")
		.ascending("firstName")
		.limit(500)
		.find();
    let gImport = res.items;

    let wActiveMembers = [...gLstMembers];
    let wUpdatedSet = [];
    let X = 1;

    for (let wImportItem of gImport) {
        let wMember = wActiveMembers.find( item => item.surname.trim() === wImportItem.surname.trim() && item.firstName.trim() === wImportItem.firstName.trim());
        let wType = "";
        if (wMember){
            if (wImportItem.new.toUpperCase() === "WAIT") {
                if (wImportItem.old.toUpperCase() === "FULL" ) { wType = "FullWait"}
                if (wImportItem.old.toUpperCase() === "SOC") { wType = "SocialWait"}
            } else if (wImportItem.new === "LEFT") {
                wType = "Past";
            } else {
                wType = capitalize(wImportItem.new);
            }
            wMember.type = wType;
            wMember.addrLine1 = wImportItem.addrLine1 || "";
            wMember.addrLine2 = wImportItem.addrLine2 || "";
            wMember.town = wImportItem.town || "";
            wMember.postCode = wImportItem.postCode || "";
            wMember.homePhone = wImportItem.homePhone || "";
            wMember.mobilePhone = wImportItem.mobilePhone || "";
            wMember.contactEmail = wImportItem.contactEmail;
            wMember.locker = wImportItem.locker || [];
            let wIn = {...wMember};
            wUpdatedSet.push(wIn);
        } else {
            console.log("/page/MaintainMember btnAdmin Cant find ", wImportItem.firstName, wImportItem.surname);
        }
    }
    let wResult2 = await bulkSaveRecords("lstMembers", wUpdatedSet);
} 


function editPhone(pNumber){
    let wNumber1 = pNumber.replaceAll(" ","");
    let wNumber2 = wNumber1.replaceAll("-","");
    return wNumber2.trim();
}

// ------------------------------------------------ Locker Handling ----------------------------------------------------------
//
export async function doBtnLockerEditHolderAdd() {
	let member = await wixWindow.openLightbox("lbxSelectMember");
	if (member) {
		$w('#inpLockerEditHolder').value = member.fullName;
		$w('#lblLockerEditHolderId').text = member.id;
	} else {
		$w('#inpLockerEditHolder').value = "";
		$w('#lblLockerEditHolderId').text = "";
	}
}

export async function doBtnLockerEditHolderClear() {
	$w('#inpLockerEditHolder').value = "";
	$w('#lblLockerEditHolderId').text = "";
}

export async function loadLockers(){
    try{
        showWait("Locker");
        let wLockers = [];
        let wAllMembers = getEntity("Member");
        let wActiveMembers = wAllMembers.filter( item => item.username !== "ClubHouse")
                                        .filter( item => item.type !== "Test")
                                        .filter( item => item.status !== "Past");
        
            let wKey = 0;
            for (let wMember of wActiveMembers){
            let wName = wMember.firstName + " " + wMember.surname;
            let wId = wMember._id;
            let wLocker = wMember.locker;
            if (wLocker){
                for (let item of wLocker){
                    if (item > 0){
                        wKey++;
                        let wLockerObject= {"_id": String(wKey), "lockerNo": parseInt(item,10), "ownerId": wId, "ownerName": wName};
                        wLockers.push(wLockerObject);
                    }
                }
            }
        }

        function findDuplicateIds(array) {
            const seenIds = new Set();
            const duplicates = new Set();
            const duplicateObjects = [];

            array.forEach(obj => {
                if (seenIds.has(obj.lockerNo)) {
                    duplicates.add(obj.lockerNo); // If already seen, add to duplicates
                } else {
                    seenIds.add(obj.lockerNo); // Mark the id as seen
                }
            });

            array.forEach( (obj, index) => {
                if (duplicates.has(obj.lockerNo)) {
                    wKey++;
                    obj._id = String(wKey);
                    duplicateObjects.push(obj); // Collect duplicate objects
                }
            });
        
            //return Array.from(duplicates); // Convert Set to Array if needed
            return duplicateObjects;
        }
        
        
        const wDuplicateLockers = findDuplicateIds(wLockers);
        
        function createDenseArrayFromSparse(sparseArray) {
            // Determine the maximum id in the sparse array to define the length of the dense array
            const maxId = Math.max(...sparseArray.map(obj => parseInt(obj.lockerNo,10)), 0);
        
            // Create a dense array with default objects
            const denseArray = Array.from({ length: maxId + 1 }, (_, index) => ({
                _id: String(index),
                lockerNo: index,
                ownerId: null,  // Default value for ownerId
                ownerName: null  // Default value for ownerName
            }));
            // Populate the dense array with values from the sparse array
            sparseArray.forEach(obj => {
                denseArray[obj.lockerNo] = { ...obj }; // Overwrite the default object with the actual object
            });
        
            return denseArray;
        }
        if (wDuplicateLockers && wDuplicateLockers.length > 0) {
            $w('#lblLockerListDuplicateHdr').text = "The following lockers are duplicated";
            $w('#rptLockerListDuplicates').expand();
            $w('#rptLockerListDuplicates').data = wDuplicateLockers;
        } else {
            $w('#lblLockerListDuplicateHdr').text = "The are no duplicates";
            $w('#rptLockerListDuplicates').collapse();
        }
                
        const wAllLockers = createDenseArrayFromSparse(wLockers);

        if (wAllLockers && wAllLockers.length > 0){ 
            //let wAllMembers = wResults.members;
            setEntity("Locker", [...wAllLockers]);
            resetSection("Locker");
        } else {
            console.log("/page/Maintain Member loadLockers no lockers found" );
            //console.log(wResults.error);
        }
        await doLockerView("");
        resetPagination("Locker");
        hideWait("Locker");
        }
    catch (err) {
        console.log("/page/Maintain Member loadLockers Try-catch, err");
        console.log(err);
        if (!gTest) { wixLocation.to("/syserror") };
    }
}

export function btnLockerAToMember_click(event) {
    $w('#secMember').expand();
    $w('#secLocker').collapse();
}

export async function btnLockerASave_click(event) {
    try{
        showWait("Locker");
        $w('#btnLockerASave').disable();
        //-------------------------------------VALIDATIONS-----------------------------------

        //-------------------------------------Main section----------------------------------
        const wOldHolderId = $w('#lblLockerEditOldHolderId').text;
        const wNewHolderId = $w('#lblLockerEditHolderId').text;
        const wLockerNo = parseInt($w('#txtLockerEditLocker').text, 10);
        const wLocker = getSelectedItem("Locker");
        let wResult = {};

        let wOldMember = (wOldHolderId) ? getTargetItem("Member", wOldHolderId) : null;
        let wNewMember = (wNewHolderId) ? getTargetItem("Member", wNewHolderId) : null;
        if (wOldHolderId === ""){
            if (wNewHolderId === "") {
                // do nothing 
            } else {
                //console.log("Case 2 - update new member with this locker no");
                wResult = await addLockerToMember(wNewMember, wLockerNo, wLocker);
            }
        } else {
            if (wNewHolderId === "") {
                //console.log("Case 3 - remove this locker no from old member");
                wResult = await removeLockerFromMember(wOldMember, wLockerNo, wLocker);
            } else {
                //console.log("Case 4 - remove this locker no from old member + update new member with this locker no");
                wResult = await removeLockerFromMember(wOldMember, wLockerNo, wLocker);
                wResult = await addLockerToMember(wNewMember, wLockerNo, wLocker);
            }
        }
        //-------------------------------------Finish off-------------------------------------
        resetSection("Locker");
        $w('#btnLockerASave').enable();
        hideWait("Locker");
    }
	catch (err) {
		console.log("/page/Maintain Member btnLockerASave_click Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
}

async function addLockerToMember(pMember, pLockerNo, pLocker){
    //  Update locker record
    //
    pLocker.ownerId = pMember._id;
    pLocker.ownerName = pMember.firstName + " " + pMember.surname;
    updateGlobalDataStore(pLocker,"Locker");
    updatePagination("Locker");
    resetCommands("Locker");
    //  Update member record
    //
    let wLockers = pMember.locker;
    wLockers.push(pLockerNo);
    wLockers.sort((a, b) => a - b);
    let wResult = await saveRecord("lstMembers", pMember);
    if (wResult  && wResult.status){
        updateGlobalDataStore(pMember,"Member");
        updatePagination("Member");
    }
    return {};
}

async function removeLockerFromMember(pMember, pLockerNo, pLocker){
    //  Update locker record
    //
    pLocker.ownerId = null;
    pLocker.ownerName = null;
    updateGlobalDataStore(pLocker,"Locker");
    updatePagination("Locker");
    resetCommands("Locker");
    //  Update member record
    //
    let wLockers = pMember.locker;
    const index = wLockers.indexOf(pLockerNo);
    const x = wLockers.splice(index, 1);
    let wResult = await saveRecord("lstMembers", pMember);
    if (wResult  && wResult.status){
        updateGlobalDataStore(pMember,"Member");
        updatePagination("Member");
    }
    return {};
}

// ------------------------------------------------ Custom Processing ----------------------------------------------------------
//
let gSet = [];

function doCustom() {
    $w('#secDesktop').collapse();
    $w('#secMobile').collapse();
    $w('#secMember').collapse();
    $w('#secLocker').collapse();
    $w('#secSync').collapse();
    $w('#secCustom').expand();
}

async function processCustomOpen() {
    $w('#imgCustom').show();
    let wAllRecords = await getAllMembers2();
    if (wAllRecords){ 
        gSet = [...wAllRecords];
        $w('#pbrCustom').targetValue = gSet.length;
        $w('#btnCustomProcess').enable();
    } else {
        gSet = [];
        $w('#pbrCustom').targetValue = 0;
        console.log("/page/MaintainMember processCustomOpen There was an error reading the collection");
    }
    $w('#imgCustom').hide();
}


function processCustomClose() {
    $w('#secDesktop').expand();
    $w('#secMobile').collapse();
    $w('#secMember').expand();
    $w('#secLocker').collapse();
    $w('#secSync').collapse();
    $w('#secCustom').collapse();
    $w('#secMember').scrollTo();
}

async function processCustomGo() {
    let count = 0;
    let sum = 0;
    for (let wRec of gSet){
        count++;
        $w('#lblItem').text = wRec.surname;
        $w('#pbrCustom').value = count;
        let res = await processRecord(wRec);
        if (res){
            sum++;
        }
    }   
    console.log("/page/MaintainMember processCustomGo Total = ", sum);
    //let wResult = await bulkSaveLstMember(gSet);
    let wResult = {};
    $w('#btnCustomProcess').disable();

    console.log("/page/MaintainMember processCustomOpen, result, gSet", wResult);
    console.log(gSet);
}


/**
 * Used: 28 Jan 24
 * The Live collection still had a number of records in the Wait state. This routing changes the state
 * from Wait to Past if the Dateleft field is not empty.
 * 
  
 */
async function processRecordOld3(pRec) {
    if (pRec.dateLeft && pRec.status !== "Past") {
        //console.log(pRec.firstName, pRec.surname, pRec.status, pRec.dateLeft);
        pRec.status = "Past";
        return true;
    };
    return false;
}

/**
 * Used: 23 Jan 24
 * Whaen a date field is set in the dateLeft field, when displayed in the CMS, it shows a warning that the field is the wrong 
 * type. This is a fault in the Wix Editor and should be ignored. The date fields written to the collection are correct.
 * Howver, I did go through the collection manually and used the displayed Convert button to update the fields.I should not have
 * done so as it changes the field from a Date type to s String type.
 * This routine repairs the live collection by changing any record with dateLeft set back to a Date field.
 */
async function processRecordOLd2(pRec) {
    let wDate = pRec.dateLeft;

    if (wDate == null || wDate === undefined) {return};
    if (typeof pRec.dateLeft === "string"){
        let wNewDate = new Date (wDate);
        wNewDate.setHours(10,0,0);
        pRec.dateLeft = wNewDate;
    }
}

/**
 * this routine was set to update the dateleft field for those member records who had a Wait status set
 */
  async function processRecordOld1(pRec) {
    let wType = pRec.type;
    let wDate = new Date("2023-06-01");
    let wDateLeft;

    switch (wType) {
        case "Full":
            pRec.status = "Active";
            pRec.type = "Full";
            break;
        case "FullWait":
            pRec.status = "Wait";
            pRec.type = "Full";
            wDateLeft = pRec.dateLeft;
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())){
                pRec.dateLeft = wDate;
            }
            break;
        case "Social":
            pRec.status = "Active";
            pRec.type = "Social";
            break;
        case "SocialWait":
            pRec.status = "Wait";
            pRec.type = "Social";
            wDateLeft = pRec.dateLeft;
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())){
                pRec.dateLeft = wDate;
            }
            break;
        case "Past":
            pRec.status = "Past";
            pRec.type = "Full";
            wDateLeft = pRec.dateLeft;
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())){
                pRec.dateLeft = wDate;
            }
            break;
        case "Pending":
            pRec.status = "Pending";
            break;
        case "Test":
            pRec.status = "Test";
            pRec.type = "Full";
            break;
    }
}

/**
 * Used: 11 Jun 24
 * Need to normalise phone numbers so that we can use TwiLio to send SMS messages.
 * Need to ensure no psaces in phone number,
 * Also, reformat using UK format ie no country code, must start with 0
 * Also, for home phone numbers, if 6 digits long, then add 01628 to it.
 * 
 */
async function processRecord(pRec) {

    let wHome = pRec.homePhone;
    let wMobile = pRec.mobilePhone;
    let wLong = "";
    console.log(wHome, wMobile);
    let wHome2 = wHome;
    let wMobile2 = wMobile;

    if (wHome === ""|| wHome === null || wHome === undefined ){
        wHome = "no phone #";
        wHome2 = wHome;
    }
    if (wHome !== "no phone #"){
        //remove all spaces
        wHome2= wHome.replace(/\s/g, '');    
        if (wHome2.length === 6) {
            wHome2 = "01628" + wHome2;
        }
    }
    pRec.homePhone = wHome2;

    if (wMobile === ""|| wMobile === null || wMobile === undefined ){
        wMobile = "no phone #";
        wMobile2 = wMobile;
    }
    if (wMobile !== "no phone #"){
        //remove all spaces
        wMobile2= wMobile.replace(/\s/g, '');    
        if (wMobile2.length !== 11) { wLong = "Wrong size"}
    }
    if (wMobile.startsWith("01628")) { wLong = "Wrong code"}
    pRec.mobilePhone= wMobile2;
    console.log(wHome2, wMobile2, wLong);
}

export function showStageWait(pStage){
    let wImgName = `#imgStage${pStage}Wait`;
    let wImg = $w(wImgName);
    wImg.show();   
}

export function showMsg(pStage, pNo, pMsg = "") {
    try {
        let wMsg = ["Records deleted",
                    "There was a problem deleting this competitiong",
                    "Please correct input errors shown",
                    "Competition created",
                    ""
        ];
        let wMsgName = `#lblStage${pStage}Msg`;
        let wImgName = `#imgStage${pStage}Wait`;
        let wLblMsg = $w(wMsgName);
        let wImg = $w(wImgName);
        if (pNo === 0) {
            wLblMsg.text = pMsg;
        } else {
            wLblMsg.text = wMsg[pNo-1];
        }
        wLblMsg.show();
        wImg.hide();
        setTimeout(() => {
            wLblMsg.hide();
        }, 4000);
        return
    }
    catch (err) {
        console.log("MaintainMember showMsg Try-catch fail, err");
        console.log(err);
    }
}
