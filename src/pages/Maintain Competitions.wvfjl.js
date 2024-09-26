import wixWindow 				from 'wix-window';
import { authentication }   	from 'wix-members-frontend';
import wixLocation 				from 'wix-location';
import _ 						from 'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { toJulian }                         from 'public/fixtures';
import { getAllClubComp }		from 'backend/backClubComp';
import { getRefCompSet }		from 'backend/backClubComp';
import { saveClubComp }			from 'backend/backClubComp';
import { getClubCompById }		from 'backend/backClubComp';
import { bulkSaveClubComp }		from 'backend/backClubComp';
import { calcParameters }			from 'backend/backClubComp';
import { STAGE}					from 'public/objects/clubComp';
import { BOOKABLE }				from 'public/objects/clubComp';
import { MIX }					from 'public/objects/clubComp';
import { initialiseData }		from 'backend/backClubComp';
import { getSettingsRoundDateArray }	from 'backend/backSystem.jsw';
import { updateSettingsRoundDateArray }	from 'backend/backSystem.jsw';
import { formatDateString }		from 'public/fixtures';
import { BOOKING }           			    from 'public/objects/booking.js';
import { MAINTAINED }			from 'public/objects/clubComp';
import { COMPETITOR_TYPE }		from 'public/objects/clubComp';
import { COMPETITION, COMPETITOR}			from 'public/objects/clubComp';

//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity, getSelectedItem } from 'public/objects/entity';
import { MODE } from 'public/objects/entity';
import { btnCreate_click, btnUpdate_click, btnDelete_click, btnCancel_click } from 'public/objects/entity';
import { chkSelect_click,chkSelectAll_click, btnTop_click,doPgnListClick } from 'public/objects/entity';
import { doInpListNoPerPageChange } from 'public/objects/entity';
import { resetCommands, resetSection, getSelectStackId }  from 'public/objects/entity';
import { resetPagination, updatePagination } from 'public/objects/entity';
import { showError, updateGlobalDataStore, deleteGlobalDataStore } from 'public/objects/entity';
import { getTarget, getTargetItem, configureScreen} from 'public/objects/entity';
import { showWait, hideWait, getMode, setMode } from 'public/objects/entity';
import { getSelectStack} from 'public/objects/entity';
//import { } from 'public/objects/entity';
//import { } from 'public/objects/entity';

//------------------------------------------ from Maintain Club Comp----------------------------

const SELECTED_COLOR = "rgba(190,190,250)";
const NORMAL_COLOR = "rgba(222,222,222)";

let wPublished = [];
let wPublishedIdx = 0;
let wOthers = []; 
let wOtherIdx = 0;
let wCompGames = [];

let wBookList = [];             // an array of games to be inserted into the database
let wStages = [];               // an array of stages to be held in the LiveComp
let wStageCompetitors = [];     // an array of competitors for each stage 

/**
 * these arrays contain an entry for each stage/division in the LiveComp
 * they are used to allocate opponents in a game
- * they are RefCompd as array[stage][div][round][match]
 * 
 * [stage], [div], [round] are all zero based arrays, although any on screen representation will be 1-based
 * [match]                 is a 1-based array
 */
let bracket = [];           // an array of fixtures for a round each entry of the form 11 v 1 where item is team number
let byes = [];              // an array of a bye marker for the matches in a round 
let matchNumbers = [];      // an array of playable match numbers for this round e,g, 2,4,5
let fullMatchList = [];     // an array of all match numbers eg 0, 2, 0, 4, 5 for this round

let wMatchInRound = 0;      // the current match number (0,n) in the round
let wSelectionIdx = 0;      // the running index to the wSelection array
let wNoMatchesInRound = 0;  // represents the number of matches in a round including byes; For KO, it is 2**n
let matchNumIdx = 0;        // used by Selection process to access matchNumbers entries

//let wDataOut = [];
//let wTeamData = [];
//let wRow = [];
//let wTeamRow =[];
//let wControl = [];
//let wIdx = 0;
//let wTeamIdx = 0;//
//let wColName = "";


var toInsertRow = {
    "mix": "",
	"title": "",
	"type": "",
	"winner": "",
	"second": ""
};

var toInsertTeamRow = {
	"place": "",
	"member": ""
}

var toInsertControl = {	
	"id": "",
	"changed": ""
};

let gSchedule = [];
let gCompetition = {};



//------------------------------------------ from Maintain Member (Template)----------------------------

let gWixUpdates = [];
let gSkipped = [];

let gManOutline = "wix:image://v1/88f9e9_cf010bd242a247d897c0d82796abf866~mv2.jpg/man_outline.jpg#originWidth=570&originHeight=561";
let gWomanOutline = "wix:image://v1/88f9e9_7c906da184a746b1add8536f47c445c6~mv2.jpg/woman_outline.jpg#originWidth=549&originHeight=531";

const COLOUR = Object.freeze({
    FREE: "rgba(207,207,155,0.5)",
    SELECTED: "rgba(173,43,12,0.4)",
    NOT_IN_USE: "rgba(180,180,180, 0.3)",
    BOOKED: "#F2BF5E"
});

const gUploadedColour = `rgba(145,145,145,0.5)`;
const gAvailableColour = `rgba(207,207,155,0.5)`;

const capitalize = s => s && s[0].toUpperCase() + s.slice(1);

const MSB_STATE = Object.freeze({
	NEXT:		"N",
	PREVIOUS:	"P",
	S1:			"S1"
});

let gPrimeSelectStack = [];

//-----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();
const gYear = new Date ().getFullYear();

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
			console.log("/page/MaintainCompetitions onReady  Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
		} else {
			console.log("/page/MaintainCompetitions onReady Not signed in");
		}

		$w('#lblDashboardHdr').text = `This table summarises the number of competitions that have been set up for the ${gYear} season`;

		if (wixWindow.formFactor === "Mobile") {
			$w('#strDesktop').collapse();
			$w('#strMobile').expand();
		} else {
			$w('#inpRefCompListNoPerPage').value = "5";
			$w('#inpLiveCompListNoPerPage').value = "5";
			$w('#strMobile').collapse();
			$w('#strDesktop').expand();
			$w('#strRefComp').expand();
			$w('#strRefComp').scrollTo();
			$w('#strLiveComp').collapse();


			const wSummary = await initialiseData(gYear);
			$w('#tblRefCompDashboardSummary').rows = wSummary;
			await loadListData();

		}
		//-------------------------- Event Handlers -----------------------------------------		
		// 
		$w('#strRefComp').onViewportEnter ((event) => strRefComp_viewportEnter(event));
		$w('#btnRefCompACreate').onClick((event) => btnCreate_click(event));
		$w('#btnRefCompAUpdate').onClick((event) => btnUpdate_click(event));
		$w('#btnRefCompADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#btnRefCompASave').onClick((event) => btnRefCompASave_click(event));
		$w('#btnRefCompACancel').onClick((event) => btnCancel_click(event));
		$w('#btnRefCompAToLiveComp').onClick((event) => doBtnRefCompAToLiveCompClick(event));
		//$w('#btnRefCompAPrime').onClick((event) => btnRefCompAPrime_click(event));
		$w('#chkRefCompListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkRefCompListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnRefCompListTop').onClick((event) => btnTop_click(event));
		$w('#rgpRefCompView').onChange((event) => doRefCompViewChange(event));
		$w('#pgnRefCompList').onClick((event) => doPgnListClick(event));
		$w('#inpRefCompListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#btnRefCompPrimeCreate').onClick((event) => doBtnRefCompPrimeCreateClick(event));
		$w('#chkRefCompListPrimeLadies').onClick((event) => chkPrimeSelect_click(event));
		$w('#chkRefCompListPrimeMen').onClick((event) => chkPrimeSelect_click(event));
		$w('#chkRefCompListPrimeMixed').onClick((event) => chkPrimeSelect_click(event));
		// LiveComp Section event handlers
		$w('#strLiveComp').onViewportEnter ((event) => strLiveComp_viewportEnter(event));
		$w('#btnLiveCompACreate').onClick((event) => btnCreate_click(event));
		$w('#btnLiveCompAUpdate').onClick((event) => doBtnUpdateClick(event));
		$w('#btnLiveCompADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
		$w('#pgnLiveCompList').onClick((event) => doPgnListClick(event));
		$w('#inpLiveCompListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));
		$w('#btnLiveCompASave').onClick((event) => btnLiveCompASave_click(event));
		$w('#btnLiveCompACancel').onClick((event) => btnCancel_click(event));
		$w('#btnLiveCompAToRefComp').onClick((event) => doBtnLiveCompAToRefCompClick(event));
		$w('#btnLiveCompAToGameScore').onClick((event) => doBtnLiveCompAToGameScoreClick(event));
		$w('#btnLiveCompAToCompetitors').onClick((event) => doBtnLiveCompAToCompetitorsClick(event));
		$w('#chkLiveCompListSelect').onClick((event) => chkSelect_click(event));
		$w('#chkLiveCompListSelectAll').onClick((event) => chkSelectAll_click(event));
		$w('#btnLiveCompListTop').onClick((event) => btnTop_click(event));
		$w('#btnLiveCompProcessManual').onClick((event) => doBtnLiveCompProcessManualClick(event));
		$w('#btnLiveCompProcessAutomatic').onClick((event) => doBtnLiveCompProcessAutomaticClick(event));
		$w('#btnLiveCompEditWinnersAdd').onClick((event) => btnLiveCompEditWinnersAdd_click(event));
		$w('#btnLiveCompEditSecondsAdd').onClick((event) => btnLiveCompEditSecondsAdd_click(event));
		$w('#btnLiveCompEditWinnersClear').onClick((event) => btnLiveCompEditWinnersClear_click(event));
		$w('#btnLiveCompEditSecondsClear').onClick((event) => btnLiveCompEditSecondsClear_click(event));

		//-------------------------- Repeaters Section -----------------------------------------		
		// 
		$w('#rptRefCompList').onItemReady ( ($item, itemData, index) => {
			loadRptRefCompList($item, itemData, index);
		})

		$w('#rptRefCompListPrime').onItemReady ( ($item, itemData, index) => {
			loadRptRefCompListPrime($item, itemData, index);
		})

		$w('#rptLiveCompList').onItemReady ( ($item, itemData, index) => {
			loadRptLiveCompList($item, itemData, index);
		})

		$w('#rptLiveCompPrimeEditRounds').onItemReady ( ($item, itemData, index) => {
			loadRptLiveCompPrimeEditRounds($item, itemData, index);
		})
		//-------------------------- Custom Validation -----------------------------------------		
		//

		const validateNoPlayers = () => (value, reject) => {
			let wValue = parseInt(value, 10);
			if (wValue < 2 || wValue > 128 ) {
				reject("Must be in the range [2,128]");
			}
		}

		const validateTitle = () => (value, reject) => {
			let wValue = String(value).trim();
			if (wValue === "" || wValue.length < 3) {
				reject("Enter a meaningful title");
			}
		}

		const validateRefCompCompRef = () => (value, reject) => {

			let wValue = String(value).toUpperCase();
			let wItem  = getEntity("RefComp").find( wItem => wItem.compRef === wValue);
			if (wItem){ 
				if (getMode() === MODE.CREATE) {
					reject("RefComp CompRef already used");
				}
			} else if (wValue === "" || wValue.length < 2) {
				reject("Must be at least 2 characters in length")
			}
		}

		$w('#inpRefCompEditTitle').onCustomValidation (validateTitle());
		$w('#inpRefCompEditCompRef').onCustomValidation (validateRefCompCompRef());

	}
	catch (err) {
		console.log("/page/MaintainCompetitions onReady Try-catch, err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror") };
	}
});

// ------------------------------------------------ Load Repeaters-------------------------------------------------------
//
export function loadRptRefCompList($item, itemData, index) {
	if (index === 0) {
		$item ('#txtRefCompListTitle').hide();
		$item('#chkRefCompListManaged').hide();
		$item('#chkRefCompListBookable').hide();
		$item('#chkRefCompListInTable').hide();
		$item('#chkRefCompListSelect').hide();
		
		$item('#lblRefCompListTitle').show();
		$item('#lblRefCompListManaged').show();
		$item('#lblRefCompListBookable').show();
		$item('#lblRefCompListInTable').show();
		$item('#lblRefCompListSelect').show();
	} else {
		$item ('#txtRefCompListTitle').show();
		$item('#chkRefCompListManaged').show();
		$item('#chkRefCompListBookable').show();
		$item('#chkRefCompListInTable').show();
		$item('#chkRefCompListSelect').show();
		
		$item('#lblRefCompListTitle').hide();
		$item('#lblRefCompListManaged').hide();
		$item('#lblRefCompListBookable').hide();
		$item('#lblRefCompListInTable').hide();
		$item('#lblRefCompListSelect').hide();
		
		$item('#txtRefCompListTitle').text = itemData.title;
		(itemData.maintainedBy === MAINTAINED.AUTO) ? $item('#chkRefCompListManaged').checked = true : $item('#chkRefCompListManaged').checked = false;
		(itemData.bookable === "Y") ? $item('#chkRefCompListBookable').checked = true : $item('#chkRefCompListBookable').checked = false;
		(itemData.inTableDisplay === "Y") ? $item('#chkRefCompListInTable').checked = true : $item('#chkRefCompListInTable').checked = false;
		$item('#chkRefCompListSelect').checked = itemData.selected;
	}
}

export function loadRptRefCompListPrime($item, itemData, index) {
	if (index === 0) {
		$item ('#txtRefCompListPrimeTitle').hide();
		$item('#chkRefCompListPrimeLadies').hide();
		$item('#chkRefCompListPrimeMen').hide();
		$item('#chkRefCompListPrimeMixed').hide();
		
		$item('#lblRefCompListPrimeTitle').show();
		$item('#lblRefCompListPrimeLadies').show();
		$item('#lblRefCompListPrimeMen').show();
		$item('#lblRefCompListPrimeMixed').show();
	} else {
		$item ('#txtRefCompListPrimeTitle').show();
		$item('#chkRefCompListPrimeLadies').show();
		$item('#chkRefCompListPrimeMen').show();
		$item('#chkRefCompListPrimeMixed').show();
		
		$item('#lblRefCompListPrimeTitle').hide();
		$item('#lblRefCompListPrimeLadies').hide();
		$item('#lblRefCompListPrimeMen').hide();
		$item('#lblRefCompListPrimeMixed').hide();
		
		$item('#txtRefCompListPrimeTitle').text = itemData.title;
		$item('#chkRefCompListPrimeLadies').checked = itemData.ladies;
		$item('#chkRefCompListPrimeMen').checked = itemData.men;
		$item('#chkRefCompListPrimeMixed').checked = itemData.mixed;
	}
}
function loadRptLiveCompList($item, itemData, index) {

	if (index === 0) {
		$item('#chkLiveCompListSelect').hide();
		$item('#lblLiveCompListSelect').show();
	} else {
		$item('#lblLiveCompListSelect').hide();
		$item('#chkLiveCompListSelect').show();
		$item('#chkLiveCompListSelect').checked = false;
		$item('#lblLiveCompListTitle').text = itemData.title;
		$item('#lblLiveCompListMix').text = itemData.mix;
		$item('#lblLiveCompListCompRef').text = itemData.compRef;
		$item('#lblLiveCompListStatus').text = itemData.status;
		$item('#lblLiveCompListManaged').text = itemData.maintainedBy;
		$item('#chkLiveCompListSelect').checked = itemData.selected;
	}
}


function loadRptLiveCompPrimeEditRounds($item, itemData, index) {
	$item('#lblLiveCompPrimeEditRound').text = itemData.round;
	$item('#inpLiveCompPrimeEditRoundDate').value = itemData.roundDate;
}

// ------------------------------------------------ Load Data --------------------------------------------------------
//
export async function loadListData () {
	try {
		//let wFirstRow = { "_id": "hdr", "title": "Header", "maintainedBy": MAINTAINED.AUTO};
		let wResult =  await getAllClubComp(gYear);
		if (wResult.status) {
			let wSet = [...wResult.competitions];
			if (wSet){
				setEntity("LiveComp", wSet.filter( item => item.status !== COMPETITION.REFERENCE));
			} else {
				setEntity("LiveComp", []);
			}
		} else {
			setEntity("LiveComp", []);
		}

		let wResult2 =  await getRefCompSet();
		//gRefComp = [...wResult2.RefComps];
		setEntity("RefComp", [...wResult2.competitions]);
		/**
		 * If any LiveComp records exist, then set up the page to open in LiveComp mode.
		 * Otherwise, open up in RefComp Mode to allow user to set up the new season
		 */
		let wLiveComps = getEntity("LiveComp");
		if (wLiveComps && wLiveComps.length > 0) {
			//gItemsToDisplay = [...gCompetitions];
			$w('#strRefComp').collapse();
			$w('#strLiveComp').expand();
			$w('#boxLiveCompList').expand();
			$w('#boxLiveCompNone').collapse();
			$w('#boxLiveCompEdit').collapse();
			$w('#boxLiveCompPrimeEdit').collapse();
			await doLiveCompView();
			resetPagination("LiveComp");
		} else {
			//gItemsToDisplay = [...gReferences];
			$w('#strRefComp').expand();
			$w('#strLiveComp').collapse();
			$w('#boxRefCompEdit').collapse();
			$w('#boxRefCompCommands').expand();
			$w('#boxRefCompList').expand();
			await doRefCompView();
			resetPagination("RefComp");
		}
	}
	catch (err) {
		console.log("/page/MaintainCompetitions loadTableData Try-catch, err");
		console.log(err);
	}
}


//=====================================================================Entity Events==================================================

// ====================================================================RefComp Events ================================================
//

export async function doRefCompViewChange (event) {
	await doRefCompView();
}

export function doBtnRefCompAToLiveCompClick (event) {
	$w('#strRefComp').collapse();
    $w('#strLiveComp').expand();
	$w('#txtLiveCompLeftHdr').scrollTo();
	resetPagination("LiveComp");
	resetSection("LiveComp");
}

export async function btnRefCompASave_click(event) {
	try {
		
	let wClubComp = {
		"_id": "", 
		"title": $w('#inpRefCompEditTitle').value,
		"compRef": $w('#inpRefCompEditCompRef').value,
		"maintainedBy": $w('#rgpRefCompEditMaintainedBy').value,
		"inTableDisplay": $w('#rgpRefCompEditInTableDisplay').value,
		"bookable": $w('#rgpRefCompEditBookable').value,
		"shape": $w('#rgpRefCompEditShape').value,
		"mix": null,
		"gameType": parseInt($w('#rgpRefCompEditGameType').value,10),
		"competitorType": $w('#rgpRefCompEditCompetitorType').value,
		"compYear": null,
		"status": "R",
		"order": 0,
		"noStages": 0,
		"winnerNames": [],
		"secondNames": []
	}
	
	$w('#imgRefCompWait').show();
	if (!$w('#inpRefCompEditTitle').valid) {
		$w('#inpRefCompEditTitle').updateValidityIndication();
		$w('#inpRefCompEditTitle').focus();
		showError("RefComp",9);
		return;
	}
	if (!$w('#inpRefCompEditCompRef').valid) {
		$w('#inpRefCompEditCompRef').updateValidityIndication();
		$w('#inpRefCompEditCompRef').focus();
		showError("RefComp",10);
		return;
	}
	
	switch (getMode()) { 
		case MODE.CREATE:
			wClubComp._id = undefined;
			wClubComp.status = COMPETITION.REFERENCE;
			break;
		case MODE.PRIME:
		case MODE.UPDATE:
			//wClubComp._id = gSelectStack[0];
			wClubComp._id = getSelectStackId();
			wClubComp.status = COMPETITION.REFERENCE;
			break;
		default:
			console.log ("/page/MaintainCompetitions RefComp Save mode = ", getMode());
	}

	let result = await saveClubComp(wClubComp);
	//HERE
	if (result.status) {
		let updatedRecord = result.item;
		//getSelectStackId;
		updateGlobalDataStore(updatedRecord, "RefComp");
		//resetPagination("RefComp");
		updatePagination("RefComp");
		showError("Ref",7);
		resetCommands("RefComp");
	}
	$w('#imgRefCompWait').hide();
	resetSection("RefComp");
	//gMode = MODE.CLEAR;
	setMode( MODE.CLEAR);

	} catch (error) {
		console.log("/page/MaintainCompetitions btnRefCompASave try-catch error");
		console.log(error);		
	}
}

export function strRefComp_viewportEnter(event) {
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
export function chkPrimeSelect_click(event) {
	let wControl = $w.at(event.context);
	let wMix = event.target.value;
	let wMixName = parseMix(wMix);
	let wId = event.context.itemId;
    let wTarget = getTarget(event, "Prime");
	let wItem = getTargetItem(wTarget, wId);
	let wControlText = `#chk${wTarget}Prime${wMixName}`;
	if (wControl(wControlText).checked) {
        pushToPrimeSelectStack(wItem, wMix,wTarget);
    } else { 
        pullFromPrimeSelectStack(wItem, wMix, wTarget);
    }
	$w(`#lbl${wTarget}ListCounter`).text = String(gPrimeSelectStack.length);

	//console.log("end select, gref, prime stack");
	//console.log(gReferences);
	//console.log(gPrimeSelectStack);
    configureScreen(wTarget);
}
function parseMix(pMix){
	if (pMix === "L") { return "Ladies"};
	if (pMix === "M") { return "Men"};
	if (pMix === "X") { return "Mixed"};
	return "";
}

export async function doBtnRefCompPrimeCreateClick(event) {
    showWait("RefComp")
	let wThisYearSet = [];
	let wAllComps = [...getEntity("LiveComp")];
	if (wAllComps) { 
		let wAlreadySet = wAllComps.filter ( item => item.status !== COMPETITION.REFERENCE);
		wThisYearSet = gPrimeSelectStack.filter ( item => {
			let isNotInSet = true;
			for (let wRec of wAlreadySet){
				if (item.compRef === wRec.compRef) {
					isNotInSet = false;
					break;
				}  
			}
			return isNotInSet;
		})
	} else {
		wThisYearSet = [...gPrimeSelectStack];
	}
	if (wThisYearSet.length > 0 ){
		let wResults = await bulkSaveClubComp(wThisYearSet);
		// Now insert Ids into new records, and store in gCompetitions
		if (wResults.results.inserted === wThisYearSet.length) {
			let wInsertedIds = wResults.results.insertedItemIds;
			wThisYearSet.forEach( (item, index) => {
				item._id = wInsertedIds[index];
			})
		}
		let wTemp = getEntity("LiveComp").concat(wThisYearSet);
		wTemp = _.sortBy(wTemp, ['mix', 'order', 'title']);
		setEntity("LiveComp", wTemp);
		//resetPagination("LiveComp");
		showError("Ref",7);
		//resetCommands("RefComp");
	}
	$w('#imgRefCompWait').hide();
	resetSection("RefComp");
	setMode(MODE.CLEAR);

}
// ================================================= RefComp Supporting Functions =================================================
//
export async function doRefCompView () {
	let wView = $w('#rgpRefCompView').value;
	if (wView === "P") {
		$w('#chkRefCompListSelectAll').collapse();
		$w('#btnRefCompListTop').collapse();
		$w('#rptRefCompList').collapse();
		$w('#rptRefCompListPrime').expand();
		$w('#boxRefCompPrime').expand();
	} else {
		$w('#chkRefCompListSelectAll').expand();
		$w('#btnRefCompListTop').expand();
		$w('#rptRefCompList').expand();
		$w('#rptRefCompListPrime').collapse();
		$w('#boxRefCompPrime').collapse();
	}
	return true;
}

/**
 * Summary: Updates the specified record and removes it from the primary select stack if it exists.
 *
 * @function
 * @param {Object} pRec - The record to be updated and removed from the stack.
 * @param {string} pMix - The mix type to be updated in the record ('L' for ladies, 'M' for men, 'X' for mixed).
 * @param {string} pTarget - The target identifier.
 * 
 * @returns {void}
 *
 */
export function pullFromPrimeSelectStack(pRec, pMix, pTarget) {
	//console.log("Pull from Prime Select Stack");
    //	Updates the gReferences record
    switch (pMix) {
		case "L":
			pRec.ladies = false;
			break;
		case "M":
			pRec.men = false;
			break;
		case "X":
			pRec.mixed = false;
			break;
		default:
			pRec.mixed = false;
			break;
	}
	let wNewCompRef = pRec.compRef + pMix;
    let x = gPrimeSelectStack.findIndex( item => item.compRef === wNewCompRef);
    if (x > -1) {
        gPrimeSelectStack.splice(x,1);
    }
}

/**
 * Summary: Updates the specified record and adds it to the primary select stack if it doesn't already exist.
 *
 * @function
 * @param {Object} pRec - The record to be updated and added to the stack.
 * @param {string} pMix - The mix type to be updated in the record ('L' for ladies, 'M' for men, 'X' for mixed).
 * @param {string} pTarget - The target identifier.
 * 
 * @returns {void}
 *
 */export function pushToPrimeSelectStack(pRec, pMix, pTarget) {
   	//console.log("Push to Prime Select Stack");
	//	Updates the gReferences record
	switch (pMix) {
		case "L":
			pRec.ladies = true;
			break;
		case "M":
			pRec.men = true;
			break;
		case "X":
			pRec.mixed = true;
			break;
		default:
			pRec.mixed = true;
			break;
	}
	let wNewRecord = {...pRec};
	let wNewCompRef = pRec.compRef + pMix;
    let x = gPrimeSelectStack.findIndex( item => item.compRef === wNewCompRef);
    if (x === -1){
		wNewRecord._id = undefined;
		wNewRecord.compYear = gYear;
		wNewRecord.mix = pMix;
		wNewRecord.compRef = wNewCompRef;
		wNewRecord.status = COMPETITION.NEW;
        gPrimeSelectStack.push(wNewRecord);
    }
}
// ================================================= LiveComp =======================================================
//
	let gWinnersArray = [];
	let gSecondsArray = [];

export function strLiveComp_viewportEnter(event) {
    //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}

export function doLiveCompListChoiceChange (event ) {
	let wView = event.target.value;
	//doRefCompView(wView);
}

export async function doBtnUpdateClick(event) {
    let wTarget = getTarget(event, "A");
    btnUpdate_click(event);
    await populateLiveCompEdit(wTarget);
}

//TODO Do we need this?
export function doLiveCompChoice (pTarget) {
	if (pTarget === "P") {
		$w('#chkRefCompListSelectAll').collapse();
		$w('#btnRefCompListTop').collapse();
		$w('#rptRefCompList').collapse();
		$w('#rptRefCompListPrime').expand();
	} else {
		$w('#chkRefCompListSelectAll').expand();
		$w('#btnRefCompListTop').expand();
		$w('#rptRefCompList').expand();
		$w('#rptRefCompListPrime').collapse();
	}
}
export async function btnLiveCompASave_click(event) {
	try {
		hideWait("LiveComp");
		let wClubComp = {
			"_id": "", 
			"title": $w('#inpLiveCompEditTitle').value,
			"compRef": String($w('#inpLiveCompEditCompRef').value).toUpperCase(),
			"maintainedBy": $w('#rgpLiveCompEditMaintainedBy').value,
			"inTableDisplay": $w('#rgpLiveCompEditInTableDisplay').value,
			"bookable": $w('#rgpLiveCompEditBookable').value,
			"shape": $w('#drpLiveCompEditShape').value,
			"mix": $w('#rgpLiveCompEditMix').value,
			"gameType": parseInt($w('#rgpLiveCompEditGameType').value,10),
			"competitorType": $w('#rgpLiveCompEditCompetitorType').value,
			"noCompetitors": parseInt($w('#inpLiveCompEditNoCompetitors').value,10) || 0,
			"compYear": parseInt($w('#inpLiveCompEditYear').value,10),
			"status": $w('#drpLiveCompEditStatus').value,
			"order": parseInt($w('#inpLiveCompEditOrder').value,10),
			"noStages": parseInt($w('#inpLiveCompEditNoStages').value,10) || 1,
			"winnerNames": gWinnersArray,
			"secondNames": gSecondsArray
		}

		let wFail =false;

		let wErrMsg = "";
		if (getMode() === MODE.PRIME) {
			if ( parseInt($w('#inpLiveCompPrimeEditNoCompetitors').value,10) < 3) {
				showMsg(3,5);
				return;
			}		
		} else {
			if (!$w('#inpLiveCompEditTitle').valid) {
				wErrMsg = wErrMsg + "\n" + $w('#inpLiveCompEditTitle').validationMessage;
				wFail = true;
			}
			if (!$w('#inpLiveCompEditCompRef').valid) {
				wErrMsg = wErrMsg + "\n" + $w('#inpLiveCompEditCompRef').validationMessage;
				wFail = true;
			}
			if (wFail) { 
				wErrMsg = "Correct the following errors:" + wErrMsg;
				showError("Comp",0, wErrMsg);
				//showError("Comp",3);
				if (!$w('#inpLiveCompEditTitle').valid){
					$w('#inpLiveCompEditTitle').focus();
				} else {
					$w('#inpLiveCompEditCompRef').focus();
				}
				return;		//On fail, dont go any further
			}
		} //gmode
		await saveLiveComp(wClubComp);
	} //Try
	catch (error) {
		console.log("/page/MaintainCompetitions btnLiveCompASave try-catch error");
		console.log(error);		
	} //catch
}

async function saveLiveComp(pClubComp){
	
	showWait("LiveComp");
	switch (getMode()) { 
		case MODE.CREATE:
			pClubComp._id = undefined;
			break;
		case MODE.UPDATE:
			pClubComp._id = getSelectStackId();
			pClubComp.status = $w('#drpLiveCompEditStatus').value;
			pClubComp.maintainedBy = $w('#rgpLiveCompEditMaintainedBy').value;
			pClubComp.noCompetitors = parseInt($w('#inpLiveCompEditNoCompetitors').value,10) || 0;
			// need to update lstSettings if changed
			break;
		case MODE.PRIME:
			pClubComp._id = getSelectStackId();
			pClubComp.compRef = $w('#inpLiveCompPrimeEditCompRef').value;
			pClubComp.title = $w('#inpLiveCompPrimeEditTitle').value;
			pClubComp.noCompetitors = parseInt($w('#inpLiveCompPrimeEditNoCompetitors').value,10) || 0;
			// need to update lstSettings if changed
			let res = await updateRoundsDates($w('#rptLiveCompPrimeEditRounds').data);
			break;
		default:
			console.log ("LiveComp Save mode = ", getMode());
	}
	let result = await saveClubComp(pClubComp);
	if (result.status) {
		let updatedRecord = result.item; 
		updateGlobalDataStore(updatedRecord, "LiveComp");
		updatePagination("LiveComp");
		showError("LiveComp",7);
		resetCommands("LiveComp");
	}
	hideWait("LiveComp");
	resetSection("LiveComp");
	setMode(MODE.CLEAR);
}

export async function doBtnLiveCompAToRefCompClick (event) {
	$w('#strRefComp').expand();
    $w('#strLiveComp').collapse();
	$w('#txtRefCompLeftHdr').scrollTo();
	await doRefCompView();
	resetPagination("RefComp");
	resetSection("RefComp");

}

export function doBtnLiveCompAToGameScoreClick (event) {
	showWait("LiveComp");
	wixLocation.to("/game-scores");
}


export function doBtnLiveCompAToCompetitorsClick (event) {
	showWait("LiveComp");
	wixLocation.to("/maintain-competitors");
}

async function initialisePrime() {
    bracket.length = 0;
    byes.length = 0;
    matchNumbers.length = 0;
    fullMatchList.length = 0;
    bracket.push([]);    //wstage 1     bracket.push --> add new stage
    byes.push([]);
    matchNumbers.push([]);
    fullMatchList.push([]);
//	ko SET UP
	bracket[0].push([]);    //wstage 1     bracket[0].push --> add new div
	byes[0].push([]);
	matchNumbers[0].push([]);
	fullMatchList[0].push([]);
}

async function updateRoundsDates(pData) {
	let wValid = true;
	let wDates = [];
	$w('#rptLiveCompPrimeEditRounds').forEachItem( ($item, itemData, index) => {
		if ($item('#inpLiveCompPrimeEditRoundDate').valid) {
			wDates.push($item('#inpLiveCompPrimeEditRoundDate').value);		
		} else {
				wValid = false;
		}
	})
	if (wValid){
		let wId = $w('#lblLiveCompEditDateRangeId').text;
		let res = await updateSettingsRoundDateArray(wId, wDates);
	} else {
		showMsg(4,6);
	}

}

function refreshRptLiveComp(pClubComp){
	let wData = $w('#rptLiveCompList').data;
	let wFirstLine = wData.shift();

	let foundIndex = wData.findIndex(x => x._id == pClubComp._id);
	if (foundIndex > -1) {
		wData[foundIndex] = pClubComp;	 
		let wSortedComps = _.sortBy(wData, ['mix', 'order', 'title']);
		wSortedComps.unshift(wFirstLine);
		$w('#rptLiveCompList').data = wSortedComps;
	} else {
		console.log("Couldnt find item in rpeater data", pClubComp._id);
	}
}

export async function btnLiveCompCancel_click(event) {
	await resetSection("LiveComp");
	setMode(MODE.CLEAR);
}

export function btnLiveCompEditWinnersClear_click(event) {
	$w('#txtLiveCompEditWinners').text = "";
	gWinnersArray.length = 0;
}

export function btnLiveCompEditSecondsClear_click(event) {
	$w('#txtLiveCompEditSeconds').text = "";
	gSecondsArray.length = 0;
}

export async function btnLiveCompEditWinnersAdd_click(event) {
	let wGender = $w('#rgpLiveCompEditMix').value;
	let wNo = parseInt($w('#rgpLiveCompEditGameType').value,10);
	let [wNamesArray, wNames] = await getNames(wGender, wNo);
	if (wNames !== "cancel") {
		gWinnersArray = wNamesArray;
		$w('#txtLiveCompEditWinners').text = String(wNames);
	}
}

export async function btnLiveCompEditSecondsAdd_click(event) {
	let wGender = $w('#rgpLiveCompEditMix').value;
	let wNo = parseInt($w('#rgpLiveCompEditGameType').value,10);
	let [wNamesArray, wNames] = await getNames(wGender, wNo);
	if (wNames !== "cancel") {
		gSecondsArray = wNamesArray;
		$w('#txtLiveCompEditSeconds').text = String(wNames);
	}
}

export async function doBtnLiveCompProcessManualClick(event) {
	setMode(MODE.PRIME);
	let wUpdateSet = [];
	let wSelectStack = getSelectStack()
	for (let wItemId of wSelectStack) {
		let wSelectedItem = getTargetItem("LiveComp", wItemId);
		if (wSelectedItem.maintainedBy === "A") {
			console.log("/page/MainatainCompetitions dobtnLiveCompProcessMaual: cannot process Automatic, wId ", wItemId);
			showError("LiveComp", 25)
		} else if (wSelectedItem.status === "N") {
			wSelectedItem.status = "O";
			wUpdateSet.push(wSelectedItem)
		} else {
			console.log("/page/MainatainCompetitions dobtnLiveCompProcessMaual: LiveComp already open, wId ", wItemId);
			showError("LiveComp", 6)
		}
	}
	//console.log(wUpdateSet);
	if (wUpdateSet) {
		let wResults = await bulkSaveClubComp(wUpdateSet);
		//console.log("REsults, results");
		//console.log(wResults);
		updatePagination("LiveComp");
	}
	// globalDataStore is updated in loop above
	showError("Comp",7);
	resetCommands("LiveComp");
	
	hideWait("LiveComp");
	resetSection("LiveComp");
	setMode(MODE.CLEAR);

	return;
}

export async function doBtnLiveCompProcessAutomaticClick(event) {
	setMode(MODE.PRIME);
	gPrimeSelectStack = [];
	let wSelectStack = getSelectStack();
	for (let wCompId of wSelectStack){
		let wComp = getTargetItem("LiveComp", wCompId);
		if (wComp){
			if (wComp.maintainedBy === "A"){
				gPrimeSelectStack.push(wCompId);
			}
		}
	}
	setMode(MODE.CLEAR);
	wixLocation.to(`/maintain-managed-LiveComps?comps=${gPrimeSelectStack}`);
}
/**
export async function btnReset_click(event) {
	$w('#imgCompetitionWait').show();
	let wLiveComp = await getCheckedItem(LiveComp_TYPE.LiveComp);
	if (wCOMPETITIONstatus === COMPETITIONIN_PROGRESS || wCOMPETITIONstatus === Competition.CLOSED){
		showError("comp", 6);
		return;
	}
	let res = await resetLiveComp(wCompetition.compYear, wCompetition.compRef);
	console.log("reset, res")
	console.log(res);
	await refreshRptLiveComp(res);
	$w('#imgCompetitionWait').hide();
}
*/

async function doPrime() {
	let wCompetitions = getCompetitionSelectedItems();
	$w('#imgLiveCompWait').show();

	let wManagedLiveComps = wCompetitions.filter( competition => competition.maintainedBy === "A");
	let wKOs = wManagedLiveComps.filter( competition => competition.shape === "KO");
	let wOthers = wManagedLiveComps.filter( competition => competition.shape !== "KO");
	
	if (wKOs.length > 0) {await performPrimeKOs(wKOs)}
	if (wOthers.length > 0 ) {await performPrimeOthers(wOthers)}
	if (wManagedLiveComps.length === 0 ) {
		showMsg(2,4);
	}
	setMode(MODE.CLEAR);
	$w('#imgLiveCompWait').hide();
}

async function performPrimeKOs(pComps){
	let wRoundDates = [];
	for (let wComp of pComps){
		//console.log("Prime KO ", wComp.title, wComp.noCompetitors);
		gCompetition = wComp;
		$w('#rptLiveCompPrimeEditRounds').forEachItem ( ($item, itemData, index) => {
			let wDate = new Date(itemData.roundDate);
			wDate.setHours(10,0,0,0);
			wRoundDates.push(wDate);
		})
		await addKO($w('#rptLiveCompPrimeEditRounds').data.length);
		gSchedule.forEach ( obj => {
			obj.requiredBy = wRoundDates[obj.round - 1];
		})
	}
}

async function addKO(pNoRounds) {
    let wThisStage = 0;
    let wDivision = "Knock Out";

    let wType = "M"; 
    let wNo = 0;
	wNo = parseInt($w('#inpLiveCompPrimeEditNoCompetitors').value,10);
	let wUpper = 2**pNoRounds;
	let wStage = 0;
	let wBracketStyle = "S";

	var participants = Array.from({length: wNo}, (v, k) => k + 1) ;
	let wX = getKOBracket(participants, wBracketStyle);
	bracket[wStage][0] = wX;
	setUpMatchList(wStage, 0, wUpper);
	
    let [wNoOfRounds, wNoOfByes, wNoMatches] = await calcParameters("S", 2,wNo);

    gSchedule  = AddKOToTable(wThisStage, 0, "KO", wDivision, wNo, wNoOfRounds, wNoOfByes);
    /**
     * KNOCK OUT IS ALWAYS LAST STAGE IN COMP
     */
}

function performPrimeOthers(pComps){
	//console.log("Prime Other ", pComps[0].title);
	let wS = JSON.stringify(pComps);
	//console.log(wS);
	let wURL = `/manage-club-comp?comps=${wS}`;
	wixLocation.to(wURL);
}
	/**
	 * if (!($w('#inpLiveCompCompRef').valid && $w('#inpLiveCompTitle').valid)) {
        //showSaveMessage(3);
        return;
    }
	let wNoTeams = 1;
	let wIsHomeAway = "H";
	let wCode = $w('#inpLiveCompCompRef').value;
	let wId = $w('#txtLiveCompId').text;
	let wMix = $w('#rgpLiveCompMix').value;
	let wVal = "N";
	let wType = $w('#rgpLiveCompGameType').value;
	let wTitle = $w('#inpLiveCompTitle').value.trim();
	let wOrder = 0;
	let wMaint = "A"; //TODO do we need to prime M types?
	//let wURL = `/add-club-comp?ext=${wVal}&id=${wId}&noTeams=${wNoTeams}&isHA=${wIsHomeAway}&code=${wCode}&mix=${wMix}&type=${wType}&order=${wOrder}&maint=${wMaint}&title="${wTitle}"`;
	*/



export async function btnLiveCompToRefComp_click(event) {
	let wFirstRow = { "_id": "hdr", "title": "Header", "maintainedBy": "A"};
	$w('#boxRefCompEdit').collapse();
	$w('#boxRefCompCommands').expand();
	resetPagination("RefComp");
	//gReferences = await getRefCompSet();
	//updateRefCompsWithLiveComps();
	//gReferences.unshift(wFirstRow);
	//$w('#rptRefCompList').data = gReferences;
	$w('#strRefComp').expand();
	$w('#strLiveComp').collapse();
}
// ------------------------------------------------ LiveComp Supporting functions ---------------------------------------------------------
//

export async function doLiveCompView () {
	//	There are no different Views on LiveComp data
	return true;
}
/**
 *	If necessary to add an ClubComp FilterChoice for alterrnative views
 *
export async function drpEventFilterChoiceChange(event) {
    showWait("Event");
    updatePagination("Event");
    hideWait("Event");
}

export async function doRefCompView () {
	let wView = $w('#rgpRefCompView').value;
	if (wView === "P") {
		$w('#chkRefCompListSelectAll').collapse();
		$w('#btnRefCompListTop').collapse();
		$w('#rptRefCompList').collapse();
		$w('#rptRefCompPrime').expand();
	} else {
		$w('#chkRefCompListSelectAll').expand();
		$w('#btnRefCompListTop').expand();
		$w('#rptRefCompList').expand();
		$w('#rptRefCompPrime').collapse();
	}
	return true;
}
 */
function updateRefCompsWithLiveComps() {
	// for each entry in RefComps file, update ladies, mensand mixed fields depending if ComPref found in LiveComps
	for (let wRef of gReferences){
		let wBase = wRef.compRef;
		wRef.ladies = isInLiveComps(wBase + "L");
		wRef.mens = isInLiveComps(wBase + "M");
		wRef.mixed = isInLiveComps(wBase + "X");
	}
}

function isInLiveComps(pCompRef){
	return gCompetition.some( item => item.compRef === pCompRef);
}

function countLiveCompSelectedItems() {
	let count = 0;
	let wIds = [];
	$w('#rptLiveCompList').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkLiveCompListSelect').checked) { count++ }
	})
	return [wIds, count];
}

function getLiveCompSelectedItems() {
	let wItems = [];
	$w('#rptLiveCompList').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkLiveCompListSelect').checked) { wItems.push(itemData) }
	})
	return wItems;
}

export async function resetLiveCompCommands() {
	$w('#inpLiveCompEditTitle').value = null;
	$w('#inpLiveCompEditCompRef').value = null;
	//$w('#chkLiveCompEditSelect').checked = false;
	$w('#rgpLiveCompEditMaintainedBy').value = MAINTAINED.AUTO;
	$w('#rgpLiveCompEditGameType').value = "1";
	$w('#drpLiveCompEditShape').value = "KO";

	$w('#boxLiveCompEdit').collapse();
	$w('#boxLiveCompPrimeEdit').collapse();
	$w('#boxLiveCompList').expand();
	$w('#boxLiveCompCreate').collapse();
	$w('#boxLiveCompPrime').collapse();

	//MSB input fields
	/**
	$w('#fieldS1').value = null;
	$w('#fieldS2').value = MIX.LADIES;
	$w('#fieldS2A').value = "KO";
	$w('#fieldS3').value = null;
	$w('#fieldS4').value = "M";
	$w('#fieldS4A').value = "Y";
	$w('#fieldS4B').value = "Y";
	$w('#fieldS5').value = "S";
	$w('#fieldS6').value = "P";
	*/
	$w('#btnLiveCompACreate').show();
	$w('#btnLiveCompAToRefComp').show();
	$w('#btnLiveCompAUpdate').hide();
	$w('#btnLiveCompADelete').hide();
	$w('#btnLiveCompASave').hide();
	$w('#btnLiveCompACancel').hide();
	let wSummary = [];
	switch (getMode()) {
		case MODE.CREATE:
		case MODE.DELETE:
		case MODE.UPDATE:
			wSummary = await initialiseData(gYear);
			$w('#tblRefCompDashboardSummary').rows = wSummary;;
			break;
		default:
			break;
	}
	//$w('#msbNewLiveComp').changeState(MSB_STATE.S1)
	//	.then ( () => {
	//		$w('#fieldS1').focus();
	//	})
}

function populateLiveCompEdit() {

	let pRec = getSelectedItem("LiveComp");

	// if (pType === COMPETITION) {
		$w('#inpLiveCompEditTitle').value = pRec.title;
		$w('#inpLiveCompEditCompRef').value = pRec.compRef; 
		$w('#rgpLiveCompEditMaintainedBy').value = pRec.maintainedBy; 
		$w('#rgpLiveCompEditInTableDisplay').value = pRec.inTableDisplay; 
		$w('#rgpLiveCompEditBookable').value = pRec.bookable; 
		$w('#drpLiveCompEditShape').value = pRec.shape; 
		$w('#rgpLiveCompEditMix').value = pRec.mix;
		$w('#rgpLiveCompEditGameType').value = pRec.gameType;
		$w('#rgpLiveCompEditCompetitorType').value = getCompetitorType(pRec.competitorType);
		$w('#inpLiveCompEditNoCompetitors').value = pRec.noCompetitors;
		$w('#inpLiveCompEditYear').value = pRec.compYear;
		$w('#drpLiveCompEditStatus').value = pRec.status;
		$w('#inpLiveCompEditOrder').value = pRec.order;
		$w('#inpLiveCompEditNoStages').value = pRec.noStages;
		$w('#txtLiveCompEditWinners').text = (pRec.winnerNames) ? pRec.winnerNames.toString() : "";
		$w('#txtLiveCompEditSeconds').text = (pRec.secondNames) ? pRec.secondNames.toString() : "";
		gWinnersArray = (pRec.winnerNames) ? pRec.winnerNames : [];
		gSecondsArray = (pRec.secondNames) ? pRec.secondNames : [];
		if (getMode() === MODE.CREATE) {
            $w('#inpLiveCompEditCompRef').enable();
        } else {
            $w('#inpLiveCompEditCompRef').disable();
        }
	/**
	} else { 
		$w('#inpRefCompEditTitle').value = pRec.title;
		$w('#inpRefCompEditCompRef').value = pRec.compRef; 
		$w('#rgpRefCompEditMaintainedBy').value = pRec.maintainedBy; 
		$w('#rgpRefCompEditInTableDisplay').value = pRec.inTableDisplay; 
		$w('#rgpRefCompEditBookable').value = pRec.bookable; 
		$w('#rgpRefCompEditShape').value = pRec.shape; 
		$w('#rgpRefCompEditGameType').value = pRec.gameType;
	} 
	*/
}

async function populateLiveCompPrimeEdit(pRec) {
	$w('#inpLiveCompPrimeEditTitle').value = pRec.title;
	$w('#inpLiveCompPrimeEditCompRef').value = pRec.compRef; 
	$w('#inpLiveCompPrimeEditNoCompetitors').value = pRec.noCompetitors;
	await doInpLiveCompNoCompetitorsChange($w('#inpLiveCompEditNoCompetitors').value);
}

function getCompetitorType(pType){
	if (pType === COMPETITOR_TYPE.TEAM) { return pType};
	if (pType === COMPETITOR_TYPE.INDIVIDUAL) { return pType};
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

async function getNames(pGender, pNo){
   	let wParams = {
		"seeds": "N",
	   	"mix": pGender,
	   	"type": 1,				
	   	"noTeams": pNo
   	}

	let wNames = "";
	let wNameArray = [];
   // {member} is {_id, memberId, firstName, surname, player, temNames, comPref, emailAddress, mobilePhone, homePhone}
	let wMembers = await wixWindow.openLightbox("lbxSelectManyMembers", wParams);
	if (wMembers) {
		if (wMembers.length > 0) {
			for (let wTemp of wMembers) { 
				wNameArray.push(wTemp.player);
			}
			switch (String(pNo)){ 
				case "1":
					wNames = wMembers[0].player;
					break;
				case "2":
					wNames = wMembers[0].player + ", " + wMembers[1].player;
					break;
				case "3":
					wNames = wMembers[0].player + ", " + wMembers[1].player + "\n" + wMembers[2].player;
					break;
				case "4":
					wNames = wMembers[0].player + ", " + wMembers[1].player + "\n" + wMembers[2].player + ", " + wMembers[3].player;
					break;
				default:
					console.log("default = ", pNo);
					break;
			}
		} else {
			return [[],"cancel"]
		} 
	}
	return [wNameArray, wNames];
}

function refreshRptLiveCompEntry(pComp){
	$w('#rptLiveCompList').forItems([pComp._id],($item) => {
		//console.log("Refresh");
		//console.log(pComp._id);
		$item('#lblLiveCompListSelect').hide();
		$item('#chkLiveCompListSelect').show();
		$item('#chkLiveCompListSelect').checked = false;
		$item('#lblLiveCompListTitle').text = pComp.title;
		$item('#lblLiveCompListMix').text = pComp.mix;
		$item('#lblLiveCompListCompRef').text = pComp.compRef;
		$item('#lblLiveCompListStatus').text = pComp.status;
		$item('#lblLiveCompListManaged').text = pComp.maintainedBy;
		$item('#chkLiveCompListSelect').checked = false;
	})
}

export function inpLiveCompCompRef_change(event) {
	let wCompRef = event.target.value;
	$w('#inpLiveCompEditCompRef').value = String(wCompRef).toUpperCase();
}

export async function SNext_click(event) {
	await changeState(MSB_STATE.NEXT);
}

export async function SPrevious_click(event) {
	await changeState(MSB_STATE.PREVIOUS);
}

async function changeState(pType){
	let wCurrentState = await $w('#msbLiveCompCreate').currentState.id;
	let wN = parseInt(String(wCurrentState).charAt(1),10);
	let wNoOfStates = $w('#msbLiveCompCreate').states.length;
	let wThisState = "S" + String(wN);
	let wNextState = "S";
	if (wN === wNoOfStates){ 		// caters for back button on last state page
		wNextState = wNextState + String(wN - 1);
		$w('#msbLiveCompCreate').changeState(wNextState);
		return;
	}
	if (pType === MSB_STATE.NEXT){
		wNextState = wNextState + String(wN + 1);
	} else {
		wNextState = wNextState + String(wN - 1);
	}
	let wX1 = `#field${wThisState}`;
	let wX3 = `#field${wNextState}`;
	let wField1 = $w(wX1);
	let wFieldNext = $w(wX3);
	let wX2 = `#lblErrMsg${wThisState}`;
	let wField2 = $w(wX2);
	if (wField1.valid){
		$w('#msbLiveCompCreate').changeState(wNextState)
		.then ( () => {
			if (wN < wNoOfStates - 1){ 
				wFieldNext.focus();
			}
		})
	} else {
		wField2.text = wField1.validationMessage;
		wField2.show();
		setTimeout(() => {
			wField2.hide();
		}, 3000);
	}
	return;
}

export function msbNewLiveComp_change(event) {
	/**
	 * put in just to remove compile time errors.
	$w('#lblS7Title').text = $w('#fieldS1').value;
	$w('#lblS7Mix').text = resolveMix($w('#fieldS2').value);
	$w('#lblS7Shape').text = resolveShape($w('#fieldS2A').value);
	$w('#lblS7CompRef').text = $w('#fieldS3').value;
	$w('#lblS7Automatic').text = resolveAutomatic($w('#fieldS4').value);
	$w('#lblS7Display').text = $w('#fieldS4A').value;
	$w('#lblS7Bookable').text = $w('#fieldS4B').value;
	$w('#lblS7GameType').text = resolveGameType($w('#fieldS5').value);
	$w('#lblS7CompetitorType').text = resolveCompetitorType($w('#fieldS6').value);
	*/
}

function resolveMix(pMix){
	let wMix = "";
	switch (pMix) {
		case MIX.LADIES:
			wMix = "L";
			break;
		case MIX.MENS:
			wMix = "M";
			break;
		case MIX.MIXED:
			wMix = "X";
			break;
		default:
			wMix = "L";
			break;
	}
	return wMix;
}

function resolveShape(pShape){
	let wShape = "";
	switch (pShape) {
		case "KO":
			wShape = "Knock Out";
			break;
		case "M":
			wShape = "Other";
			break;
		default:
			wShape = "Knock Out";
			break;
	}
	return wShape;
}

function resolveGameType(pType){
	let wType = "";
	switch (pType) {
		case "1":
			wType = "Singles";
			break;
		case "2":
			wType = "Doubles";
			break;
		case "3":
			wType = "Triples";
			break;
		case "4":
			wType = "Fours";
			break;
		default:
			wType = "Singles";
			break;
	}
	return wType;
}

function resolveCompetitorType(pType){
	let wType = "";
	switch (pType) {
		case COMPETITOR_TYPE.INDIVIDUAL:
			wType = "Individual"
			break;
		case COMPETITOR_TYPE.TEAM:
			wType = "Team"
			break;
		default:
			wType = "Individual";
			break;
	}
	return wType;
}

function resolveAutomatic(pType){
	let wType = "";
	switch (pType) {
		case MAINTAINED.AUTO:
			wType = "Automatic"
			break;
		case MAINTAINED.MANUAL:
			wType = "Manual"
			break;
		default:
			wType = "Manual";
			break;
	}
	return wType;
}

export async function SCancel_click(event) {
	await resetSection("LiveComp");
	setMode(MODE.CLEAR);
}
/**
 * as before
 *
export function fieldS3_change(event) {
	let wCompRefIn = event.target.value;
	$w('#fieldS3').value = wCompRefIn.toUpperCase();
}
export function fieldS1_change(event) {
	let wCompRef = $w('#fieldS3').value;
	if (wCompRef.length > 0) { return };	//comp ref already set
	let wTitle = $w('#fieldS1').value;
	let wWords = wTitle.split(" ");
	let idx = 0;
	let wLimit = 4;
	do {
		wCompRef = wCompRef + wWords[idx][0];
		idx++;
	} while (idx < wLimit && idx < wWords.length);
	wCompRef= wCompRef + $w('#fieldS2').value;
	$w('#fieldS3').value = wCompRef.toUpperCase();
}

export function fieldS2_change(event) {
	let wMix = event.target.value.toUpperCase();
	let wCompRef = $w('#fieldS3').value;
	let wTmp = wCompRef.slice(0,-1);
	wCompRef = wTmp + wMix;
	$w('#fieldS3').value = wCompRef;

}
*/

function showMsg(pErr, pSec, pControl = "txtLiveCompErrMsg") {
	let wSecs = pSec * 1000;
	let wMsg = ["Only default Knock Outs can be primed in bulk",				// 1
				"No managed LiveComps selected",
				"Number of Competitors must be greater than 1", 
				"All dates need to be valid to update stored range",
				"Bookings start from 1st June",									// 5
				"Must be a booking to edit",
				"Must be a player, the booker or a manager to edit booking",
				"Booking must be within next 14 days",
				"Cannot move or edit a completed game",
				"Must be a manager to edit a LiveComp booking",				// 10
				"Must be a manager to edit this booking",
				"No games to display",
				"Bookings updated",
				"You need to select a Player A",
				"This rink slot has been taken since you selected it",			// 15
				"The database record was not saved",
				"Cannot delete a Ladder game. Use Move instead",
				"Must be a manager to edit a LiveComp booking",
				"Must be a manager to edit this booking",
				"You need to select a Use",										// 20
				"Booking All Day failed",
				"Booking All Day completed ok",
				"Bookings completed",
				"Field must be valid",
				"Usage needs to be specified",											//25
				"There are bookings on the selected date.",
				"There are no bookings for the selected date.",
				"Cannot clear a date in the past",
				"All bookings cleared",
				"All records updated ok",
				"Last Message"
	];

	$w(`#${pControl}`).text = wMsg[pErr-1];
	$w(`#${pControl}`).show();
	setTimeout(() => {
		$w(`#${pControl}`).hide();
	}, wSecs);
}


/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/RefComp/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export async function inpLiveCompPrimeNoCompetitors_change(event) {

	let wNo = event.target.value;
	await doInpLiveCompNoCompetitorsChange(wNo);
}

export async function doInpLiveCompNoCompetitorsChange(pNo){
	let wKOType = "S";		// these are pre-set
	let wFinalsType = "2";
    let [wNoRounds, wNoByes, wNoMatches] = await calcParameters(wKOType, wFinalsType,pNo);
	let [wId, wData] = await getSettingsRoundDateArray(wNoRounds);
	$w('#lblLiveCompEditDateRangeId').text = wId;
	$w('#rptLiveCompPrimeEditRounds').data = wData;
}

/**
*	Adds an event handler that runs when the element receives focus.
	[Read more](https://www.wix.com/corvid/RefComp/$w.FocusMixin.html#onFocus)
*	 @param {$w.Event} event
*/
let gCompSelectedItem;

export function inpLiveCompRoundDate_focus(event) {
	gCompSelectedItem = $w.at(event.context);
	let wDate = new Date();
	$w('#boxLiveCompPrimeEditMatch').style.backgroundColor = NORMAL_COLOR;
	gCompSelectedItem('#boxLiveCompPrimeEditMatch').style.backgroundColor = SELECTED_COLOR;
	if (gCompSelectedItem('#inpLiveCompPrimeEditRoundDate').value.length > 0){
		let wDateString = gCompSelectedItem('#inpLiveCompPrimeEditRoundDate').value;
		wDate = new Date(wDateString);
	}
	$w('#dpkLiveCompPrimeEditPlayByDate').value = wDate;
	$w('#dpkLiveCompPrimeEditPlayByDate').show();
	$w('#dpkLiveCompPrimeEditPlayByDate').focus();
}

export function dpkrPlayByDate_change(event) {
	let wDate = formatDateString(event.target.value, "Long");
	if (gCompSelectedItem) {
		gCompSelectedItem('#inpLiveCompRoundDate').value = wDate;
		$w('#dpkLiveCompPrimeEditPlayByDate').hide();
	}
}
//	==============================================================PRIMING FUNCTIONS ===================================================================
//

function processScheduleTable(pNoRounds) {
    
    let wMatchNo = 0;
	let wNoMatchesInFirstRound = 2** (pNoRounds - 1);
    let wPreviousRound = -1;
	let wNoLines = gSchedule.length;
	let wDate;
    for (let i = 0; i < wNoLines; i++) { // i is the number of lines in schedule table
        let wRound = parseInt(gSchedule[i].round, 10) -1;
        if (wRound === wPreviousRound) {
			continue;
		}
		wPreviousRound = wRound;
		wMatchNo = 0;

		wDate = gSchedule[i].requiredBy;
		wDate.setHours(10,0,0,0);
        let wDateRequired = wDate;
        let wStage = 0;
        let wDiv = 0;
        let wRinks = parseInt(gSchedule[i].rinks,10);
		let wType = "KO";
        let wDivision = "Knock Out";

        let wIsBye = "N";
        if (wType === "KO"){
            let wLastRound = pNoRounds - 1;
            if (wRound === wLastRound) { 
                wMatchNo++;
                storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, "Final", wIsBye);
                if (wRinks > 1 ) {
                    wMatchNo++;
                    storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, "3rd/4th", wIsBye);
                }
            } else if (wRound === 0) {
                for (let j=0; j < wNoMatchesInFirstRound; j++) {
                    let wHome = bracket[0][0][0][j][0];
                    let wAway = bracket[0][0][0][j][1];
                    wIsBye = (wHome === 0 || wAway === 0) ? "Y" : "N" ;
                    wMatchNo++;
                    storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, wDivision, wIsBye);
                }
            } else {
                wIsBye = "N";
                for (let i=0; i<wRinks; i++) {
                    wMatchNo++;
                    storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, wDivision, wIsBye);
                }
            }
        } else { 
            for (let i=0; i<wRinks; i++) {
                wMatchNo++;
                storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, wDivision, wIsBye);
            }
        }
    }
}

//	==============================================================MAIN UPDATE FUNCTIONS ===================================================================
//
//HERE//
function storeRecord(pDateRequired, pSlotId, pSlot, pRink, pStage, pDiv, pRound, pMatchNo, pUse, pIsBye) { 
    let toInsert = {
        "dateRequired": null,
        "requiredYear": 0,
        "requiredMonth": 0,
        "requiredJDate": null,
        "timeRequired": null,
        "resourceKey": "",
        "eventId": null,
        "pId": null,
        "rink": 0,
        "rangeId": 0,
        "slotId": 0,
        "compRef": null,
        "compTitle": null,
        "usage": "",
        "status": "N",
        "isBye": "N",
        "noPlayers": 0,
        "bookerId": null,
        "playerAId": null,
        "playerBId": null,
        "dateBooked": null,
        "matchKey": "",
        "scoreA": 0,
        "scoreB": 0,
        "round": 0,
        "newKey": null
    };

    let wTempPlayer = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd"; 	// id of "Temporary Holder"
    //let wBooker = "7e864e0b-e8b1-4150-8962-0191b2c1245e"		// Trevor Allen for testing purposes. Replace by current user
    let wBooker = $w('#txtLstId').text;
    
    let wToday = new Date();
    wToday.setHours(10,0,0,0);

    let wJDate = toJulian(pDateRequired);
    let wJD = parseInt(wJDate.substr(-3),10);

    let wRequiredYear = pDateRequired.getFullYear();
    let wRequiredMonth = pDateRequired.getMonth();
    let wNoPlayers = parseInt(gCompetition.gameType,10) * 2;

    let wResourceKey = wJDate + "S" + String(pSlot).padStart(2,"0") + "R" + String(pRink).padStart(2,"0");
    let wMatchKey = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") + "R"
                     + String(pRound).padStart(2,"0") + "M" + String(pMatchNo).padStart(2,"0");

    let wStatus = (pIsBye === "Y") ? BOOKING.NEW : BOOKING.READY;
    toInsert.dateRequired = pDateRequired;
    toInsert.requiredYear = wRequiredYear;
    toInsert.requiredMonth = wRequiredMonth;
    toInsert.requiredJDate = wJD;
    toInsert.resourceKey = wResourceKey;
    toInsert.rink = pRink;
    toInsert.rangeId = pSlotId;
    toInsert.slotId = pSlot;
    toInsert.compRef = gCompetition.compRef;
    toInsert.timeRequired = null;
    toInsert.compTitle = gCompetition.title;
    toInsert.usage = pUse;
    toInsert.status = wStatus;
    toInsert.isBye = pIsBye;
    toInsert.noPlayers = wNoPlayers;
    toInsert.bookerId = wBooker;
    toInsert.playerAId = wTempPlayer;
    toInsert.playerBId = wTempPlayer;
    toInsert.dateBooked = wToday;
    toInsert.matchKey = wMatchKey;
    toInsert.scoreA = 0;
    toInsert.scoreB = 0;
    toInsert.round = pRound + 1;
    toInsert.newKey = null;
    toInsert.eventId = null;
    toInsert.pId = null;
    wBookList.push(toInsert);
    //console.log("selection stored");
}

function getKOBracket(participants, pStyle)
{
    const participantsCount = participants.length;
    const rounds = Math.ceil(Math.log(participantsCount)/Math.log(2));
    const bracketSize = Math.pow(2, rounds);
    let requiredByes = bracketSize - participantsCount;

    if(participantsCount < 2) {
        return [];
    }
    var matches = [[1,2]];
    if (pStyle === "G") {
        for(let round = 1; round < rounds; round++) {
            let roundMatches = [];
            let sum = Math.pow(2, round + 1) + 1;
            for(let i = 0; i < matches.length; i++) {
                let home = changeIntoBye(matches[i][0], participantsCount);
                let away = changeIntoBye(sum - matches[i][0], participantsCount);
                roundMatches.push([home, away]);
                home = changeIntoBye(sum - matches[i][1], participantsCount);
                away = changeIntoBye(matches[i][1], participantsCount);
                roundMatches.push([home, away]);
            }
            matches = roundMatches;
        }
    } /** sequential */ else if (pStyle === "S") { 
        matches = [];
        for (let i = 1; i< rounds;i++){ 
            matches.push([i]);
        }
        let roundMatches = [];
        let sum = Math.pow(2, rounds - 1);
        let wNoRoundMatches = sum - requiredByes;
        let count = 1;
        for(let i = 0; i < wNoRoundMatches; i++) {
            let home = count;
            let away = count + 1;
            roundMatches.push([home, away]);
            count = count + 2;
        }
        for(let i = 0; i < requiredByes; i++) {
            let home = count;
            let away = 0;
            roundMatches.push([home, away]);
            count = count + 1;
        }
        matches = roundMatches;
    } /** manual */ else  {
        if (requiredByes === 0){
            //full bracket
        } else {
            let wByes = [];
            $w('#rptByes').forEachItem( ($item,itemData, index) => {
                wByes.push (parseInt($item('#inpMatchNo').value,10));
            })
            matches = [];
            for (let i = 1; i< rounds;i++){ 
                matches.push([i]);
            }
            let roundMatches = [];
            let sum = Math.pow(2, rounds - 1);
            let count = 1;
            let byeIndex = 0;
            for(let i = 0; i < sum; i++) {
                let wNextByeMatchNo = 0;
                if (byeIndex <= wByes.length+1) { 
                    wNextByeMatchNo = wByes[byeIndex];
                }
                if (i === wNextByeMatchNo - 1) {
                    let home = count;
                    let away = 0;
                    roundMatches.push([home, away]);
                    count = count + 1;
                    byeIndex++;
                } else {
                    let home = count;
                    let away = count + 1;
                    roundMatches.push([home, away]);
                    count = count + 2;
                }
            }
            matches = roundMatches;
        }
    }
    return [matches];
}

function changeIntoBye(seed, participantsCount)
{
    //return seed <= participantsCount ?  seed : '{0} (= bye)'.format(seed);
    return seed <= participantsCount ?  seed : 0;
}

function setUpMatchList(pStage, pDiv, pUpper) {

    let isMatch = (num) => {
        return num > 0;
    }
    let findByes = (obj) => {
        return (obj[0] === 0 || obj[1] === 0) ? true : false
    }
    let selectMatches = (v,x) => {
        return (v) ? 0 : x+1;
    }
    //console.log("SetUpMatchList: stage = " + pStage, "Div = " + pDiv, "Upper = " + pUpper);
    //console.log(bracket);
    let wBracket = bracket[pStage][pDiv]; 
    let wbyes = byes[pStage][pDiv];
    let wmatchNumbers = matchNumbers[pStage][pDiv];
    let wfullMatchList = fullMatchList[pStage][pDiv];

    wbyes.length = 0;
    wmatchNumbers.length = 0;
    wfullMatchList.length = 0;
    for (let i = 0; i < wBracket.length; i++) {
        let round = wBracket[i];
        wbyes[i] = round.map( findByes);            // so these arrays are 1 dimension less than bracket
        wmatchNumbers[i] = round.map( findByes)
            .map(selectMatches)
            .filter (isMatch);
        wfullMatchList[i] = round.map( findByes)
            .map(selectMatches);
    }

    byes[pStage][pDiv] = wbyes;
    matchNumbers[pStage][pDiv] = wmatchNumbers;
    fullMatchList[pStage][pDiv] = wfullMatchList;

    matchNumIdx = 0;
    
    wMatchInRound= 0;
    wSelectionIdx= 0;
    wNoMatchesInRound= pUpper / 2;     // represents the number of matches in a round including byes
    //console.log("SetUpMatchList wNoMatchesInRound= ", String(wNoMatchesInRound));
    /*
    console.log("Bracket");
    console.log(bracket);
    console.log("Byes");
    console.log(byes);
    console.log("MatchNumbers");
    console.log(matchNumbers);
    console.log("fullMatchList");
    console.log(fullMatchList);
    console.log("wNoMatchesInRound= ", wNoMatchesInRound);
    // */    
}
function AddKOToTable (pStage, pDiv, pType, pDivision, pNoTeams, pNoRounds, pNoByes) {
    //console.log("AddKOToTable:", "Stage = " + pStage, "Div = " + pDiv, "Type = " + pType, "Division = " + pDivision, 
    //                            "Teams = " + pNoTeams, "Rounds = " + pNoRounds, "Byes = " + pNoByes);
    let wTable = gSchedule;

    let wRounds = 0;
    let wId = "";
    let wMatchesPerRound = pNoTeams /2;
    let wNoPromote = 2;
	let wRgpFinals = "2";
	let wRgpKOType = "S";
    let wDivision = pDivision;
    for (let i=0; i < pNoRounds; i++) {
        if (i===0 && pNoByes > 0) {
            //OLDlet x = (pNoTeams - pNoByes) / 2;
            let x = (pNoTeams + pNoByes) / 2;
            let y = (pNoTeams - pNoByes) / 2;
            //wRounds = String(i+1);
            wId = String(pStage).padStart(2,"0") + "/" + String(pDiv).padStart(2,"0") + "/" + String(i).padStart(2,"0");
            let wItem = {"id": wId,"stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": wDivision,
                     "rinks": String(y), "bookingDate": "", "jDate": ""};
            wTable.push(wItem);
            let wItem2= {"id": wId, "stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": "KO Byes",
                     "rinks": String(pNoByes), "bookingDate": "", "jDate": ""};
            wTable.push(wItem2);
            wMatchesPerRound = x  / 2;
        } else {
            //wRounds = String(i+1);
            let wGames = wMatchesPerRound;
            if (i === pNoRounds - 1) { 
                wDivision = "Finals";
                if (pNoTeams === 4){
                    if (wRgpFinals === "4") { 
                        wGames = 2;
                    } else if ( wRgpKOType === "S") { 
                        wGames = 1;
                    } 
                } /** !== 4 */ else { 
                    if (wRgpFinals === "4") {
                        wGames = wMatchesPerRound + 1;
                    }    
                }
            }
            wId = String(pStage).padStart(2,"0") + "/" + String(pDiv).padStart(2,"0") + "/" + String(i).padStart(2,"0");
            let wItem = {"id": wId, "stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": wDivision,
                     "rinks": String(wGames), "bookingDate": "", "jDate": ""};
            wTable.push(wItem);
            wMatchesPerRound = wMatchesPerRound / 2;
        }
    }
    addClubCompStage(pStage, pDiv, pDivision, pType, bracket, pNoTeams, wNoPromote, pNoRounds, pNoByes);
    for (let i=0; i< pNoTeams+1; i++) {
       addClubCompCompetitor(pStage, pDiv, pDivision, i);
    }
    wTable.sort(tableSortA);
    return wTable;
}

function addClubCompStage(pStage, pDiv, pDivision, pShape, pBracket, pNoTeams, pNoPromote, pNoRounds, pNoByes) {
    let toInsert = {
        "title": null,
        "compRef": null,
        "compYear": 0,
        "stage": 0,
        "div": 0,
        "division": null,
        "status": "N",
        "shape": null,
        "bracket": [[]],
        "handicapped": false,
        "seeds": 0,
        "noTeams": 0,
        "noPromote": 0,
        "noRounds": 0,
        "noByes": 0
    };
    // form Insertrecord
    toInsert.title = gCompetition.title;
    toInsert.compRef =  gCompetition.compRef;
    toInsert.compYear = gCompetition.compYear;
    toInsert.stage = parseInt(pStage,10);
    toInsert.div = parseInt(pDiv, 10);
    toInsert.division = pDivision;
    toInsert.status = STAGE.NEW;
    toInsert.shape = pShape;
    toInsert.bracket = pBracket[toInsert.stage][toInsert.div];
    toInsert.handicapped = $w('#chkHandicapped').checked;
    toInsert.seeds = 0;
    toInsert.noTeams = parseInt(pNoTeams,10);
    toInsert.noPromote = parseInt(pNoPromote,10);
    toInsert.noRounds = parseInt(pNoRounds,10);
    toInsert.noByes = parseInt(pNoByes,10);
    wStages.push(toInsert);
    return true;
}

function tableSortA(a,b) {
    const aStage = parseInt(a.stage, 10);
    const bStage = parseInt(b.stage, 10);
    if (aStage < bStage) {
        return -1;
    }
    if (aStage > bStage) {
        return 1;
    }
    const aRound = parseInt(a.round, 10);
    const bRound = parseInt(b.round, 10);
    if (aRound < bRound) {
        return -1;
    }
    if (aRound > bRound) {
        return 1;
    }
    const aDiv = parseInt(a.div,10);
    const bDiv = parseInt(b.div,10);
    if (aDiv < bDiv) {
        return -1;
    } 
    if (aDiv > bDiv) {
        return 1;
    }
    return 0;
}
function addClubCompCompetitor(pStage, pDiv, pDivision, pNum) {
    let toInsert = {
        "title": null,
        "compRef": null,
        "compYear": 0,
        "stage": 0,
        "div": 0,
        "division": null,
        "competitorId": 0,
        "status": "N",
        "skip": "",
        "skipId": "",
        "teamName": null,
        "teamNames": [],
        "teamIds": [],
        "seed": 0,
        "hcp": 0,
        "played": 0,
        "mWon": 0,
        "mLost": 0,
        "mDrawn": 0,
        "sWon": 0,
        "sDrawn": 0,
        "pointsAgainst": 0,
        "pointsFor": 0,
        "points": 0
    };
    toInsert.title = gCompetition.title;
    toInsert.compRef = gCompetition.compRef;
    toInsert.compYear = gCompetition.compYear;
    toInsert.stage = parseInt(pStage,10);
    toInsert.div = parseInt(pDiv, 10);
    toInsert.division = pDivision;
    toInsert.competitorId = pNum;
    toInsert.status = COMPETITOR.NEW;
    toInsert.skip = ""
    toInsert.skipId = null;
    toInsert.teamName = null;
    toInsert.teamNames = [];
    toInsert.teamIds = [];
    toInsert.seed = 0;
    toInsert.hcp = 0;
    toInsert.played = 0;
    toInsert.mWon = 0;
    toInsert.mLost = 0;
    toInsert.mDrawn = 0;
    toInsert.sWon = 0;
    toInsert.sDrawn = 0;
    toInsert.pointsAgainst = 0;
    toInsert.pointsFor = 0;
    toInsert.points = 0;
    wStageCompetitors.push(toInsert);    
    return true;
}

async function updateClubComp() {

	//console.log(gCompetition);
    let wCompId = gCompetition._id;
    let wCompRec = await getClubCompById(wCompId);

    wCompRec.noStages = 1;
    wCompRec.status = "S";
    //TODO: we may need to update status also

    let res = await saveClubComp(wCompRec);
    if (!res) {
        //console.log("updateClubComp failed");
        return Promise.reject("Update failed");
    }
    return Promise.resolve("Club Comp Updated");
}

