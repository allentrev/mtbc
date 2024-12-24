/* eslint-disable no-undef */
import wixWindow from "wix-window";
import { authentication } from "wix-members";
import wixLocation from "wix-location";
import _ from "lodash";
import { saveRecord } from "backend/backEvents.jsw";

import { deleteWixMembers } from "backend/backMember.jsw";
import { deleteGoogleImportRecord } from "backend/backMember.jsw";
import {
    deleteImportMemberRecord,
    uploadGlobalDataStore,
} from "backend/backMember.jsw";
import { loadStandingData } from "backend/backSystem.jsw";

import { saveImportMemberRecord } from "backend/backMember.jsw";
import { findLstMemberByFullName } from "backend/backMember.jsw";

import { createMember } from "backend/backMember.jsw";
import { deleteLstMember } from "backend/backMember.jsw";
import { getAllMembers } from "backend/backMember.jsw";
import { getAllImportMembers } from "backend/backMember.jsw";
import { getAllGoogleMembers } from "backend/backMember.jsw";
import { isUnique } from "backend/backMember.jsw";

import { sendMsgToJob } from "backend/backMsg.web.js";

import { bulkSaveRecords } from "backend/backEvents.jsw";
import { STATUS } from "public/objects/member";
import { retrieveSessionMemberDetails } from "public/objects/member";
import { buildMemberCache } from "public/objects/member";

//======= Entity Imports --------------------------------------------------------------------------------
//
import { setEntity, getEntity, alreadyExists } from "public/objects/entity";
import { MODE } from "public/objects/entity";
import {
    drpChoice_change,
    btnCreate_click,
    btnUpdate_click,
    btnDelete_click,
    btnCancel_click,
} from "public/objects/entity";
import {
    chkSelect_click,
    chkSelectAll_click,
    btnTop_click,
    doPgnListClick,
} from "public/objects/entity";
import { doInpListNoPerPageChange } from "public/objects/entity";
import {
    resetCommands,
    resetSection,
    getSelectStackId,
} from "public/objects/entity";
import { resetPagination, updatePagination } from "public/objects/entity";
import { showError, updateGlobalDataStore } from "public/objects/entity";
import {
    getTarget,
    getTargetItem,
    configureScreen,
} from "public/objects/entity";
import { showWait, hideWait, getMode, setMode } from "public/objects/entity";
import { getSelectedItem } from "public/objects/entity";

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E",
});

let gManOutline =
    "wix:image://v1/88f9e9_cf010bd242a247d897c0d82796abf866~mv2.jpg/man_outline.jpg#originWidth=570&originHeight=561";
let gWomanOutline =
    "wix:image://v1/88f9e9_7c906da184a746b1add8536f47c445c6~mv2.jpg/woman_outline.jpg#originWidth=549&originHeight=531";

const USERNAME_LENGTH = 3;

////const gUploadedColour = `rgba(145,145,145,0.5)`;
////const gAvailableColour = `rgba(207,207,155,0.5)`;

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = gTest ? true : authentication.loggedIn();
let gDateAudit;

$w.onReady(async function () {
    try {
        let status;
        gDateAudit = await setAuditDate();
        console.log("Date of audit is ", gDateAudit);

        //$w('#lblHdr1').text = `The following table summarises something....${gYear} season`;
        // for testing ------	------------------------------------------------------------------------
        //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
        let wUser = {
            _id: "88f9e943-ae7d-4039-9026-ccdf26676a2b",
            loggedIn: true,
            roles: [{ title: "Manager" }],
        }; //Me
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

        // eslint-disable-next-line no-unused-vars
        [status, loggedInMember, loggedInMemberRoles] =
            await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

        if (isLoggedIn) {
            let wRoles = loggedInMemberRoles.toString();
            console.log(
                "/page/MaintainMember onReady  Roles = <" + wRoles + ">",
                loggedInMember.name,
                loggedInMember.lstId
            );
        } else {
            console.log("/page/MaintainMember onReady Not signed in");
        }

        if (wixWindow.formFactor === "Mobile") {
            $w("#boxMemberDashboard").collapse(); //
            $w("#secDesktop").collapse(); //
            $w("#secMobile").collapse(); //;
            $w("#secCustom").collapse();
            $w("#secMember").expand(); //
            $w("#secSync").collapse();
            $w("#secLocker").collapse();
            $w("#inpMemberListNoPerPage").value = "10";
            $w("#inpLockerListNoPerPage").value = "20";
            $w("#btnMemberAToSync").disable();
            $w("#btnMemberAToCustom").disable();
        } else {
            $w("#secDesktop").expand();
            $w("#secMobile").collapse();
            $w("#secCustom").collapse();
            $w("#secLocker").collapse();
            $w("#secSync").collapse();
            $w("#secMember").expand();
            $w("#strMember").scrollTo();
            $w("#inpMemberListNoPerPage").value = "20";
            $w("#inpLockerListNoPerPage").value = "20";
            $w("#boxRpt2").style.backgroundColor = COLOUR.FREE;
            $w("#boxRpt3").style.backgroundColor = COLOUR.FREE;

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
        $w("#strMember").onViewportEnter(() => strMember_viewportEnter());
        $w("#btnMemberACreate").onClick((event) => doBtnCreateClick(event));
        $w("#btnMemberAUpdate").onClick((event) => doBtnUpdateClick(event));
        $w("#btnMemberADelete").onClick((event) =>
            btnDelete_click(loggedInMember.lstId, event)
        );
        $w("#btnMemberASave").onClick(() => btnMemberASave_click());
        $w("#btnMemberACancel").onClick((event) => btnCancel_click(event));
        //$w("#btnMemberAToMembersMenu").onClick(() =>
        //    wixLocation.to("/membersMenu")
        //);
        $w("#btnMemberAToSync").onClick(() => btnMemberAToSync_click());
        $w("#btnMemberAToLocker").onClick(() => btnMemberAToLocker_click());
        $w("#btnMemberAConvert").onClick(() => btnMemberAConvert_click());
        $w("#drpMemberChoiceType").onClick((event) => drpChoice_change(event));
        $w("#drpMemberChoiceStatus").onClick((event) =>
            drpChoice_change(event)
        );
        $w("#chkMemberListSelect").onClick((event) => chkSelect_click(event));
        $w("#chkMemberListSelectAll").onClick((event) =>
            chkSelectAll_click(event)
        );
        $w("#btnMemberListTop").onClick((event) => btnTop_click(event));
        $w("#pgnMemberList").onClick((event) => doPgnListClick(event));
        $w("#inpMemberListNoPerPage").onChange((event) =>
            doInpListNoPerPageChange(event)
        );
        $w("#inpMemberEditMobilePhone").onChange((event) =>
            inpPhone_change(event)
        );
        $w("#inpMemberEditHomePhone").onChange((event) =>
            inpPhone_change(event)
        );
        $w("#upbMemberEditPhoto").onChange(() => upbMemberEditPhoto_change());
        $w("#btnMemberEditClearPhoto").onClick(() =>
            btnMemberEditClearPhoto_click()
        );
        $w("#inpMemberEditUsername").onChange((event) =>
            inpMemberEditUsername_change(event)
        );
        $w("#btnMemberEditMoreDisplay").onClick(() =>
            btnMemberEditMoreDIsplayClick()
        );

        // Custom Section event handlers
        //
        $w("#btnMemberAToCustom").onClick(() => doCustom());
        $w("#btnCustomOpen").onClick(() => processCustomOpen());
        $w("#btnCustomClose").onClick(() => processCustomClose());
        $w("#btnCustomProcess").onClick(() => processCustomGo());

        // Sync Section event handlers
        //
        $w("#btnLstVImp").onClick(() => doStage1());
        $w("#btnStage2FieldValue").onClick(() => doStage2());
        $w("#btnLstVWix").onClick(() => doStage3());
        $w("#btnLstVGGL").onClick(() => doStage4());
        $w("#btnStage5FieldValue").onClick(() => doStage5());
        $w("#btnSyncClose").onClick(() => processCustomClose());
        $w("#btnNameAmend2Save").onClick(() => btnNameAmend2Save_click());
        $w("#btnNameAmend3Save").onClick(() => btnNameAmend3Save_click());
        $w("#btnNameAmendCancel").onClick(() => btnNameAmendCancel_click());

        $w("#btnLstStage1Amend").onClick(() => btnNameAmend_click(1));
        $w("#btnLstStage1Past").onClick(() => btnLstStage1Past_click());
        $w("#btnLstStage1Test").onClick(() => btnLstStage1Test_click());
        $w("#btnImpStage1NewFull").onClick(() => btnImpStage1New_click("F"));
        $w("#btnImpStage1NewSocial").onClick(() => btnImpStage1New_click("S"));
        $w("#btnImpStage1Past").onClick(() => btnImpStage1Past_click());

        $w("#btnLstStage3Register").onClick(() => btnLstStage3Register_click());
        $w("#btnWixStage3Update").onClick(() => btnNameAmend_click(3));
        $w("#btnWixStage3Delete").onClick(() => btnWixStage3Delete_click());

        $w("#btnGGLStage4Amend").onClick(() => btnNameAmend_click(4));
        $w("#btnGGLStage4Guest").onClick(() => btnGGLStage4Guest_click());
        $w("#btnGGLStage4Save").onClick(() => btnGGLStage4Save_click());
        $w("#btnGGLStage4Update").onClick(() => btnNameAmend_click(4));
        $w("#btnGGLStage4Add").onClick(() => btnGGLStage4Add_click());
        $w("#btnGGLStage4Delete").onClick(() => btnGGLStage4Delete_click());

        //$w("#chk2").onClick((event) => chkSyncSelect_click("2", event));
        //$w("#chk3").onClick((event) => chkSyncSelect_click("3", event));
        $w("#boxRpt2").onClick((event) => boxRpt_click("2", event));
        $w("#boxRpt3").onClick((event) => boxRpt_click("3", event));

        // Locker Section event handlers
        //
        $w("#btnLockerASave").onClick(() => btnLockerASave_click());
        $w("#btnLockerAUpdate").onClick((event) => doBtnUpdateClick(event));
        $w("#btnLockerACancel").onClick((event) => btnCancel_click(event));
        $w("#btnLockerAToMember").onClick(() => processCustomClose());
        $w("#chkLockerListSelect").onClick((event) => chkSelect_click(event));
        $w("#chkLockerListSelectAll").onClick((event) =>
            chkSelectAll_click(event)
        );
        $w("#btnLockerListTop").onClick((event) => btnTop_click(event));
        $w("#pgnLockerList").onClick((event) => doPgnListClick(event));
        $w("#inpLockerListNoPerPage").onChange((event) =>
            doInpListNoPerPageChange(event)
        );
        $w("#btnLockerEditHolderAdd").onClick(() => doBtnLockerEditHolderAdd());
        $w("#btnLockerEditHolderClear").onClick(() =>
            doBtnLockerEditHolderClear()
        );

        //====== Repeaters section ------------------------------------------------------------------

        $w("#rptMemberList").onItemReady(($item, itemData, index) => {
            loadRptMemberList($item, itemData, index);
        });
        $w("#rptLockerList").onItemReady(($item, itemData, index) => {
            loadRptLockerList($item, itemData, index);
        });
        $w("#rptLockerListDuplicates").onItemReady(($item, itemData) => {
            loadRptLockerListDuplicates($item, itemData);
        });
        $w("#rpt2").onItemReady(($item, itemData) => {
            loadRptN("2", $item, itemData);
        });
        $w("#rpt3").onItemReady(($item, itemData) => {
            loadRptN("3", $item, itemData);
        });

        //======== Custom Validation ---------------------------------------------------------------

        $w("#inpMemberEditLoginEmail").onCustomValidation(validateLoginEmail);

        $w("#inpMemberEditPostCode").onCustomValidation((value, reject) => {
            let regExp = new RegExp(
                `^(([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) [0-9][A-Z]{2}$`
            );
            if (!regExp.test(value)) {
                reject(`PostCode format invalid`);
            }
        });
    } catch (err) {
        console.log("/page/MaintainMember onReady Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
});
//====== Load Repeaters ---------------------------------------------------------------------
//
function loadRptMemberList($item, itemData, index) {
    //console.log("Item,", index);
    //console.log(itemData)
    //let wSelected = isSelected(itemData._id);
    if (wixWindow.formFactor === "Mobile") {
        $item("#lblMemberListLocker").hide();
        $item("#lblMemberListMobilePhone").hide();
    }

    if (index === 0) {
        $item("#chkMemberListSelect").hide();
    } else {
        let wMobilePhone =
            (
                itemData.mobilePhone === "no phone #" ||
                itemData.mobilePhone === ""
            ) ?
                "no phone #"
            :   hyphenatePhoneNumber(itemData.mobilePhone);
        $item("#lblMemberListFirstName").text = itemData.firstName;
        $item("#lblMemberListSurname").text = itemData.surname;
        $item("#lblMemberListMobilePhone").text = wMobilePhone;
        $item("#lblMemberListLocker").text = itemData.locker.join(",");
        $item("#chkMemberListSelect").checked = false;
    }
}

function loadRptLockerList($item, itemData, index) {
    //console.log("Locker Item,", index);
    //console.log(itemData);
    //let wSelected = isSelected(itemData._id);

    if (index === 0) {
        $item("#chkLockerListSelect").hide();
    } else {
        $item("#lblLockerListLocker").text = String(itemData.lockerNo);
        $item("#lblLockerListOwner").text = itemData.ownerName || "free";
        $item("#chkLockerListSelect").checked = false;
    }
}

function loadRptLockerListDuplicates($item, itemData) {
    //console.log("DUp Item,", index);
    //console.log(itemData);
    //let wSelected = isSelected(itemData._id);

    $item("#lblLockerListDuplicateIndex").text = String(itemData.lockerNo);
    $item("#lblLockerListDuplicateOwner").text = itemData.ownerName;
}

//====== Load Data ---------------------------------------------------------------------------------------
//
//  This first Entity based section operates against the gLstRecords held in public/objects/entity. It includes all
//  lstMembers without any filtering
//
export async function loadMembers() {
    //console.log("load Members");
    try {
        showWait("Member");
        let wAllMembers = await getAllMembers();
        if (wAllMembers) {
            //let wAllMembers = wResults.members;
            setEntity("Member", [...wAllMembers]);
            resetSection("Member");
        } else {
            console.log("/page/MaintainMember loadMembers read failed");
        }
        await doMemberView("");
        resetPagination("Member");
        hideWait("Member");
    } catch (err) {
        console.log("/page/MaintainMember loadMembers Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
}

//======= Entity Events ================================================
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

//====== Entity Event Supporting Functions -------------------------------------------------
//

function clearEdit(pTarget) {
    switch (pTarget) {
        case "Member":
            $w("#inpMemberEditUsername").value = "";
            $w("#inpMemberEditLoginEmail").value = "";
            $w("#inpMemberEditFirstName").value = "";
            $w("#inpMemberEditSurname").value = "";
            $w("#inpMemberEditMix").value = "L";
            $w("#drpMemberEditType").value = "Full";
            ////$w('#lblMemberEditStartType').text = "Full";
            $w("#dpkMemberEditDateLeft").value = new Date();
            $w("#rgpMemberEditContactPref").value = "E";
            $w("#rgpMemberEditAllowShare").value = "Y";
            $w("#inpMemberEditContactEmail").value = "";
            $w("#inpMemberEditAltEmail").value = "";
            $w("#inpMemberEditMobilePhone").value = "";
            $w("#inpMemberEditHomePhone").value = "";
            $w("#inpMemberEditLocker").value = "";
            $w("#inpMemberEditAddrLine1").value = "";
            $w("#inpMemberEditAddrLine2").value = "";
            $w("#inpMemberEditTown").value = "";
            $w("#inpMemberEditPostCode").value = "";
            $w("#inpMemberEditLstId").value = "";
            $w("#inpMemberEditWixId").value = "";
            $w("#imgMemberEditPhoto").src = gWomanOutline;
            break;
        case "Locker":
            $w("#txtLockerEditLocker").text = "";
            $w("#inpLockerEditHolder").value = "";
            $w("#lblLockerEditHolderId").text = "";
            $w("#lblLockerEditOldHolderId").text = "";
            break;
        default:
            console.log(
                "/page/MaintainMember clearEditBox Invalid switch key",
                pTarget
            );
            break;
    }
}

function populateEdit(pTarget) {
    let wSelected = getSelectedItem(pTarget);

    let wStatusOptions = [
        { label: "Pending", value: "Pending" },
        { label: "Active", value: "Active" },
        { label: "Wait", value: "Wait" },
        { label: "Past", value: "Past" },
    ];
    //console.log(pSelected);
    let wPhotoSrc = wSelected.gender === "M" ? gManOutline : gWomanOutline;
    let wMobilePhone = "";
    let wHomePhone = "";
    switch (pTarget) {
        case "Member":
            $w("#inpMemberEditLoginEmail").disable();
            if (
                /* new username based account */ wSelected.loginEmail.includes(
                    "mtbc"
                )
            ) {
                $w("#inpMemberEditUsername").enable();
                $w("#btnMemberAConvert").hide();
            } else {
                $w("#inpMemberEditUsername").disable();
                $w("#btnMemberAConvert").show();
            }
            wMobilePhone =
                (
                    wSelected.mobilePhone === "no phone #" ||
                    wSelected.mobilePhone === ""
                ) ?
                    "no phone #"
                :   hyphenatePhoneNumber(wSelected.mobilePhone);
            wHomePhone =
                (
                    wSelected.homePhone === "no phone #" ||
                    wSelected.homePhone === ""
                ) ?
                    "no phone #"
                :   hyphenatePhoneNumber(wSelected.homePhone);
            $w("#drpMemberEditNewStatus").options = wStatusOptions;
            $w("#drpMemberEditNewStatus").value = wSelected.status;
            if (wSelected.dateLeft instanceof Date) {
                $w("#dpkMemberEditDateLeft").show();
                $w("#dpkMemberEditDateLeft").value = wSelected.dateLeft;
            } else {
                $w("#dpkMemberEditDateLeft").hide();
            }
            $w("#inpMemberEditUsername").value = wSelected.username || "";
            $w("#inpMemberEditLoginEmail").value = wSelected.loginEmail || "";
            $w("#inpMemberEditFirstName").value = wSelected.firstName || "";
            $w("#inpMemberEditSurname").value = wSelected.surname;
            $w("#inpMemberEditMix").value = wSelected.gender;
            $w("#drpMemberEditType").value = wSelected.type;
            $w("#txtMemberEditOldStatus").text = wSelected.status;
            $w("#drpMemberEditNewStatus").value = wSelected.status;
            ////$w('#lblMemberEditStartType').text = pSelected.type;
            $w("#rgpMemberEditContactPref").value = wSelected.contactpref;
            $w("#rgpMemberEditAllowShare").value = wSelected.allowshare;
            $w("#inpMemberEditContactEmail").value = wSelected.contactEmail;
            $w("#inpMemberEditAltEmail").value = wSelected.altEmail;

            $w("#inpMemberEditMobilePhone").value = wMobilePhone;
            $w("#inpMemberEditHomePhone").value = wHomePhone;
            $w("#inpMemberEditLocker").value = wSelected.locker.join(",");
            $w("#inpMemberEditAddrLine1").value = wSelected.addrLine1 || "";
            $w("#inpMemberEditAddrLine2").value = wSelected.addrLine2 || "";
            $w("#inpMemberEditTown").value = wSelected.town || "";
            $w("#inpMemberEditPostCode").value = wSelected.postCode || "";
            $w("#inpMemberEditLstId").value = wSelected._id;
            $w("#inpMemberEditWixId").value = wSelected.wixId;
            $w("#imgMemberEditPhoto").src = wSelected.photo || wPhotoSrc;
            break;
        case "Locker":
            $w("#txtLockerEditLocker").text = String(wSelected.lockerNo);
            $w("#inpLockerEditHolder").value = wSelected.ownerName;
            $w("#lblLockerEditHolderId").text = wSelected.ownerId;
            $w("#lblLockerEditOldHolderId").text = wSelected.ownerId;
            break;
        default:
            console.log(
                "/page/MaintainMember populateEdit Invalid switch key",
                pTarget
            );
            break;
    }
}

export function doMemberView(pViewType) {
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w("#chkMemberListSelectAll").collapse();
        $w("#btnMemberListTop").collapse();
        $w("#rptMemberList").collapse();
    } else {
        $w("#chkMemberListSelectAll").expand();
        $w("#btnMemberListTop").expand();
        $w("#rptMemberList").expand();
    }
    return true;
}

export function doLockerView(pViewType) {
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w("#chkLockerListSelectAll").collapse();
        $w("#btnLockerListTop").collapse();
        $w("#rptLockerList").collapse();
    } else {
        $w("#chkLockerListSelectAll").expand();
        $w("#btnLockerListTop").expand();
        $w("#rptLockerList").expand();
    }
    return true;
}

//====== Member Events ======================================================================
//

export function btnMemberAToSync_click() {
    $w("#secMember").collapse();
    $w("#secLocker").collapse();
    $w("#secSync").expand();
    $w("#ancSyncStart").scrollTo();
    gWixRecords = [];
    gLstRecords = [];
    gImpRecords = [];
    gGGLRecords = [];
    $w("#tblProgress").rows = [];
}

export function btnMemberAToLocker_click() {
    $w("#secMember").collapse();
    $w("#secSync").collapse();
    $w("#secLocker").expand();
    loadLockers();
}

export function btnMemberAConvert_click() {
    $w("TextInput").disable();
    $w("#inpMemberEditUsername").enable();
    $w("#inpMemberEditUsername").focus();
    $w("#btnMemberAConvert").hide();
    setMode(MODE.CONVERT);
}

export function btnMembersAToReferences_click() {
    $w("#secMember").collapse();
}
export function btnMembersAToKennetTeams_click() {
    $w("#secMember").collapse();
}

export async function btnMemberASave_click() {
    try {
        showWait("Member");
        $w("#btnMemberASave").disable();
        //-------------------------------------VALIDATIONS-----------------------------------
        const wContactEmail =
            $w("#inpMemberEditContactEmail").value.trim() || "";
        const wContactMobile =
            $w("#inpMemberEditMobilePhone").value.trim() || "no phone #";
        let wContactPref = $w("#rgpMemberEditContactPref").value;
        const wLoginEmail = $w("#inpMemberEditLoginEmail").value.trim() || "";
        const wUsername = $w("#inpMemberEditUsername").value.trim() || "";

        if (wUsername === "" && wLoginEmail === "") {
            showError("Member", 38);
            hideWait("Member");
            $w("#inpMemberEditUsername").focus();
            return;
        }
        if (!$w("#inpMemberEditFirstName").valid) {
            showError("Member", 39);
            hideWait("Member");
            $w("#inpMemberEditFirstName").focus();
            return;
        }

        if (!$w("#inpMemberEditSurname").valid) {
            showError("Member", 39);
            hideWait("Member");
            $w("#inpMemberEditSurname").focus();
            return;
        }

        if (!$w("#inpMemberEditLoginEmail").valid) {
            $w(`#txtMemberErrMsg`).text = $w(
                "#inpMemberEditLoginEmail"
            ).validationMessage;
            showError("Member", 22);
            hideWait("Member");
            $w("#inpMemberEditLoginEmail").focus();
            return;
        }
        if (!$w("#inpMemberEditContactEmail").valid) {
            $w(`#txtMemberErrMsg`).text = $w(
                "#inpMemberEditContactEmail"
            ).validationMessage;
            showError("Member", 41);
            hideWait("Member");
            $w("#inpMemberEditContactEmail").focus();
            return;
        }

        if (wContactPref === "E" || wContactPref === "B") {
            if (wContactEmail === "") {
                showError("Member", 36);
                hideWait("Member");
                $w("#inpMemberEditContactEmail").focus();
                return;
            }
        }

        if (wContactPref === "S" || wContactPref === "B") {
            if (wContactMobile === "") {
                showError("Member", 37);
                hideWait("Member");
                $w("#inpMemberEditMobilePhone").focus();
                return;
            }
        }
        if (
            wContactEmail === "" &&
            (wContactMobile === "" || wContactMobile === "no phone #")
        ) {
            $w("#rgpMemberEditContactPref").value === "N";
            wContactPref = "N";
        }

        //-------------------------------------Main section----------------------------------
        let wMember = {
            _id: "",
            username: wUsername,
            loginEmail: wLoginEmail,
            firstName: capitalize($w("#inpMemberEditFirstName").value),
            surname: capitalize($w("#inpMemberEditSurname").value),
            gender: $w("#inpMemberEditMix").value,
            type: $w("#drpMemberEditType").value,
            status: $w("#drpMemberEditNewStatus").value,
            contactpref: wContactPref,
            allowshare: $w("#rgpMemberEditAllowShare").value,
            contactEmail: wContactEmail,
            altEmail: $w("#inpMemberEditAltEmail").value,
            mobilePhone: await formPhoneString("mobile", wContactMobile),
            homePhone: await formPhoneString(
                "home",
                $w("#inpMemberEditHomePhone").value
            ),
            locker: [],
            addrLine1: $w("#inpMemberEditAddrLine1").value,
            addrLine2: $w("#inpMemberEditAddrLine2").value,
            town: $w("#inpMemberEditTown").value,
            postCode: $w("#inpMemberEditPostCode").value,
            wixId: $w("#inpMemberEditWixId").value,
            photo: $w("#imgMemberEditPhoto").src || "",
        };

        wMember.locker =
            $w("#inpMemberEditLocker").value.split(",").map(Number) || [];
        if (wMember.locker[0] === 0) {
            wMember.locker = [];
        }
        let wPhoto = $w("#imgMemberEditPhoto").src;
        if (wPhoto === "") {
            wPhoto =
                $w("#inpMemberEditMix").value === "M" ?
                    gManOutline
                :   gWomanOutline;
        }
        wMember.photo = wPhoto;
        let wResult;
        let wNewStatus = "";
        let wOldStatus = "";
        wResult = { Status: true, savedRecord: { _id: "1234" }, error: "" };
        switch (getMode()) {
            case MODE.CREATE:
                wMember.dateLeft = undefined;
                wMember.status = STATUS.PENDING;
                wMember._id = undefined;
                //console.log(wMember);
                //let [createMemberStatus, createMemberMsg] = await createMember(wMember);
                //if (createMemberStatus) {
                if (!gTest) {
                    wResult = await createMember(false, wMember);
                }
                if (wResult && wResult.status) {
                    if ($w("#inpMemberEditLoginEmail").value.includes("mtbc")) {
                        $w("#lblMTBCCount").text = updateMTBCUsernameCount();
                    }
                    wContactPref === "N" ?
                        showError("Member", 40)
                    :   showError("Member", 23);
                } else {
                    wContactPref === "N" ?
                        showError("Member", 40)
                    :   showError("Member", 7);
                    console.log(
                        "/page/MaintainMember btnMemberASave_click creatememberstatus msg,msg"
                    );
                    console.log(wResult.error);
                }
                break;
            case MODE.UPDATE:
                wNewStatus = $w("#drpMemberEditNewStatus").value;
                wOldStatus = $w("#txtMemberEditOldStatus").text;
                if (wNewStatus !== wOldStatus) {
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
                            if ($w("#dpkMemberEditDateLeft").hidden) {
                                wMember.dateLeft = new Date();
                            } else {
                                wMember.dateLeft = $w(
                                    "#dpkMemberEditDateLeft"
                                ).value;
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
                console.log(
                    "/page/MaintainMember btnMemberSave invalid mode = [" +
                        getMode() +
                        "]"
                );
        }
        // Save record performed in switch code blocks above;
        if (wResult && wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) {
                case MODE.CREATE:
                    wMember._id = wSavedRecord._id;
                    wContactPref === "N" ?
                        showError("Member", 40)
                    :   showError("Member", 8);
                    break;
                case MODE.UPDATE:
                    wContactPref === "N" ?
                        showError("Member", 40)
                    :   showError("Member", 7);
                    break;
                default:
                    console.log(
                        "/page/MaintainMember btnMemberASave invalid mode = [" +
                            getMode() +
                            "]"
                    );
            }
            updateGlobalDataStore(wSavedRecord, "Member");
            updatePagination("Member");
            resetCommands("Member");
        } else {
            if (wResult && wResult.savedRecord) {
                console.log(
                    "/page/MaintainMember btnMemberASave_click saveRecord failed, savedRecord, error"
                );
                console.log(wResult.savedRecord);
                console.log(wResult.error);
            } else if (wResult) {
                console.log(
                    "/page/MaintainMember btnMemberASave_click saverecord failed, error"
                );
                console.log(wResult.error);
            } else {
                console.log(
                    "/page/MaintainMember btnMemberASave_click wResult undefined"
                );
                console.log(wResult.error);
            }
        }
        resetSection("Member");
        setMode(MODE.CLEAR);
        updateDashboard();
        $w("#btnMemberASave").enable();
        hideWait("Member");
    } catch (err) {
        console.log("/page/MaintainMember btnMemberASave_click Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
}

function updateMTBCUsernameCount() {
    let wMTBCCount = parseInt($w("#lblMTBCCount").text, 10);
    wMTBCCount++;
    return String(wMTBCCount);
}

export async function drpMemberChoiceType_change() {
    //console.log("FilterTypeChoice_change");
    showWait("Member");
    ////let wType = event.target.value;
    ////let wStatus = $w("#drpMemberChoiceStatus").value;
    ////displayMemberTableData(wType, wStatus);
    hideWait("Member");
}

export async function drpMemberChoiceStatus_change() {
    //console.log("FilterStatusChoice_change");
    showWait("Member");
    ////let wStatus = event.target.value;
    ////let wType = $w("#drpMemberChoiceType").value;
    ////displayMemberTableData(wType, wStatus);
    hideWait("Member");

    //export async function drpFixtureChoiceTeamChange (event) {
    //    drpChoice_change(event);
    //}

    //configureScreen(wTarget);
    configureScreen("Member");
}

export function strMember_viewportEnter() {
    //console.log("viewportEnter");
    //displayMemberTableData($w('#drpMemberChoiceType').value, $w('#drpMemberChoiceStatus').value);
}

//====== Members Supporting Functions ============================================================
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
    let wRow = [
        {
            total: wNoTotal,
            ladies: wNoLadies,
            men: wNoMen,
            social: wNoSocial,
            full: wNoFull,
            wait: wNoWait,
            test: wNoTest,
            past: wNoPast,
            joined: wNoJoined,
            left: wNoLeft,
        },
    ];

    // @ts-ignore
    $w("#tblMemberDashboard").rows = wRow;
}

export function updateDashboard() {
    const locale = "en-GB";

    const options = {
        //weekday: 'long',
        month: "short",
        //day: 'numeric',
        year: "numeric",
    };
    const wToday = new Date();
    let wYearStart = gDateAudit;
    let wPreviousAudit = new Date(gDateAudit);
    wPreviousAudit.setFullYear(gDateAudit.getFullYear() - 1);
    console.log(wToday);
    console.log(wYearStart);
    console.log(gDateAudit);
    console.log(wPreviousAudit);
    if (wToday < gDateAudit) {
        console.log("Today is before the audit");
        wYearStart = wPreviousAudit;
    }
    console.log("Dashboard date ", wYearStart);

    const wMembers = getEntity("Member");

    const wActiveMembers = wMembers.filter(
        (item) => item.status === "Active" || item.status === "Pending"
    );

    const wNoSocial = wActiveMembers.filter(
        (item) => item.type === "Social"
    ).length;

    const wNoFull = wActiveMembers.filter(
        (item) => item.type === "Full"
    ).length;

    const wNoLife = wActiveMembers.filter(
        (item) => item.type === "Life"
    ).length;

    const wNoPending = wActiveMembers.filter(
        (item) => item.status === "Pending" && item.type !== "Test"
    ).length;

    const wNoActive = wActiveMembers.filter(
        (item) => item.status === "Active" && item.type !== "Test"
    ).length;

    const wNoLadies = wActiveMembers.filter(
        (item) => item.gender === "L" && item.type !== "Test"
    ).length;

    const wNoMen = wActiveMembers.filter(
        (item) => item.gender === "M" && item.type !== "Test"
    ).length;

    const wNoWait = wMembers.filter(
        (item) => item.status === "Wait" && item.type !== "Test"
    ).length;

    const wNoTest = wMembers.filter((item) => item.type === "Test").length;
    const wNoGuest = wMembers.filter((item) => item.type === "Guest").length;
    const wPast = wMembers.filter(
        (item) => item.status === "Past" && item.type !== "Test"
    );

    const wNoTotal = wNoSocial + wNoFull + wNoLife;
    const wNoPast = wPast.length;
    const wNewMembersSet = wMembers.filter(
        (item) => item._createdDate > wYearStart
    );
    const wNoJoined = wNewMembersSet.length;
    const wOldMembersSet = wMembers.filter(
        (item) =>
            item.status === "Past" &&
            item.dateLeft !== undefined &&
            item.dateLeft > wYearStart
    );
    const wNoLeft = wOldMembersSet.length;

    const wTopRow = [
        {
            total: wNoTotal,
            ladies: wNoLadies,
            men: wNoMen,
            full: wNoFull,
            social: wNoSocial,
            life: wNoLife,
            test: wNoTest,
            guest: wNoGuest,
            joined: wNoJoined,
            left: wNoLeft,
        },
    ];

    const wBottomRow = [
        {
            total: wNoTotal,
            pending: wNoPending,
            active: wNoActive,
            social: wNoSocial,
            wait: wNoWait,
            past: wNoPast,
        },
    ];

    $w("#lblMTBCCount").text = getMTBCMaxValue(wMembers);
    // @ts-ignore
    $w("#lblSinceDate").text = wYearStart.toLocaleDateString(locale, options);

    $w("#tblMemberDashboardTop").rows = wTopRow;
    $w("#tblMemberDashboardBottom").rows = wBottomRow;
}

export function getMTBCMaxValue(pDataset) {
    //  Determine the highest MTBCnn value and display +1
    let wMTBCMaxValue = 0;
    let wMTBCRecs = pDataset.filter((item) => item.loginEmail.includes("mtbc"));
    let wMTBCIds = wMTBCRecs.map((item) => {
        let x = item.loginEmail.indexOf("@");
        return parseInt(item.loginEmail.substring(4, x), 10);
    });
    wMTBCMaxValue = Math.max(...wMTBCIds) + 1;
    return String(wMTBCMaxValue);
}

export async function validateLoginEmail(value, reject) {
    // @ts-ignore
    if (getMode() === MODE.UPDATE) {
        return;
    }
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
        $w("#inpMemberEditContactEmail").value = "";
    } else {
        $w("#inpMemberEditContactEmail").value = wValue;
    }
}

export function btnMemberEditClearPhoto_click() {
    let wGender = $w("#inpMemberEditMix").value || "L";
    let wPhoto = wGender === "L" ? gWomanOutline : gManOutline;
    $w("#imgMemberEditPhoto").src = wPhoto;
}

export function upbMemberEditPhoto_change() {
    showWait("Member");
    $w("#btnMemberASave").disable();
    $w("#txtMemberErrMsg").expand();
    if ($w("#upbMemberEditPhoto").value.length > 0) {
        $w("#txtMemberErrMsg").text =
            "Uploading " + $w("#upbMemberEditPhoto").value[0].name;
        $w("#upbMemberEditPhoto")
            .uploadFiles()
            .then((uploadedFiles) => {
                $w("#txtMemberErrMsg").text = "Upload successful";
                $w("#imgMemberEditPhoto").src = uploadedFiles[0].fileUrl;
                setTimeout(() => {
                    $w("#btnMemberASave").enable();
                    $w("#txtMemberErrMsg").collapse();
                    hideWait("Member");
                }, 3500);
            })
            .catch((uploadError) => {
                $w("#txtMemberErrMsg").text = "File upload error";
                console.log(
                    "/page/MaintainMember File upload error: " +
                        uploadError.errorCode
                );
                console.log(
                    "/page/MaintainMember ",
                    uploadError.errorDescription
                );
                setTimeout(() => {
                    $w("#btnMemberASave").enable();
                    $w("#txtMemberErrMsg").collapse();
                    hideWait("Member");
                }, 2500);
            });
    } else {
        $w("#txtMemberErrMsg").text = "Please choose a file to upload.";
        setTimeout(() => {
            $w("#btnMemberASave").enable();
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
        showError("Member", 4);
        wControl.focus();
    } else {
        wControl.value = wNumber;
        wControl.resetValidityIndication();
    }
}

export function btnMemberEditMoreDIsplayClick() {
    let wButton = $w("#btnMemberEditMoreDisplay").label;
    let wBits = wButton.split(" ");
    let wState = wBits[0];
    if (wState === "Show") {
        $w("#boxMemberEditMore").expand();
        $w("#btnMemberEditMoreDisplay").label = "Hide ^";
    } else {
        $w("#boxMemberEditMore").collapse();
        $w("#btnMemberEditMoreDisplay").label = "Show V";
    }
}

export function inpMemberEditUsername_change(event) {
    let wUsername = event.target.value;
    if (wUsername.length < USERNAME_LENGTH) {
        $w("#inpMemberEditUsername").updateValidityIndication();
        showError("Member", 24);
        $w("#inpMemberEditUsername").focus();
        return;
    } else {
        $w("#inpMemberEditLoginEmail").value = setMTBCUsername();
        $w("#inpMemberEditLoginEmail").disable();
    }
}
function setMTBCUsername() {
    let wMTBCCount = parseInt($w("#lblMTBCCount").text, 10);
    return `mtbc${wMTBCCount}@maidenheadtownbc.com`;
}

function hyphenatePhoneNumber(pPhoneNumber) {
    let wDisplayNumber = "";
    if (
        pPhoneNumber === null ||
        pPhoneNumber === "" ||
        pPhoneNumber === undefined ||
        pPhoneNumber === "no phone #"
    )
        return "no phone #";
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

//====== USER MAINTENANCE =============================================================================
//
//  This section runs tests against the Import, LST and Wix datasets to ensure they are in sync. It is a 2 stage process:
//  Stage 1 compares Lst against Import, and ensures Lst is in step with Import. Import is the master dataset.
//  Stage 2 compares Wix against Lst , and ensures they are in step. Lst is taken as the master dataset.
//
//  Note that the gLstRecords array here is NOT THE SAME as that used above. When control passes back to the CRUD section,
//  its gLstMember is refreshed from this one. Hence, during the changes in this section, there are no references to
//  updating GlobalDataStore nor any repaginations. This is done purely on the handover

import { getActiveWixMembers } from "backend/backMember.jsw";
import { updateWixMember } from "backend/backMember.jsw";
//import { updateLstMember } from "backend/backMember.jsw";
import { saveGoogleMemberRecord } from "backend/backMember.jsw";
//import { convertNull } from "backend/backMember.jsw";
import { formPhoneString } from "backend/backMember.jsw";

let gWixRecords = [];
let gLstRecords = [];
let gImpRecords = [];
let gGGLRecords = [];
let gStage = "Lst-Imp";

let gSelectLeftStack = [];
let gSelectRightStack = [];

let gMessages = [];
//====== SYNC Event Handlers ----------------------------------------------------------------------------
//
export async function doStage1() {
    //  A = LSt B = Import  C = Wix
    // Arrays containing elements common to A, B, and C
    try {
        $w("#imgSyncWait").show();
        gStage = "Lst-Imp";
        clearMessage();
        resetCommand();
        showMessage(gStage); // 1
        showMessage("Loading Lst Members"); // 2
        let promiseA = loadLstMembersData().then(() => messageDone(2));
        showMessage("Loading Wix Members"); // 3
        let promiseC = loadWixMembersData().then(() => messageDone(3));
        showMessage("Loading Import Members"); // 4
        let promiseB = loadImpMembersData().then(() => messageDone(4));
        Promise.all([promiseA, promiseB, promiseC]).then(async () => {
            showMessage("Reconcile Lst with Import"); // 5
            if (reconcileMTBCValues()) {
                messageDone(5);
                let wLstActiveRecords = getActiveLstMembers(gLstRecords);
                const onlyA = unique(wLstActiveRecords, gImpRecords);
                const onlyB = unique(gImpRecords, wLstActiveRecords);
                //console.log("Stage 1 onlyA, onlyB");
                //console.log(onlyA);
                //console.log(onlyB);
                reconcileDatasets(onlyA, onlyB);
                messageDone(6);
                messageDone(7);
            } else {
                showMessage("MTBC Max Value disparity"); // 6
                messageDone(6);
            }
            $w("#imgSyncWait").hide();
        });
    } catch (err) {
        console.log("/page/MaintainMember doStage1 Try-catch, err");
        console.log(err);
        $w("#imgSyncWait").hide();
    }
}

export async function doStage2() {
    $w("#imgSyncWait").show();
    gStage = "Field-Values";
    clearMessage();
    resetCommand();
    showMessage(gStage); // 1
    showMessage("Loading Lst Members"); // 2
    let promiseA = loadLstMembersData().then(() => messageDone(2));
    showMessage("Loading Import Members"); // 3
    let promiseB = loadImpMembersData().then(() => messageDone(3));
    Promise.all([promiseA, promiseB]).then(async () => {
        showMessage("Synchronise Lst field values"); // 4
        synchroniseLstImpFieldValues()
            .then(() => {
                messageDone(4);
                $w("#imgSyncWait").hide();
            })
            .catch((err) => {
                console.log("Error", err);
                $w("#imgSyncWait").hide();
            });
    });
}

export async function doStage3() {
    try {
        $w("#imgSyncWait").show();
        gStage = "Lst-Wix";
        clearMessage();
        resetCommand();
        showMessage(gStage); // 1
        showMessage("Loading Lst Members"); // 2
        let promiseA = loadLstMembersData().then(() => messageDone(2));
        showMessage("Loading Wix Members"); // 3
        let promiseC = loadWixMembersData().then(() => messageDone(3));

        Promise.all([promiseA, promiseC]).then(() => {
            clearSelectStacks();
            showMessage("Reconcile Lst with Wix"); //4
            let wLstActiveRecords = getActiveLstMembers(gLstRecords);
            const onlyC = unique(gWixRecords, wLstActiveRecords);
            const onlyD = unique(wLstActiveRecords, gWixRecords);
            reconcileDatasets(onlyD, onlyC);
            $w("#imgSyncWait").hide();
        });
    } catch (err) {
        console.log("/page/MaintainMember doStage3 Try-catch, err");
        console.log(err);
        $w("#imgSyncWait").hide();
    }
}

export async function doStage4() {
    try {
        gStage = "Lst-GGL";
        $w("#imgSyncWait").show();
        clearMessage();
        resetCommand();
        showMessage(gStage); // 1
        showMessage("Loading Lst Members"); // 2
        let promiseA = loadLstMembersData().then(() => messageDone(2));
        showMessage("Loading Google Members"); // 3
        let promiseC = loadGGLMembersData().then(() => messageDone(3));

        Promise.all([promiseA, promiseC]).then(() => {
            clearSelectStacks();
            //console.log(gLstRecords);
            //console.log(gGGLRecords);
            messageDone(3); //4
            let wLstActiveRecords = getActiveAndGuestLstMembers(gLstRecords);
            const onlyC = unique(gGGLRecords, wLstActiveRecords);
            const onlyD = unique(wLstActiveRecords, gGGLRecords);
            //if (onlyC.length > 0 || onlyD.length > 0) {
            reconcileDatasets(onlyD, onlyC);
            //} else {
            messageDone(4);
            // }
            $w("#imgSyncWait").hide();
        });
    } catch (err) {
        console.log("/page/MaintainMember doStage4 Try-catch, err");
        console.log(err);
        $w("#imgSyncWait").hide();
    }
}

export async function doStage5() {
    try {
        gStage = "Lst-GGL-Field_Value";
        $w("#imgSyncWait").show();
        clearMessage();
        resetCommand();
        showMessage(gStage); // 1
        showMessage("Loading Lst Members"); // 2
        let promiseA = loadLstMembersData().then(() => messageDone(2));
        showMessage("Loading Google Members"); // 3
        let promiseC = loadGGLMembersData().then(() => messageDone(3));

        Promise.all([promiseA, promiseC]).then(() => {
            showMessage("Synchronise Google field values"); // 4
            synchroniseLstGGLFieldValues()
                .then(() => {
                    messageDone(4);
                    $w("#imgSyncWait").hide();
                })
                .catch((err) => {
                    console.log("Error", err);
                    $w("#imgSyncWait").hide();
                });
        });
    } catch (err) {
        console.log("/page/MaintainMember doStage5 Try-catch, err");
        console.log(err);
        $w("#imgSyncWait").hide();
    }
}

export function boxRpt_click(p2or3, pEvent) {
    let wControl = $w.at(pEvent.context);
    let wId = pEvent.context.itemId;
    let wItem = getSyncTargetItem(p2or3, wId);
    // @ts-ignore
    if (wControl(`#chk${p2or3}`).checked) {
        pullFromSelectStack(wControl, wItem, wId, p2or3);
    } else {
        pushToSelectStack(wControl, wItem, wId, p2or3);
    }
    configureSyncCommands(p2or3);
}

//EVENT

//====== SYNC Event Handler Supporting functions ----------------------------------------------------------------
//
function getActiveLstMembers(pLstRecords) {
    let wActiveLstRecords = pLstRecords
        .filter((item) => item.username !== "ClubHouse")
        .filter((item) => item.status !== "Past")
        .filter((item) => item.type !== "Guest")
        .filter((item) => item.type !== "Test");
    return wActiveLstRecords;
}

function getActiveAndGuestLstMembers(pLstRecords) {
    let wActiveLstRecords = pLstRecords
        .filter((item) => item.username !== "ClubHouse")
        .filter((item) => item.status !== "Past")
        //.filter((item) => item.type !== "Guest")
        .filter((item) => item.type !== "Test");
    return wActiveLstRecords;
}

function reconcileMTBCValues() {
    showMessage("Reconcile MTBC values");
    if (gLstRecords) {
        if (gWixRecords) {
            let wLstMaxValue = getMTBCMaxValue(gLstRecords);
            let wWixMaxValue = getMTBCMaxValue(gWixRecords);
            if (wLstMaxValue === wWixMaxValue) {
                showMessage("MTBC values agree");
                return true;
            } else {
                showMessage(
                    `Lst Max Value = ${wLstMaxValue} Wix Max Value = ${wWixMaxValue}`
                );
                return false;
            }
        } else {
            showMessage("Wix Members Load fail");
            return false;
        }
    } else {
        showMessage("Lst Members Load fail");
        return false;
    }
}

function reconcileDatasets(pA, pB) {
    //console.log("ReconDs", pA.length, pB.length);
    $w("#boxLstCompare").expand();
    switch (gStage) {
        case "Lst-Imp":
            $w("#txtRightHdr").text =
                "The following members are in Import only";
            break;
        case "Lst-Wix":
            $w("#txtRightHdr").text = "The following members are in Wix only";
            break;
        case "Lst-GGL":
            $w("#txtRightHdr").text =
                "The following members are in the Google Account only";
            break;
        default:
            $w("#txtRightHdr").text = "Cant find gStage";
            break;
    }
    if (pA && pA.length === 0 && pB && pB.length === 0) {
        $w("#rpt2").collapse();
        $w("#rpt3").collapse();
        $w("#txt2None").collapse();
        $w("#txt3None").collapse();
        $w("#txtRefresh").expand();
        $w("#boxStage1Commands").collapse();
        $w("#boxStage3Commands").collapse();
        $w("#boxStage4Commands").collapse();

        return;
    }
    if (gStage === "Lst-Imp") {
        $w("#boxStage1Commands").expand();
        $w("#boxStage3Commands").collapse();
        $w("#boxStage4Commands").collapse();
    } else if (gStage === "Lst-Wix") {
        $w("#boxStage1Commands").collapse();
        $w("#boxStage3Commands").expand();
        $w("#boxStage4Commands").collapse();
    } else if (gStage === "Lst-GGL") {
        $w("#boxStage1Commands").collapse();
        $w("#boxStage3Commands").collapse();
        $w("#boxStage4Commands").expand();
    }
    if (pA && pA.length > 0) {
        //console.log("pA = ", pA.length);
        $w("#rpt2").expand();
        $w("#txt2None").collapse();
        $w("#rpt2").data = pA;
    } else {
        //console.log("pA = 0");
        $w("#rpt2").collapse();
        $w("#txt2None").expand();
    }
    if (pB && pB.length > 0) {
        //console.log("pB = ", pB.length);
        $w("#rpt3").expand();
        $w("#txt3None").collapse();
        $w("#rpt3").data = pB;
    } else {
        //console.log("pB = 0");
        $w("#rpt3").collapse();
        $w("#txt3None").expand();
    }
}

async function synchroniseLstImpFieldValues() {
    // Once the Lst entries are confirmed, need to check each entry to ensure main data fields agree.
    // The assumption is that the Import spreadsheet is the master source. Therefore, any discrepancy, copy the Import
    // value to the Lst record. (However, there is a possibility that the member may chose to amend their data online
    // through their Profile Edit. This does generate an update email to the Membership Officer, so it is assumed that
    // these changes will be in the spreadsheet). The fields comapred are address fields and telephone fields. Lockers
    // dealt with seperately in its own section.
    //for (let wMember of gLstRecords){

    //
    let wFieldNames = [
        "type",
        "addrLine1",
        "addrLine2",
        "town",
        "postCode",
        "homePhone",
        "mobilePhone",
        "contactEmail",
    ];

    let wChangeList = [];
    let wActiveLstMembers = getActiveLstMembers(gLstRecords);
    //let wLstMember = gLstRecords[1];
    let wCount = 1;
    $w("#pBarLoading").expand();
    $w("#pBarLoading").targetValue = wActiveLstMembers.length;
    for (let wLstMember of wActiveLstMembers) {
        let wLstIn;
        let wImpIn;
        let wLst = "";
        let wImp = "";
        let wChanged = false;
        let wMsg = "";
        let wImpMember = gImpRecords.find(
            (item) => item.key === wLstMember.key
        );
        if (wImpMember) {
            for (let i = 0; i < 8; i++) {
                let wFK = wFieldNames[i];
                wLstIn = wLstMember[wFK];
                wImpIn = wImpMember[wFK];
                wLst = wLstIn && wLstIn.length > 0 ? wLstIn.trim() : null;
                wImp = wImpIn && wImpIn.length > 0 ? wImpIn.trim() : null;
                if (wFK.includes("Phone")) {
                    if (wImpIn && wImpIn.length === 6) {
                        wLst = wLst.slice(-6);
                    }
                    if (!wImp) {
                        wLst = "no phone #";
                    }
                    wImp = wImp ? wImp.replace(/-/g, "") : null;
                    wImp = wImp === "0" ? "no phone #" : wImp;
                }
                if (wImp === "Soc") {
                    wImp = "Social";
                }
                if (wLst !== wImp) {
                    if (wImp === "" || wImp === null || wImp === undefined) {
                        // Import field does not have a value
                        wLst = wFK.includes("Phone") ? "no phone #" : null;
                    } else {
                        // Import field does have a value
                        wChanged = true;
                        if (wLst) {
                            if (wImp) {
                                wMsg =
                                    wMsg +
                                    `field ${wFK} changed from ${wLst} to ${wImp}\n`;
                            } else {
                                wMsg =
                                    wMsg +
                                    `field ${wFK} changed from ${wLst} to null\n`;
                            }
                        } else {
                            if (wImp) {
                                wMsg =
                                    wMsg +
                                    `field ${wFK} changed from null to ${wImp}\n`;
                            } else {
                                wMsg =
                                    wMsg +
                                    `field ${wFK} not changed - is null\n`;
                            }
                        }
                        wLst = wImp;
                    }
                } else {
                    if (wLst && wLst.length < wLstIn.length) {
                        if (wFK !== "homePhone") {
                            // trim took place at top of loop
                            wChanged = true;
                            wMsg =
                                wMsg +
                                `field ${wFK} trimmed from ${String(wLstIn.length)} to ${String(
                                    wLst.length
                                )}\n`;
                        }
                    }
                }
                wLstMember[wFK] = wLst;
            } // for i 1 to 7 loop
            if (wChanged) {
                //save record
                let wResult = await saveRecord("lstMembers", wLstMember);
                //let wResult = {"status": true};
                if (wResult && wResult.status) {
                    let wOut =
                        `The following changes were made to ${wLstMember.key}'s Lst record:\n` +
                        wMsg +
                        "\n";
                    wChangeList.push(wOut);
                } else {
                    console.log(
                        "/page/MaintainMember synchroniseLstImpFieldValues sendMsg failed, error"
                    );
                    console.log(wResult.error);
                }
                wChanged = false;
            }
        } else {
            console.log(
                `/page/MaintainMember synchroniseLstImpFieldValues Cant find member ${wLstMember.key}`
            );
        }
        //console.log(
        //    `Processed ${wCount} of ${wActiveLstMembers.length} records`
        //        );
        wCount++;
        $w("#pBarLoading").value = wCount;
    } // for of gLstRecords
    if (wChangeList && wChangeList.length > 0) {
        let wParams = {
            changeList: wChangeList,
        };
        let wResult = { status: false };
        if (gTest) {
            wResult.status = true;
        } else {
            wResult = await sendMsgToJob(
                "E",
                ["WEB"],
                null,
                false,
                "MemberAmendFieldValues",
                wParams
            );
        }

        if (wResult && wResult.status) {
            console.log(
                "/page/MaintainMember synchroniseLstImpFieldValues sendMsg OK"
            );
        } else {
            console.log(
                "/page/MaintainMember synchroniseLstImpFieldValues sendMsg failed, error"
            );
            console.log(wResult.error);
        }
    } else {
        console.log(
            "/page/MaintainMember synchroniseLstImpFieldValues Nothing to change"
        );
    }
    $w("#pBarLoading").collapse();
    return true;
}

async function synchroniseLstGGLFieldValues() {
    // Once the Lst V GOOGLE entries are confirmed, need to check each entry to ensure main data fields agree.
    // The assumption is that the Lstvalues are correct, they having being synchronised with the Import Master.
    // Therefore, any discrepancy, copy the Lst value to the Google record Only update the lst record if a field is blank, and the Google
    // record has a valid value.
    //
    //
    let wLstFieldNames = ["contactEmail", "altEmail", "mobilePhone"];
    let wGGLFieldNames = ["email1Value", "email2Value", "phone1Value"];

    let wLstChangeList = [];
    let wGGLChangeList = [];
    let wChangeList = [];
    let wActiveLstMembers = getActiveAndGuestLstMembers(gLstRecords);
    let wCount = 1;
    $w("#pBarLoading").expand();
    $w("#pBarLoading").targetValue = wActiveLstMembers.length;
    for (let wLstMember of wActiveLstMembers) {
        let wLstIn;
        let wGGLIn;
        let wLst = "";
        let wGGL = "";
        let wLstChanged = false;
        let wGGLChanged = false;
        let wMsg = "";

        let wGGLMember = gGGLRecords.find(
            (item) => item.key === wLstMember.key
        );
        //console.log("Lst & GGL", wLstMember.key);
        //console.log(wLstMember);
        //console.log(wGGLMember);

        if (wGGLMember) {
            for (let i = 0; i < 3; i++) {
                let wLstFK = wLstFieldNames[i];
                let wGGLFK = wGGLFieldNames[i];
                //console.log("SLG", wLstFK, wGGLFK);
                wLstIn = wLstMember[wLstFK];
                wGGLIn = wGGLMember[wGGLFK];
                wLst = wLstIn && wLstIn.length > 0 ? wLstIn.trim() : null;
                wGGL = wGGLIn && wGGLIn.length > 0 ? wGGLIn.trim() : null;
                if (wLstIn === "no phone #" || wLstIn === "nophone#") {
                    wLst = null;
                }
                if (wGGLIn === "no phone #" || wGGLIn === "nophone#") {
                    wGGL = null;
                }

                if (/** if different */ wLst !== wGGL) {
                    if (
                        /** Lst Empty, GGL full */ wLst === "" ||
                        wLst === null ||
                        wLst === undefined ||
                        wLst === "no phone #" ||
                        wLst === "nophone#"
                    ) {
                        // do GGL -> LSt
                        wLst = wGGL;
                        wMsg =
                            wMsg +
                            `${wLstMember.key} Lst field ${wLstFK} changed from null to ${wLst}\n`;
                        wLstChanged = true;
                    } /** Lst full, GGL empty */ else if (
                        wGGL === "" ||
                        wGGL === null ||
                        wGGL === undefined
                    ) {
                        // do Lst -> GGL
                        wGGL = wLst;
                        wMsg =
                            wMsg +
                            `${wLstMember.key} GGL field ${wGGLFK} changed from null to ${wLst}\n`;
                        wGGLChanged = true;
                    } /** Lst full, GGL full */ else {
                        // do LSt
                        wGGL = wLst;
                        wMsg =
                            wMsg +
                            `${wLstMember.key} GGL field ${wGGLFK} changed from ${wGGL} to ${wLst}\n`;
                        wGGLChanged = true;
                    }
                } /** if same */ else {
                    // do nothing
                }
                wLstMember[wLstFK] = wLst;
                wGGLMember[wGGLFK] = wGGL;
            } // for field name loop
            if (wLstChanged) {
                wLstChangeList.push(wLstMember);
            }
            if (wGGLChanged) {
                wGGLChangeList.push(wGGLMember);
            }
        } else {
            console.log(
                `/page/MaintainMember synchroniseLstGGLFieldValues Cant find GGL member ${wGGLMember.key}`
            );
        }
        wChangeList.push(wMsg);
        console.log(wLstMember.player, wMsg);
        wCount++;
        $w("#pBarLoading").value = wCount;
    } // for of gLstRecords

    //console.log("Now do updates, Lst, GGl");
    //console.log(wLstChangeList);
    //console.log(wGGLChangeList);
    let wGGLUpdateList = wGGLChangeList.map((item) => {
        return {
            _id: item._id,
            firstName: item.firstName,
            lastName: item.lastName,
            phone1Label: item.phone1Label,
            phone1Value: item.phone1Value,
            email1Label: item.email1Label,
            email1Value: item.email1Value,
            email2Label: item.email2Label,
            email2Value: item.email2Value,
            labels: item.labels,
        };
    });

    let wLstUpdateList = wLstChangeList.map((item) => {
        return {
            id: item._id,
            firstName: item.firstName,
            surname: item.surname,
            mobilePhone: item.mobilePhone,
            homePhone: item.homePhone,
            loginEmail: item.loginEmail,
            type: item.type,
            wixId: item.wixId,
            gender: item.gender,
            locker: item.locker,
            username: item.username,
            photo: item.photo,
            addrLine1: item.addrLine1,
            addrLine2: item.addrLine2,
            town: item.town,
            postCode: item.postCode,
            contactpref: item.contactpref,
            dateLeft: item.dateLeft,
            allowshare: item.allowshare,
            status: item.status,
        };
    });
    //console.log(wGGLUpdateList);
    //console.log(wLstupdateList);

    if (wLstUpdateList && wLstUpdateList.length > 0) {
        let wResult = await bulkSaveRecords("lstMembers", wLstUpdateList);
        let wInserts = wResult.results.inserted;
        let wUpdates = wResult.results.updated;
        let wErrors = wResult.results.errors.length;
        console.log(
            `/page/MaintainMember synchroniseLstGGL Lst Bulk Members Save: ${wInserts} inserted, ${wUpdates} updated, ${wErrors} errors`
        );
    }

    if (wGGLUpdateList && wGGLUpdateList.length > 0) {
        let wResult = await bulkSaveRecords("lstGoogleImport", wGGLUpdateList);
        let wInserts = wResult.results.inserted;
        let wUpdates = wResult.results.updated;
        let wErrors = wResult.results.errors.length;
        console.log(
            `/page/MaintainMember synchroniseLstGGL GGL Bulk Members Save: ${wInserts} inserted, ${wUpdates} updated, ${wErrors} errors`
        );
    }

    if (wChangeList && wChangeList.length > 0) {
        let wParams = {
            changeList: wChangeList,
        };
        let wResult = { status: false };
        if (gTest) {
            wResult.status = true;
        } else {
            wResult = await sendMsgToJob(
                "E",
                ["WEB"],
                null,
                false,
                "MemberAmendFieldValues",
                wParams
            );
        }

        if (wResult && wResult.status) {
            console.log(
                "/page/MaintainMember synchroniseLstGGLFieldValues sendMsg OK"
            );
        } else {
            console.log(
                "/page/MaintainMember synchroniseLstGGLFieldValues sendMsg failed, error"
            );
            console.log(wResult.error);
        }
    }

    if (
        wLstChangeList &&
        wLstChangeList.length === 0 &&
        wGGLChangeList &&
        wGGLChangeList.length === 0
    ) {
        console.log(
            "/page/MaintainMember synchroniseLstGGLFieldValues Nothing to change"
        );
    }

    $w("#pBarLoading").collapse();
    return true;
}

function clearSelectStacks() {
    clearSelectStack("2");
    clearSelectStack("3");
    configureSyncCommands("2");
    configureSyncCommands("3");
}

function clearSelectStack(p2or3) {
    if (p2or3 === "2") {
        gSelectLeftStack.length = 0;

        $w("#chk2").checked = false;
        $w("#boxRpt2").style.backgroundColor = COLOUR.FREE;
    } else {
        gSelectRightStack.length = 0;
        $w("#chk3").checked = false;
        $w("#boxRpt3").style.backgroundColor = COLOUR.FREE;
    }
}

export function clearAllSelection(pN) {
    // @ts-ignore
    $w(`#rpt${pN}`).forEachItem(($item) => {
        $item(`#boxRpt${pN}`).style.backgroundColor = COLOUR.FREE;
    });
}

function configureSyncCommands(p2or3) {
    let wLeftSelectedStackCount = gSelectLeftStack.length;
    let wRightSelectedStackCount = gSelectRightStack.length;

    if (gStage === "Lst-Imp") {
        configureStage1Commands(
            p2or3,
            wLeftSelectedStackCount,
            wRightSelectedStackCount
        );
    } else if (gStage === "Lst-Wix") {
        configureStage3Commands(
            p2or3,
            wLeftSelectedStackCount,
            wRightSelectedStackCount
        );
    } /** gStage === "Lst-GGL" */ else {
        configureStage4Commands(
            p2or3,
            wLeftSelectedStackCount,
            wRightSelectedStackCount
        );
    }
}

function configureStage1Commands(p2or3, pLeftCount, pRightCount) {
    if (pLeftCount === 1 && pRightCount === 1) {
        $w("#btnLstStage1Amend").show();
    } else {
        $w("#btnLstStage1Amend").hide();
        $w("#boxNameAmend").collapse();
    }
    if (p2or3 === "2") {
        switch (pLeftCount) {
            case 0:
                $w("#btnLstStage1Past").hide();
                $w("#btnLstStage1Test").hide();
                break;
            case 1:
                $w("#btnLstStage1Past").show();
                $w("#btnLstStage1Test").show();
                break;
            default:
                $w("#btnLstStage1Past").show();
                $w("#btnLstStage1Test").show();
                break;
        }
    } /** p2or3 = 3 */ else {
        switch (pRightCount) {
            case 0:
                $w("#btnImpStage1Past").hide();
                $w("#btnImpStage1NewFull").hide();
                $w("#btnImpStage1NewSocial").hide();
                break;
            case 1:
                $w("#btnImpStage1Past").show();
                $w("#btnImpStage1NewFull").show();
                $w("#btnImpStage1NewSocial").show();
                break;
            default:
                $w("#btnImpStage1Past").show();
                $w("#btnImpStage1NewFull").show();
                $w("#btnImpStage1NewSocial").show();
                break;
        }
    } // if p2or3 === 2
}

function configureStage3Commands(p2or3, pLeftCount, pRightCount) {
    if (pLeftCount === 1 && pRightCount === 1) {
        $w("#btnWixStage3Update").show();
    } else {
        $w("#btnWixStage3Update").hide();
        $w("#boxNameAmend").collapse();
    }
    if (p2or3 === "2") {
        switch (pLeftCount) {
            case 0:
                $w("#btnLstStage3Register").hide();
                break;
            case 1:
                $w("#btnLstStage3Register").show();
                break;
            default:
                $w("#btnLstStage3Register").show();
                break;
        }
    } /** p2or3 === 3 */ else {
        switch (pRightCount) {
            case 0:
                $w("#btnWixStage3Delete").hide();
                break;
            case 1:
                $w("#btnWixStage3Delete").show();
                break;
            default:
                $w("#btnWixStage3Delete").show();
                break;
        }
    } // if p2or3 === 2
}

function configureStage4Commands(p2or3, pLeftCount, pRightCount) {
    if (pLeftCount === 1 && pRightCount === 1) {
        $w("#btnGGLStage4Update").show();
    } else {
        $w("#btnGGLStage4Update").hide();
        $w("#boxNameAmend").collapse();
    }
    if (p2or3 === "2") {
        switch (pLeftCount) {
            case 0:
                $w("#btnGGLStage4Amend").hide();
                $w("#btnGGLStage4Add").hide();
                break;
            case 1:
                $w("#btnGGLStage4Amend").show();
                $w("#btnGGLStage4Add").show();
                break;
            default:
                $w("#btnGGLStage4Amend").hide();
                $w("#btnGGLStage4Add").show();
                break;
        }
    } /** p2or3 = 3 */ else {
        switch (pRightCount) {
            case 0:
                $w("#btnGGLStage4Guest").hide();
                $w("#btnGGLStage4Save").show();
                $w("#btnGGLStage4Delete").hide();
                break;
            case 1:
                $w("#btnGGLStage4Guest").show();
                $w("#btnGGLStage4Save").show();
                $w("#btnGGLStage4Delete").show();
                break;
            default:
                $w("#btnGGLStage4Guest").show();
                $w("#btnGGLStage4Save").show();
                $w("#btnGGLStage4Delete").show();
                break;
        }
    } // if p2or3 === 2
}

function removeFromSet(p2or3, pId) {
    // @ts-ignore
    try {
        // @ts-ignore
        let wRpt = $w(`#rpt${p2or3}`);
        // @ts-ignore
        let wTxtNone = $w(`#txt${p2or3}None`);
        let wOnlyLeft = [];
        let wOnlyRight = [];
        if (p2or3 === "2") {
            wOnlyLeft = wRpt.data;
            let x = wOnlyLeft.findIndex(
                (item) => item.id === pId || item._id === pId
            );
            if (x > -1) {
                wOnlyLeft.splice(x, 1);
                if (wOnlyLeft.length === 0) {
                    wRpt.collapse();
                    wTxtNone.expand();
                } else {
                    wRpt.expand();
                    wTxtNone.collapse();
                    wRpt.data = wOnlyLeft;
                }
            } else {
                console.log(
                    "/pageMaintainMember removeFromSet cant find member, id, p2or3 ",
                    pId,
                    p2or3
                );
            }
        } else {
            wOnlyRight = wRpt.data;
            let x = wOnlyRight.findIndex(
                (item) => item.id === pId || item._id === pId
            );
            if (x > -1) {
                wOnlyRight.splice(x, 1);
                if (wOnlyRight.length === 0) {
                    wRpt.collapse();
                    wTxtNone.expand();
                } else {
                    wRpt.expand();
                    wTxtNone.collapse();
                    wRpt.data = wOnlyRight;
                }
            } else {
                console.log(
                    "/page/MaintainMember removeFromSet cant find member, id, p2or3 ",
                    pId,
                    p2or3
                );
            }
        }

        if (wOnlyLeft.length === 0 && wOnlyRight.length === 0) {
            $w("#txtRefresh").expand();
            $w("#txt2None").collapse();
            $w("#txt3None").collapse();
            $w("#boxStage1Commands").collapse();
            messageDone(3); // put Done on last message
        } else {
            $w("#txtRefresh").collapse();
        }
    } catch (err) {
        console.log("/page/MaintainMember removeFromSet Try-catch, err");
        console.log(err);
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
export function pushToSelectStack(pControl, pRec, pId, p2or3) {
    //console.log("Push to Select Stack");
    //	Updates the gEntities record
    pControl(`#boxRpt${p2or3}`).style.backgroundColor = COLOUR.SELECTED;
    pRec.selected = true;
    pControl(`#chk${p2or3}`).checked = true;

    if (p2or3 === "2") {
        let x = gSelectLeftStack.findIndex((item) => item === pId);
        if (x === -1) {
            gSelectLeftStack.push(pId);
        } else {
            console.log(
                "/page/MaintainMember pushToSelectStack member already exists in stack, id, p2or3 ",
                p2or3
            );
        }
    } else {
        let x = gSelectRightStack.findIndex((item) => item === pId);
        if (x === -1) {
            gSelectRightStack.push(pId);
        } else {
            console.log(
                "/page/MaintainMember pushToSelectStack member already exists in stack, id, p2or3 ",
                pId,
                p2or3
            );
        }
    } // p2or3
}

export function pullFromSelectStack(pControl, pRec, pId, p2or3) {
    //console.log("Pull from Select Stack");
    //	Updates the gEntities record
    pControl(`#boxRpt${p2or3}`).style.backgroundColor = COLOUR.FREE;
    pRec.selected = false;
    pControl(`#chk${p2or3}`).checked = false;
    if (p2or3 === "2") {
        let x = gSelectLeftStack.findIndex((item) => item === pId);
        if (x > -1) {
            gSelectLeftStack.splice(x, 1);
        } else {
            console.log(
                "/page/MaintainMember pullFromSelectStack cant find member, id, p2or3 ",
                pId,
                p2or3
            );
        }
    } else {
        let x = gSelectRightStack.findIndex((item) => item === pId);
        if (x > -1) {
            gSelectRightStack.splice(x, 1);
        } else {
            console.log(
                "/page/MaintainMember pullFromSelectStack cant find member, id, p2or3 ",
                pId,
                p2or3
            );
        }
    }
}

export function getSyncTargetItem(p2or3, pId) {
    if (gStage === "Lst-Imp") {
        if (p2or3 === "2") {
            return gLstRecords.find((wItem) => wItem._id === pId);
        } else {
            return gImpRecords.find((wItem) => wItem._id === pId);
        }
    } else if (gStage === "Lst-Wix") {
        if (p2or3 === "2") {
            return gLstRecords.find((wItem) => wItem._id === pId);
        } else {
            return gWixRecords.find((wItem) => wItem._id === pId);
        }
    } else if (gStage === "Lst-GGL") {
        if (p2or3 === "2") {
            return gLstRecords.find((wItem) => wItem._id === pId);
        } else {
            return gGGLRecords.find((wItem) => wItem._id === pId);
        }
    }
}

//FUNCTION
//====== SYNC Load Repeaters  ---------------------------------------------------------------------------------------
//
function loadRptN(p2or3, pItem, pRec) {
    let wControl1 = `#txt${p2or3}Player`;
    let wControl2 = `#chk${p2or3}`;
    if (p2or3 === "2") {
        pItem(`#lbl2Status`).text = pRec.status;
    }
    pItem(`#boxRpt${p2or3}`).style.backgroundColor = COLOUR.FREE;
    pItem(wControl1).text = pRec.key;
    pItem(wControl2).checked = false;
}
//====== SYNC Load Data ---------------------------------------------------------------------------------------
//

async function loadWixMembersData() {
    //  Record key is _id

    // console.log("loadWix`MembersData", gTest);
    try {
        const wAll = await getActiveWixMembers();
        let wWixContactsMembers = wAll.filter(
            (item) => item.name !== "Maidenhead Town"
        );

        for (let wMember of wWixContactsMembers) {
            let wTempMember = wMember;
            wTempMember.key = wTempMember.name;
            gWixRecords.push(wTempMember);
        }
        //console.log("gWixRecords");
        //console.log(gWixRecords);
        return true;
    } catch (err) {
        console.log("/page/MaintainMember loadWixMemberData Try-catch, err");
        console.log(err);
        return false;
    }
}

async function loadLstMembersData() {
    //  Record key is _id or id

    try {
        gLstRecords = await getAllMembers();
        for (let wMember of gLstRecords) {
            wMember.key = wMember.fullName;
        }
        //console.log("pLstRecords");
        //console.log(gLstRecords);
        return true;
    } catch (err) {
        console.log("/page/MaintainMember loadLstMembersData Try-catch, err");
        console.log(err);
        return false;
    }
}

async function loadImpMembersData() {
    //  Record key is _id
    try {
        gImpRecords = await getAllImportMembers();
        return true;
        //console.log("pImpRecords");
        //console.log(gImpRecords);
    } catch (err) {
        console.log("/page/MaintainMember loadImpMembersData try-catch, err");
        console.log(err);
        return false;
    }
}

async function loadGGLMembersData() {
    //  Record key is _id
    try {
        gGGLRecords = await getAllGoogleMembers();
        //console.log("loadGGLMembersData, gGGL");
        //console.log(gGGLRecords);
        return true;
    } catch (err) {
        console.log("/page/MaintainMember loadGGLMembersData Try-catch, err");
        console.log(err);
        return false;
    }
}

//====== SYNC Helper functions -------------------------------------------------------------------------------
//

// Helper function to find unique elements in an array
const unique = (array, ...excludeArrays) => {
    return array.filter(
        (item) =>
            !excludeArrays.some((excludeArray) =>
                excludeArray.some((excludeItem) => excludeItem.key === item.key)
            )
    );
};

function showMessage(pMsg) {
    let wMsg = { idx: "", msg: "", status: "" };
    wMsg.msg = pMsg;
    wMsg.idx = String(gMessages.length + 1);
    gMessages.push(wMsg);
    $w("#tblProgress").rows = gMessages;
}

function clearMessage() {
    gMessages.length = 0;
    $w("#tblProgress").rows = gMessages;
}

function messageDone(pIndex) {
    if (pIndex > gMessages.length) {
        console.log(
            "/page/MaintainMember messageDone overflow, index, length",
            pIndex,
            gMessages.length
        );
    } else {
        let wMsg = gMessages.find((item) => item.idx === String(pIndex));
        if (wMsg) {
            wMsg.status = "Done";
            $w("#tblProgress").rows = gMessages;
        } else {
            console.log(
                "/page/MaintainMember messageDone cant find message, index, length",
                pIndex,
                gMessages.length
            );
        }
    }
}

//====== Stage 1: Lst v Import ===========================================================================
//
// @ts-ignore
let wMember2 = {};
let wMember3 = {};

export async function btnNameAmend_click(pStage) {
    //  This is where we have corresponding entries in each side, but they differ only in name.
    //  It can be entered by pressing btnLstStage1AMend in Stage 1, or by btnWixStage3Update in Stage3, or btnGGLStage4Update in Stage 4;
    //  For Lst-Import reconciliation, either the Lst value or the Import value can be amended.
    //  For Lst-Wix and Lst-Google reconciliations, then the Lst value is immutable.
    //  So, action is to update the Wix or Google record with the Lst values.
    //console.log("Btn Lst Update click", pStage, gStage);

    let wItemId2 = gSelectLeftStack[0];
    let wItemId3 = gSelectRightStack[0];
    wMember2 = gLstRecords.find((item) => item._id === wItemId2);
    switch (pStage) {
        case 1:
            wMember3 = gImpRecords.find((item) => item._id === wItemId3);
            break;
        case 3:
            wMember3 = gWixRecords.find((item) => item._id === wItemId3);
            break;
        case 4:
            wMember3 = gGGLRecords.find((item) => item._id === wItemId3);
            break;
    }
    $w("#inpNameAmend2FirstName").value = wMember2.firstName;
    $w("#inpNameAmend2Surname").value = wMember2.surname;
    $w("#inpNameAmend3FirstName").value = wMember3.firstName;
    $w("#inpNameAmend3Surname").value =
        gStage === "Lst-Imp" ? wMember3.surname : wMember3.lastName;
    $w("#boxNameAmend").expand();
    if (gStage === "Lst-Imp") {
        $w("#txtNameAmend2Caption").text = "Web data";
        $w("#txtNameAmend3Caption").text = "Master data";
        $w("#btnNameAmend2Save").enable();
        $w("#btnNameAmend3Save").enable();
        $w("#btnNameAmend2Save").label = "Update Web Data";
        $w("#btnNameAmend3Save").label = "Update Import Data";
    } else if (gStage === "Lst-Wix") {
        $w("#txtNameAmend2Caption").text = "Lst data";
        $w("#txtNameAmend3Caption").text = "Wix data";
        $w("#btnNameAmend2Save").disable();
        $w("#btnNameAmend3Save").enable();
        $w("#btnNameAmend3Save").label = "Update Wix Data";
    } else {
        $w("#txtNameAmend2Caption").text = "Lst data";
        $w("#txtNameAmend3Caption").text = "Google data";
        $w("#btnNameAmend2Save").disable();
        $w("#btnNameAmend3Save").enable();
        $w("#btnNameAmend3Save").label = "Update Google Data";
    }
}

export async function btnLstStage1Past_click() {
    // There is an entry in Lst but not in Import. This is the case for members who have left the club or who
    // have passed away.
    try {
        $w("#btnLstStage1Past").disable();
        await updateLstMembers("btnLstStage1Past", "2", "Past");
        $w("#btnLstStage1Past").enable();
    } catch (err) {
        console.log(
            "/page/MaintainMember btnLstStage1Past_click Try-catch, err"
        );
        console.log(err);
    }
}

export async function btnLstStage1Test_click() {
    // There is an entry in Lst but not in Import. This is the case for development members used in local testing
    try {
        $w("#btnLstStage1Test").disable();
        await updateLstMembers("btnLstStage1Test", "2", "Test");
        $w("#btnLstStage1Test").enable();
    } catch (err) {
        console.log(
            "/page/MaintainMember btnLstStage1Test_click Try-catch, err"
        );
        console.log(err);
    }
}

export async function btnImpStage1Past_click() {
    //  You can end up with situations where a record exists in Import but has a status Past in Lst, therefore
    //  it will not show up in the left repeater. Simply, remove the import entry.
    //console.log("btnImpStage1Past", gStage);
    const wStage = 1;
    const p2or3 = "3";

    try {
        showStageWait(wStage);
        for (let wImpRowId of gSelectRightStack) {
            await deleteImportMemberRecord(wImpRowId);
            removeFromSet(p2or3, wImpRowId);
            await deleteGlobalStore(p2or3, wImpRowId);
            showMsg(1, 0, `Imp member ${wImpRowId} deleted`);
        }
        gSelectRightStack.length = 0;
        $w(`#chk${p2or3}`).checked = false;
        hideStageWait(wStage);
    } catch (err) {
        console.log(
            "/page/MaintainMember btnImpStage1Past_click Try-catch, err"
        );
        console.log(err);
        hideStageWait(wStage);
    }
}

export async function btnImpStage1New_click(pType) {
    //  These are entries in Import but not in Lst. These are the new members joined this year.
    //  pType shows which button was pressed: F = Full member, S = Soceial member
    try {
        //console.log("Btn Imp New click", gStage, pType);
        $w("#lblErrMsg").text = "";
        let wErrMsg = "";
        let wType = pType === "F" ? "Full" : "Social";
        let wItemIds = [...gSelectRightStack];
        for (let wItemId of wItemIds) {
            showStageWait("1");
            let wImportMember = gImpRecords.find(
                (item) => item._id === wItemId
            );
            if (wImportMember) {
                wImportMember.loginEmail = setMTBCUsername();
                wImportMember.type = wType;
                let wResult = await createNewMember(false, wImportMember); // this updates entity globalDataStore
                if (wResult && wResult.status) {
                    let wSavedRecord = wResult.savedRecord;
                    removeFromSet("3", wMember3._id);
                    updateRecordStore("2", wSavedRecord);
                    clearSelectStack("3");
                    $w("#lblMTBCCount").text = updateMTBCUsernameCount();
                    showMsg(
                        1,
                        0,
                        `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} created`
                    );
                } else {
                    // add error result error message to wErrMsg string
                    if (wErrMsg.length === 0) {
                        wErrMsg = wResult.error;
                    } else {
                        wErrMsg = wErrMsg + "\n" + wResult.error;
                    }
                    showMsg(
                        1,
                        0,
                        `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} creation errors`
                    );
                }
            } else {
                console.log(
                    "/page/MaintainMember btnImpNew Member Not found",
                    wItemId
                );
                showMsg(
                    1,
                    0,
                    `New ${pType} member ${wImportMember.firstName} ${wImportMember.surname} creation member not found`
                );
            }
        }
        if (wErrMsg.length > 1) {
            $w("#lblErrMsg").text = wErrMsg;
        }
        hideStageWait(1);
    } catch (err) {
        console.log(
            "/page/MaintainMember btnImpStage1New_click Try-catch, err"
        );
        console.log(err);
        hideStageWait(1);
    }
}

//====== Stage 1: Helpers -------------------------------------------------------------------------------------

/**
 *
 *
 * @param {string} pSource
 * @param {string} p2or3
 * @param {string} pStatus
 *
 */
async function updateLstMembers(pSource, p2or3, pStatus) {
    try {
        showStageWait("1");
        let wUpdateStack = [];
        let wToday = new Date();
        for (let wLstRowId of gSelectLeftStack) {
            let wLstMember = gLstRecords.find((item) => item._id === wLstRowId);
            // using .find updates gLst directly
            if (wLstMember) {
                if (pSource === "btnLstPast") {
                    wLstMember.status = pStatus;
                    wLstMember.dateLeft = wToday;
                } else {
                    wLstMember.type = "Test";
                }
                wUpdateStack.push(wLstMember);
                removeFromSet(p2or3, wLstRowId);
            } else {
                console.log(
                    `/page/MaintainMember ${pSource} Lst Not found`,
                    wLstRowId
                );
            }
        }
        clearSelectStack(p2or3);
        if (wUpdateStack && wUpdateStack.length > 0) {
            let wResult = await bulkSaveRecords("lstMembers", wUpdateStack);
            let wUpdateArray = wResult.results.updatedItemIds;
            let wInserts = wResult.results.inserted;
            let wUpdates = wUpdateArray.toString();
            let wErrors = wResult.results.errors.length;
            console.log(
                `/page/MaintainMember ${pSource} Bulk Members Save: ${wInserts} inserted, ${wUpdates} updated, ${wErrors} errors`
            );
            clearSelectStacks();
            showMsg(
                1,
                0,
                `${pSource} Bulk Members Save: ${String(
                    wUpdateArray.length
                )} updated, ${wErrors} errors`
            );
        } else {
            console.log(
                `/page/MaintainMember ${pSource} Bulk Members Save: Nothing to update`
            );
            showMsg(1, 0, "Nothing to update");
        }
        hideStageWait(1);
    } catch (err) {
        console.log("/page/MaintainMember updateLstMembers Try-catch, err");
        console.log(err);
        hideStageWait(1);
    }
}

function updateRecordStore(p2or3, pRec) {
    try {
        //console.log("urs", gStage, p2or3);
        //console.log(pRec);
        //console.log(gGGLRecords);
        let wRecordData = getRecordStore(p2or3);
        let wSortedData = [];
        let wRecordItem = {};
        let wFullName = "";
        if (!wRecordData) {
            console.log(
                `/page/MaintauMember updateRecordStore wrong stage ${gStage}`
            );
        } else {
            wRecordItem = wRecordData.find((item) => item._id === pRec._id);
            if (/** this is an update */ wRecordItem) {
                wFullName = pRec.firstName + " " + pRec.lastName;
                wRecordItem.firstName = pRec.firstName;
                wRecordItem.lastName = pRec.lastName;
                wRecordItem.surname = pRec.lastName;
                wRecordItem.player = wFullName;
                wRecordItem.fullName = wFullName;
                wRecordItem.key = wFullName;
                switch (gStage) {
                    case "Lst-Imp":
                        if (p2or3 === "2") {
                            wRecordItem.status = pRec.status;
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wRecordItem.status = pRec.status;
                            wRecordItem.key = wFullName;
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gImpRecords = [...wSortedData];
                        }
                        break;

                    case "Lst-Wix":
                        if (p2or3 === "2") {
                            wRecordItem.status = pRec.status;
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wRecordItem.status = pRec.status;
                            wSortedData = _.orderBy(wRecordData, [
                                "lastName",
                                "firstName",
                            ]);
                            gWixRecords = [...wSortedData];
                        }
                        break;
                    case "Lst-GGL":
                        if (p2or3 === "2") {
                            wRecordItem.status = pRec.status;
                            wRecordItem.type = pRec.type;
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wRecordItem.key = wFullName;
                            wRecordItem.status = pRec.status;
                            wSortedData = _.orderBy(wRecordData, [
                                "lastName",
                                "firstName",
                            ]);
                            gGGLRecords = [...wSortedData];
                        }
                        break;
                    default:
                        console.log(
                            `/page/MaintainMember updateRecordStore invalid switch ${gStage}`
                        );
                }
            } /** this is an addition */ else {
                wRecordData.push(pRec);
                wRecordItem = wRecordData.find((item) => item._id === pRec._id);
                wFullName = pRec.firstName + " " + pRec.lastName;
                wRecordItem.firstName = pRec.firstName;
                wRecordItem.lastName = pRec.lastName;
                wRecordItem.surname = pRec.lastName;
                wRecordItem.player = wFullName;
                wRecordItem.fullName = wFullName;
                wRecordItem.key = wFullName;
                switch (gStage) {
                    case "Lst-Imp":
                        if (p2or3 === "2") {
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gImpRecords = [...wSortedData];
                        }
                        break;
                    case "Lst-Wix":
                        if (p2or3 === "2") {
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wRecordItem.status = pRec.status;
                            wSortedData = _.orderBy(wRecordData, [
                                "lastName",
                                "firstName",
                            ]);
                            gWixRecords = [...wSortedData];
                        }
                        break;
                    case "Lst-GGL":
                        if (p2or3 === "2") {
                            wSortedData = _.orderBy(wRecordData, [
                                "surname",
                                "firstName",
                            ]);
                            gLstRecords = [...wSortedData];
                        } else {
                            wRecordItem.key = wFullName;
                            wRecordItem.status = pRec.status;
                            wRecordItem.type = pRec.type;
                            wSortedData = _.orderBy(wRecordData, [
                                "lastName",
                                "firstName",
                            ]);
                            gGGLRecords = [...wSortedData];
                        }
                        break;
                    default:
                        console.log(
                            `/page/MaintainMember updateRecordStore invalid switch 2 ${gStage}`
                        );
                }
            }
        }
    } catch (err) {
        console.log(
            "/page/MaintainMember updateRecordStore try-catch error, stage, p20r3, err, pRec",
            gStage,
            p2or3
        );
        console.log(err);
        console.log(pRec);
    }
}

function deleteGlobalStore(p2or3, pId) {
    try {
        let wRecordData = getRecordStore(p2or3);
        if (!wRecordData) {
            console.log(
                `/page/MaintainMember deleteGlobalStore wrong stage ${gStage}`
            );
        } else {
            let wIdx = wRecordData.findIndex(
                (item) => item._id === pId || item.id === pId
            );
            if (wIdx > -1) {
                wRecordData.splice(wIdx, 1);
            } else {
                console.log(
                    `/page/MaintainMember deleteGlobalStore couldnt find ${pId} in ${gStage} global data store ${p2or3}`
                );
            }
        }
    } catch (err) {
        console.log(
            "/page/MaintainMember deleteGlobalStore try-catch error, stage, p20r3, err, pRec",
            gStage,
            p2or3
        );
        console.log(err);
    }
}

function getRecordStore(p2or3) {
    let wRecordData = [];
    if (/** left side repeater */ p2or3 === "2") {
        wRecordData = gLstRecords;
    } /** right side repeater */ else {
        if (gStage === "Lst-Imp") {
            wRecordData = gImpRecords;
        }
        if (gStage === "Lst-Wix") {
            wRecordData = gWixRecords;
        }
        if (gStage === "Lst-GGL") {
            wRecordData = gGGLRecords;
        }
    }
    return wRecordData;
}

function resetCommand() {
    $w("#boxLstCompare").collapse();
    $w("#boxStage1Commands").collapse();
    $w("#boxStage3Commands").collapse();
    $w("#boxStage4Commands").collapse();
    $w("#txt2None").collapse();
    $w("#txt3None").collapse();
    $w("#txtRefresh").collapse();
    $w("#rpt2").collapse();
    $w("#rpt3").collapse();
}

async function createNewMember(pIsAudit, pMember) {
    try {
        let wOldMemberId = pMember.id;

        let wMember = {
            _id: undefined,
            username: "",
            loginEmail: pMember.loginEmail,
            firstName: pMember.firstName,
            surname: pMember.surname,
            gender: pMember.gender,
            type: pMember.type,
            status: "Pending",
            contactpref: "E",
            allowshare: "Y",
            contactEmail: pMember.contactEmail,
            altEmail: "",
            mobilePhone: pMember.mobilePhone,
            homePhone: pMember.homePhone,
            locker: pMember.locker,
            addrLine1: pMember.addrLine1,
            addrLine2: pMember.addrLine2,
            town: pMember.town,
            postCode: pMember.postCode,
            wixId: pMember.wixId,
            photo: "",
        };

        if (!wOldMemberId) {
            wOldMemberId = "Imported";
        }

        let wUsername =
            capitalize(pMember.surname) + pMember.firstName[0].toUpperCase();
        let wResult;
        if (await isUnique(wUsername)) {
            let wPhoto = pMember.gender === "M" ? gManOutline : gWomanOutline;

            wResult = { Status: true, savedRecord: { _id: "1234" }, error: "" };
            wMember.username = wUsername;
            wMember.dateLeft = undefined;
            wMember.status = STATUS.PENDING;
            wMember._id = undefined;
            wMember.photo = wPhoto;
            wMember.contactpref = "N";
            if (
                wMember.contactEmail !== "" &&
                wMember.contactEmail !== null &&
                wMember.contactEmail !== undefined
            ) {
                wMember.contactpref = "E";
            } else {
                if (
                    wMember.mobilePhone !== "no phone #" &&
                    wMember.mobilePhone !== "" &&
                    wMember.mobilePhone !== null &&
                    wMember.mobilePhone !== undefined
                ) {
                    wMember.contactpref = "S";
                }
            }
            console.log(
                `/page/MaintainMember createNewMember with contactpref ${wMember.contactpref} from lst ${wOldMemberId}`
            );
            wResult = await createMember(pIsAudit, wMember);
            if (wResult && wResult.status) {
                let wSavedRecord = wResult.savedRecord;
                updateGlobalDataStore(wSavedRecord, "Member");
                updatePagination("Member");
            } else {
                console.log(
                    "/page/MaintainMember createNewMember createMember fail"
                );
                console.log(wResult.error);
            }
        } else {
            console.log(
                "/pageMaintainMember createNewMember username is not unique",
                wUsername
            );
            wResult = {
                Status: false,
                savedRecord: { _id: "1234" },
                error: `${wUsername} Username not unique`,
            };
        }
        return wResult;
    } catch (err) {
        console.log("/page/MaintainMember createNewMember try-catch error");
        console.log(err);
    }
}
//====== Name Amend Box =======================================================================================
//

// @ts-ignore
export async function btnNameAmend2Save_click() {
    // Set up from btnLstStage1Amend, btnWixUp3date or btnGGLStage4Update
    // Update the Lst value with the Import values
    //console.log("Btn Lst Amend Save click", gStage);
    try {
        showStageWait("1");

        let wId2 = gSelectLeftStack[0];
        let wMember = getSyncTargetItem("2", wId2);

        if (gStage === "Lst-Imp") {
            wMember.firstName = $w("#inpNameAmend3FirstName").value;
            wMember.surname = $w("#inpNameAmend3Surname").value;
            let wResult = await saveRecord("lstMembers", wMember);
            if (wResult && wResult.status) {
                let wSavedRecord = wResult.savedRecord;
                $w("#btnLstStage1Amend").hide();
                removeFromSet("2", wMember2._id);
                removeFromSet("3", wMember3._id);
                updateRecordStore("2", wSavedRecord);
                clearSelectStacks();
                $w("#boxNameAmend").collapse();
                showMsg(
                    1,
                    0,
                    `LST name ${wMember.firstName} ${wMember.surname} updated`
                );
            } else {
                console.log(
                    "/page/MaintainMember btnNameAmend2Save saverecord fail"
                );
                console.log(wResult.error);
                showMsg(
                    1,
                    0,
                    `LST name ${wMember.firstName} ${wMember.surname} update failed`
                );
            }
        } else {
            console.log(
                "/page/MaintainMember btnNameAmend2Save wrong state",
                gStage
            );
            showMsg(
                1,
                0,
                `LST name ${wMember.firstName} ${wMember.surname} wrong stage`
            );
        }
        hideStageWait(1);
    } catch (err) {
        console.log(
            "/page/MaintainMember btnNameAmend2Save_click try-catch error"
        );
        console.log(err);
        hideStageWait(1);
    }
}

// @ts-ignore
export async function btnNameAmend3Save_click() {
    // Set up from btnLstAmend
    // Update the Wix or Google value with the Lst values
    //console.log("Btn Name Amend 3 Save click", gStage);

    try {
        let wId3 = gSelectRightStack[0];
        let wTargetMember = getSyncTargetItem("3", wId3);

        if (gStage === "Lst-Imp") {
            showStageWait("1");
            //  Update the IMport record and send Email to Membership secretary to update Master membership spreadsheet
            let wOldName =
                wTargetMember.firstName + " " + wTargetMember.surname;
            wTargetMember.firstName = $w("#inpNameAmend2FirstName").value;
            wTargetMember.surname = $w("#inpNameAmend2Surname").value;
            let wResult = await saveImportMemberRecord(wTargetMember);
            //  Send message to Membership secreatry
            if (wResult && wResult.status) {
                let wSavedRecord = wResult.savedRecord;
                let wParams = {
                    oldName: wOldName,
                    newName:
                        wTargetMember.firstName + " " + wTargetMember.surname,
                };

                if (gTest) {
                    wResult.status = true;
                    console.log("Test Mode: Send Msg");
                } else {
                    //wResult.status = true;
                    wResult = await sendMsgToJob(
                        "E",
                        ["WEB"],
                        null,
                        false,
                        "MemberAmendImportName",
                        wParams
                    );
                }
                if (wResult && wResult.status) {
                    console.log(
                        "/page/MaintainMember btnNameAmend3Save sendMsgToJob OK for ",
                        wTargetMember._id
                    );
                    $w("#btnLstStage1Amend").hide();
                    removeFromSet("2", wMember2._id);
                    removeFromSet("3", wMember3._id);
                    updateRecordStore("3", wSavedRecord);

                    clearSelectStacks();
                    $w("#boxNameAmend").collapse();
                    showMsg(
                        1,
                        0,
                        `Import name ${wTargetMember.firstName} ${wTargetMember.surname} updated`
                    );
                } else {
                    console.log(
                        "/page/MaintainMember btnNameAmend3Save sendMsgToJob failed, error"
                    );
                    console.log(wResult.error);
                }
            } else {
                console.log(
                    "/page/MaintainMember btnNameAmend3Save saverecord fail"
                );
                console.log(wResult.error);
                showMsg(
                    1,
                    0,
                    `Import name ${wTargetMember.firstName} ${wTargetMember.surname} update failed`
                );
            }
            hideStageWait("1");
        } else if (gStage === "Lst-Wix") {
            showStageWait("3");
            //  Update the Wix record
            let wFirstName = $w("#inpNameAmend2FirstName").value.trim();
            let wSurname = $w("#inpNameAmend2Surname").value.trim();
            wTargetMember.firstName = wFirstName;
            wTargetMember.lastName = wSurname;
            wTargetMember._id = wMember3._id;
            // eslint-disable-next-line no-unused-vars
            let wSavedRecord = await updateWixMember(wTargetMember);
            $w("#btnWixStage3Update").hide();
            removeFromSet("2", wMember2._id);
            removeFromSet("3", wMember3._id);
            updateRecordStore("3", wSavedRecord);
            clearSelectStacks();
            $w("#boxNameAmend").collapse();
            showMsg(3, 0, `Wix name ${wFirstName} ${wSurname} updated`);
            hideStageWait("3");
        } else if (gStage === "Lst-GGL") {
            showStageWait("4");
            //  Update the Google Import record
            let wFirstName = $w("#inpNameAmend2FirstName").value.trim();
            let wSurname = $w("#inpNameAmend2Surname").value.trim();
            wTargetMember.firstName = wFirstName;
            wTargetMember.lastName = wSurname;
            wTargetMember._id = wMember3._id;
            // eslint-disable-next-line no-unused-vars
            let wResult = await saveGoogleMemberRecord(wTargetMember);
            let wSavedRecord = wResult.savedRecord;
            $w("#btnGGLStage4Update").hide();
            removeFromSet("2", wMember2._id);
            removeFromSet("3", wMember3._id);
            updateRecordStore("3", wSavedRecord);
            clearSelectStacks();
            $w("#boxNameAmend").collapse();
            showMsg(3, 0, `Google name ${wFirstName} ${wSurname} updated`);
            hideStageWait("4");
        } else {
            console.log(
                "/page/MaintainMember btnNameAmend3Save wrong state",
                gStage
            );
        }
    } catch (err) {
        console.log("/page/MaintainMember btnNameAmend3Save try-catch error");
        console.log(err);
        hideStageWait("3");
    }
}

export function btnNameAmendCancel_click() {
    $w("#inpNameAmend2FirstName").value = "";
    $w("#inpNameAmend2Surname").value = "";
    $w("#inpNameAmend3FirstName").value = "";
    $w("#inpNameAmend3Surname").value = "";
    $w("#btnLstStage1Amend").hide();
    $w("#btnWixStage3Update").hide();
    $w("#btnWixStage3Delete").hide();
    $w("#btnLstStage3Register").hide();
    $w("#btnGGLStage4Update").hide();
    $w("#btnGGLStage4Save").hide();
    $w("#btnGGLStage4Guest").hide();

    clearSelectStacks();
    //clearAllSelection(2);
    //clearAllSelection(3);
    $w("#boxNameAmend").collapse();
}

//====== Stage 3: Lst v Wix Compare ===========================================================================
//
export async function btnLstStage3Register_click() {
    //console.log("btnLstStage3Register", gStage);
    //  These are LST entries that are in both LST and Import, but not in Wix. This covers old LST
    //  members who were in the club, but they never registered.
    //
    //  So, the LST entry will beturned into a Username based LST account, and a Wix record set up for them
    //  by registering them. Will also need to generate a Login Token for that user, and create a new MTBC
    //  record for the user.
    //  1) Create new mmber (Lst, Wix, MTBC) using details from old Lst
    //  2) Delete existing Lst member

    try {
        $w("#lblErrMsg").text = "";
        let wErrMsg = "";
        for (let wLstRowId of gSelectLeftStack) {
            $w("#btnLstStage3Register").hide();
            showStageWait("3");
            let wLstMember = gLstRecords.find((item) => item._id === wLstRowId);
            if (wLstMember) {
                wLstMember.loginEmail = setMTBCUsername();
                let wOldLstId = wLstMember._id;
                wLstMember._id = undefined;
                let wResult = await createNewMember(true, wLstMember); //includes updateGlobalDataStore
                if (wResult && wResult.status) {
                    let wSavedRecord = wResult.savedRecord;
                    removeFromSet("2", wLstRowId);
                    updateRecordStore("2", wSavedRecord);
                    updateRecordStore("3", wSavedRecord);
                    await deleteLstMember(wOldLstId);
                    deleteGlobalStore("2", wOldLstId);
                    $w("#lblMTBCCount").text = updateMTBCUsernameCount();
                    showMsg(
                        3,
                        0,
                        `New Wix member ${wLstMember.firstName} ${wLstMember.surname} created`
                    );
                } else {
                    // add error result error message to wErrMsg string
                    if (wErrMsg.length === 0) {
                        wErrMsg = wResult.error;
                    } else {
                        wErrMsg = wErrMsg + "\n" + wResult.error;
                    }
                    showMsg(
                        3,
                        0,
                        `New Wix member ${wLstMember.firstName} ${wLstMember.surname} creation errors`
                    );
                }
            } else {
                console.log(
                    "/page/MaintainMember btnLst3Register Member Not found",
                    wLstRowId
                );
                showMsg(3, 0, `New Wix member: not found`);
            }
            hideStageWait("3");
            console.log(
                "------------------------- next for entry-----------------------------------------------"
            );
        } // for

        if (wErrMsg.length > 1) {
            $w("#lblErrMsg").text = wErrMsg;
        }
        clearSelectStack("2");
        hideStageWait("3");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnLstStage3Register_click try-catch error"
        );
        console.log(err);
        hideStageWait("3");
    }
}

export async function btnWixStage3Delete_click() {
    //  This is a Wix member that no longer exists in LST (and hence in Import). It is probably the relic
    //  of a once regsitered member, where the Lst record has been deleted and the Wix member left dangling.
    //  Therefore, the only action to take is to delete the Wix record to keep everything aligned.
    //
    try {
        //console.log("btnWixStage3Delete", gStage);
        const p2or3 = "3";
        for (let wWixRowId of gSelectRightStack) {
            showStageWait("3");
            let wMember = gWixRecords.find((item) => item._id === wWixRowId);
            if (wMember) {
                await deleteWixMembers([wWixRowId]);
                removeFromSet(p2or3, wWixRowId);
                deleteGlobalStore(p2or3, wWixRowId);
                showMsg(
                    3,
                    0,
                    `Wix member ${wMember.firstName} ${wMember.lastName} deletedd`
                );
            } else {
                console.log(
                    "/page/MaintainMember btnWixStage3Delete Wix member Not found",
                    wWixRowId
                );
                showMsg(3, 0, `Wix member not found`);
            }
        }
        gSelectRightStack.length = 0;
        $w(`#chk${p2or3}`).checked = false;
        clearSelectStack("3");
        hideStageWait("3");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnWixStage3Delete_click try-catch error"
        );
        console.log(err);
        hideStageWait("3");
    }
}

//====== Stage 4: Lst v Google Import ===========================================================================
//

export async function btnGGLStage4Add_click() {
    //  These are entries in LST mbut dont exist in Google. They tend to be members who do not have any email address and/or
    //  mobile number. They need to be added to Google Import: those without both an email address and a mobile phone use the
    //  label "None", while those without an email address but with a mobile phone use the label "SMS".

    try {
        //console.log("BtnGGLStage4Add click");
        const p2or3 = "2";
        for (let wLstRowId of gSelectLeftStack) {
            showStageWait("4");
            let wMember = gLstRecords.find((item) => item._id === wLstRowId);
            if (wMember) {
                let wLabelArray = [];

                let wEmail = wMember.contactEmail;
                let wMobile = wMember.mobilePhone;
                let wHasEmail =
                    wEmail === "" || wEmail === null || wEmail === undefined ?
                        false
                    :   true;
                let wHasPhone =
                    (
                        wMobile === "" ||
                        wMobile === null ||
                        wMobile === undefined
                    ) ?
                        false
                    :   true;

                if (wHasEmail) {
                    wLabelArray.push("All members");
                    if (wMember.type === "Full") {
                        wLabelArray.push("Playing members");
                    }
                    wMember.gender === "M" ?
                        wLabelArray.push("Men")
                    :   wLabelArray.push("Ladies");
                } /** no email */ else {
                    if (wHasPhone) {
                        wLabelArray.push("SMS");
                    } /** no email, no phone */ else {
                        wLabelArray.push("None");
                    }
                }
                let wLabels = wLabelArray.join(" ::: ") + " ::: * myContacts";

                let wNewRec = {
                    _id: undefined,
                    firstName: wMember.firstName,
                    lastName: wMember.surname,
                    labels: wLabels,
                    eMail1Label: wHasEmail ? "*" : "",
                    eMail1Value: wMember.contactEmail,
                    eMail2Label: "",
                    eMail2Value: wMember.altEmail,
                    phone1Label: "",
                    phone1Value: wMember.mobilePhone,
                };
                let wResult = await saveGoogleMemberRecord(wNewRec);
                if (wResult && wResult.status) {
                    let wNewGoogleItem = wResult.savedRecord;
                    removeFromSet(p2or3, wLstRowId);
                    updateRecordStore("3", wNewGoogleItem);
                    showMsg(
                        4,
                        0,
                        `Google member ${wNewGoogleItem.firstName} ${wNewGoogleItem.lastName} added`
                    );
                } else {
                    console.log(
                        "/page/MaintainMember btnGGLStage4Add saverecord failed, err",
                        wLstRowId
                    );
                    console.log(wResult.error);
                }
            } else {
                console.log(
                    "/page/MaintainMember btnGGLStage4Add Lst member Not found",
                    wLstRowId
                );
                showMsg(4, 0, `Google member not found`);
            }
        } // for loop
        gSelectLeftStack.length = 0;
        $w(`#chk${p2or3}`).checked = false;
        clearSelectStack("3");
        hideStageWait("4");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnGGLStage4Add_click Try-catch, err"
        );
        console.log(err);
        hideStageWait("4");
    }
}

export async function btnGGLStage4Delete_click() {
    //  This is a Google member that doesnt exist in LST (and hence in Import). It is probably the relic
    //  of a Past member. Sice these are filtered out of Stage 4 Lst, then he only action to take is to delete
    //  the Google record to keep everything aligned.
    //
    try {
        //console.log("btnGGLStage4Delete", gStage);
        const p2or3 = "3";
        for (let wGGLRowId of gSelectRightStack) {
            showStageWait("4");
            let wMember = gGGLRecords.find((item) => item._id === wGGLRowId);
            if (wMember) {
                await deleteGoogleImportRecord(wGGLRowId);
                removeFromSet(p2or3, wGGLRowId);
                deleteGlobalStore(p2or3, wGGLRowId);
                showMsg(
                    4,
                    0,
                    `Google member ${wMember.firstName} ${wMember.lastName} deleted`
                );
            } else {
                console.log(
                    "/page/MaintainMember btnGGLStage4Delete GGL member Not found",
                    wGGLRowId
                );
                showMsg(4, 0, `Google member not found`);
            }
        }
        gSelectRightStack.length = 0;
        $w(`#chk${p2or3}`).checked = false;
        clearSelectStack("3");
        hideStageWait("4");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnGGLStage4Delete_click try-catch error"
        );
        console.log(err);
        hideStageWait("4");
    }
}

export async function btnGGLStage4Guest_click() {
    // There is an entry in Google Import but not in Lst. This is the case for members who have left the club
    // but is added to Message Labels so they get Notifications, Needs tochange the Past status to a new Guest status.

    try {
        $w("#btnGGLStage4Guest").disable();
        //console.log("Do STge 4 guest");
        let wToday = new Date();

        showStageWait("4");
        let wUpdateStack = [];
        for (let wGGLRowId of gSelectRightStack) {
            let wGGLEntry = gGGLRecords.find((item) => item._id === wGGLRowId);
            if (wGGLEntry) {
                // find Lst record, if any
                let wFirstName = wGGLEntry.firstName;
                let wSurname = wGGLEntry.lastName;
                let wResult = await findLstMemberByFullName(
                    wFirstName,
                    wSurname
                );
                if (wResult && wResult.status) {
                    let wLstEntrys = wResult.members;
                    if (wLstEntrys.length > 1) {
                        console.log(
                            `/page/MaintainMember btnGGLStage4Guest multiple LSt records for ${wFirstName} ${wSurname}`
                        );
                        showMsg(
                            4,
                            0,
                            `Multiple entries for ${wFirstName} ${wSurname}. Correct manually`
                        );
                    } else {
                        let wLstMember = wLstEntrys[0];

                        if (wLstMember.status !== "Past") {
                            console.log(
                                `/page/MaintainMember btnGGLStage4Guest Member is a ${wLstMember.status} member, not a Past member`
                            );
                            showMsg(
                                4,
                                0,
                                `Member ${wFirstName} ${wSurname} not a Past member. Correct manually`
                            );
                        } else {
                            wLstMember.status = "Active";
                            wLstMember.type = "Guest";
                            wLstMember.dateLeft = wToday;
                            wUpdateStack.push(wLstMember);
                            removeFromSet("3", wGGLRowId);
                            updateRecordStore("2", wLstMember); // add LstMember to local gLstRecords
                        }
                    }
                } /** wResult */ else {
                    console.log(
                        `/page/MaintainMember btnGGLStage4Guest Cannot find Lst member for ${wFirstName} ${wSurname}`
                    );
                    console.log(wResult);
                    showMsg(
                        4,
                        0,
                        `MCannot find Lst for ${wFirstName} ${wSurname}. Correct manually`
                    );
                }
            } // GGLEntry
        } //for loop

        clearSelectStack("3");
        if (wUpdateStack && wUpdateStack.length > 0) {
            let wResult = await bulkSaveRecords("lstMembers", wUpdateStack);
            let wUpdateArray = wResult.results.updatedItemIds;
            let wInserts = wResult.results.inserted;
            let wUpdates = wUpdateArray.toString();
            let wErrors = wResult.results.errors.length;
            console.log(
                `/page/MaintainMember Bulk Members Save: ${wInserts} inserted, ${wUpdates} updated, ${wErrors} errors`
            );
            clearSelectStacks();
            showMsg(
                4,
                0,
                `Bulk Members Save: ${String(wUpdateArray.length)} updated, ${wErrors} errors`
            );
        } else {
            console.log(
                `/page/MaintainMember Bulk Members Save: Nothing to update`
            );
            showMsg(4, 0, "Nothing to update");
        }
        $w("#btnGGLStage4Guest").enable();
        hideStageWait("4");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnGGLStage4Guest_click try-catch error"
        );
        console.log(err);
        hideStageWait("4");
    }
}

export async function btnGGLStage4Save_click() {
    // Simply overwrite the contents of lstGoogleImport wutg gGGLRecords.

    try {
        $w("#btnGGLStage4Save").disable();
        showStageWait("4");
        //console.log("btnGGLStage4Save_click");

        //let wResult = true;
        let wResult = await uploadGlobalDataStore(
            loggedInMember._id,
            gGGLRecords
        );
        if (wResult) {
            console.log("/page/MaintainMember btnGGLStage4Save age 4 Save Ok");
        } else {
            console.log("/page/MaintainMember btnGGLStage4Save Save Fail");
        }
        $w("#btnGGLStage4Save").enable();
        hideStageWait("4");
    } catch (err) {
        console.log(
            "/page/MaintainMember btnGGLStage4Save_click try-catch error"
        );
        console.log(err);
        hideStageWait("4");
    }
}
//====== Other Member functions --------------------------------------------------------------------------------
//
export async function setAuditDate() {
    console.log("SetAUditDate");
    let [wYear, wMonth, wDay, wHour, wMin] =
        await loadStandingData("Maintain Member");

    console.log("setAuditDate2");
    console.log(wYear, wMonth, wDay, wHour, wMin);

    let wAuditYear = parseInt(wYear, 10);
    let wAuditMonth = parseInt(wMonth, 10);
    let wAuditDay = parseInt(wDay, 10);
    let wAuditHour = parseInt(wHour, 10);
    let wAuditMin = parseInt(wMin, 10);
    if (wAuditMonth < 1 || wAuditMonth > 12) {
        wAuditMonth = 9;
    }
    if (wAuditDay < 1 || wAuditDay > 31) {
        wAuditDay = 1;
    }
    if (wAuditHour < 0 || wAuditHour > 23) {
        wAuditHour = 10;
    }
    if (wAuditMin < 0 || wAuditMin > 59) {
        wAuditMin = 0;
    }
    console.log(wAuditYear, wAuditMonth, wAuditDay, wAuditHour, wAuditMin);

    let wAudit = new Date(
        wAuditYear,
        wAuditMonth - 1,
        wAuditDay,
        wAuditHour,
        wAuditMin
    );

    return wAudit;
}

export function showStageWait(pStage) {
    let wImgName = `#imgStage${pStage}Wait`;
    // @ts-ignore
    let wImg = $w(wImgName);
    wImg.show();
}

export function hideStageWait(pStage) {
    let wImgName = `#imgStage${pStage}Wait`;
    // @ts-ignore
    let wImg = $w(wImgName);
    wImg.hide();
}

export function showMsg(pStage, pNo, pMsg = "") {
    try {
        let wMsg = [
            "Records deleted",
            "There was a problem deleting this competitiong",
            "Please correct input errors shown",
            "Competition created",
            "",
        ];

        let wMsgName = `#lblStage${pStage}Msg`;
        let wImgName = `#imgStage${pStage}Wait`;
        // @ts-ignore
        let wLblMsg = $w(wMsgName);
        // @ts-ignore
        let wImg = $w(wImgName);
        if (pNo === 0) {
            wLblMsg.text = pMsg;
        } else {
            wLblMsg.text = wMsg[pNo - 1];
        }
        wLblMsg.show();
        wImg.hide();
        setTimeout(() => {
            wLblMsg.hide();
        }, 4000);
        return;
    } catch (err) {
        console.log(
            "/page/MaintainMember showMsg Try-catch fail, stage, No, err",
            pStage,
            pNo
        );
        console.log(err);
    }
}

//====== Locker Handling ========================================================================================
//
export async function doBtnLockerEditHolderAdd() {
    let member = await wixWindow.openLightbox("lbxSelectMember");
    if (member) {
        $w("#inpLockerEditHolder").value = member.fullName;
        $w("#lblLockerEditHolderId").text = member.id;
    } else {
        $w("#inpLockerEditHolder").value = "";
        $w("#lblLockerEditHolderId").text = "";
    }
}

export async function doBtnLockerEditHolderClear() {
    $w("#inpLockerEditHolder").value = "";
    $w("#lblLockerEditHolderId").text = "";
}
//====== Locker Load Data ---------------------------------------------------------------------------------------
//
export async function loadLockers() {
    try {
        showWait("Locker");
        let wLockers = [];
        let wAllMembers = getEntity("Member");
        let wActiveMembers = wAllMembers
            .filter((item) => item.username !== "ClubHouse")
            .filter((item) => item.type !== "Test")
            .filter((item) => item.status !== "Past");

        let wKey = 0;
        for (let wMember of wActiveMembers) {
            let wName = wMember.firstName + " " + wMember.surname;
            let wId = wMember._id;
            let wLocker = wMember.locker;
            if (wLocker) {
                for (let item of wLocker) {
                    if (item > 0) {
                        wKey++;
                        let wLockerObject = {
                            _id: String(wKey),
                            lockerNo: parseInt(item, 10),
                            ownerId: wId,
                            ownerName: wName,
                        };
                        wLockers.push(wLockerObject);
                    }
                }
            }
        }

        function findDuplicateIds(array) {
            const seenIds = new Set();
            const duplicates = new Set();
            const duplicateObjects = [];

            array.forEach((obj) => {
                if (seenIds.has(obj.lockerNo)) {
                    duplicates.add(obj.lockerNo); // If already seen, add to duplicates
                } else {
                    seenIds.add(obj.lockerNo); // Mark the id as seen
                }
            });

            array.forEach((obj) => {
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
            const maxId = Math.max(
                ...sparseArray.map((obj) => parseInt(obj.lockerNo, 10)),
                0
            );

            // Create a dense array with default objects
            const denseArray = Array.from(
                { length: maxId + 1 },
                (_, index) => ({
                    _id: String(index),
                    lockerNo: index,
                    ownerId: null, // Default value for ownerId
                    ownerName: null, // Default value for ownerName
                })
            );
            // Populate the dense array with values from the sparse array
            sparseArray.forEach((obj) => {
                denseArray[obj.lockerNo] = { ...obj }; // Overwrite the default object with the actual object
            });

            return denseArray;
        }

        if (wDuplicateLockers && wDuplicateLockers.length > 0) {
            $w("#lblLockerListDuplicateHdr").text =
                "The following lockers are duplicated";
            $w("#rptLockerListDuplicates").expand();
            $w("#rptLockerListDuplicates").data = wDuplicateLockers;
        } else {
            $w("#lblLockerListDuplicateHdr").text = "The are no duplicates";
            $w("#rptLockerListDuplicates").collapse();
        }

        const wAllLockers = createDenseArrayFromSparse(wLockers);

        if (wAllLockers && wAllLockers.length > 0) {
            //let wAllMembers = wResults.members;
            setEntity("Locker", [...wAllLockers]);
            resetSection("Locker");
        } else {
            console.log("/page/Maintain Member loadLockers no lockers found");
            //console.log(wResults.error);
        }
        await doLockerView("");
        resetPagination("Locker");
        hideWait("Locker");
    } catch (err) {
        console.log("/page/Maintain Member loadLockers Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
}

export function btnLockerAToMember_click() {
    $w("#secMember").expand();
    $w("#secLocker").collapse();
}

export async function btnLockerASave_click() {
    try {
        showWait("Locker");
        $w("#btnLockerASave").disable();
        //-------------------------------------VALIDATIONS-----------------------------------

        //-------------------------------------Main section----------------------------------
        const wOldHolderId = $w("#lblLockerEditOldHolderId").text;
        const wNewHolderId = $w("#lblLockerEditHolderId").text;
        const wLockerNo = parseInt($w("#txtLockerEditLocker").text, 10);
        const wLocker = getSelectedItem("Locker");
        // @ts-ignore
        let wResult = {};

        let wOldMember =
            wOldHolderId ? getTargetItem("Member", wOldHolderId) : null;
        let wNewMember =
            wNewHolderId ? getTargetItem("Member", wNewHolderId) : null;
        if (wOldHolderId === "") {
            if (wNewHolderId === "") {
                // do nothing
            } else {
                //console.log("Case 2 - update new member with this locker no");
                wResult = await addLockerToMember(
                    wNewMember,
                    wLockerNo,
                    wLocker
                );
            }
        } else {
            if (wNewHolderId === "") {
                //console.log("Case 3 - remove this locker no from old member");
                wResult = await removeLockerFromMember(
                    wOldMember,
                    wLockerNo,
                    wLocker
                );
            } else {
                //console.log("Case 4 - remove this locker no from old member + update new member with this locker no");
                wResult = await removeLockerFromMember(
                    wOldMember,
                    wLockerNo,
                    wLocker
                );
                // eslint-disable-next-line no-unused-vars
                wResult = await addLockerToMember(
                    wNewMember,
                    wLockerNo,
                    wLocker
                );
            }
        }
        //-------------------------------------Finish off-------------------------------------
        resetSection("Locker");
        $w("#btnLockerASave").enable();
        hideWait("Locker");
    } catch (err) {
        console.log(
            "/page/Maintain Member btnLockerASave_click Try-catch, err"
        );
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
}
//====== Locker Other functions ------------------------------------------------------------------------
//
async function addLockerToMember(pMember, pLockerNo, pLocker) {
    //  Update locker record
    //
    pLocker.ownerId = pMember._id;
    pLocker.ownerName = pMember.firstName + " " + pMember.surname;
    updateGlobalDataStore(pLocker, "Locker");
    updatePagination("Locker");
    resetCommands("Locker");
    //  Update member record
    //
    let wLockers = pMember.locker;
    wLockers.push(pLockerNo);
    wLockers.sort((a, b) => a - b);
    let wResult = await saveRecord("lstMembers", pMember);
    if (wResult && wResult.status) {
        updateGlobalDataStore(pMember, "Member");
        updatePagination("Member");
    }
    return {};
}

async function removeLockerFromMember(pMember, pLockerNo, pLocker) {
    //  Update locker record
    //
    pLocker.ownerId = null;
    pLocker.ownerName = null;
    updateGlobalDataStore(pLocker, "Locker");
    updatePagination("Locker");
    resetCommands("Locker");
    //  Update member record
    //
    let wLockers = pMember.locker;
    const index = wLockers.indexOf(pLockerNo);
    // eslint-disable-next-line no-unused-vars
    const x = wLockers.splice(index, 1);
    let wResult = await saveRecord("lstMembers", pMember);
    if (wResult && wResult.status) {
        updateGlobalDataStore(pMember, "Member");
        updatePagination("Member");
    }
    return {};
}

//====== Custom Processing =============================================================================================
//
let gSet = [];

function doCustom() {
    $w("#secDesktop").collapse();
    $w("#secMobile").collapse();
    $w("#secMember").collapse();
    $w("#secLocker").collapse();
    $w("#secSync").collapse();
    $w("#secCustom").expand();
}

async function processCustomOpen() {
    $w("#imgCustom").show();
    let wAllRecords = await getAllMembers();
    if (wAllRecords) {
        gSet = [...wAllRecords];
        $w("#pbrCustom").targetValue = gSet.length;
        $w("#btnCustomProcess").enable();
    } else {
        gSet = [];
        $w("#pbrCustom").targetValue = 0;
        console.log(
            "/page/MaintainMember processCustomOpen There was an error reading the collection"
        );
    }
    $w("#imgCustom").hide();
}

async function processCustomClose() {
    // copy gLstRecords into GlobalDataStore and reset pagination
    setEntity("Member", [...gLstRecords]);
    resetPagination("Member");
    console.log(
        "/pages/MaintainMember processCustomClose Member entity reset from sync"
    );
    await updateDashboard();
    $w("#secDesktop").expand();
    $w("#secMobile").collapse();
    $w("#secMember").expand();
    $w("#secLocker").collapse();
    $w("#secSync").collapse();
    $w("#secCustom").collapse();
    $w("#secMember").scrollTo();
    $w("#boxLstCompare").collapse();
}

async function processCustomGo() {
    let count = 0;
    let sum = 0;
    for (let wRec of gSet) {
        count++;
        $w("#lblItem").text = wRec.surname;
        $w("#pbrCustom").value = count;
        let res = await processRecord(wRec);
        // @ts-ignore
        if (res) {
            sum++;
        }
    }
    console.log("/page/MaintainMember processCustomGo Total = ", sum);
    //let wResult = await bulkSaveLstMember(gSet);
    let wResult = {};
    $w("#btnCustomProcess").disable();

    console.log(
        "/page/MaintainMember processCustomOpen, result, gSet",
        wResult
    );
    console.log(gSet);
}
//====== Store of custom processes used in the past --------------------------------------------------------------------
//
/**
 * Used: 28 Jan 24
 * The Live collection still had a number of records in the Wait state. This routing changes the state
 * from Wait to Past if the Dateleft field is not empty.
 * 
  
 */
// eslint-disable-next-line no-unused-vars
async function processRecordOld3(pRec) {
    if (pRec.dateLeft && pRec.status !== "Past") {
        //console.log(pRec.firstName, pRec.surname, pRec.status, pRec.dateLeft);
        pRec.status = "Past";
        return true;
    }
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
// eslint-disable-next-line no-unused-vars
async function processRecordOLd2(pRec) {
    let wDate = pRec.dateLeft;

    if (wDate == null || wDate === undefined) {
        return;
    }
    if (typeof pRec.dateLeft === "string") {
        let wNewDate = new Date(wDate);
        wNewDate.setHours(10, 0, 0);
        pRec.dateLeft = wNewDate;
    }
}

/**
 * this routine was set to update the dateleft field for those member records who had a Wait status set
 */
// eslint-disable-next-line no-unused-vars
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
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())) {
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
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())) {
                pRec.dateLeft = wDate;
            }
            break;
        case "Past":
            pRec.status = "Past";
            pRec.type = "Full";
            wDateLeft = pRec.dateLeft;
            if (!(wDateLeft instanceof Date) || isNaN(wDateLeft.valueOf())) {
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
    let wHome2 = wHome;
    let wMobile2 = wMobile;

    if (wHome === "" || wHome === null || wHome === undefined) {
        wHome = "no phone #";
        wHome2 = wHome;
    }
    if (wHome !== "no phone #") {
        //remove all spaces
        wHome2 = wHome.replace(/\s/g, "");
        if (wHome2.length === 6) {
            wHome2 = "01628" + wHome2;
        }
    }
    pRec.homePhone = wHome2;

    if (wMobile === "" || wMobile === null || wMobile === undefined) {
        wMobile = "no phone #";
        wMobile2 = wMobile;
    }
    if (wMobile !== "no phone #") {
        //remove all spaces
        wMobile2 = wMobile.replace(/\s/g, "");
        if (wMobile2.length !== 11) {
            wLong = "Wrong size";
        }
    }
    if (wMobile.startsWith("01628")) {
        // eslint-disable-next-line no-unused-vars
        wLong = "Wrong code";
    }
    pRec.mobilePhone = wMobile2;
}

/**
 * ------------------------------Array function examples --------------------------------
    // Arrays containing elements from A and B, not C
    const AandBnotC = gWixRecords.filter(a => 
        gLstRecords.some(b => b.key === a.key) && 
        !gImpRecords.some(c => c.key === a.key)
    );
    console.log("Only Wix and Lst, not Imp");
    console.log(AandBnotC);

    // Arrays containing elements from B and C, not A
    const BandCnotA = gLstRecords.filter(b => 
        gImpRecords.some(c => c.key === b.key) && 
        !gWixRecords.some(a => a.key === b.key)
    );
    console.log("Only Lst and Imp, not Wix");
    console.log(BandCnotA);

    // Arrays containing elements from A and C, not B
    const AandCnotB = gWixRecords.filter(a => 
        gImpRecords.some(c => c.key === a.key) && 
        !gLstRecords.some(b => b.key === a.key)
    );
    console.log("Only Wix and Imp, not LSt");
    console.log(AandCnotB);

    // Arrays containing elements common to A, B, and C
    const AandBandC = gWixRecords.filter(a => 
        gLstRecords.some(b => b.key === a.key) && 
        gImpRecords.some(c => c.key === a.key)
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
