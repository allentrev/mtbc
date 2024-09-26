import wixWindow 				from 'wix-window';
import wixLocation 				from 'wix-location';
import _ 						from 'lodash';

import { toJulian }                         from 'public/fixtures';
import { getCompetitions }  	from 'public/objects/clubComp';
import { loadCompetitionArray }	from 'public/objects/clubComp';
import { getAllClubComp }		from 'backend/backClubComp';
import { getReferenceSet }		from 'backend/backClubComp';
import { insertClubComp }		from 'backend/backClubComp';
import { resetCompetition }			from 'backend/backClubComp';
import { saveClubComp }			from 'backend/backClubComp';
import { deleteClubComp }		from 'backend/backClubComp';
import { getClubCompById }		from 'backend/backClubComp';
import { bulkSaveClubComp }		from 'backend/backClubComp';
import { COMPETITOR_TYPE }		from 'public/objects/clubComp';
import { COMPETITION }			from 'public/objects/clubComp';
import { calcParameters }			from 'backend/backClubComp';
import { STAGE}					from 'public/objects/clubComp';
import { COMPETITOR }			from 'public/objects/clubComp';
import { MAINTAINED }			from 'public/objects/clubComp';
import { BOOKABLE }				from 'public/objects/clubComp';
import { MIX }					from 'public/objects/clubComp';
import { initialiseData }		from 'backend/backClubComp';
import { getSettingsRoundDateArray }	from 'backend/backSystem.jsw';
import { updateSettingsRoundDateArray }	from 'backend/backSystem.jsw';
import { formatDateString }		from 'public/fixtures';
import { BOOKING }           			    from 'public/objects/booking.js';
import { bulkSaveBookings } 			    from 'public/objects/booking.js';
import { bulkSaveClubCompStages }           from 'public/objects/clubComp';
import { bulkSaveClubCompCompetitors}       from 'public/objects/clubComp';

const MODE = Object.freeze({
	CREATE:	"C",
	UPDATE:	"U",
	DELETE:	"D",
	PRIME:	"P",
	CLEAR:	""
});


const COMPETITION_TYPE = Object.freeze({
	COMPETITION:	"C",
	REFERENCE:		"R"
});


const MSB_STATE = Object.freeze({
	NEXT:		"N",
	PREVIOUS:	"P",
	S1:			"S1"
});

const SELECTED_COLOR = "rgba(190,190,250)";
const NORMAL_COLOR = "rgba(222,222,222)";

let gCompetitions = [];
let gReferences = [];
let wPublished = [];
let wPublishedIdx = 0;
let wOthers = []; 
let wOtherIdx = 0;
let wCompGames = [];
let gYear = 2021;
let gMode = MODE.CLEAR;

let wBookList = [];             // an array of games to be inserted into the database
let wStages = [];               // an array of stages to be held in the competition
let wStageCompetitors = [];     // an array of competitors for each stage 

/**
 * these arrays contain an entry for each stage/division in the competition
 * they are used to allocate opponents in a game
- * they are referenced as array[stage][div][round][match]
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

$w.onReady(async function () {

	const validateCompRef = () => (value, reject) => {

		let wValue = String(value).toUpperCase();
        let wItem  = gCompetitions.find( wItem => wItem.compRef === wValue);
		if (wItem){ 
			//inputField.validity.valid = false;
			//inputField.updateValidityIndication();
			if (gMode === MODE.CREATE) {
				reject("Competition CompRef already used");
			}
		} else if (wValue === "" || wValue.length < 3) {
				//inputField.validity.valid = false;
				//inputField.updateValidityIndication();
				reject("Must be at least 3 characters in length")
			} else {
				let wLastChar = wValue.slice(-1);
				if (wLastChar === MIX.LADIES || wLastChar === MIX.MENS || wLastChar === MIX.MIXED) {
					//inputField.validity.valid = true;
				} else {
					//inputField.validity.valid = false;
					//inputField.updateValidityIndication();
					reject("Must end in L, M or X");
				}
			}
	}

	const validateTitle = () => (value, reject) => {
		let wValue = String(value).trim();
		if (wValue === "" || wValue.length < 3) {
			reject("Enter a meaningful title");
		}
	}
	const validateNoPlayers = () => (value, reject) => {
		let wValue = parseInt(value, 10);
		if (wValue < 2 || wValue > 128 ) {
			reject("Must be in the range [2,128]");
		}
	}
	
	gYear =  new Date().getFullYear();
	$w('#lblHdr1').text = `The following table summarises the number of competitions that have been set up for the ${gYear} season`;

	if(wixWindow.formFactor === "Mobile"){
		$w('#cstrpDesktop').collapse();
		$w('#cstrpMobile').expand();
	} else {
		$w('#cstrpMobile').collapse();
		$w('#cstrpDesktop').expand();
		const wSummary = await initialiseData(gYear);
		$w('#tblSummary').rows = wSummary;;
		await loadTableData();
	}
   
	$w('#rgpReferenceView').onClick( (event) => doReferenceViewChange(event));
	$w('#btnReferenceUpdate').onClick( (event) => doReferenceUpdate(event));
	
	$w('#rptReferenceCompetitionsList').onItemReady ( ($item, itemData, index) => {
		loadRptReferenceCompetitionsList($item, itemData, index);
	})

	$w('#rptReferenceCompetitionsPrime').onItemReady ( ($item, itemData, index) => {
		loadRptReferenceCompetitionsPrime($item, itemData, index);
	})

	$w('#rptCompetition').onItemReady ( ($item, itemData, index) => {
		loadRptCompetitions($item, itemData, index);
	})

	$w('#rptCompetitionRounds').onItemReady ( ($item, itemData, index) => {
		loadRptCompetitionRounds($item, itemData, index);
	})

	$w('#fieldS3').onCustomValidation (validateCompRef());
	$w("#fieldS1").onCustomValidation(validateTitle());
	// not sure where this is $w('#fieldS7').onCustomValidation (validateNoPlayers());
	$w('#inpCompetitionCompRef').onCustomValidation (validateCompRef());
	$w("#inpCompetitionTitle").onCustomValidation(validateTitle());

});


// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//
function loadRptReferenceCompetitionsList($item, itemData, index) {
	if (index === 0) {
		$item ('#txtReferenceListTitle').hide();
		$item('#chkReferenceListManaged').hide();
		$item('#chkReferenceListBookable').hide();
		$item('#chkReferenceListInTable').hide();
		$item('#chkReferenceListSelect').hide();
		
		$item('#lblReferenceListTitle').show();
		$item('#lblReferenceListManaged').show();
		$item('#lblReferenceListBookable').show();
		$item('#lblReferenceListInTable').show();
		$item('#lblReferenceListSelect').show();
	} else {
		$item ('#txtReferenceListTitle').show();
		$item('#chkReferenceListManaged').show();
		$item('#chkReferenceListBookable').show();
		$item('#chkReferenceListInTable').show();
		$item('#chkReferenceListSelect').show();
		
		$item('#lblReferenceListTitle').hide();
		$item('#lblReferenceListManaged').hide();
		$item('#lblReferenceListBookable').hide();
		$item('#lblReferenceListInTable').hide();
		$item('#lblReferenceListSelect').hide();
		
		$item('#txtReferenceListTitle').text = itemData.title;
		(itemData.maintainedBy === MAINTAINED.AUTO) ? $item('#chkReferenceListManaged').checked = true : $item('#chkReferenceListManaged').checked = false;
		(itemData.bookable === "Y") ? $item('#chkReferenceListBookable').checked = true : $item('#chkReferenceListBookable').checked = false;
		(itemData.inTableDisplay === "Y") ? $item('#chkReferenceListInTable`').checked = true : $item('#chkReferenceListInTable').checked = false;
		$item('#chkReferenceSelect').checked = false;
	}
}

function loadRptReferenceCompetitionsPrime($item, itemData, index) {
	if (index === 0) {
		$item ('#txtReferencePrimeTitle').hide();
		$item('#chkReferencePrimeLadies').hide();
		$item('#chkReferencePrimeMen').hide();
		$item('#chkReferencePrimeMixed').hide();
		
		$item('#lblReferencePrimeTitle').show();
		$item('#lblReferencePrimeLadies').show();
		$item('#lblReferencePrimeMen').show();
		$item('#lblReferencePrimeMixed').show();
	} else {
		console.log("Prime, body");
		$item ('#txtReferencePrimeTitle').show();
		$item('#chkReferencePrimeLadies').show();
		$item('#chkReferencePrimeMen').show();
		$item('#chkReferencePrimeMixed').show();
		
		$item('#lblReferencePrimeTitle').hide();
		$item('#lblReferencePrimeLadies').hide();
		$item('#lblReferencePrimeMen').hide();
		$item('#lblReferencePrimeMixed').hide();
		
		$item('#txtReferencePrimeTitle').text = itemData.title;
		$item('#chkReferencePrimeLadies').checked = itemData.ladies;
		$item('#chkReferencePrimeMen').checked = itemData.mens;
		$item('#chkReferenceMixed').checked = itemData.mixed;
	}
}

function loadRptCompetitions($item, itemData, index) {

	if (index === 0) {
		$item('#chkCompetitionSelect').hide();
		$item('#lblCompetitionSelect').show();
	} else {
		$item('#lblCompetitionSelect').hide();
		$item('#chkCompetitionSelect').show();
		$item('#chkCompetitionSelect').checked = false;
		$item('#lblCompetitionTitle').text = itemData.title;
		$item('#lblCompetitionMix').text = itemData.mix;
		$item('#lblCompetitionCompRef').text = itemData.compRef;
		$item('#lblCompetitionStatus').text = itemData.status;
		$item('#lblCompetitionManaged').text = itemData.maintainedBy;
		$item('#chkCompetitionSelect').checked = false;
	}
}

function loadRptCompetitionRounds($item, itemData, index) {
	$item('#lblCompetitionRound').text = itemData.round;
	$item('#inpCompetitionRoundDate').value = itemData.roundDate;
}

// ------------------------------------------------ Page level Stuff ----------------------------------------------------------

export function drpMix_change(event) {
	//Add your code for this event here:
	loadTableData();
}

export function doReferenceViewChange (event    ) {
	let wView = event.target.value;
	if (wView === "P") {
		$w('#rptReferenceCompetitionsList').collapse();
		$w('#rptReferenceCompetitionsPrime').expand();
	} else {
		$w('#rptReferenceCompetitionsList').expand();
		$w('#rptReferenceCompetitionsPrime').collapse();
	}
}

export async function loadTableData () {
	let wFirstRow = { "_id": "hdr", "title": "Header", "maintainedBy": MAINTAINED.AUTO};
	let wResult =  await getAllClubComp(gYear);
	if (wResult.status) {
		let wSet = [...wResult.competitions];
		if (wSet){
			gCompetitions = wSet.filter( item => item.status !== COMPETITION.REFERENCE);
		} else {
			gCompetitions = [];
		}
	} else {
		gCompetitions = [];
	}

	let wResult2 =  await getReferenceSet();
	gReferences = [...wResult2.referenceCompetitions];

	if (gCompetitions.length > 0) {
		gCompetitions.unshift(wFirstRow);
		$w('#rptCompetition').data = gCompetitions;
		$w('#cstrpReference').collapse();
		$w('#cstrpCompetitions').expand();
		$w('#boxCompetitionNone').collapse();
		$w('#boxCompetitionEdit').collapse();
		$w('#boxCompetitionPrimeEdit').collapse();
	} else {
		$w('#boxReferenceEdit').collapse();
		$w('#boxReferenceCommands').expand();
		let wComps = [...gReferences];
		wComps.unshift(wFirstRow);
		$w('#rptReferenceCompetitionsList').data = wComps;
		$w('#rptReferenceCompetitionsPrime').data = wComps;
		$w('#rptReferenceCompetitionsPrime').collapse();
		$w('#cstrpReference').expand();
		$w('#cstrpCompetitions').collapse();
	}
}


// ================================================= Reference =======================================================
//

export async function chkReferenceSelect_change(event) {
	let wCount = countReferenceSelectedItems();
	
	switch (wCount) {
		case 0:
			$w('#boxNewSeason').collapse();
			$w('#txtReferenceClubCompId').text = "";
			$w('#boxReferenceEdit').collapse;
			$w('#btnReferenceCreate').show();
			$w('#btnReferenceToCompetition').show();
			$w('#btnReferenceUpdate').hide();
			$w('#btnReferenceDelete').hide();
			$w('#btnReferenceSave').hide();
			$w('#btnReferenceCancel').hide();
			break;
		case 1:
			let wComp = await getCheckedItem(COMPETITION_TYPE.REFERENCE);
			$w('#txtReferenceClubCompId').text = wComp._id;
			$w('#btnReferenceCreate').show();
			$w('#btnReferenceToCompetition').show();
			$w('#btnReferenceUpdate').show();
			$w('#btnReferenceDelete').show();
			$w('#btnReferenceSave').hide();
			$w('#btnReferenceCancel').hide();
			$w('#boxReferenceEdit').collapse();
			$w('#boxNewSeason').expand();
			break;
		default:
			$w('#txtReferenceClubCompId').text = "";
			$w('#btnReferenceCreate').show();
			$w('#btnReferenceToCompetition').show();
			$w('#boxReferenceEdit').collapse();
			$w('#btnReferenceUpdate').hide();
			$w('#btnReferenceDelete').hide();
			$w('#btnReferenceSave').hide();
			$w('#btnReferenceCancel').hide();
			$w('#boxNewSeason').expand();
			break;
	}
}

export async function btnReferenceSave_click(event) {
	let wClubComp = {
		"_id": "", 
		"title": $w('#inpReferenceTitle').value,
		"compRef": $w('#inpReferenceCompBase').value,
		"maintainedBy": $w('#rgpReferenceAuto').value,
		"inTableDisplay": $w('#rgpReferenceInTableDisplay').value,
		"bookable": $w('#rgpReferenceBookable').value,
		"shape": $w('#rgpReferenceShape').value,
		"mix": null,
		"gameType": parseInt($w('#rgpReferenceGameType').value,10),
		"competitorType": $w('#rgpReferenceCompetitorType').value,
		"compYear": null,
		"status": "R",
		"order": 0,
		"noStages": 0,
		"winnerNames": [],
		"secondNames": []
	}
	switch (gMode) { 
		case MODE.CREATE:
			wClubComp._id = undefined;
			wClubComp.status = COMPETITION.REFERENCE;
			break;
		case MODE.PRIME:
		case MODE.UPDATE:
			wClubComp._id = $w('#txtReferenceClubCompId').text;
			wClubComp.status = COMPETITION.REFERENCE;
			break;
		default:
			console.log ("Reference Save mode = ", gMode);
	}

	let result = await saveClubComp(wClubComp);
	if (result.status) {
		switch (gMode) { 
			case MODE.CREATE:
				wClubComp._id = res._id;
				let wComps = $w('#rptReferenceCompetitionsList').data;
				wComps.push(wClubComp);
				$w('#rptReferenceCompetitionsList').data = wComps;
				$w('#rptReferenceCompetitionsPrime').data = wComps;
				break;
			case MODE.UPDATE:
				refreshRptReference(res);
				break;
			default:
				console.log ("Reference Save mode = ", gMode);
		}
		resetReferenceCommands();
	}
	gMode = MODE.CLEAR;

}

export function btnReferenceCancel_click(event) {
	$w('#boxNewSeason').expand();
	gMode = MODE.CLEAR;
	resetReferenceCommands();
}

export function btnReferenceCreate_click(event) {
	$w('#boxReferenceEdit').expand();
	$w('#boxNewSeason').collapse();
	$w('#btnReferenceCreate').hide();
	$w('#btnReferenceToCompetition').hide();
	$w('#btnReferenceUpdate').hide();
	$w('#btnReferenceDelete').hide();
	$w('#btnReferenceSave').show();
	$w('#btnReferenceCancel').show();
	gMode = MODE.CREATE;
}

export async function doReferenceUpdate(event) {
	$w('#boxReferenceEdit').expand();
	$w('#boxNewSeason').collapse();
	$w('#btnReferenceCreate').hide();
	$w('#btnReferenceToCompetition').hide();
	$w('#btnReferenceUpdate').hide();
	$w('#btnReferenceDelete').hide();
	$w('#btnReferenceSave').show();
	$w('#btnReferenceCancel').show();
	let wCompetition = await getCheckedItem(COMPETITION_TYPE.REFERENCE);
	populateEdit(COMPETITION_TYPE.REFERENCE, wCompetition);
	gMode = MODE.UPDATE;
}
export async function btnReferenceDelete_click(event) {
	let wId = $w('#txtReferenceClubCompId').text;
	let res = await deleteClubComp(wId);
	if (res) { 
		let wData = $w('#rptReferenceCompetitionsList').data;
		let wIdx = wData.findIndex( item => item._id === wId);
		if (wIdx) {
			wData.splice(wIdx, 1);
			$w('#rptReferenceCompetitionsList').data = wData;
			$w('#rptReferenceCompetitionsPrime').data = wData;
		}
	}
	$w('#boxNewSeason').collapse();
	resetReferenceCommands();
	gMode = MODE.DELETE;
}

export async function btnNewSeasonCreate_click(event) {
	let wSelectList = selectEntrys();
	let wThisYearSet = [];
	let wAllComps = await getAllClubComp(gYear);
	if (wAllComps) { 
		let wAlreadySet = wAllComps.filter ( item => item.status !== COMPETITION.REFERENCE);
		wThisYearSet = wSelectList.filter ( item => {
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
		wThisYearSet = wSelectList;
	}
	let wUpdateSet = wThisYearSet.map ( item => {
		return {
			"_id": item._id,
			"title": item.title,
			"compRef": item.compRef,
			"maintainedBy": item.maintainedBy,
			"inTableDisplay":item.inTableDisplay,
			"bookable": item.bookable,
			"shape": item.shape,
			"mix": item.mix,
			"gameType":item.gameType,
			"competitorType": item.competitorType || "P",
			"noCompetitors": 0,	
			"compYear": item.compYear,
			"status": item.status,
			"order": item.order,
			"noStages": item.noStages,
			"winnerNames": item.winnerNames,
			"secondNames": item.secondNames
		}
	})
	if (wThisYearSet.length > 0 ){ 
		let res = await bulkSaveClubComp(wUpdateSet);
	}
}

export async function btnReferenceToCompetition_click(event) {
	let wFirstRow = { "_id": "hdr", "title": "Header", "maintainedBy": "A"};
	gCompetitions = await getAllClubComp(gYear);
	$w('#boxNewSeason').collapse();
	if (gCompetitions.length > 0) {
		$w('#rptCompetition').data = gCompetitions;
		$w('#cstrpReference').collapse();
		$w('#cstrpCompetitions').expand();
		$w('#boxCompetitionNone').collapse();
		$w('#boxCompetitionEdit').collapse();
		$w('#boxCompetitionPrimeEdit').collapse();
	} else {
		$w('#rptCompetition').data = [];
		$w('#cstrpReference').collapse();
		$w('#cstrpCompetitions').expand();
		$w('#boxCompetitionNone').expand();
		$w('#boxCompetitionEdit').collapse();		
	}
}



// ------------------------------------------------ Reference Supporting functions ---------------------------------------------------------
//

function countReferenceSelectedItems() {
	let count = 0;
	$w('#rptReferenceCompetitionsList').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkReferenceListSelect').checked) { count++ }
	})
	return count;
}

function resetReferenceCommands() {
	$w('#boxReferenceEdit').collapse();
	$w('#boxNewSeason').collapse();
	$w('#btnReferenceCreate').show();
	$w('#btnReferenceToCompetition').show();
	$w('#btnReferenceUpdate').hide();
	$w('#btnReferenceDelete').hide();
	$w('#btnReferenceSave').hide();
	$w('#btnReferenceCancel').hide();
	$w('#inpReferenceTitle').value = "";
	$w('#inpReferenceCompBase').value = "";
	$w('#rgpReferenceAuto').value = MAINTAINED.AUTO;
	$w('#rgpReferenceShape').value = "KO";
	$w('#rgpReferenceCompetitorType').value = "P";
	$w('#chkReferenceListSelect').checked = false;
	gMode = MODE.CLEAR;
}

async function getCheckedItem(pType){
	let wClubComp = {};
	let wId = "";
	if (pType === COMPETITION_TYPE.REFERENCE) { 
		$w('#rptReferenceCompetitionsList').forEachItem( ($item, itemData) =>  { 
			if ($item('#chkReferenceListSelect').checked) {
				wId = itemData._id;
			}
		})
	} else { 
		$w('#rptCompetition').forEachItem( ($item, itemData) =>  { 
			if ($item('#chkCompetitionSelect').checked) {
				wId = itemData._id;
			}
		})
	}
	wClubComp = await getClubCompById(wId);
	return wClubComp;
}

function selectEntrys(){
	let wSelectList = [];

	$w('#rptReferenceCompetitionsList').forEachItem( ($item, itemData) =>  { 
		if ($item('#chkReferenceListSelect').checked) {
			console.log(itemData);
			if ($item('#chkReferencePrimeLadies').checked) {
				let wRec = {...itemData};
				wRec.compRef = itemData.compRef + "L";
				wRec._id = undefined;
				wRec.mix = MIX.LADIES;
				wRec.compYear = gYear;
				wRec.status = COMPETITION.NEW;
				wSelectList.push(wRec);
			}
			if ($item('#chkReferencePrimeMen').checked) { 
				let wRec = {...itemData};
				wRec.compRef = itemData.compRef + "M";
				wRec._id = undefined;
				wRec.mix = MIX.MENS;
				wRec.compYear = gYear;
				wRec.status = COMPETITION.NEW;
				wSelectList.push(wRec);
			}
			if ($item('#chkReferencePrimeMixed').checked) { 
				let wRec = {...itemData};
				wRec.compRef = itemData.compRef + "X";
				wRec._id = undefined;
				wRec.mix = MIX.MIXED;	
				wRec.compYear = gYear;
				wRec.status = COMPETITION.NEW;
				wSelectList.push(wRec);
			}
		}
	})
	return wSelectList;
}

function refreshRptReference(pComp){
	$w('#rptReferenceCompetitionsList').forItems([pComp._id],($item) => {
		$item('#lblReferenceListSelect').hide();
		$item('#chkReferenceListSelect').show();
		$item('#chkReferenceListSelect').checked = false;
		$item('#txtReferenceListTitle').text = pComp.title;
		if (pComp.maintainedBy === MAINTAINED.AUTO) { 
			$item('#chkReferencePrimeManaged').checked = true;
		}else {
			$item('#chkReferencePrimeManaged').checked = false;
		}
		$item('#chkReferencePrimeLadies').checked = false;
		$item('#chkReferencePrimeMen').checked = false;
		$item('#chkReferencePrimeMixed').checked = false;
		$item('#chkReferenceListSelect').checked = false;
	})
}

// ================================================= Competition =======================================================
//
	let gWinnersArray = [];
	let gSecondsArray = [];

export async function chkCompetitionSelect_change(event) {
	let [wIds, wCount] = countCompetitionSelectedItems();
	
	switch (wCount) {
		case 0:
			$w('#txtCompetitionId').text = "";
			$w('#boxCompetitionEdit').collapse;
			$w('#boxCompetitionPrimeEdit').collapse();
			$w('#btnCompetitionCreate').show();
			$w('#btnCompetitionToReference').show();
			$w('#btnCompetitionUpdate').hide();
			$w('#btnCompetitionDelete').hide();
			$w('#btnCompetitionSave').hide();
			$w('#btnCompetitionCancel').hide();
			$w('#boxCompetitionPrime').collapse();
			break;
		case 1:
			let wComp = await getCheckedItem(COMPETITION_TYPE.COMPETITION);
			$w('#txtCompetitionId').text = wComp._id;
			$w('#btnCompetitionCreate').hide();
			$w('#btnCompetitionToReference').show();
			$w('#btnCompetitionUpdate').show();
			$w('#btnCompetitionDelete').show();
			$w('#btnCompetitionSave').hide();
			$w('#btnCompetitionCancel').hide();
			$w('#boxCompetitionEdit').collapse();
			$w('#boxCompetitionPrimeEdit').collapse();
			$w('#boxCompetitionPrime').expand();
			
			break;
		default:
			$w('#txtCompetitionId').text = "";
			$w('#btnCompetitionCreate').hide();
			$w('#btnCompetitionToReference').show();
			$w('#boxCompetitionEdit').collapse();
			$w('#boxCompetitionPrimeEdit').collapse();
			$w('#btnCompetitionUpdate').hide();
			$w('#btnCompetitionDelete').show();
			$w('#btnCompetitionSave').hide();
			$w('#btnCompetitionCancel').hide();
			$w('#boxCompetitionPrime').expand();
			break;
	}
}

export function btnCompetitionCreate_click(event) {
	$w('#boxCompetitionCreate').expand();
	$w('#boxCompetitionEdit').collapse();
	$w('#boxCompetitionPrimeEdit').collapse();
	$w('#boxCompetitionList').collapse();
	$w('#btnCompetitionCreate').hide();
	$w('#btnCompetitionToReference').hide();
	$w('#btnCompetitionUpdate').hide();
	$w('#btnCompetitionDelete').hide();
	$w('#btnCompetitionSave').hide();
	$w('#btnCompetitionCancel').show();
	$w('#msbNewCompetition').changeState(MSB_STATE.S1)
		.then ( () => {
		$w('#fieldS1').focus();
		})
	gWinnersArray = [];
	gSecondsArray = [];
	gMode = MODE.CREATE;
}

export async function btnCompetitionUpdate_click(event) {
	$w('#boxCompetitionCreate').collapse();
	$w('#boxCompetitionEdit').expand();
	$w('#boxCompetitionPrimeEdit').collapse();
	$w('#boxCompetitionList').collapse();
	$w('#boxCompetitionPrime').collapse();
	$w('#btnCompetitionCreate').hide();
	$w('#btnCompetitionToReference').hide();
	$w('#btnCompetitionUpdate').hide();
	$w('#btnCompetitionDelete').hide();
	$w('#btnCompetitionSave').show();
	$w('#btnCompetitionCancel').show();
	let wCompetition = await getCheckedItem(COMPETITION_TYPE.COMPETITION);
	populateEdit(COMPETITION_TYPE.COMPETITION, wCompetition);
	gMode = MODE.UPDATE;
}

export async function btnCompetitionDelete_click(event) {
	let wItems = getCompetitionSelectedItems();
	$w('#imgWait').show();
	let wData = $w('#rptCompetition').data;
	for (let wItem of wItems){
		let res = await deleteClubComp(wItem._id);
		if (res) { 
			let wIdx = wData.findIndex( item => item._id === wItem._id);
			if (wIdx) {
				wData.splice(wIdx, 1);
			}
		}
	}
	$w('#rptCompetition').data = wData;
	gMode = MODE.DELETE	;
	await resetCompetitionCommands();
	$w('#imgWait').hide();
}

export async function btnCompetitionSave_click(event) {
	let wClubComp = {
		"_id": "", 
		"title": $w('#inpCompetitionTitle').value,
		"compRef": String($w('#inpCompetitionCompRef').value).toUpperCase(),
		"maintainedBy": $w('#rgpCompetitionMaintainedBy').value,
		"inTableDisplay": $w('#rgpCompetitionInTableDisplay').value,
		"bookable": $w('#rgpCompetitionBookable').value,
		"shape": $w('#drpCompetitionShape').value,
		"mix": $w('#rgpCompetitionMix').value,
		"gameType": parseInt($w('#rgpCompetitionGameType').value,10),
		"competitorType": $w('#rgpCompetitionCompetitorType').value,
		"noCompetitors": parseInt($w('#inpCompetitionNoCompetitors').value,10) || 0,
		"compYear": parseInt($w('#inpCompetitionYear').value,10),
		"status": $w('#drpCompetitionStatus').value,
		"order": parseInt($w('#inpCompetitionOrder').value,10),
		"noStages": parseInt($w('#inpCompetitionNoStages').value,10) || 1,
		"winnerNames": gWinnersArray,
		"secondNames": gSecondsArray
	}

	let wFail =false;

	let wErrMsg = "";
	if (gMode === MODE.PRIME) {
		if ( parseInt($w('#inpCompetitionPrimeNoCompetitors').value,10) < 3) {
			showMsg(3,5);
			return;
		}		
	} else {
		if (!$w('#inpCompetitionTitle').valid) {
			wErrMsg = wErrMsg + "\n" + $w('#inpCompetitionTitle').validationMessage;
			wFail = true;
		}
		if (!$w('#inpCompetitionCompRef').valid) {
			wErrMsg = wErrMsg + "\n" + $w('#inpCompetitionCompRef').validationMessage;
			wFail = true;
		}
		if (wFail) { 
			wErrMsg = "Correct the following errors:" + wErrMsg;
			showError("Comp",0, wErrMsg);
			//showError("Comp",3);
			if (!$w('#inpCompetitionTitle').valid){
				$w('#inpCompetitionTitle').focus();
			} else {
				$w('#inpCompetitionCompRef').focus();
			}
			return;		//On fail, dont go any further
		}
	}
	await saveCompetition(wClubComp);
}

export async function btnS7Save_click(event) {
	let wClubComp = {
		"_id": "", 
		"title": $w('#fieldS1').value,
		"compRef": $w('#fieldS3').value,
		"maintainedBy": $w('#fieldS4').value,
		"inTableDisplay": $w('#fieldS4A').value,
		"bookable": $w('#fieldS4B').value,
		"shape": $w('#fieldS2A').value,
		"mix": $w('#fieldS2').value,
		"gameType": parseInt($w('#fieldS5').value,10),
		"competitorType": $w('#fieldS6').value,
		"compYear": gYear,
		"status": "N",
		"order": 0,
		"noStages": 1,
		"winnerNames": [],
		"secondNames": []
	}
	let wStatus = COMPETITION.NEW;
	let wMaintainedBy = $w('#fieldS4').value;
	wStatus = (wMaintainedBy === MAINTAINED.MANUAL) ? COMPETITION.OPEN : COMPETITION.NEW;
	wClubComp.status = wStatus;

	gMode = MODE.CREATE;
	await saveCompetition(wClubComp);
}

async function saveCompetition(pClubComp){
	
	switch (gMode) { 
		case MODE.CREATE:
			pClubComp._id = undefined;
			break;
		case MODE.UPDATE:
			pClubComp._id = $w('#txtCompetitionId').text;
			pClubComp.status = $w('#drpCompetitionStatus').value;
			pClubComp.maintainedBy = $w('#rgpCompetitionMaintainedBy').value;
			pClubComp.noCompetitors = parseInt($w('#inpCompetitionNoCompetitors').value,10) || 0;
			// need to update lstSettings if changed
			break;
		case MODE.PRIME:
			pClubComp._id = $w('#txtCompetitionId').text;
			pClubComp.compRef = $w('#lblCompRef').value;
			pClubComp.title = $w('#lblTitle').value;
			pClubComp.noCompetitors = parseInt($w('#inpCompetitionPrimeNoCompetitors').value,10) || 0;
			// need to update lstSettings if changed
			let res = await updateRoundsDates($w('#rptCompetitionRounds').data);
			break;
		default:
			console.log ("Competition Save mode = ", gMode);
	}
	let result = await saveClubComp(pClubComp);
	if (result.status) {
		switch (gMode) { 
			case MODE.CREATE:
				pClubComp._id = res._id;
				let wComps = $w('#rptCompetition').data;
				let wFirstLine = wComps.shift();
				wComps.push(pClubComp);
				let wSortedComps = _.sortBy(wComps, ['mix', 'order', 'title']);
				wSortedComps.unshift(wFirstLine);
				$w('#rptCompetition').data = wSortedComps;
				showError("Comp",4);
				break;
			case MODE.UPDATE:
				refreshRptCompetition(res);
				break;
			case MODE.PRIME:
				$w('#imgWait').show();
				let wRounds = $w('#rptCompetitionRounds').data;
				let wNoRounds = wRounds.length;
				if (wNoRounds > 0) {
					await initialisePrime();
					await doPrime();
					await processScheduleTable(wNoRounds);

					console.log(wStages);
					console.log(wStageCompetitors);
					console.log(wBookList);
					Promise.all([
						bulkSaveClubCompStages(wStages),
						bulkSaveClubCompCompetitors(wStageCompetitors),
						bulkSaveBookings(wBookList),
						updateClubComp(),
					]).then(results => {
						console.log( results );
						showMsg(30,5);
						resetPage();
					})
					.catch( (err) => {
						console.log("Error");
						console.log(err);
						return false;
					})
				}
				break;
			default:
				console.log ("Competition Save mode = ", gMode);
		}
		await resetCompetitionCommands();
	}
	gMode = MODE.CLEAR;
}

function resetPage() {
    gSchedule.length = 0;
    bracket.length = 0;
    byes.length = 0;
    matchNumbers.length = 0;
    fullMatchList.length = 0;
    bracket = [[]];
    byes = [[]];
    matchNumbers = [[]];
    fullMatchList = [[]];
    wNoMatchesInRound= 0;
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
	$w('#rptCompetitionRounds').forEachItem( ($item, itemData, index) => {
		if ($item('#inpCompetitionRoundDate').valid) {
			wDates.push($item('#inpCompetitionRoundDate').value);		
		} else {
				wValid = false;
		}
	})
	if (wValid){
		let wId = $w('#lblCompetitionDateRangeId').text;
		let res = await updateSettingsRoundDateArray(wId, wDates);
	} else {
		showMsg(4,6);
	}

}

function refreshRptCompetition(pClubComp){
	let wData = $w('#rptCompetition').data;
	let wFirstLine = wData.shift();

	let foundIndex = wData.findIndex(x => x._id == pClubComp._id);
	if (foundIndex > -1) {
		wData[foundIndex] = pClubComp;	 
		let wSortedComps = _.sortBy(wData, ['mix', 'order', 'title']);
		wSortedComps.unshift(wFirstLine);
		$w('#rptCompetition').data = wSortedComps;
	} else {
		console.log("Couldnt find item in rpeater data", pClubComp._id);
	}
}

export async function btnCompetitionCancel_click(event) {
	await resetCompetitionCommands();
	gMode = MODE.CLEAR;
}

export function btnCompetitionAClear_click(event) {
	$w('#txtCompetitionWinners').text = "";
}

export function btnCompetitionBCLear_click(event) {
	$w('#txtCompetitionSeconds').text = "";
}

export async function btnCompetitionA_click(event) {
	let wGender = $w('#rgpCompetitionMix').value;
	let wNo = parseInt($w('#rgpCompetitionGameType').value,10);
	let [wNamesArray, wNames] = await getNames(wGender, wNo);
	gWinnersArray = wNamesArray;
	$w('#txtCompetitionWinners').text = wNames;
}

export async function btnCompetitionB_click(event) {
	let wGender = $w('#rgpCompetitionMix').value;
	let wNo = parseInt($w('#rgpCompetitionGameType').value,10);
	let [wNamesArray, wNames] = await getNames(wGender, wNo);
	gSecondsArray = wNamesArray;
	$w('#txtCompetitionSeconds').text = wNames;
}

export async function btnCompetitionPrime_click(event) {

	$w('#imgWait').show();
	$w('#boxCompetitionCreate').collapse();
	$w('#boxCompetitionEdit').collapse();
	$w('#boxCompetitionPrimeEdit').expand();
	$w('#boxCompetitionList').collapse();
	$w('#boxCompetitionPrime').collapse();
	$w('#btnCompetitionCreate').hide();
	$w('#btnCompetitionToReference').hide();
	$w('#btnCompetitionUpdate').hide();
	$w('#btnCompetitionDelete').hide();
	$w('#btnCompetitionSave').show();
	$w('#btnCompetitionCancel').show();
	let wCompetition = await getCheckedItem(COMPETITION_TYPE.COMPETITION);
	if (wCompetition.status !== COMPETITION.NEW){
		showError("comp", 5);
		return;
	}
	populateEdit(COMPETITION_TYPE.COMPETITION, wCompetition);
	await populatePrimeEdit(wCompetition);
	gMode = MODE.PRIME;
	$w('#imgWait').hide();
 
}
export async function btnReset_click(event) {
	$w('#imgWait').show();
	let wCompetition = await getCheckedItem(COMPETITION_TYPE.COMPETITION);
	if (wCompetition.status === COMPETITION.IN_PROGRESS || wCompetition.status === COMPETITION.CLOSED){
		showError("comp", 6);
		return;
	}
	let res = await resetCompetition(wCompetition.compYear, wCompetition.compRef);
	console.log("reset, res")
	console.log(res);
	await refreshRptCompetition(res);
	$w('#imgWait').hide();
}

async function doPrime() {
	let wCompetitions = getCompetitionSelectedItems();
	$w('#imgWait').show();

	let wManagedCompetitions = wCompetitions.filter( competition => competition.maintainedBy === "A");
	let wKOs = wManagedCompetitions.filter( competition => competition.shape === "KO");
	let wOthers = wManagedCompetitions.filter( competition => competition.shape !== "KO");
	//for (let wCompetition of wManagedCompetitions){
	//	if (wCompetition.noCompetitors < 2) {
	//		showMsg(3,4);
	//		return;
	//	}
	//}
	
	if (wKOs.length > 0) {await performPrimeKOs(wKOs)}
	if (wOthers.length > 0 ) {await performPrimeOthers(wOthers)}
	if (wManagedCompetitions.length === 0 ) {
		showMsg(2,4);
	}
	gMode = "";
	$w('#imgWait').hide();
}

async function performPrimeKOs(pComps){
	let wRoundDates = [];
	for (let wComp of pComps){
		//console.log("Prime KO ", wComp.title, wComp.noCompetitors);
		gCompetition = wComp;
		$w('#rptCompetitionRounds').forEachItem ( ($item, itemData, index) => {
			let wDate = new Date(itemData.roundDate);
			wDate.setHours(10,0,0,0);
			wRoundDates.push(wDate);
		})
		await addKO($w('#rptCompetitionRounds').data.length);
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
	wNo = parseInt($w('#inpCompetitionPrimeNoCompetitors').value,10);
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
	console.log("Prime Other ", pComps[0].title);
	let wS = JSON.stringify(pComps);
	console.log(wS);
	let wURL = `/manage-club-comp?comps=${wS}`;
	wixLocation.to(wURL);
}
	/**
	 * if (!($w('#inpCompetitionCompRef').valid && $w('#inpCompetitionTitle').valid)) {
        //showSaveMessage(3);
        return;
    }
	let wNoTeams = 1;
	let wIsHomeAway = "H";
	let wCode = $w('#inpCompetitionCompRef').value;
	let wId = $w('#txtCompetitionId').text;
	let wMix = $w('#rgpCompetitionMix').value;
	let wVal = "N";
	let wType = $w('#rgpCompetitionGameType').value;
	let wTitle = $w('#inpCompetitionTitle').value.trim();
	let wOrder = 0;
	let wMaint = "A"; //TODO do we need to prime M types?
	//let wURL = `/add-club-comp?ext=${wVal}&id=${wId}&noTeams=${wNoTeams}&isHA=${wIsHomeAway}&code=${wCode}&mix=${wMix}&type=${wType}&order=${wOrder}&maint=${wMaint}&title="${wTitle}"`;
	*/



export async function btnCompetitionToReference_click(event) {
	let wFirstRow = { "_id": "hdr", "title": "Header", "maintainedBy": "A"};
	$w('#boxReferenceEdit').collapse();
	$w('#boxReferenceCommands').expand();
	gReferences = await getReferenceSet();
	updateReferencesWithCompetitions();
	gReferences.unshift(wFirstRow);
	$w('#rptReferenceCompetitions').data = gReferences;
	$w('#cstrpReference').expand();
	$w('#cstrpCompetitions').collapse();
}
// ------------------------------------------------ Competition Supporting functions ---------------------------------------------------------
//

function updateReferencesWithCompetitions() {
	// for each entry in references file, update ladies, mensand mixed fields depending if ComPref found in Competitions
	for (let wRef of gReferences){
		let wBase = wRef.compRef;
		wRef.ladies = isInCompetitions(wBase + "L");
		wRef.mens = isInCompetitions(wBase + "M");
		wRef.mixed = isInCompetitions(wBase + "X");
	}
}

function isInCompetitions(pCompRef){
	return gCompetitions.some( item => item.compRef === pCompRef);
}

function countCompetitionSelectedItems() {
	let count = 0;
	let wIds = [];
	$w('#rptCompetition').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkCompetitionSelect').checked) { count++ }
	})
	return [wIds, count];
}

function getCompetitionSelectedItems() {
	let wItems = [];
	$w('#rptCompetition').forEachItem( ($item, itemData, index) =>  { 
		if ($item('#chkCompetitionSelect').checked) { wItems.push(itemData) }
	})
	return wItems;
}

export async function resetCompetitionCommands() {
	$w('#inpCompetitionTitle').value = null;
	$w('#inpCompetitionCompRef').value = null;
	$w('#chkCompetitionSelect').checked = false;
	$w('#rgpCompetitionMaintainedBy').value = MAINTAINED.AUTO;
	$w('#rgpCompetitionGameType').value = "1";
	$w('#drpCompetitionShape').value = "KO";

	$w('#boxCompetitionEdit').collapse();
	$w('#boxCompetitionPrimeEdit').collapse();
	$w('#boxCompetitionList').expand();
	$w('#boxCompetitionCreate').collapse();
	$w('#boxCompetitionPrime').collapse();


	$w('#fieldS1').value = null;
	$w('#fieldS2').value = MIX.LADIES;
	$w('#fieldS2A').value = "KO";
	$w('#fieldS3').value = null;
	$w('#fieldS4').value = "M";
	$w('#fieldS4A').value = "Y";
	$w('#fieldS4B').value = "Y";
	$w('#fieldS5').value = "S";
	$w('#fieldS6').value = "P";

	$w('#btnCompetitionCreate').show();
	$w('#btnCompetitionToReference').show();
	$w('#btnCompetitionUpdate').hide();
	$w('#btnCompetitionDelete').hide();
	$w('#btnCompetitionSave').hide();
	$w('#btnCompetitionCancel').hide();
	let wSummary = [];
	switch (gMode) {
		case MODE.CREATE:
		case MODE.DELETE:
		case MODE.UPDATE:
			wSummary = await initialiseData(gYear);
			$w('#tblSummary').rows = wSummary;;
			break;
		default:
			break;
	}
	$w('#msbNewCompetition').changeState(MSB_STATE.S1)
		.then ( () => {
			$w('#fieldS1').focus();
		})
}

function populateEdit(pType, pRec) {
	if (pType === COMPETITION_TYPE.COMPETITION) {
		$w('#inpCompetitionTitle').value = pRec.title;
		$w('#inpCompetitionCompRef').value = pRec.compRef; 
		$w('#rgpCompetitionMaintainedBy').value = pRec.maintainedBy; 
		$w('#rgpCompetitionInTableDisplay').value = pRec.inTableDisplay; 
		$w('#rgpCompetitionBookable').value = pRec.bookable; 
		$w('#drpCompetitionShape').value = pRec.shape; 
		$w('#rgpCompetitionMix').value = pRec.mix;
		$w('#rgpCompetitionGameType').value = pRec.gameType;
		$w('#rgpCompetitionCompetitorType').value = getCompetitorType(pRec.competitorType);
		$w('#inpCompetitionNoCompetitors').value = pRec.noCompetitors;
		$w('#inpCompetitionYear').value = pRec.compYear;
		$w('#drpCompetitionStatus').value = pRec.status;
		$w('#inpCompetitionOrder').value = pRec.order;
		$w('#inpCompetitionNoStages').value = pRec.noStages;
		$w('#txtCompetitionWinners').text = toString(pRec.winnerNames);
		$w('#txtCompetitionSeconds').text = toString(pRec.secondNames);
	} else { 
		$w('#inpReferenceTitle').value = pRec.title;
		$w('#inpReferenceCompBase').value = pRec.compRef; 
		$w('#rgpReferenceAuto').value = pRec.maintainedBy; 
		$w('#rgpReferenceInTableDisplay').value = pRec.inTableDisplay; 
		$w('#rgpReferenceBookable').value = pRec.bookable; 
		$w('#rgpReferenceShape').value = pRec.shape; 
		$w('#rgpReferenceGameType').value = pRec.gameType;
	} 
}

async function populatePrimeEdit(pRec) {
	$w('#lblTitle').value = pRec.title;
	$w('#lblCompRef').value = pRec.compRef; 
	$w('#inpCompetitionPrimeNoCompetitors').value = pRec.noCompetitors;
	await doInpCompetitionNoCompetitorsChange($w('#inpCompetitionNoCompetitors').value);
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
		}
	}
	return [wNameArray, wNames];
}

function refreshRptCompetitionEntry(pComp){
	$w('#rptCompetition').forItems([pComp._id],($item) => {
		console.log("Refresh");
		console.log(pComp._id);
		$item('#lblCompetitionSelect').hide();
		$item('#chkCompetitionSelect').show();
		$item('#chkCompetitionSelect').checked = false;
		$item('#lblCompetitionTitle').text = pComp.title;
		$item('#lblCompetitionMix').text = pComp.mix;
		$item('#lblCompetitionCompRef').text = pComp.compRef;
		$item('#lblCompetitionStatus').text = pComp.status;
		$item('#lblCompetitionManaged').text = pComp.maintainedBy;
		$item('#chkCompetitionSelect').checked = false;
	})
}


function showError(pType, pErr, pMsg) {
	let wMsg = ["Competition deleted",
				"There was a problem deleting this competitiong",
				"Please correct input errors shown",
				"Competition created",
				"Competition already primed",
				"Competition in use"
	];
	let wField = $w('#txtCompetitionErrMsg');
	if (pType === "Ref"){
		wField = $w('#txtReferenceErrMsg');
	}
	if (pErr === 0) {
		wField.text = pMsg
	} else {
		wField.text = wMsg[pErr-1];
	}
	wField.expand();
	setTimeout(() => {
		wField.collapse();
	}, 8000);
	return
}

export function inpCompetitionCompRef_change(event) {
	let wCompRef = event.target.value;
	$w('#inpCompetitionCompRef').value = String(wCompRef).toUpperCase();
}

export async function SNext_click(event) {
	await changeState(MSB_STATE.NEXT);
}

export async function SPrevious_click(event) {
	await changeState(MSB_STATE.PREVIOUS);
}

async function changeState(pType){
	let wCurrentState = await $w('#msbNewCompetition').currentState.id;
	let wN = parseInt(String(wCurrentState).charAt(1),10);
	let wNoOfStates = $w('#msbNewCompetition').states.length;
	let wThisState = "S" + String(wN);
	let wNextState = "S";
	if (wN === wNoOfStates){ 		// caters for back button on last state page
		wNextState = wNextState + String(wN - 1);
		$w('#msbNewCompetition').changeState(wNextState);
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
		$w('#msbNewCompetition').changeState(wNextState)
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

export function msbNewCompetition_change(event) {
	$w('#lblS7Title').text = $w('#fieldS1').value;
	$w('#lblS7Mix').text = resolveMix($w('#fieldS2').value);
	$w('#lblS7Shape').text = resolveShape($w('#fieldS2A').value);
	$w('#lblS7CompRef').text = $w('#fieldS3').value;
	$w('#lblS7Automatic').text = resolveAutomatic($w('#fieldS4').value);
	$w('#lblS7Display').text = $w('#fieldS4A').value;
	$w('#lblS7Bookable').text = $w('#fieldS4B').value;
	$w('#lblS7GameType').text = resolveGameType($w('#fieldS5').value);
	$w('#lblS7CompetitorType').text = resolveCompetitorType($w('#fieldS6').value);
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
	await resetCompetitionCommands();
	gMode = MODE.CLEAR;
}

export async function btnS7Cancel_click(event) {
	await resetCompetitionCommands();
	gMode = MODE.CLEAR;
}

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

function showMsg(pErr, pSec, pControl = "txtCompetitionErrMsg") {
	let wSecs = pSec * 1000;
	let wMsg = ["Only default Knock Outs can be primed in bulk",				// 1
				"No managed competitions selected",
				"Number of Competitors must be greater than 1", 
				"All dates need to be valid to update stored range",
				"Bookings start from 1st June",									// 5
				"Must be a booking to edit",
				"Must be a player, the booker or a manager to edit booking",
				"Booking must be within next 14 days",
				"Cannot move or edit a completed game",
				"Must be a manager to edit a Competition booking",				// 10
				"Must be a manager to edit this booking",
				"No games to display",
				"Bookings updated",
				"You need to select a Player A",
				"This rink slot has been taken since you selected it",			// 15
				"The database record was not saved",
				"Cannot delete a Ladder game. Use Move instead",
				"Must be a manager to edit a Competition booking",
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
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export async function inpCompetitionPrimeNoCompetitors_change(event) {

	let wNo = event.target.value;
	await doInpCompetitionNoCompetitorsChange(wNo);
}

export async function doInpCompetitionNoCompetitorsChange(pNo){
	let wKOType = "S";		// these are pre-set
	let wFinalsType = "2";
    let [wNoRounds, wNoByes, wNoMatches] = await calcParameters(wKOType, wFinalsType,pNo);
	let [wId, wData] = await getSettingsRoundDateArray(wNoRounds);
	$w('#lblCompetitionDateRangeId').text = wId;
	$w('#rptCompetitionRounds').data = wData;
}

/**
*	Adds an event handler that runs when the element receives focus.
	[Read more](https://www.wix.com/corvid/reference/$w.FocusMixin.html#onFocus)
*	 @param {$w.Event} event
*/
let gSelectedItem;

export function inpCompetitionRoundDate_focus(event) {
	gSelectedItem = $w.at(event.context);
	let wDate = new Date();
	$w('#boxMatch').style.backgroundColor = NORMAL_COLOR;
	gSelectedItem('#boxMatch').style.backgroundColor = SELECTED_COLOR;
	if (gSelectedItem('#inpCompetitionRoundDate').value.length > 0){
		let wDateString = gSelectedItem('#inpCompetitionRoundDate').value;
		wDate = new Date(wDateString);
	}
	$w('#dpkrPlayByDate').value = wDate;
	$w('#dpkrPlayByDate').show();
	$w('#dpkrPlayByDate').focus();
}

export function dpkrPlayByDate_change(event) {
	let wDate = formatDateString(event.target.value, "Long");
	if (gSelectedItem) {
		gSelectedItem('#inpCompetitionRoundDate').value = wDate;
		$w('#dpkrPlayByDate').hide();
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

	console.log(gCompetition);
    let wCompId = gCompetition._id;
    let wCompRec = await getClubCompById(wCompId);

    wCompRec.noStages = 1;
    wCompRec.status = "S";
    //TODO: we may need to update status also

    let result = await saveClubComp(wCompRec);
    if (!result.status) {
        console.log("updateClubComp failed");
        return Promise.reject("Update failed");
    }
    return Promise.resolve("Club Comp Updated");
}


/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
