import wixWindow from "wix-window";
import { authentication } from "wix-members-frontend";
import wixLocation from "wix-location";

import _ from "lodash";

import { buildMemberCache } from "public/objects/member";
import { retrieveSessionMemberDetails } from "public/objects/member";
import { isRequiredRole } from "public/objects/member";
import { getFullNameLocally } from "public/objects/member.js";

import { formatDateString } from "public/fixtures";
import { toJulian } from "public/fixtures";

import { getAllBookingsForYear } from "backend/backBookings.jsw";
import { getLinkedBookings } from "backend/backBookings.jsw";
import { getResourceKey } from "backend/backBookings.jsw";
import { addBookings } from "backend/backBookings.jsw";
import { processEventBookings } from "backend/backBookings.jsw";

import { saveRecord } from "backend/backEvents.jsw";
import { bulkDeleteRecords } from "backend/backEvents.jsw";
import { updateEventStartDate } from "backend/backEvents.jsw";

import { DateToOrdinal } from "public/objects/booking";
import { getNoFreeRinks } from "public/objects/booking";
import { getStartSlot } from "public/objects/booking";
import { getEndSlot } from "public/objects/booking";
import { initialiseRinksArray } from "public/objects/booking";
import { getRinksAndSlots } from "public/objects/booking";
import { w_time_slots } from "public/objects/booking";
import { getBookingsForJulianDate } from "public/objects/booking.js";

import { getCompetition } from "public/objects/clubComp";
import { loadCompCompetitors } from "public/objects/clubComp";

import { BookingGrid } from "public/classes/bookingGrid.js";

//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity } from "public/objects/entity";
import { MODE } from "public/objects/entity";
import {
    btnCreate_click,
    btnUpdate_click,
    btnDelete_click,
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
} from "public/objects/entity";
import { resetPagination, updatePagination } from "public/objects/entity";
import {
    showError,
    updateGlobalDataStore,
    deleteGlobalDataStore,
} from "public/objects/entity";
import {
    getTarget,
    getTargetItem,
    configureScreen,
} from "public/objects/entity";
import { showWait, hideWait, getMode, setMode } from "public/objects/entity";
import { getSelectStack, getSelectedItem } from "public/objects/entity";
import {
    showGoToButtons,
    hideGoToButtons,
    populateEdit,
} from "public/objects/entity";
//import { } from 'public/objects/entity';

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E",
});

const TEMPORARY_HOLDER = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd";

let gSlotRinkChange = false;

let w_grid;

//--------------------------------------------Specials---------------------------------------------------------
let gSpecialMode = MODE.CLEAR;
//-----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = gTest ? true : authentication.loggedIn();
const gYear = new Date().getFullYear();

$w.onReady(async function () {
    try {
        let status;

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
        [status, loggedInMember, loggedInMemberRoles] =
            await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
        if (isLoggedIn) {
            let wRoles = loggedInMemberRoles.toString();
            console.log(
                "/page/MaintainBooking onReady  Roles = <" + wRoles + ">",
                loggedInMember.name,
                loggedInMember.lstId
            );
        } else {
            console.log("/page/MaintainBooking onReady Not signed in");
            showError("Booking", 28);
            if (!gTest) {
                setTimeout(() => {
                    wixLocation.to("/");
                }, 2000);
            }
        }
        //-----------------------------------------------------datepicker initialisation-----------------------------
        $w("#dpkSpecialMoveFromDate").timeZone = "Europe/London";
        $w("#dpkSpecialMoveToDate").timeZone = "Europe/London";

        //-----------------------------------------------------Main -----------------------------
        if (wixWindow.formFactor === "Mobile") {
            $w("#secMobile").expand();
            $w("#secDesktop").collapse();
            $w("#secSpecial").collapse();
        } else {
            await initialiseRinksArray();

            w_grid = new BookingGrid(5, 3);
            w_grid.initialiseGrid();

            $w("#secMobile").collapse();
            $w("#secDesktop").expand();
            $w("#secSpecial").collapse();
            //await loadBookingDropDowns();
            await populateBookingDropDowns();
            $w("#inpBookingListNoPerPage").value = "15";

            await buildMemberCache();
            await loadListData();
            $w("#lblSpecialSelectedUse").text = "";
            $w("#txtBookingLeftHdr").scrollTo();
        }

        // Event Section event handlers
        //$w('#strBooking').onViewportEnter ((event) => strBooking_viewportEnter(event));
        $w("#btnBookingACreate").onClick((event) => doBtnCreateClick(event));
        $w("#btnBookingAUpdate").onClick((event) => doBtnUpdateClick(event));
        $w("#btnBookingADelete").onClick((event) =>
            btnDelete_click(loggedInMember.lstId, event)
        );
        $w("#btnBookingASave").onClick((event) => btnBookingASave_click(event));
        $w("#btnBookingACancel").onClick((event) => doBtnCancelClick(event));
        //$w('#btnBookingAToCanEvent').onClick((event) => dobtnBookingAToCanEventClick(event));
        $w("#btnBookingAToSpecial").onClick((event) =>
            doBtnBookingAToSpecialClick(event)
        );
        $w("#btnBookingAToEvent").onClick((event) =>
            doBtnBookingAToEventClick()
        );

        //$w('#btnBookingAPrime').onClick((event) => btnBookingAPrime_click(event));
        $w("#chkBookingListSelect").onClick((event) => chkSelect_click(event));
        $w("#chkBookingListSelectAll").onClick((event) =>
            chkSelectAll_click(event)
        );
        $w("#btnBookingListTop").onClick((event) => btnTop_click(event));
        $w("#pgnBookingList").onClick((event) => doPgnListClick(event));
        $w("#inpBookingListNoPerPage").onChange((event) =>
            doInpListNoPerPageChange(event)
        );
        $w("#btnBookingEditPlayerAAdd").onClick((event) =>
            doBtnBookingPlayerAdd("EditPlayerA")
        );
        $w("#btnBookingEditPlayerAClear").onClick((event) =>
            doBtnBookingPlayerClear("EditPlayerA")
        );
        $w("#btnBookingEditPlayerBAdd").onClick((event) =>
            doBtnBookingPlayerAdd("EditPlayerB")
        );
        $w("#btnBookingEditPlayerBClear").onClick((event) =>
            doBtnBookingPlayerClear("EditPlayerB")
        );
        $w("#btnBookingEditBookerAdd").onClick((event) =>
            doBtnBookingPlayerAdd("EditBooker")
        );
        $w("#btnBookingEditBookerClear").onClick((event) =>
            doBtnBookingPlayerClear("EditBooker")
        );
        $w("#btnBookingChoiceBookerAdd").onClick((event) =>
            doBtnBookingPlayerAdd("ChoiceBooker")
        );
        $w("#btnBookingChoiceBookerClear").onClick((event) =>
            doBtnBookingPlayerClear("ChoiceBooker")
        );
        //##
        $w("#rgpBookingChoice").onChange((event) =>
            doBookingChoiceChange(event)
        );
        $w("#btnBookingChoiceGo").onClick((event) =>
            doBookingChoiceGoClick(event)
        );
        $w("#rgpBookingChoiceDate").onChange((event) =>
            doBookingChoiceDateChange(event)
        );

        //      Specials Section
        $w("#btnSpecialACreate").onClick((event) => doBtnSpecialCreateClick());
        $w("#btnSpecialACancel").onClick((event) => doBtnSpecialCancelClick());
        $w("#btnSpecialAToBooking").onClick((event) =>
            doBtnSpecialAToBookingClick(event)
        );
        $w("#btnSpecialAToRecurring").onClick((event) =>
            doBtnSpecialAToRecurringClick(event)
        );
        $w("#btnSpecialAToAllDay").onClick((event) =>
            doBtnSpecialAToAllDayClick(event)
        );
        $w("#drpSpecialUse").onChange((event) => drpSpecialUse_change(event));
        $w("#inpSpecialUse").onChange((event) => inpSpecialUse_change(event));
        $w("#btnSpecialDailyReport").onClick((event) =>
            btnSpecialDailyReport_click(event)
        );
        $w("#btnSpecialMoveAllDay").onClick((event) =>
            doBtnSpecialMoveAllDayClick()
        );
        //      Bookings Rink Slot Section
        $w("#inpBookingEditStartRink").onChange((event) =>
            inpStartRink_change("BookingEdit", event)
        );
        $w("#inpBookingEditNoRinks").onChange((event) =>
            inpNoRinks_change("BookingEdit", event)
        );
        $w("#dpkBookingEditFromDate").onChange((event) =>
            dpkFromDate_change("BookingEdit", event)
        );
        $w("#tpkBookingEditStartTime").onChange((event) =>
            tpkStartTime_change("BookingEdit", event)
        );
        $w("#tpkBookingEditDuration").onChange((event) =>
            tpkDuration_change("BookingEdit", event)
        );
        //      Specials Rink Slot Section
        $w("#inpSpecialRecurringStartRink").onChange((event) =>
            inpStartRink_change("SpecialRecurring", event)
        );
        $w("#inpSpecialRecurringNoRinks").onChange((event) =>
            inpNoRinks_change("SpecialRecurring", event)
        );
        $w("#rgpSpecialRecurringDayOfWeek").onChange((event) =>
            rgpSpecialRecurringDayOfWeek_change(event)
        );
        $w("#dpkSpecialRecurringFromDate").onChange((event) =>
            dpkFromDate_change("SpecialRecurring", event)
        );
        $w("#tpkSpecialRecurringStartTime").onChange((event) =>
            tpkStartTime_change("SpecialRecurring", event)
        );
        $w("#tpkSpecialRecurringDuration").onChange((event) =>
            tpkDuration_change("SpecialRecurring", event)
        );
        //      Specials Move All Day Section
        $w("#dpkSpecialMoveFromDate").onChange((event) =>
            doDpkSpecialMoveDateChange("F", event)
        );
        $w("#dpkSpecialMoveToDate").onChange((event) =>
            doDpkSpecialMoveDateChange("T", event)
        );

        //---------------- Repeaters section--------------------------------------------------

        $w("#rptBookingList").onItemReady(($item, itemData, index) => {
            loadRptBookingList($item, itemData, index);
        });
        //-------------------------- Custom Validation -----------------------------------------

        //  None
    } catch (err) {
        console.log("/page/MaintainBooking onReady Try-catch, err");
        console.log(err);
        wixLocation.to("/syserror");
    }
});

// ------------------------------------------------ Load Data -------------------------------------------------------
//
export async function loadListData() {
    try {
        let wResult = await getAllBookingsForYear(gYear);
        let wBookings = wResult.bookings;
        setEntity("Booking", [...wBookings]);
        $w("#strBooking").expand();
        if (wBookings && wBookings.length > 0) {
            //gItemsToDisplay = [...gCompetitions];
            $w("#boxBookingChoice").expand();
            $w("#boxBookingList").expand();
            $w("#boxBookingNone").collapse();
            $w("#boxBookingEdit").collapse();
            $w("#boxBookingPrime").collapse();
            await doBookingView("");
            resetPagination("Booking");
        } else {
            //gItemsToDisplay = [...gReferences];
            $w("#boxBookingChoice").expand();
            $w("#boxBookingList").collapse();
            $w("#boxBookingNone").expand();
            $w("#boxBookingEdit").collapse();
            $w("#boxBookingPrime").collapse();
        }
    } catch (err) {
        console.log("/page/MaintainBooking loadListData Try catch, err");
        console.log(err);
    }
}
// ------------------------------------------------Load Repeaters ----------------------------------------------------------
//
async function loadRptBookingList($item, itemData, index) {
    //console.log(itemData);
    if (index === 0) {
        $item("#chkBookingListSelect").hide();
    } else {
        $item("#chkBookingListSelect").show();
        let wDate =
            (
                itemData.dateRequired === null ||
                itemData.dateRequired === undefined
            ) ?
                ""
            :   formatDateString(itemData.dateRequired, "Short");
        //let wResult = await getMember(itemData.bookerId);
        //console.log(wResult);
        //let wMember = wResult.member.fullName;
        $item("#boxBookingListEntry").style.backgroundColor = COLOUR.FREE;

        $item("#lblBookingListDateRequired").text = wDate;
        $item("#lblBookingListStartTime").text = itemData.timeRequired;
        $item("#lblBookingListRink").text = String(itemData.rink);
        $item("#lblBookingListNoSlots").text = String(itemData.slotId);
        $item("#lblBookingListSubject").text = itemData.compTitle;
        $item("#lblBookingListUsage").text = itemData.usage;
        $item("#chkBookingListSelect").checked = itemData.selected;
    }
}
// ------------------------------------------------Load Dropdowns--------------------------------------------------------
//

async function populateBookingDropDowns() {
    let wStatusOptions = [
        { label: "New", value: "N" },
        { label: "Ready", value: "R" },
        { label: "Open", value: "O" },
        { label: "Completed", value: "P" },
        { label: "Moved", value: "M" },
        { label: "Deleted", value: "D" },
    ];

    $w("#drpBookingEditStatus").options = wStatusOptions;
    $w("#drpBookingEditStatus").value = "N";
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    btnCreate_click(event);
    await clearBookingEdit();
}
export async function doBtnUpdateClick(event) {
    btnUpdate_click(event);
    await populateBookingEdit();
}
export async function doBtnCancelClick(event) {
    btnCancel_click(event);
    gSlotRinkChange = false;
}

export async function doBtnCancellationClick(event) {
    btnCancellation_click(event);
    await populateBookingEdit();
}

export async function doBtnBookingPlayerAdd(pTarget) {
    let wPlayer = `#inpBooking${pTarget}`;
    let wPlayerId = `#lblBooking${pTarget}Id`;
    let member = await wixWindow.openLightbox("lbxSelectMember");
    if (member) {
        $w(wPlayer).value = member.fullName;
        $w(wPlayerId).text = member.id;
    } else {
        $w(wPlayer).value = "";
        $w(wPlayerId).text = "";
    }
}

export async function doBtnBookingPlayerClear(pTarget) {
    //console.log("Booker clear");
    let wPlayer = `#inpBooking${pTarget}`;
    let wPlayerId = `#lblBooking${pTarget}Id`;
    $w(wPlayer).value = "";
    $w(wPlayerId).text = "";
}

// =================================================Booking Events ================================================
//
export async function drpEventFilterType_change(event) {
    showWait("Booking");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("Booking");
}
export function doBookingViewChange(event) {
    let wView = event.target.value;
    doBookingView(wView);
}
export function btnBookingAToCanEvent_click(event) {
    //$w('#strBooking').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export function btnBookingAToB_click(event) {
    //$w('#strBooking').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export function btnBookingAToC_click(event) {
    //$w('#strBooking').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export async function drpEventEditLeagueClick(event) {
    let wLeague = event.target.value;
}

export async function drpEventEditTeamClick(event) {
    let wTeam = event.target.value;
}

export async function btnBookingASave_click(event) {
    showWait("Booking");

    $w("#btnBookingASave").disable();
    //------------------------------------------validations--------------------------
    if ($w("#dpkBookingEditFromDate").valid === false) {
        showError("Booking", 15);
        $w("#dpkBookingEditFromDate").focus();
        $w("#btnBookingASave").enable();
        return;
    }
    let wBooking = {};
    let wTime = $w("#tpkBookingEditStartTime").value;
    let wHours = parseInt(wTime.split(":")[0], 10);
    let wMins = parseInt(wTime.split(":")[1], 10);
    let wDate = $w("#dpkBookingEditFromDate").value;
    let wYear = wDate.getFullYear();
    let wMonth = wDate.getMonth();
    let wDay = wDate.getDate();
    let wStartDateTime = new Date(wYear, wMonth - 1, wDay, wHours, wMins);

    let wJDate = DateToOrdinal(wStartDateTime);
    //console.log(wStartDateTime, wJDate);

    let wStartRink = $w("#inpBookingEditStartRink").value; //@@
    let wNoRinks = $w("#inpBookingEditNoRinks").value; //@@
    let wSlotRange = $w("#inpBookingEditSlotRange").value; //@@
    let wFromSlot = parseInt($w("#inpBookingEditFromSlot").value, 10); //@@
    let wToSlot = parseInt($w("#inpBookingEditToSlot").value, 10); //@@
    let wNoSlots = wFromSlot - wToSlot + 1;

    wBooking.selected = false;
    wBooking.dateRequired = wStartDateTime;
    wBooking.timeRequired = wTime.substring(0, 5);
    wBooking.requiredYear = wYear;
    wBooking.requiredMonth = wMonth;
    wBooking.requiredJDate = wJDate;
    wBooking.rangeId = $w("#inpBookingEditSlotRange").value;
    wBooking.slotId = wFromSlot;
    wBooking.rink = wStartRink;
    wBooking.resourceKey = await getResourceKey(
        wYear,
        wJDate,
        wStartRink,
        wFromSlot
    );
    wBooking.noSlots = wFromSlot - wToSlot + 1;
    wBooking.bookerId = $w("#lblBookingEditBookerId").text;
    wBooking.dateBooked = $w("#dpkBookingEditDateBooked").value;
    wBooking.playerAId = $w("#lblBookingEditPlayerAId").text;
    wBooking.playerBId = $w("#lblBookingEditPlayerBId").text;
    wBooking.noPlayers = $w("#inpBookingEditNoPlayers").value;
    wBooking.usage = $w("#inpBookingEditUse").value;
    wBooking.compRef = $w("#inpBookingEditCompRef").value;
    wBooking.compTitle = $w("#inpBookingEditCompTitle").value;
    wBooking.matchKey = $w("#inpBookingEditMatchKey").value;
    wBooking.round = $w("#inpBookingEditRound").value;
    wBooking.isBye = $w("#rgpBookingEditIsBye").value;
    wBooking.scoreA = $w("#inpBookingEditScoreA").value;
    wBooking.scoreB = $w("#inpBookingEditScoreB").value;
    wBooking.newKey = $w("#inpBookingEditNewKey").value;
    wBooking.eventId = $w("#inpBookingEditEventId").value;
    wBooking.hasChildren = $w("#rgpBookingEditHasChildren").value || "N";
    wBooking.parentId = $w("#inpBookingEditParentId").value;
    wBooking.status = $w("#drpBookingEditStatus").value;

    let wBookingUpdate = {};
    let wChildBookings = [];

    let wParams;
    let wBookingsList = [];
    let wResult;

    switch (getMode()) {
        case MODE.CREATE:
            wResult = await processRecord(
                wStartDateTime,
                wTime.substring(0, 5),
                wYear,
                wJDate,
                wStartRink,
                wNoRinks,
                wSlotRange,
                wFromSlot,
                wToSlot
            );
            break;
        case MODE.UPDATE:
            wBooking._id = getSelectStackId();
            if (gSlotRinkChange) {
                await deleteExistingBookings(wBooking._id);
                wResult = await processRecord(
                    wStartDateTime,
                    wTime.substring(0, 5),
                    wYear,
                    wJDate,
                    wStartRink,
                    wNoRinks,
                    wSlotRange,
                    wFromSlot,
                    wToSlot
                );
            } else {
                wResult = await saveRecord("lstBookings", wBooking);
                if (wResult.status) {
                    wBookingUpdate = wResult.savedRecord;
                    updateGlobalDataStore(wBookingUpdate, "Booking");
                    updatePagination("Booking");
                    showError("Booking", 8);
                } else {
                    if (wResult.savedRecord) {
                        console.log(
                            "/page/MaintainBooking btnBookingASave, save failed, savedRecord",
                            wResult.savedRecord
                        );
                    } else {
                        console.log(
                            "/page/MaintainBooking btnBookingASave, save failed, error",
                            wResult.error
                        );
                    }
                }
            }
            break;
        default:
            console.log(
                "/page/MaintainBooking btnBookingASave Booking Save mode = ",
                getMode()
            );
    }
    resetCommands("Booking");
    resetSection("Booking");
    $w("#btnBookingASave").enable();
    hideWait("Booking");
    setMode(MODE.CLEAR);
}

export function inpEventStartDate_change(event) {
    let wDate = event.target.value;
    let wYear = wDate.getFullYear();
    let wJDate = DateToOrdinal(wDate);
    $w("#inpBookingEditRequiredYear").value = wYear;
    $w("#inpBookingEditRequiredJDate").value = String(wJDate);
}

export async function cstrpEvent_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doBookingView(pTarget) {
    if (pTarget === "P") {
        $w("#chkBookingListSelectAll").collapse();
        $w("#btnBookingListTop").collapse();
        $w("#rptBookingList").collapse();
    } else {
        $w("#chkBookingListSelectAll").expand();
        $w("#btnBookingListTop").expand();
        $w("#rptBookingList").expand();
    }
}

export function strBooking_viewportEnter(event) {
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
// =================================================Booking Supporting Functions =================================================
//##

export function doBtnBookingAToSpecialClick(event) {
    $w("#secBooking").collapse();
    $w("#secSpecial").expand();
    $w("#boxSpecialRecurring").collapse();
    $w("#boxSpecialAllDay").expand();
    $w("#boxSpecialPrime").expand();
    $w("#grpSpecialUse").hide();
    $w("#drpSpecialUse").focus();
    $w("#drpSpecialUse").scrollTo();
    $w("#drpSpecialUse").value = "F";
    $w("#lblSpecialSelectedUse").text = "Fun Day";
    gSpecialMode = MODE.CREATE;
}
export function doBtnBookingAToEventClick(event) {
    //console.log("click");
    wixLocation.to("/maintain-events");
}

export function doBookingChoiceChange(event) {
    let wValue = event.target.value;
    wValue === "A" ?
        $w("#boxBookingChoiceBooker").collapse()
    :   $w("#boxBookingChoiceBooker").expand();
}

export function doBookingChoiceDateChange(event) {
    let wValue = event.target.value;
    if (wValue === "N") {
        $w("#boxBookingChoiceDateOn").collapse();
        $w("#boxBookingChoiceDateFrom").collapse();
        $w("#boxBookingChoiceDateRange").collapse();
    }
    wValue === "O" ?
        $w("#boxBookingChoiceDateOn").expand()
    :   $w("#boxBookingChoiceDateOn").collapse();
    wValue === "F" ?
        $w("#boxBookingChoiceDateFrom").expand()
    :   $w("#boxBookingChoiceDateFrom").collapse();
    wValue === "R" ?
        $w("#boxBookingChoiceDateRange").expand()
    :   $w("#boxBookingChoiceDateRange").collapse();
}

export function doBookingChoiceGoClick(event) {
    //console.log("Click");
    showWait("Booking");
    resetPagination("Booking");
    hideWait("Booking");
}

export async function clearBookingEdit() {
    let wToday = new Date();

    $w("#boxBookingEditLinks").collapse();
    //$w('#drpEventEditEventType').enable();
    //---------boxBookingEditHdr--------------------------------
    $w("#dpkBookingEditFromDate").value = null;
    $w("#dpkBookingEditDateBooked").value = wToday;
    $w("#inpBookingEditRequiredYear").value = String(wToday.getFullYear());
    $w("#inpBookingEditRequiredJDate").value = String(DateToOrdinal(wToday));

    $w("#inpBookingEditSlotRange").value = "";
    $w("#inpBookingEditFromSlot").value = "1";
    $w("#inpBookingEditNoRinks").value = "None";
    $w("#inpBookingEditBookingRef").value = "";
    $w("#inpBookingEditResourceKey").value = "";
    $w("#tpkBookingEditStartTime").value = "10:00";
    $w("#inpBookingEditToSlot").value = "1";
    $w("#inpBookingEditBooker").value = loggedInMember.name;
    $w("#lblBookingEditBookerId").text = loggedInMember.lstId;

    /**
    $w('#dpkBookingEditFromDate').enable();
    $w('#inpBookingEditSlotRange').enable();
    $w('#inpBookingEditFromSlot').enable();
    $w('#inpBookingEditNoRinks').enable();
    */

    //---------boxBookingEditPlayers--------------------------------
    $w("#inpBookingEditPlayerA").value = "";
    $w("#lblBookingEditPlayerAId").text = "";
    $w("#inpBookingEditPlayerB").value = "";
    $w("#lblBookingEditPlayerBId").text = "";
    $w("#inpBookingEditNoPlayers").value = "0";
    $w("#inpBookingEditUse").value = "";
    //---------boxBookingEditCompetition--------------------------------
    $w("#inpBookingEditCompRef").value = "";
    $w("#inpBookingEditCompTitle").value = "";
    $w("#inpBookingEditMatchKey").value = "";
    $w("#inpBookingEditScoreA").value = "0";
    $w("#inpBookingEditScoreB").value = "0";
    $w("#rgpBookingEditIsBye").value = "N";
    //---------boxBookingEditSystem--------------------------------
    $w("#inpBookingEditRequiredYear").value = "";
    $w("#inpBookingEditRequiredJDate").value = "";
    $w("#inpBookingEditNewKey").value = "";
    $w("#inpBookingEditEventId").value = "";
    $w("#rgpBookingEditHasChildren").value = "N";
    $w("#inpBookingEditParentId").value = "";
    $w("#drpBookingEditStatus").value = "N";
    //---------boxBookingEditBookings--------------------------------
    $w("#tblBookingEditLinks").rows = [];
}

export async function populateBookingEdit() {
    let wSelectedRecord = getSelectedItem("Booking");
    //console.log("Selected record");
    //console.log(wSelectedRecord);
    //console.log(wSelectedRecord.dateRequired);
    let [wStatus, wBooker] = await getFullNameLocally(wSelectedRecord.bookerId);
    //----------------------Linked Bookings-------------------
    $w("#tblBookingEditLinks").rows = [];
    let wBookings;
    let wNoLinks = 0;
    if (wSelectedRecord.hasChildren === "Y") {
        let wResult = await getLinkedBookings(wSelectedRecord._id);
        if (wResult.status) {
            wBookings = wResult.bookings;
            if (wBookings.length > 0) {
                let wTableData = wBookings.map((item) => {
                    return {
                        bookingId: item._id.substring(0, 8),
                        fullId: item._id,
                    };
                });
                wNoLinks = wBookings.length;
                $w("#boxBookingEditLinks").expand();
                $w("#tblBookingEditLinks").rows = wTableData;
            } else {
                $w("#boxBookingEditLinks").collapse();
            }
        } else {
            console.log(
                "/page/MaintainBooking populateEventEdit getEventBookings Failed, error"
            );
            console.log(wResult.error);
            return;
        }
    } else {
        $w("#boxBookingEditLinks").collapse();
    }

    //---------boxBookingEditHdr--------------------------------
    /**
    $w('#dpkBookingEditFromDate').disable();
    $w('#inpBookingEditSlotRange').disable();
    $w('#inpBookingEditNoRinks').disable();
    */

    let wSlot = wSelectedRecord.slotId;
    $w("#dpkBookingEditFromDate").value = wSelectedRecord.dateRequired;
    $w("#inpBookingEditSlotRange").value = wSelectedRecord.rangeId;
    $w("#inpBookingEditFromSlot").value = wSlot;

    $w("#inpBookingEditNoRinks").value = wSelectedRecord.rink;
    $w("#inpBookingEditBookingRef").value = wSelectedRecord._id;
    $w("#inpBookingEditResourceKey").value = wSelectedRecord.resourceKey;
    $w("#tpkBookingEditStartTime").value = wSelectedRecord.timeRequired;
    $w("#inpBookingEditBooker").value = wBooker;
    $w("#lblBookingEditBookerId").text = wSelectedRecord.bookerId;
    $w("#dpkBookingEditDateBooked").value = wSelectedRecord.dateBooked;
    //---------boxBookingEditPlayers--------------------------------
    $w("#inpBookingEditPlayerA").value = wSelectedRecord.playerAId;
    $w("#lblBookingEditPlayerAId").text = wSelectedRecord.playerAId;
    $w("#inpBookingEditPlayerB").value = wSelectedRecord.playerBId;
    $w("#lblBookingEditPlayerBId").text = wSelectedRecord.playerBId;
    $w("#inpBookingEditNoPlayers").value = wSelectedRecord.noPlayers;
    $w("#inpBookingEditUse").value = wSelectedRecord.usage;
    //---------boxBookingEditCompetition--------------------------------
    $w("#inpBookingEditCompRef").value = wSelectedRecord.compRef;
    $w("#inpBookingEditCompTitle").value = wSelectedRecord.compTitle;
    $w("#inpBookingEditMatchKey").value = wSelectedRecord.matchKey;
    $w("#rgpBookingEditIsBye").value = wSelectedRecord.isBye;
    $w("#inpBookingEditScoreA").value = wSelectedRecord.scoreA;
    $w("#inpBookingEditScoreB").value = wSelectedRecord.scoreB;
    //---------boxBookingEditSystem--------------------------------
    $w("#inpBookingEditRequiredYear").value = wSelectedRecord.requiredYear;
    $w("#inpBookingEditRequiredJDate").value = wSelectedRecord.requiredJDate;
    $w("#inpBookingEditNewKey").value = wSelectedRecord.newkey;
    $w("#inpBookingEditEventId").value = wSelectedRecord.eventId;
    $w("#rgpBookingEditHasChildren").value = wSelectedRecord.hasChildren || "N";
    $w("#inpBookingEditParentId").value = wSelectedRecord.parentId;
    $w("#drpBookingEditStatus").value = wSelectedRecord.status;
}

async function processRecord(
    pDate,
    pTime,
    pYear,
    pJDate,
    pStartRink,
    pNoRinks,
    pSlotRange,
    pFromSlot,
    pToSlot
) {
    const wBookerId = loggedInMember.lstId || TEMPORARY_HOLDER;
    //console.log("process rec time ", pDate, pTime);

    let wManualEvent = {
        _id: "",
        selected: false,
        startDate: pDate,
        startTime: pTime,
        requiredYear: pYear,
        requiredJDate: pJDate,
    };
    try {
        let wParams = await processManualEventType("C");
        let wBookingsList = await addBookings(
            wBookerId,
            wManualEvent,
            pStartRink,
            pNoRinks,
            pSlotRange,
            pFromSlot,
            pToSlot,
            wParams
        );
        let wResult = await processEventBookings("", wBookingsList);
        if (wResult.status) {
            let wNewBookings = wResult.bookings;
            for (let wBooking of wNewBookings) {
                updateGlobalDataStore(wBooking, "Booking");
            }
            updatePagination("Booking");
            showLocalError(3);
            return true;
        } else {
            showLocalError(4);
            return false;
        }
    } catch (err) {
        console.log(`/page/MaintainBooking  processRecord Try-catch, err`);
        console.log(err);
        return false;
    }
}

function processManualEventType(pMode) {
    let wUse = "";

    let wParams = {
        source: "M",
        title: $w("#inpBookingEditCompTitle").value,
        use: "",
        f2: $w("#inpBookingEditNoPlayers").value,
        f3: $w("#lblBookingEditPlayerAId").text,
        f5: $w("#lblBookingEditPlayerBId").text,
    };

    if (pMode === "S") {
        wUse = $w("#lblSpecialSelectedUse").text;
    } else {
        wUse = $w("#inpBookingEditUse").value;
    }
    wParams.use = wUse;

    return wParams;
}

export async function deleteExistingBookings(pId) {
    // Here we are talking about just 1 booking and its potential continuations (links)
    let wDeleteList = [];
    if ($w("#boxBookingEditLinks").collapsed) {
        wDeleteList.push(pId);
    }
    let wExistingBookings = $w("#tblBookingEditLinks").rows;
    if (wExistingBookings) {
        if (wExistingBookings.length > 0) {
            wDeleteList = wExistingBookings.map((item) => item.fullId);
            wDeleteList.push(pId);
        }
    }
    await deleteBookingList(wDeleteList);
}

export async function deleteBookingList(pList) {
    if (pList.length > 0) {
        let res = await bulkDeleteRecords(
            "MaintainBooking/deleteBookingsList",
            loggedInMember.lstId,
            "lstBookings",
            true,
            pList
        );
        await deleteGlobalDataStore(pList, "Booking");
        if (res) {
            await showError("Booking", 3, 13);
        }
    } else {
        console.log(
            "/page/MaintainBooking deleteBookingList called with nothing in list"
        );
    }
}

// =================================================Special Events ================================================
//
export function drpSpecialUse_change(event) {
    let wValue = event.target.value;
    if (wValue === "X") {
        $w("#grpSpecialUse").show();
        $w("#inpSpecialUse").focus();
        $w("#inpSpecialUse").value = "";
        $w("#lblSpecialSelectedUse").text = "";
    } else {
        $w("#grpSpecialUse").hide();
        let wUse = getUsageLabelFromValue(wValue);
        //	$w('#inpSpecialsUse').value = wUse;
        $w("#inpSpecialUse").value = $w("#drpSpecialUse").label;
        $w("#lblSpecialSelectedUse").text = wUse;
    }
}
export function inpSpecialUse_change(event) {
    let wValue = event.target.value;
    $w("#lblSpecialSelectedUse").text = wValue;
}

//-------------------------------Specials Rink and Slot CHange Routines -----------------------

export function rgpSpecialRecurringDayOfWeek_change(event) {
    //formats the date pickers
    try {
        let wDOW = event.target.value;
        rgpSpecialRecurringDayOfWeekChange(wDOW);
    } catch (err) {
        console.log(
            `/page/MaintainBooking rgpSpecialRecurringDayOfWeek_change Try-catch error`
        );
        console.log(err);
    }
}

export function tpkDuration_change(pTarget, event) {
    try {
        let wDuration = event.target.value;
        let wNewTime = addDurationToTime(
            $w(`#tpk${pTarget}StartTime`).value,
            wDuration
        );
        $w(`#tpk${pTarget}EndTime`).value = wNewTime;
        gSlotRinkChange = true;
        doCalcTimeChange(pTarget);
    } catch (err) {
        console.log(
            `/page/MaintainBooking tpkDuration_change ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

export function tpkStartTime_change(pTarget, event) {
    try {
        let wTime = event.target.value;
        let wNewTime = addDurationToTime(
            wTime,
            $w(`#tpk${pTarget}Duration`).value
        );
        $w(`#tpk${pTarget}EndTime`).value = wNewTime;
        gSlotRinkChange = true;
        doCalcTimeChange(pTarget);
    } catch (err) {
        console.log(
            `/page/MaintainBooking tpkStartTime_change ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

function doCalcTimeChange(pTarget) {
    try {
        $w(`#inp${pTarget}FromSlot`).value = String(
            getStartSlot($w(`#tpk${pTarget}StartTime`).value) + 1
        );
        $w(`#inp${pTarget}ToSlot`).value = String(
            getEndSlot($w(`#tpk${pTarget}EndTime`).value) + 1
        );
    } catch (err) {
        console.log(
            `/pageMaintainBooking doCalcTimeChange ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

function addDurationToTime(time, duration) {
    // Split the time and duration strings into hours and minutes
    const [timeHours, timeMinutes] = time.split(":").map(Number);
    const [durationHours, durationMinutes] = duration.split(":").map(Number);

    // Calculate new hours and minutes by adding duration
    let newHours = timeHours + durationHours;
    let newMinutes = timeMinutes + durationMinutes;

    // Adjust if minutes exceed 60
    newHours += Math.floor(newMinutes / 60);
    newMinutes %= 60;

    // Format hours and minutes to always have two digits
    const formattedHours = String(newHours).padStart(2, "0");
    const formattedMinutes = String(newMinutes).padStart(2, "0");

    // Return the new time
    return `${formattedHours}:${formattedMinutes}`;
}

export async function dpkFromDate_change(pTarget, event) {
    try {
        let wDate = event.target.value;
        $w(`#dpk${pTarget}EndDate`).value = wDate;
        $w(`#inp${pTarget}RequiredYear`).value = String(wDate.getFullYear());
        $w(`#inp${pTarget}RequiredJDate`).value = String(DateToOrdinal(wDate));
        gSlotRinkChange = true;
        await doCalcRinksSlots(pTarget);
    } catch (err) {
        console.log(
            `/page/MaintainBooking dpkFromDate_change ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

export async function doCalcRinksSlots(pTarget) {
    try {
        let wStartTime = $w(`#tpk${pTarget}StartTime`).value;
        let wTemp = $w(`#tpk${pTarget}Duration`).value;
        let wDuration = wTemp.substring(0, 5);
        let wRequiredDate = $w(`#dpk${pTarget}FromDate`).value;
        let [wRinksFree, wNoSlots, wStartRink, wSlotRange, wFromSlot, wToSlot] =
            await getRinksAndSlots(wRequiredDate, wStartTime, wDuration);
        //console.log("GARS rinksfree, startrink, slotrange, fromSlot, toslot", wRinksFree, wStartRink, wSlotRange, wFromSlot, wToSlot);
        $w(`#lbl${pTarget}MaxSlots`).text = String(wNoSlots);
        $w(`#inp${pTarget}SlotRange`).value = String(wSlotRange);
        $w(`#inp${pTarget}StartRink`).value = String(wStartRink);
        $w(`#lbl${pTarget}MaxRinks`).text = String(wRinksFree);
        if (wRinksFree === 0) {
            $w(`#inp${pTarget}NoRinks`).disable();
            $w(`#inp${pTarget}NoRinks`).value = "0";
        } else {
            $w(`#inp${pTarget}NoRinks`).enable();
            $w(`#inp${pTarget}NoRinks`).value = String(
                wRinksFree - wStartRink + 1
            );
            $w(`#inp${pTarget}NoRinks`).max = wRinksFree - wStartRink + 1;
            $w(`#inp${pTarget}StartRink`).max = wRinksFree;
        }
        $w(`#inp${pTarget}FromSlot`).value = String(wFromSlot);
        $w(`#inp${pTarget}ToSlot`).value = String(wToSlot);
    } catch (err) {
        console.log(
            `/page/MaintainBooking doCalcRinksSlots ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

export function inpNoRinks_change(pTarget, event) {
    try {
        const wNoOfRinks = parseInt($w(`#lbl${pTarget}MaxRinks`).text, 10);

        let wY = parseInt($w(`#inp${pTarget}StartRink`).value, 10);
        let wRinksMax = wNoOfRinks - wY + 1;
        $w(`#inp${pTarget}NoRinks`).max = wRinksMax;
        $w(`#inp${pTarget}StartRink`).max = wNoOfRinks;
        gSlotRinkChange = true;
        //console.log("Rinks change", wNoOfRinks, wY, wRinksMax);
    } catch (err) {
        console.log(
            `/page/MaintainBooking inpNoRinks_change ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

export function inpStartRink_change(pTarget, event) {
    try {
        const wNoOfRinks = parseInt($w(`#lbl${pTarget}MaxRinks`).text, 10);

        let wY = parseInt($w(`#inp${pTarget}StartRink`).value, 10);
        let wRinksMax = wNoOfRinks - wY + 1;
        $w(`#inp${pTarget}NoRinks`).value = String(wRinksMax);
        $w(`#inp${pTarget}NoRinks`).max = wRinksMax;
        $w(`#inp${pTarget}StartRink`).max = wNoOfRinks;
        gSlotRinkChange = true;
        //console.log("Rinks change", wNoOfRinks, wY, wRinksMax);
    } catch (err) {
        console.log(
            `/page/MaintainBooking inpStartRink_change_change ${pTarget} Try-catch error`
        );
        console.log(err);
    }
}

function rgpSpecialRecurringDayOfWeekChange(pDay) {
    try {
        let wDisabledDays = [...Array(7).keys()]; //remove entry for DOW slected
        wDisabledDays.splice(pDay, 1);
        $w("#dpkSpecialRecurringFromDate").disabledDaysOfWeek = wDisabledDays;
        $w("#dpkSpecialRecurringEndDate").disabledDaysOfWeek = wDisabledDays;
    } catch (err) {
        console.log(
            `/page/MaintainBooking rgpSpecialRecurringDayOfWeekChange Try-catch error`
        );
        console.log(err);
    }
}

//-------------------------------Main format again------------------

export async function doBtnSpecialCreateClick() {
    showLocalWait();
    //---------------------Validations---------------------------------
    if ($w("#lblSpecialSelectedUse").text === "") {
        showLocalError(1);
        $w("#grpSpecialUse").show();
        $w("#drpSpecialUse").value = "X";
        $w("#inpSpecialUse").value = "";
        $w("#lblSpecialSelectedUse").text = "Other";
        $w("#inpSpecialUse").focus();
        return;
    }
    if (gSpecialMode === MODE.PRIME) {
        if (!$w("#inpSpecialRecurringSlotRange").valid) {
            showLocalError(2);
            $w("#inpSpecialRecurringSlotRange").focus();
            return;
        }
        if (!$w("#inpSpecialRecurringNoRinks").valid) {
            showLocalError(2);
            $w("#inpSpecialRecurringNoRinks").focus();
            return;
        }
        if (!$w("#inpSpecialRecurringStartRink").valid) {
            showLocalError(2);
            $w("#inpSpecialRecurringStartRink").focus();
            return;
        }
        if (!$w("#inpSpecialRecurringNoOfPlayers").valid) {
            showLocalError(2);
            $w("#inpSpecialRecurringNoOfPlayers").focus();
            return;
        }
    } else {
        // put any All Day validation in here
    }
    //---------------------Main---------------------------------

    $w("#imgSpecialWait").show();
    let wResult;
    if (gSpecialMode === MODE.CREATE) {
        wResult = await performAllDay();
    }
    if (gSpecialMode === MODE.PRIME) {
        wResult = await performRecurring();
    }
    if (gSpecialMode === MODE.MOVE) {
        wResult = await performMoveAllDay();
    }
    if (wResult.status) {
        let wNewBookings = wResult.bookings;
        for (let wBooking of wNewBookings) {
            updateGlobalDataStore(wBooking, "Booking");
        }
        updatePagination("Booking");
        showLocalError(3);
    } else {
        showLocalError(4);
    }
    hideLocalWait();
    gSpecialMode = MODE.CLEAR;
}

export async function doBtnSpecialCancelClick() {
    console.log(
        "/page/MaintainBooking doBtnSPecialCancel Cancel ",
        gSpecialMode
    );
}

export async function btnSpecialDailyReport_click(event) {
    let wDate = $w("#dpkSpecialRequiredDate").value;
    wDate.setHours(10, 0, 0, 0);
    let wDateString = toJulian(wDate);
    let wYear = parseInt(wDateString.substr(0, 4), 10);
    let wJDay = parseInt(wDateString.substr(4, 3), 10);
    let w_book_out = [];
    w_book_out = await getBookingsForJulianDate(wYear, wJDay);

    let wComp = {};
    let wNoSlots = w_grid.noOfSlots;
    let wNoRinks = w_grid.noOfRinks;
    let wLines = [];
    for (let y = 1; y < wNoSlots + 1; y++) {
        let wLine = [];
        for (let x = 0; x < 7; x++) {
            let wCell = w_grid.getCell(y, x);
            let wS = "";
            if (x === 0) {
                wS = "\n" + w_time_slots[y - 1].txt;
            } else {
                if (wCell.status !== "B") {
                    wS = "";
                } else {
                    let wTemp = w_book_out.filter(
                        (item) => item.slotId === y && item.rink === x
                    );
                    let wBooking = wTemp[0];
                    wS = await processBooking(wBooking, wCell, wComp);
                }
            }
            wLine.push(wS);
        }
        wLine.push("");
        wLines.push(wLine);
    }
    const options = { year: "numeric", month: "short", day: "numeric" };
    let wCalDate = $w("#dpkSpecialRequiredDate").value;
    let wCalDateString = wCalDate.toLocaleDateString("en-GB", options);
    let wParams = { rows: wLines, calDate: wCalDateString };

    $w("#html1").postMessage(wParams);
}

// =================================================Special Supporting Functions =================================================
//##
let gBookingsToMove = [];

async function processBooking(pRec, pCell, pComp) {
    let wS = "";
    //console.log(pRec);
    //console.log(pCell);
    if (pRec.compRef.includes("MANUAL") || pRec.compRef.includes("EVENT")) {
        wS =
            pCell.header +
            "\n" +
            pCell.noPlayers +
            "\n" +
            getNamesString(pCell);
    } else {
        if (pRec.compRef !== pComp.compRef) {
            pComp = await getCompetition(pRec.requiredYear, pRec.compRef);
        }
        //TODO: Review this in light of competition changes
        if (pComp.gameType > 1) {
            wS = await getTeamNames(pRec, pComp.compRef, pRec.matchKey);
        } else {
            wS = pCell.playerA + "\n V \n" + pCell.playerB + "\n";
        }
        wS = pCell.compTitle + "\n" + pCell.usage + "\n" + wS;
    }
    return wS;
}

function getNamesString(pCell) {
    let wAId = pCell.playerAId;
    let wBId = pCell.playerBId;
    if (wAId === null || wAId === "undefined" || wAId === TEMPORARY_HOLDER) {
        if (
            wBId === null ||
            wBId === "undefined" ||
            wBId === TEMPORARY_HOLDER
        ) {
            return "";
        } else {
            return pCell.playerB + "\n";
        }
    } else {
        if (
            wBId === null ||
            wBId === "undefined" ||
            wBId === TEMPORARY_HOLDER
        ) {
            return pCell.playerA + "\n";
        } else {
            return pCell.playerA + "\n V \n" + pCell.playerB;
        }
    }
}

async function getTeamNames(pRec, pCompRef, pMatchKey) {
    const wStage = parseInt(pMatchKey.substring(1, 3), 10);
    const wDiv = parseInt(pMatchKey.substring(4, 6), 10);
    //console.log(pMatchKey, wStage, wDiv);
    const wAllCompetitors = await loadCompCompetitors(gYear, pCompRef); //clubcomp.js
    //console.log("All Competitors");
    //console.log(wAllCompetitors);
    const wCompetitors = wAllCompetitors
        .filter((item) => item.stage === wStage)
        .filter((item) => item.div === wDiv);
    //console.log("filtered", wStage, wDiv);
    //console.log(wCompetitors);
    const wCompetitorA = wCompetitors.filter(
        (item) => item.skipId === pRec.playerAId
    );
    const wCompetitorB = wCompetitors.filter(
        (item) => item.skipId === pRec.playerBId
    );
    //console.log("Competitor A & B");
    //console.log(wCompetitorA);
    //console.log(wCompetitorB);
    const wATeam = wCompetitorA[0].teamNames;
    const wBTeam = wCompetitorB[0].teamNames;
    //console.log("Team Names A & B");
    //console.log(wATeam, wBTeam);
    const wAString = wATeam.join("\n");
    const wBString = wBTeam.join("\n");
    return wAString + "\n V \n" + wBString + "\n";
}

export function doBtnSpecialAToBookingClick(event) {
    $w("#secBooking").expand();
    $w("#secSpecial").collapse();
    gSpecialMode = MODE.CLEAR;
}

export function doBtnSpecialAToRecurringClick(event) {
    $w("#boxSpecialRecurring").expand();
    $w("#boxSpecialAllDay").collapse();
    $w("#boxSpecialMoveAllDay").collapse();
    $w("#boxSpecialPrime").collapse();
    $w("#tpkSpecialRecurringStartTime").value = "10:00";
    $w("#tpkSpecialRecurringEndTime").value = "13:00";
    $w("#tpkSpecialRecurringDuration").value = "03:00";
    $w("#txtSpecialRecurringBookedBy").text = loggedInMember.name;
    $w("#rgpSpecialRecurringDayOfWeek").scrollTo();
    doCalcTimeChange("SpecialRecurring");

    $w("#lblSpecialsTitle").text = "Recurring";
    gSpecialMode = MODE.PRIME;
}

export function doBtnSpecialAToAllDayClick(event) {
    $w("#boxSpecialRecurring").collapse();
    $w("#boxSpecialAllDay").expand();
    $w("#boxSpecialMoveAllDay").collapse();
    $w("#boxSpecialPrime").expand();

    $w("#lblSpecialsTitle").text = "All Day";
    gSpecialMode = MODE.CREATE;
}

export async function doBtnSpecialMoveAllDayClick() {
    $w("#boxSpecialRecurring").collapse();
    $w("#boxSpecialAllDay").collapse();
    $w("#boxSpecialMoveAllDay").expand();
    $w("#boxSpecialPrime").collapse();

    $w("#boxSpecialMoveNoEvents").collapse();
    $w("#boxSpecialMoveEvents").collapse();

    $w("#lblSpecialMoveNoFrom").text = "10";
    $w("#lblSpecialMoveNoTo").text = "0";

    let wToday = new Date();
    let wJDate = DateToOrdinal(wToday);
    $w("#dpkSpecialMoveFromDate").value = wToday;
    let [wBookingsForDay] = await getBookingsForDay(wJDate);
    $w("#lblSpecialMoveNoFrom").text = String(wBookingsForDay);
    $w("#dpkSpecialMoveToDate").value = wToday;
    $w("#lblSpecialMoveNoTo").text = String(wBookingsForDay);

    $w("#boxSpecialMoveNoEvents").collapse();
    $w("#boxSpecialMoveEvents").collapse();

    gBookingsToMove = [];

    gSpecialMode = MODE.MOVE;
}

export async function doDpkSpecialMoveDateChange(pType, event) {
    let wDate = event.target.value;

    let wJDate = DateToOrdinal(wDate);
    let [wNo, wBookings] = await getBookingsForDay(wJDate);

    if (pType === "F") {
        gBookingsToMove = [...wBookings];
        $w("#lblSpecialMoveNoFrom").text = String(wNo);
        checkBookingsForEvents(wBookings);
    } else {
        $w("#lblSpecialMoveNoTo").text = String(wNo);
    }
}

function checkBookingsForEvents(pBookings) {
    if (pBookings && pBookings.length > 0) {
        let wEventBookings = pBookings.filter(
            (item) =>
                item.eventId !== undefined &&
                item.eventId !== null &&
                item.eventId !== ""
        );
        let wMasterBookings = wEventBookings.filter(
            (item) => item.parentId === ""
        );
        if (wMasterBookings && wMasterBookings.length > 0) {
            $w("#boxSpecialMoveNoEvents").collapse();
            $w("#boxSpecialMoveEvents").expand();

            let seenEventIds = new Set();
            let wEventAndBooking = [];
            //let wEventIdsToUpdate = [];

            wMasterBookings.forEach((booking) => {
                if (!seenEventIds.has(booking.eventId)) {
                    seenEventIds.add(booking.eventId);
                    wEventAndBooking.push(booking); // push the first occurrence of this eventId to B
                }
            });
            //wEventIdsToUpdate = [...seenEventIds];
            let wTableData = wEventAndBooking.map((item) => {
                return {
                    eventId: item.eventId.substring(0, 6),
                    id: item.eventId,
                    timeRequired: item.timeRequired,
                    usage: item.usage,
                    subject: item.compTitle,
                };
            });
            $w("#tblSpecialMoveEvents").rows = wTableData;
        } else {
            $w("#boxSpecialMoveNoEvents").expand();
            $w("#boxSpecialMoveEvents").collapse();
            $w("#tblSpecialMoveEvents").rows = [];
        }
    } else {
        $w("#boxSpecialMoveNoEvents").collapse();
        $w("#boxSpecialMoveEvents").collapse();
    }
}

async function getBookingsForDay(pJDate) {
    let wBookingsForDay = await getBookingsForJulianDate(gYear, pJDate);
    let wNoBookings = wBookingsForDay ? String(wBookingsForDay.length) : "0";
    return [wNoBookings, wBookingsForDay];
}

export async function performAllDay() {
    if (!isRequiredRole(["Manager", "Admin"], loggedInMemberRoles)) {
        showLocalError(5);
        $w("#imgSpecialWait").hide();
        return { status: false, result: null, error: "Validation error" };
    }
    let wDate = $w("#dpkSpecialRequiredDate").value;
    wDate.setHours(10, 0, 0, 0);
    let wYear = parseInt(wDate.getFullYear(), 10);
    let wMonth = parseInt(wDate.getMonth(), 10);
    let wJDate = DateToOrdinal(wDate);

    let wManualEvent = {
        _id: "",
        selected: false,
        startDate: wDate,
        startTime: "10:00",
        requiredYear: wYear,
        requiredJDate: wJDate,
    };

    let wBookerId = loggedInMember.lstId || TEMPORARY_HOLDER;

    let wParams = await processManualEventType("S");
    let [wRinksFree, wNoSlots, wStartRink, wSlotRange, wFromSlot, wToSlot] =
        await getRinksAndSlots(wDate, "10:00", 10);

    let wBookingsList = await addBookings(
        wBookerId,
        wManualEvent,
        1,
        wRinksFree,
        wSlotRange,
        wFromSlot,
        wToSlot,
        wParams
    );
    let wResult = await processEventBookings("", wBookingsList);
    //let wResult.status = true;
    if (wResult.status) {
        console.log("/page/MaintainBooking performAllDay Bookings saved");
        return wResult;
    } else {
        console.log(
            "/page/MaintainBooking performAllDay error writing bookings"
        );
        return wResult;
    }
}

export async function performRecurring() {
    //console.log("Recurring");
    $w("#imgSpecialWait").show();
    let wNewBookings = [];

    let dteFrom = $w("#dpkSpecialRecurringFromDate").value;
    let wYear = dteFrom.getFullYear();
    let wFrom = DateToOrdinal(dteFrom);
    let wTo = DateToOrdinal($w("#dpkSpecialRecurringEndDate").value);
    //console.log("From ", wFrom, " To ", wTo);
    let wJDate = wFrom;

    let wDateRequired = $w("#dpkSpecialRecurringFromDate").value;
    wDateRequired.setHours(10, 0, 0, 0);

    let wNoRinks = parseInt($w("#inpSpecialRecurringNoRinks").value, 10);
    let wStartRink = parseInt($w("#inpSpecialRecurringStartRink").value, 10);
    let wFromSlot = parseInt($w("#inpSpecialRecurringFromSlot").value, 10);
    let wToSlot = parseInt($w("#inpSpecialRecurringToSlot").value, 10);
    let wSlotRange = parseInt($w("#inpSpecialRecurringSlotRange").value, 10);

    let wBookerId = loggedInMember.lstId || TEMPORARY_HOLDER;

    let wBookingsList = [];
    let wParams = await processManualEventType("S");
    // Note getRinksAndSlots has been performed at the user level and the values in the
    // input fields reflect these choices.

    while (wJDate <= wTo && wJDate < 367) {
        let wManualEvent = {
            _id: "",
            selected: false,
            startDate: wDateRequired,
            duration: "01:30",
            startTime: "10:00",
            requiredYear: wYear,
            requiredJDate: wJDate,
        };
        let [wRinksFree, wStart] = await getNoFreeRinks(
            gYear,
            wJDate,
            wSlotRange,
            wFromSlot
        );

        if (wRinksFree === 0) {
            console.log(
                "/page/MaintainBooking performRecurring No rinks available to book for this date",
                wDateRequired
            );
            showLocalError(6);
            return;
        } else if (wRinksFree < wNoRinks) {
            wBookingsList = await addBookings(
                wBookerId,
                wManualEvent,
                wStartRink,
                wRinksFree,
                wSlotRange,
                wFromSlot,
                wToSlot,
                wParams
            );
            console.log(
                `/page/MaintainBooking performRecurring  Only ${wRinksFree} bookings out of ${wNoRinks} can be recorded for date`,
                wDateRequired.toLocaleDateString()
            );
        } else {
            wBookingsList = await addBookings(
                wBookerId,
                wManualEvent,
                wStartRink,
                wNoRinks,
                wSlotRange,
                wFromSlot,
                wToSlot,
                wParams
            );
            console.log(
                `/page/MaintainBooking performRecurring  Made all (${wNoRinks}) bookings recorded for date`,
                wDateRequired.toLocaleDateString()
            );
        }
        let wResult = await processEventBookings("", wBookingsList);
        //let wStatus = true;
        if (wResult.status) {
            let wSavedBookings = wResult.bookings;
            wNewBookings.push(...wSavedBookings);
        } else {
            console.log(
                "/page/MaintainBooking performRecurring  error writing bookings, err"
            );
            console.log(wResult.error);
        }
        wDateRequired.setDate(wDateRequired.getDate() + 7);
        wJDate = DateToOrdinal(wDateRequired);
    }
    return { status: true, bookings: wNewBookings, error: null };
}

export async function performMoveAllDay() {
    let wNewBookings = [];

    if (!isRequiredRole(["Manager", "Admin"], loggedInMemberRoles)) {
        showLocalError(5);
        $w("#imgSpecialWait").hide();
        return { status: false, result: null, error: "permissions error" };
    }
    if (parseInt($w("#lblSpecialMoveNoFrom").text, 10) === 0) {
        showLocalError(8);
        $w("#dpkSpecialMoveFromDate").focus();
        return {
            status: false,
            result: null,
            error: "From Date validation error",
        };
    }
    if (parseInt($w("#lblSpecialMoveNoTo").text, 10) > 0) {
        showLocalError(9);
        $w("#dpkSpecialMoveToDate").focus();
        return {
            status: false,
            result: null,
            error: "To Date validation error",
        };
    }

    let wToDate = parseDT($w("#dpkSpecialMoveToDate").value);

    let wResult = await writeNewBookings(wToDate);
    if (wResult.status) {
        wNewBookings = wResult.bookings;
        let wResult2 = await updateEvents(wToDate);
        if (wResult2.status) {
            let wDeleteList = gBookingsToMove.map((item) => item._id);
            await deleteBookingList(wDeleteList);
            return { status: true, bookings: wNewBookings, error: null };
        } else {
            console.log(
                "/page/MaintainBooking performMoveAllDay eventUpdate fail, err"
            );
            console.log(wResult.error);
            return { status: false, bookings: [], error: wResult2.error };
        }
    } else {
        console.log(
            "/page/MaintainBooking performMoveAllDay writeNewBooking fail, err"
        );
        console.log(wResult.error);
        return { status: false, bookings: [], error: wResult.error };
    }
}

export function parseDT(pDate) {
    let wYear = pDate.getFullYear();
    let wMonth = pDate.getMonth();
    let wDate = pDate.getDate();
    let wJDate = DateToOrdinal(pDate);
    return { year: wYear, month: wMonth, date: wDate, jdate: wJDate };
}

async function updateEvents(pToDate) {
    if ($w("#tblSpecialMoveEvents").collapsed) {
        return { status: true, events: [], error: "" };
    }
    let wEventList = $w("#tblSpecialMoveEvents").rows;
    let wNewEvents = [];
    for (let wEvent of wEventList) {
        let wTime = wEvent.timeRequired;
        let wId = wEvent.id;
        let wResult = await updateEventStartDate(wId, pToDate, wTime);
        //let wResult = { "status": true};
        if (!wResult.status) {
            console.log("/page/MaintainBooking updateEvents fail, wId", wId);
            console.log(wResult.error);
            return {
                status: false,
                event: wResult.event,
                error: wResult.error,
            };
        }
        wNewEvents.push(wResult.event);
    }
    return { status: true, events: wNewEvents, error: "" };
}

async function writeNewBookings(pToDate) {
    let wNewBookings = [];
    let wStatus = true;
    /**
     *
    let wToYear = parseInt(pToDate.getFullYear(), 10);
	let wToMonth = parseInt(pToDate.getMonth(), 10);
	let wToJDate = DateToOrdinal(pToDate);
    */
    if (gBookingsToMove && gBookingsToMove.length == 0) {
        console.log(
            "/page/MaintainEvent performRecurring writeNewBookings Nowt"
        );
    }
    let wToYear = pToDate.year;
    let wToMonth = pToDate.month;
    let wToDate = pToDate.date;
    let wToJDate = pToDate.jdate;

    let wToday = new Date();
    let wBookerId = loggedInMember.lstId;
    let wSortedBookings = _.sortBy(gBookingsToMove, ["rink", "slotId"]);

    let wLastId = "";
    for (let wOldBooking of wSortedBookings) {
        let wNewBooking = { ...wOldBooking };

        let wResourceKey =
            String(wToYear) +
            String(wToJDate).padStart(3, "0") +
            "S" +
            String(wOldBooking.slotId).padStart(2, "0") +
            "R" +
            String(wOldBooking.rink).padStart(2, "0");

        let wOldTime = wOldBooking.timeRequired;
        let wBits = wOldTime.split(":");
        let wHours = parseInt(wBits[0], 10);
        let wMins = parseInt(wBits[1], 10);

        let wDateRequired = new Date(
            wToYear,
            wToMonth,
            wToDate,
            wHours,
            wMins,
            0
        );

        wNewBooking._id = undefined;
        wNewBooking.dateRequired = wDateRequired;
        wNewBooking.dateBooked = wToday;
        wNewBooking.bookerId = wBookerId;
        wNewBooking.requiredYear = wToYear;
        wNewBooking.requiredMonth = wToMonth;
        wNewBooking.requiredJDate = wToJDate;
        wNewBooking.resourceKey = wResourceKey;
        wNewBooking.pId = wResourceKey;
        wNewBooking.parentId = wOldBooking.parentId !== "" ? wLastId : "";
        let wResult = await saveRecord("lstBookings", wNewBooking);
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            if (wOldBooking.hasChildren === "Y") {
                wLastId = wSavedRecord._id;
            }
            wNewBookings.push(wSavedRecord);
        } else {
            console.log(
                "/page/MaintainBooking writeNewBooking fail, resourceKey = ",
                wResourceKey,
                " err"
            );
            console.log(wResult.error);
            wStatus = false;
        }
    }
    if (wStatus) {
        return { status: true, bookings: wNewBookings, error: "" };
    } else {
        return {
            status: false,
            bookings: [],
            error: "failed to write new bookings",
        };
    }
}

function getUsageLabelFromValue(pValue) {
    // you can get this directly from dropdown
    let wUse = "";
    switch (pValue) {
        case "X":
            wUse = "Other";
            break;
        case "M":
            wUse = "Mays Day";
            break;
        case "T":
            wUse = "Tom Linscott";
            break;
        case "C":
            wUse = "Club Night";
            break;
        case "R":
            wUse = "Club Roll Up";
            break;
        case "F":
            wUse = "Fun day";
            break;
        default:
            wUse = pValue;
    }
    return wUse;
}

export function showLocalError(pErrNo, pErrMsg = "") {
    let wMsg = [
        "Must specify a use",
        "All day validation issue",
        "All Bookings Done",
        "Error writing bookings",
        "Must be a Manager", //5
        "No rinks available",
        "Record Update Ok",
        "From date invalid",
        "To date invalid",
        "",
    ];
    let wControlName = `#txtSpecialErrMsg`;
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
    return;
}

function showLocalWait() {
    $w("#imgSpecialWait").show();
    $w("#btnSpecialACreate").disable();
}
function hideLocalWait() {
    $w("#imgSpecialWait").hide();
    $w("#btnSpecialACreate").enable();
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
