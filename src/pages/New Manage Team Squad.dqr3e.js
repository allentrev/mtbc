import wixWindow from 'wix-window';
import { authentication } from 'wix-members';
import wixLocation 				from 'wix-location';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } from 'public/objects/member';
import _ from 'lodash';


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
const gYear = new Date().getFullYear();
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();

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
            console.log("client MaintainEvent onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
            console.log(loggedInMember);
        } else {
            console.log(" client MaintainEvent onReady Not signed in");
        	showError("Event", 28);
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
            await loadEventsDropDown();
            await populateEventEditDropDowns();
            $w('#inpSquadListNoPerPage').value = "15";

            await loadListData();
        
        }

        // Event Section event handlers
        $w('#strEvent').onViewportEnter ((event) => strEvent_viewportEnter(event));
        $w('#btnEventACreate').onClick((event) => doBtnCreateClick(event));
        $w('#btnEventAUpdate').onClick((event) => doBtnUpdateClick(event));
        $w('#btnEventADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
        $w('#btnEventASave').onClick((event) => btnEventASave_click(event));
        $w('#btnEventACancel').onClick((event) => btnCancel_click(event));
        //$w('#btnEventAToCanEvent').onClick((event) => doBtnEventAToCanEventClick(event));
        $w('#btnEventACancellation').onClick((event) => doBtnCancellationClick(event));
        $w('#drpEventEditLeague').onClick((event) => drpEventEditLeagueClick(event));
        
        //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
        $w('#chkEventListSelect').onClick((event) => chkSelect_click(event));
        $w('#chkEventListSelectAll').onClick((event) => chkSelectAll_click(event));
        $w('#btnEventListTop').onClick((event) => btnTop_click(event));
        $w('#drpEventChoice').onChange((event) => drpEventChoiceChange(event));
        $w('#pgnEventList').onClick((event) => doPgnListClick(event));
        $w('#inpEventListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        $w('#drpEventEditRinks').onChange((event) => doDrpEventEditRinksChange(event));
        $w('#drpEventEditHomeAway').onChange((event) => doDrpEventEditRinksChange(event));
        $w('#tpkEventEditStartTime').onChange((event) => doDrpEventEditRinksChange(event));
        $w('#tpkEventEditDuration').onChange((event) => doDrpEventEditRinksChange(event));

        //----------------------------Repeaters section-------------------------------------------
        $w('#rptEventList').onItemReady(($item, itemData, index) => {
            loadRptEventList($item, itemData, index);
        })
  		//-------------------------- Custom Validation -----------------------------------------		

        //  None
    }
	catch (err) {
		console.log("client Maintain Event onReady Try-catch, err");
		console.log(err);
		wixLocation.to("/syserror");
	}
});

// ------------------------------------------------ Load Data --------------------------------------------------------
//
export async function loadListData () {
	try {
		let wResult =  await getAllEventsForYear(gYear);
        let wEvents = wResult.events;
		setEntity("Event", [...wEvents]);
		$w('#strEvent').expand();
		if (wEvents && wEvents.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#boxEventChoice').expand();
			$w('#boxEventList').expand();
			$w('#boxEventNone').collapse();
			$w('#boxEventEdit').collapse();
			$w('#boxEventPrime').collapse();
			await doEventView("");
			resetPagination("Event");
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#boxEventChoice').expand();
			$w('#boxEventList').collapse();
			$w('#boxEventNone').expand();
			$w('#boxEventEdit').collapse();
			$w('#boxEventPrime').collapse();
		}
	}
	catch (err) {
		console.log("client MaintainEvent loadListData Try catch, err");
		console.log(err);
	}
}
// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//

function loadRptEventList($item, itemData, index) {
    console.log("loadrpt");
    console.log(itemData);
    if (index === 0) {
        $item('#chkEventListSelect').hide();
    } else {
        let wDate = (itemData.startDate === null || itemData.startDate === undefined) ? "" : formatDateString(itemData.startDate, "Short");
        //let wUploaded = (itemData.uploadStatus === "C") ? true : false;
        let wLeague = (itemData.league === "X") ? "" : itemData.league;
        let wTeam = (itemData.team) ? "Town " + itemData.team.slice(-1) : "";
        let wHomeAway = "";
        let wSubject = "";
        if (itemData.homeAway === "H") {
            wHomeAway = "Home";
            if (itemData.eventType === "FG" || itemData.eventType === "LG") {
                wSubject = wTeam + " v " + itemData.subject;
            } else {
                wSubject = itemData.subject;
            }
        } else {
            wHomeAway = "Away";
            if (itemData.eventType === "FG" || itemData.eventType === "LG") {
                wSubject = itemData.subject + " v " + wTeam;
            } else {
                wSubject = itemData.subject;
            }
        }
        wSubject = (itemData.status === EVENT.CANCELLED) ? wSubject + " (Cancelled)" : wSubject;
        //if (wUploaded){
        //    $item('#boxEventEvent').style.backgroundColor = COLOUR.SELECTED;
        //} else {
        $item('#boxEventListEntry').style.backgroundColor = COLOUR.FREE;
        //}
        $item('#lblEventListLeague').text = wLeague;
        $item('#lblEventListStartDate').text = wDate;
        $item('#lblEventListSubject').text = wSubject;
        $item('#lblEventListRinks').text = itemData.rinks;
        $item('#lblEventListHomeAway').text = wHomeAway;
        $item('#lblEventListStartTime').text = itemData.startTime;
        $item('#lblEventListDuration').text = String(itemData.duration);
        $item('#chkEventListSelect').checked = itemData.selected;
    }
}

// ------------------------------------------------ Load Dropdowns-----------------------------------------------
//
export async function loadEventsDropDown() {
    let wOptions = [
        { "label": "All entries", "value": "All" },
        { "label": "Club Events", "value": "CE" },
        { "label": "Club Games", "value": "CG" },
        { "label": "Loans", "value": "HG" }
    ];
    let wEventEditOptions = [
        { "label": "Club Events", "value": "CE" },
        { "label": "Club Games", "value": "CG" },
        { "label": "Loans", "value": "HG" },
        { "label": "League", "value": "LG" },
        { "label": "Friendly", "value": "FG" }
    ];

    let wTeams = await getNewAllTeamOptions();
    wOptions.push(...wTeams);
    $w('#drpEventChoice').options = wOptions;
    $w('#drpEventEditEventType').options = wEventEditOptions;
    $w('#drpEventChoice').value = "All";
}


async function populateEventEditDropDowns() {
    let wLeagues = [
        { "label": "None", "value": "X" }
    ]
    let wTeams = [
        { "label": "None", "value": "X" }
    ]
    let wAllLeagues = await getNewAllLeagueOptions();
    wLeagues.push(...wAllLeagues);

    //console.log(wLeagues);
    $w('#drpEventEditLeague').options = wLeagues;
    $w('#drpEventEditLeague').value = "X";

    let wAllTeams = await getNewAllTeamOptions();
    wTeams.push(...wAllTeams);
    //console.log(wTeams);
    $w('#drpEventEditTeam').options = wTeams;
    $w('#drpEventEditTeam').value = "X";
}

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    btnCreate_click(event);
    await clearEventEdit();
}
export async function doBtnUpdateClick(event) {
    btnUpdate_click(event);
    await populateEventEdit();
}
export async function doBtnCancellationClick(event) {
    btnCancellation_click(event);
    await populateEventEdit();
}

// ================================================= Event Events ================================================
//
export async function drpEventFilterType_change(event) {
    showWait("Event");
    let wType = event.target.value;
    //let wStatus = $w('#drpMemberFilterChoice').value;
    //displayMemberTableData(wType, wStatus);
    hideWait("Event");
}

function doDrpEventEditRinksChange (event){
    gSlotRinkChange = true;
    showError("Event",11);
}

export function doEventViewChange (event) {
	let wView = event.target.value;
	doEventView(wView);
}
export function btnEventAToCanEvent_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export function btnEventAToB_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export function btnEventAToC_click(event) {
    //$w('#strEvent').collapse();
    //$w('#cstrpKennetTeams').expand();
}
export async function drpEventEditLeagueClick (event){
    let wLeague = event.target.value;
}

export async function drpEventEditTeamClick (event){
    let wTeam = event.target.value;
}

export async function btnEventASave_click(event) {
    showWait("Event");
    $w('#btnEventASave').disable();
    let wTeam = $w('#drpEventEditTeam').value || "X"; 
    let wLeague = $w('#drpEventEditLeague').value || "X";
    let wResult;

    let wEvent = {
        "_id": "",
        "startDate": null,
        "subject": $w('#inpEventEditSubject').value,
        "rinks": String($w('#drpEventEditRinks').value) || "0",
        "homeAway": $w('#drpEventEditHomeAway').value || "H",
        "startTime": "",
        "duration": 0,
        "eventType": $w('#drpEventEditEventType').value,
        "useType": $w('#rgpEventEditUseType').value || "X",
        "gameType": $w('#rgpEventEditGameType').value || "X",
        "dress": $w('#rgpEventEditDress').value || "N",
        "league": wLeague,
        "team": wTeam,
        "eventId": null,
        "mix": $w('#rgpEventEditMix').value || "X",
        "uploadStatus": "N",
        "requiredYear": parseInt($w('#inpEventEditRequiredYear').value, 10),
        "requiredJDate": parseInt($w(`#inpEventEditRequiredJDate`).value, 10),
        "calKey": null,
        "status": $w('#drpEventEditStatus').value,
        "summary": $w('#txtEventEditNotes').value || ""
    }
    if ($w('#dpkEventEditStartDate').valid === false) {
        showError("Event", 15);
        $w('#dpkEventEditStartDate').focus();
        $w('#btnEventASave').enable();
        return;
    }
    // validate league and team are in sync
    wResult = await validateTeamLeagueDropdowns(wTeam, wLeague);
    if (wResult.status){
        if (!wResult.valid) {
            showError("Event", 14);
            $w('#drpEventEditTeam').focus();
            $w('#btnEventASave').enable();
            return;
        } else {
            switch (wResult.case) {
                case 1:
                case 4:
                    //drop throuh    
                    break;
                case 2:
                    showError("Event", wResult.showValue);
                    $w('#drpEventEditTeam').value = wResult.teamKey; 
                    break;
                case 3:
                    showError("Event", wResult.showValue);
               		$w('#drpEventEditLeague').value = wResult.leagueKey;
                    break;        
            }
        }
    } else {
        showError("Event", 14);
        $w('#drpEventEditTeam').focus();
        $w('#btnEventASave').enable();
        return;
    }
    
    wEvent.calKey = await getCalKey($w('#drpEventEditEventType').value, $w('#drpEventEditLeague').value);

    let wDuration = parseFloat($w('#tpkEventEditDuration').value) || 0;
    wEvent.duration = wDuration;

    let wTime = $w('#tpkEventEditStartTime').value;
    let wHours = parseInt(wTime.split(":")[0], 10);
    let wMins = parseInt(wTime.split(":")[1], 10);
    let wDate = $w('#dpkEventEditStartDate').value;
    let wStartDateTime = new Date(wDate.getFullYear(), wDate.getMonth(), wDate.getDate(), wHours, wMins);
    wEvent.startDate = wStartDateTime;
    wEvent.startTime = wTime.substring(0, 5);
    wEvent.requiredYear = parseInt(wStartDateTime.getFullYear(), 10)
    wEvent.requiredJDate = await DateToOrdinal(wStartDateTime);
    let wEventUpdate = {};

    let wEvents = [];
    switch (getMode()) {
        case MODE.CREATE:
            wEvent._id = undefined;
            wEventUpdate = await processRecord("Event", wEvent);
            updateGlobalDataStore(wEventUpdate,"Event");
            updatePagination("Event");
            showError("Event", 8);
            break;
        case MODE.UPDATE:
            wEvent._id = getSelectStackId();
            if (gSlotRinkChange) {
                await deleteExistingBookings();
                wEventUpdate = await processRecord("Event", wEvent);
            } else {
                wResult = await saveRecord("lstEvents", wEvent);
                if (wResult.status){
                    wEventUpdate = wResult.savedRecord;
                    updateGlobalDataStore(wEventUpdate, "Event");
                    updatePagination("Event");
                    showError("Event",7);
                    resetCommands("Event");
                } else {
                    if (wResult.savedRecord) {
                        console.log("client Maintain Event btnEventASave, save failed, savedRecord", wResult.savedRecord);
                    } else {
                        console.log("client Maintain Event btnEventASave, save failed, error", wResult.error);
                    }
                }
            }
            break;
        case MODE.CANCELLATION:
            wEvent._id = getSelectStackId();
            await deleteExistingBookings();
            wResult = await updateEventStatus(wEvent._id, EVENT.CANCELLED);
            if (wResult.status) {
                wEventUpdate = wResult.event;
                if (wEventUpdate) {
                    updateGlobalDataStore(wEventUpdate, "Event");
                    updatePagination("Event");
                    showError("Event", 19);
                    resetCommands("Event");
                } else {
                    showError("Event", 20);
                }
            } else {
                console.log("client Maintain Event btnEventASave updateEvent Status failed");
                showError("Event", 20);
            }
            break;
        default:
            console.log("Event Save mode = ", getMode());
        }
    resetSection("Event");
    $w('#btnEventASave').enable();
    hideWait("Event");
	setMode( MODE.CLEAR);
}

export async function drpEventChoiceChange(event) {
    showWait("Event");
    updatePagination("Event");
    hideWait("Event");
}

export async function inpEventStartDate_change(event) {
    let wDate = event.target.value;
    let wYear = wDate.getFullYear();
    let wJDate = await DateToOrdinal(wDate);
    $w('#inpEventEditRequiredYear').value = wYear;
    $w('#inpEventEditRequiredJDate').value = String(wJDate);
}

export async function cstrpEvent_viewportEnter(event) {
    //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doEventView (pTarget) {
	if (pTarget === "P") {
		$w('#chkEventListSelectAll').collapse();
		$w('#btnEventListTop').collapse();
		$w('#rptEventList').collapse();
	} else {
		$w('#chkEventListSelectAll').expand();
		$w('#btnEventListTop').expand();
		$w('#rptEventList').expand();
	}
}

export function strEvent_viewportEnter(event) {
    //console.log("Viewport")
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
// ================================================= Event Supporting Functions =================================================
//

async function processRecord(pTarget, pItem) {
    //console.log("Process Record pItem");
    //console.log(pItem);

    let wReturn = {
        "eventUpdate": {},
        "eventBookings": []
    }
    let wEventUpdate = {};
    let wSavedRec = {};

    let wTownTeamsInLeague = {};
    let wEventBookings = [];
    let wId = "";
    let wBookingsToSave = [];
    let res;
    let wResult;
    let wResult2;
    //let wLeagueKey = "";
    //let wLeagueDivision = 0;
    switch (pTarget) {
    case "Event":
        wReturn = await processEventRecord(pItem);
        wEventUpdate = wReturn.eventUpdate;
        wEventBookings = wReturn.eventBookings;
        //console.log("case Event - event Update + bookings returned");
        //console.log(wEventUpdate);
        //console.log(wEventBookings);
        wResult = await saveRecord("lstEvents", wEventUpdate);
        if (wResult.status){
            wSavedRec  = wResult.savedRecord;
            //console.log("wId = ", wId);
            if (wEventBookings) {
                if (wEventBookings.length > 0) {
                    /** 
                    wBookingsToSave = wEventBookings.map(item => {
                        let wItem = { ...item };
                        wItem.eventId = wSavedRec._id;
                        return wItem;
                    })
                    */
                    let wResult = await processEventBookings(wSavedRec._id, wEventBookings) ;
                }
            }
        } else {
            if (wResult.savedRecord) {
                console.log("client Maintain Event ProcessRecord, save failed, savedRecord", wResult.savedRecord);
            } else {
                console.log("client Maintain Event ProcessRecord, save failed, error", wResult.error);
            }
        }
        //console.log("Res of builk booking");
        //console.log(res);
        break;
    }
    return wSavedRec;
}

async function processEventRecord(pItem) {
    //console.log("Process EventRecord, pItem");
    //console.log(pItem);

    let wReturn = {
        "eventUpdate": {},
        "eventBookings": []
    }

    let wEventUpdate = {};
    let wBookingUpdates = [];
    $w(`#txtEventErrMsg`).text = pItem.subject;

    let wTmp = pItem.dress;
    let wDress = (wTmp === "N" || wTmp === "W" || wTmp === "G") ? wTmp : "N";
    let wDuration = parseFloat(pItem.duration) || 0;
    let wEventType = pItem.eventType;
    let wLeague = pItem.league;
    if (wEventType === "LG") {
        wLeague = pItem.league.slice(0, pItem.league.length - 1);
    }
    let wCal = await getCalKey(wEventType, wLeague);
    let wRinks = (isNaN(parseInt(pItem.rinks, 10))) ? 0 : parseInt(pItem.rinks, 10);

    wEventUpdate._id = pItem._id;
    wEventUpdate.startDate = pItem.startDate;
    wEventUpdate.requiredYear = pItem.requiredYear;;
    wEventUpdate.requiredJDate = pItem.requiredJDate;
    wEventUpdate.subject = pItem.subject;
    wEventUpdate.rinks = String(wRinks);
    wEventUpdate.homeAway = pItem.homeAway;;
    wEventUpdate.startTime = pItem.startTime;
    wEventUpdate.duration = wDuration;
    wEventUpdate.eventType = wEventType;
    wEventUpdate.useType = pItem.useType;

    wEventUpdate.gameType = pItem.gameType;
    wEventUpdate.league = pItem.league;
    wEventUpdate.team = pItem.team;
    wEventUpdate.dress = wDress;
    wEventUpdate.mix = pItem.mix;
    wEventUpdate.summary = pItem.summary;
    wEventUpdate.status = pItem.status;
    wEventUpdate.uploadStatus = pItem.uploadStatus;
    wEventUpdate.eventId = null;
    wEventUpdate.calKey = wCal;

    if (pItem.homeAway === "H" && wRinks > 0) {
        wEventUpdate.uploadStatus = "C";
        let wBookingList = await addEventBookings(pItem);
        wBookingUpdates = wBookingList;
    }

    wReturn.eventUpdate = wEventUpdate;
    wReturn.eventBookings = wBookingUpdates;

    return wReturn;
}

