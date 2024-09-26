import wixWindow                        from 'wix-window';
import { authentication }               from 'wix-members-frontend';
import wixLocation 				        from 'wix-location';

import _                                from 'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';

import { getRefEventSet }               from 'backend/backEvents.jsw';
import { getCanEventSet }               from 'backend/backEvents.jsw';
import { getOpponentSet }               from 'backend/backEvents.jsw';
import { getFixtureSet }                from 'backend/backEvents.jsw';
import { getTownTeams }                 from 'backend/backEvents.jsw';
import { saveRecord }                   from 'backend/backEvents.jsw';
import { bulkSaveRecords }              from 'backend/backEvents.jsw';
import { getAllEventsForYear }          from 'backend/backEvents.jsw';
//import { DateToOrdinal }                from 'backend/backEvents.jsw';
import { getCalKey }                    from 'backend/backEvents.jsw';
import { processEventType }			from 'public/objects/booking';

import { getNewAllTeamOptions } from 'backend/backTeam.jsw';
import { getNewAllLeagueOptions } from 'backend/backTeam.jsw';
import { getNewTeamsByLeague }          from 'backend/backTeam.jsw';

import { parseLeagueName }              from 'backend/backTeam.jsw';

import { formatDateString }             from 'public/fixtures';
import { parseDateTimeFromInput }       from 'public/fixtures';

import { getRinksAndSlots } from 'public/objects/booking';
import { getNoFreeRinks }               from 'public/objects/booking';
import { getStartSlot }                 from 'public/objects/booking';
import { getEndSlot }                   from 'public/objects/booking'; 
import { initialiseRinksArray }         from 'public/objects/booking';

import { addBookings }                  from 'backend/backBookings.jsw';
import { processEventBookings }         from 'backend/backBookings.jsw';


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

const COLOUR = Object.freeze({
	FREE:		"rgba(207,207,155,0.5)",
	SELECTED:	"rgba(173,43,12,0.4)",
	NOT_IN_USE:	"rgba(180,180,180, 0.3)",
	BOOKED:		"#F2BF5E"
});

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

        // for testing ------	------------------------------------------------------------------------
        //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
        let wUser = {"_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{"title": "Manager"}]}; //Me
        //let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
        /**
        Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
        Sarah Allen		91eab866-e480-4ddc-9512-d27bbbed2f10	ab308621-7664-4e93-a7aa-a255a9ee6867
        Trevor Allen	7e864e0b-e8b1-4150-8962-0191b2c1245e	88f9e943-ae7d-4039-9026-ccdf26676a2b
        Tony SprocessMatchRecordtuart		28f0e772-9cd9-4d2e-9c6d-2aae23118552	5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9
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
            console.log("/page/MaintainCandidateEvent onReady Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
        } else {
            console.log("/page/MaintainCandidateEvent onReady  Not signed in");
			showError("CanEvent", 28);
			if (!gTest){
                setTimeout(() => {
				    wixLocation.to("/");
			    }, 2000);
            }
        }

        if (wixWindow.formFactor === "Mobile") {
            $w('#secDesktop').collapse();
            $w('#secMobile').expand();
            $w('#secOpponent').collapse();
            $w('#secFixture').collapse();
            $w('#secRefEvent').collapse();
            $w('#secCanEvent').collapse();
            $w('#secEvent').collapse();
        } else {
            await initialiseRinksArray();
            $w('#secMobile').collapse();
            $w('#secDesktop').expand();
            $w('#secOpponent').collapse();
            $w('#secFixture').collapse();
            $w('#secRefEvent').collapse();
            $w('#secCanEvent').expand();
            $w('#secEvent').collapse();
    
            await loadOpponentDropDown();
            await loadFixtureDropDown();
            //await loadRefEventDropDown();     //there is no choice option for RefEvents
            await loadCanEventDropDown();
            await loadEventDropDown();

            await populateOpponentDropDowns();
            await populateFixtureDropDowns();
            await populateRefEventDropDowns();
            await populateCanEventDropDowns();
            await populateEventDropDowns();
            //ensure these are set before loadtabledata
            $w('#inpOpponentListNoPerPage').value = "20";
            $w('#inpFixtureListNoPerPage').value = "20";
            $w('#inpRefEventListNoPerPage').value = "20";
            $w('#inpCanEventListNoPerPage').value = "20";
            $w('#inpEventListNoPerPage').value = "20";
            
            await loadOpponentTableData();

            await loadFixtureTableData();
            await loadRefEventTableData();
            await loadCanEventTableData();
            await loadEventTableData();

        }
        //
        // Opponent Section event handlers
        //
		$w('#strOpponent').onViewportEnter ((event) => strOpponent_viewportEnter(event));
		$w('#btnOpponentACreate').onClick((event) => doBtnCreateClick(event));
		$w('#btnOpponentAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnOpponentADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnOpponentASave').onClick((event) => btnOpponentASave_click(event));
		$w('#btnOpponentACancel').onClick((event) => btnCancel_click(event));
		$w('#btnOpponentAToFixture').onClick((event) => doBtnOpponentAToFixtureClick(event));
		$w('#btnOpponentAToRefEvent').onClick((event) => doBtnOpponentAToRefEventClick(event));
		$w('#btnOpponentAToCanEvent').onClick((event) => doBtnOpponentAToCanEventClick(event));
		//$w('#btnReferenceAPrime').onClick((event) => btnReferenceAPrime_click(event));
		$w('#chkOpponentListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkOpponentListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnOpponentListTop').onClick((event) => btnTop_click(event));
		$w('#pgnOpponentList').onClick((event) => doPgnListClick(event));
		$w('#inpOpponentListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#drpOpponentChoice').onChange((event) => drpChoice_change(event));
		//$w('#rgpOpponentView').onChange((event) => doReferenceViewChange(event));
		//$w('#chkOpponentPrimeMen').onClick((event) => chkPrimeSelect_click(event));
		$w('#btnOpponentAPrime').onClick((event) => doBtnOpponentAPrimeClick(event));

		// Fixture Section event handlers
        //
		$w('#strFixture').onViewportEnter ((event) => strFixture_viewportEnter(event));
		$w('#btnFixtureACreate').onClick((event) => doBtnCreateClick(event));
		$w('#btnFixtureAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnFixtureADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnFixtureASave').onClick((event) => btnFixtureASave_click(event));
		$w('#btnFixtureACancel').onClick((event) => btnCancel_click(event));
		$w('#btnFixtureAToOpponent').onClick((event) => doBtnFixtureAToOpponentClick(event));
		$w('#btnFixtureAToRefEvent').onClick((event) => doBtnFixtureAToRefEventClick(event));
		$w('#btnFixtureAToCanEvent').onClick((event) => doBtnFixtureAToCanEventClick(event));
		$w('#chkFixtureListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkFixtureListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnFixtureListTop').onClick((event) => btnTop_click(event));
        $w('#pgnFixtureList').onClick((event) => doPgnListClick(event));
		$w('#inpFixtureListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
        $w('#drpFixtureEditLeague').onChange((event) => drpFixtureEditLeague_change(event));
		$w('#drpFixtureChoice').onChange((event) => drpFixtureChoiceChange(event));
        $w('#drpFixtureChoiceTeam').onChange((event) => drpFixtureChoiceTeamChange(event));
		$w('#btnFixtureAPrime').onClick((event) => doBtnFixtureAPrimeClick(event));

		// RefEvent Section event handlers
        //
		$w('#strRefEvent').onViewportEnter ((event) => strRefEvent_viewportEnter(event));
		$w('#btnRefEventACreate').onClick((event) => doBtnCreateClick(event));
		$w('#btnRefEventAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnRefEventADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnRefEventASave').onClick((event) => btnRefEventASave_click(event));
		$w('#btnRefEventACancel').onClick((event) => btnCancel_click(event));
        $w('#btnRefEventAToOpponent').onClick((event) => doBtnRefEventAToOpponentClick(event));
		$w('#btnRefEventAToFixture').onClick((event) => doBtnRefEventAToFixtureClick(event));
		$w('#btnRefEventAToCanEvent').onClick((event) => doBtnRefEventAToCanEventClick(event));
		$w('#chkRefEventListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkRefEventListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnRefEventListTop').onClick((event) => btnTop_click(event));
        $w('#pgnRefEventList').onClick((event) => doPgnListClick(event));
		$w('#inpRefEventListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#btnRefEventAPrime').onClick((event) => doBtnRefEventAPrimeClick(event));
		//$w('#drpRefEventChoice').onChange((event) => drpChoice_change(event));

		// CanEvent Section event handlers
        //
		$w('#strCanEvent').onViewportEnter ((event) => strCanEvent_viewportEnter(event));
		$w('#btnCanEventACreate').onClick((event) => doBtnCreateClick(event));
		$w('#btnCanEventAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnCanEventADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnCanEventASave').onClick((event) => btnCanEventASave_click(event));
		$w('#btnCanEventACancel').onClick((event) => btnCancel_click(event));
		$w('#btnCanEventAToOpponent').onClick((event) => doBtnCanEventAToOpponentClick(event));
		$w('#btnCanEventAToFixture').onClick((event) => doBtnCanEventAToFixtureClick(event));
		$w('#btnCanEventAToRefEvent').onClick((event) => doBtnCanEventAToRefEventClick(event));
		$w('#btnCanEventAToEvent').onClick((event) => doBtnCanEventAToEventClick(event));
		$w('#chkCanEventListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkCanEventListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnCanEventListTop').onClick((event) => btnTop_click(event));
        $w('#pgnCanEventList').onClick((event) => doPgnListClick(event));
		$w('#inpCanEventListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#drpCanEventChoice').onChange((event) => drpChoice_change(event));
		$w('#btnCanEventAPrime').onClick((event) => doBtnCanEventAPrimeClick(event));
		$w('#btnCanEventAPrimeInitialise').onClick((event) => doBtnCanEventAPrimeInitialiseClick(event));

		// Live Event Section event handlers
        //
		$w('#strEvent').onViewportEnter ((event) => strCanEvent_viewportEnter(event));
		$w('#btnEventACreate').onClick((event) => showError("Event",27));
		$w('#btnEventAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnEventADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnEventASave').onClick((event) => btnEventASave_click(event));
		$w('#btnEventACancel').onClick((event) => btnCancel_click(event));
		$w('#btnEventAToCanEvent').onClick((event) => btnEventAToCanEvent_click(event));
		$w('#chkEventListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkEventListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnEventListTop').onClick((event) => btnTop_click(event));
        $w('#pgnEventList').onClick((event) => doPgnListClick(event));
		$w('#inpEventListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#drpEventChoice').onChange((event) => drpChoice_change(event));

        // Repeaters section
        
        $w('#rptRefEventList').onItemReady(($item, itemData, index) => {
            loadRptRefEventList($item, itemData, index);
        })

        $w('#rptCanEventList').onItemReady(($item, itemData, index) => {
            loadRptCanEventList($item, itemData, index);
        })

        $w('#rptOpponentList').onItemReady(($item, itemData, index) => {
            loadRptOpponentList($item, itemData, index);
        })

        $w('#rptFixtureList').onItemReady(($item, itemData, index) => {
            loadRptFixtureList($item, itemData, index);
        })

        $w('#rptEventList').onItemReady(($item, itemData, index) => {
            loadRptEventList($item, itemData, index);
        })
        // Custom Validation section

 		//-------------------------- Custom Validation -----------------------------------------		
    }
	catch (err) {
		console.log("/page/MaintainCandidateEvent onReady Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
});
// ------------------------------------------------ Load Data ----------------------------------------------------------
//

export async function loadOpponentTableData() {
    try {
        showWait("Opponent");
        let wResults = await getOpponentSet();
        if (wResults.status){ 
            let wOpponents = wResults.opponents;
            setEntity("Opponent", [...wOpponents]);
            resetSection("Opponent");
        } else {
            console.log("/page/MaintainCandidateEvent loadOpponentTableSet read failed, err" );
            console.log(wResults.error);
        }
        await doOpponentView("");
        resetPagination("Opponent");
        hideWait("Opponent");
    }
    catch (err) {
        console.log("/page/MaintainCandidateEvent  loadOpponentTableData Try-catch, err");
        console.log(err);
    }
}
/**
 * 
 *  Description:    wFixtures contains the list of fixtures that involve a Maidenhead Town Club team. The source
 *                  data is imported manually from the Kennet League web site. See User Manual for details on how
 *                  to extract, transform and load this data.
 */
export async function loadFixtureTableData() {
    //TODO think of friendlies 
    try {
        showWait("Fixture");
        let wResults = await getFixtureSet();
        if (wResults.status){ 
            let wAllKennetFixtures = wResults.fixtures;
            let wResults2  = await getTownTeams();
            if (wResults2.status){ 
                let wTownTeams = wResults2.teams;
                // throw away the Town teams for friendlies
                let wTownLeagueTeams = wTownTeams.filter( item => item.useType ==="L");
                // only return a fixture if one of the town teams is playing n the match
                let wKennetTeamNames = wTownLeagueTeams.map( item => item.name);
                let wFixtures = [];
                wFixtures = wAllKennetFixtures.filter( item => {
                    if (wKennetTeamNames.includes(item.home) || wKennetTeamNames.includes(item.away)) {
                        return item;
                    }
                })
                for (let wFixture of wFixtures){
                    wFixture.homeAway = (wKennetTeamNames.includes(wFixture.home)) ? "H" : "A";
                    let wPlayOn = wFixture.playOn;
                    if (typeof wPlayOn === "string") {
                        let wDatePlayOn = convertStringToDate(wPlayOn);
                        wFixture.playOn = wDatePlayOn;
                    }
                }
                setEntity("Fixture", [...wFixtures]);
                resetSection("Fixture");
            } else {
                console.log("/page/MaintainCandidateEvent  loadFixtureTableSet TownTeam read failed, err" );
                console.log(wResults2.error);
            }
        } else {
            console.log("/page/MaintainCandidateEvent  loadFixtureTableSet FixtureSet read failed, err" );
            console.log(wResults.error);
        }
        await doFixtureView("");
        resetPagination("Fixture");
        hideWait("Fixture");
    }
    catch (err) {
        console.log("/page/MaintainCandidateEvent  loadFixtureTableData Try-catch, err");
        console.log(err);
    }
}

export async function loadRefEventTableData() {

    try {
        showWait("RefEvent");
        let wResults = await getRefEventSet();
        if (wResults.status) {
            let wRefEvents = wResults.events;
            setEntity("RefEvent", [...wRefEvents]);
            resetSection("RefEvent");
        } else {
            console.log("/page/MaintainCandidateEvent  loadRefEventTableSet read failed, err" );
            console.log(wResults.error);
        }
        await doRefEventView("");
        resetPagination("RefEvent");
        hideWait("RefEvent");
    }
    catch (err) {
        console.log("/page/MaintainCandidateEvent  loadRefEventTableData Try-catch, err");
        console.log(err);
    }

}

export async function loadCanEventTableData() {
    //console.log("LoadCanEVentTableData");

    try {
        showWait("CanEvent");
        let wResults = await getCanEventSet();
        if (wResults.status) {
            let wCanEvents = wResults.events;
            setEntity("CanEvent", [...wCanEvents]);
            resetSection("CanEvent");
        } else {
            console.log("/page/MaintainCandidateEvent  loadCanEventTableSet read failed, err" );
            console.log(wResults.error);
        }
        await doCanEventView("");

        resetPagination("CanEvent");
        hideWait("CanEvent");
    }
    catch (err) {
        console.log("/page/MaintainCandidateEvent  loadCanEventTableData Try-catch, err");
        console.log(err);
    }
}
export async function loadEventTableData () {
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
			$w('#boxEventPrime').collapse();		}
	}
	catch (err) {
		console.log("/page/MaintainCandidateEvent  loadEventTableData Try catch, err");
		console.log(err);
	}
}

// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//

function loadRptOpponentList($item, itemData, index) {
    if (index === 0) {
        $item('#chkOpponentListSelect').hide();
    } else {
        $item('#lblOpponentListLeague').text = convertNull(itemData.league,"");
        $item('#lblOpponentListTeam').text = convertNull(itemData.team, "");
        $item('#chkOpponentListSelect').checked = false;
        if (itemData.status === "C"){
            $item('#boxOpponentListEntry').style.backgroundColor = COLOUR.SELECTED;
        } else {
            $item('#boxOpponentListEntry').style.backgroundColor = COLOUR.FREE;
        }
    }
}

function refreshRptOpponents(pOpponent){
	$w('#rptOpponentList').forItems([pOpponent._id],($item) => {
        let wDone = (pOpponent.status === "C") ? true : false;
        $item('#lblOpponentListLeague').text = pOpponent.league;
        $item('#lblOpponentListTeam').text = pOpponent.team;
		$item('#chkOpponentListSelect').checked = false;
	})
}

function loadRptFixtureList($item, itemData, index) {
    //console.log(itemData);
    if (index === 0) {
        $item('#chkFixtureListSelect').hide();
    } else {
        let wWEDate = (itemData.weekEnding === null || itemData.weekEnding === undefined) ? "" : itemData.weekEnding;
        let wDate = (itemData.playOn === null || itemData.playOn === undefined) ? "" : convertDateToString(itemData.playOn);
        let wLeague = (itemData.division === 0) ? itemData.league : itemData.league + String(itemData.division);
        $item('#lblFixtureListLeague').text = wLeague;
        $item('#lblFixtureListWeek').text = String(convertNull(itemData.week, ""));
        $item('#lblFixtureListWeekEnding').text = wWEDate;
        $item('#lblFixtureListDate').text = wDate;
        $item('#lblFixtureListHome').text = convertNull(itemData.home, "");
        $item('#lblFixtureListAway').text = convertNull(itemData.away, "");
        $item('#chkFixtureListSelect').checked = itemData.selected;

        if (itemData.primed === "Y"){
            $item('#boxFixtureListEntry').style.backgroundColor = COLOUR.SELECTED;
        } else {
            $item('#boxFixtureListEntry').style.backgroundColor = COLOUR.FREE;
        }
    }
}

/**  example of a refeesh. Been superceeded bu UpdatePagination

function refreshRptFixtures(pFixture){

	$w('#rptFixtureList').forItems([pFixture._id],($item, itemData) => {
        let wDate = (itemData.weekEnding === null || itemData.weekEnding === undefined) ? "" : itemData.weekEnding;
        let wLeague = (pFixture.division === 0) ? pFixture.league : pFixture.league + String(pFixture.division);
        $item('#lblFixtureListLeague').text = wLeague;
        $item('#lblFixtureListWeek').text = String(pFixture.week);
        $item('#lblFixtureListDate').text = wDate;
        $item('#lblFixtureListHome').text = pFixture.home;
        $item('#lblFixtureListAway').text = pFixture.away;
		$item('#chkFixtureListSelect').checked = itemData.selected;
	})
}
*/

function loadRptRefEventList($item, itemData, index) {
    if (index === 0) {
        $item('#chkRefEventListSelect').hide();
    } else {
        let wDuration = String(itemData.duration);
        $item('#lblRefEventListSubject').text = convertNull(itemData.subject, "");
        $item('#lblRefEventListStartTime').text = convertNull(itemData.startTime, "");
        $item('#lblRefEventListDuration').text = wDuration;
        $item('#lblRefEventListRinks').text = convertNull(itemData.rinks, "");
        $item('#lblRefEventListMix').text = convertNull(itemData.mix, "");
        $item('#lblRefEventListDress').text = convertNull(itemData.dress, "");
        $item('#chkRefEventListSelect').checked = itemData.selected;
    }
}

function loadRptCanEventList($item, itemData, index) {
    //console.log("Load rptr");
    //console.log("Rec,", index);
    if (index === 0) {
        $item('#chkCanEventListSelect').hide();
    } else {
        let wDate = (itemData.startDate === null || itemData.startDate === undefined) ? "" : formatDateString(itemData.startDate, "Short");
        let wUploaded = (itemData.uploadStatus === "C") ? false : false;
        let wTeam = "";
        if (itemData.eventType === "FG"){
            wTeam = "Town";
        } else {    
            wTeam = (itemData.team) ? "Town " + itemData.team.slice(-1) : "";
        }
        let wLeague = (itemData.league === "X") ? "" : itemData.league;
        let wHomeAway =  "";
        let wSubject  =  "";
        if (itemData.homeAway === "H") {
            wHomeAway = "Home";
            if (itemData.eventType === "FG" || itemData.eventType === "LG"){
                wSubject = wTeam + " v " + itemData.subject;
            } else {
                wSubject = itemData.subject;
            }
        }else {
            wHomeAway = "Away";
            if (itemData.eventType === "FG" || itemData.eventType === "LG"){
                wSubject = itemData.subject + " v " + wTeam;
            } else {
                wSubject = itemData.subject;
            }
        }
        if (itemData.status === "C"){
            $item('#boxCanEventListEntry').style.backgroundColor = COLOUR.SELECTED;
        } else {
            $item('#boxCanEventListEntry').style.backgroundColor = COLOUR.FREE;
        }
        $item('#lblCanEventListLeague').text = wLeague;
        $item('#lblCanEventListStartDate').text = wDate;
        $item('#lblCanEventListSubject').text = wSubject;
        $item('#lblCanEventListRinks').text = itemData.rinks;
        $item('#lblCanEventListHomeAway').text = wHomeAway;
        $item('#lblCanEventListStartTime').text = itemData.startTime;
        $item('#lblCanEventListDuration').text = String(itemData.duration);
        $item('#chkCanEventListSelect').checked = itemData.selected;
    }
}

function loadRptEventList($item, itemData, index) {
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
        //wSubject = (itemData.status === EVENT.CANCELLED) ? wSubject + " (Cancelled)" : wSubject;
        wSubject = (itemData.status === "C") ? wSubject + " (Cancelled)" : wSubject;
        //if (wUploaded){
        //    $item('#boxevent').style.backgroundColor = COLOUR.SELECTED;
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

// ================================================= Entity Events ================================================
//
export async function doBtnCreateClick(event) {
    let wTarget = getTarget(event, "A");
    btnCreate_click(event);
    await clearEdit(wTarget);
}
export function doBtnUpdateClick(event) {
    let wTarget = getTarget(event, "A");
    btnUpdate_click(event);
    populateEdit(wTarget);
}
export function doBtnCancellationClick(event) {
    let wTarget = getTarget(event, "A");
    btnCancellation_click(event);
    populateEdit(wTarget);
}
// ----------------------------------------------Entity Event Supporting Functions -------------------------------------------------
//

function clearEdit(pTarget)  {
    switch (pTarget) {
        case "Opponent":
            $w('#drpOpponentEditLeague').value = "X";
            $w('#inpOpponentEditTeam').value = "X";
            $w('#chkOpponentEditDone').checked = false;
            break;
        case "Fixture":
            $w('#drpFixtureEditLeague').value = "X";
            $w('#inpFixtureEditDivision').value = "";
            $w('#inpFixtureEditWeek').value = "";
            $w('#dpkFixtureEditWeekEnding').value = null;
            $w('#dpkFixtureEditPlayOn').value = null;
            $w('#inpFixtureEditHome').value = "";
            $w('#inpFixtureEditAway').value = "";
            $w('#rgpFixtureEditHomeAway').value = "H";
            $w('#drpFixtureEditPrimed').value = "N";
            break;
        case "RefEvent":
            $w('#drpRefEventEditEventType').value = "CE";
            $w('#inpRefEventEditSubject').value = "";
            $w('#tpkRefEventEditStartTime').value = "10:00";
            $w('#inpRefEventEditDuration').value = "3";
            $w('#inpRefEventEditRinks').value = "0";
            $w('#rgpRefEventEditMix').value = "X";
            $w('#rgpRefEventEditGameType').value = "X";
            $w('#rgpRefEventEditUseType').value = "X";
            $w('#rgpRefEventEditDress').value = "N";
            $w('#inpRefEventEditSubject').focus();
            break;
        case "Event":
        case "CanEvent":
            $w(`#drp${pTarget}EditEventType`).value = "CE";
            $w(`#drp${pTarget}EditLeague`).value = "X";
            $w(`#drp${pTarget}EditTeam`).value = "X";
            $w(`#inp${pTarget}EditSubject`).value = "";
            $w(`#dpk${pTarget}EditStartDate`).value = new Date();
            $w(`#tpk${pTarget}EditStartTime`).value = "10:00";
            $w(`#inp${pTarget}EditDuration`).value = "3";
            $w(`#drp${pTarget}EditHomeAway`).value = "H";
            $w(`#inp${pTarget}EditRinks`).value = "0";
            $w(`#rgp${pTarget}EditMix`).value = "X";
            $w(`#drp${pTarget}EditUploadStatus`).value = "N";
            $w(`#inp${pTarget}EditRequiredYear`).value = "";
            $w(`#inp${pTarget}EditRequiredJDate`).value = "";
            $w(`#rgp${pTarget}EditGameType`).value = "X";
            $w(`#rgp${pTarget}EditUseType`).value = "X";
            $w(`#rgp${pTarget}EditDress`).value = "N";
            break;
        default:
            console.log("/page/MaintainCandidateEvent  clearEdit Invalid switch key", pTarget)
            break;
    }
}

function populateEdit(pTarget){
    
    let wSelected = getSelectedItem(pTarget);

    let wLeagueKey = "";
    let wLeagueValue = "";
    let wDone = false;
    let wLeagueStem = "";
    switch (pTarget) {
        case "Opponent":
            wDone = (wSelected.status === "C") ? true : false;
            $w('#drpOpponentEditLeague').value = wSelected.league;
            $w('#inpOpponentEditTeam').value = wSelected.team;
            $w('#chkOpponentEditDone').checked = wDone;
            break;
        case "Fixture":
            wLeagueStem = wSelected.league.substring(0,2);
            if (wLeagueStem === "FG") {
                wLeagueKey = wSelected.league;
            } else {
                wLeagueKey = wSelected.league + String(wSelected.division);
            }
;            let wPrimed = (wSelected.primed === "" || wSelected.primed === null || wSelected.primed === undefined) ? "N" : wSelected.primed
            let wDate = convertStringToDate(wSelected.weekEnding);
            $w('#drpFixtureEditLeague').value = wLeagueKey;
            $w('#inpFixtureEditDivision').value = wSelected.division;
            $w('#inpFixtureEditWeek').value = wSelected.week;
            $w('#dpkFixtureEditWeekEnding').value = wDate;
            $w('#dpkFixtureEditPlayOn').value = wSelected.playOn;
            $w('#inpFixtureEditHome').value = wSelected.home;
            $w('#inpFixtureEditAway').value = wSelected.away;
            $w('#rgpFixtureEditHomeAway').value = wSelected.homeAway;
            $w('#drpFixtureEditPrimed').value = wPrimed;
            break;
        case "RefEvent":
            $w('#drpRefEventEditEventType').value = wSelected.eventType;
            $w('#inpRefEventEditSubject').value = wSelected.subject;
            $w('#tpkRefEventEditStartTime').value = wSelected.startTime;
            $w('#inpRefEventEditDuration').value = String(wSelected.duration);
            $w('#inpRefEventEditRinks').value = wSelected.rinks;
            $w('#rgpRefEventEditMix').value = wSelected.mix;
            $w('#rgpRefEventEditGameType').value = wSelected.gameType;
            $w('#rgpRefEventEditUseType').value = wSelected.useType;
            $w('#rgpRefEventEditDress').value = wSelected.dress;
            $w('#inpRefEventEditSubject').focus();
            break;
        case "Event":
        case "CanEvent":
            wLeagueKey = wSelected.league;
            wLeagueValue = (wLeagueKey && wLeagueKey !=="") ? wLeagueKey : "X";
            if (wLeagueValue !== "X") {
                $w(`#drp${pTarget}EditTeam`).value = wSelected.team;
            } else {
                $w(`#drp${pTarget}EditTeam`).value = "X";
            }
            if (isNaN(wSelected.requiredYear)) {
                wSelected.requiredYear = gYear;
            }
            if (wSelected.startDate) {
                if (isNaN(wSelected.requiredJDate)){
                    let wDate =  wSelected.startDate;
                    let wJDate = DateToOrdinal(wDate);
                    wSelected.requiredJDate = wJDate;
                }
            }
            $w(`#drp${pTarget}EditEventType`).value = wSelected.eventType;
            $w(`#drp${pTarget}EditLeague`).value = wLeagueValue; 
            $w(`#inp${pTarget}EditSubject`).value = wSelected.subject;
            $w(`#dpk${pTarget}EditStartDate`).value = wSelected.startDate;
            $w(`#tpk${pTarget}EditStartTime`).value = wSelected.startTime;
            $w(`#inp${pTarget}EditDuration`).value = wSelected.duration;
            $w(`#drp${pTarget}EditHomeAway`).value =wSelected.homeAway;
            $w(`#inp${pTarget}EditRinks`).value = wSelected.rinks;
            $w(`#rgp${pTarget}EditMix`).value = wSelected.mix;
            $w(`#drp${pTarget}EditUploadStatus`).value = wSelected.uploadStatus;
            $w(`#inp${pTarget}EditRequiredYear`).value = wSelected.requiredYear;
            $w(`#inp${pTarget}EditRequiredJDate`).value = wSelected.requiredJDate;
            $w(`#rgp${pTarget}EditGameType`).value = wSelected.gameType;
            $w(`#rgp${pTarget}EditUseType`).value = wSelected.useType;
            $w(`#rgp${pTarget}EditDress`).value = wSelected.dress;
            break;
        default:
            console.log("/page/MaintainCandidateEvent  populateEdit Invalid switch key", pTarget)
            break;
    }
}

// ================================================= Opponent Events ================================================
//

export function doBtnOpponentAToRefEventClick(event) {
    $w('#secOpponent').collapse();
    $w('#secRefEvent').expand();
}
export function doBtnOpponentAToFixtureClick(event) {
    $w('#secOpponent').collapse();
    $w('#secFixture').expand();
}
export function doBtnOpponentAToCanEventClick(event) {
    $w('#secOpponent').collapse();
    $w('#secCanEvent').expand();
}

export async function doBtnOpponentAPrimeClick(event) {
    let wTarget = "Opponent";
    showWait(wTarget);
	
    let wSelectedOpponents = [];
    let wItemIds = getSelectStack();
    let wTownTeams = [];

    for (let wId of wItemIds) {
        let wRecord = getTargetItem(wTarget, wId);
        if (wRecord) {
            wSelectedOpponents.push(wRecord);
        }
    }
    let wResult = await getTownTeams();
    if (wResult.status) {
        wTownTeams = wResult.teams;
    } else {
        console.log("/page/MaintainCandidateEvent  doBtnOpponentAPrimeClick No Town Teams Found");
        return;
    }

    let wFixtureList = $w('#rptFixtureList').data;
    let wFixture = {};

    let count = 0;
    let errorCount = 0;
    let pbrIndex = 0;
    $w('#pbrOpponent').targetValue= wSelectedOpponents.length;
    $w('#pbrOpponent').expand();
    for (let wOpponent of wSelectedOpponents){
        let wUpdateList = [];
        let wLeagueKey = wOpponent.league;
        let wLeagueKeyStem = wLeagueKey.slice(0,2);
        let wDivision = 0;
        let wTownTeamsInLeague = wTownTeams.filter( item => item.league === wLeagueKey);
        let wLeagueCode = wLeagueKey;
        if (wLeagueKeyStem !== "FG"){
            wDivision = parseInt(wOpponent.league.slice(-1),10);
            wLeagueCode = wLeagueKeyStem;
            wTownTeamsInLeague = wTownTeams.filter( item => (item.league === wLeagueKeyStem 
                    && item.division === wDivision));
        }
        //console.log("TownTeamsInLeague");
        //console.log(wOpponent);
        //console.log(wTownTeamsInLeague)
        for (let wTownTeam of wTownTeamsInLeague){
            if /** Opponent is me */(wOpponent.team === wTownTeam.name ) { continue }
            if (AlreadyProcessed(wFixtureList, wTownTeam, wOpponent)) { continue }
            if /** Im playing another Town team */ (IsATownTeam(wTownTeamsInLeague, wOpponent.team)) {
                wFixture = await processFixtureRecord(wLeagueCode, wDivision, "H", wTownTeam, wOpponent);
                wFixtureList.push(wFixture);
                wUpdateList.push(wFixture);
                //console.log("Play town on town");
            } else {
                wFixture = await processFixtureRecord(wLeagueCode, wDivision, "H", wTownTeam, wOpponent);
                wFixtureList.push(wFixture);
                wUpdateList.push(wFixture);
                wFixture = await processFixtureRecord(wLeagueCode, wDivision, "A", wOpponent, wTownTeam);
                wFixtureList.push(wFixture);
                wUpdateList.push(wFixture);
            }
        }

        for (let wUpdate of wUpdateList){
            let wResult = await saveRecord("lstKennetImport", wUpdate);
            if (wResult.status) {
                let wSavedRecord = wResult.savedRecord;
                wUpdate._id = wSavedRecord._id;
                updateGlobalDataStore(wUpdate,"Fixture");
                resetPagination("Fixture");
                wOpponent.status = "C";
                let wResult2 = await saveRecord("lstLeagueOpponents", wOpponent);
                if (wResult2.status) {
                    updateGlobalDataStore(wOpponent, "Opponent");
                    count++;
                } else {
                    console.log("/page/MaintainCandidateEvent  doBtnOpponentAPrimeClick lstLeagueOpponents save fail, error");
                    console.log(wResult2);
                    showError("Opponent", 26);
                    errorCount++;
                }
            } else {
                console.log("/page/MaintainCandidateEvent  doBtnOpponentAPrimeClick lstKennetImport save fail, errors");
                console.log(wResult);
                showError("Opponent", 26);
                errorCount++;
            }
        } // for wUpdateList
        pbrIndex++;
        $w('#pbrOpponent').value = pbrIndex;
    } // for wSelectedOpponents
    console.log(`/page/MaintainCandidateEvent  doBtnOpponentAPrimeClick input = ${wSelectedOpponents.length},
                 updates = ${count}, errors = ${errorCount}`);
    resetSection("Opponent");
    showError(wTarget, 7);
    hideWait(wTarget);
    $w('#pbrOpponent').collapse();
}   

export async function btnOpponentASave_click(event) {

    try {
        showWait("Opponent");
        $w('#btnOpponentASave').disable();

        let wOpponent = {
            "_id": "", 
            "league": $w('#drpOpponentEditLeague').value,
            "team": $w('#inpOpponentEditTeam').value,
            "status": "N"
        }
        //  VALIDATIONS

        //  Main section
        let wDone =     "N";

        switch (getMode()) { 
            case MODE.CREATE:
                wOpponent._id = undefined;
                break;
            case MODE.UPDATE:
                wOpponent._id = getSelectStackId();
                wDone = ($w(`#chkOpponentEditDone`).checked) ? "C" : "N";
                wOpponent.status = wDone;
                break;
            default:
                console.log ("/page/MaintainCandidateEvent  btnOpponentASave invalid mode = [" + getMode() + "]");
        }
        let wResult = await saveRecord("lstLeagueOpponents", wOpponent);
        //let wResult = {"status": true, "savedRecord": {"_id": 123}, "error": null}
        //let res = false;
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wOpponent._id = wSavedRecord._id;
                    showError("Opponent",8);
                    break;
                case MODE.UPDATE:
                    showError("Opponent",7);
                    break;
                default:
                    console.log ("/page/MaintainCandidateEvent  btnOpponentASave invalid mode = [" + getMode() + "]");
            }
            updateGlobalDataStore(wSavedRecord,"Opponent");
            updatePagination("Opponent");
            resetCommands("Opponent");
        } else {
            if (wResult.savedRecord){
                console.log("/page/MaintainCandidateEvent  btnSave saveRecord failed, savedRecord");
                console.log(wResult.savedRecord);
            } else {
                console.log("/page/MaintainCandidateEvent btnSave saverecord failed, error");
                console.log(wResult.error);
            }
        }
        resetSection("Opponent");
        $w('#btnOpponentASave').enable();
        hideWait("Opponent");
        setMode(MODE.CLEAR);
    }
	catch (err) {
        $w('#btnOpponentASave').enable();
        hideWait("Opponent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent btnOpponentASave_click Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}

export async function strOpponent_viewportEnter(event) {
    await configureScreen("Opponent");
//    displayOpponentTableData(gOpponents);
}

// --------------------------------------------- Opponents Supporting Functions -------------------------------------------------
//
export async function loadOpponentDropDown() {
let wOptions = [
    {"label": "All entries", "value": "All"},
    {"label": "Ladies Friendly", "value": "FGL"},
    {"label": "Mens Friendly", "value": "FGM"},
    {"label": "Mixed Friendly", "value": "FGX"},
    {"label": "Royal Shield", "value": "RS1"},
    {"label": "Thames Valley Div 1", "value": "TV1"},
    {"label": "Thames Valley Div 3", "value": "TV3"},
];

    $w('#drpOpponentChoice').options = wOptions;
    $w('#drpOpponentChoice').value = "All";
}

async function populateOpponentDropDowns(){
    let wLeagues = [
       { "label": "", "value": "X"},
       { "label": "Thames Valley 1", "value": "TV1"},
       { "label": "Thames Valley 3", "value": "TV3"},
       { "label": "Royal Shield", "value": "RS1"},
       { "label": "Friendly - Ladies", "value": "FGL"},
       { "label": "Friendly - Mens", "value": "FGM"},
       { "label": "Friendly - Mixed", "value": "FGX"}
    ]
        
    $w('#drpOpponentEditLeague').options = wLeagues;
    $w('#drpOpponentEditLeague').value = "X";
    $w('#inpOpponentEditTeam').value = "";
}

export function doOpponentView (pViewType){
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkOpponentListSelectAll').collapse();
        $w('#btnOpponentListTop').collapse();
        $w('#rptOpponentList').collapse();
    } else {
        $w('#chkOpponentListSelectAll').expand();
        $w('#btnOpponentListTop').expand();
        $w('#rptOpponentList').expand();
    }
    return true;
}


async function processFixtureRecord(pLeague, pDivision, pHomeAway, pHome, pAway) {
    
    let wHome = pHome.name || pHome.team;
    let wAway = pAway.name || pAway.team;
    //console.log("Process Match Record: League", pLeague, "Div", pDivision, " ", wHome, " plays ", wAway);

    let wFixture = {
		"_id": "", 
		"league": pLeague,
        "division": pDivision,
        "weekEnding": "",
        "playOn": null,
		"week": 0,
        "homeAway": pHomeAway,
		"home": wHome,
		"away": wAway
	}
    wFixture._id = undefined;
    return wFixture;
}

function IsATownTeam (pTownTeams, pTeam){
    let wIdx = pTownTeams.find( item => item.name === pTeam);
    if (wIdx) { return true};
    return false;
}

function AlreadyProcessed(pMatchList, pTown, pOpponent){
    for (let wMatch of pMatchList){
        //console.log("List:", wMatch.home," v ", wMatch.away, "Input", pTown.name," v" , pOpponent.team);
        if ((wMatch.home === pTown.name && wMatch.away === pOpponent.team) ||
             (wMatch.home === pOpponent.team && wMatch.away === pTown.name)) {
                 console.log("/page/MaintainCandidateEvent AlreadyProcessed already done", pTown.name, pOpponent.team);
                 return true;
        }
    }
    return false;
}
// ================================================= Fixture Events ================================================
//
export function btnFixturesAToOpponents_click(event) {
    $w('#secFixture').collapse();
    $w('#secOpponent').expand();
}
export function btnFixturesAToRefEvents_click(event) {
    $w('#secFixture').collapse();
    $w('#secRefEvent').expand();
}
export function btnFixtureAToCanEvents_click(event) {
    $w('#secFixture').collapse();
    $w('#secCanEvent').expand();
}

export function doBtnFixtureAToOpponentClick(event) {
    $w('#secFixture').collapse();
    $w('#secOpponent').expand();
}
export function doBtnFixtureAToRefEventClick(event) {
    $w('#secFixture').collapse();
    $w('#secRefEvent').expand();
}
export function doBtnFixtureAToCanEventClick(event) {
    $w('#secFixture').collapse();
    $w('#secCanEvent').expand();
}

export function drpFixtureEditLeague_change(event) {
    let wLeagueDivision = event.target.value;
    let wDivision = parseInt(wLeagueDivision.slice(-1),10);
    $w('#inpFixtureEditDivision').value = (wDivision) ? String(wDivision) : "";
}
export async function drpFixtureChoiceChange(event) {
    showWait("Fixture");
    let wLeagueDivision = event.target.value;
    let [wLeagueBase, wDivision, wEventType, wMix] = await parseLeagueName(wLeagueDivision);
    let wResult = await getNewTeamsByLeague(wLeagueBase, wDivision);
    if (wResult.status) {
        let wTeamsInLeague = wResult.teams;
        if (wTeamsInLeague.length > 1){
            let wTeamChoices = wTeamsInLeague.map ( item => {
                return {
                    "value": item.teamName,
                    "label": item.teamName
                }
            })
            $w('#drpFixtureChoiceTeam').options = wTeamChoices;
            $w('#drpFixtureChoiceTeam').selectedIndex = 0;
            $w('#boxFixtureChoiceTeam').expand();
            drpChoice_change(event);
        } else {
            $w('#boxFixtureChoiceTeam').collapse();
            drpChoice_change(event);
        }
    }
}
export async function drpFixtureChoiceTeamChange (event) {
    drpChoice_change(event);
}

export async function btnFixtureASave_click(event) {

    try {
        showWait("Fixture");
        $w('#btnFixtureASave').disable();

        let wLeagueKey = $w('#drpFixtureEditLeague').value;
        let wLeagueStem = wLeagueKey.substring(0,2);
        let wLeague = "";
        if (wLeagueStem === "FG"){
            wLeague = wLeagueKey;
        } else {
            wLeague = wLeagueKey.slice(0,wLeagueKey.length -1);
        }
        let wPlayOnDate = $w('#dpkFixtureEditPlayOn').value;
        let wPlayOnWeek = getWeekNumber(wPlayOnDate);
        let wWeek = parseInt($w('#inpFixtureEditWeek').value,10);
        let wFixture = {
            "_id": "", 
            "league": wLeague,
            "division": parseInt($w('#inpFixtureEditDivision').value,10) || 0,
            "week": parseInt(wWeek,10) || 0,
            "weekEnding": "",
            "homeAway": $w('#rgpFixtureEditHomeAway').value,
            "playOn": wPlayOnDate,
            "home": $w('#inpFixtureEditHome').value,
            "away": $w('#inpFixtureEditAway').value,
            "primed": $w('#drpFixtureEditPrimed').value
        }
        let wDate;
        wDate = $w('#dpkFixtureEditWeekEnding').value;
        if (wDate) {
            wDate = convertDateToString(wDate);

        } else {
            wDate = "";
        }
        
        let wResult;
        //  Valdations
        if ($w('#rgpFixtureEditHomeAway').valid === false){
            showError("Fixture",18);
            $w('#rgpFixtureEditHomeAway').focus();
            return;
        }
        //  Main section
        wFixture.weekEnding = wDate;
        if (wWeek === 0) {
            wFixture.week = wPlayOnWeek;
        }
        switch (getMode()) {
            case MODE.CREATE:
                wFixture._id = undefined;
                break;
            case MODE.UPDATE:
                wFixture._id = getSelectStackId();
                break;
            default:
                console.log ("/page/MaintainCandidateEvent  btnFIxtureSave invalid mode = [" + getMode() +"]");
        }
        wResult = await saveRecord("lstKennetImport", wFixture);
        //wFixture = {};
        //let res = false;
        if (wResult.status) {
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wFixture._id = wSavedRecord._id;
                    showError("Fixture", 8);
                    break;
                case MODE.UPDATE:
                    showError("Fixture", 7);
                    break;
                default:
                    console.log ("/page/MaintainCandidateEvent btnFixtureSave Fixture Save mode invalid again");
            }
            //console.log("savedrec");
            //console.log(wSavedRecord);
            updateGlobalDataStore(wSavedRecord, "Fixture");
            updatePagination("Fixture");
            resetCommands("Fixture");
        } else {
            if (wResult.savedRecord){
                console.log("/page/MaintainCandidateEvent btnSave saveRecord failed, savedRecord");
                console.log(wResult.savedRecord);
            } else {
                console.log("/page/MaintainCandidateEvent btnSave saverecord failed, error");
                console.log(wResult.error);
            }
        }
        resetSection("Fixture");
        $w('#btnFixtureASave').enable();
        hideWait("Fixture");
        setMode(MODE.CLEAR);
    }
	catch (err) {
        $w('#btnFixtureASave').enable();
        hideWait("Fixture");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent  FixtureSave Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}

export async function doBtnFixtureAPrimeClick(event) {
    
    try{
        let wTarget = "Fixture";
        showWait(wTarget);
        $w('#pbrFixture').expand();
        $w('#btnFixtureAPrime').disable();

        let wSelectedFixtures = [];
        let wItemIds = getSelectStack();

        for (let wId of wItemIds) {
            let wRecord = getTargetItem(wTarget, wId);
            if (wRecord) {
                wSelectedFixtures.push(wRecord);
            }
        }

        let count = 0;
        let skipped = 0;
        let errorCount = 0;
        let pbrIndex = 0;
        $w('#pbrFixture').targetValue = wSelectedFixtures.length;
        for (let wFixture of wSelectedFixtures){
            let wUpdateList = [];
            let [wLeagueBase, wDivision, wEventType, wMix] = await parseLeagueName(wFixture.league); //Event type = LG or FG
            //-------------------------------------------------------Validations------------------------------------------------------------
            //
            let wDateEntered = wFixture.playOn;
            if (!wDateEntered || !wDateEntered.getMonth()) {
                console.log("/page/MaintainCandidateEvent doBtnFixtureAPrimeClick No start date set. Selection skipped");
                skipped++;
                continue;
            }
            //-------------------------------------------------------MAin section------------------------------------------------------------
            let wResult = await getNewTeamsByLeague(wFixture.league, wFixture.division);
            let wChoiceTeam = $w('#drpFixtureChoiceTeam').value;
            if (wResult.status) {
                let wLeagueTeams = wResult.teams;
                let wTownTeams = wLeagueTeams.filter( item => item.teamName === wFixture.home || wFixture.away);
                let wTownTeam = wTownTeams[0];
                if (wTownTeams) {
                    if (wTownTeams.length > 1){
                        let wTownTeamArray = wTownTeams.filter ( item => item.teamName === wChoiceTeam);
                        wTownTeam = wTownTeamArray[0];
                    }
                    let wCanEvent = await processFixtureCandidateRecord(wEventType, wFixture, wTownTeam);
                    wUpdateList.push(wCanEvent);
                } else {
                    console.log("/page/MaintainCandidateEvent doBtnFixtureAPrimeClick no Town Team found");
                }
            }
        
            if (wUpdateList.length === 0) {
                showError("Fixture", 16);
            } else {
                for (let wUpdate of wUpdateList){
                    let wResult = await saveRecord("lstCandidateEvent", wUpdate);
                    if (wResult.status) {
                        let wSavedRecord = wResult.savedRecord;
                        wUpdate._id = wSavedRecord._id;
                        updateGlobalDataStore(wUpdate,"CanEvent");
                        resetPagination("CanEvent");
                        wFixture.primed = "Y";
                        let wResult2 = await saveRecord("lstLeagueOpponents", wFixture);
                        if (wResult2.status) {
                            updateGlobalDataStore(wFixture, "Fixture");
                            updatePagination("Fixture");
                            resetSection("CanEvent"); // cos number of fixtures has changed
                            count++;
                        } else {
                            console.log("/page/MaintainCandidateEvent doBtnFixtureAPrimeClick lstLeagueOpponents save fail, error");
                            console.log(wResult2);
                            showError("Opponent", 26);
                            errorCount++;
                        }
                    } else {
                        console.log("/page/MaintainCandidateEvent doBtnFixtureAPrimeClick lstKennetImport save fail, errors");
                        console.log(wResult);
                        showError("Opponent", 26);
                        errorCount++;
                    }
                } // for wUpdateList
            } // if wUpdateList = 0
            pbrIndex++;
            $w('#pbrFixture').value = pbrIndex;
        } //for wSelectedFixtures
        $w('#btnFixtureAPrime').enable();
        console.log(`/page/MaintainCandidateEvent doBtnFixtureAPrimeClick input = ${wSelectedFixtures.length},
                 updates = ${count}, skipped = ${skipped}, errors = ${errorCount}`);

        resetSection("Fixture");
        setMode(MODE.CLEAR);
        hideWait(wTarget);
        $w('#pbrFixture').collapse();
    }
    catch (err) {
        $w('#btnFixtureASave').enable();
        hideWait("Fixture");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent FixturePrime Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}   

export async function strFixture_viewportEnter(event) {
        await configureScreen("Fixture");
}
// ================================================Fixture Supporting Functions =================================================
//
/**
 * Description:  When an import is made from Kennet and KLV web sites, they include a week number for each entry, and, in the absence of any 
 *               firm dates,  this is useful in sorting the fixtures in the list. For other sources we done have this, and therefore all the
 *               undated fixtures appear at the top of the list. This is actually useful as its then simple just to work down that list and 
 *               assign dates. When a date is assigned, thsi routine is used to give an approximate week in year value to put in the week number, 
 *               so that this list sorts itself as more entries go in.
 *  
 */ 
export function getWeekNumber(pDate){

	let currentDate = new Date();
	let startDate = new Date(currentDate.getFullYear(), 0, 1);
	let wDiff = pDate.getTime() - startDate.getTime();
	return  Math.round(wDiff / (1000 * 3600 * 24 * 7));
}

export async function processFixtureCandidateRecord(pEventType, pFixture, pTeam) {
    
    let wCanEvent = {
		"_id": "",
        "subject": "", 
        "startDate": null, 
        "startTime": pTeam.startTime, 
        "requiredJDate": 0, 
        "requiredYear": 0, 
		"league": "",
        "team": pTeam.teamKey, 
        "homeAway": pFixture.homeAway, 
        "rinks": String(pTeam.noMatches), 
        "mix": pTeam.gender, 
        "dress": pTeam.dress, 
        "duration": pTeam.duration, 
        "eventType": pEventType, 
        "gameType": pTeam.gameType, 
        "useType": pTeam.useType, 
        "uploadStatus": "N", 
        "status": "N", 
        "summary": "", 
        "eventId": "", 
        "calKey": "" 
	}
    let wTime = pTeam.startTime;
    let [wHours, wMins] = extractTime(wTime);
    let wStartDate = pFixture.playOn;
    wStartDate.setHours(wHours, wMins,0);
    wCanEvent.startDate = wStartDate;
    wCanEvent.requiredJDate = DateToOrdinal(wStartDate);
    wCanEvent.requiredYear = wStartDate.getFullYear();

    let wLeague  = (pEventType === "FG") ? pFixture.league : pFixture.league + String(pFixture.division); 
    wCanEvent.league = wLeague;
    let wCalKey = await getCalKey(pEventType, wLeague);
    wCanEvent.calKey = wCalKey; 
    wCanEvent.subject = (pFixture.homeAway === "H") ? pFixture.away : pFixture.home;
    wCanEvent._id = undefined;
    return wCanEvent;
}

function extractTime(pTimeStr) {
    // Split the string by colon to separate hours and minutes
    let timeArray = pTimeStr.split(':');
    
    // Convert hours and minutes to integers
    const hours = parseInt(timeArray[0]);
    const minutes = parseInt(timeArray[1]);
    
    return [hours, minutes];
}

export function doFixtureView (pViewType){
    //console.log("DoFixtureView", pViewType);
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkFixtureListSelectAll').collapse();
        $w('#btnFixtureListTop').collapse();
        $w('#rptFixtureList').collapse();
    } else {
        $w('#chkFixtureListSelectAll').expand();
        $w('#btnFixtureListTop').expand();
        $w('#rptFixtureList').expand();
    }
    return true;
}

export async function loadFixtureDropDown() {
/**
    let wChoiceOptions = [
        {"label": "All entries", "value": "All"},
        {"label": "Club Events", "value": "CE"},
        {"label": "Club Games", "value": "CG"},
        {"label": "Loans", "value": "HG"}
    ];
*/
    let wChoiceOptions = [
        { "label": "All entries", "value": "All"}
    ]

    let wLeagues = await getNewAllLeagueOptions();
    let wSortedOptions = _.sortBy(wLeagues, ["value"]);
    wChoiceOptions.push(...wSortedOptions);

    $w('#drpFixtureChoice').options = wChoiceOptions;
    $w('#drpFixtureChoice').value = "All";
}

async function populateFixtureDropDowns(){
    let wChoiceOptions = [
        { "label": "", "value": "X"}
    ]
    
    let wLeagues = await getNewAllLeagueOptions();
    let wSortedOptions = _.sortBy(wLeagues, ["value"]);
    wChoiceOptions.push(...wSortedOptions);

    $w('#drpFixtureEditLeague').options = wChoiceOptions;
    $w('#drpFixtureEditLeague').value = "X";
}

// =================================================RefEvent Events ================================================
//

export function btnRefEventsAToCanEvents_click(event) {
    $w('#secRefEvent').collapse();
    $w('#secCanEvent').expand();
}

export function btnRefEventsAToFixtures_click(event) {
    $w('#secRefEvent').collapse();
    $w('#secFixture').expand();
}

export function btnRefEventsAToOpponents_click(event) {
    $w('#secRefEvent').collapse();
    $w('#secOpponent').expand();
}

export function doBtnRefEventAToOpponentClick(event) {
    $w('#secRefEvent').collapse();
    $w('#secOpponent').expand();
}
export function doBtnRefEventAToFixtureClick(event) {
    $w('#secRefEvent').collapse();
    $w('#secFixture').expand();
}

export function doBtnRefEventAToCanEventClick(event) {
    $w('#secRefEvent').collapse();
    $w('#secCanEvent').expand();
}

export async function btnRefEventASave_click(event) {
    try {
        let wRefEvent = {
            "_id": "", 
            "eventType": $w('#drpRefEventEditEventType').value,
            "duration": null,
            "useType": $w('#rgpRefEventEditUseType').value,
            "startTime": $w('#tpkRefEventEditStartTime').value.substring(0,5),
            "subject": $w('#inpRefEventEditSubject').value,
            "dress": $w('#rgpRefEventEditDress').value,
            "rinks": $w('#inpRefEventEditRinks').value,
            "gameType": $w('#rgpRefEventEditGameType').value,
            "league": null,
            "mix": $w('#rgpRefEventEditMix').value,
            "team": null
        }
        let wDuration = parseFloat($w('#inpRefEventEditDuration').value) || 0;
        wRefEvent.duration = wDuration;
        let wResult;
        //------------------------------------------------------------- Validations ----------------------------

        //------------------------------------------------------------- Main Code ----------------------------
        switch (getMode()) { 
            case MODE.CREATE:
                wRefEvent._id = undefined;
                break;
            case MODE.UPDATE:
                wRefEvent._id = getSelectStackId();
                break;
            default:
                console.log ("/page/MaintainCandidateEvent btnRefEventSave invalid mode = [" + getMode() +"]");
        }
        wResult = await saveRecord("lstReferenceEvent", wRefEvent);        //res is the updated record
        let wRefEvents = [];
        if (wResult.status){
        //let res = false;
            let wSavedRecord = wResult.savedRecord;
            switch (getMode()) { 
                case MODE.CREATE:
                    wRefEvent._id = wSavedRecord._id;
                    showError("RefEvent", 8);
                    break;
                case MODE.UPDATE:
                    showError("RefEvent", 7);
                    break;
                default:
                    console.log ("/page/MaintainCandidateEvent btnRefEventSave RefEvent Save invalid mode again");
            }
            updateGlobalDataStore(wSavedRecord, "RefEvent");
            // For RefEvents there is no completed status i.e the event can be generated as many times as needed
            updatePagination("RefEvent");
            resetCommands("RefEvent");
        } else {
            if (wResult.savedRecord){
                console.log("/page/MaintainCandidateEvent btnSave saveRecord failed, savedRecord");
                console.log(wResult.savedRecord);
            } else {
                console.log("/page/MaintainCandidateEvent btnSave saverecord failed, error");
                console.log(wResult.error);
            }
        }
        resetSection("RefEvent");
        $w('#btnRefEventASave').enable();
        hideWait("RefEvent");
        setMode(MODE.CLEAR);
    }
    catch (err) {
        $w('#btnRefEventASave').enable();
        hideWait("RefEvent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent RefEventSave Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}

export async function strRefEvent_viewportEnter(event) {
    await configureScreen("RefEvent");
}

export async function doBtnRefEventAPrimeClick(event) {

    try {
        let wTarget = "RefEvent";
        showWait(wTarget);
        $w('#btnRefEventAPrime').disable();

        let wSelectedRefEvents = [];
        let wItemIds = getSelectStack();

        for (let wId of wItemIds) {
            let wRecord = getTargetItem(wTarget, wId);
            if (wRecord) {
                wSelectedRefEvents.push(wRecord);
            }
        }
        let count = 0;
        let errorCount = 0;
        let pbrIndex = 0;
        $w('#pbrRefEvent').targetValue= wSelectedRefEvents.length;
        $w('#pbrRefEvent').expand();

        for (let wRefEvent of wSelectedRefEvents){
            let wUpdateList = [];
            let wCanEvent = {
                "_id": "",
                "subject": wRefEvent.subject,
                "startDate": null, 
                "startTime": wRefEvent.startTime,
                "requiredJDate": 0, 
                "requiredYear": 0, 
                "league": null,
                "team": null, 
                "homeAway": "H", 
                "rinks": wRefEvent.rinks,
                "mix": wRefEvent.mix,
                "dress": wRefEvent.dress,
                "duration": parseFloat(wRefEvent.duration),
                "eventType": wRefEvent.eventType, 
                "gameType": wRefEvent.gameType,
                "useType": wRefEvent.useType,
                "uploadStatus": "N", 
                "status": "N", 
                "summary": "", 
                "eventId": "", 
                "calKey": "" 
            }
            //-------------------------------------------------------Validations------------------------------------------------------------
            //
            //-------------------------------------------------------MAin section------------------------------------------------------------
            let wCalKey = await getCalKey(wRefEvent.eventType, "");
            wCanEvent.calKey = wCalKey; 
            wCanEvent._id = undefined;

            wUpdateList.push(wCanEvent);

            if (wUpdateList.length === 0) {
                showError("RefEvent", 16);
            } else {
                for (let wUpdate of wUpdateList){
                    let wResult = await saveRecord("lstCandidateEvent", wUpdate);
                    if (wResult.status) {
                        let wSavedRecord = wResult.savedRecord;
                        wUpdate._id = wSavedRecord._id;
                        updateGlobalDataStore(wUpdate,"CanEvent");
                        showError("RefEvent", 7);
                        updatePagination("CanEvent");
                        resetSection("CanEvent"); // cos number of fixtures has changed
                        resetCommands("RefEvent");
                        count++;
                    } else {
                        console.log("client MaintainCandidateEvent doBtnRefEventAPrimeClick lstCandidateEvent save fail, errors");
                        console.log(wResult);
                        showError("RefEvent", 26);
                        errorCount++;
                    }
                } //for wUpdateList
            } // wUpdateList = 0
            pbrIndex++;
            $w('#pbrRefEvent').value = pbrIndex;
        }
        console.log(`/page/MaintainCandidateEvent doBtnRefEventAPrimeClick input = ${wSelectedRefEvents.length},
                 updates = ${count}, errors = ${errorCount}`);
        $w('#btnRefEventAPrime').enable();
        resetSection("RefEvent");
        hideWait(wTarget);
        $w('#pbrRefEvent').collapse();
        }
    catch (err) {
        $w('#btnRefEventAPrime').enable();
        hideWait("RefEvent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent doBtnRefEventAPrimeClick Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}   

// =================================================RefEvent Supporting Functions =================================================
//

async function populateRefEventDropDowns(){
    let wOptions = [
       { "label": "", "value": "X"},
       { "label": "Club Event", "value": "CE"},
       { "label": "Club Game", "value": "CG"},
       { "label": "Loan", "value": "HG"}
    ]

    $w('#drpRefEventEditEventType').options = wOptions;
    $w('#drpRefEventEditEventType').value = "X";
}

export function doRefEventView (pViewType){
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkRefEventListSelectAll').collapse();
        $w('#btnRefEventListTop').collapse();
        $w('#rptRefEventList').collapse();
    } else {
        $w('#chkRefEventListSelectAll').expand();
        $w('#btnRefEventListTop').expand();
        $w('#rptRefEventList').expand();
    }
    return true;
}

// =================================================CanEvent Events ================================================
//

export function doBtnCanEventAToOpponentClick(event) {
    $w('#secCanEvent').collapse();
    $w('#secOpponent').expand();
}
export function doBtnCanEventAToRefEventClick(event) {
    $w('#secCanEvent').collapse();
    $w('#secRefEvent').expand();
}
export function doBtnCanEventAToEventClick(event) {
    $w('#secCanEvent').collapse();
    $w('#secEvent').expand();
}
export function doBtnCanEventAToFixtureClick(event) {
    $w('#secCanEvent').collapse();
    $w('#secFixture').expand();
}

export async function btnCanEventASave_click(event) {
    await doEntityASaveClick("CanEvent");
    return;
}

export function doBtnCanEventAPrimeInitialiseClick(event) {
    $w('#chkCanEventListSelectAll').checked = true;
    doChkSelectAll("CanEvent");
    btnDelete_click(loggedInMember.lstId, event);
}

export async function doBtnCanEventAPrimeClick(event) {
    try {    
        let wTarget = "CanEvent";
        showWait(wTarget);
        $w('#btnCanEventAPrime').disable();

        let wSelectedCanEvents = [];
        let wItemIds = getSelectStack();

        for (let wId of wItemIds) {
            let wRecord = getTargetItem(wTarget, wId);
            if (wRecord) {
                wSelectedCanEvents.push(wRecord);
            }
        }

        let wUpdateList = [];

        for (let wCanEvent of wSelectedCanEvents){
            //let [wLeagueBase, wDivision, wEventType, wMix] = await parseLeagueName(wFixture.league); //Event type = LG or FG
            //-------------------------------------------------------Validations------------------------------------------------------------
            //
            let wStartDate = wCanEvent.startDate;
            if (!wStartDate || !wStartDate.getMonth()) {
                console.log("/page/MaintainCandidateEvent doBtnCanEventAPrimeClick No start date set. Selection skipped");
                continue;
            }
            //-------------------------------------------------------MAin section------------------------------------------------------------
            let wResult = await processLiveRecord(wCanEvent);
            if (wResult.status){
                let wNewLiveEventRecord = wResult.savedRecord;
                updateGlobalDataStore(wNewLiveEventRecord,"Event");
                updatePagination("Event");
                wCanEvent.status = "C";
                wCanEvent.selected = true;
                wResult = await saveRecord("lstCandidateEvent", wCanEvent);
                updateGlobalDataStore(wResult.savedRecord, "CanEvent");
                updatePagination("CanEvent");
            }

        }
        resetCommands("CanEvent");
        resetSection("CanEvent");
        $w('#btnCanEventAPrime').enable();
        hideWait("CanEvent");
        setMode(MODE.CLEAR);
    }
    catch (err) {
        $w('#btnCanEventAPrime').enable();
        hideWait("CanEvent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent CanEventPrime Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}   

export function inpCanEventEditStartDate_change(event) {
    let wDate = event.target.value;
    let wYear = wDate.getFullYear();
    let wJDate = DateToOrdinal(wDate);
    $w('#inpCanEventEditRequiredYear').value = wYear;
    $w('#inpCanEventEditRequiredJDate').value = String(wJDate);
}

export async function strCanEvent_viewportEnter(event) {
    //console.log("strCanEvent viewpoint enter");
    await configureScreen("CanEvent");
}


// =================================================CanEvent Supporting Functions =================================================
//
export async function loadCanEventDropDown() {
    let wChoiceOptions = [
        {"label": "All entries", "value": "All"},
        {"label": "All non-league", "value": "XLG"},
        {"label": "Club Events", "value": "CE"},
        {"label": "Club Games", "value": "CG"},
        {"label": "Loans", "value": "HG"}
    ];
    let wTeamOptions = [
       { "label": "", "value": "X"}
    ]

    let wTeams = await getNewAllTeamOptions();
    let wSortedTeams = _.sortBy(wTeams, ["value"]);
    wChoiceOptions.push(...wSortedTeams);
    wTeamOptions.push(...wSortedTeams);
    
    $w('#drpCanEventChoice').options = wChoiceOptions;
    $w('#drpCanEventChoice').value = "All";

    $w('#drpCanEventEditTeam').options = wTeamOptions;
    $w('#drpCanEventEditTeam').value = "X";
}

async function populateCanEventDropDowns(){
    let wOptions = [
       { "label": "", "value": "X"}
    ]
    let wLeagues = await getNewAllLeagueOptions();
    wOptions.push(...wLeagues);

    $w('#drpCanEventEditLeague').options = wOptions;
    $w('#drpCanEventEditLeague').value = "X";
    $w('#drpCanEventEditTeam').value = "X";
}

export function doCanEventView (pViewType){
    //console.log("do can view", pTarget);
    // This caters for putting in a filter inside the list box
    if (pViewType === "P") {
        $w('#chkCanEventListSelectAll').collapse();
        $w('#btnCanEventListTop').collapse();
        $w('#rptCanEventList').collapse();
    } else {
        $w('#chkCanEventListSelectAll').expand();
        $w('#btnCanEventListTop').expand();
        $w('#rptCanEventList').expand();
    }
    return true;
}

async function processLiveRecord(pItem){
    //used by CanEvent Priming
    try {
        let wLiveEventUpdate = {};
        let wLiveEventBookings = [];

        let wBookingsToSave = [];

        let wResult = await processCanEventLiveRecord(pItem);
        wLiveEventUpdate = wResult.eventUpdate;
        wLiveEventBookings = wResult.eventBookings;
        
        wResult = await saveRecord("lstEvents", wLiveEventUpdate);
        if (wResult.status){
            let wNewLiveEventRecord = wResult.savedRecord;
            if (wLiveEventBookings && wLiveEventBookings.length > 0) {
                /**
                let wId = wNewLiveEventRecord._id;
                wBookingsToSave = wLiveEventBookings.map( item => {
                    let wItem = {...item};
                    wItem.eventId = wId;
                    return wItem;
                })
                wResult = await bulkSaveRecords("lstBookings", wBookingsToSave);
                if (!wResult.status) {
                    console.log("client MaintainEvent processRecored Bookings bulk save fail, err");
                    console.log(wResult.error);
                    return {"status": false, "savedRecord": wResult.savedRecord, "error": wResult.error};
                }
                */
                let wResult = await processEventBookings(wNewLiveEventRecord._id, wLiveEventBookings);
                console.log("/page/MaintainCandidateEvent processLiveRecord bookings status", wResult.status);
            } 
            return {"status": true, "savedRecord": wNewLiveEventRecord, "error": null};
        } else {
            if (wResult.savedRecord) {
                console.log("/page/MaintainCandidateEvent ProcessLiveRecord, lstEvent save failed, savedRecord", wResult.savedRecord);
                return {"status": false, "savedRecord": wResult.savedRecord, "error": null};
            } else {
                console.log("/page/MaintainCandidateEvent ProcessLiveRecord, lstEvent save failed, error", wResult.error);
                return {"status": false, "savedRecord": null, "error": wResult.error};
            }
        }
    }
    catch (err) {
        $w('#btnCanEventAPrime').enable();
        hideWait("CanEvent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent ProcessLiveRecord Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}

async function addEventBookings(pEvent) {
    try {
        let wEventBookings = [];
        let wBookerId = loggedInMember.lstId;
        let [wRinksFree, wNoSlots, wStartRink, wSlotRange, wFromSlot, wToSlot] = await getRinksAndSlots(pEvent.startDate,pEvent.startTime, pEvent.duration);
        let wParams = await processEventType(pEvent);
        if (wRinksFree === 0) {
            console.log("/page/MaintainCandidateEvent addEventBookings No rinks available to book ", pEvent._id, pEvent.subject);
        } else if (wRinksFree < parseInt(pEvent.rinks, 10)) {
            wEventBookings = await addBookings(wBookerId, pEvent, wStartRink, wRinksFree, wSlotRange, wFromSlot, wToSlot, wParams);
            console.log(`/page/MaintainCandidateEvent addEventBookings Only ${wRinksFree} bookings our of ${pEvent.rinks} can be recorded for`, pEvent._id, pEvent.subject);
        } else {
            
            wEventBookings = await addBookings(wBookerId, pEvent, wStartRink, pEvent.rinks, wSlotRange, wFromSlot, wToSlot, wParams);
            console.log(`/page/MaintainCandidateEvent addEventBookings  Made all (${pEvent.rinks}) bookings recorded for`, pEvent._id, pEvent.subject);
        }

        return wEventBookings;
    }
    catch (err) {
       $w('#btnCanEventAPrime').enable();
        hideWait("CanEvent");
        setMode(MODE.CLEAR);
		console.log("/page/MaintainCandidateEvent addEventBookings Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")} ;
	}
}

async function processCanEventLiveRecord(pItem){
        
        let wReturn = {
            "eventUpdate": {},
            "eventBookings": []
        }

        let wEventUpdate = {};
        let wBookingUpdates = [];

        let wTmp = pItem.dress;
        let wDress = (wTmp === "N" || wTmp === "W" || wTmp === "G") ? wTmp : "N";
        let wDuration = parseFloat(pItem.duration) || 0;
        let wEventType = pItem.eventType;
        let wLeague = pItem.league;
        if (wEventType === "LG"){
            wLeague = pItem.league.slice(0,pItem.league.length - 1);
        }
        let wCal = await getCalKey(wEventType, wLeague);
        let wRinks = (isNaN(parseInt(pItem.rinks,10))) ? 0 : parseInt(pItem.rinks, 10); 

        wEventUpdate._id = undefined;       
        wEventUpdate.startDate = pItem.startDate;       
        wEventUpdate.requiredYear = pItem.requiredYear;;     
        wEventUpdate.requiredJDate = DateToOrdinal(pItem.startDate);   
        wEventUpdate.subject = pItem.subject;       
        wEventUpdate.rinks = String(wRinks);       
        wEventUpdate.homeAway = pItem.homeAway;;       
        wEventUpdate.startTime = pItem.startTime;       
        wEventUpdate.duration = wDuration;
        wEventUpdate.eventType = pItem.eventType;
        wEventUpdate.useType = pItem.useType;

        wEventUpdate.gameType = pItem.gameType;
        wEventUpdate.league = pItem.league;
        wEventUpdate.team = pItem.team;
        wEventUpdate.dress = wDress;
        wEventUpdate.mix = pItem.mix;
        wEventUpdate.summary = pItem.summary;
        wEventUpdate.status = "A";
        wEventUpdate.uploadStatus = "N" ;
        wEventUpdate.eventId = null;
        wEventUpdate.calKey = wCal;
        wEventUpdate.selected = pItem.selected;
        if (pItem.homeAway === "H" && wRinks > 0) {
            let wBookingList = await addEventBookings(pItem);
            wBookingUpdates = wBookingList;
        }
    wReturn.eventUpdate = wEventUpdate;
    wReturn.eventBookings = wBookingUpdates;

    return wReturn;
}

// =================================================Event Events ================================================
//

export function btnEventAToCanEvent_click(event) {
    $w('#secEvent').collapse();
    $w('#secCanEvent').expand();
}

export async function btnEventASave_click(event) {
    doEntityASaveClick("Event");
    return;
}
// -------------------------------------------Event Supprting Functions -------------------------------------------------
//

export async function loadEventDropDown() {
    let wChoiceOptions = [
        {"label": "All entries", "value": "All"},
        {"label": "Club Events", "value": "CE"},
        {"label": "Club Games", "value": "CG"},
        {"label": "Loans", "value": "HG"}
    ];
    let wTeamOptions = [
       { "label": "", "value": "X"}
    ]

    let wTeams = await getNewAllTeamOptions();
    let wSortedTeams = _.sortBy(wTeams, ["value"]);
    wChoiceOptions.push(...wSortedTeams);
    wTeamOptions.push(...wSortedTeams);
    
    $w('#drpEventChoice').options = wChoiceOptions;
    $w('#drpEventChoice').value = "All";

    $w('#drpEventEditTeam').options = wTeamOptions;
    $w('#drpEventEditTeam').value = "X";
}

async function populateEventDropDowns(){
    let wOptions = [
       { "label": "", "value": "X"}
    ]
    let wLeagues = await getNewAllLeagueOptions();
    wOptions.push(...wLeagues);

    $w('#drpEventEditLeague').options = wOptions;
    $w('#drpEventEditLeague').value = "X";
    $w('#drpEventEditTeam').value = "X";
}

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
export function doEventViewChange (event) {
	let wView = event.target.value;
	doEventView(wView);
}

export async function loadEventsDropDown() {
    let wOptions = [
        { "label": "All entries", "value": "All" },
        { "label": "Club Events", "value": "CE" },
        { "label": "Club Games", "value": "CG" },
        { "label": "Loans", "value": "HG" }
    ];
    let wTeams = await getNewAllTeamOptions();

    let wSortedTeams = _.sortBy(wTeams, ["value"]);
    wOptions.push(...wSortedTeams);
    $w('#drpEventChoice').options = wOptions;
    $w('#drpEventEditEventType').options = wOptions;
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

// --------------------------------------------- General Supporting Functions -------------------------------------------------
//

export function convertStringToDate(pInput){
    let wMonths = ["Jan", "Feb", "Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (pInput) {
        let wTemp1 = pInput.split(" ");
        let wDay = wTemp1[0];
        let wTemp2 = wTemp1[1].split("-");
        let wDate = parseInt(wTemp2[0],10);
        let wMonth = wTemp2[1];
        let wMnth = wMonths.indexOf(wMonth);
        let wYear = parseInt(wTemp2[2],10)+2000;
        let wStartDate = new Date(wYear, wMnth, wDate, 10, 0);
        return wStartDate;
    } else {
        return undefined;
    }
}

function convertDateToString(pInput){
    let wMonths = ["Jan", "Feb", "Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let wDays = ["Sun", "Mon", "Tue", "Wed","Thu","Fri","Sat"];
    if (pInput) {
        let wDay = wDays[pInput.getDay()];
        let wDate = String(pInput.getDate()).padStart(2,"0");
        let wMonth = wMonths[pInput.getMonth()];
        let wYear = String(pInput.getFullYear() -2000).padStart(2,"0");
        //let wStartDate = `${wDay} ${wDate}-${wMonth}-${wYear}`;
        let wStartDate = `${wDay} ${wDate}-${wMonth}`;
        return wStartDate;
    } else {
        return undefined;
    }
}

export function convertNull(pIn, pSub) {
	//convert a null or equivalent into the value of pSub, usually null or ""
    if (pIn === null || typeof pIn === 'undefined') {
        pIn = pSub;
    }
    return pIn;
}

export function DateToOrdinal(pDate){
	try {
		const dayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (typeof pDate === "string"){ return -1}
		const dte = new Date(pDate);
		//initialize date variable
		const yy = dte.getFullYear()
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

		return parseInt(julianDate,10);
	}
	catch (err) {
		console.log("/page/MaintainCandidateEvent DateToOrdinal Try-catch, err");
		console.log(err);
		return -1;
	}
}
