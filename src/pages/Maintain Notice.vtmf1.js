/* eslint-disable no-undef */
import wixWindow from "wix-window";
import { authentication } from "wix-members";
import wixLocation from "wix-location";

import { retrieveSessionMemberDetails } from "public/objects/member";
import _ from "lodash";

import { sendMsg } from "backend/backMsg.web.js";
import { getAllNotices } from "backend/backNotices.web.js";
import { summariseText } from "backend/backNotices.web.js";
import { getAllLabels } from "backend/backNotices.web.js";
import { getLabelObjects } from "backend/backNotices.web.js";
import {
    getAllLabelMembers,
    getMemberLabelsSet,
    getLabelMembersSet,
} from "backend/backNotices.web.js";

import { isLabelUnique } from "backend/backNotices.web.js";
import { doesLabelExist } from "backend/backNotices.web.js";
import { getNoticeTableContent } from "backend/backNotices.web.js";
import { initialiseReferenceLabels } from "backend/backNotices.web.js";

import { getAllGoogleMembers }   from 'backend/backMember.jsw';
import { saveRecord } from "backend/backEvents.jsw";
import { bulkSaveRecords } from "backend/backEvents.jsw";
import { bulkDeleteRecords } from "backend/backNotices.web";
import { deleteRecord } from "backend/backEvents.jsw";
import { buildMemberCache } from "public/objects/member";
import { getMemberLocally } from "public/objects/member";
import { getFullNameLocally } from "public/objects/member";

//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity } from "public/objects/entity";
import { MODE } from "public/objects/entity";
import {
    drpChoice_change,
    btnCreate_click,
    btnUpdate_click,
    btnCancel_click,
    btnCancellation_click,
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
    getSelectStack,
} from "public/objects/entity";
import { resetPagination, updatePagination } from "public/objects/entity";
import { showError, updateGlobalDataStore } from "public/objects/entity";
import {
    getTarget,
    getTargetItem,
    configureScreen,
    getTargetDataset,
} from "public/objects/entity";
import { showWait, hideWait, getMode, setMode } from "public/objects/entity";
import { getSelectedItem } from "public/objects/entity";
import {
    showGoToButtons,
    hideGoToButtons,
    populateEdit,
} from "public/objects/entity";
import { findLabelByKey } from "backend/backNotices.web.js";
import { btnDelete_click } from "public/objects/entity";
import { deleteGlobalDataStore } from "public/objects/entity";
import { initialiseRinksArray, w_time_slots } from "public/objects/booking";
import { getAllImportMembers } from "../backend/backMember.jsw";

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E",
});

let gAction = "Entity"; // can also be Import or Export ; controls Load Repeater shape

//====== -----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = true;
const gYear = new Date().getFullYear();
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = gTest ? true : authentication.loggedIn();

$w.onReady(async function () {
    try {
        let status;

        //sgMail.setApiKey(apiKey);

        //$w('#lblHdr1').text = `The following table summarises something....${gYear} season`;
        // for testing ------	------------------------------------------------------------------------
        //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
        //let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
        let wUser = {
            _id: "612f172a-1591-4aec-a770-af673bbc207b",
            loggedIn: true,
            roles: [{ title: "Captain" }],
        }; //Sarah
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
        // eslint-disable-next-line no-unused-vars
        [status, loggedInMember, loggedInMemberRoles] =
            await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
        if (isLoggedIn) {
            let wRoles = loggedInMemberRoles.toString();
            console.log(
                "/page/MaintainNotice onReady  Roles = <" + wRoles + ">",
                loggedInMember.name,
                loggedInMember.lstId
            );
        } else {
            console.log("/page/MaintainNotice onReady Not signed in");

            showError("Notice", 28);
            setTimeout(() => {
                wixLocation.to("/");
            }, 2000);
        }

        if (wixWindow.formFactor === "Mobile") {
            $w("#strDesktop").collapse();
            $w("#strMobile").expand();
        } else {
            $w("#strMobile").collapse();
            $w("#strDesktop").expand();
            await loadNoticesDropDown();
            await populateNoticeEditDropDowns();
            $w("#drpNoticeChoiceTarget").value = "A";
            $w("#drpNoticeChoiceStatus").value = "A";
            $w("#inpNoticeListNoPerPage").value = "15";
            $w("#inpLabelListNoPerPage").value = "15";

            await buildMemberCache();
            await loadListData(); // Notice Entity list
            await loadLabelData(); // Label Entity list
            await loadNoticeEditLabel(); // dropdown in Notice Edit box
        }

        // Notice Section Notice handlers
        //$w("#strNotice").onViewportEnter((event) => strNotice_viewportEnter(event));
        $w("#btnNoticeACreate").onClick((event) => doBtnNoticeACreateClick(event));
        $w("#btnNoticeAUpdate").onClick((event) => doBtnNoticeAUpdateClick(event));
        $w("#btnNoticeADelete").onClick((event) =>
            btnDelete_click(loggedInMember.lstId, event)
        );
        $w("#btnNoticeASave").onClick((event) => btnNoticeASave_click(event));
        $w("#btnNoticeACancel").onClick((event) => btnCancel_click(event));
        $w("#btnNoticeAToLabel").onClick(() => btnNoticeAToLabel_click());
        $w("#btnNoticeACancellation").onClick((event) =>
            doBtnNoticeACancellationClick(event)
        );

        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w("#chkNoticeListSelect").onClick((event) => chkSelect_click(event));
        $w("#chkNoticeListSelectAll").onClick((event) =>
            chkSelectAll_click(event)
        );
        $w("#btnNoticeListTop").onClick((event) => btnTop_click(event));
        $w("#drpNoticeChoiceTarget").onChange((event) =>
            drpChoice_change(event)
        );
        $w("#drpNoticeChoiceStatus").onChange((event) =>
            drpChoice_change(event)
        );

        $w("#pgnNoticeList").onClick((event) => doPgnListClick(event));
        $w("#inpNoticeListNoPerPage").onChange((event) =>
            doInpListNoPerPageChange(event)
        );

        $w("#inpNoticeEditMessage").onChange((event) =>
            doInpNoticeEditMessageChange(event)
        );
        $w("#btnNoticeEditSummary").onClick(() => btnNoticeEditSummary_click());
        $w("#drpNoticeEditTargetType").onChange((event) =>
            doDrpNoticeEditTargetTypeChange(event)
        );
        $w("#btnNoticeEditPhotoAdd").onClick(() =>
            btnNoticeEditPhotoAdd_click()
        );
        $w("#btnNoticeEditPhotoClose").onClick(() =>
            btnNoticeEditPhotoClose_click()
        );
        $w("#drpNoticeEditLabel").onClick((event) =>            //does nothing, this is only part of input process
            drpNoticeEditLabel_click(event)
        );
        $w("#btnNoticeEditContentOpen").onClick(() =>           // just opens box
            btnNoticeEditContentOpen_click()
        );
        $w("#btnNoticeEditContentAdd").onClick(() =>
            btnNoticeEditContentAdd_click()
        );
        $w("#btnNoticeEditContentSubtract").onClick(() =>
            btnNoticeEditContentSubtract_click()
        );
        $w("#btnNoticeEditContentClose").onClick(() =>
            btnNoticeEditContentClose_click()
        );
        //$w('#drpNoticeEditHomeAway').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#tpkNoticeEditStartTime').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#tpkNoticeEditDuration').onChange((event) => doDrpNoticeEditRinksChange(event));
        //$w('#dpkNoticeEditStartDate').onChange((event) => doDrpNoticeEditRinksChange(event));

        // Label Section event handlers
        //
        $w("#btnLabelACreate").onClick((event) => doBtnLabelACreateClick(event));
        $w("#btnLabelAUpdate").onClick((event) => doBtnLabelAUpdateClick(event));
        $w("#btnLabelADelete").onClick((event) => doBtnLabelADeleteClick(event));
        $w("#btnLabelASave").onClick(() => btnLabelASave_click());
        $w("#btnLabelACancel").onClick((event) => doBtnLabelACancelClick(event));
        $w("#btnLabelAToNotice").onClick(() => btnLabelAToNotice_click());

        $w("#chkLabelListSelect").onClick((event) => chkSelect_click(event));
        $w("#chkLabelListSelectAll").onClick((event) =>
            chkSelectAll_click(event)
        );
        $w("#btnLabelListTop").onClick((event) => btnTop_click(event));
        //$w('#drpLabelChoice').onChange((event) => drpLabelChoiceChange(event));
        $w("#pgnLabelList").onClick((event) => doPgnListClick(event));
        $w("#inpLabelListNoPerPage").onChange((event) =>
            doInpListNoPerPageChange(event)
        );
        // Label Edit Section event handlers
        //

        $w("#inpLabelEditTitle").onChange((event) =>
            inpLabelEditTitle_change(event)
        );
        $w("#tblLabelEditContent").onRowSelect((event) =>
            btnLabelEditContent_onRowSelect(event)
        );
        $w("#btnLabelPrimeImport").onClick(() => btnLabelPrimeImport_click());
        $w("#btnLabelPrimeExport").onClick(() => btnLabelPrimeExport_click());
        $w("#btnLabelEditContentOpen").onClick(() =>
            btnLabelEditContentOpen_click()
        );
        $w("#btnLabelEditContentClose").onClick(() =>
            btnLabelEditContentClose_click()
        );
        $w("#btnLabelOtherContentAdd").onClick(() => btnLabelOtherContentAdd_click());
        $w("#btnLabelOtherContentSubtract").onClick(() =>
            btnLabelOtherContentSubtract_click()
        );

        //----------------------------Repeaters section-------------------------------------------
        $w("#rptNoticeList").onItemReady(($item, itemData, index) => {
            loadRptNoticeList($item, itemData, index);
        });

        $w("#rptLabelList").onItemReady(($item, itemData, index) => {
            loadRptLabelList($item, itemData, index);
        });
        //-------------------------- Custom Validation -----------------------------------------

        //  None
    } catch (err) {
        console.log("/page/MaintainNotice onReady Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
});

//====== Load Data -----------------------------------------------------------------------------------------------------
//
export async function loadListData() {
    try {
        let wResult = await getAllNotices(gYear);
        if (wResult && wResult.status) {
            let wNotices = wResult.notices;
            setEntity("Notice", [...wNotices]);
            $w("#strNotice").expand();
            if (wNotices && wNotices.length > 0) {
                $w("#boxNoticeChoice").expand();
                $w("#boxNoticeList").expand();
                $w("#boxNoticeNone").collapse();
                $w("#boxNoticeEdit").collapse();
                $w("#boxNoticePrime").collapse();
                await doNoticeView("");
                resetPagination("Notice");
            } else {
                $w("#boxLabelList").collapse();
                $w("#boxLabelNone").expand();
                $w("#boxLabelEdit").collapse();
                $w("#boxLabelPrime").collapse();
            }
        } else {
            console.log("/page/MaintainNotice loadListData Error return, err");
            console.log(wResult.error);
        }
    } catch (err) {
        console.log("/page/MaintainNotice loadListData Try-catch, err");
        console.log(err);
    }
}

export async function loadLabelData() {
    try {
        let wResult = await getAllLabels();
        if (wResult && wResult.status) {
            let wLabels = wResult.labels;
            setEntity("Label", [...wLabels]);
            $w("#strLabel").expand();
            if (wLabels && wLabels.length > 0) {
                //gItemsToDisplay = [...gCompetitions];
                $w("#boxLabelList").expand();
                $w("#boxLabelNone").collapse();
                $w("#boxLabelEdit").collapse();
                $w("#boxLabelPrime").expand();
                await doLabelView("");
                resetPagination("Label");
            } else {
                //gItemsToDisplay = [...gReferences];
                $w("#boxLabelList").collapse();
                $w("#boxLabelNone").expand();
                $w("#boxLabelEdit").collapse();
                $w("#boxLabelPrime").expand();
            }
        } else {
            console.log("/page/MaintainNotice loadLabelData Error return, err");
            console.log(wResult.error);
        }
    } catch (err) {
        console.log("/page/MaintainNotice loadLabelData Try-catch, err");
        console.log(err);
    }
}
//
//====== Load Repeaters -----------------------------------------------------------------------------------------------

function loadRptNoticeList($item, itemData, index) {
    let wTargetType = "A";
    let wTarget = "";
    switch (itemData.targetType) {
        case "A":
            wTargetType = "<All>";
            break;
        case "L":
            wTargetType = "L";
            wTarget = itemData.target.toString() || "";
            break;
        case "S":
            wTargetType = "S";
            if (itemData.target && itemData.target.length > 0) {
                wTarget = String(itemData.target.length);
            } else {
                wTarget = "";
            }
            break;
        default:
            wTargetType = "All";
            break;
    }

    if (index === 0) {
        $item("#lblNoticeListTargetType").text = "Type";
        $item("#lblNoticeListTarget").text = "Target";
        $item("#lblNoticeListTitle").text = "Title";
        $item("#lblNoticeListStatus").text = "Sts";
        $item("#chkNoticeListSelect").hide();
    } else {
        $item("#chkNoticeListSelect").show();
        $item("#lblNoticeListTargetType").text = wTargetType;
        $item("#lblNoticeListTarget").text = wTarget;
        $item("#lblNoticeListTitle").text = itemData.title.trim();
        $item("#lblNoticeListStatus").text = itemData.status;
        $item("#chkNoticeListSelect").checked = false;
    }
}

function loadRptLabelList($item, itemData, index) {
    if (gAction === "Entity") {
        $w('#lblLabelListGGLCount').collapse();
        $w('#lblLabelListLstCount').collapse();
        if (index === 0) {
            $item("#lblLabelListTitle").text = "Label";
            //$item("#lblLabelListPopulation").text = "No of Entries";
            $item("#chkLabelListSelect").hide();
        } else {
            $item("#chkLabelListSelect").show();
            $item("#lblLabelListTitle").text = itemData.title;
            //$item("#lblLabelListPopulation").text = String(itemData.count);
        }
    } else {
        $w('#lblLabelListGGLCount').expand();
        $w('#lblLabelListLstCount').expand();
        if (index === 0) {
            $item("#lblLabelListTitle").text = "Label";
            $item('#lblLabelListGGLCount').text = "#GGL";
            $item('#lblLabelListLstCount').text = "#Lst";
            $item("#chkLabelListSelect").hide();
        } else {
            $item("#chkLabelListSelect").show();
            $item('#lblLabelListGGLCount').text = itemData.GGLCount;
            $item('#lblLabelListLstCount').text = itemData.LstCount;
            $item("#lblLabelListTitle").text = itemData.title;
        }
    }
}

//====== Load Dropdowns----------------------------------------------------------------------------------------


async function loadNoticeEditLabel() {
    //  used in the Notice Edit box

    const wResults = await getAllLabels();
    if (wResults && wResults.status) {
        let wLabels = wResults.labels;
        let wOptions = wLabels.map((item) => {
            let wLabel = (item.description === null || item.description === "" || item.description === undefined) ? item.title :
             item.title + " " + item.description.substring(0, 30);
            return {
                label: wLabel,
                value: item.title,
            };
        });
        if (wOptions.length > 0) {
            $w("#drpNoticeEditLabel").options = wOptions;
            //$w('#drpNoticeEditLabel').setindex = 0;
        }
    }
}

export async function loadNoticesDropDown() {
    let wTargetOptions = [
        { label: "All notices", value: "A" },
        { label: "Web notices", value: "E" },
        { label: "SMS/RCS notices", value: "S" },
        { label: "WhatsApp notices", value: "W" },
    ];

    let wStatusOptions = [
        { label: "All", value: "A" },
        { label: "Open", value: "O" },
        { label: "Closed", value: "C" },
        { label: "Deleted", value: "D" },
    ];

    $w("#drpNoticeChoiceTarget").options = wTargetOptions;
    $w("#drpNoticeChoiceTarget").value = "A";

    $w("#drpNoticeChoiceStatus").options = wStatusOptions;
    $w("#drpNoticeChoiceStatus").value = "A";

    drpNoticeChoiceChange();
}

async function populateNoticeEditDropDowns() {
    let wNoticeEditOptions = [
        { label: "Club Members", value: "A" },
        { label: "Label", value: "L" },
        { label: "Select", value: "S" },
    ];

    $w("#drpNoticeEditTargetType").options = wNoticeEditOptions;
    $w("#drpNoticeEditTargetType").value = "A";
}

//====== Notice Events ================================================
//
export async function doBtnNoticeACreateClick(event) {
    btnCreate_click(event);
    await clearNoticeEdit();
}
export async function doBtnNoticeAUpdateClick(event) {
    btnUpdate_click(event);
    showError("Notice", 44);
    await populateNoticeEdit();
}

export async function btnNoticeDelete_click(pUserId, event) {
    setMode(MODE.DELETE);

    let wTarget = getTarget(event, "A");
    showWait(wTarget);
    let wItemIds = getSelectStack();

    let wDataset = getTargetDataset(wTarget);

    let wNoticesToDelete = [];

    let wResult = { status: true, savedRecord: {}, error: "" };

    for (let wId of wItemIds) {
        let wNotice = getTargetItem("Notice", wId);
        if (wNotice) {
            wNotice.status = "D";
            let wResult = await saveRecord(wDataset, wNotice);
            if (wResult && wResult.status) {
                let wSavedRecord = wResult.savedRecord;
                updateGlobalDataStore(wSavedRecord, "Notice");
            } else {
                console.log(
                    "/page/MaintainNotice btnNoticeADelete_click saveRecord failed, savedRecord, error"
                );
                console.log(wResult.error);
            }
        } else {
            console.log(
                `/page/MaintainNotice btnNoticeADelete_click couldnt find Notice [${wId}] `
            );
        }
    } // for loop

    //configureScreen(wTarget);
    updatePagination(wTarget);
    resetCommands("Notice");
    showError(wTarget, 7);
    resetSection(wTarget);
    hideWait(wTarget);
}

export async function doBtnNoticeACancellationClick(event) {
    btnCancellation_click(event);
    await populateNoticeEdit();
}

export function btnNoticeAToLabel_click() {
    $w("#secNotice").collapse();
    //$w("#secSync").collapse();
    $w("#secLabel").expand();
    //loadLabels();
}
export async function drpNoticeFilterType_change(event) {
    showWait("Notice");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    console.log("drpNoticeFilterType_change", wType);
    hideWait("Notice");
}

function doDrpNoticeEditTargetTypeChange(event) {
    let wTargetType = event.target.value;
    configureBoxes(wTargetType);
}

async function btnNoticeEditSummary_click() {
    showWait("Notice");
    $w("#btnNoticeEditSummary").disable();
    let wText = $w("#inpNoticeEditMessage").value;
    let wNoSentences = wText.length > 100 ? Math.round(wText.length / 100) : 1;
    console.log("Length =", wText.length, "Sentenaces = ", wNoSentences);
    let wResult = await summariseText(wText, wNoSentences);
    console.log(wResult);
    if (wResult && wResult.status) {
        console.log("IN mainm result");
        $w("#inpNoticeEditSummary").value = wResult.summary;
        $w("#grpNoticeEditSummary").expand();
        $w("#btnNoticeEditSummary").enable();
    } else {
        console.log("MaintainNotice btnNoticeEditSummary summarise error, err");
        console.log(wResult.error);
        $w("#inpNoticeEditSummary").value = "";
        $w("#grpNoticeEditSummary").collapse();
        $w("#btnNoticeEditSummary").enable();
    }
    hideWait("Notice");
}

function doInpNoticeEditMessageChange(event) {
    let wText = event.target.value;
    if (wText.length > 160) {
        $w("#btnNoticeEditSummary").expand();
    } else {
        $w("#btnNoticeEditSummary").collapse();
        $w("#grpNoticeEditSummary").collapse();
    }
}

function btnNoticeEditPhotoAdd_click() {
    $w("#boxNoticeEditPhoto").expand();
    $w("#btnNoticeEditPhotoAdd").collapse();
    $w("#btnNoticeEditPhotoClose").expand();
}

function btnNoticeEditPhotoClose_click() {
    $w("#boxNoticeEditPhoto").collapse();
    $w("#btnNoticeEditPhotoAdd").expand();
    $w("#btnNoticeEditPhotoClose").collapse();
}

export function doNoticeViewChange(event) {
    let wView = event.target.value;
    doNoticeView(wView);
}
export function btnNoticeAToB_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}

export async function btnNoticeASave_click() {
    try {
        showWait("Notice");
        $w("#btnNoticeASave").disable();
        //-------------------------------------VALIDATIONS-----------------------------------
        const wPublish =
            $w("#rgpNoticeEditPublish").value === "N" ? false : true;
        const wTransmit =
            $w("#rgpNoticeEditTransmit").value === "N" ? false : true;
        if (!$w("#inpNoticeEditTitle").valid) {
            showError("Notice", 22);
            hideWait("Notice");
            $w("#inpNoticeEditTitle").focus();
            return;
        }
        if (!wPublish && !wTransmit) {
            showError("Notice", 22);
            hideWait("Notice");
            $w("#rgpNoticeEditPublish").focus();
            return;
        }
        //-------------------------------------Main section----------------------------------
        let wNotice = {
            _id: "",
            title: $w("#inpNoticeEditTitle").value,
            targetType: $w("#drpNoticeEditTargetType").value,
            target: [],
            urgent: $w("#rgpNoticeEditUrgent").value,
            picture: $w("#imgNoticeEditPicture").src,
            message: $w("#inpNoticeEditMessage").value.trim(),
            summary: $w("#inpNoticeEditSummary").value.trim(),
            status: "O",
            web: $w("#rgpNoticeEditPublish").value,
            send: $w("#rgpNoticeEditTransmit").value,
        };

        let wResult = { status: true, savedRecord: {}, error: "" };
        switch (wNotice.targetType) {
            case "A":
                wNotice.target = ["ALL"];
                break;
            case "L":
                wNotice.target = [`<${$w("#drpNoticeEditLabel").value}>`];
                break;
            case "S":
                wNotice.target = formTransmitToList();
                break;
            default:
                console.log(
                    "/page/MaintainNotice btnNoticeSave invalid targetType = [" +
                        wNotice.targetType +
                        "]"
                );
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
                console.log(
                    "/page/MaintainNotice btnNoticeSave invalid mode = [" +
                        getMode() +
                        "]"
                );
        }
        //  NOTE: Everything gets written to the database as an audit trail. The Web Marker in the record determines if it is
        //        output onto the Noticeboard on the web.
        wResult = await saveRecord("lstNotices", wNotice);
        //wResult.status = true;
        if (wResult && wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) {
                case MODE.CREATE:
                    wNotice._id = wSavedRecord._id;
                    wNotice._createdDate = wSavedRecord._createdDate;
                    showError("Notice", 8);
                    break;
                case MODE.UPDATE:
                    showError("Notice", 7);
                    break;
                default:
                    console.log(
                        "/page/MaintainNotice btnNoticeASave invalid mode = [" +
                            getMode() +
                            "]"
                    );
            }
            updateGlobalDataStore(wSavedRecord, "Notice");
            updatePagination("Notice");
            resetCommands("Notice");
        } else {
            if (wResult && wResult.savedRecord) {
                console.log(
                    "/page/MaintainNotice btnNoticeASave_click saveRecord failed, savedRecord, error"
                );
                console.log(wResult.savedRecord);
                console.log(wResult.error);
            } else if (wResult) {
                console.log(
                    "/page/MaintainNotice btnNoticeASave_click saverecord failed, error"
                );
                console.log(wResult.error);
            } else {
                console.log(
                    "/page/MaintainNotice btnNoticeASave_click wResult undefined"
                );
                console.log(wResult.error);
            }
        }
        if (wTransmit && getMode() === MODE.CREATE) {
            console.log("Transmit msg 1");
            let wUrgent = $w("#rgpNoticeEditUrgent").value;

            let wParams = {
                subject: $w("#inpNoticeEditTitle").value,
                body: $w("#inpNoticeEditMessage").value,
                summary: $w("#inpNoticeEditSummary").value,
            };
            let wResult = await sendMsg(
                "U",
                wNotice.target,
                loggedInMember.name,
                wUrgent,
                "Blank_1",
                wParams
            );
            console.log("SendMsg result");
            console.log(wResult);
            //let wResult = {"status": true};
            if (wResult && wResult.status) {
                console.log(
                    "MaintainNotice btnNoticeASave_click saveRecord sendMsg OK for "
                );
            } else {
                console.log(
                    "MaintainNotice btnNoticeASave_click saverecord sendMsg failed, error"
                );
                console.log(wResult.error);
            }

            //send message
        }
        updatePagination("Notice");
        resetSection("Notice");
        $w("#btnNoticeASave").enable();
        hideWait("Notice");
        setMode(MODE.CLEAR);
    } catch (err) {
        console.log("/page/MaintainNotice btnNoticeASave_click Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
        updatePagination("Notice");
        resetSection("Notice");
        $w("#btnNoticeASave").enable();
        hideWait("Notice");
        setMode(MODE.CLEAR);
    }
}

export function btnUpload_click(event) {
    $w("#txtNoticeErrMsg").hide();
    if ($w("#uplNoticeEditPhoto").value.length > 0) {
        $w("#txtNoticeErrMsg").text = `Uploading ${
            $w("#uplNoticeEditPhoto").value[0].name
        }`;
        $w("#uplNoticeEditPhoto")
            .startUpload()
            .then((uploadedFile) => {
                $w("#txtNoticeErrMsg").text = "Upload successful";
                $w("#imgNoticeEditPicture").src = uploadedFile.url;
                $w("#btnNoticeASave").show();
            })
            .catch((uploadError) => {
                $w("#txtNoticeErrMsg").text = "File upload error";
                console.log(
                    `/page/UpdateNotice btnUpload Page Update Notice: Error: ${uploadError.errorCode}`
                );
                console.log(uploadError.errorDescription);
            });
    } else {
        $w("#txtNoticeErrMsg").text = "Please choose a file to upload.";
    }
}

export function btnClear_click(event) {
    $w("#txtNoticeErrMsg").hide();
    $w("#btnNoticeASave").show();
    $w("#imgNoticeEditPicture").src = null;
}

export async function drpNoticeChoiceChange(event) {
    showWait("Notice");
    updatePagination("Notice");
    hideWait("Notice");
}
//====== Notice Event: Content Handling section----------------------------------------------------------------
//
// Note that the following variables are also used in the Label section
let gSelectedRow = 0;
let gContentRows = [];

export async function drpNoticeEditLabel_click(event) {
    let wValue = event.target.value;
    console.log("drpNoticeEditLabel", wValue)
}

function btnNoticeEditContentOpen_click() {
    $w("#boxNoticeEditContent").expand();
}

function btnNoticeEditContentClose_click() {
    $w("#boxNoticeEditContent").collapse();
}

export function tblNoticeEditContent_onRowSelect(event) {
    gSelectedRow = event.rowIndex; // 2  console.log("Row select, id", wId);
    gContentRows = $w("#tblNoticeEditContent").rows;
}

export async function btnNoticeEditContentAdd_click() {
    let wParams = {
        seeds: "N",
        mix: "X",
        type: 1,
        noTeams: 12,
    };
    gContentRows = $w("#tblNoticeEditContent").rows;

    let wMembers = await wixWindow.openLightbox(
        "lbxSelectManyMembers",
        wParams
    );
    try {
        if (wMembers) {
            if (wMembers.length > 0) {
                for (let wMember of wMembers) {
                    let wTableEntry = {
                        _id: undefined,
                        memberId: wMember._id,
                        name: wMember.player,
                        email: wMember.contactEmail,
                    };
                    gContentRows.push(wTableEntry);
                }
                tblNoticeEditContentExpand();
                let wOrderedRows = _.orderBy(gContentRows, ["name"]);
                $w("#tblNoticeEditContent").rows = wOrderedRows;
            }
        }
    } catch (err) {
        console.log("MaintainNotice btnNoticeEditContentAdd try-catch, err");
        console.log(err);
    }
}

export async function btnNoticeEditContentSubtract_click() {
    try {
        gContentRows = $w("#tblNoticeEditContent").rows;

        let gSelectedRowData = gContentRows[gSelectedRow];
        console.log("Table length = ", gContentRows.length);
        let wId = gSelectedRowData._id;
        gContentRows.splice(gSelectedRow, 1);

        if (gContentRows.length === 0) {
            tblNoticeEditContentCollapse();
        } else {
            tblNoticeEditContentExpand();
            $w("#tblNoticeEditContent").rows = gContentRows;
        }
        gSelectedRow = 0;
    } catch (err) {
        console.log("MaintainNotice btnNoticeEditContentSubtract try-catch, err");
        console.log(err);
    }
}
export function doNoticeView(pTarget) {
    if (pTarget === "P") {
        $w("#chkNoticeListSelectAll").collapse();
        $w("#btnNoticeListTop").collapse();
        $w("#rptNoticeList").collapse();
    } else {
        $w("#chkNoticeListSelectAll").expand();
        $w("#btnNoticeListTop").expand();
        $w("#rptNoticeList").expand();
    }
}

export function strNotice_viewportEnter(event) {
    console.log("Viewport");
    console.log(event);
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
//====== Notice Supporting Functions -------------------------------------------------------------------------------------
//

function formTransmitToList() {
    let wTableData = $w("#tblNoticeEditContent").rows;
    let wList = wTableData.map((item) => {
        return (
            //      `${item.name}<${item.email}>,`
            item.memberId
        );
    });
    return wList;
}

export async function clearNoticeEdit() {
    $w("#drpNoticeEditTargetType").value = "A";
    configureBoxes("A");

    $w("#inpNoticeEditTitle").value = "";
    $w("#rgpNoticeEditUrgent").value = "N";
    $w("#rgpNoticeEditPublish").value = "Y";
    $w("#rgpNoticeEditTransmit").value = "Y";
    $w("#drpNoticeEditTargetType").value = "All";
    $w("#drpNoticeEditLabel").selectedIndex = 0;
    $w("#imgNoticeEditPicture").src = null;
    $w("#tblNoticeEditContent").rows = [];
    $w("#tblNoticeEditContent").collapse();
    $w("#lblNoticeEditNone").expand();
    $w("#grpNoticeEditSummary").collapse();
    $w("#btnNoticeEditSummary").collapse();
    $w("#btnNoticeEditContentAdd").enable();
    $w("#btnNoticeEditContentSubtract").enable();

    $w("#drpNoticeEditStatus").value = "O";
    $w("#inpNoticeEditMessage").value = "";
    $w("#inpNoticeEditSummary").value = "";
    $w("#inpNoticeEditTitle").focus();
}

function configureBoxes(pTargetType) {
    switch (pTargetType) {
        case "A":
            $w("#rgpNoticeEditPublish").disable();
            $w("#rgpNoticeEditTransmit").disable();
            $w("#boxNoticeEditLabel").collapse();
            $w("#boxNoticeEditContent").collapse();
            $w("#rgpNoticeEditPublish").value = "Y";
            $w("#rgpNoticeEditTransmit").value = "N";
            break;
        case "L":
            $w("#rgpNoticeEditPublish").disable();
            $w("#rgpNoticeEditTransmit").disable();
            $w("#boxNoticeEditLabel").expand();
            $w("#boxNoticeEditContent").collapse();
            $w("#rgpNoticeEditPublish").value = "N";
            $w("#rgpNoticeEditTransmit").value = "Y";
            break;
        case "S":
            $w("#rgpNoticeEditPublish").disable();
            $w("#rgpNoticeEditTransmit").disable();
            $w("#boxNoticeEditLabel").collapse();
            $w("#boxNoticeEditContent").expand();
            $w("#tblNoticeEditContent").collapse();
            $w("#rgpNoticeEditPublish").value = "N";
            $w("#rgpNoticeEditTransmit").value = "Y";
            break;
        default:
            $w("#rgpNoticeEditPublish").disable();
            $w("#rgpNoticeEditTransmit").disable();
            $w("#boxNoticeEditLabel").collapse();
            $w("#boxNoticeEditContent").collapse();
            $w("#rgpNoticeEditPublish").value = "Y";
            $w("#rgpNoticeEditTransmit").value = "N";
            console.log(
                "pages/MaintainNotice drpNoticeEditTargetTypeChange Invalid Target Type, ",
                pTargetType
            );
            break;
    }
}

function tblNoticeEditContentExpand() {
    $w("#tblNoticeEditContent").expand();
    //$w('#tblNoticeEditContent').rows = [];
    $w("#lblNoticeEditNone").collapse();
}

function tblNoticeEditContentCollapse() {
    $w("#tblNoticeEditContent").collapse();
    $w("#tblNoticeEditContent").rows = [];
    $w("#lblNoticeEditNone").expand();
}

export async function populateNoticeEdit() {
    let wSelectedRecord = getSelectedItem("Notice");
    configureBoxes(wSelectedRecord.targetType);

    $w("#drpNoticeEditStatus").value = wSelectedRecord.status;
    $w("#drpNoticeEditTargetType").value = wSelectedRecord.targetType;
    $w("#btnNoticeEditContentAdd").enable();
    $w("#btnNoticeEditContentSubtract").enable();

    //$w('#tblNoticeEditContent').rows = wTableData;
    await parseNoticeEditLabel(wSelectedRecord);

    let wPrecis = wSelectedRecord.summary;
    if (wPrecis && wPrecis.length > 0) {
        $w("#inpNoticeEditSummary").value = wPrecis;
        $w("#grpNoticeEditSummary").expand();
        $w("#btnNoticeEditSummary").expand();
    } else {
        $w("#inpNoticeEditSummary").value = "";
        $w("#grpNoticeEditSummary").collapse();
        $w("#btnNoticeEditSummary").collapse();
    }

    $w("#inpNoticeEditTitle").value = wSelectedRecord.title;
    $w("#rgpNoticeEditUrgent").value = wSelectedRecord.urgent;
    $w("#rgpNoticeEditPublish").value = wSelectedRecord.web;
    $w("#rgpNoticeEditTransmit").value = wSelectedRecord.send;
    $w("#inpNoticeEditMessage").value = wSelectedRecord.message;
    $w("#imgNoticeEditPicture").src = wSelectedRecord.src;

    $w("#inpNoticeEditTitle").focus();
}

async function parseNoticeEditLabel(pRec) {
    // if .type = "S", then use the list of memberIds in .target" to form list of entries in tblNticeEditSelect
    // if .type = "L", then use the <label> in .target, to form list of entries in tblNoticeEditContent, and
    //                  disable +/- buttons to prevent change
    let wTableData = [];
    let name = "";
    let email = "";
    let wTarget = pRec.target;
    let wTargetType = pRec.targetType;
    let wTargetMemberList = [];
    console.log(wTarget, wTargetType);

    if (wTarget && wTarget.length > 0) {
        if (wTargetType === "L") {
            let wLabelKey = wTarget[0].slice(1, -1);    // get contents between <  & >
            console.log("Content key = ", wLabelKey);
            $w("#drpNoticeEditLabel").value = wLabelKey;
            /**
            $w("#btnNoticeEditContentAdd").disable();
            $w("#btnNoticeEditContentSubtract").disable();
            let wResult = await getNoticeTableContent(wLabelKey);
            if (wResult && wResult.status) {
                wTargetMemberList = [...wResult.rows];
            } else {
                console.log(
                    `MaintainNotice loadNoticeEditSelectFrom error readinglabel ${wLabelKey}`
                );
            }
            */
        } else {
            wTargetMemberList = [...wTarget];
        }
        let gContentRows = [];
        if (wTargetMemberList && wTargetMemberList.length > 0) {
            for (let wMemberId of wTargetMemberList) {
                let [status, wName] = await getFullNameLocally(wMemberId);
                if (status) {
                    let wEntry = { _id: wMemberId, name: wName };
                    gContentRows.push(wEntry);
                }
            }
        }
        if (gContentRows && gContentRows.length > 0) {
            $w("#tblNoticeEditContent").rows = gContentRows;
            $w("#tblNoticeEditContent").expand();
            $w("#lblNoticeEditNone").collapse();
        } else {
            $w("#tblNoticeEditContent").rows = [];
            $w("#tblNoticeEditContent").collapse();
            $w("#lblNoticeEditNone").expand();
        }
    }
}


//====== Label Section============================================================
//
export async function doBtnLabelACreateClick(event) {
    btnCreate_click(event);
    await clearLabelEdit();
}
export async function doBtnLabelAUpdateClick(event) {
    btnUpdate_click(event);
    await populateLabelEdit();
}

export async function doBtnLabelACancelClick(event) {
    btnCancel_click(event);
    await clearContentPanel();
}

export async function doBtnLabelADeleteClick() {
    try {
        //btnDelete_click(loggedInMember._id, event);
        showWait("Label");
        const wResult1 = await initialiseReferenceLabels();
        const wReferenceList = wResult1.list;
        
        let wLabelsToDelete = []; 
        let wSelectedStack = [...getSelectStack()];
        wLabelsToDelete = wSelectedStack.filter ( item => 
            !wReferenceList.includes(item)
        )
        if (wLabelsToDelete.length !== wSelectedStack.length){
            showError("Label", 49)
        }

        let wLabelMembersToDelete = [];

        for (let wLabelId of wLabelsToDelete){
            let wResult = await getLabelMembersSet(wLabelId);
            if (wResult && wResult.status) {
                let wLabelMembers = wResult.labelMembers;
                for (let wLabelMember of wLabelMembers){
                    wLabelMembersToDelete.push (wLabelMember._id);
                }
            }
        } // for loop

        let wResult = false;

        if (wLabelMembersToDelete.length > 0){
            wResult = await bulkDeleteRecords("doBtnLabelADelete", loggedInMember.lstid, "lstLabelMember", wLabelMembersToDelete);
            if (wResult){
                console.log(`/page/MaintainNotice doBtnLabelDelete: LabelMembers deleted ${wResult}`)
            } else {
                console.log("/page/MaintainNotice doBtnLabelADeleteClick lstLabelMembers delete failed");
            }
        } else {
            console.log(`/page/MaintainNotice doBtnLabelADeleteClick No LstLabelMembers ro delete`)
        }

        if (wLabelsToDelete.length > 0) {
            wResult = await bulkDeleteRecords("doBtnLabelADelete", loggedInMember.lstId, "lstLabels", wLabelsToDelete);
            deleteGlobalDataStore(wLabelsToDelete, "Label");
            updatePagination("Label");
        } else {
            console.log("/page/MaintainNotice doBtnLabelADeleteClick No lstLabel to delete");
        }
        showError("Label", 1)
        resetSection("Label");
        hideWait("Label");
    }
    catch (err) {
        console.log("/page/MaintainNotice doBtnLabelADeleteClick try-catch, err");
        console.log(err);
    }
}

export async function inpLabelEditTitle_change(event) {
    if (getMode() !== MODE.CREATE) {
        return;
    }
    let wKey = event.target.value;
    let wTest = await isLabelUnique(wKey);
    if (getMode() === MODE.CREATE && wTest) {
        $w("#btnLabelOtherContentAdd").enable();
    } else {
        showError("Label", 43);
        $w("#inpLabelEditTitle").focus();
    }
}

export async function btnLabelASave_click() {
    try {
        showWait("Label");
        $w("#btnLabelASave").disable();
        //-------------------------------------VALIDATIONS-----------------------------------
        if (!$w("#inpLabelEditTitle").valid) {
            showError("Label", 45);
            hideWait("Label");
            $w("#inpLabelEditTitle").focus();
            return;
        }

        //FIXME  - can only enter new key if create. 
        if (getMode() === MODE.CREATE){
            if (! await isLabelUnique($w("#inpLabelEditTitle").value)) {
                showError("Label", 43);
                $w("#inpLabelEditTitle").focus();
                hideWait("Label");
                return;
            }
            console.log("btnLabelASave, passed CREATE Title unique");
        } else if (getMode() === MODE.UPDATE) {
            let wOldKey = $w("#lblLabelEditOldTitle").text;
            let wNewKey = $w("#inpLabelEditTitle").value.trim();
            if (wNewKey !== wOldKey) {
                if (await doesLabelExist(wNewKey)) {
                    showError("Label", 46);
                    $w("#inpLabelEditTitle").focus();
                    hideWait("Label");
                    return;
                }
            }
        } /** Not Create or Update */ else {
            showError("Label", 47);
            hideWait("Label");
            return
        }

        //-------------------------------------Main section----------------------------------
        console.log("btnLabelASave, main");
        let wLabel = {
            _id: "",
            title: $w("#inpLabelEditTitle").value,
            description: $w("#inpLabelEditDescription").value,
        };

        let wResult;
        wResult = { status: true, savedRecord: {}, error: "" };
        switch (getMode()) {
            case MODE.CREATE:
                wLabel._id = undefined;
                break;
            //console.log(wMember);
            case MODE.UPDATE:
                wLabel._id = getSelectStackId();
                break;
            default:
                console.log(
                    "/page/MaintainNotice btnLabelASave invalid mode = [" +
                        getMode() +
                        "]"
                );
        }
        // Save record performed in switch code blocks above;
        wResult = await saveRecord("lstLabels", wLabel);
        if (wResult && wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) {
                case MODE.CREATE:
                    wLabel._id = wSavedRecord._id;
                    wLabel._createdDate = wSavedRecord._createdDate;
                    showError("Label", 8);
                    break;
                case MODE.UPDATE:
                    showError("Label", 7);
                    break;
                default:
                    console.log(
                        "/page/MaintainNotice btnLabelASave invalid mode = [" +
                            getMode() +
                            "]"
                    );
            }
            updateGlobalDataStore(wSavedRecord, "Label");
            updatePagination("Label");
            resetCommands("Label");
        } else {
            console.log(
                "/page/MaintainNotice btnLabelASave_click saveRecord failed, savedRecord, error"
            );
            console.log(wResult.savedRecord);
            console.log(wResult.error);
        }
        resetSection("Label");
        $w("#btnLabelASave").enable();
        hideWait("Label");
        setMode(MODE.CLEAR);
    } catch (err) {
        console.log("/page/MaintainNotice btnLabelASave_click Try-catch, err");
        console.log(err);
        if (!gTest) {
            wixLocation.to("/syserror");
        }
    }
}

export async function btnLabelAToNotice_click() {
    await loadNoticeEditLabel();
    $w("#secNotice").expand();
    //$w("#secSync").collapse();
    $w("#secLabel").collapse();
}
//====== Label Event: Content Handling section----------------------------------------------------------------
//

export function btnLabelEditContent_onRowSelect(event) {
    let rowData = event.rowData; // {"fName": "John", "lName": "Doe"}
    gSelectedRow = event.rowIndex; // 2  console.log("Row select, id", wId);
    gContentRows = $w("#tblLabelEditContent").rows;
}

export async function btnLabelPrimeImport_click() {
    console.log("btnLabelPrimeImport");
    gAction = "Import";
    let wAllLabels = [];
    let wAllLabelMemberRows = [];
    
    let wResult = await getAllLabels();
    if (wResult && wResult.status){
        wAllLabels = wResult.labels;
        wResult = await getAllLabelMembers();
        if (wResult && wResult.status){
            wAllLabelMemberRows = wResult.rows;
        }
    }
    let wToDisplay = [{"_id": "ID01" , "title": "Heading", "GGLCount": "0", "LstCount": "0"}];
    for (let wLabel of wAllLabels){
        let wId = wLabel.labelId;
        let wSet = wAllLabelMemberRows.filter ( item => item.labelid === wId);
        let wCount = wSet.length || 0;
        let wEntry = {"_id": wLabel._id , "title": wLabel.title, "GGLCount": "2", "LstCount": "0"};
        wToDisplay.push(wEntry);
    }
    $w('#rptLabelList').data = [];
    $w('#rptLabelList').data = wToDisplay;
    console.log(wToDisplay);
    console.log(wAllLabels);
    console.log(wAllLabelMemberRows);

    let wALLGoogleRows = await getAllGoogleMembers();
    console.log(wALLGoogleRows);

}

export async function btnLabelPrimeExport_click() {
    console.log("btnLabelPrimeExport");
    gAction = "Export";

}

export async function btnLabelEditContentOpen_click() {
    showWait("Label");
    $w("#boxLabelEditContents").expand();
    $w("#boxLabelContent").expand();
    let wRec = getSelectedItem("Label");
    const wLabelId = wRec._id;
    let wResult = await getLabelMembersSet(wLabelId);
    if (wResult && wResult.status) {
        let wLabelMembers = wResult.labelMembers;
        if (wLabelMembers.length > 0) {
            let wMemberDetails = await getMemberDetails(wLabelMembers);
            $w("#tblLabelEditContent").rows = wMemberDetails;
            $w("#tblLabelEditContent").expand();
            $w("#lblLabelEditNone").collapse();
        } else {
            $w("#tblLabelEditContent").collapse();
            $w("#lblLabelEditNone").expand();
        }
    }
    hideWait("Label");
}

function getMemberDetails(pLabelMembers) {
    let wMemberDetails = [];
    for (let wLabelMember of pLabelMembers) {
        let wMemberId = wLabelMember.memberId;
        let wResult = getMemberLocally(wMemberId);
        if (wResult && wResult.status){
            let wMember = wResult.member;
            let wTableEntry = {"_id": wLabelMember._id, "labelId": wLabelMember.labelId, "name": wMember.firstName + " " + wMember.surname,
                 "memberId": wMemberId, "firstName": wMember.firstName, "surname": wMember.surname};
            wMemberDetails.push(wTableEntry);
        } else {
            console.log(
                `/page/MaintainNotice getMemberDetails failed for ${wMemberId}`
            );
        }
    }
    return wMemberDetails;
}

export async function btnLabelEditContentClose_click() {
    $w("#boxLabelEditContents").collapse();
    $w("#boxLabelContent").collapse();
}

export async function btnLabelOtherContentAdd_click() {
    let wParams = {
        seeds: "N",
        mix: "X",
        type: 1,
        noTeams: 12,
    };
    if ($w('#tblLabelEditContent').collapsed) {
        gContentRows = [];
    } else {
        gContentRows = $w("#tblLabelEditContent").rows;
    }
    const wKey = $w("#inpLabelEditTitle").value;
    const wLabelId = $w("#lblLabelEditLabelId").text;


    if (getMode() === MODE.CREATE && !isLabelUnique(wKey)) {
        showError("Label", 43);
        $w("#inpLabelEditTitle").focus();
        return;
    }

    let wMembers = await wixWindow.openLightbox(
        "lbxSelectManyMembers",
        wParams
    );
    try {
        if (wMembers) {
            if (wMembers.length > 0) {
                showWait("Label");
                let wContentRows = [];
                for (let wMember of wMembers) {
                    let wLabelMemberEntry = {
                        _id: undefined,
                        labelId: wLabelId,
                        memberId: wMember._id,
                    };
                    let wTableEntry = {
                        _id: undefined,
                        labelId: wLabelId,
                        memberId: wMember._id,
                        firstName: wMember.firstName,
                        surname: wMember.surname,
                        name: wMember.player
                    };
                    const wResult = await saveRecord("lstLabelMember", wLabelMemberEntry);
                    if (wResult && wResult.status) {
                        let wSavedRecord = wResult.savedRecord;
                        wTableEntry._id = wSavedRecord._id;
                        wContentRows.push(wTableEntry);
                    } else {
                        console.log("/page/MaintainNotices btnLabelOtherContentAdd save record fail");
                    }
                } //for loop
                if (wContentRows.length > 0) {
                    const wTemp = [...gContentRows, ...wContentRows];
                    const wOrderedRows = _.orderBy(wTemp, ["surname","firstName"]);
                    $w("#tblLabelEditContent").rows = wOrderedRows;
                    $w("#tblLabelEditContent").expand();
                    $w("#lblLabelEditNone").collapse();
                } else {
                    $w("#tblLabelEditContent").collapse();
                    $w("#lblLabelEditNone").expand();
                }
                hideWait("Label");
            } //members > 0
        } // members
    } catch (err) {
        console.log(
            "/page/MaintainNotice btnLabelOtherContentAdd_click try-catch, err"
        );
        console.log(err);
    }
}

export async function btnLabelOtherContentSubtract_click() {
    try {
        showWait("Label");
        gContentRows = $w("#tblLabelEditContent").rows;

        let wSelectedRow = gContentRows[gSelectedRow];
        //console.log("Table length = ", wLabelSelectTableRows.length);
        let wLabelMembersId = wSelectedRow._id;
        if (/** allow if > 1 entry */ gContentRows.length > 1) {
            gContentRows.splice(gSelectedRow, 1);

            let wResult = await deleteRecord("lstLabelMember", wLabelMembersId);
            if (wResult) {
                if (gContentRows.length === 0) {
                    $w("#tblLabelEditContent").collapse();
                    $w("#lblLabelEditNone").expand();
                } else {
                    $w("#lblLabelEditNone").collapse();
                    $w("#tblLabelEditContent").rows = gContentRows;
                }
                showError("Label",1);
                gSelectedRow = 0;
            } else {
                console.log(
                    "/page/MaintainNotice btnLabelOtherContentSubtract_click delete record failed"
                );
            }
        } else {
            showError("Label", 42);
        }
        hideWait("Label");
    } catch (err) {
        console.log("/page/MaintainNotice btnLabelOtherContentSubtract_click try-catch, err");
        console.log(err);
    }
}

function clearContentPanel(){
    $w("#boxLabelEditContents").collapse();
    $w("#boxLabelContent").collapse();
    gContentRows.length = 0;
    gSelectedRow = 0;
    hideWait("Label");
}

/**
export async function drpLabelChoiceChange(event) {
  showWait("Label");
  updatePagination("Label");
  hideWait("Label");
}
*/
export function doLabelViewChange(event) {
    let wView = event.target.value;
    doLabelView(wView);
}

//====== Label Supporting Functions ========================================================
//

async function loadLabels() {
    const wResult = await getAllLabels();
    gAction = "Entity";
    if (wResult && wResult.status) {
        const wLabels = wResult.labels;
        if (wLabels.length > 0) {
            $w("#boxLabelList").expand();
            $w("#boxLabelNone").collapse();
            $w("#rptLabelList").data = wLabels;
        } else {
            $w("#boxLabelList").collapse();
            $w("#boxLabelNone").expand();
        }
    }
}

export function doLabelView(pTarget) {
    if (pTarget === "P") {
        $w("#chkLabelListSelectAll").collapse();
        $w("#btnLabelListTop").collapse();
        $w("#rptLabelList").collapse();
    } else {
        $w("#chkLabelListSelectAll").expand();
        $w("#btnLabelListTop").expand();
        $w("#rptLabelList").expand();
    }
}

export async function clearLabelEdit() {
    $w("#inpLabelEditTitle").value = "";
    $w("#lblLabelEditLabelId").text = "";
    $w("#lblLabelEditOldTitle").text = "";
    $w("#inpLabelEditTitle").enable();
    $w("#inpLabelEditDescription").value = "";
    $w(`#tblLabelEditContent`).rows = [];
    $w("#tblLabelEditContent").collapse();
    $w("#lblLabelEditNone").expand();
    $w("#boxLabelPrime").collapse();
    $w("#inpLabelEditTitle").focus();

}

export async function populateLabelEdit() {
    let wSelectedRecord = getSelectedItem("Label");

    const wKey = wSelectedRecord.title;
    $w("#lblLabelEditLabelId").text = wSelectedRecord._id;
    $w("#lblLabelEditOldTitle").text = wKey;

    $w("#inpLabelEditTitle").value = wKey;
    $w("#inpLabelEditDescription").value = wSelectedRecord.description;

    /**
    let wResult = await getLabelObjects(wKey);
    if (wResult && wResult.status) {
        if (wResult.objects.length > 0) {
            $w("#tblLabelEditContent").rows = wResult.objects.map((item) => {
                return {
                    _id: item._id,
                    title: item.title,
                    name: item.name,
                    email: item.email || "",
                    memberId: item.memberId,
                };
            });
            $w("#tblLabelEditContent").expand();
            $w("#lblLabelEditNone").collapse();
            $w("#boxLabelPrime").expand();
            $w("#btnLabelPrimeRemove").enable();
        } else {
            $w("#tblLabelEditContent").collapse();
            $w("#lblLabelEditNone").expand();
        }
    } else {
        $w("#tblLabelEditContent").collapse();
        $w("#lblLabelEditNone").expand();
    }
  */
}

function updateLabelList(pDelta) {
    let wLabel = {
        _id: "",
        title: "",
        count: 0,
    };
    try {
        if (getMode() === MODE.CREATE) {
            const wKey = $w("#inpLabelEditTitle").value;
            const wKeyNoSpaces = wKey.replace(/\s/g, "");
            wLabel._id = wKeyNoSpaces;
            wLabel.title = wKey;
            wLabel.count = pDelta;
            $w("#tblLabelEditContent").rows = wLabelSelectTableRows;
            $w("#tblLabelEditContent").expand();
            $w("#lblLabelEditNone").collapse();
        } else {
            let wRec = getSelectedItem("Label");
            wLabel._id = wRec._id;
            wLabel.title = wRec.title;
            wLabel.count = wRec.count + pDelta;
        }
        updateGlobalDataStore(wLabel, "Label");
        updatePagination("Label");
    } catch (err) {
        console.log("MaintainNotice btnLabelPrimeRemove try-catch, err");
        console.log(err);
    }
}
