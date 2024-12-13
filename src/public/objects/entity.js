/* eslint-disable no-undef */
/**
 * These are generic routines that are shared across all entities.
 *
 */
import _ from "lodash";
import { MAINTAINED } from "./clubComp";
import { COMPETITOR_TYPE } from "./clubComp";
import { getEventBookings } from "backend/backEvents.jsw";
import { bulkDeleteRecords } from "backend/backEvents.jsw";
import { saveRecord } from "backend/backEvents.jsw";
import { validateTeamLeagueDropdowns } from "backend/backTeam.jsw";
import { deleteWixMembers } from "backend/backMember.jsw";
import { findMTBCMember } from "backend/backMember.jsw";
import { findLstMember } from "backend/backMember.jsw";

export const MODE = Object.freeze({
    CREATE: "C",
    UPDATE: "U",
    DELETE: "D",
    PRIME: "P",
    CLEAR: "",
    MOVE: "M",
    CONVERT: "Z",
    CANCELLATION: "X",
});
/**
const COMPETITION_TYPE = Object.freeze({
	COMPETITION:	"C",
	REFERENCE:		"R"
});
*/

// GLOBAL STORE ARRAYS
let gLiveComps = [];
let gRefComps = [];
let gMembers = [];
let gLockers = [];
let gEvents = [];
let gOpponents = [];
let gFixtures = [];
let gRefEvents = [];
let gCanEvents = [];
let gTeams = [];
let gOfficers = [];
let gBookings = [];
let gStandingDatas = [];
let gNotices = [];
let gLeagues = [];
let gLabels = [];

let gSelectStack = [];

let gEntityFirstRow = {
    _id: "hdr",
    title: "Header",
    maintainedBy: MAINTAINED.AUTO,
};

let gMembersFirstRow = {
    _id: "hdr",
    firstName: "First Name ",
    surname: "Surname",
    mobilePhone: "Mobile",
    email: "Email",
    locker: "Locker",
};

export let gMode = "";

export function setEntity(pTarget, pRec) {
    //console.log("setEntity", pTarget);
    switch (pTarget) {
        case "Notice":
            gNotices = pRec;
            break;
        case "Label":
            gLabels = pRec;
            break;
        case "StandingData":
            gStandingDatas = pRec;
            break;
        case "League":
            gLeagues = pRec;
            break;
        case "Booking":
            gBookings = pRec;
            break;
        case "Officer":
            gOfficers = pRec;
            break;
        case "Team":
            gTeams = pRec;
            break;
        case "RefComp":
            gRefComps = pRec;
            break;
        case "LiveComp":
            gLiveComps = pRec;
            break;
        case "Member":
            gMembers = pRec;
            break;
        case "Locker":
            gLockers = pRec;
            break;
        case "Event":
            gEvents = pRec;
            break;
        case "Opponent":
            gOpponents = pRec;
            break;
        case "Fixture":
            gFixtures = pRec;
            break;
        case "RefEvent":
            gRefEvents = pRec;
            break;
        case "CanEvent":
            gCanEvents = pRec;
            break;
        default:
            console.log(
                "/public/objects/entity setEntity, invalide target, target"
            );
            console.log(pTarget);
            break;
    }
    //console.log("Set entity ", pTarget, " No recs = ", pRec.length);
    //console.log(gOpponents);
}

export function getEntity(pTarget) {
    let wRec = [];
    switch (pTarget) {
        case "Notice":
            wRec = gNotices;
            break;
        case "Label":
            wRec = gLabels;
            break;
        case "StandingData":
            wRec = gStandingDatas;
            break;
        case "League":
            wRec = gLeagues;
            break;
        case "Booking":
            wRec = gBookings;
            break;
        case "Officer":
            wRec = gOfficers;
            break;
        case "Team":
            wRec = gTeams;
            break;
        case "RefComp":
            wRec = gRefComps;
            break;
        case "LiveComp":
            wRec = gLiveComps;
            break;
        case "Member":
            wRec = gMembers;
            break;
        case "Locker":
            wRec = gLockers;
            break;
        case "Event":
            wRec = gEvents;
            break;
        case "Opponent":
            wRec = gOpponents;
            break;
        case "Fixture":
            wRec = gFixtures;
            break;
        case "RefEvent":
            wRec = gRefEvents;
            break;
        case "CanEvent":
            wRec = gCanEvents;
            break;
        default:
            console.log(
                "/public/objects/entity setEntity, invalide target, target"
            );
            console.log(pTarget);
            break;
    }
    return wRec;
}

export function alreadyExists(pLoginEmail) {
    let wRec = gMembers.filter((item) => item.loginEmail === pLoginEmail);
    if (wRec.length > 0) {
        return true;
    }
    return false;
}

/**
 *
 * @param {string} pMode
 */
export function setMode(pMode) {
    gMode = pMode;
}
/**
 *
 * @returns {string} gMode
 */
export function getMode() {
    return gMode;
}
export function gFL() {
    return gFixtures.length;
}

export function getSelectStackId() {
    let wId = gSelectStack[0];
    return String(wId);
}

export function getSelectStackLength() {
    return gSelectStack.length;
}

export function getSelectStack() {
    return gSelectStack;
}

export function btnTop_click(event) {
    let wTarget = getTarget(event, "List");
    $w(`#box${wTarget}List`).scrollTo();
}

export async function drpChoice_change(event) {
    let wTarget = getTarget(event, "Choice");
    showWait(wTarget);
    updatePagination(wTarget);
    hideWait(wTarget);
}

export function btnCreate_click(event) {
    gMode = MODE.CREATE;
    let wTarget = getTarget(event, "A");

    if ($w(`#box${wTarget}Choice`).rendered) {
        $w(`#box${wTarget}Choice`).collapse();
    }
    $w(`#box${wTarget}List`).collapse();
    $w(`#box${wTarget}None`).collapse();
    $w(`#box${wTarget}Edit`).expand();
    $w(`#box${wTarget}Prime`).collapse();

    $w(`#btn${wTarget}ACreate`).hide();
    $w(`#btn${wTarget}AUpdate`).hide();
    $w(`#btn${wTarget}ADelete`).hide();
    $w(`#btn${wTarget}ASave`).show();
    $w(`#btn${wTarget}ACancel`).show();

    hideGoToButtons(wTarget);
    if (
        wTarget === "Member" ||
        wTarget === "LiveComp" ||
        wTarget === "RefComp"
    ) {
        clearEditBox(wTarget);
    }
    $w(`#box${wTarget}Edit`).scrollTo();
    return wTarget;
}

export function btnUpdate_click(event) {
    gMode = MODE.UPDATE;

    let wTarget = getTarget(event, "A");

    if ($w(`#box${wTarget}Choice`).rendered) {
        $w(`#box${wTarget}Choice`).collapse();
    }
    $w(`#box${wTarget}List`).collapse();
    $w(`#box${wTarget}Edit`).expand();
    if (wTarget !== "Member") {
        $w(`#box${wTarget}Prime`).collapse();
    }
    $w(`#btn${wTarget}ACreate`).hide();
    $w(`#btn${wTarget}AUpdate`).hide();
    $w(`#btn${wTarget}ADelete`).hide();
    $w(`#btn${wTarget}ASave`).show();
    $w(`#btn${wTarget}ACancel`).show();

    hideGoToButtons(wTarget);

    // For Events use the page level PopulateEdit function
    if (wTarget === "RefComp") {
        populateEdit(wTarget);
    }

    return wTarget;
}

export function btnCancellation_click(event) {
    gMode = MODE.CANCELLATION;

    let wTarget = getTarget(event, "A");

    $w(`#box${wTarget}List`).collapse();
    $w(`#box${wTarget}Edit`).expand();
    $w(`#box${wTarget}Prime`).collapse();

    $w(`#btn${wTarget}ACreate`).hide();
    $w(`#btn${wTarget}AUpdate`).hide();
    $w(`#btn${wTarget}ADelete`).hide();
    $w(`#btn${wTarget}ASave`).show();
    $w(`#btn${wTarget}ACancel`).show();

    hideGoToButtons(wTarget);

    // For Events use the page level PopulateEdit function
    if (
        wTarget === "Member" ||
        wTarget === "LiveComp" ||
        wTarget === "RefComp"
    ) {
        populateEdit(wTarget);
    }
    return wTarget;
}

export async function btnDelete_click(pUserId, event) {
    gMode = MODE.DELETE;

    let wTarget = getTarget(event, "A");
    showWait(wTarget);
    let wItemIds = [...gSelectStack];

    let wDataset = getTargetDataset(wTarget);

    let wBookingsToDelete = [];
    let wWixMembersToDelete = [];
    let wMTBCMembersToDelete = [];

    if (wTarget === "Event") {
        // Now get list of associated bookings
        wBookingsToDelete = [];
        for (let wId of wItemIds) {
            let wResult = await getEventBookings(wId);
            if (wResult.status) {
                let wBookings = wResult.bookings;
                if (wBookings && wBookings.length > 0) {
                    let wBookngIds = wBookings.map((item) => item._id);
                    wBookingsToDelete = wBookingsToDelete.concat(wBookngIds);
                }
            } else {
                console.log(
                    `public/objects/entity btnDelete_click by ${pUserId} error return from getEventBookings, err`
                );
                console.log(wResult.error);
                return false;
            }
        }
    }
    if (wTarget === "Member") {
        wWixMembersToDelete = [];
        wMTBCMembersToDelete = [];
        for (let wId of wItemIds) {
            let wResult = await findLstMember(wId);
            if (wResult.status) {
                let wWixMemberToDelete = wResult.member;
                if (
                    wWixMemberToDelete &&
                    wWixMemberToDelete.wixId &&
                    wWixMemberToDelete.wixId.length > 1
                ) {
                    wWixMembersToDelete.push(wWixMemberToDelete.wixId);
                }
            } else {
                console.log(
                    `public/objects/entity btnDelete_click by ${pUserId} error return from findLstMember, err`
                );
                console.log(wResult.error);
            }
            wResult = await findMTBCMember(wId);
            if (wResult.status) {
                let wMTBCMemberToDelete = wResult.member;
                if (wMTBCMemberToDelete) {
                    wMTBCMembersToDelete.push(wMTBCMemberToDelete._id);
                }
            } else {
                console.log(
                    `public/objects/entity btnDelete_click by ${pUserId} error return from getMTBC, err`
                );
                console.log(wResult.error);
            }
        }
    }
    let res = await bulkDeleteRecords(
        "/public/objects/entity btnDelete_click",
        pUserId,
        wDataset,
        true,
        wItemIds
    );
    //let res = true;
    if (res) {
        // Now update the iternal datastore e.g. gRefereferemces
        deleteGlobalDataStore(wItemIds, wTarget);
        if (wBookingsToDelete && wBookingsToDelete.length > 0) {
            let res = await bulkDeleteRecords(
                "MaintainEvent/deleteExistingBookings",
                pUserId,
                "lstBookings",
                true,
                wBookingsToDelete
            );
            if (res) {
                console.log(
                    `/public/objects/entity btnDelete by ${pUserId} deleted ${wBookingsToDelete.length} bookings `
                );
            } else {
                console.log(
                    "/public/objects/entity btnDelete by ${pUserId} error from backend bulkDeleteRecords, res"
                );
                console.log(res);
            }
        }
        if (wWixMembersToDelete && wWixMembersToDelete.length > 0) {
            let res = await deleteWixMembers(wWixMembersToDelete);
            if (res) {
                console.log(
                    `/public/objects/entity btnDelete by ${pUserId} deleted ${wWixMembersToDelete.length} Wix Members deleted `
                );
            } else {
                console.log(
                    `/public/objects/entity btnDelete by ${pUserId} error from backend deleteWixMembers, res`
                );
                console.log(res);
            }
        }
        if (wMTBCMembersToDelete && wMTBCMembersToDelete.length > 0) {
            let res = await bulkDeleteRecords(
                "public/objects/entity btnDelete_click",
                pUserId,
                "lstMTBC",
                true,
                wMTBCMembersToDelete
            );
            if (res) {
                console.log(
                    `/public/objects/entity btnDelete by ${pUserId} deleted ${wMTBCMembersToDelete.length} MTBC Members deleted `
                );
            } else {
                console.log(
                    `/public/objects/entity btnDelete by ${pUserId} error from backend deleteMTBCMembers, res`
                );
                console.log(res);
            }
        }
        //configureScreen(wTarget);
        updatePagination(wTarget);
        showError(wTarget, 1);
    } else {
        console.log(
            `/public/objects/entity btnDelete by ${pUserId} error from backend dulkDeleteRecords, res `
        );
        console.log(res);
    }

    resetSection(wTarget);
    hideWait(wTarget);
    return true;
}

export function btnCancel_click(event) {
    //console.log(" btnCancel_click");
    gMode = MODE.CLEAR;
    let wTarget = getTarget(event, "A");
    resetSection(wTarget);
    hideWait(wTarget);
    return wTarget;
}

export function doInpListNoPerPageChange(event) {
    let wTarget = getTarget(event, "List");
    resetPagination(wTarget);
}

export function doPgnListClick(event) {
    let wTarget = getTarget(event, "List");
    doPgnClick(wTarget);
}

export function doPgnClick(pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget);
    let wItemsPerPage = parseInt($w(`#inp${pTarget}ListNoPerPage`).value, 10);
    let start_position =
        ($w(`#pgn${pTarget}List`).currentPage - 1) * wItemsPerPage;
    let end_position = start_position + wItemsPerPage;
    let wItemsToDisplay = wDataToDisplay.slice(start_position, end_position);
    wItemsToDisplay.unshift(wFirstLine);

    for (let wControl of wControls) {
        $w(wControl).data = [];
        $w(wControl).data = wItemsToDisplay;
    }
}

export function chkSelectAll_click(event) {
    let wTarget = getTarget(event, "List");
    doChkSelectAll(wTarget);
}

export function doChkSelectAll(pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget); //
    let wchkTargetAll = `#chk${pTarget}ListSelectAll`;
    let wchkTarget = `#chk${pTarget}ListSelect`;
    $w(wchkTarget).checked = $w(wchkTargetAll).checked;
    if ($w(wchkTargetAll).checked) {
        gSelectStack = wDataToDisplay.map((item) => item._id);
        $w(`#lbl${pTarget}ListCounter`).text = String(gSelectStack.length);
        setEntitySelected(wDataToDisplay, true);
    } else {
        $w(`#lbl${pTarget}ListCounter`).text = "0";
        gSelectStack.length = 0;
        setEntitySelected(wDataToDisplay, false);
    }
    configureScreen(pTarget);
}
/**
 * Normally, the Save function is defied in the client page, but here we have one that is shared between
 * 2 entities.
 */
export async function doEntityASaveClick(pTarget) {
    try {
        showWait(pTarget);
        //console.log("doEntitiy save, target", pTarget);

        let wEntity = {
            _id: "",
            startDate: null,
            subject: $w(`#inp${pTarget}EditSubject`).value,
            rinks: String($w(`#inp${pTarget}EditRinks`).value) || "0",
            homeAway: $w(`#drp${pTarget}EditHomeAway`).value || "H",
            startTime: "",
            duration: 0,
            eventType: $w(`#drp${pTarget}EditEventType`).value,
            useType: $w(`#rgp${pTarget}EditUseType`).value || "X",
            gameType: $w(`#rgp${pTarget}EditGameType`).value || "X",
            dress: $w(`#rgp${pTarget}EditDress`).value || "N",
            league: $w(`#drp${pTarget}EditLeague`).value,
            team: $w(`#drp${pTarget}EditTeam`).value,
            eventId: null,
            mix: $w(`#rgp${pTarget}EditMix`).value,
            uploadStatus: $w(`#drp${pTarget}EditUploadStatus`).value,
            requiredYear:
                parseInt($w(`#inp${pTarget}EditRequiredYear`).value, 10) ||
                null,
            requiredJDate:
                parseInt($w(`#inp${pTarget}EditRequiredJDate`).value, 10) ||
                null,
            calKey: null,
            status: "N",
            summary: null,
        };

        //----------------------Validations-----------------------
        let wResult;
        if (pTarget === "Event") {
            if ($w(`#dpk${pTarget}EditStartDate`).valid === false) {
                showError(pTarget, 15);
                $w(`#dpk${pTarget}EditStartDate`).focus();
                hideWait(pTarget);
                return;
            }
        }
        // validate league and team are in sync
        let wTeam = $w(`#drp${pTarget}EditTeam`).value;
        let wLeague = $w(`#drp${pTarget}EditLeague`).value;

        wResult = await validateTeamLeagueDropdowns(wTeam, wLeague);
        if (wResult.status) {
            if (!wResult.valid) {
                showError(pTarget, 14);
                $w(`#drp${pTarget}EditTeam`).focus();
                $w(`#btn${pTarget}ASave`).enable();
                hideWait(pTarget);
                return;
            } else {
                switch (wResult.case) {
                    case 1:
                    case 4:
                        //drop throuh
                        break;
                    case 2:
                        //console.log("case 2showvalue = ", wResult.showValue);
                        showError(pTarget, wResult.showValue);
                        $w(`#drp${pTarget}EditTeam`).value = wResult.teamKey;
                        break;
                    case 3:
                        //console.log("case 3 showvalue = ", wResult.showValue);
                        showError("CanEvent", wResult.showValue);
                        $w(`#drp${pTarget}EditLeague`).value =
                            wResult.leagueKey;
                        break;
                }
            }
        } else {
            showError(pTarget, 14);
            $w(`#drp${pTarget}EditTeam`).focus();
            $w(`#btn${pTarget}ASave`).enable();
            hideWait(pTarget);
            return;
        }
        //----------------------Main code --------------------------

        let wDuration = parseFloat($w(`#inp${pTarget}EditDuration`).value) || 0;
        wEntity.duration = wDuration;

        let wTime = $w(`#tpk${pTarget}EditStartTime`).value;
        let wHours = parseInt(wTime.split(":")[0], 10) || null;
        let wMins = parseInt(wTime.split(":")[1], 10) || null;
        let wDate = $w(`#dpk${pTarget}EditStartDate`).value;
        if (wDate && wDate.getMonth()) {
            let wStartDateTime = new Date(
                wDate.getFullYear(),
                wDate.getMonth(),
                wDate.getDate(),
                wHours,
                wMins
            );
            if (wHours) {
                wStartDateTime.setHours(wHours, wMins, 0);
            } else {
                wStartDateTime.setHours(10, 0, 0);
            }
            wEntity.startDate = wStartDateTime;
            wEntity.requiredYear = wStartDateTime.getFullYear();
            wEntity.requiredJDate = DateToOrdinal(wStartDateTime);
        }
        wEntity.startTime = wTime.substring(0, 5);
        switch (getMode()) {
            case MODE.CREATE:
                wEntity._id = undefined;
                wEntity.eventId = "";
                break;
            case MODE.UPDATE:
                wEntity._id = getSelectStackId();
                wEntity.eventId = getSelectStackId();
                break;
            default:
                console.log(
                    `client Maintain ${pTarget} btn${pTarget}Save invalid mode = [` +
                        getMode() +
                        `]`
                );
        }
        let wDataset =
            pTarget === "CanEvent" ? "lstCandidateEvent" : "lstEvents";
        //console.log(wEntity);
        wResult = await saveRecord(wDataset, wEntity);
        //let res = false;
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) {
                case MODE.CREATE:
                    wEntity._id = wSavedRecord._id;
                    showError(pTarget, 8);
                    break;
                case MODE.UPDATE:
                    showError(pTarget, 7);
                    break;
                default:
                    console.log(
                        `client Maintain ${pTarget} btn${pTarget}ASave invalid mode = [` +
                            getMode() +
                            "]"
                    );
            }
            updateGlobalDataStore(wSavedRecord, pTarget);
            updatePagination(pTarget);
            resetCommands(pTarget);
        } else {
            if (wResult.savedRecord) {
                console.log(
                    `Maintain${pTarget}Event btnSave saveRecord failed, savedRecord`
                );
                console.log(wResult.savedRecord);
            } else {
                console.log(
                    `Maintain${pTarget}Event btnSave saverecord failed, error`
                );
                console.log(wResult.error);
            }
        }
        resetSection(pTarget);
        $w(`#btn${pTarget}ASave`).enable();
        hideWait(pTarget);
        setMode(MODE.CLEAR);
        return true;
    } catch (err) {
        $w("#btnCanEventAPrime").enable();
        hideWait("CanEvent");
        setMode(MODE.CLEAR);
        console.log("/public/objects/entity doEntityASaveClick Try-catch, err");
        console.log(err);
        return false;
    }
}

function setEntitySelected(pData, pState) {
    for (let wItem of pData) {
        wItem.selected = pState;
    }
}

export function chkSelect_click(event) {
    //console.log(" chkSelect_click");

    // @ts-ignore
    let wControl = $w.at(event.context);
    let wId = event.context.itemId;
    let wTarget = getTarget(event, "List");
    let wItem = getTargetItem(wTarget, wId);
    if (wControl(`#chk${wTarget}ListSelect`).checked) {
        pushToSelectStack(wItem, wId);
    } else {
        pullFromSelectStack(wItem, wId);
    }
    $w(`#lbl${wTarget}ListCounter`).text = String(gSelectStack.length);

    //console.log("Select, select stack, RefEvents");
    //console.log(gSelectStack);
    //console.log(gRefEvents);
    configureScreen(wTarget);
}

// =================================================Common Supporting Functions =================================================
/**
 * Summary:	Resets pagination for a specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which pagination needs to be reset.
 * @returns {void}
 */
export function resetPagination(pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget);

    let wControlName = `#inp${pTarget}ListNoPerPage`;
    let wPerPage = $w(wControlName).value;

    let wItemsPerPage = parseInt(wPerPage, 10);
    let total_pages = 1;
    if (wDataToDisplay.length >= wItemsPerPage) {
        total_pages = Math.ceil(wDataToDisplay.length / wItemsPerPage);
    }
    $w(`#pgn${pTarget}List`).totalPages = total_pages;
    $w(`#lbl${pTarget}ListTotal`).text = String(wDataToDisplay.length);
    let start_position = 0; //
    let end_position = start_position + wItemsPerPage; //
    $w(`#pgn${pTarget}List`).currentPage = 1;
    $w(`#lbl${pTarget}ListCounter`).text = "0";
    let wItemsToDisplay = wDataToDisplay.slice(start_position, end_position);
    wItemsToDisplay.unshift(wFirstLine);
    for (let wControl of wControls) {
        $w(wControl).data = [];
        $w(wControl).data = wItemsToDisplay;
    }
}
/**
 * Summary:	Updates pagination for a specified target based on the current page.
 *
 * @param {string} pTarget - The target identifier for which pagination needs to be updated.
 * @returns {void}
 */
export function updatePagination(pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget); //
    let wItemsPerPage = parseInt($w(`#inp${pTarget}ListNoPerPage`).value, 10); //
    let total_pages = 1;
    if (wDataToDisplay.length >= wItemsPerPage) {
        total_pages = Math.ceil(wDataToDisplay.length / wItemsPerPage);
    }
    $w(`#pgn${pTarget}List`).totalPages = total_pages;
    $w(`#lbl${pTarget}ListTotal`).text = String(wDataToDisplay.length);
    let start_position =
        ($w(`#pgn${pTarget}List`).currentPage - 1) * wItemsPerPage;
    let end_position = start_position + wItemsPerPage; //
    //$w(`#lbl${pTarget}ListCounter`).text = "0";
    let wItemsToDisplay = wDataToDisplay.slice(start_position, end_position); //
    wItemsToDisplay.unshift(wFirstLine);
    for (let wControl of wControls) {
        $w(wControl).data = [];
        $w(wControl).data = wItemsToDisplay;
    }
}
/**
 * Summary:	Resets pagination parameters based on the specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which pagination parameters need to be reset.
 * @returns {[any[], any[], object, string[], string[], string[] ]} - An array containing pagination parameters:
 *   - wGlobalData: An array representing the data in global storage array to be updated.
 *   - wDataTODisplay: An array representing the data to be paginated.
 *   - wFirstLine: An object representing the first line of data.
 *   - wControls: An array of strings representing the control identifiers.
 *   - wSort: An array representing the sorting criteria.
 *   - wOrder: An array representing the ordering criteria.
 */
export function resetPaginationParameters(pTarget) {
    let wGlobalData = [];
    let wDataToDisplay = [];

    let [wFirstLine, wSort, wOrder] = getTargetParameters(pTarget);
    let wControls = [];
    switch (pTarget) {
        case "Notice":
            wGlobalData = gNotices;
            wDataToDisplay = filterByListChoice("Notice");
            //wDataToDisplay =  [...gStandingDatas];
            wControls = ["#rptNoticeList"];
            break;
        case "Label":
            wGlobalData = gLabels;
            wDataToDisplay = [...gLabels];
            wControls = ["#rptLabelList"];
            break;
        case "StandingData":
            wGlobalData = gStandingDatas;
            wDataToDisplay = filterByListChoice("StandingData");
            //wDataToDisplay =  [...gStandingDatas];
            wControls = ["#rptStandingDataList"];
            break;
        case "League":
            wGlobalData = gLeagues;
            wDataToDisplay = filterByListChoice("League");
            //wDataToDisplay =  [...gLeagues];
            wControls = ["#rptLeagueList"];
            break;
        case "Booking":
            wGlobalData = gBookings;
            wDataToDisplay = filterByListChoice("Booking");
            //wDataToDisplay =  [...gBookings];
            wControls = ["#rptBookingList"];
            break;
        case "Officer":
            wGlobalData = gOfficers;
            wDataToDisplay = filterByListChoice("Officer");
            wControls = ["#rptOfficerList"];
            break;
        case "Team":
            wGlobalData = gTeams;
            wDataToDisplay = filterByListChoice("Team");
            wControls = ["#rptTeamList"];
            break;
        case "Member":
            wGlobalData = gMembers;
            wDataToDisplay = filterByListChoice("Member");
            wControls = ["#rptMemberList"];
            break;
        case "Locker":
            wGlobalData = gLockers;
            wDataToDisplay = filterByListChoice("Locker");
            wControls = ["#rptLockerList"];
            break;
        case "RefComp":
            wGlobalData = gRefComps;
            wDataToDisplay = [...gRefComps];
            wControls = ["#rptRefCompList", "#rptRefCompListPrime"];
            break;
        case "LiveComp":
            wGlobalData = gLiveComps;
            wDataToDisplay = [...gLiveComps];
            wControls = ["#rptLiveCompList"];
            break;
        case "Event":
            wGlobalData = gEvents;
            wDataToDisplay = filterByListChoice("Event");
            wControls = ["#rptEventList"];
            break;
        case "Opponent":
            wGlobalData = gOpponents;
            wDataToDisplay = filterByListChoice("Opponent");
            wControls = ["#rptOpponentList"];
            break;
        case "Fixture":
            wGlobalData = gFixtures;
            wDataToDisplay = filterByListChoice("Fixture");
            wControls = ["#rptFixtureList"];
            break;
        case "RefEvent":
            wGlobalData = gRefEvents;
            wDataToDisplay = [...gRefEvents];
            wControls = ["#rptRefEventList"];
            break;
        case "CanEvent":
            wGlobalData = gCanEvents;
            wDataToDisplay = filterByListChoice("CanEvent");
            wControls = ["#rptCanEventList"];
            break;
        default:
            console.log(
                "public/objects/entity resetPaginationParameter 1 invalid switch target [" +
                    pTarget +
                    "]"
            );
            wGlobalData = [];
            wDataToDisplay = [];
            break;
    }

    return [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder];
}

export function getTargetDataset(pTarget) {
    let wDataset = "";
    switch (pTarget) {
        case "Notice":
            wDataset = `lstNotices`;
            break;
        case "Label":
            wDataset = `lstLabels`;
            break;
        case "StandingData":
            wDataset = `lstSettings`;
            break;
        case "League":
            wDataset = `lstLeagues`;
            break;
        case "Booking":
            wDataset = `lstBookings`;
            break;
        case "Officer":
            wDataset = `lstOfficers`;
            break;
        case "Team":
            wDataset = `lstTeams`;
            break;
        case "Locker":
        case "Member":
            wDataset = `lstMembers`;
            break;
        case "RefComp":
            wDataset = `lstClubComp`;
            break;
        case "LiveComp":
            wDataset = `lstClubComp`;
            break;
        case "Event":
            wDataset = `lstEvents`;
            break;
        case "Opponent":
            wDataset = `lstLeagueOpponents`;
            break;
        case "Fixture":
            wDataset = `lstKennetImport`;
            break;
        case "RefEvent":
            wDataset = `lstReferenceEvent`;
            break;
        case "CanEvent":
            wDataset = `lstCandidateEvent`;
            break;
        default:
            console.log(
                "public/objects/entity getTargetDataset invalid switch target [" +
                    pTarget +
                    "]"
            );
            wDataset = "";
            break;
    }
    return wDataset;
}

/**
 * Summary:	Gets pagination parameters based on the specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which pagination parameters need to be reset.
 * @returns {[object, string[],string[] ]} - An array containing pagination parameters:
 *   - wFirstLine: An object representing the first line of data.
 *   - wSort: An array representing the sorting criteria.
 *   - wOrder: An array representing the order criteria.
 */
export function getTargetParameters(pTarget) {
    let wSort = [];
    let wOrder = null;
    let wFirstLine = {};

    wFirstLine = gEntityFirstRow;
    switch (pTarget) {
        case "Notice":
            wSort = ["_createdDate"];
            wOrder = ["desc"];
            break;
        case "Label":
            wSort = ["_title"];
            wOrder = ["desc"];
            break;
        case "StandingData":
            wSort = ["refKey"];
            break;
        case "League":
            wSort = ["gender", "leagueName"];
            break;
        case "Booking":
            wSort = ["requiredJDate", "resourceKey"];
            break;
        case "Officer":
            wSort = ["committee", "order"];
            break;
        case "Team":
            wSort = ["gender", "league", "division"];
            break;
        case "Member":
            wSort = ["surname", "firstName"];
            wFirstLine = gMembersFirstRow;
            break;
        case "Locker":
            wSort = ["id"];
            break;
        case "RefComp":
            wSort = ["mix", "title"];
            break;
        case "LiveComp":
            wSort = ["mix", "title"];
            break;
        case "Event":
            wSort = ["requiredYear", "requiredJDate", "startTime", "subject"];
            break;
        case "Opponent":
            wSort = ["league", "team"];
            break;
        case "Fixture":
            wSort = ["league", "week", "playOn"];
            //wOrder = ['asc', 'desc', 'asc']
            break;
        case "RefEvent":
            wSort = ["eventType", "subject"];
            break;
        case "CanEvent":
            wSort = [
                "requiredYear",
                "requiredJDate",
                "startTime",
                "homeAway",
                "subject",
            ];
            break;
        default:
            console.log(
                "/public/objects/entity getTargetParamters invalid pTarget [" +
                    pTarget +
                    "]"
            );
            wSort = [];
            break;
    }
    return [wFirstLine, wSort, wOrder];
}

export function filterByListChoice(pTarget) {
    let wDataToDisplay = [];
    let wDataToDisplay2 = [];
    let wLeagueRoot = "";
    let wLeagueBase = "";
    let wDivision = 0;
    let wLeagueDivision = "";

    let wFilter1 = "";
    let wFilter2 = "";
    let wDateOn = 0;
    let wDateFrom = 0;
    let wDateTo = 0;
    let wBookerId = "";

    let choices = ["All", "CE", "CG", "HG"];

    let wTeamName = "";

    switch (pTarget) {
        case "League":
            wFilter1 = $w("#rgpLeagueChoice").value;
            if (wFilter1 === "A") {
                wDataToDisplay = [...gLeagues];
            } else {
                wDataToDisplay = gLeagues.filter(
                    (item) => item.gender === wFilter1
                );
            }
            break;
        case "Team":
            wFilter1 = $w("#rgpTeamChoice").value;
            if (wFilter1 === "A") {
                wDataToDisplay = [...gTeams];
            } else {
                wDataToDisplay = gTeams.filter(
                    (item) => item.gender === wFilter1
                );
            }
            break;
        case "Booking":
            wFilter1 = $w("#rgpBookingChoice").value;
            wFilter2 = $w("#rgpBookingChoiceDate").value;
            if (/** By Who */ wFilter1 === "A") {
                wDataToDisplay2 = [...gBookings];
            } else {
                wBookerId = $w("#lblBookingChoiceBookerId").text;
                wDataToDisplay2 = gBookings.filter(
                    (item) => item.bookerId === wBookerId
                );
            }
            if (/** By Date */ wFilter2 === "N") {
                wDataToDisplay = [...wDataToDisplay2];
            } else {
                switch (
                    wFilter2 //By Date
                ) {
                    case "O":
                        wDateOn = DateToOrdinal(
                            $w("#dpkBookingChoiceDateOn").value
                        );
                        wDataToDisplay = wDataToDisplay2.filter(
                            (item) => item.requiredJDate === wDateOn
                        );
                        break;
                    case "F":
                        wDateFrom = DateToOrdinal(
                            $w("#dpkBookingChoiceDateFrom").value
                        );
                        //console.log("Day From = ", wDateFrom);
                        wDataToDisplay = wDataToDisplay2.filter(
                            (item) => item.requiredJDate >= wDateFrom
                        );
                        break;
                    case "R":
                        wDateFrom = DateToOrdinal(
                            $w("#dpkBookingChoiceDateRangeA").value
                        );
                        wDateTo = DateToOrdinal(
                            $w("#dpkBookingChoiceDateRangeB").value
                        );
                        //console.log("Day from to = ", wDateFrom, wDateTo);
                        wDataToDisplay = wDataToDisplay2.filter(
                            (item) =>
                                item.requiredJDate >= wDateFrom &&
                                item.requiredJDate < wDateTo
                        );
                        break;
                }
            }
            break;

        case "Notice":
            wFilter1 = $w("#drpNoticeChoiceTarget").value;
            wFilter2 = $w("#drpNoticeChoiceStatus").value;

            if (
                /** Target */ wFilter1 === "A" &&
                /** status */ wFilter2 === "A"
            ) {
                wDataToDisplay = [...gNotices];
            } else if (/** Target */ wFilter1 === "A") {
                wDataToDisplay = gNotices.filter(
                    (item) => item.status === wFilter2
                );
            } else if (/** Status */ wFilter2 === "A") {
                wDataToDisplay =
                    wFilter1 === "E" ?
                        gNotices.filter((item) => item.web === "Y")
                    :   gNotices.filter((item) => item.send === "Y");
            } else {
                if (wFilter1 === "E") {
                    wDataToDisplay = gNotices.filter(
                        (item) => item.status === wFilter2 && item.web === "Y"
                    );
                } else {
                    wDataToDisplay = gNotices.filter(
                        (item) => item.status === wFilter2 && item.send === "Y"
                    );
                }
            }
            break;

        case "StandingData":
            wFilter1 = $w("#drpStandingDataChoice").value;
            if (wFilter1 === "A") {
                wDataToDisplay = [...gStandingDatas];
            } else {
                wDataToDisplay = gStandingDatas.filter(
                    (item) => item.webPage === wFilter1
                );
            }
            break;

        case "Officer":
            wFilter1 = $w("#drpOfficerChoice").value;
            wDataToDisplay = gOfficers.filter(
                (item) => item.committee === wFilter1
            );
            break;

        case "Member":
            wFilter2 = $w("#drpMemberChoiceStatus").value;
            wFilter1 = $w("#drpMemberChoiceType").value;
            if (
                /** status */ wFilter1 === "All" &&
                /** type */ wFilter2 === "All"
            ) {
                wDataToDisplay = [...gMembers];
            } else if (/** status */ wFilter2 === "All") {
                wDataToDisplay = gMembers.filter(
                    (item) => item.type === wFilter1
                );
            } else if (/** type */ wFilter1 === "All") {
                wDataToDisplay = gMembers.filter(
                    (item) => item.status === wFilter2
                );
            } else {
                wDataToDisplay = gMembers.filter(
                    (item) => item.type === wFilter1 && item.status === wFilter2
                );
            }
            break;

        case "Locker":
            wDataToDisplay = [...gLockers];
            break;

        case "RefComp":
            wDataToDisplay = [...gRefComps];
            break;

        case "LiveComp":
            wDataToDisplay = [...gLiveComps];
            break;

        case "Event":
            wFilter1 = $w("#drpEventChoice").value;
            if (choices.includes(wFilter1)) {
                if (wFilter1 === "All") {
                    wDataToDisplay = [...gEvents];
                } else {
                    wDataToDisplay = gEvents.filter(
                        (item) => item.eventType === wFilter1
                    );
                }
            } else {
                wDataToDisplay = gEvents.filter(
                    (item) => item.team === wFilter1
                );
            }
            break;

        case "Opponent":
            wFilter1 = $w("#drpOpponentChoice").value;
            if (wFilter1 === "All") {
                wDataToDisplay = [...gOpponents];
            } else {
                wDataToDisplay = gOpponents.filter(
                    (item) => item.league === wFilter1
                );
            }
            break;

        case "Fixture":
            wFilter1 = $w("#drpFixtureChoice").value;
            if (!$w("#boxFixtureChoiceTeam").collapsed) {
                wTeamName = $w("#drpFixtureChoiceTeam").value;
            }
            wLeagueRoot = wFilter1.substring(0, 2);
            if (wLeagueRoot === "FG") {
                wDivision = 0;
                wLeagueBase = wFilter1;
            } else if (wLeagueRoot === "RS") {
                wDivision = 1;
                wLeagueBase = wLeagueRoot;
            } else {
                wLeagueBase = wFilter1.slice(0, -1);
                wLeagueDivision = wFilter1.slice(-1);
                wDivision = parseInt(wLeagueDivision, 10);
            }
            //console.log(gFixtures);
            //console.log(wFilter1, wLeagueBase, wDivision, typeof wDivision);
            if (wFilter1 === "All") {
                wDataToDisplay = [...gFixtures];
            } else {
                if (wTeamName === "") {
                    wDataToDisplay = gFixtures.filter(
                        (item) =>
                            item.league === wLeagueBase &&
                            item.division === wDivision
                    );
                } else {
                    wDataToDisplay = gFixtures.filter(
                        (item) =>
                            item.league === wLeagueBase &&
                            item.division === wDivision &&
                            (item.home === wTeamName || item.away === wTeamName)
                    );
                }
            }
            break;

        case "RefEvent":
            wDataToDisplay = [...gRefEvents];
            break;

        case "CanEvent":
            wFilter1 = $w("#drpCanEventChoice").value;
            switch (wFilter1) {
                case "All":
                    wDataToDisplay = [...gCanEvents];
                    break;
                case "XLG":
                    wDataToDisplay = gCanEvents.filter(
                        (item) =>
                            item.eventType === "CE" ||
                            item.eventType === "CG" ||
                            item.eventType === "HG"
                    );
                    break;
                case "CG":
                case "HG":
                case "CE":
                    wDataToDisplay = gCanEvents.filter(
                        (item) => item.eventType === wFilter1
                    );
                    break;
                default:
                    wDataToDisplay = gCanEvents.filter(
                        (item) => item.team === wFilter1
                    );
                    break;
            }
            break;
        default:
            console.log(
                "public/objects/entity filterListByChoice 1 invalid switch target",
                pTarget
            );
            wDataToDisplay = [];
            break;
    }

    return wDataToDisplay;
}

/**
 * Summary:	Retrieves global data store for a specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which the global data store is retrieved.
 * @returns {any[]} - An array representing the global data store for the specified target.
 */

/** ACCORDING TO VS COE THIS IS NEVER CALLED SO...
export function retrieveGlobalDataStore(pTarget){
	return gRefEvents;
}
*/

/**
 * Updates the global data store for a specified target with the provided record.
 *
 * @function
 * @param {Object} pRec - The record to be updated or inserted into the global data store.
 * @param {string} pTarget - The target identifier for which the global data store is updated.
 *
 * @returns {boolean} - Returns true if the update or insert operation is successful.
 */
export function updateGlobalDataStore(pRec, pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget);
    let wSortedData = [];

    let wSelectedItem = wGlobalData.find((item) => item._id === pRec._id);
    if (wSelectedItem) {
        switch (pTarget) {
            case "LiveComp":
                wSelectedItem.title = pRec.title;
                wSelectedItem.compRef = pRec.compRef;
                wSelectedItem.maintainedBy = pRec.maintainedBy;
                wSelectedItem.inTableDisplay = pRec.inTableDisplay;
                wSelectedItem.bookable = pRec.bookable;
                wSelectedItem.shape = pRec.shape;
                wSelectedItem.mix = pRec.mix;
                wSelectedItem.gameType = pRec.gameType;
                wSelectedItem.competitorType = pRec.competitorType;
                wSelectedItem.compYear = pRec.compYear;
                wSelectedItem.status = pRec.status;
                wSelectedItem.order = pRec.order;
                wSelectedItem.noStages = pRec.noStages;
                wSelectedItem.winnerNames = pRec.winnerNames;
                wSelectedItem.secondNames = pRec.secondNames;
                wSelectedItem.noCompetitors = pRec.noCompetitors;
                break;
            case "CanEvent":
            case "Event":
                wSelectedItem.startDate = pRec.startDate;
                wSelectedItem.subject = pRec.subject;
                wSelectedItem.rinks = pRec.rinks;
                wSelectedItem.homeAway = pRec.homeAway;
                wSelectedItem.startTime = pRec.startTime;
                wSelectedItem.duration = pRec.duration;

                wSelectedItem.eventType = pRec.eventType;
                wSelectedItem.useType = pRec.useType;
                wSelectedItem.gameType = pRec.gameType;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.league = pRec.league;
                wSelectedItem.team = pRec.team;
                wSelectedItem.eventId = null;
                wSelectedItem.mix = pRec.mix;
                wSelectedItem.uploadStatus = pRec.uploadStatus;
                wSelectedItem.requiredYear = pRec.requiredYear;
                wSelectedItem.requiredJDate = pRec.requiredJDate;
                wSelectedItem.calKey = null;
                wSelectedItem.status = pRec.status;
                wSelectedItem.summary = pRec.summary;
                break;
            case "Booking":
                wSelectedItem.startDate = pRec.startDate;
                wSelectedItem.subject = pRec.subject;
                wSelectedItem.rinks = pRec.rinks;
                wSelectedItem.homeAway = pRec.homeAway;
                wSelectedItem.startTime = pRec.startTime;
                wSelectedItem.duration = pRec.duration;

                wSelectedItem.eventType = pRec.eventType;
                wSelectedItem.useType = pRec.useType;
                wSelectedItem.gameType = pRec.gameType;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.league = pRec.league;
                wSelectedItem.team = pRec.team;
                wSelectedItem.eventId = null;
                wSelectedItem.mix = pRec.mix;
                wSelectedItem.uploadStatus = pRec.uploadStatus;
                wSelectedItem.requiredYear = pRec.requiredYear;
                wSelectedItem.requiredJDate = pRec.requiredJDate;
                wSelectedItem.calKey = null;
                wSelectedItem.status = pRec.status;
                wSelectedItem.summary = pRec.summary;
                break;
            case "Notice":
                wSelectedItem.targetType = pRec.targetType;
                wSelectedItem.target = pRec.target;
                wSelectedItem.title = pRec.title;
                wSelectedItem.urgent = pRec.urgent;
                wSelectedItem.picture = pRec.picture;
                wSelectedItem.message = pRec.message;
                wSelectedItem.status = pRec.status;
                wSelectedItem.source = pRec.source;
                wSelectedItem.web = pRec.web;
                wSelectedItem.send = pRec.send;
                break;
            case "Label":
                wSelectedItem.title = pRec.title;
                wSelectedItem.count = pRec.count;
                break;
            case "StandingData":
                wSelectedItem.webPage = pRec.webPage;
                wSelectedItem.refKey = pRec.refKey;
                wSelectedItem.name = pRec.name;
                wSelectedItem.value = pRec.value;
                break;
            case "Officer":
                wSelectedItem.committee = pRec.committee;
                wSelectedItem.position = pRec.position;
                wSelectedItem.holderId = pRec.holderId;
                wSelectedItem.order = pRec.order;
                break;
            case "Member":
                wSelectedItem.dateLeft = pRec.dateLeft;
                wSelectedItem.username = pRec.username;
                wSelectedItem.loginEmail = pRec.loginEmail;
                wSelectedItem.firstName = pRec.firstName;
                wSelectedItem.surname = pRec.surname;
                wSelectedItem.gender = pRec.gender;
                wSelectedItem.type = pRec.type;
                wSelectedItem.status = pRec.status;
                wSelectedItem.contactpref = pRec.contactpref;
                wSelectedItem.allowshare = pRec.allowshare;
                wSelectedItem.contactEmail = pRec.contactEmail;
                wSelectedItem.altEmail = pRec.altEmail;
                wSelectedItem.mobilePhone = pRec.mobilePhone;
                wSelectedItem.homePhone = pRec.homePhone;
                wSelectedItem.locker = pRec.locker;
                wSelectedItem.addrLine1 = pRec.addrLine1;
                wSelectedItem.addrLine2 = pRec.addrLine2;
                wSelectedItem.town = pRec.town;
                wSelectedItem.postCode = pRec.postCode;
                wSelectedItem.wixId = pRec.wixId;
                wSelectedItem.photo = pRec.photo;
                break;
            case "Locker":
                wSelectedItem.ownerName = pRec.ownerName;
                break;
            case "Opponent":
                wSelectedItem.league = pRec.league;
                wSelectedItem.team = pRec.team;
                wSelectedItem.status = pRec.status;
                break;
            case "Fixture":
                wSelectedItem.weekEnding = pRec.weekEnding;
                wSelectedItem.week = pRec.week;
                wSelectedItem.playOn = pRec.playOn;
                wSelectedItem.home = pRec.home;
                wSelectedItem.away = pRec.away;
                wSelectedItem.homeAway = pRec.homeAway;
                wSelectedItem.league = pRec.league;
                wSelectedItem.division = pRec.division;
                wSelectedItem.primed = pRec.primed;
                break;
            case "Team":
                wSelectedItem.duration = pRec.duration;
                wSelectedItem.startTime = pRec.startTime;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.teamKey = pRec.teamKey;
                wSelectedItem.teamName = pRec.teamName;
                wSelectedItem.leagueName = pRec.leagueName;
                wSelectedItem.league = pRec.league;
                wSelectedItem.useType = pRec.useType;
                wSelectedItem.gameType = pRec.gameType;
                wSelectedItem.division = pRec.division;
                wSelectedItem.noMatches = pRec.noMatches;
                wSelectedItem.gender = pRec.gender;
                wSelectedItem.managerId = pRec.managerId;
                wSelectedItem.dayCaptainId = pRec.dayCaptainId;
                wSelectedItem.url = pRec.url;
                wSelectedItem.url2 = pRec.url2;
                break;
            case "League":
                wSelectedItem.duration = pRec.duration;
                wSelectedItem.startTime = pRec.startTime;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.leagueKey = pRec.leagueKey;
                wSelectedItem.division = pRec.division;
                wSelectedItem.leagueName = pRec.leagueName;
                wSelectedItem.useType = pRec.useType;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.noMatches = pRec.noMatches;
                wSelectedItem.gender = pRec.gender;
                wSelectedItem.resultUrl = pRec.resultUrl;
                wSelectedItem.linkUrl = pRec.linkUrl;
                break;
            case "RefEvent":
                wSelectedItem.subject = pRec.subject;
                wSelectedItem.rinks = pRec.rinks;
                wSelectedItem.startTime = pRec.startTime;
                wSelectedItem.duration = pRec.duration;
                wSelectedItem.eventType = pRec.eventType;
                wSelectedItem.useType = pRec.useType;
                wSelectedItem.gameType = pRec.gameType;
                wSelectedItem.dress = pRec.dress;
                wSelectedItem.league = pRec.league;
                wSelectedItem.team = pRec.team;
                wSelectedItem.mix = pRec.mix;
                break;
            default:
                console.log(
                    "public/objects/entity updateGlobalDataStore 2 Invalid pTarget",
                    pTarget
                );
                break;
        } //switch
        wSelectedItem.selected = false;
    } else {
        pRec.selected = false;
        wGlobalData.push(pRec);
    }

    $w(`#lbl${pTarget}ListTotal`).text = String(wDataToDisplay.length);
    if (wOrder) {
        // @ts-ignore
        wSortedData = _.orderBy(wGlobalData, wSort, wOrder);
    } else {
        wSortedData = _.orderBy(wGlobalData, wSort);
    }
    switch (pTarget) {
        case "Notice":
            gNotices = [...wSortedData];
            break;
        case "Label":
            gLabels = [...wSortedData];
            break;
        case "StandingData":
            gStandingDatas = [...wSortedData];
            break;
        case "Officer":
            gOfficers = [...wSortedData];
            break;
        case "League":
            gLeagues = [...wSortedData];
            break;
        case "Team":
            gTeams = [...wSortedData];
            break;
        case "Member":
            gMembers = [...wSortedData];
            break;
        case "Locker":
            gLockers = [...wSortedData];
            break;
        case "RefComp":
            gRefComps = [...wSortedData];
            break;
        case "LiveComp":
            gLiveComps = [...wSortedData];
            break;
        case "Event":
            gEvents = [...wSortedData];
            break;
        case "Booking":
            gBookings = [...wSortedData];
            break;
        case "Opponent":
            gOpponents = [...wSortedData];
            break;
        case "Fixture":
            gFixtures = [...wSortedData];
            break;
        case "RefEvent":
            gRefEvents = [...wSortedData];
            break;
        case "CanEvent":
            gCanEvents = [...wSortedData];
            break;
        default:
            console.log(
                "public/objects/entity updateGlobalDataStore 3 Invalid pTarget",
                pTarget
            );
            break;
    }
    return true;
}
/**
 * Summary:	Deletes items from the global data store for a specified target based on the provided IDs.
 *
 * @function
 * @param {string[]} pIds - An array of IDs representing the items to be deleted from the global data store.
 * @param {string} pTarget - The target identifier for which the global data store is updated.
 *
 * @returns {boolean} - Returns true if the delete operation is successful.
 */
export function deleteGlobalDataStore(pIds, pTarget) {
    // eslint-disable-next-line no-unused-vars
    let [wGlobalData, wDataToDisplay, wFirstLine, wControls, wSort, wOrder] =
        resetPaginationParameters(pTarget);
    for (let wItemId of pIds) {
        let wIdx = wGlobalData.findIndex((item) => item._id === wItemId);
        if (wIdx > -1) {
            wGlobalData.splice(wIdx, 1);
        }
    }

    $w(`#lbl${pTarget}ListTotal`).text = String(wDataToDisplay.length);
    switch (pTarget) {
        case "Booking":
            gBookings = [...wGlobalData];
            break;
        case "Notice":
            gNotices = [...wGlobalData];
            break;
        case "Label":
            gLabels = [...wGlobalData];
            break;
        case "StandingData":
            gStandingDatas = [...wGlobalData];
            break;
        case "Officer":
            gOfficers = [...wGlobalData];
            break;
        case "Team":
            gTeams = [...wGlobalData];
            break;
        case "League":
            gLeagues = [...wGlobalData];
            break;
        case "Member":
            gMembers = [...wGlobalData];
            break;
        case "Locker":
            gLockers = [...wGlobalData];
            break;
        case "RefComp":
            gRefComps = [...wGlobalData];
            break;
        case "LiveComp":
            gLiveComps = [...wGlobalData];
            break;
        case "Event":
            gEvents = [...wGlobalData];
            break;
        case "Opponent":
            gOpponents = [...wGlobalData];
            break;
        case "Fixture":
            gFixtures = [...wGlobalData];
            break;
        case "RefEvent":
            gRefEvents = [...wGlobalData];
            break;
        case "CanEvent":
            gCanEvents = [...wGlobalData];
            break;
        default:
            console.log(
                "public/objects/entity deleteGlobalDatastore 2 invalid switch target",
                pTarget
            );
            break;
    }
    return true;
}
/**
 * Summary:	Clears the edit box fields for a specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which the edit box fields need to be cleared.
 *
 * @returns {void}
 */
export function clearEditBox(pTarget) {
    //console.log("oe clearEditBox");
    switch (pTarget) {
        case "RefComp":
            $w("#inpRefCompEditTitle").value = "";
            $w("#inpRefCompEditCompRef").value = "";
            $w("#rgpRefCompEditMaintainedBy").value = "M";
            $w("#rgpRefCompEditInTableDisplay").value = "N";
            $w("#rgpRefCompEditBookable").value = "N";
            $w("#rgpRefCompEditGameType").value = "1";
            $w("#rgpRefCompEditCompetitorType").value = "P";
            $w("#rgpRefCompEditShape").value = "KO";
            if (gMode === MODE.CREATE) {
                $w("#inpRefCompEditCompRef").enable();
            } else {
                $w("#inpRefCompEditCompRef").disable();
            }
            break;
        case "LiveComp":
            $w("#inpLiveCompEditTitle").value = "";
            $w("#inpLiveCompEditCompRef").value = "";
            $w("#rgpLiveCompEditMaintainedBy").value = "M";
            $w("#rgpLiveCompEditInTableDisplay").value = "N";
            $w("#rgpLiveCompEditBookable").value = "N";
            $w("#rgpLiveCompEditGameType").value = "1";
            $w("#rgpLiveCompEditCompetitorType").value = "P";
            $w("#drpLiveCompEditShape").value = "KO";
            $w("#inpLiveCompEditYear").value = "2024";
            $w("#txtLiveCompEditWinners").text = "";
            $w("#txtLiveCompEditSeconds").text = "";
            $w("#rgpLiveCompEditMix").value = "L";
            $w("#drpLiveCompEditStatus").value = "N";
            $w("#inpLiveCompEditNoCompetitors").value = "";
            $w("#inpLiveCompEditOrder").value = "0";
            $w("#inpLiveCompEditNoStages").value = "1";
            if (gMode === MODE.CREATE) {
                $w("#inpLiveCompEditCompRef").enable();
            } else {
                $w("#inpLiveCompEditCompRef").disable();
            }
            break;
        case "Team":
        case "League":
        case "Opponent":
        case "Member":
        case "Locker":
        case "Fixture":
        case "StandingData":
        case "Booking":
        case "RefEvent":
        case "CanEvent":
        case "Event":
        case "Notice":
        case "Label":
        case "Officer":
            // Do nothing. The Populate function is in the main page code
            break;
        default:
            console.log(
                "/public/objects/entity clearEditBox Invalid switch key",
                pTarget
            );
            break;
    }
}
/**
 * Summary:	Populates edit box fields based on the record and type for a specified LiveComp or RefEvent.
 *
 * @function
 * @param {string} pTarget - The type identifier ("C" for LiveComp, other for RefEvent).
 *
 * @returns {void}
 */
export function populateEdit(pTarget) {
    let pRec = getSelectedItem(pTarget);

    switch (pTarget) {
        case "LiveComp":
            $w("#inpLiveCompEditTitle").value = pRec.title;
            $w("#inpLiveCompEditCompRef").value = pRec.compRef;
            $w("#rgpLiveCompEditMaintainedBy").value = pRec.maintainedBy;
            $w("#rgpLiveCompEditInTableDisplay").value = pRec.inTableDisplay;
            $w("#rgpLiveCompEditBookable").value = pRec.bookable;
            $w("#drpLiveCompEditShape").value = pRec.shape;
            $w("#rgpLiveCompEditMix").value = pRec.mix;
            $w("#rgpLiveCompEditGameType").value = pRec.gameType;
            $w("#rgpLiveCompEditCompetitorType").value = getCompetitorType(
                pRec.competitorType
            );
            $w("#inpLiveCompEditNoCompetitors").value = pRec.noCompetitors;
            $w("#inpLiveCompEditYear").value = pRec.compYear;
            $w("#drpLiveCompEditStatus").value = pRec.status;
            $w("#inpLiveCompEditOrder").value = pRec.order;
            $w("#inpLiveCompEditNoStages").value = pRec.noStages;
            $w("#txtLiveCompEditWinners").text = toString(pRec.winnerNames);
            $w("#txtLiveCompEditSeconds").text = toString(pRec.secondNames);
            $w("#inpLiveCompEditCompRef").disable();
            break;
        case "RefComp":
            $w("#inpRefCompEditTitle").value = pRec.title;
            $w("#inpRefCompEditCompRef").value = pRec.compRef;
            $w("#rgpRefCompEditMaintainedBy").value = pRec.maintainedBy;
            $w("#rgpRefCompEditInTableDisplay").value = pRec.inTableDisplay;
            $w("#rgpRefCompEditBookable").value = pRec.bookable;
            $w("#rgpRefCompEditShape").value = pRec.shape;
            $w("#rgpRefCompEditGameType").value = pRec.gameType;
            $w("#rgpRefCompEditCompetitorType").value = getCompetitorType(
                pRec.competitorType
            );
            if (gMode === MODE.CREATE) {
                $w("#inpRefCompEditCompRef").enable();
            } else {
                $w("#inpRefCompEditCompRef").disable();
            }
            break;
        case "League":
        case "Team":
        case "Opponent":
        case "Fixture":
        case "Member":
        case "Locker":
        case "Booking":
        case "RefEvent":
        case "StandingData":
        case "CanEvent":
        case "Officer":
        case "Notice":
        case "Label":
        case "Event":
            // Do nothing. The Populate function is in the main page code
            break;
        default:
            console.log(
                "public/objects/entity populateEdit 1 invalid switch target",
                pTarget
            );
            break;
    }
}
/**
 * Summary:	Hides "Go To" buttons based on the specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which "Go To" buttons need to be hidden.
 *
 * @returns {void}
 */
export function hideGoToButtons(pTarget) {
    //console.log("oe hideGoToButtos");
    switch (pTarget) {
        case "Member":
            $w("#btnMemberAToSync").hide();
            $w("#btnMemberAToCustom").hide();
            $w("#btnMemberAToLocker").hide();
            break;
        case "Locker":
            $w("#btnLockerAToMember").hide();
            break;
        case "Booking":
            $w("#btnBookingAToSpecial").hide();
            break;
        case "StandingData":
            $w("#btnStandingDataAToA").hide();
            break;
        case "Officer":
            $w("#btnOfficerAToA").hide();
            break;
        case "Notice":
            $w("#btnNoticeAToLabel").hide();
            break;
        case "Label":
            $w("#btnLabelAToNotice").hide();
            break;
        case "Team":
            $w("#btnTeamAToLeague").hide();
            break;
        case "League":
            $w("#btnLeagueAToTeam").hide();
            break;
        case "RefComp":
            $w("#btnRefCompAToLiveComp").hide();
            break;
        case "LiveComp":
            $w("#btnLiveCompAToRefComp").hide();
            break;
        case "Event":
            $w("#btnEventAToCanEvent").hide();
            break;
        case "Opponent":
            $w("#btnOpponentAToFixture").hide();
            $w("#btnOpponentAToRefEvent").hide();
            $w("#btnOpponentAToCanEvent").hide();
            break;
        case "Fixture":
            $w("#btnFixtureAToOpponent").hide();
            $w("#btnFixtureAToRefEvent").hide();
            $w("#btnFixtureAToCanEvent").hide();
            break;
        case "RefEvent":
            $w("#btnRefEventAToOpponent").hide();
            $w("#btnRefEventAToFixture").hide();
            $w("#btnRefEventAToCanEvent").hide();
            break;
        case "CanEvent":
            $w("#btnCanEventAToOpponent").hide();
            $w("#btnCanEventAToFixture").hide();
            $w("#btnCanEventAToRefEvent").hide();
            break;
        default:
            console.log(
                "/public/objects/entity hideGoToButtons Invalid switch key",
                pTarget
            );
            break;
    }
}
/**
 * Summary:	Shows "Go To" buttons based on the specified target.
 *
 * @function
 * @param {string} pTarget - The target identifier for which "Go To" buttons need to be hidden.
 *
 * @returns {void}
 */
export function showGoToButtons(pTarget) {
    //console.log("oe showGoToButtons");

    switch (pTarget) {
        case "Member":
            $w("#btnMemberAToSync").show();
            $w("#btnMemberAToCustom").show();
            $w("#btnMemberAToLocker").show();
            break;
        case "Booking":
            $w("#btnBookingAToSpecial").show();
            break;
        case "StandingData":
            $w("#btnStandingDataAToA").show();
            break;
        case "Officer":
            $w("#btnOfficerAToA").show();
            break;
        case "Locker":
            $w("#btnLockerAToMember").show();
            break;
        case "Team":
            $w("#btnTeamAToLeague").show();
            break;
        case "Notice":
            $w("#btnNoticeAToLabel").show();
            break;
        case "Label":
            $w("#btnLabelAToNotice").show();
            break;
        case "League":
            $w("#btnLeagueAToTeam").show();
            break;
        case "RefComp":
            $w("#btnRefCompAToLiveComp").show();
            break;
        case "LiveComp":
            $w("#btnLiveCompAToRefComp").show();
            break;
        case "Event":
            $w("#btnEventAToCanEvent").show();
            break;
        case "Opponent":
            $w("#btnOpponentAToFixture").show();
            $w("#btnOpponentAToRefEvent").show();
            $w("#btnOpponentAToCanEvent").show();
            break;
        case "Fixture":
            $w("#btnFixtureAToOpponent").show();
            $w("#btnFixtureAToRefEvent").show();
            $w("#btnFixtureAToCanEvent").show();
            break;
        case "RefEvent":
            $w("#btnRefEventAToOpponent").show();
            $w("#btnRefEventAToFixture").show();
            $w("#btnRefEventAToCanEvent").show();
            break;
        case "CanEvent":
            $w("#btnCanEventAToOpponent").show();
            $w("#btnCanEventAToFixture").show();
            $w("#btnCanEventAToRefEvent").show();
            break;
        default:
            console.log(
                "/public/objects/entity showGoToButtons Invalid switch key",
                pTarget
            );
            break;
    }
}
/**
 * Summary:	Extracts the target identifier from the event's target ID based on a specified type.
 *
 * @function
 * @param {Event} pEvent - The event object containing information about the event.
 * @param {string} pType - The type identifier used in the target's ID.
 *
 * @returns {string} - The extracted target identifier.
 */
export function getTarget(pEvent, pType) {
    // @ts-ignore
    let wControl = pEvent.target.id;
    //console.log("GT", wControl);
    let x = wControl.indexOf(pType);
    let wTarget = wControl.substring(3, x);
    return wTarget;
}

export function getTargetItem(pTarget, pId) {
    let wElement;
    switch (pTarget) {
        case "Notice":
            wElement = gNotices.find((wItem) => wItem._id === pId);
            break;
        case "Label":
            wElement = gLabels.find((wItem) => wItem._id === pId);
            break;
        case "Booking":
            wElement = gBookings.find((wItem) => wItem._id === pId);
            break;
        case "Member":
            wElement = gMembers.find((wItem) => wItem._id === pId);
            break;
        case "Locker":
            wElement = gLockers.find((wItem) => wItem._id === pId);
            break;
        case "StandingData":
            wElement = gStandingDatas.find((wItem) => wItem._id === pId);
            break;
        case "Officer":
            wElement = gOfficers.find((wItem) => wItem._id === pId);
            break;
        case "League":
            wElement = gLeagues.find((wItem) => wItem._id === pId);
            break;
        case "Team":
            wElement = gTeams.find((wItem) => wItem._id === pId);
            break;
        case "RefComp":
            wElement = gRefComps.find((wItem) => wItem._id === pId);
            break;
        case "LiveComp":
            wElement = gLiveComps.find((wItem) => wItem._id === pId);
            break;
        case "Event":
            wElement = gEvents.find((wItem) => wItem._id === pId);
            break;
        case "Opponent":
            wElement = gOpponents.find((wItem) => wItem._id === pId);
            break;
        case "Fixture":
            wElement = gFixtures.find((wItem) => wItem._id === pId);
            break;
        case "RefEvent":
            wElement = gRefEvents.find((wItem) => wItem._id === pId);
            break;
        case "CanEvent":
            wElement = gCanEvents.find((wItem) => wItem._id === pId);
            break;
        default:
            console.log(
                "public/objects/entity getTargetItem 1 invalid switch target",
                pTarget
            );
            break;
    }
    return wElement;
}

/**
 * Summary:	Resets the section based on the specified target, hiding/showing boxes, buttons, and updating controls.
 *
 * @function
 * @param {string} pTarget - The target identifier for which the section needs to be reset.
 *
 * @returns {void}
 */
export function resetSection(pTarget) {
    //.log("oe resetSection");

    gMode = MODE.CLEAR;
    let wNoEntries = 0;
    switch (pTarget) {
        case "Notice":
            wNoEntries = gNotices.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "Label":
            wNoEntries = gLabels.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "Booking":
            wNoEntries = gBookings.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "Officer":
            wNoEntries = gOfficers.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "StandingData":
            wNoEntries = gStandingDatas.length;
            break;
        case "Team":
            wNoEntries = gTeams.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "League":
            wNoEntries = gLeagues.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "Member":
            wNoEntries = gMembers.length;
            //$w('#chkMemberListSelect').checked = false;
            break;
        case "Locker":
            wNoEntries = gLockers.length;
            //$w('#chkLockerListSelect').checked = false;
            break;
        case "RefComp":
            wNoEntries = gRefComps.length;
            //$w('#chkRefCompListSelect').checked = false;
            break;
        case "LiveComp":
            wNoEntries = gLiveComps.length;
            //$w('#chkLiveCompListSelect').checked = false;
            break;
        case "Event":
            wNoEntries = gEvents.length;
            //$w('#chkEventListSelect').checked = false;
            break;
        case "Opponent":
            wNoEntries = gOpponents.length;
            //$w('#chkEventListSelect').checked = false;
            break;
        case "Fixture":
            wNoEntries = gFixtures.length;
            //$w('#chkEventListSelect').checked = false;
            break;
        case "RefEvent":
            wNoEntries = gRefEvents.length;
            //$w('#chkEventListSelect').checked = false;
            break;
        case "CanEvent":
            wNoEntries = gCanEvents.length;
            //$w('#chkEventListSelect').checked = false;
            break;
        default:
            console.log(
                "/public/objects/entity resetSection invalid pTarget = ",
                pTarget
            );
            break;
    } // switch
    //if($w(`#box${pTarget}Choice`).rendered) { $w(`#box${pTarget}Choice`).expand()};
    $w(`#chk${pTarget}ListSelect`).checked = false;
    $w(`#chk${pTarget}ListSelectAll`).checked = false;

    if (wNoEntries === 0) {
        $w(`#box${pTarget}None`).expand();
        $w(`#box${pTarget}List`).collapse();
        if (pTarget !== "RefEvent") {
            $w(`#box${pTarget}Choice`).collapse();
        }
    } else {
        $w(`#box${pTarget}None`).collapse();
        $w(`#box${pTarget}List`).expand();
        if (
            pTarget !== "RefEvent" &&
            pTarget !== "RefComp" &&
            pTarget !== "LiveComp" &&
            pTarget !== "Locker" &&
            pTarget !== "Label"
        ) {
            $w(`#box${pTarget}Choice`).expand();
        }
    }

    $w(`#box${pTarget}Edit`).collapse();
    $w(`#box${pTarget}Prime`).collapse();
    if (pTarget === "LiveComp") {
        $w(`#box${pTarget}Create`).collapse();
        $w(`#box${pTarget}PrimeEdit`).collapse();
    }

    //console.log("oe resetSection 2");
    resetCommands(pTarget);
    showGoToButtons(pTarget);
    //updateDashboard();

    gSelectStack.length = 0;
    $w(`#lbl${pTarget}ListCounter`).text = "0";
    //$w(`#lbl${pTarget}ListTotal`).text = String(wNoEntries);
}
/**
 * Summary:	Removes the specified ID from the selection stack and updates the list counter.
 *
 * @function
 * @param {string} pId - The ID to be removed from the selection stack.
 *
 * @returns {void}
 */
export function pullFromSelectStack(pRec, pId) {
    //console.log("Pull from Select Stack");
    //	Updates the gEntities record
    pRec.selected = false;
    let x = gSelectStack.findIndex((item) => item === pId);
    if (x > -1) {
        gSelectStack.splice(x, 1);
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
export function pushToSelectStack(pRec, pId) {
    //console.log("Push to Select Stack");
    //	Updates the gEntities record
    pRec.selected = true;
    let x = gSelectStack.findIndex((item) => item === pId);
    if (x === -1) {
        gSelectStack.push(pId);
    }
}

/**
 * Summary:	Resets commands for a specified target, showing/hiding buttons related to creation, updating, and deletion.
 *
 * @function
 * @param {string} pTarget - The target identifier for which commands are to be reset.
 * @returns {void}
 *
 */
export function resetCommands(pTarget) {
    //console.log("oe resetCOmmands");

    switch (pTarget) {
        case "Notice":
            $w(`#btnNoticeACreate`).show();
            $w(`#btnNoticeAUpdate`).hide();
            $w(`#btnNoticeADelete`).hide();
            $w(`#btnNoticeASave`).hide();
            $w(`#btnNoticeACancel`).hide();
            break;
        case "Label":
            $w(`#btnLabelACreate`).show();
            $w(`#btnLabelAUpdate`).hide();
            $w(`#btnLabelADelete`).hide();
            $w(`#btnLabelASave`).hide();
            $w(`#btnLabelACancel`).hide();
            break;
        case "Booking":
            $w(`#btnBookingACreate`).show();
            $w(`#btnBookingAUpdate`).hide();
            $w(`#btnBookingADelete`).hide();
            $w(`#btnBookingASave`).hide();
            $w(`#btnBookingACancel`).hide();
            break;
        case "Member":
            $w(`#btnMemberACreate`).show();
            $w(`#btnMemberAUpdate`).hide();
            $w(`#btnMemberADelete`).hide();
            $w(`#btnMemberASave`).hide();
            $w(`#btnMemberACancel`).hide();
            break;
        case "Locker":
            $w("#boxLockerCommands").expand();
            $w(`#btnLockerACreate`).hide();
            $w(`#btnLockerAUpdate`).hide();
            $w(`#btnLockerADelete`).hide();
            $w(`#btnLockerASave`).hide();
            $w(`#btnLockerACancel`).hide();
            break;
        case "StandingData":
            $w(`#btnStandingDataACreate`).show();
            $w(`#btnStandingDataAUpdate`).hide();
            $w(`#btnStandingDataADelete`).hide();
            $w(`#btnStandingDataASave`).hide();
            $w(`#btnStandingDataACancel`).hide();
            break;
        case "Officer":
            $w(`#btnOfficerACreate`).show();
            $w(`#btnOfficerAUpdate`).hide();
            $w(`#btnOfficerADelete`).hide();
            $w(`#btnOfficerASave`).hide();
            $w(`#btnOfficerACancel`).hide();
            break;
        case "League":
            $w(`#btnLeagueACreate`).show();
            $w(`#btnLeagueAUpdate`).hide();
            $w(`#btnLeagueADelete`).hide();
            $w(`#btnLeagueASave`).hide();
            $w(`#btnLeagueACancel`).hide();
            break;
        case "Team":
            $w(`#btnTeamACreate`).show();
            $w(`#btnTeamAUpdate`).hide();
            $w(`#btnTeamADelete`).hide();
            $w(`#btnTeamASave`).hide();
            $w(`#btnTeamACancel`).hide();
            break;
        case "LiveComp":
            $w(`#btnLiveCompACreate`).show();
            $w(`#btnLiveCompAUpdate`).hide();
            $w(`#btnLiveCompADelete`).hide();
            $w(`#btnLiveCompASave`).hide();
            $w(`#btnLiveCompACancel`).hide();
            break;
        case "RefComp":
            $w(`#btnRefCompACreate`).show();
            $w(`#btnRefCompAUpdate`).hide();
            $w(`#btnRefCompADelete`).hide();
            $w(`#btnRefCompASave`).hide();
            $w(`#btnRefCompACancel`).hide();
            break;
        case "Event":
            $w(`#btnEventACreate`).show();
            $w(`#btnEventAUpdate`).hide();
            $w(`#btnEventADelete`).hide();
            $w(`#btnEventASave`).hide();
            $w(`#btnEventACancel`).hide();
            break;
        case "Opponent":
            $w(`#btnOpponentACreate`).show();
            $w(`#btnOpponentAUpdate`).hide();
            $w(`#btnOpponentADelete`).hide();
            $w(`#btnOpponentASave`).hide();
            $w(`#btnOpponentACancel`).hide();
            break;
        case "Fixture":
            $w(`#btnFixtureACreate`).show();
            $w(`#btnFixtureAUpdate`).hide();
            $w(`#btnFixtureADelete`).hide();
            $w(`#btnFixtureASave`).hide();
            $w(`#btnFixtureACancel`).hide();
            break;
        case "RefEvent":
            $w(`#btnRefEventACreate`).show();
            $w(`#btnRefEventAUpdate`).hide();
            $w(`#btnRefEventADelete`).hide();
            $w(`#btnRefEventASave`).hide();
            $w(`#btnRefEventACancel`).hide();
            break;
        case "CanEvent":
            $w(`#btnCanEventACreate`).show();
            $w(`#btnCanEventAUpdate`).hide();
            $w(`#btnCanEventADelete`).hide();
            $w(`#btnCanEventASave`).hide();
            $w(`#btnCanEventACancel`).hide();
            break;
        default:
            console.log(
                "public/objects/entity resetCommands 1 invalid switch target",
                pTarget
            );

            $w(`#btn${pTarget}ACreate`).show();
            $w(`#btn${pTarget}AUpdate`).hide();
            $w(`#btn${pTarget}ADelete`).hide();
            $w(`#btn${pTarget}ASave`).hide();
            $w(`#btn${pTarget}ACancel`).hide();
            break;
    }
}

/**
 * Summary:	Configures the screen based on the target, showing/hiding buttons and collapsing/expanding boxes.
 *
 * @function
 * @param {string} pTarget - The target identifier for which the screen needs to be configured.
 *
 * @returns {void}
 */
export function configureScreen(pTarget) {
    //console.log("oe configurescree", pTarget);
    let wBoxPrime = `#box${pTarget}Prime`;
    let wBoxEdit = `#box${pTarget}Edit`;

    let wbtnCreate = `#btn${pTarget}ACreate`;
    let wbtnUpdate = `#btn${pTarget}AUpdate`;
    let wbtnDelete = `#btn${pTarget}ADelete`;
    let wbtnSave = `#btn${pTarget}ASave`;
    let wbtnCancel = `#btn${pTarget}ACancel`;
    //let wbtnSync = `#btn${pTarget}ASync`;
    //let wbtnCustom = `#btn${pTarget}ACustom`;

    //let [wCount, wPointer] = countSelectedItems(pTarget);
    let wCount = parseInt($w(`#lbl${pTarget}ListCounter`).text, 10);
    //console.log("COnfigure Screen for ", pTarget, " length = ", wCount);
    // let wSelected = {};

    switch (wCount) {
        case 0:
            if (pTarget === "Locker") {
                $w(wbtnCreate).hide();
            } else {
                $w(wbtnCreate).show();
            }
            $w(wbtnDelete).hide();
            $w(wbtnUpdate).hide();
            $w(wbtnSave).hide();
            $w(wbtnCancel).show();
            $w(wBoxPrime).collapse();
            $w(wBoxEdit).collapse;
            break;
        case 1:
            //wSelected = getCheckedItem(pTarget, wPointer);
            //wSelected = getSelectedItem(pTarget);
            if (pTarget === "Locker") {
                $w(wbtnCreate).hide();
                $w(wbtnDelete).hide();
            } else {
                $w(wbtnCreate).show();
                $w(wbtnDelete).show();
            }
            $w(wbtnUpdate).show();
            $w(wbtnSave).hide();
            $w(wbtnCancel).show();
            if (pTarget === "RefComp") {
                if ($w("#rgpRefCompView").value === "P") {
                    $w(wBoxPrime).expand();
                } else {
                    $w(wBoxPrime).collapse();
                }
            } else if (
                pTarget === "Event" ||
                pTarget === "Opponent" ||
                pTarget === "Fixture" ||
                pTarget === "RefEvent" ||
                pTarget === "CanEvent" ||
                pTarget === "Officer" ||
                pTarget === "Member"
            ) {
                $w(wBoxPrime).expand();
            } else {
                $w(wBoxPrime).collapse();
            }
            $w(wBoxEdit).collapse;
            break;
        default:
            $w(wbtnCreate).hide();
            $w(wbtnUpdate).hide();
            if (pTarget === "Locker") {
                $w(wbtnDelete).hide();
            } else {
                $w(wbtnDelete).show();
            }
            $w(wbtnSave).hide();
            $w(wbtnCancel).show();
            if (pTarget === "Event" || pTarget === "Officer") {
                $w(wBoxPrime).collapse();
            } else {
                $w(wBoxPrime).expand();
            }
            $w(wBoxEdit).collapse;
            break;
    }
}

//TODO Is this needed?Answer, yes, but needs rewriting to generalise = rewrite using getTargetItem
export function getSelectedItem(pTarget) {
    //console.log("oe getSelectedItem");
    let wSelectedItem = {};
    if (gSelectStack.length === 1) {
        let wSelectedItemId = gSelectStack[0];
        switch (pTarget) {
            case "Booking":
                //wSelectedItem = $w(`#rptMemberList`).data[pPointer];
                //wSelectedItem = $w(`#rptMemberList`).data.find(item => item._id === pPointer)
                wSelectedItem = gBookings.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "RefComp":
                //wSelectedItem = $w(`#rptMemberList`).data[pPointer];
                //wSelectedItem = $w(`#rptMemberList`).data.find(item => item._id === pPointer)
                wSelectedItem = gRefComps.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Member":
                wSelectedItem = gMembers.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Locker":
                wSelectedItem = gLockers.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Notice":
                wSelectedItem = gNotices.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Label":
                wSelectedItem = gLabels.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "StandingData":
                wSelectedItem = gStandingDatas.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Officer":
                wSelectedItem = gOfficers.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "League":
                wSelectedItem = gLeagues.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Team":
                wSelectedItem = gTeams.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "LiveComp":
                wSelectedItem = gLiveComps.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Event":
                wSelectedItem = gEvents.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Opponent":
                wSelectedItem = gOpponents.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "Fixture":
                wSelectedItem = gFixtures.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "RefEvent":
                wSelectedItem = gRefEvents.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            case "CanEvent":
                wSelectedItem = gCanEvents.find(
                    (item) => item._id === wSelectedItemId
                );
                if (wSelectedItem === -1) {
                    console.log(
                        "/public/objects/entity getSelectedItem Not found",
                        pTarget,
                        wSelectedItemId
                    );
                }
                break;
            default:
                console.log(
                    "/public/objects/entity getSelectedItem Invalid switch key",
                    pTarget
                );
                break;
        }
    }
    return wSelectedItem;
}

function getCompetitorType(pType) {
    if (pType === COMPETITOR_TYPE.TEAM) {
        return pType;
    }
    if (pType === COMPETITOR_TYPE.INDIVIDUAL) {
        return pType;
    }
    return COMPETITOR_TYPE.INDIVIDUAL;
}

function toString(pArray) {
    let wOutput = "";
    if (Array.isArray(pArray)) {
        if (pArray.length > 0) {
            for (let wTemp of pArray) {
                wOutput = wOutput + wTemp;
            }
        }
    }
    return wOutput;
}
/**
//TODO Is this needed?
export function showError2(pTarget, pSecs, pMsg, pMessage = null) {
    console.log("showError2");
    let wMsg = ["Invalid email addess format",
        "Initialisation complete",
        "Records deleted",
        "Initialisation failed. Check Logs",
        "Cannot prime a Member that is  already primed", //5
        "All Members must have start date set",
        "Bookings Saved",
        "Please check Bookings",
        "Match Events initialied OK",
        "Member updated OK", // 10
        "Phone number should be aaaaa-bbb-ccc or bbb-ccc",
        "Username must be at least 4 characters",
        "Member registered and created OK",
        "Last Message"
    ];
    let pTime = pSecs * 1000;
    if (pMessage) {
        $w(`#txt${pTarget}ErrMsg`).text = pMessage;
    } else if (pMsg > 0) {
        $w(`#txt${pTarget}ErrMsg`).text = wMsg[pMsg - 1];
    } else {
        $w(`#txt${pTarget}ErrMsg`).text = "Unknown message";
    }
    $w(`#txt${pTarget}ErrMsg`).expand();
    setTimeout(() => {
        $w(`#txt${pTarget}ErrMsg`).collapse();
    }, pTime);
    return;
}
*/

/**
 *
 * @param {string} pTarget
 */
export function showWait(pTarget) {
    try {
        $w(`#img${pTarget}Wait`).show();
        $w(`#btn${pTarget}ASave`).disable();
        $w(`#btn${pTarget}ACreate`).disable();
        $w(`#btn${pTarget}AUpdate`).disable();
        $w(`#btn${pTarget}ADelete`).disable();
    } catch (err) {
        console.log(
            `public/objects/entity showWait Try-catch err for `,
            pTarget
        );
        console.log(err);
    }
}
/**
 *
 * @param {string} pTarget
 */
export function hideWait(pTarget) {
    try {
        $w(`#img${pTarget}Wait`).hide();
        $w(`#btn${pTarget}ASave`).enable();
        $w(`#btn${pTarget}ACreate`).enable();
        $w(`#btn${pTarget}AUpdate`).enable();
        $w(`#btn${pTarget}ADelete`).enable();
    } catch (err) {
        console.log(
            `public/objects/entity hideWait Try-catch err for `,
            pTarget
        );
        console.log(err);
    }
}

/**
 *
 * @param {string} pTarget
 * @param {number} pErrNo
 * @param {string} pErrMsg
 */

export function showError(pTarget, pErrNo, pErrMsg = "") {
    try {
        let wMsg = [
            "Records deleted",
            "There was a problem deleting this competitiong",
            "Please correct input errors shown",
            "Competition created",
            "Competition already primed", //5
            "Competition in use",
            "Record Update Ok",
            "Record created OK",
            "Title cannot be blank ",
            "CompRef mist be at least 2 characters long and unique", // 10
            "Any current bookings will be deleted",
            "League set based on team selected",
            "Team estimated from league selected",
            "League does not match team selected",
            "Date must be specified", //15
            "Records skipped as start dates need to be set",
            "This operation did not complete due to file error. Please check records",
            "Venue must be set",
            "Record cancelled",
            "Cancellation failed", //20
            "Select more rows to show whole table when moving rows",
            "Invalid login email address format",
            "Member registered and created OK",
            "Username must be at least 3 characters",
            "Cannot process automatic mode competition", // 25
            "There were erros in the bulk save. Check Errors array",
            "To create an event,please use Maintain Event",
            "You need to be signed in.",
            "Number of divisions is mandatory",
            "Number of matches is mandatory", //30
            "League or Team name must be > 4 characters",
            "Team Key must be at least 2 characters long",
            "Ref Key invlid format. Must be of form SDnnn",
            "Field must be entered",
            "RefKey mist be at least 3 characters long and unique", // 35
            "Must specify an email address for preference E or B",
            "Must specify a mobile number for preference S or B",
            "Must supply either a Username or a Login Email",
            "Name must be supplied",
            "Please inform member action completed", //40
            "Invalid contact email address format",
            "A label cannot be empty",
            "Label Title must be Unique",
            "A Notice update will NOT re-send that message",
            "",
        ];
        let wControlName = `#txt${pTarget}ErrMsg`;
        let wField = $w(wControlName);
        if (pErrNo === 0) {
            wField.text = pErrMsg;
        } else {
            wField.text = wMsg[pErrNo - 1];
        }
        wField.expand();
        wField.show();
        setTimeout(() => {
            wField.collapse();
        }, 4000);
    } catch (err) {
        console.log(
            `/public/objects/entity showError Try-catch fail, target [${pTarget}], err no [${pErrNo}], err"`
        );
        console.log(err);
    }
}
/**
 *
 * @param {Date} pDate
 * @returns
 */
export function DateToOrdinal(pDate) {
    try {
        const dayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (typeof pDate === "string") {
            return -1;
        }
        const dte = new Date(pDate);
        //initialize date variable
        let julianDate = 0;
        //add days for previous months
        for (let i = 0; i < dte.getMonth(); i++) {
            julianDate = julianDate + dayCount[i];
        }
        //add days of the current month
        julianDate = julianDate + dte.getDate();
        //check for leap year
        if (dte.getFullYear() % 4 == 0 && dte.getMonth() > 1) {
            julianDate++;
        }

        return julianDate;
    } catch (err) {
        console.log("/backend/backEvents DateToOrdinal Try-catch, err");
        console.log(err);
        return -1;
    }
}
