// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow            from 'wix-window';
import wixLocation          from 'wix-location';
import { authentication }   from 'wix-members-frontend';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } 		        from 'public/objects/member';

import { getCompBookings } from 'public/objects/booking.js';
import { getUnscheduledMatches } from 'public/objects/clubComp.js';
import { formatDateString } from 'public/fixtures.js';
import { DateToOrdinal } from 'public/objects/booking.js';
import { getEndSlot } from 'public/objects/booking.js';
import { saveRecord } from 'backend/backEvents.jsw';

import { updateCompBooking } from 'public/objects/booking.js';
import { updateBookingStatus } from 'public/objects/booking.js';
import { getBookingsForJulianDate } from 'public/objects/booking.js';
import { sendMsg } from 'backend/backMsg.web';

import { sendConfirmationEmail } from 'backend/email.jsw';
import { BookingGrid } from 'public/classes/bookingGrid.js'
import { BookingCell } from 'public/classes/bookingCell.js'
import { toJulian } from 'public/fixtures';

import { COMPETITION, STAGE, COMPETITOR } from 'public/objects/clubComp';
import { COMPETITOR_TYPE } from 'public/objects/clubComp';
import { BOOKING } from 'public/objects/booking';
import { convertNull } from 'public/objects/clubComp';
import { loadGlobalCompetitors } from 'public/objects/clubComp';
import { loadCompetitions } from 'public/objects/clubComp';
import { loadManualCompetitions } from 'public/objects/clubComp';
import { selectCompetition } from 'public/objects/clubComp';
import { selectStage } from 'public/objects/clubComp';
import { selectDivision } from 'public/objects/clubComp';
import { selectRound } from 'public/objects/clubComp';
import { getCompetition } from 'public/objects/clubComp';
import { getAllBookableCompetitions } from 'public/objects/clubComp';
import { addBookings }   from 'backend/backBookings.jsw';
import { processEventBookings }   from 'backend/backBookings.jsw';
import { deleteLinkedBookings }   from 'backend/backBookings.jsw';
import { getLinkedBookings }   from 'backend/backBookings.jsw';

import { initialiseRinksArray } from 'public/objects/booking';
import { getRinksForDay }           from 'public/objects/booking';
import { getSlotsForDay, getSlotString } from 'public/objects/booking';
import { getTimeSlotStart }             from 'public/objects/booking';
import { buildMemberCache } from 'public/objects/member';
import { getFullNameLocally } from 'public/objects/member';

let gSlot = 0;
let gRink = 0;
let gRangeId = 1;

let gNoSlots = 0;
let gNoRinks = 0;
let gSlotString = "";

let gSelectedCell = new BookingCell(1,"00","O");
let gFromCell = new BookingCell(1,"00","O");

const MODE = Object.freeze({
  BOOK:	"Book",
  EDIT:	"Edit",
  MOVE:	"Move",
  SCHEDULE:	"Schd",
});


let gMode = MODE.BOOK;
let gEmail = true;

let gMobileIndex = 0;
let gMobileView = "S"

let gCompRec;
let gStageRec;
let gMatchesInRound;

let gGrid;

let gMembers = [];
let loggedInMember;
let loggedInMemberRoles;

let gYear = 0;

let gCompetitions = [];

const wFreeColour = "#CFCF9B";
const wSelectedColour = "#FFA500";
const wNotInUseColour = "rgba(180,180,180, 0.3)";
const wBookedColour = "#F2BF5E";
const BUTTON_SELECTED = "rgb(130,159,202)";
const BUTTON_NORMAL = "rgb(182,243,232)";

// for testing ------	------------------------------------------------------------------------
let gTest = true;
let wTrev = "7e864e0b-e8b1-4150-8962-0191b2c1245e";
let wTim = "2292e639-7c69-459b-a609-81c63202b1ac";
let wTony = "28f0e772-9cd9-4d2e-9c6d-2aae23118552";
let wJohn = "40a77121-3265-4f0c-9c30-779a05366aa9";
// ------------------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {

    try {
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

        // end of esting fudge---------------
        
        [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

        if (isLoggedIn) {
            let wRoles = loggedInMemberRoles.toString();
            console.log("/page/Booking onReady/ Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/Booking onReady/ Not signed in");
        }
        //console.log(isLoggedIn, loggedInMember, loggedInMemberRoles);

        let wQuery = wixLocation.query;
        //console.log(wQuery);
        let wYear = parseInt(wQuery.requiredYear, 10);
        let wDate = new Date();
        gYear = wDate.getFullYear();
        if (!isNaN(wYear)) {
            let wMonth = parseInt(wQuery.requiredMonth, 10);
            let wDay = parseInt(wQuery.requiredDay, 10);
            wDate = new Date(wYear, wMonth, wDay);
        }
        wDate.setHours(10, 0, 0, 0);

        await buildMemberCache();
        gCompetitions = await loadCompetitions(gYear);
        if (!gCompetitions || gCompetitions.length === 0){
            $w('#secHdr').collapse();
            $w('#secSysError').expand();
            $w('#secDesktop').collapse();
            $w('#secBookingDetail').collapse();
            $w('#secMobile').collapse();
            showError(13);
            return;
        }
        /**
         * this is crude, but will do for the moment. To modify the number of time slots in use, modify
         * first paramter of BookingGrid below. Rinks are managed OK on a daily basis.
         */
        gGrid = new BookingGrid(5, 6);
        gGrid.initialiseGrid();
        //gGrid.printGrid();

        $w('#secHdr').expand();
        if (wixWindow.formFactor === "Mobile") {
            //console.log("on ready start ", Date().toString());
            $w('#secSysError').collapse();
            $w('#secDesktop').collapse();
            $w('#secBookingDetail').collapse();
            $w('#secMobile').expand();
            //loadRowsM();
            loadGridM();

            $w('#btnMLast').hide();
            $w('#lblMobilePgnHdr').text = getSlotString(gMobileIndex, true);

        } else {
            $w('#secSysError').collapse();
            $w('#secDesktop').expand();
            $w('#secMobile').collapse();
            $w('#secBookingDetail').collapse();

            loadCols();
            loadGridD();

        }
    //--------------------------------Event Handlers------------------------------------------------------------------
    // -------------------------------Desktop Event Handlers-----------------------------------------------------------
        $w('#cntBookingDesktop').onClick( (event) => { cnt_click(event)});
        $w('#chkOwnUse').onChange( (event) => { chkOwnUse_change(event)});
        $w('#btnBookRink').onClick( (event) => { btnBookRink_click(event)} );
        $w('#btnBookBottom').onClick( (event) => { btnBookRink_click(event)} );
        

    /**
    btnMove_click(event);
    btnLast_click(event)
    btnNext_click(event)
    dpkStartDate_change()
    btnBookBottom & btnBookRink btnBookRInk_click(event)
    boxColsHdr box_click(event)
    boxnn lbl_click(event)          //there is an overlaying boxn0
    cjkOwnUse chkOwnUse_change((event)
    btnLadiesComp_click
    btnLadiesComp_mouseIn
    btnMensComp_click
    btnMixedComp_click
    btnNational_click
    btnCounty_click
    btnOther_click
    btnOther_click
    drpCompetition_change

    drpRound_change
    drpStage_change
    drpDivision_change
    boxGames_click

    btnPlayerA_click
    btnPlayerB_click
    btnAClear_click
    btnBClear_click

    inpNoPlayers_change

    btnDelete_click
    btnCancel_click
    btnSave_click

    contM cntBookingMobile_click(event)

    */
    // -------------------------------Mobile Event Handlers-----------------------------------------------------------
        $w('#cntBookingMobile').onClick( (event) => { cnt_click(event)});
        $w('#btnMLast').onClick( (event) => {btnMLast_click(event)});
        $w('#btnMNext').onClick( (event) => {btnMNext_click(event)});
        $w('#rgpMobileView').onChange( (event) => {rgpMobileView_change(event)});
         
    //--------------------------------Repeaters-------------------------------------------------------------------------
    //

        $w('#dpkStartDate').value = wDate;
        dpkStartDate_change();

        $w("#rptGames").onItemReady(async ($item, itemData, index) => {
            await loadrptGames($item, itemData, index);
        });

        $w("#rptCols").onItemReady(($item, itemData, index) => {
            loadRptCols($item, itemData);
        });

        $w("#rptGrid").onItemReady(async ($item, itemData, index) => {
            loadRptGridD($item, itemData, index);
        });

        $w("#rptGridM").onItemReady(($item, itemData, index) => {
            loadRptGridM($item, itemData, index);
        });
    //---------------------------------Custom Validation-------------------------------------------------------------------------
    //

    }
    catch (err) {
        if (isLoggedIn) {
            console.log(`/page/Booking by ${loggedInMember.lstId} onReady Try-catch, err`);
        } else {
            console.log("/page/Booking onReady not logged on Try-catch, err")
        }
        console.log(err);
        if (!gTest) { wixLocation.to("/syserror")};
    }
})

//=========================================Repeater Load Functions =======================================================
function loadCols() {
    let wData = [];
    wData.push({ "_id": "0", "txt": "Slots/ Rinks" });
    for (let i = 1; i < 7; i++) {
        if (i < gNoRinks + 1) {
            wData.push({ "_id": String(i), "txt": String(i) });
        } else {
            wData.push({ "_id": String(i), "txt": String(i) + " : Not Used" });
        }
    }
    if ($w('#rptCols').data[0]._id === wData[0]._id) {
        $w('#rptCols').forEachItem(($item, itemData, index) => {
            $item("#lblColHdr").text = wData[index].txt;
        })
    } else {
        $w("#rptCols").data = wData;
    }
}

async function loadGridD() {
    try {
        let wS = gGrid.getData();
        //console.log(wS);
        $w("#rptGrid").data = wS;
    }
    catch (err) {
        console.log("/page/Booking loadGridD Try-catch, err");
        console.log(err);
    }
}

async function loadGridM() {
    try {
        let wS = gGrid.getRow(1); //this doesnt include the header row
        $w("#rptGridM").data = wS;
    }
    catch (err) {
        console.log("/page/Booking loadGridM Try-catch, err");
        console.log(err);
    }
}

function loadRptCols($item, itemData) {
    $item("#lblColHdr").text = itemData.txt;
}

function loadrptGames($item, itemData, index) {
    try {
        let wMatchNo = itemData.matchKey.substring(10, 12);
        $item('#lblRound').text = "Round " + String(itemData.round);
        $item('#lblMatchNo').text = "Match " + wMatchNo;
        if (gCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
            $item('#txtSkipA').text = itemData.playerAId;
            $item("#txtSkipB").text = itemData.playerBId;
        } else {
            $item('#txtSkipA').text = getFullNameLocally(itemData.playerAId);
            $item("#txtSkipB").text = getFullNameLocally(itemData.playerBId);
        }
    }
    catch (err) {
        console.log("/page/Booking loadrptGames Try-catch, err");
        console.log(err);
    }
}

function refreshRptGridM(wIn) {
    //console.log("refreshGridM");
    //console.log($w('#rptGridM').data);
    //console.log(wIn);
    if (wIn[0]._id === $w('#rptGridM').data[0]._id) {
        $w('#rptGridM').forEachItem(($item, itemData, index) => {
            let wRec = wIn[index]
            let wId = wRec._id;
            let wCell = gGrid.getCell(wId[0], wId[1]);
            $item("#lblRowHdr").text = String(index + 1);
            itemData._id = wId;
            doBodyM($item, wCell);
        });
    } else {
        $w('#rptGridM').data = wIn;
    }
    //console.log($w('#rptGridM').data);
    return true;
}

function refreshRptGridD(wIn) {
    //console.log("refreshRptGridD, wIn");
    //console.log($w('#rptGrid').data);
    //gGrid.printGrid();
    //console.log(wIn);
    loadCols();
    if (wIn[0]._id === $w('#rptGrid').data[0]._id) {
        $w('#rptGrid').forEachItem(($item, itemData, index) => {
            let wRec = wIn[index]
            if (wRec) {
                let wId = wRec._id;
                let wY = parseInt(wId[0], 10);
                let wX = parseInt(wId[1], 10);
                //console.log("x= ", wX, "wY = ", wY);
                if (wX === 0) {
                    $item('#boxn0').show();
                    $item('#boxnn').hide();
                    $item('#lblSlot').text = getSlotString((wY - 1), true);
                } else { //skip first cell which is row header
                    $item('#boxn0').hide();
                    $item('#boxnn').show();
                    let wCell = gGrid.getCell(wId[0], wId[1]);
                    
                    itemData._id = wId;
                    doBodyD($item, wCell);
                }
            } else {
                console.log("/page/Booking RefreshRptGridD not wRec");
            }
        });
    } else {
        if (isLoggedIn){
            console.log(`/page/Booking by ${loggedInMember.lstId} refreshRptGridD/ Report me, wIn v rptGrid`, wIn[0]._id, $w('#rptGrid').data[0]._id);
        } else {
            console.log(`/page/Booking none logged in refreshRptGridD/ Report me, wIn v rptGrid`, wIn[0]._id, $w('#rptGrid').data[0]._id);
        }
        $w('#rptGrid').data = wIn;
    }
    //console.log($w('#rptGridM').data);
    return true;
}

function loadRptGridM($item, itemData, index) {
    $item("#lblRowHdr").text = String(index + 1);
    doBodyM($item, itemData);
}

function loadRptGridD($item, itemData, index) {
    //console.log("Load RptGrdD");
    //console.log(itemData);
    let wId = itemData._id;
    let wYAxis = parseInt(wId[0], 10);
    let wXAxis = parseInt(wId[1], 10);
    if (wXAxis === 0) { // first col
        $item('#boxn0').show();
        $item('#boxnn').hide();
        $item('#lblSlot').text = getSlotString((wYAxis - 1), true);

    } else { // body of grid
        $item('#boxn0').hide();
        $item('#boxnn').show();
        $item("#lblRowHdr").text = String(index + 1);
        doBodyD($item, itemData);
    }
}

function doBodyD(pItem, pItemData) {
    let wColour = pItemData.backgroundColour;
    pItem("#boxnn").style.backgroundColor = wColour;
    let [wUsage, wOther] = extractUsageOther(pItemData.header);
    pItem("#lblHdr").text = convertNulls(pItemData.header);
    pItem("#lblNo").text = convertNulls(pItemData.noPlayers);
    if (wUsage.includes("County") || wUsage.includes("National") || wUsage.includes("Other")) {
        if (wOther !== "") {
            pItem("#lblHdr").text = wUsage;
            pItem("#lblNo").text = wOther;
        }
    }
    pItem("#lblA").text = convertNulls(pItemData.playerA);
    pItem("#lblV").text = convertNulls(pItemData.V);
    pItem("#lblB").text = convertNulls(pItemData.playerB);
}

function doBodyM(pItem, pItemData) {
    if (pItemData.cellStatus === "O") {
        pItem("#box11M").style.backgroundColor = wFreeColour;
        pItem("#lblHdrM").text = "";
        pItem("#lblNoM").text = "";
        pItem("#lblAM").text = "";
        pItem("#lblVM").text = "";
        pItem("#lblBM").text = "";
    } else if (pItemData.cellStatus === "B") {
        pItem("#box11M").style.backgroundColor = wBookedColour;
        let [wUsage, wOther] = extractUsageOther(pItemData.header);
        pItem("#lblHdrM").text = convertNulls(pItemData.header);
        pItem("#lblNoM").text = convertNulls(pItemData.noPlayers);
        if (wUsage.includes("County") || wUsage.includes("National") || wUsage.includes("Other")) {
            if (wOther !== "") {
                pItem("#lblHdrM").text = wUsage;
                pItem("#lblNoM").text = wOther;
            }
        }
        pItem("#lblAM").text = convertNulls(pItemData.playerA);
        pItem("#lblVM").text = convertNulls(pItemData.V);
        pItem("#lblBM").text = convertNulls(pItemData.playerB);
    } else {
        pItem("#box11M").style.backgroundColor = wNotInUseColour;
        pItem("#lblHdrM").text = "Rink";
        pItem("#lblNoM").text = "is";
        pItem("#lblAM").text = "not";
        pItem("#lblVM").text = "in";
        pItem("#lblBM").text = "use";
    }
}

//=========================================Load Data =====================================================
//
//=========================================Load Dropdowns =====================================================
//

function setCompetitionDropdown(pMix) {
    let wGenderSet = gCompetitions.filter(item => item.mix === pMix);
    let wManualSet = wGenderSet.filter(item => item.maintainedBy === "M");
    let wManagedSet = wGenderSet.filter(item => item.maintainedBy === "A");
    let wOptions = [];
    let wManualOptionSet = wManualSet.map(item => {
        return {
            "label": item.title,
            "value": item.compRef
        }
    })
    let wManagedOptionSet = wManagedSet.map(item => {
        return {
            "label": item.title,
            "value": item.compRef
        }
    })
    if (wManualSet.length === 0 && wManagedSet.length === 0) {
        wOptions = [{ "label": "No competitions found", "value": "X1" }];
    } else if (wManualSet.length === 0 && wManagedSet.length > 0) {
        // Managed Set only
        wOptions = [{ "label": "---- Managed Competitions ----", "value": "X2" }, ...wManagedOptionSet];
    } else if (wManagedSet.length === 0 && wManualSet.length > 0) {
        // Manual Set only
        wOptions = [{ "label": "---- Manual Competitions ----", "value": "X3" }, ...wManualOptionSet];
    } else {
        // Both Sets
        wOptions = [
            { "label": "---- Manual Competitions ----", "value": "X2" }, ...wManualOptionSet,
            { "label": "---- Managed Competitions ----", "value": "X3" }, ...wManagedOptionSet
        ];
    }
    $w('#boxClubCompetitions').expand();
    $w('#boxEvent').collapse();
    $w('#boxUK').collapse();
    $w('#boxCompBooking').collapse();

    $w('#drpCompetition').options = wOptions;
    //$w('#drpCompetition').selectedIndex = 1;

    /**
    $w('#drpStage').collapse();
    $w('#drpDivision').collapse();
    $w('#drpRound').collapse();
    $w('#rptGames').hide();
    */
}

//=========================================Main Grid Actions =======================================================
//
export async function cnt_click(event) {
    // id is in the format "slotRink" ie 32 is slot 3, rink 2
    //if (event.target.type !== "$w.Container") { return }; // was $w.box: ignore everything not comig from the Boxnn element
    let wId = event.context.itemId;
    let wSlot = wId[0];
    let wRink = wId[1];
    //console.log("Click = ", wId);
    if (wSlot === 0) { return } // click coming from Desktop header row
    if (wRink === 0) { return } // click coming from Desktop row time slot hdr
    if (wId === gSelectedCell.id) { return }; // clicked itself
    
    let $item = $w.at(event.context);
    let wCell = gGrid.getCell(wSlot, wRink);
    
    /**
     * i dont know what this is for now.
    if ($item('#lblHdr').text === "Rink") { // allow EVENT bookings to be moved to not in use rink/slots
        if (gMode !== "Move" || gFromCell.compRef.substring(0, 5) !== "EVENT") {
            clearSelection();
            return
        }
    } // skip Not in use cells`
    */
    if (wCell.bookingStatus === "P") { showError(9); return };
    if (wCell.parentId && wCell.parentId.length > 0) {
        // although clicked in one of its children, sEt the selected cell to the parent
        wCell = gGrid.getParentCell(wId, wCell.parentId);
        wId = wCell.id;
        $item = setRptGridItem(wId);
    }

    if (wCell.cellStatus === "B") { // this cell contains a booking
        if (gMode === MODE.MOVE) { showError(3); return } // cant select a booked cell to move to
        if (isManager(loggedInMemberRoles) ||
            wCell.bookerId === loggedInMember.lstId ||
            wCell.playerAId === loggedInMember.lstId ||
            wCell.playerBId === loggedInMember.lstId
        ) {
            makeSelection(wId, $item, wCell);
            if (wCell.compRef.trim()) { //if true, compRef is not empty TODO: LOOK AT ME RE MANUAL
                $w('#btnMove').label = "Move booking";
                $w('#btnMove').show();
            }
            $w('#txtErrorMsg').text = "";
            $w('#btnBookRink').label = "Edit booking";
            $w('#btnBookBottom').label = "Edit booking";
            $w('#txtDetailHdr').text = "Update Booking";
            gMode = MODE.EDIT;
            return;
        } else {
            $w('#btnBookRink').label = "Book rink";
            $w('#btnBookBottom').label = "Book rink";
            clearSelection();
            if (loggedInMember) {
                showError(7); //must be owner or manager to edit a booking
            } else {
                showError(1);
            }
            return;
        }//isManager
    }
    //	Get to here, must have selected a free cell
    makeSelection(wId, $item, wCell);
    if (gMode === MODE.MOVE) {
        let wExtraSlots = gGrid.getExtraSlots(gSlot, gRink);
        if (gFromCell.noChildren > wExtraSlots){
            showError(15);
        }
        $w('#btnBookRink').label = "Move confirm";
        $w('#btnBookBottom').label = "Move confirm";
        $w('#btnMove').label = "Cancel Move";
        $w('#btnMove').show();
    } else {
        gMode = MODE.BOOK;
        $w('#btnBookRink').label = "Book rink";
        $w('#btnBookBottom').label = "Book rink";
    }
}

function makeSelection(pCellId, pItem, pCell) {
    clearSelection();
    let wBox = (wixWindow.formFactor === "Mobile") ? "#box11M" : "#boxnn";
    pItem(`${wBox}`).style.backgroundColor = wSelectedColour;
    copyToCellFromCell(gSelectedCell, pCell);
    gSlot = pCellId[0];
    gRink = pCellId[1];
    gSlotString = getSlotString(gSlot - 1, true);
}

function clearSelection() {
    //if (gSelectedCell.id === "00" || gSelectedCell.id === "01") { return };
    //console.log(gSelectedCell.id, gSelectedCell.cellStatus);
    setCellColour(gSelectedCell.id, gSelectedCell.cellStatus);
    //w_book_ref = "";
    gSelectedCell.doClear();
    
    gSlot = 0;
    gRink = 0;
    gSlotString = "";

    $w('#btnBookRink').label = "Book rink";
    $w('#btnBookBottom').label = "Book rink";
    $w('#btnMove').label = "Move booking"; //##
    $w('#txtAllDaySave').text = "Day booked out";
    $w('#btnBookRink').show();
    $w('#btnMove').hide();
    $w('#txtAllDaySave').hide();
    $w('#btnSave').label = "Save";
}

function setRptGridItem(pId) {
    if (pId === "00" || pId === "01") { return null};
    let wItem;
    let wRepeater = (wixWindow.formFactor === "Mobile") ? "#rptGridM" : "#rptGrid";
    $w(`${wRepeater}`).forItems([pId], ($olditem, olditemData, oldindex) => {
        wItem = $olditem;
    });
    return wItem;
}

function setCellColour(pId, pCellStatus) {
    let wBox = "#boxnn";
    let wRepeater = "#rptGrid";
    if (wixWindow.formFactor === "Mobile"){
        wBox = "#box11M";
        wRepeater = "#rptGridM";
    }
    
    $w(`${wRepeater}`).forItems([pId], ($olditem) => {
        if (pCellStatus === "B") {
            $olditem(`${wBox}`).style.backgroundColor = wBookedColour;
        } else {
            $olditem(`${wBox}`).style.backgroundColor = wFreeColour;
        }
    })
    return;
}

function copyToCellFromCell(pToCell, pFromCell) {
    pToCell.id = pFromCell.id;
    pToCell.JDate = pFromCell.JDate;
    pToCell.requiredYear = pFromCell.requiredYear;
    pToCell.requiredMonth = pFromCell.requiredMonth;
    pToCell.startTime = pFromCell.startTime;
    pToCell.duration = pFromCell.duration;
    pToCell.id = pFromCell.id;
    //pToCell.slot = pFromCell.slot;    //these are set by the pId
    //pToCell.rink = pFromCell.rink;
    pToCell.rangeId = pFromCell.rangeId;
    pToCell.cellStatus = pFromCell.cellStatus;
    pToCell.bookerId = pFromCell.bookerId;
    pToCell.dateBooked = pFromCell.dateBooked;
    pToCell.booker = pFromCell.booker;
    pToCell.header = pFromCell.header;
    pToCell.noPlayers = pFromCell.noPlayers;
    pToCell.playerAId = pFromCell.playerAId;
    pToCell.playerA = pFromCell.playerA;
    pToCell.playerBId = pFromCell.playerBId;
    pToCell.playerB = pFromCell.playerB;
    pToCell.compRef = pFromCell.compRef;
    pToCell.compTitle = pFromCell.compTitle;
    pToCell.matchKey = pFromCell.matchKey;
    pToCell.isBye = pFromCell.isBye;
    pToCell.usage = pFromCell.usage;
    pToCell.round = pFromCell.round;
    pToCell.bookingRef = pFromCell.bookingRef;
    pToCell.bookingStatus = pFromCell.bookingStatus;
    pToCell.hasChildren = pFromCell.hasChildren;
    pToCell.noChildren = pFromCell.noChildren;
    pToCell.parentId = pFromCell.parentId;
    //pToCell.resourceKey = pFromCell.resourceKey;
    pToCell.eventId = pFromCell.eventId;
    pToCell.V = pFromCell.V;
    pToCell.backgroundColour = pFromCell.backgroundColour;
}

//===========================================Desktop functions==================================================
export async function btnBookRink_click(event) {
    if (!isDateValid($w('#dpkStartDate').value)) { showError(4); return };
    if (gRink === 0 || gSlot === 0) { showError(2); return };
    $w('#boxSelect').collapse();
    $w('#boxEvent').collapse();
    $w('#boxCompBooking').collapse();

    if (isLoggedIn) {
        if (gMode === MODE.MOVE) {
            //console.log("btnBookRInk mode = MOVE btnLabel = ", $w('#btnBookRink').label);
            $w('#imgWait').show();
            if ($w('#btnBookRink').label === "Move confirm") {
                await moveBooking();
            }
            $w('#imgWait').hide();
            $w('#txtAllDaySave').text = "All day booked out";
            $w('#txtAllDaySave').hide();
            $w('#btnMove').hide();
            $w('#btnBookRink').label = "Book rink";
            $w('#btnBookBottom').label = "Book rink";
            gMode = MODE.BOOK;
            return;
        } else {
            if (isAllowed(gSelectedCell)) {
                if (wixWindow.formFactor === "Mobile") {
                    $w('#secMobile').collapse();
                } else {
                    $w('#secDesktop').collapse();
                }
                populateBookingDetailForm(gSelectedCell);
                $w('#secBookingDetail').expand();
                wixWindow.scrollTo(0, 0);
            }
        }
    } else {
        showError(1);
    }
}

export async function btnMove_click(event) {

    if ($w('#btnMove').label === "Cancel Move") {
        clearSelection();
        gFromCell.doClear();
        gMode = MODE.BOOK;
    } else {
        $w('#txtAllDaySave').text = "Please select slot or day to move event to";
        $w('#txtAllDaySave').show();
        $w('#btnBookRink').label = "Cancel Move";
        $w('#btnBookBottom').label = "Cancel Move";
        if (gSelectedCell.hasChildren){
            gSelectedCell.noChildren = gGrid.getNoChildren(gSelectedCell.slot, gSelectedCell.rink);
        }
        copyToCellFromCell(gFromCell, gSelectedCell);
        gSelectedCell.doClear();
        gMode = MODE.MOVE;
        return;
    }
}

//===========================================Desktop Supporting functions==================================================
//
function isAllowed(pCell) {
    const wMatchKey = convertNull(pCell.matchKey, "");
    if (wMatchKey.substring(0, 1) === "S") {
        if (isManager(loggedInMemberRoles)) {
            return true;
        } else {
            showError(10);
            return false;
        }
    } else {
        if (pCell.compRef.includes("MANUAL")) {
            switch (pCell.usage) {
            case "Club Roll Up":
            case "May's Day":
            case "Tom Linscott":
            case "Club Night":
                if (isManager(loggedInMemberRoles)) {
                    return true;
                } else {
                    showError(11);
                    return false;
                }
                break;
            default:
                return true;
            }
        }
        return true;
    }
}

export async function moveBooking() {
    try {
    const toInsert = {
        "dateRequired": null,
        "timeRequired": null,
        "duration": "01:30",
        "requiredYear": 0,
        "requiredMonth": 0,
        "requiredJDate": 0,
        "rink": 0,
        "rangeId": 0,
        "slotId": 0,
        "compRef": null,
        "compTitle": null,
        "usage": "",
        "status": "O",
        "isBye": "N",
        "noPlayers": 0,
        "bookerId": null,
        "playerAId": null,
        "playerBId": null,
        "dateBooked": null,
        "matchKey": null,
        "scoreA": 0,
        "scoreB": 0,
        "round": 0,
        "newKey": null,
        "pId": "",
        "eventId": null,
        "hasChildren": "N",
        "parentId": ""
    };

    //let wSameDayMkr = (gSelectedCell.JDate === gFromCell.JDate) ? true : false;

    let [wHours,wMins, wTime, wEndParameter] = getTimeSlotStart(gSlot);
    let wDate = $w('#dpkStartDate').value;
    let wYear = wDate.getFullYear();
    let wMonth = wDate.getMonth();
    let wDay = wDate.getDate();
    let wStartDateTime = new Date(wYear, wMonth, wDay, wHours, wMins);
    let wDuration = gFromCell.duration;
    let wEndTime = addDurationToTime(wTime, wDuration);
    let wJDate = DateToOrdinal(wStartDateTime);

    let wStartRink = gRink;
    let wNoRinks = 1;
    let wRangeId = gRangeId;
    let wFromSlot = gSlot;
    let wToSlot = getEndSlot(wEndTime) + 1;
    let wMaxExtraSlots = gGrid.getExtraSlots(gSlot,gRink);
    //console.log("FroS, toS, max", wFromSlot, wToSlot, wMaxExtraSlots);

    let w_today = new Date();
    //toInsert = {...gFromCell};
    toInsert.compRef = gFromCell.compRef;
    toInsert.compTitle = gFromCell.compTitle;
    toInsert.usage = gFromCell.usage;
    toInsert.round = gFromCell.round;
    toInsert.matchKey = gFromCell.matchKey;
    toInsert.isBye = gFromCell.isBye;
    toInsert.scoreA = gFromCell.scoreA;
    toInsert.scoreB = gFromCell.scoreB;
    toInsert.noPlayers = convertPlayers(gFromCell.noPlayers);
    toInsert.playerAId = gFromCell.playerAId;
    toInsert.playerBId = gFromCell.playerBId;
    //	form elements from new click
    toInsert.dateRequired = wStartDateTime;
    toInsert.timeRequired = wTime;
    toInsert.duration = gFromCell.duration
    toInsert.rink = gRink;
    toInsert.rangeId = gRangeId;
    toInsert.slotId = gSlot;
    toInsert.bookerId = gFromCell.bookerId;
    toInsert.parentId = gFromCell.parentId;
    toInsert.eventId = gFromCell.eventId;
    toInsert.dateBooked = w_today;
    // the following input fields need to be set up as used later by processManualEntry to set up record
    let [wUse, wUsage] = parseHeader(gFromCell.header);
    $w('#lblPlayerAId').text = toInsert.playerAId;
    $w('#lblPlayerBId').text = toInsert.playerBId;
    $w('#tpkBookingDetailDuration').value = toInsert.duration;
    [$w('#lblUse').text, $w('#inpCountyOther').value ] = parseHeader(gFromCell.header);
    $w('#inpNoPlayers').value = String(toInsert.noPlayers);

    // create new booking
    let result = null;
    let wResult = await processRecord(toInsert, wStartDateTime, wTime.substring(0,5), wDuration, wYear, wJDate, wStartRink,
                        wNoRinks, wRangeId, wFromSlot, wToSlot, wMaxExtraSlots);
  
    if (wResult.status) {
        $w('#txtSaveMsg').text = "Booking saved. Please check your Email/Messages.";
    } else {
        showSaveError(3);
        $w('#btnSave').disable();
        console.log(`/page/Booking by ${loggedInMember.lstid} moveBooking failed`);
        return;
    }
    let wNewBookings = wResult.bookings;
    let wNewBooking = wNewBookings[0];
    for (let wBooking of wNewBookings){
        wBooking.booker = getFullNameLocally(wBooking.bookerId);
        wBooking.playerA = getFullNameLocally(wBooking.playerAId);
        wBooking.playerB = getFullNameLocally(wBooking.playerBId);
    }
    if (gFromCell && gFromCell.hasChildren) {
        let wResult2 = await deleteLinkedBookings(loggedInMember.lstId, gFromCell.bookingRef);
        if (!wResult2.status){
            console.log(`/page/Bookings by ${loggedInMember.lstId} moveBooking Error deleting children, err`);
            console.log(wResult.error);
        }
    }
    if (!wResult.status) {
        showSaveError(3);
    } else {
        //	now update old booking
        let res2 = await updateBookingStatus(gFromCell.bookingRef, "M", gSelectedCell.bookingRef);

        //AT THIS POINT ALL DATABASE CHANGES HAVE BEEN MADE ie NEW ADDED and OLD Moved and its children DELETED
        /**
         * Note that at this point we need to synchronise the database, model Grid and the view Repeater with the changes resulting from the move.
         * Ideally, we could re-use the Process Day function to do this for us, but on this occasion it would mean executing the GetAllBookings
         * (ie read the days bookings from database) function in the same execution phase as the ProcessEvent and DeleteChildrens functions.
         * In all other scenarios, they would be in different execution phases as they need to ne initiated by some external user action. The problem
         * is that we cannot guarantee that the Wix Mongo database is up-to-date with our changes within the same execution phase, and calling GetAllBookings
         * results in an indeterminate number of records returned. Therefore, this synchronisation needs to be handled manuall in this section.
         * If in future, a more transactional database replaces Mongo, then this strategy can be reviewed.
         */
        // Apply new bookings
        gGrid.refresh(wNewBookings);
        // Clear the from cell and its children
        gGrid.clearCell(gFromCell.slot, gFromCell.rink);
        if (wixWindow.formFactor === "Mobile") {
            gMobileIndex = (gMobileView === "S") ? gSelectedCell.slot -1 : gSelectedCell.rink;
            let wS = (gMobileView === "S") ? gGrid.getRow(gMobileIndex + 1) : gGrid.getCol(gMobileIndex);
            let res = refreshRptGridM(wS);
        } else {
            // Refresh the Grid and display
            let wS = gGrid.getData();
            let res = refreshRptGridD(wS);
            // Set the new cell as the selected cell
        }
        let wCell = gGrid.getCell(gSelectedCell.slot, gSelectedCell.rink);
        copyToCellFromCell(gSelectedCell, wCell);
        clearSelection();
    }
    $w('#imgDetailWait').hide();
    $w('#txtSaveMsg').show();
    $w('#btnSave').disable();
    gFromCell.doClear();

    gMode = MODE.BOOK;
    }
    catch (err) {
        console.log(`/page/Booking by ${loggedInMember.lstId} movebooking Try-catch, err`);
        console.log(err);
    }
}

function parseHeader(pHeader){
    let wParts = pHeader.split("/");
    let wUse = wParts[0] ? wParts[0] : pHeader;
    let wUsage = wParts[1] ? wParts[1] : "";
    return [wUse, wUsage];
}

function convertPlayers(pStr) {
    if (pStr === undefined || isNaN(pStr)) {
        return 0;
    }
    if (pStr.includes("Player")) {
        return parseInt(pStr, 10);
    }
    return pStr;
}

function isDateValid(pIn) {
    //	return true = is Valid
    // 			false = is not valid
    if (isManager(loggedInMemberRoles)) { return true };
    let w_now = new Date();
    w_now.setHours(10, 0, 0, 0);
    pIn.setHours(10, 0, 0, 0);
    if (pIn.getTime() < w_now.getTime()) {
        return false;
    } else {
        if (pIn.getTime() > w_now.getTime()) {
            return true;
        } else {
            return true;
        }
    }
}

//	====================================================== Booking Detail =============================================
//

export async function btnCancel_click(event) {
    $w('#strHdr').expand();
    $w('#secBookingDetail').collapse();
    $w('#txtDetailHdr').text = "Booking Detail";
    gMode = MODE.BOOK;
    if (wixWindow.formFactor === "Mobile") {
        $w('#secMobile').expand();
        clearSelection();
        let wS = (gMobileView === "S") ? gGrid.getRow(gMobileIndex + 1) : gGrid.getCol(gMobileIndex + 1);
        refreshRptGridM(wS);
    } else {
        $w('#secDesktop').expand();
        $w('#btnBookRink').label = "Book rink";
        $w('#btnBookBottom').label = "Book rink";
        $w('#btnMove').label = "Move a boking"; //##
        clearSelection();
        dpkStartDate_change();
    }
}

export async function btnDelete_click(event) {
    try {
        const toEmail = {
            "bookingRef": "",
            "dateRequired": null,
            "rink": 0,
            "slot": "",
            "noPlayers": 0,
            "bookerId": "",
            "booker": "",
            "playerAId": "",
            "playerA": "",
            "playerBId": "",
            "playerB": "",
            "dateBooked": ""
        }
        //	Validate
        if (!loggedInMember) { showError(1); return }
        if ($w('#lblMatchKey').text.substring(0, 1) === "S") {
            if (!isManager(loggedInMemberRoles)) { showSaveError(5); return }
        }
        $w('#imgDetailWait').show();

        //	Prepare database record
        let res = null;
        $w('#txtSaveMsg').text = "Delete completed.";
        res = await updateBookingStatus(gSelectedCell.bookingRef, "D", null)
        if (gSelectedCell.hasChildren) {
            let wResult = await deleteLinkedBookings(loggedInMember.lstId, gSelectedCell.bookingRef);
            if (!wResult.status){
                console.log(`/page/booking by ${loggedInMember.lstId} btnDelete Error deleting children, err`);
                console.log(wResult.error);
            }
        }
        //res = 123;
        if (res) {
            //	Prepare email record
            toEmail.bookingRef = res.id;
            let xDate = $w('#dpkStartDate').value;
            xDate.setHours(10, 0, 0, 0);
            toEmail.dateRequired = xDate;
            toEmail.rink = parseInt($w('#txtRink').text, 10);
            toEmail.slot = $w('#txtSlot').text;
            toEmail.noPlayers = parseInt($w('#inpNoPlayers').value, 10);
            toEmail.bookerId = $w('#txtBooker').text;
            toEmail.bookerId = $w('#lblBookingDetailBookerId').text;
            toEmail.playerA = $w('#txtPlayerA').text;
            toEmail.playerAId = $w('#lblPlayerAId').text;
            toEmail.dateBooked = res.dateBooked;
            if ($w('#lblPlayerBId').text === "0") {
                toEmail.playerB = "";
                toEmail.playerBId = null;
            } else {
                toEmail.playerB = $w('#txtPlayerB').text;
                toEmail.playerBId = $w('#lblPlayerBId').text;
            }
            //res = await sendConfirmationEmail(toEmail);		//todo when send email, change saved mesage
            $w('#txtSaveMsg').show();
            $w('#btnSave').disable();
            $w('#btnDelete').disable();
            setTimeout(() => {
                $w('#txtSaveMsg').hide();
            }, 5000);
            $w('#imgDetailWait').hide();
            if (wixWindow.formFactor === "Mobile") {
                gGrid.getCell(gSlot, gRink); //TODO as before
                gGrid.clearCell(gSlot, gRink)
            } else {
                $w('#imgDetailWait').hide();
                dpkStartDate_change();						//force re-pop of grid
            }
        } else {
            $w('#imgDetailWait').hide();
            $w('#txtSaveMsg').text = "Delete failed. Please Close Form";
            $w('#txtSaveMsg').show();
            $w('#btnSave').disable();
            $w('#btnDelete').disable();
            setTimeout(() => {
                $w('#txtSaveMsg').hide();
            }, 5000);
        }
    }
    catch (err) {
        if (isLoggedIn){
            console.log(`/page/Booking by ${loggedInMember.lstId} btnDelete Try-catch, err`);
        } else {
            console.log("/page/Booking none looged in btnDelete Try-catch, err");
        }
        console.log(err);
    }
}

export function btnAClear_click(event) {
    $w('#txtPlayerA').text = "";
    $w('#lblPlayerAId').text = "0";
    $w('#chkOwnUse').checked = false;
}

export function btnBClear_click(event) {
    $w('#txtPlayerB').text = "";
    $w('#lblPlayerBId').text = "0";
}

export async function btnPlayerA_click(event) {
    let member = await wixWindow.openLightbox("lbxSelectMember");
    if (member) {
        $w('#txtPlayerA').text = member.fullName;
        $w('#lblPlayerAId').text = member.id;
        $w('#lblSaveErrorMsg').text = "";
        $w('#btnSave').enable();
    } else {
        $w('#txtPlayerA').text = "";
        $w('#lblPlayerAId').text = "0";
    }
}

export async function btnPlayerB_click(event) {
    let member = await wixWindow.openLightbox("lbxSelectMember");
    if (member) {
        $w('#inpNoPlayers').value = "2";
        $w('#txtPlayerB').text = member.fullName;
        $w('#lblPlayerBId').text = member.id;
        $w('#lblSaveErrorMsg').text = "";
        $w('#btnSave').enable();
    } else {
        $w('#inpNoPlayers').value = "1";
        $w('#txtPlayerB').text = "";
        $w('#lblPlayerBId').text = "0";
    }
}

export function chkOwnUse_change(event) {
    if (gMode === MODE.EDIT) { return };
    if ($w('#chkOwnUse').checked) {
        $w('#txtPlayerA').text = $w('#txtBooker').text;
        $w('#lblPlayerAId').text = $w('#lblBookingDetailBookerId').text;
        $w('#txtPlayerB').text = "";
        $w('#lblPlayerBId').text = "";
    } else {
        $w('#txtPlayerA').text = "";
        $w('#lblPlayerAId').text = "";
    }
    $w('#lblSaveErrorMsg').text = "";
    $w('#btnSave').enable();
}

export function inpRound_change(event) {
    $w('#btnSave').enable();
}

export function inpNoPlayers_change(event) {
    $w('#btnSave').enable();
}

export async function btnSave_click(event) {
    try {
        const toEmail = {
            "bookingRef": "",
            "dateRequired": "",
            "rink": 0,
            "slot": "",
            "noPlayers": 0,
            "bookerId": "",
            "booker": "",
            "playerAId": "",
            "playerA": "",
            "playerBId": "",
            "playerB": "",
            "dateBooked": ""
        };

        let w_today = new Date();
        //	Validate
        if (!loggedInMember) { showError(1) }
        if ($w('#lblUse').text === "") { showSaveError(7); return }
        if ($w('#lblPlayerAId').text === "0") { showSaveError(1); return }
        if ($w('#lblPlayerAId').text === "") { showSaveError(1); return }
        if ($w('#lblPlayerAId').text === null) { showSaveError(1); return }
        if ($w('#lblPlayerAId').text === undefined) { showSaveError(1); return }

        $w('#imgDetailWait').show();

        //	Prepare database record 
        let wTime = $w('#tpkStart').value;
        let wHours = parseInt(wTime.split(":")[0], 10);
        let wMins = parseInt(wTime.split(":")[1], 10);
        wTime = String(wHours).padStart(2,"0") + ":" + String(wMins).padStart(2,"0");
        let wDate = $w('#dpkStartDate').value;
        let wYear = wDate.getFullYear();
        let wMonth = wDate.getMonth();
        let wDay = wDate.getDate();
        let wStartDateTime = new Date(wYear, wMonth, wDay, wHours, wMins);
        let wDuration = $w('#tpkBookingDetailDuration').value.substring(0,5);
        let wEndTime = addDurationToTime(wTime, wDuration);
        let wJDate = DateToOrdinal(wStartDateTime);

        let wStartRink = parseInt($w('#txtRink').text, 10);  //@@
        let wNoRinks = 1;      //@@
        let wRangeId = parseInt($w('#lblRangeId').text, 10);      //@@
        let wFromSlot = parseInt($w('#lblSlotId').text, 10); //@@
        let wToSlot = getEndSlot(wEndTime) + 1;       //@@
        let wMaxExtraSlots = parseInt($w('#lblBookingDetailExtraSlotCount').text,10);
        //console.log("StartDateTime, duration, entime, from to,  ", wStartDateTime, wDuration, wEndTime, wFromSlot, wToSlot);
        let wCompRef = "";
        let wUse = "";
        if (gMode === MODE.SCHEDULE) {
            wCompRef = gCompRec.compRef;
            gEmail = true;
        } else {
            let wUsage = $w('#lblUse').text;
            switch (wUsage) {
            case "Roll up":
            case "Lockdown game":
                gEmail = true;
                wUse = wUsage;
                break;
            case "County":
            case "County game":
            case "National":
            case "Other":
            case "National game":
                gEmail = true;
                wUse = wUsage + "/" +  $w('#inpCountyOther').value.trim();
                break;
            case "Continuation":
                gEmail = false;
                wUse = wUsage;
                break;
            default:
                gEmail = true;;
                wUse = wUsage;
                break;
            }
        }

        let toInsert = {
            "_id": gSelectedCell.bookingRef,
            "dateRequired": wStartDateTime,
            "requiredYear": gSelectedCell.requiredYear,
            "requiredMonth": gSelectedCell.requiredMonth,
            "requiredJDate": gSelectedCell.JDate,
            "timeRequired": wTime,
            "duration": wDuration,
            "rink": wStartRink,
            "rangeId": wRangeId,
            "slotId": wFromSlot,
            "noPlayers": parseInt($w('#inpNoPlayers').value,10) || 0,
            "compRef": $w('#inpBookingDetailCompRef').value,
            "compTitle":  $w('#inpBookingDetailCompTitle').value,
            "matchKey": $w('#lblMatchKey').text,
            "resourceKey": $w('#lblBookingDetailResourceKey').text,
            "usage": wUse,
            "round": parseInt($w('#drpRound').value,10) || 0,
            "bookerId":  $w('#lblBookingDetailBookerId').text,
            "playerAId": $w('#lblPlayerAId').text,
            "playerBId": $w('#lblPlayerBId').text,
            "dateBooked": $w('#dpkBookingDetailDateBooked').value,
            "status": $w('#lblBookingDetailStatus').text,
            "scoreA": parseInt($w('#inpBookingDetailScoreA').value,10) || 0,
            "scoreB": parseInt($w('#inpBookingDetailScoreB').value,10) || 0,
            "newKey":$w('#lblBookingDetailNewKey').text,
            "isBye": $w('#inpBookingDetailIsBye').value || "N",
            "eventId":  $w('#lblBookingDetailEventId').text,
            "pId":  $w('#lblBookingDetailPid').text,
            "hasChildren":  $w('#lblBookingDetailHasChildren').text,
            "parentId": $w('#lblBookingDetailParentId').text 
        };
        let res = true;
        //console.log("Mode = ", gMode);
        if (gMode === MODE.BOOK) {
            let wResult = await processRecord(toInsert, wStartDateTime, wTime.substring(0,5), wDuration, wYear, wJDate, wStartRink,
                            wNoRinks, wRangeId, wFromSlot, wToSlot, wMaxExtraSlots);
            if (wResult.status) {
                $w('#txtSaveMsg').text = "Booking saved. Please check your Email/Messages.";
                let wNewBookings = wResult.bookings;
                let wNewBooking = wNewBookings[0];
                console.log(`/page/Booking by ${loggedInMember.lstId} btnSave saveRecord new booking ok, ref`, wNewBooking._id);
            } else {
                showSaveError(3);
                $w('#btnSave').disable();
                console.log(`/page/Booking by ${loggedInMember.lstId} btnSave ProcessRecord failed`)
            }

        } else if (gMode === MODE.EDIT) {
            $w('#txtSaveMsg').text = "Update saved.";
            
            //console.log("Edit");
            //console.log(gSelectedCell);
            //console.log(toInsert);
            ///console.log("Record to save");
            ///console.log(toInsert);
            let wResult = await saveRecord("lstBookings", toInsert);
            if (wResult.status){
                let wBookingUpdate = wResult.savedRecord;
                console.log(`/page/Booking by ${loggedInMember.lstId} btnSave saveRecord update booking ok, ref`, wBookingUpdate._id);
            } else {
                console.log(`/page/Booking by ${loggedInMember.lstId} btnSave saveRecord failed, err`);
                console.log(wResult.error);
            }
        } else if (gMode === MODE.SCHEDULE) {
            $w('#txtSaveMsg').text = "Booking saved. Please check your Email/Messages.";
            //console.log(toInsert);
            //w_booking = $w('#lblBookRef').text;
            res = await updateCompBooking($w('#lblFullBookRef').text, toInsert.bookerId,  toInsert.dateRequired, toInsert.timeRequired,
                                        toInsert.duration, toInsert.slotId, toInsert.rangeId, toInsert.rink);
            console.log(`/page/Booking by ${loggedInMember.lstId} btnSave saveRecord schedule booking update ok, res`);
            console.log(res);    
        }

        //res = 123;

        if (res) {
            if (gEmail) {
                let wBooker = $w('#txtBooker').text;
                let wBookerId = $w('#lblBookingDetailBookerId').text;
                let wPlayerB = "";
                let wPlayerBId = "";
                if ($w('#lblPlayerBId').text === "0") {
                    wPlayerB = "";
                    wPlayerBId = null;
                } else {
                    wPlayerB = $w('#txtPlayerB').text;
                    wPlayerBId = $w('#lblPlayerBId').text;
                }
                if (wBookerId === wTrev || wBookerId === wTony || wBookerId === wTim || wBookerId === wJohn) {
                    console.log("pages/Booking btnSave special test user selected, ", wBookerId);
                    let wNoPlayers = parseInt($w('#inpNoPlayers').value,10) || 0;
                    //console.log("No of players = ", wNoPlayers);
                    let wPlayersMessage = "Not Specified";                        
                    if (wNoPlayers === 1) {
                        wPlayersMessage = "1 Player";
                    } else if (wNoPlayers > 1 ) {
                        wPlayersMessage = String(wNoPlayers) + " Players"
                    }
                    let wBookerNames = wBooker.toString().split(" ");
                    let wParams = {
                                    "firstName": wBookerNames[0],
                                    "dateBooked": formatDateString($w('#dpkBookingDetailDateBooked').value),
                                    "bookingRef":  gSelectedCell.bookingRef.substring(0,8),
                                    "dateRequired": formatDateString($w('#dpkStartDate').value),
                                    "slot": $w('#txtSlot').text,
                                    "rink": $w('#txtRink').text,
                                    "playersMessage": wPlayersMessage,
                                    "usage": wUse,
                                    "playerA": $w('#txtPlayerA').text,
                                    "playerB": wPlayerB 
                    }
                    //console.log("Booking", wParams);
                    //console.log(wParams);
                    if (!gTest) { let wResult = await sendMsg("U", null, wBookerId, false, "BookingConfirmation", wParams)};
                } else {
                    //	Prepare old email record
                    //toEmail.bookingRef = w_book_ref;
                    toEmail.bookingRef = gSelectedCell.bookingRef.substring(0,8);
                    toEmail.dateRequired = formatDateString($w('#dpkStartDate').value);
                    toEmail.rink = parseInt($w('#txtRink').text, 10);
                    toEmail.slot = $w('#txtSlot').text;
                    toEmail.noPlayers = parseInt($w('#inpNoPlayers').value, 10);
                    toEmail.booker = $w('#txtBooker').text;
                    toEmail.bookerId = wBookerId;
                    toEmail.playerA = $w('#txtPlayerA').text;
                    toEmail.playerAId = $w('#lblPlayerAId').text;
                    toEmail.usage = wUse;
                    toEmail.dateBooked = formatDateString(w_today);
                    toEmail.playerB = wPlayerB;
                    toEmail.playerBId = wPlayerBId;
                    if (!gTest) { res = await sendConfirmationEmail(toEmail) };
                }
            }
            $w('#imgDetailWait').hide();
            $w('#txtSaveMsg').show();
            $w('#btnSave').disable();
            setTimeout(() => {
                $w('#txtSaveMsg').hide();
            }, 6000);
            //	update mobile cell
            if (wixWindow.formFactor === "Mobile") {
                let wCell = gGrid.getCell(toInsert.slotId, toInsert.rink); //TODO Not sure why doing this
                wCell.header = toInsert.usage;
                wCell.playerAId = $w('#lblPlayerAId').text;
                wCell.playerA = $w('#txtPlayerA').text;
                wCell.playerBId = toInsert.playerBId;
                wCell.playerB = toInsert.playerB;
                wCell.bookerId = toInsert.bookerId;
                wCell.booker = toInsert.bookerId;
                wCell.compRef = toInsert.compRef;
                wCell.compTitle = toInsert.compTitle;
                wCell.matchKey = toInsert.matchKey;
                wCell.usage = toInsert.usage;
                wCell.noPlayers = toInsert.noPlayers;
                wCell.bookingRef = gSelectedCell.bookingRef;
                wCell.cellStatus = "B";
            } else {
                $w('#imgDetailWait').hide();
                dpkStartDate_change(); //force re-pop of grid
            }
        } else {
            console.log(`/pages/Booking by ${loggedInMember.lstId} btnSave_click updateCompBooking failed, res `);
            console.log(res);
            $w('#imgDetailWait').hide();
            $w('#txtSaveMsg').text = "Update failed. Please Close Form";
            $w('#txtSaveMsg').show();
            $w('#btnSave').disable();
            $w('#btnDelete').disable();
            setTimeout(() => {
                $w('#txtSaveMsg').hide();
            }, 5000);
        }
    }
    catch (err) {
        if (isLoggedIn){ 
            console.log(`/page/Booking by ${loggedInMember.lstId} btnSave Try-catch, err`);
        } else {
            console.log(`/page/Booking none logged in btnSave Try-catch, err`);
            console.log(err);
        }
        $w('#imgDetailWait').hide();
        $w('#txtSaveMsg').text = "An error occurred, your confirmation may not be sent. Please check booking and Emails/Messages";
        $w('#txtSaveMsg').show();
        $w('#btnSave').disable();
        $w('#btnDelete').disable();
        setTimeout(() => {
            $w('#txtSaveMsg').hide();
        }, 5000);
    }
}

async function processRecord(pInsert, pDate, pTime, pDuration, pYear, pJDate, pStartRink, pNoRinks, pSlotRange, pFromSlot, pToSlot, pMaxExtraSlots){
    //const wBookerId = loggedInMember.lstId || TEMPORARY_HOLDER;
    const wBookerId = loggedInMember.lstId;
    //console.log("processRecord time, dur, startR, noR, fromS, toS, MaxS ", pTime, pDuration, pStartRink, pNoRinks, pFromSlot, pToSlot, pMaxExtraSlots);
    
    let wMatchKey = $w('#lblMatchKey').text;
    let wNoPlayers = 0;
    let wRound = 0;
    if (!Number.isInteger($w('#inpNoPlayers').value)) { wNoPlayers = parseInt($w('#inpNoPlayers').value,10) || 2};
    if (!Number.isInteger($w('#drpRound').value)) { wRound = parseInt($w('#drpRound').value,10 ) || 0};

    let wManualEvent = {
        "_id": "", 
        "selected": false,
        "startDate": pDate,
        "startTime": pTime,
        "duration": pDuration,
        "requiredYear": pYear,
        "requiredJDate": pJDate,
        "round": wRound,
        "noPlayers": wNoPlayers,
        "matchKey": wMatchKey,
        "dateBooked": pInsert.dateBooked,
        "isBye": pInsert.isBye,
        "bookingStatus": pInsert.bookingStatus,
        "parentId": pInsert.parentId,
        "scoreA": pInsert.scoreA,
        "scoreB": pInsert.scoreB 
    }
    
    try {
        let wMaxExtraSlots = parseInt(pMaxExtraSlots,10);
        let wParams  = await processManualEventType();
        let wNoSlots = parseInt((pToSlot - pFromSlot + 1),10);
        let wToSlot = parseInt(pToSlot,10);
        let wFromSlot = parseInt(pFromSlot,10);
        if (wNoSlots > wMaxExtraSlots + 1){         //Extra slots gors from 0, NoSLots includes the original ie goes from 1
            wToSlot = wFromSlot + wMaxExtraSlots;
            let wActual = parseInt((wToSlot - wFromSlot),10);
            //console.log("wNoS = ", wNoSlots, "wTo = ", wToSlot, "wFrom = ", wFromSlot, "wToS = ", wToSlot, "Actual = ", wActual)
            //console.log(`client Booking processRecord ${wActual} slot(s) stored of ${wNoSlots} requested`);
            showError(14);
        }
        let wBookingsList = await addBookings(wBookerId, wManualEvent, pStartRink, pNoRinks, pSlotRange, wFromSlot, wToSlot, wParams);
        let wResult = await processEventBookings("", wBookingsList);
        if (wResult.status){
            let wNewBookings = wResult.bookings;
            let wNewBooking = wNewBookings[0]
            gSelectedCell.bookingRef = wNewBooking._id;
            $w('#lblFullBookRef').text = gSelectedCell.bookingRef;
            $w('#lblBookRef').text = gSelectedCell.bookingRef.substring(0, 8);
            return {"status": true, "bookings": wNewBookings, "error": null};
        } else {
            return {"status": false, "bookings": [], "error": wResult.error};
        }    
    }
    catch (err){
        console.log(`/page/Booking by ${loggedInMember.lstId} processRecord Try-catch, err`);
        console.log(err);
        return {"status": false, "bookings": [], "error": err};
    }
}

function processManualEventType(){

    let wPlayerBId = "";
    if ($w('#lblPlayerBId').text.length === 0) {
        wPlayerBId = null;
    } else {
        wPlayerBId = $w('#lblPlayerBId').text;
    }
    let wUse = $w('#lblUse').text;
    let wUsage = wUse;
    if (wUse.includes("National") || wUse.includes("County") || wUse.includes("Other")) {
        wUsage = $w('#lblUse').text + "/" + $w('#inpCountyOther').value.trim();
    }
    let wParams = {
        "source": "M",
        "duration": $w('#tpkBookingDetailDuration').value.substring(0,5),
        "title": null,
        "use": wUsage,
        "f2": parseInt($w('#inpNoPlayers').value, 10),
        "f3": $w('#lblPlayerAId').text,
        "f5": wPlayerBId
    }

    return wParams;
}


function addDurationToTime(time, duration) {
    // Split the time and duration strings into hours and minutes
    const [timeHours, timeMinutes] = time.split(':').map(Number);
    const [durationHours, durationMinutes] = duration.split(':').map(Number);

    // Calculate new hours and minutes by adding duration
    let newHours = timeHours + durationHours;
    let newMinutes = timeMinutes + durationMinutes;

    // Adjust if minutes exceed 60
    newHours += Math.floor(newMinutes / 60);
    newMinutes %= 60;

    // Format hours and minutes to always have two digits
    const formattedHours = String(newHours).padStart(2, '0');
    const formattedMinutes = String(newMinutes).padStart(2, '0');

    // Return the new time
    return `${formattedHours}:${formattedMinutes}`;
}



//	====================================================== Booking Detail Supporting Functions=============================================
//
export async function populateBookingDetailForm(p_selected_cell) {

    $w('#strHdr').collapse();
    $w('#boxSlots').collapse();
    $w('#boxClubCompetitions').collapse();
    $w('#boxEvent').collapse();
    $w('#boxUK').collapse();
    $w('#boxCompBooking').collapse();
    $w('#drpCompetition').enable();

    $w('#txtSaveMsg').text = "";
    // we have already checked they are signed on by this point
     let [wMsg, wCount] = displayExtraSlotsMessage(p_selected_cell);
    $w('#lblBookingDetailExtraSlots').text = wMsg;
    $w('#lblBookingDetailExtraSlotCount').text = String(wCount);
    if (gMode === MODE.EDIT) {
        performEditBooking(p_selected_cell);
    } else {
        performNewBooking(p_selected_cell);
    }
}

function displayExtraSlotsMessage(pSelectedCell){
    let wMsg = "";

    let wNumberOfExtraSlots = gGrid.getExtraSlots(pSelectedCell.slot, pSelectedCell.rink);

    if (wNumberOfExtraSlots === 0) {
        wMsg = "There are no more slots available";
    } else if (wNumberOfExtraSlots === 1){
        wMsg = "There is 1 more extra slot available";

    }else {
        wMsg = `There are ${wNumberOfExtraSlots} more slots available`;
    }
    return [wMsg, wNumberOfExtraSlots];
}

function performNewBooking(p_selected_cell) {
    let w_today = new Date();

    let wTimeRange = $w('#tpkStart').enabledTimes;
    let [wStartHour, wStartMin, wStart, wEnd] = getTimeSlotStart(gSlot);
    if (wTimeRange) {
        wTimeRange[0].startTime = wStart;
        wTimeRange[0].endTime = wEnd;
    }
    let wDate = $w('#dpkStartDate').value;
    wDate.setHours(wStartHour, wStartMin, 0);

    $w('#btnContinue').hide();
    if /* the first time slot cannot be a continuation */ (gSlot > 1) {
        let wCell = gGrid.getCell(gSlot - 1, gRink);
        if (wCell.cellStatus === "B") {
            $w('#btnContinue').show();
        }
    }

    selectButton("");       //cear all buttons
    $w('#boxSelect').expand();
    $w('#boxEvent').collapse();
    $w('#boxCompBooking').collapse();
    $w('#boxPlayerEdit').show();
    $w('#lblUse').text = "";
    $w('#lblSelectedUse').text = ""; ///

    //$w('#btnOther').style.backgroundColor = BUTTON_SELECTED;

    $w('#btnSave').label = "Save";
    $w('#btnSave').enable();

    $w('#btnDelete').disable();
    $w('#chkOwnUse').show();

    $w('#tpkStart').enable();
    $w('#inpNoPlayers').enable();

    $w("#tpkStart").step = 5;
    $w("#tpkStart").enabledTimes = wTimeRange;

    //	form elements
    $w('#txtDateBooking').text = formatDateString($w('#dpkStartDate').value);
    $w('#tpkStart').value = wStart;
    $w('#tpkBookingDetailDuration').value = "01:30";
    $w('#lblFullBookRef').text = "";
    $w('#lblBookRef').text = "";
    $w('#lblMatchKey').text = "";
    $w('#txtRink').text = String(gRink);
    $w('#txtSlot').text = gSlotString;
    $w('#lblRangeId').text = String(gRangeId);
    $w('#lblSlotId').text = String(gSlot);
    $w('#txtBooker').text = loggedInMember.name;
    $w('#lblBookingDetailBookerId').text = loggedInMember.lstId;
    $w('#inpNoPlayers').enable();
    $w('#inpCountyOther').value = "";
    $w('#chkOwnUse').checked = true;
    $w('#dpkBookingDetailDateBooked').value = w_today;
    $w('#lblBookingDetailStatus').text = "N";
    $w('#inpBookingDetailScoreA').value = "0";
    $w('#inpBookingDetailScoreB').value = "0";
    $w('#drpRound').value = "0";
    $w('#lblBookingDetailNewKey').text = "";
    $w('#inpBookingDetailCompRef').value = "";
    $w('#inpBookingDetailIsBye').value = "N";
    $w('#lblBookingDetailResourceKey').text = "";
    $w('#inpBookingDetailCompTitle').value = "";
    $w('#lblBookingDetailHasChildren').text = "N";
    $w('#lblBookingDetailParentId').text = "";
    $w('#lblBookingDetailPid').text = "";
    $w('#lblBookingDetailEventId').text = "";
    $w('#lblEventId').text = "";

    clearPlayersBox();
}

async function performEditBooking(p_selected_cell) {
    //console.log(p_selected_cell);
    let wTimeRange = $w('#tpkStart').enabledTimes;
    let [wStartHour, wStartMin, wStart, wEnd] = getTimeSlotStart(gSlot);
    if (wTimeRange) {
        wTimeRange[0].startTime = wStart;
        wTimeRange[0].endTime = wEnd;
    }

    let wDate = $w('#dpkStartDate').value;
    wDate.setHours(wStartHour, wStartMin, 0, 0);
    //$w('#tpkStart').disable();

    let wBookingsList = [];
    let wResult = await getLinkedBookings(p_selected_cell.bookingRef);
    if(wResult.status) {
        wBookingsList = wResult.bookings;
    }
    if (wBookingsList.length > 0){
        $w('#lblBookingDetailNoSlots').text = String(wBookingsList.length + 1);
    } else {
        $w('#lblBookingDetailNoSlots').text = "1";
    }
    $w('#tpkBookingDetailDuration').value= gSelectedCell.duration;
    $w('#btnContinue').hide();
    if (p_selected_cell.usage === "Continuation") {
        $w('#btnContinue').show();
    }

    if (p_selected_cell.compRef.includes("EVENT")) {
        configureEventEdit();
        if (p_selected_cell.compRef.includes("FG")) {
            $w('#lblUse').text = p_selected_cell.compTitle + " " + p_selected_cell.usage;
        } else {
            $w('#lblUse').text = p_selected_cell.compTitle;
        }
        $w('#lblSelectedUse').text = $w('#lblUse').text; ///
    } else if (p_selected_cell.compRef.includes("MANUAL")) {
        //console.log(p_selected_cell.usage);
        let [wUsage, wOther] = extractUsageOther(p_selected_cell.usage);
        switch (wUsage) {
        case "Roll up":
        case "Lockdown game":
            selectButton("Other");
            configureManualEdit(wUsage, "");
            break;
        case "County":
        case "County game":
            selectButton("County");
            configureManualEdit(wUsage, wOther);
            break;
        case "National":
        case "National game":
            selectButton("National");
            configureManualEdit(wUsage, wOther);
            break;
        case "Continuation":
            selectButton("Continuation");
            configureManualEdit(wUsage, "");
            break;
        case "Other":
            selectButton("Other");
            configureManualEdit(wUsage, wOther);
            break;
        case "Club Roll Up":
        case "May's Day":
        case "May's day":
        case "Mays day":
        case "Tom Linscott":
        case "Club Night":
            configureEventEdit();
            $w('#lblUse').text = "Auto generated - " + wUsage;
            $w('#lblSelectedUse').text = $w('#lblUse').text;
            break;
        default:
            selectButton("Default");
            configureManualEdit(wUsage, "");
            break;
        }
    } else /* this is a club competition booking to be edited */ {
        let wGender = p_selected_cell.compRef.slice(-1);
        if (wGender === "M") {
            selectButton("MensCompetition");
            setCompetitionDropdown("M");
        } else if (wGender === "L") {
            selectButton("LadiesCompetition");
            setCompetitionDropdown("L");
        } else {
            selectButton("MixedCompetition");
            setCompetitionDropdown("X");
        }
        $w('#boxSelect').expand();
        $w('#boxEvent').collapse();
        $w('#boxCompBooking').collapse();
        $w('#boxClubCompetitions').expand();
        $w('#boxManaged').expand();
        $w('#boxNoManaged').collapse();
        $w('#boxPlayerEdit').hide();
        $w('#drpStage').collapse();
        $w('#drpDivision').collapse();
        $w('#lblHdrRound').collapse();
        $w('#drpRound').collapse();
        $w('#drpCompetition').disable();
        $w('#rptGames').hide();
        $w('#btnSave').label = "Update";
        $w('#btnDelete').disable();

        $w('#drpCompetition').value = p_selected_cell.compRef;
        $w('#lblUse').text = p_selected_cell.compTitle;
        $w('#lblSelectedUse').text = $w('#lblUse').text;
    }

    $w('#chkOwnUse').checked = false;
    $w('#chkOwnUse').hide();
    $w('#inpNoPlayers').enable();

    //	Remaining Form elements
    populateForm(p_selected_cell);
    if (isWithinTimeSlot(p_selected_cell.startTime, wStart, wEnd)) {
        //console.log("Within time slot");
        $w('#tpkStart').value = convertNull(p_selected_cell.startTime, wStart);
    } else {
        $w('#tpkStart').value = wStart;
    }
    if (p_selected_cell.playerAId === null || p_selected_cell.playerAId === undefined) {
        $w('#txtPlayerA').text = "";
        $w('#lblPlayerAId').text = "0";
    } else {
        $w('#txtPlayerA').text = p_selected_cell.playerA;
        $w('#lblPlayerAId').text = p_selected_cell.playerAId;
    }
    if (p_selected_cell.playerBId === null || p_selected_cell.playerBId === undefined) {
        $w('#txtPlayerB').text = "";
        $w('#lblPlayerBId').text = "0";
    } else {
        $w('#txtPlayerB').text = p_selected_cell.playerB;
        $w('#lblPlayerBId').text = p_selected_cell.playerBId;
    }
}

function populateForm(p_selected_cell){
    //console.log(p_selected_cell);
    let wEventId = p_selected_cell.eventId;
    $w('#txtDateBooking').text = formatDateString($w('#dpkStartDate').value);
    $w('#tpkBookingDetailDuration').value = p_selected_cell.duration || "01:30";
    $w('#lblFullBookRef').text = convertNull(p_selected_cell.bookingRef, "");
    $w('#lblBookRef').text = convertNull(p_selected_cell.bookingRef.substring(0, 8), "");
    $w('#lblMatchKey').text = convertNull(p_selected_cell.matchKey, "");
    $w('#txtRink').text = String(p_selected_cell.rink);
    $w('#lblSlotId').text = String(gSlot);
    $w('#txtSlot').text = gSlotString;
    $w('#lblRangeId').text = String(gRangeId);
    $w('#lblSlotId').text = String(gSlot);
    $w('#txtBooker').text = p_selected_cell.booker;
    $w('#lblBookingDetailBookerId').text = p_selected_cell.bookerId;
    $w('#inpNoPlayers').value = convertToZero(parseInt(p_selected_cell.noPlayers, 10));
    $w('#dpkBookingDetailDateBooked').value = p_selected_cell.dateBooked;
    $w('#lblBookingDetailStatus').text = p_selected_cell.bookingStatus;
    $w('#inpBookingDetailScoreA').value = p_selected_cell.scoreA;
    $w('#inpBookingDetailScoreB').value = p_selected_cell.scoreB;
    $w('#drpRound').value = String(p_selected_cell.round);
    $w('#lblBookingDetailNewKey').text = p_selected_cell.newKey;
    $w('#inpBookingDetailCompRef').value = p_selected_cell.compRef;
    $w('#inpBookingDetailIsBye').value = p_selected_cell.isBye;
    $w('#lblBookingDetailResourceKey').text = p_selected_cell.resourceKey;
    $w('#inpBookingDetailCompTitle').value = p_selected_cell.compTitle;
    $w('#lblBookingDetailHasChildren').text = p_selected_cell.hasChildren;
    $w('#lblBookingDetailParentId').text = p_selected_cell.parentId;
    $w('#lblBookingDetailPid').text = p_selected_cell.pId;
    $w('#lblBookingDetailEventId').text = wEventId;
    $w('#lblEventId').text = wEventId.substring(0,8);
}

function extractUsageOther(pString) {
    let wPos = pString.indexOf("/");
    let wUsage = pString;
    let wOther = "";
    if (wPos === -1) {
        // no / in usage
        wOther = "";
    } else if (wPos === 0) {
        // / found in first char position
        wOther = "";
    } else if (wPos === pString.length) {
        //	found / in last postion ie no Other text
        wOther = "";
    } else {
        // found other 
        wOther = pString.substring(wPos + 1);
        wUsage = pString.substring(0, wPos);
    }
    return [wUsage, wOther];
}

function isWithinTimeSlot(pTime, pStart, pEnd) {
    let wAns = false;
    let [wTimeHour, wTimeMin] = parseTime(pTime);
    let [wStartHour, wStartMin] = parseTime(pStart);
    let [wEndHour, wEndMin] = parseTime(pEnd);
    const wTimeOffset = wTimeHour * 60 + wTimeMin;
    const wStartOffset = wStartHour * 60 + wStartMin;
    const wEndOffset = wEndHour * 60 + wEndMin;
    if (wTimeOffset >= wStartOffset) {
        if (wTimeOffset <= wEndOffset) {
            wAns = true;
        }
    }
    return wAns;

}

function configureEventEdit() {
    $w('#boxSelect').collapse();
    $w('#boxEvent').expand();
    $w('#boxCompBooking').collapse();
    $w('#boxPlayerEdit').hide();
    $w('#inpNoPlayers').hide();
    $w('#btnSave').disable();
    $w('#inpRound').disable();
    $w('#btnSave').label = "Update";
    $w('#btnDelete').enable();
}

function configureManualEdit(pUsage, pOther) {
    $w('#boxSelect').expand();
    $w('#boxEvent').collapse();
    $w('#boxCompBooking').collapse();
    $w('#boxPlayerEdit').show();
    $w('#btnSave').enable();
    $w('#lblUse').text = pUsage;
    $w('#lblSelectedUse').text = pUsage;
    if (pUsage.includes("County") || pUsage.includes("National") || pUsage.includes("Other")) {
        $w('#btnLadiesComp').disable();
        $w('#btnMensComp').disable();
        $w('#btnMixedComp').disable();
        $w('#boxUK').expand();
        $w('#inpCountyOther').value = pOther;
    } else {
        $w('#btnLadiesComp').enable();
        $w('#btnMensComp').enable();
        $w('#btnMixedComp').enable();
        $w('#boxUK').collapse();
        $w('#inpCountyOther').value = "";
    }
    $w('#btnSave').label = "Update";
    $w('#btnDelete').enable();
}

function clearPlayersBox(){
    if ($w('#chkOwnUse').checked) {
        $w('#txtPlayerA').text = $w('#txtBooker').text;
        $w('#lblPlayerAId').text = $w('#lblBookingDetailBookerId').text;
    } else {
        $w('#txtPlayerA').text = "";
        $w('#lblPlayerAId').text = "0";
    }
    $w('#txtPlayerB').text = "";
    $w('#lblPlayerBId').text = "0";
    $w('#inpNoPlayers').value = "1";
    $w('#lblUse').text = "";
    $w('#lblSelectedUse').text = ""; ///
}

function isManager(pRoles) {
    if (isRequiredRole(["Manager", "Admin"], pRoles)) { return true }
    return false;
}

//=========================================Competition Box=====================================================
//
export async function btnLadiesComp_click(event) {
    displaySlotBox("CL");
    selectButton("LadiesCompetition");
    setCompetitionDropdown("L");
    //$w('#lblUse').text = "Ladies Club Comp";
    //$w('#lblSelectedUse').text = "Ladies Club Comp"; ///
}

export async function btnMensComp_click(event) {
    displaySlotBox("CM");
    selectButton("MensCompetition");
    setCompetitionDropdown("M");
    //$w('#lblUse').text = "Mens Club Comp";
    //$w('#lblSelectedUse').text = "Mens Club Comp"; ///
}

export function btnMixedComp_click(event) {
    displaySlotBox("CX");
    selectButton("MixedCompetition");
    setCompetitionDropdown("X");
    //$w('#lblUse').text = "Mixed Club Comp";
    //$w('#lblSelectedUse').text = "Mixed Club Comp"; ///
}

export function btnNational_click(event) {
    displaySlotBox("UN");
    selectButton("National");
    $w('#lblUse').text = "National game";
    $w('#lblSelectedUse').text = "National game"; ///
    $w('#boxClubCompetitions').collapse();
    $w('#boxEvent').collapse();
    $w('#boxUK').expand();
    $w('#boxCompBooking').collapse();
}

export function btnCounty_click(event) {
    displaySlotBox("UC");
    selectButton("County");
    $w('#lblUse').text = "County game";
    $w('#lblSelectedUse').text = "County game"; ///
    $w('#boxClubCompetitions').collapse();
    $w('#boxEvent').collapse();
    $w('#boxUK').expand();
    $w('#boxCompBooking').collapse();
}

export function btnContinue_click(event) {
    displaySlotBox("OO");
    selectButton("Continuation");
    $w('#lblUse').text = "Continuation";
    $w('#lblSelectedUse').text = "Continuation"; ///
    $w('#boxClubCompetitions').collapse();
    $w('#boxEvent').expand();
    $w('#boxUK').collapse();
    $w('#boxCompBooking').collapse();
}

export function btnOther_click(event) {
    displaySlotBox("OR");
    selectButton("Other");
    $w('#boxClubCompetitions').collapse();
    $w('#lblUse').text = "Other";
    $w('#lblSelectedUse').text = ""; ///
    $w('#boxClubCompetitions').collapse();
    $w('#boxEvent').expand();
    $w('#boxUK').expand();
    $w('#inpCountyOther').focus();
    $w('#boxCompBooking').collapse();
}
function displaySlotBox(pSource){
//  At the moment this is hard coded. When ready, it will take its values from lstClubComp 
    
    let wHours = "";
    let wMins = "";
    let wTime = "";
    let wTimeSet = "";

    switch (pSource) {
        case "CL":
        case "CM":
        case "CX":
            wHours = "2 hours";
            wTimeSet = "02:00";
            break;
        case "UN":
        case "UC":
            wHours = "3 hours";
            wTimeSet = "03:00";
            break;
        case "OO":
        case "OR":
            wHours = "1 hour";
            wMins = "30 minutes"
            wTimeSet = "01:30";
            break;
        default:
            wHours = "1 hour";
            wMins = "30 minutes"
            wTimeSet = "01:30";
            break;
    }
    if (wMins.length > 0) {
        wTime = wHours + "" + wMins;
    } else {
        wTime = wHours;
    }
    let wHdr = `This selection usually requires ${wTime}. If you need a different duration, select here:`;
    $w('#tpkBookingDetailDuration').value = wTimeSet;
    $w('#lblSlotsHdr').text = wHdr;
    if (gMode !== MODE.EDIT) {
        $w('#boxSlots').expand();
    }
}

export function convertDuration(pDuration) {
  let wHours = Math.floor(pDuration);
  let wMin = Math.round((pDuration % 1)*100)/100;
  return wHours.toString().padStart(2,0) + ":" + (60*wMin).toString().padStart(2,0);
}

function getDecimalPart(pNumber){
    let decimalValue = pNumber.toString().indexOf(".");
    let result = pNumber.toString().substring(decimalValue+1);
    return result;
}

function selectButton(pUse) {
    switch (pUse) {
    case "LadiesCompetition":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "MensCompetition":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "MixedCompetition":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "National":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "County":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "Continuation":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_SELECTED;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
        break;
    case "Other":
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_SELECTED;
        break;
    default:
        $w('#btnLadiesComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMensComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnMixedComp').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnNational').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnCounty').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnContinue').style.backgroundColor = BUTTON_NORMAL;
        $w('#btnOther').style.backgroundColor = BUTTON_NORMAL;
    }
}
/**
 * deprecated
 */
export async function drpManualCompetition_change(event) {
    $w('#imgWait').show();
    let wRef = event.target.value;
    $w('#drpStage').collapse();
    $w('#drpDivision').collapse();
    $w('#lblHdrRound').collapse();
    $w('#drpRound').collapse();
    let wCompRec = await getCompetition(gYear, wRef);
    $w('#lblUse').text = wCompRec.title;
    $w('#lblSelectedUse').text = wCompRec.title; ///

    if (wCompRec) { return }
    clearMatches();
    $w('#lblStageState').text = "";
    $w('#lblDivisionState').text = "";
    $w('#lblRoundState').text = "";
}

//
//=========================================Manaaged - On Hold for future use =====================================================
export function drpCompetition_change(event) {
    let wRef = event.target.value;
    if (wRef === undefined || wRef === null || wRef === "") { return }
    if (wRef.startsWith("X")) { return }
    $w('#imgWait').show();
    $w('#drpStage').collapse();
    $w('#drpDivision').collapse();
    $w('#lblHdrRound').collapse();
    $w('#drpRound').collapse();
    chkOwnUse_change();
    $w('#txtPlayerB').text = "";
    $w('#lblPlayerBId').text = "0";
    selectCompetition(gYear, wRef)
        .then(wResultObj => {
            if (wResultObj) {
                gCompRec = wResultObj.competitionObj;
                if (gCompRec.maintainedBy === "A") {
                    gStageRec = wResultObj.stageDivObj;
                    if (gStageRec) {
                        if (gCompRec.shape === "KO") {
                            gMatchesInRound = getUnscheduledMatches();
                        } else {
                            gMatchesInRound = wResultObj.matchesInRoundArray;
                        }
                        if (gMatchesInRound) {
                            $w('#rptGames').show();
                            showGames();
                            $w('#imgWait').hide();
                            return;
                        }
                }
                } else {
                    $w('#boxCompBooking').collapse();
                    $w('#lblUse').text = gCompRec.title;
                    $w('#lblSelectedUse').text = gCompRec.title;
                    $w('#imgWait').hide();
                    return;
                }
            }
            clearMatches();
            showNoGames(2);
            $w('#lblCompetitionState').text = "Competition is not configured properly";
            $w('#lblStageState').text = "";
            $w('#lblDivisionState').text = "";
            $w('#lblRoundState').text = "";
        })
}

export function drpStage_change(event) {
    $w('#imgWait').show();
    let wNewStage = parseInt(event.target.value, 10);
    let wResultObj = selectStage(wNewStage);
    if (wResultObj) {
        gStageRec = wResultObj.stageDivObj;
        if (gStageRec) {
            gMatchesInRound = wResultObj.matchesInRoundArray;
            if (gMatchesInRound) {
                showGames();
                $w('#imgWait').hide();
                return;
            }
        }
    }
    clearMatches();
}

export function drpDivision_change(event) {
    $w('#imgWait').show();
    let wNewDiv = parseInt(event.target.value, 10);
    let wResultObj = selectDivision(gStageRec.stage, wNewDiv);
    if (wResultObj) {
        gStageRec = wResultObj.stageDivObj;
        if (gStageRec) {
            gMatchesInRound = wResultObj.matchesInRoundArray;
            if (gMatchesInRound) {
                showGames();
                $w('#imgWait').hide();
                return;
            }
        }
    }
    clearMatches();
}

export function drpRound_change(event) {
    $w('#imgWait').show();
    let wNewRound = parseInt(event.target.value, 10);
    gMatchesInRound = selectRound(gStageRec.stage, gStageRec.div, wNewRound);
    showGames();
    $w('#imgWait').hide();
}

export function showGames() {
    $w('#boxCompBooking').expand();
    let wMatchesToDisplay = gMatchesInRound.filter(item => item.isBye === "N")
        .filter(item => item.bookingStatus === BOOKING.READY);
    if (wMatchesToDisplay.length > 0) {
        $w('#boxManaged').expand();
        $w('#boxNoManaged').collapse();
        if ($w('#drpStage').options.length > 1) { $w('#drpStage').expand() } else { $w('#drpStage').collapse() };
        if ($w('#drpDivision').options.length > 1) { $w('#drpDivision').expand() } else { $w('#drpDivision').collapse() };
        if ($w('#drpRound').options.length > 1 && gCompRec.shape !== "KO") { 
            $w('#lblHdrRound').expand();
            $w('#drpRound').expand() 
        } else {
            $w('#lblHdrRound').collapse();
            $w('#drpRound').collapse()
        }
        $w('#lblManagedMsg').collapse();
        $w('#rptGames').expand();
        $w('#rptGames').data = wMatchesToDisplay;
    } else {
        showNoGames(1);
    }
}

function showNoGames(pWhy) {
    let wMsg = "";
    if (pWhy === 1) {
        wMsg = "There are no outstanding matches to be scheduled for this competition";
    } else {
        wMsg = "This competition is not ready to be scheduled";
    }
    $w('#boxCompBooking').expand();
    showError(12);
    $w('#lblNoManagedMsg').text = wMsg;
    $w('#boxManaged').collapse();
    $w('#boxNoManaged').expand();
    $w('#rptGames').data = [];
    $w('#btnSave').disable();
}

export function clearMatches() {
    let wData = [];
    gMatchesInRound = [];
    $w('#rptGames').data = wData;
    $w('#imgWait').hide();
}

export function boxGames_click(event) { //this is the box inside rptGames
    let wItem = $w.at(event.context);
    let wId = event.context.itemId;
    $w('#rptGames').forItems([wId], ($item, itemData, index) => {
        $w('#lblFullBookRef').text = itemData._id;
        $w('#lblBookRef').text = itemData._id.substring(0, 8);
        $w('#lblMatchKey').text = convertNull(itemData.matchKey, "");
        $w('#lblPlayerAId').text = itemData.playerAId;
        $w('#lblPlayerBId').text = itemData.playerBId;
        $w('#inpNoPlayers').value = itemData.noPlayers;
    })
    $w('#lblSelectedUse').text = gCompRec.title;
    $w('#lblUse').text = gCompRec.title;
    $w('#chkOwnUse').checked = false;
    gMode = MODE.SCHEDULE;
    ///

    if (gCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
        $w('#txtPlayerA').text = $w('#lblPlayerAId').text;
        $w('#txtPlayerB').text = $w('#lblPlayerBId').text;
    } else {
        $w('#txtPlayerA').text = wItem('#txtSkipA').text;
        $w('#txtPlayerB').text = wItem('#txtSkipB').text;
    }
}

//	================================================ Manage Dates ================================
export async function dpkStartDate_change() {
    let wDate = $w('#dpkStartDate').value;
    wDate.setHours(10, 0, 0, 0);
    let wDateString = toJulian(wDate);
    let wYear = parseInt(wDateString.substr(0, 4), 10);
    let wJDay = parseInt(wDateString.substr(4, 3), 10);
    //console.log("Pages/Booking/dpkStartDate_change/ dpkr value ", wYear, wJDay);

    if (wYear !== gYear) {
        let wResultObj = await loadCompetitions(wYear);
        gYear = wYear;

    }

    let res = await processDay(wYear, wJDay);
    //console.log("date change finish");
}

export async function processDay(pYear, pJDate) {
    try {
        $w('#imgWait').show();
        let wCompRec = [];
        let w_book_out = [];
        let wAllBookings = await getBookingsForJulianDate(pYear, pJDate);
        w_book_out = wAllBookings.filter( item => item.isBye !== "Y")
                                .filter( item => item.bookingStatus !== "N")
                                .filter (item => item.bookingStatus !== "R") // leaving only "O" or "P"
        $w('#btnMove').hide();

        for (let i = 0; i < w_book_out.length; i++) {
            let item = w_book_out[i];
            w_book_out[i].booker = getFullNameLocally(item.bookerId);
            /** find wCompRec */

            if (item.matchKey !== "" && item.matchKey !== undefined) {
                wCompRec = await getCompetition(pYear, item.compRef);
            }
            if (item.compRef.toUpperCase().includes("EVENT")) {
                w_book_out[i].booker = getFullNameLocally(item.bookerId);
            } else {
                if (item.usage === "Temporary booking") {
                    w_book_out[i].playerA = "Temporary Holder";
                    w_book_out[i].playerB = "Temporary Holder";
                } else if (item.usage === "Not available") {
                    w_book_out[i].playerA = "Temporarily Closed";
                } else {
                    w_book_out[i].booker = getFullNameLocally(item.bookerId);
                    if (item.playerAId === item.bookerId) {
                        w_book_out[i].playerA = w_book_out[i].booker;
                    } else {
                        if (wCompRec) {
                            if (wCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
                                w_book_out[i].playerA = item.playerAId;
                            } else {
                                w_book_out[i].playerA = getFullNameLocally(item.playerAId);
                            }
                        } else {
                            w_book_out[i].playerA = getFullNameLocally(item.playerAId);
                        }
                    }
                    if (item.playerBId) {
                        if (wCompRec) {
                            if (wCompRec.competitorType === COMPETITOR_TYPE.TEAM) {
                                w_book_out[i].playerB = item.playerBId;
                            } else {
                                w_book_out[i].playerB = getFullNameLocally(item.playerBId);
                            }
                        } else {
                            w_book_out[i].playerB = getFullNameLocally(item.playerBId);
                        }
                    }
                }
            }
            wCompRec = [];
        }
        $w('#imgWait').hide();
        gNoRinks = getRinksForDay(pJDate);
        [gRangeId, gNoSlots] = getSlotsForDay(pYear, pJDate);
        gGrid.noOfRinks = gNoRinks;
        gGrid.noOfSlots = gNoSlots;
        gGrid.initialiseGrid(pJDate);
        if (w_book_out.length !== 0){
            gGrid.refresh(w_book_out);
        }
        //gGrid.printGrid();
        if (w_book_out.length !== 0) {
            if (wixWindow.formFactor === "Mobile") {
                gSelectedCell.doClear();
                gMobileIndex = 0;
                let wRink = 1;
                let wS = (gMobileView === "S") ? getSlotString(gMobileIndex, true) : "Rink " + String(wRink);
                $w('#lblMobilePgnHdr').text = wS; 
                let wData = (gMobileView === "S") ? gGrid.getRow(gMobileIndex + 1) : gGrid.getCol(gMobileIndex + 1);
                let res = refreshRptGridM(wData);
                $w('#btnMLast').hide();
                $w('#btnMNext').show();
            } else {
                
                //gGrid.clearCell(gSelectedCell.slot, gSelectedCell.rink);
                gSelectedCell.doClear();
            // doClear(gSelectedCell, "00");
                let wS = gGrid.getData();
                //$w("#rptGrid").data = [];
                let res = refreshRptGridD(wS);
               //$w("#rptGrid").data = wS;
            }
        } else {
            if (wixWindow.formFactor === "Mobile") {
                let wData = (gMobileView === "S") ? gGrid.getRow(gMobileIndex + 1) : gGrid.getCol(gMobileIndex + 1);
                let res = refreshRptGridM(wData);
            } else {
                let wS = gGrid.getData();
                let res = refreshRptGridD(wS);
            }
        }
        return true;
    }
    catch (err) {
        if (isLoggedIn){
            console.log(`/page/Booking by ${loggedInMember.lstId} processDay Try-catch, err`);
        } else {
            console.log(`/page/Booking none logged in processDay Try-catch, err`);
        }
        console.log(err);
        return false;
    }
}

export async function btnNext_click(event) {
    $w('#imgWait').show();
    let wDate = $w('#dpkStartDate').value;
    wDate.setHours(10, 0, 0, 0);
    let finalDate = new Date(wDate);
    finalDate.setDate(wDate.getDate() + 1);
    $w('#dpkStartDate').value = finalDate;

    let wDateString = toJulian(finalDate);
    let wYear = parseInt(wDateString.substr(0, 4), 10);
    let wJDay = parseInt(wDateString.substr(4, 3), 10);
    let res = await processDay(wYear, wJDay);
}

export async function btnLast_click(event) {
    $w('#imgWait').show();
    let wDate = $w('#dpkStartDate').value;
    wDate.setHours(10, 0, 0, 0);
    let finalDate = new Date(wDate);
    finalDate.setDate(wDate.getDate() - 1);
    $w('#dpkStartDate').value = finalDate;

    let wDateString = toJulian(finalDate);
    let wYear = parseInt(wDateString.substr(0, 4), 10);
    let wJDay = parseInt(wDateString.substr(4, 3), 10);
    let res = await processDay(wYear, wJDay);
}

//	============================================================= Mobile Area =============================================
//
export function rgpMobileView_change(event) {
    let wView = event.target.value;
    if (wView === "R"){
        // do rinks
        $w('#lblMobileColHdr').text = "Slots";
        gMobileIndex = 1;
    } else {
        //do slots
        $w('#lblMobileColHdr').text = "Rinks";
        gMobileIndex = 0;
    }
    gMobileView = wView;
    updateMobileGridView(gMobileIndex);
}

export async function btnMNext_click(event) {
    $w('#imgWait').show();
    if ($w('#btnMLast').hidden) {
        $w('#btnMLast').show();
    }
    let wMax = (gMobileView === "S") ? gNoSlots : gNoRinks;
    if (gMobileIndex < wMax) {
        gMobileIndex++;
        updateMobileGridView(gMobileIndex);
    } else {
        $w('#btnMNext').hide();
    };
}

export async function btnMLast_click(event) {
    $w('#imgWait').show();
    if ($w('#btnMNext').hidden) {
        $w('#btnMNext').show();
    }
    if (gMobileIndex > 0) {
        gMobileIndex--;
        updateMobileGridView(gMobileIndex);
    } else {
        $w('#btnMLast').hide();
    };
}

export function updateMobileGridView(pCount){
    let wTxt = (gMobileView === "S") ? getSlotString(pCount, true) : "Rink " + String(pCount);
    $w('#lblMobilePgnHdr').text = wTxt;
    let wS = [];
    let wMin = 0;
    let wMax = 6;
    if (gMobileView === "S") {
        wMin = 0;
        wMax = gNoSlots - 1;
        wS =  gGrid.getRow(pCount + 1);
    } else {
        wMin = 1;
        wMax = gNoRinks;
        wS = gGrid.getCol(pCount);
    }
    $w("#rptGridM").data = wS;
    if (gMobileIndex === wMin) {
        $w('#btnMLast').hide();
        $w('#btnMNext').show();
    }
    if (gMobileIndex === wMax) {
        $w('#btnMNext').hide();
        $w('#btnMLast').show();
    }
    $w('#imgWait').hide();
}
/** DEPRECATAD  
export async function cntBookingMobile_click(event) {
    let w_id = event.context.itemId;
    if (w_id === w_selected_Mcell.id) { return }; // clicked itself
    let $item = $w.at(event.context);
    let wCell = gGrid.getCell(w_id[0], w_id[1]);
    if ($item('#lblHdrM').text === "Rink") {
        if (gMode !== "Move" || gFromCell.compRef.substring(0, 5) !== "EVENT") {
            clearMobileSelection();
            return
        }
    } // skip Not in use cells

    if (wCell.bookingStatus === "P") { showError(9); return };
    ///console.log(wCell);
    if (wCell.parentId && wCell.parentId.length > 0) {
        // although clicked in one of its children swt the selected cell to the parent
        wCell = gGrid.getParentCell(w_id, wCell.parentId);
        w_id = wCell.id;
        $item = setRptGridMItem(w_id);
        ///console.log("Parent cell");
        ///console.log(wCell); 
    };

    if (wCell.cellStatus === "B") {
        if (gMode === "Move") { showError(3); return };
        if (isManager(loggedInMemberRoles) ||
            wCell.bookerId === loggedInMember.lstId ||
            wCell.playerAId === loggedInMember.lstId ||
            wCell.playerBId === loggedInMember.lstId
        ) {
            makeMobileSelection(w_id, $item, wCell);
            //if ($item('#lblHdrM').text.includes("Ladder")) {}
            if (wCell.compRef.trim()) {
                $w('#btnMove').label = "Move booking";
                $w('#btnMove').show();
            }
            $w('#txtErrorMsg').text = "";
            $w('#btnBookRink').label = "Edit booking";
            $w('#btnBookBottom').label = "Edit booking";
            $w('#txtDetailHdr').text = "Update Booking";
            gMode = "Edit";
            return
        } else {
            $w('#btnBookRink').label = "Book rink";
            $w('#btnBookBottom').label = "Book rink";
            clearMobileSelection();
            if (loggedInMember) {
                showError(7); //must be owner or manager to edit a booking
            } else {
                showError(1);
            }
            return;
        }
    }

    //	Get to here, must have selected a free cell
    //console.log("Got a free cell");

    makeMobileSelection(w_id, $item, wCell);
    if (gMode === "Move") {
        $w('#btnBookRink').label = "Move confirm";
        $w('#btnBookBottom').label = "Move confirm";
        $w('#btnMove').label = "Cancel Move";
        $w('#btnMove').show();

    } else {
        gMode = "Book";
        $w('#btnBookRink').label = "Book rink";
        $w('#btnBookBottom').label = "Book rink";
    }
}
*/

/** DEPRECATED 
function makeMobileSelection(pCellId, pItem, pCell) {
    //console.log("makeSelect");
    clearMobileSelection();
    pItem('#box11M').style.backgroundColor = wSelectedColour;
    copyToCellFromCell(w_selected_Mcell, pCell);
    gSlot = pCellId[0];
    gRink = pCellId[1];
    gSlotString = getSlotString(gSlot - 1, true);
}
*/

/**
function clearMobileSelection() {
    //console.log("clearSelect");
    if (w_selected_Mcell.id === "00" || w_selected_Mcell.id === "01" || w_selected_Mcell.id === "02") { return }; //no previous selection
    
    $w("#rptGridM").forItems([w_selected_Mcell.id], ($olditem, olditemData, oldindex) => {
        if (w_selected_Mcell.cellStatus === "B") {
            $olditem('#box11M').style.backgroundColor = wBookedColour;
        } else {
            $olditem('#box11M').style.backgroundColor = wFreeColour;
        }
    });
    //w_book_ref = "";
    doClear(w_selected_Mcell, "02");
    gSlot = 0;
    gRink = 0;
    gSlotString = "";
    $w('#btnBookRink').label = "Book rink";
    $w('#btnBookBottom').label = "Book rink";
    $w('#btnMove').label = "Book All Day";
    $w('#txtAllDaySave').text = "Day booked Out";
    $w('#btnBookRink').show();
    $w('#btnMove').hide();
    $w('#txtAllDaySave').hide();
    $w('#btnSave').label = "Save";
}
*/

//====================================================ODDS=====================================================================
/**
 *	Adds an event handler that runs when the element is clicked.
 *	 @param {$w.MouseEvent} event
 */
export async function btnTest_click(event) {
    let w_book_out = await getCompBookings("OP02");
    //console.log("Records found = ", w_book_out.length);
    //w_book_out = JSON.parse(JSON.stringify(w_records));
    //console.log(w_book_out);
    //$w('#btnMove').hide();
    //if (w_records.length === 0 ) {
    //for (let i=0; i<w_records.length; i++) {
    for (let i = 0; i < w_book_out.length; i++) {
        //let item = w_records[i];
        let item = w_book_out[i];
        if (item.compRef.toUpperCase().includes("EVENT")) {
            w_book_out[i].booker = getFullNameLocally(item.bookerId);
        } else {
            if (item.usage === "Temporary booking") {
                w_book_out[i].playerA = "Temporary Holder";
                w_book_out[i].playerB = "Temporary Holder";
            } else if (item.usage === "Not available") {
                w_book_out[i].playerA = "Temporarily Closed";
            } else {
                w_book_out[i].booker = getFullNameLocally(item.bookerId);
                if (item.playerAId === item.bookerId) {
                    w_book_out[i].playerA = w_book_out[i].booker;
                } else {
                    w_book_out[i].playerA = getFullNameLocally(item.playerAId);
                }
                if (item.playerBId) {
                    w_book_out[i].playerB = getFullNameLocally(item.playerBId);
                }
            }
        }
    }
    //console.log(w_book_out);
    $w('#imgWait').hide();
}

//=============================================System Utilities=======================================================#
//

export function convertNulls(pIn) {
    //convert a null or equivalent into a X so that the dropdown displays blank
    if (pIn === null || typeof pIn === 'undefined') {
        pIn = " ";
    }
    return pIn;
}

export function convertToZero(pIn) {
    //convert a null or equivalent into a 0 so that the input element shows 0
    if (pIn === "" || pIn === " " || pIn === null || typeof pIn === 'undefined' || isNaN(pIn)) {
        pIn = 0;
    }
    return pIn;
}
function showSaveError(pErr) {
    let wMsg = ["You need to select a Player A",
        "This rink slot has been taken since you selected it",
        "The database record was not saved",
        "Cannot delete a Ladder game. Use Move instead",
        "Must be a manager to edit a Competition booking",
        "Must be a manager to edit this booking",
        "You need to select a Use or a Competition match"
    ];

    $w('#lblSaveErrorMsg').text = wMsg[pErr - 1];
    $w('#lblSaveErrorMsg').show();
    setTimeout(() => {
        $w('#lblSaveErrorMsg').hide();
    }, 8000);
    return
}

function parseTime(pTime) {
    let wHours = 0;
    let wMins = 0;
    if (pTime.includes(":")) {
        wHours = parseInt(pTime.slice(0, 2), 10);
        wMins = parseInt(pTime.slice(3, 5), 10);
    }

    return [wHours, wMins];

}

function showError(pErr) {
    let wMsg = ["You need to sign on to make or edit a booking",
        "You need to select a rink and a slot",
        "Slot already taken",
        "You cannot book a date in the past",
        "Bookings start from 1st June",
        "Must be a booking to edit",
        "Must be a player, the booker or a manager to edit booking",
        "Booking must be within next 14 days",
        "Cannot move or edit a completed game",
        "Must be a manager to edit a Competition booking", //10
        "Must be a manager to edit this booking",
        "No match bookings found",
        "There was a Systems Error. Please try again later",
        "Not all slots requested are available",
        "Not all time slots will fit here",          //15
        ""
    ];

    $w('#txtErrorMsg').text = wMsg[pErr - 1];
    $w('#txtErrorMsg').show();
    setTimeout(() => {
        $w('#txtErrorMsg').hide();
    }, 8000);
    return
}


