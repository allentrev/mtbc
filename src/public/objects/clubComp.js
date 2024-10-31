/* eslint-disable no-undef */
//------------------------------------------------------------------------------------------------------
//
//	CLUBCOMP OBJECT
//
//  Desc:   These objects control the Club Competition features in the web site
//
//  Usage:  1)  Maintain CLub Competition Game page
//          2)  Update Club Competition Winner
//          3)  Club CHampionship Winners page
//          4)  lbxClubComp lightbox
//------------------------------------------------------------------------------------------------------
import wixData from 'wix-data';

import { BOOKING }					from './booking';

import { getCompBookings }			from './booking';


/**
 * Enum for Competition object status values
 * @readonly
 * @enum {String}
 */
export const COMPETITION = Object.freeze({
	NEW:		"N",
	SCHEDULED:	"S",
	OPEN:		"O",
	IN_PROGRESS:"P",
	CLOSED:		"C",
	REFERENCE:	"R"

});
 
 // This controls how to interpret the contents of PlayerAId and PlayerBId. If T, then these fields contain the team name as a string.
 // Otherwise, they contain the memberId of the person playing that match.

export const COMPETITOR_TYPE = Object.freeze({
  TEAM:			"T",
  INDIVIDUAL:	"P"
});


/**
 * Enum for Stage object status values
 * @readonly
 * @enum {String}
 */
export const STAGE = Object.freeze({
  NEW:		"N",
  SCHEDULED:"S",
  ACTIVE:	"A",
  COMPLETED:"C"
});


/**
 * Enum for Competitor object status values
 * @readonly
 * @enum {String}
 */
export const COMPETITOR = Object.freeze({
  NEW:		"N",
  ACTIVE:	"P",
  WITHDRAWN:"W",
  DELETED:	"D"
});

export const MAINTAINED = Object.freeze({
  AUTO:		"A",
  MANUAL:	"M"
});

export const BOOKABLE = Object.freeze({
  YES:		"Y",
  NO:		"N"
});

export const MIX = Object.freeze({
  LADIES:	"L",
  MENS:		"M",
  MIXED:	"X"
});
/**
 * Enum for Stage object status values
 * @readonly
 * @enum {String}
 */
export const SHAPE = Object.freeze({
  KO:			"KO",
  KO2:			"KO2",
  LEAGUE:		"LG",
  EP5:			"EP5",		//deprecated
  TRIPLE:		"L2"
});

export const TEMPORARY_HOLDER = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd";

let gComp;
let gStages = [];
let gBookings = [];
let gCompetitors = [];
let gPool = [];

export async function activateCompetition(pCompRef) {
	if (gComp.status === COMPETITION.SCHEDULED) {
		//const wBookingsSet = getAllNewStageBookings(0);
 		//if (!wBookingsSet) {
		//	console.log("ActivateCompetition: empty wBookingsSet")
		//	return false;
		//}
		//const wBookings = wBookingsSet.map ( (obj) => {
		//	obj.status = BOOKING.OPEN;
		//	return obj; 
		//});
		let res = true;
		//res = await bulkUpdateClubCompBookings(wBookings);
		//if (!res) { console.log("activateCompetition fail error 4"); return false};
		res = await updateClubCompStatus(gComp._id, COMPETITION.OPEN)
		if (!res) { console.log("/public/objects/clubComp activateCompetition fail error 1"); return false};
		gComp.status = COMPETITION.OPEN;
		return true;
	}
	console.log("/public/objects/clubComp  Activate Competition gComp Status = ", gComp.status);
	return false;
}

export async function addCompetitorGameScore(pCompId, pWin, pDrawn, pLost, pGameInc, pFor, pAgainst, pBonus, pPoints) {
try {
	//console.log("clubComp AddCompetitorGameScore for  ", pCompId);
	let item = await wixData.get("lstClubCompCompetitors", pCompId);
		if(item) {
			item.played = item.played + pGameInc;
			item.mWon = item.mWon + pWin;
			item.mDrawn = item.mDrawn + pDrawn;
			item.mLost = item.mLost + pLost;
			item.sWon = item.sWon + pBonus;
			item.pointsFor = item.pointsFor + pFor;
			item.pointsAgainst = item.pointsAgainst + pAgainst;
			item.points = item.points + pPoints;
			await wixData.update("lstClubCompCompetitors", item);
			const x = gCompetitors.findIndex(o => o._id === pCompId);
			if (x !== -1) {                     
				gCompetitors[x].played = item.played;
				gCompetitors[x].mWon = item.mWon;
				gCompetitors[x].mDrawn = item.mDrawn;
				gCompetitors[x].mLost = item.mLost;
				gCompetitors[x].sWon = item.sWon;
				gCompetitors[x].pointsFor = item.pointsFor;
				gCompetitors[x].pointsAgainst = item.pointsAgainst;
				gCompetitors[x].points = item.points;
				return true;
			} else {
				console.log("/public/objects/clubComp updateCompetitionDivisionStatus Couldnt find in target ", pCompId);
				return false;
			}
		} else {
			console.log("/public/objects/clubComp addCompetitorGameScore " + pCompId + " competitor not found");
			return false;
		}
}
catch ( err ) {
	console.log("/pubic/objects/clubComp addCompetitorGameScore try catch ", err);
}}

export async function addCompetitorEP5GameScore(pCompId, pmWon, pmDrawn, pmLost,
													 psWon, psDrawn,
													 pGameInc, pPoints,
													 pFor, pAgainst) {
try {
	//console.log("clubComp AddCompetitorEP5GameScore for  ", pCompId);
				// 		[mWin, sWin, sDrawn, GameInc, For, Against]
	let item = await wixData.get("lstClubCompCompetitors", pCompId);
		if(item) {
			item.played = item.played + pGameInc;
			item.mWon = item.mWon + pmWon;
			item.mDrawn = item.mDrawn + pmDrawn;
			item.mLost = item.mLost + pmLost;
			item.sWon = item.sWon + psWon;
			item.sDrawn = item.sDrawn + psDrawn;
			item.points = item.points + pPoints;
			item.pointsFor = item.pointsFor + pFor;
			item.pointsAgainst = item.pointsAgainst + pAgainst;
			await wixData.update("lstClubCompCompetitors", item);
			const x = gCompetitors.findIndex(o => o._id === pCompId);
			if (x !== -1) {
				gCompetitors[x].played = item.played;
				gCompetitors[x].mWon = item.mWon;
				gCompetitors[x].mDrawn = item.mDrawn;
				gCompetitors[x].mLost = item.mLost;
				gCompetitors[x].sWon = item.sWon;
				gCompetitors[x].sDrawn = item.sDrawn;
				gCompetitors[x].points = item.points;
				gCompetitors[x].pointsFor = item.pointsFor;
				gCompetitors[x].pointsAgainst = item.pointsAgainst;
				return true;
			} else {
				console.log("/public/objects/clubComp ddCompetitorEP5GameScore Couldnt find in target ", pCompId);
				return false;
			}
		} else {
			console.log("/public/objects/clubComp ddCompetitorEP5GameScore " + pCompId + " competitor not found");
			return false;
		}
}
catch ( err ) {
	console.log("/pubic/objects/clubComp addCompetitorEP5GameScore try catch ", err);
}}

let wStart = 0;

export function getStage(pStage){
	if (pStage >= 0 ) {
		if (pStage < gStages.length) {
			return gStages[pStage]; 
		} else {
			console.log("/public/objects/clubComp getStage Ref > limit ", pStage);
		 	return false;
		}
	} else {
		console.log("/public/objects/clubComp getStage Ref < 0 ", pStage);
		return false;
	}
}

export async function loadCompetitions(pYear) {
	let wCompetitions = await getAllBookableCompetitions(pYear);
	return wCompetitions;
}


export async function loadManualCompetitions(pYear, pGender) {
	let wDataArray = await getManualCompetitions(pYear, pGender);
	if (wDataArray){
		$w('#drpManualCompetition').options = wDataArray;
		let wCompRef = wDataArray[0].value;
		return true;
	} else {
		showCompetitionError("M", 3, 4);
		$w('#drpManualCompetition').collaspe();
		$w('#drpCompetition').options = [];
		$w('#drpStage').options = [];
		$w('#drpDivision').options = [];
		$w('#drpRound').options = [];
		console.log("/public/objects/clubComp loadManualCompetitions No manual competitions found");
		return false;
	}
}

export function selectCompetition(pYear, pCompRef) {
	//console.log("Select Competition", pCompRef);
	return changeComp(pYear, pCompRef)
	.then( (res) => {
		if (gComp) {
			if (gComp.maintainedBy === "M") {
				resetGlobalArrays();
				return {"competitionObj": gComp, "stageDivObj": false, "matchesInRoundArray": false};
			} else {
				if (res){
					if (gComp.status === COMPETITION.NEW) {
						$w('#lblManagedMsg').text = "Competition is new";
					} else if (gComp.status === COMPETITION.SCHEDULED) {
						$w('#lblManagedMsg').text = "Competition is ready to schedule";
					} else if (gComp.status === COMPETITION.OPEN) {
						$w('#lblManagedMsg').text = "Competition is ready to start";
					} else if (gComp.status === COMPETITION.IN_PROGRESS) {
						$w('#lblManagedMsg').text = "Competition is in progress";
					} else if (gComp.status === COMPETITION.CLOSED) {
						$w('#lblManagedMsg').text = "Competition is closed";
					} else {
						resetGlobalArrays();
						showCompetitionError("A", 5, 4);
						return false;
					}
					let wResultObj = loadStages();
					if (wResultObj){
						$w('#drpStage').enable();
						let wStageDivObj = wResultObj.stageDivObj;
						let wMatchesInRoundArray = wResultObj.matchesInRoundArray;
						if (wMatchesInRoundArray) {
							return {"competitionObj": gComp, "stageDivObj": wStageDivObj,
									"matchesInRoundArray": wMatchesInRoundArray};
						} else  {
							resetGlobalArrays();
							return false;
						}
					} else {
						$w('#drpStage').disable();
						resetGlobalArrays();
						showCompetitionError("A", 6, 4);
						return false;
					}
				} else {
					$w('#drpStage').disable();
					resetGlobalArrays();
					showCompetitionError("A", 6, 4);
					return false;
				} //res
			} // maintainedBy
		} else { 
			resetGlobalArrays();
			return false;
		} // gComp
	})
	.catch ( err => {
		console.log("/public/objects/clubComp selectCompetition carch err ", err);
		resetAllGlobals();
	})
}
export function resetAllGlobals() {
	gComp = {};
	resetGlobalArrays();
}
export function resetGlobalArrays() {
	gStages = [];	
	gBookings = [];
	gCompetitors = [];
	gPool = [];
}

export function showCompetitionError(pType, pErr, pSec) {
	let wMsg = ["No unscheduled matches found for this competition",
				"No competitions found",
				"No manual competitions found",
				"Competition is not ACTIVE",
				"Competition is closed",
				"No stages found."
	];
	let wTarget = (pType === MAINTAINED.AUTO) ? $w('#lblManagedMsg') : $w('#lblManualMsg'); 

	wTarget.text = wMsg[pErr-1];
	wTarget.expand();
	if (pType === MAINTAINED.AUTO) {
		$w('#rptGames').collapse();
	}

	setTimeout(() => {
		wTarget.collapse();
	}, 1000 * pSec);
	return
}

export function changeComp(pYear, pRef) {
	//console.log("Change Comp", pRef);
	
	return Promise.all([getCompetition(pYear, pRef),
				 getCompBookings(pYear, pRef),
				 getCompStages(pYear, pRef),
				 loadCompCompetitors(pYear, pRef)
	]).then( (results) => {
    gComp = results[0];
    gBookings = results[1];
    //console.log("gBookings set up");
    //console.log(gBookings);
    gStages = results[2];
    let wAllRecords = results[3];
    if (gComp && gBookings && gStages && wAllRecords) {
      if (wAllRecords) {
        gCompetitors = wAllRecords.filter((item) => {
          if (item.competitorId > 0) {
            return item;
          }
        });
        gPool = wAllRecords.filter((item) => {
          if (item.competitorId === 0) {
            return item;
          }
        });
      } else {
        gCompetitors = [];
        gPool = [];
      }
      return true;
    } else {
      return false;
    }
    /**
		console.log("Change comp");
		console.log(gComp);
		console.log(gStages);
		console.log(gCompetitors);
		console.log(gBookings);
		return true;
		// */
  })
	.catch( (err) => {
		console.log("/public/objects/clubComp  changeComp Catch Error");
		console.log(err);
		return false;
	})
}

export function getFirstActiveDiv() {
	let wDivs = gStages;
	for (let wDivIdx in wDivs) { 
		if (wDivs[wDivIdx].status === STAGE.ACTIVE) { 
			return {"index": wDivIdx, "divs": wDivs};
		}
	}
	return false;
}


export function getFirstDiv() {
	return {"index": 0, "divs": gStages};
}

export function loadStages() {
	//console.log("Load STages");
	if (gStages) {
		const uniqueRecs = getUniqueStages(gStages);
		let wDataArray = buildOptions(uniqueRecs);
		if (wDataArray){
			$w('#drpStage').options = wDataArray;
			let wStage = parseInt(wDataArray[0].value,10);
			$w('#drpStage').selectedIndex = 0;
			let wResultObj = selectStage(0);
			if (wResultObj) {
				return wResultObj;
			} else {
				console.log("/public/objects/clubComp loadStages selectSTage fail");
				return false;
			}
		} else {
			$w('#lblStageState').text = "No stages found";
			$w('#drpStage').options = [];
			$w('#drpDivision').options = [];
			$w('#drpRound').options = [];
			console.log("/public/objects/clubComp loadStages No stages found ", gComp.compRef);
			return false;
		}
	} else { 
		$w('#lblStageState').text = "No stages found";
		$w('#drpStage').options = [];
		$w('#drpDivision').options = [];
		$w('#drpRound').options = [];
		return false;
	}
}

function getUniqueStages(items) {
    const titlesOnly = items.map(item => item.stage);
    return [...new Set(titlesOnly)];
}

function buildOptions(uniqueList) {
	return uniqueList.map(item => {
        return {label:String(item), value:String(item)};
    });
}

export function selectStage(intStage){
	//console.log("Select Stage", intStage);
	let wResultObj = loadDivisions(intStage);
	if (wResultObj) {
		$w('#drpDivision').enable();
		return wResultObj;
	} else {
		$w('#drpDivision').disable();
		console.log("/public/objects/clubComp selectStage loadDivisions fail");
		return false;
	}
}

export function loadDivisions(intStage) {
	//console.log("Loaf Division", intStage);
//ts"load div");
	const uniqueRecs = getUniqueDivisions(gStages, intStage);
	let wDataArray = buildDivisionOptions(uniqueRecs);
	if (wDataArray){
		$w('#drpDivision').options = wDataArray;
		$w('#drpDivision').selectedIndex = 0;

		let wResultObj = selectDivision(intStage, 0);
	
		//let wResultObj = await selectDivision(objCompetition, intStage, wDiv);
		if (wResultObj) {
			return wResultObj;
		} else {
			console.log("/public/objects/clubComp loadDivisions selectDivision fail");
			return false;
		}
	} else {
		$w('#lblDivisionState').text = "No Divisions found";
		$w('#drpDivision').options = [];
		$w('#drpRound').options = [];
		//console.log("No divisions found ", intStage);
		return false;
	}
}

function getUniqueDivisions(items, pStage) {
	const filteredArray = items.filter(item => item.stage === pStage);
    const divisionsOnly = filteredArray.map(item => item.division);
    return [...new Set(divisionsOnly)];
}

function buildDivisionOptions(uniqueList) {
	return uniqueList.map( (item, index) => {
        return {label:String(item), value:String(index)};
    });
}
export function selectDivision(intStage, intDiv){
	//console.log("Select Division", intStage, intDiv);
//const wCompRef = objCompetition.compRef;
	//let wStageDivObj = await getCompetitionDivision(wCompRef, intStage, intDiv);
	let wStages = gStages.filter(item => item.stage === intStage);
	let wStageDivObj = wStages.filter(item => item.div === intDiv)[0];
	switch (wStageDivObj.status) {
		case STAGE.NEW:
			$w('#lblDivisionState').text = "Division needs populating";
			break;
		case STAGE.SCHEDULED:
			$w('#lblDivisionState').text = "Division is scheduled";
			break;
		case STAGE.ACTIVE:
			$w('#lblDivisionState').text = "Division is active";
			break;
		case STAGE.COMPLETED:
			$w('#lblDivisionState').text = "Division is completed";
			break;
		default:
			$w('#lblDivisionState').text = "Division is unknown state";
			return false;
			break;
	}
	const wNoRounds = parseInt(wStageDivObj.noRounds,10);
	let wMatchesInRoundArray = loadRounds(intStage, intDiv, wNoRounds);
	//let wMatchesInRoundArray = await loadRounds(objCompetition, intStage, intDiv, parseInt(wStageDivObj.noRounds,10))
	if (wMatchesInRoundArray) {
		$w('#drpRound').enable();
		return {"stageDivObj": wStageDivObj, "matchesInRoundArray": wMatchesInRoundArray};
	} else {
		$w('#drpRound').disable();
		console.log("/public/objects/clubComp selectDivision wMatchesInRoundArray fail");
		return false;
	}
	
}

export function loadRounds(intStage, intDiv, intNoRounds) {
	//console.log("Load Rounds", intStage, intDiv, intNoRounds);
	let wOptions = fillRoundOptions(intNoRounds);
	$w('#drpRound').options = wOptions;
	$w('#drpRound').selectedIndex = 0;
	let wMatchesInRoundArray = selectRound(intStage, intDiv, 1);
	if (wMatchesInRoundArray) {
		return wMatchesInRoundArray;
	} else {
		console.log("/public/objects/clubComp loadRounds selectRound fail");
		return false;
	}
}

export function selectRound(intStage, intDiv, intRound){
	//console.log("Select Round", intStage, intDiv, intRound);
	let wMatchesInRoundArray;
	if (gComp.status === COMPETITION.NEW) {
		wMatchesInRoundArray = getRoundBookings(gBookings, intStage, intDiv, intRound)
	} else {
		wMatchesInRoundArray = getRoundBookings(gBookings, intStage, intDiv, intRound)
	}
	if (wMatchesInRoundArray) {
		// eslint-disable-next-line no-undef
		$w('#lblRoundState').text = "Found " + String(wMatchesInRoundArray.length) + " match(es)";
		return wMatchesInRoundArray;
	} else {
		// eslint-disable-next-line no-undef
		$w('#lblRoundState').text = "No matches found ";
		return false;
	}
}

function getRoundBookings(items, pStage, pDiv, pRound) {
	if (!items) { return false }
	let wFilter = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") 
				+ "R" + String(pRound - 1).padStart(2,"0");
	const filteredArray = items.filter( item => item.matchKey !== undefined)
								.filter( item => item.matchKey !== null)			
								.filter(item => item.matchKey.substring(0,9) === wFilter);
	return filteredArray;
}

export function getUnscheduledMatches() {

	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)		
									.filter(item => item.status !== BOOKING.MOVED)
									.filter(item => item.status !== BOOKING.DELETED)
									.filter(item => item.status !== BOOKING.COMPLETED)
									.filter(item => item.playerAId !== TEMPORARY_HOLDER)
									.filter(item => item.playerBId !== TEMPORARY_HOLDER)

	return filteredArray;
}

//========================================================================================================
/**
 * 
 */
export async function bulkUpdateCompetitors(pData) {

	return wixData.bulkUpdate("lstClubCompCompetitors", pData)
  		.then( (results) => {
			console.log("/public/objects/clubComp bulkUpdateCompetitors Result");
			console.log(results);
			gCompetitors = copyArray(pData, gCompetitors);
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/clubComp bulkUpdateCompetitors Catch " + errorMsg);
			return false;
		});
}
/**
 * 
 */

export function bulkSaveClubCompStages(pData) {

	return wixData.bulkSave("lstClubCompStages", pData)
  		.then( () => {
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/clubComp bulkSaveClubCompStages Catch " + errorMsg);
			return false;
		});
}

/**
 * 
 */
export async function loadLeagueTable(objCompetition, intStage, intDiv) {
	return wixData.query('lstClubCompCompetitors')
		.eq('compRef', objCompetition.compRef)
		.eq('stage', intStage)
		.eq('div', intDiv)
        .descending('pointsFor')
		.ascending('pointsAgainst')
		.ascending("hcp")
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp loadLeagueTable Catch " + err);
			return false;
		})
}

export async function loadEP5Table(objCompetition, intStage, intDiv) {
	return wixData.query('lstClubCompCompetitors')
		.eq('compRef', objCompetition.compRef)
		.eq('stage', intStage)
		.eq('div', intDiv)
        .descending('pointsFor')
		.descending('sWon')
		.descending("sDrawn")
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp loadEP5Table Catch " + err);
			return false;
		})
}

export async function loadL2Table(objCompetition, intStage, intDiv) {
	return wixData.query('lstClubCompCompetitors')
		.eq('compRef', objCompetition.compRef)
		.eq('stage', intStage)
		.eq('div', intDiv)
        .descending('points')
		.descending('pointsFor')
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp loadL2Table Catch " + err);
			return false;
		})
}

/**
 * 
 */
export async function loadStageCompetitors(objCompetition, intStage) {
	const filteredArray = gCompetitors.filter(item => item.stage === intStage);
	return filteredArray;

/**
 * 	return wixData.query('lstClubCompCompetitors')
		.eq('compRef', objCompetition.compRef)
		.eq('stage', intStage)
		.ascending('div')
		.ascending('competitorId')
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp loadStageCompetitors Catch " + err);
			return false;
		})
*/
}

/**
 * 
 */
export function loadCompCompetitors(pYear, pCompRef) {
	return wixData.query('lstClubCompCompetitors')
		.eq('compRef', pCompRef)
		.eq("compYear", pYear)
		.ascending('stage')
		.ascending('div')
		.ascending('competitorId')
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp loadCompCompetitors Catch " + err);
			return false;
		})
}

export function getAllTeams(pComps) {
	return wixData.query('lstClubCompCompetitors')
		.hasSome('compRef', pComps)
		.eq("status",COMPETITOR.ACTIVE)
		.ne("competitorId", 0)
		.ascending("compRef")
		.ascending('div')
		.ascending('competitorId')
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp getAllTeams Catch " + err);
			return false;
		})
}
/**
 * 
 */
export function bulkSaveClubCompCompetitors(pData) {

	return wixData.bulkSave("lstClubCompCompetitors", pData)
  		.then( () => {
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/clubComp bulkSaveClubCompCompetitors Catch " + errorMsg);
			return false;
		});
}

export function getCompetition(pYear, pCompRef) {
	return wixData.query("lstClubComp")
		.eq("compRef", pCompRef)
		.eq("compYear", pYear)
		.ascending("order")
		.find()
		.then( (results) => {
			if (results.items.length ===  0) {
				return false;
			} else if (results.items.length > 1) {
				return false;
			} else {
				return results.items[0];
			}
		})
        .catch( (error) => {
            console.log("/public/objects/clubComp getCompetition catch ", pYear, pCompRef, error);
			return false;
        });

}


//------------------------------------------------------------------------------------------------------
//
//	Function:	getOpenCompetitions
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getCompetitions(pYear) {
    return wixData.query("lstClubComp")
        .eq("maintainedBy", "A")
		.eq("compYear", pYear)
		.ascending("mix")
		.ascending("compRef")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					let wGender = "Mixed";
					if (item.mix === MIX.LADIES) { 
						wGender = "Ladies";
					} else if (item.mix === MIX.MENS) { 
						wGender = "Men's";
					}
					return {
						label:  "( " + wGender + " ) " + item.title,
						value: item.compRef
					}
                })
                return dlist;
            } else {
				return false;
			}
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getCompetitions catch " + errorMsg);
			return false;
        } );
}

export async function getManualCompetitions(pYear, pGender) {
    return wixData.query("lstClubComp")
        .eq("maintainedBy", MAINTAINED.MANUAL)
		.eq("bookable", BOOKABLE.YES)
		.eq("compYear", pYear)
		.eq("mix", pGender)
		.ascending("compRef")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					let wGender = "Mixed";
					if (item.mix === MIX.LADIES) { 
						wGender = "Ladies";
					} else if (item.mix === MIX.MENS) { 
						wGender = "Men's";
					}
					return {
						label:  "( " + wGender + " ) " + item.title,
						value: item.compRef
					}
                })
                return dlist;
            } else {
                console.log("/public/objects/clubComp getManualCompetitions 0 results");
				return false;
			}
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getManualCompetitions catch " + errorMsg);
			return false;
        } );
}
/**
 * Summary - Retrieves all bookable competitions for a given year.
 * 
 * @function
 * @param {number} pYear - The year for which competitions are to be retrieved.
 * 
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of bookable competition items.
 * 
 * @throws {Error} Throws an error if the query operation fails.
 *
 */
export function getAllBookableCompetitions(pYear) {
    try {
		return wixData.query("lstClubComp")
			.eq("compYear", pYear)
			.eq("bookable", BOOKABLE.YES)
			.descending("maintainedBy")
			.ascending("compTitle")
			.find()
			.then( (results) => {
				return results.items;
			})
			.catch( (error) => {
				let errorMsg = error.message;
				let code = error.code;
				console.log("/public/objects/clubComp getAllBookableCompetitions catch " + code + " " + errorMsg);
				return [];
			} );
	}
    catch (error) {
	   	console.log("/public/objects/clubComp getAllBookableCompetitions TryCatch ");
		console.log(error);
        Promise.reject("Try_Catch error");
    }
}

export function loadCompetitionArray() {
    return wixData.query("lstClubComp")
		.ascending("mix")
		.ascending("order")
		.ascending("compRef")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
                return results.items;
            } else {
                console.log("/public/objects/clubComp loadCompetitionArray 0 results");
				return [];
			}
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp loadCompetitionArray catch " + errorMsg);
			return [];
        } );
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getOpenCompetitions
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export function loadOpenTeamCompetitions() {
    return wixData.query("lstClubComp")
        .eq("maintainedBy", MAINTAINED.AUTO)
		.eq("status", COMPETITION.OPEN)
		.ne("gameType",1)
		.ascending("mix")
		.ascending("compRef")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					return item.compRef
                })
                return dlist;
            } else {
                console.log("/public/objects/clubComp loadOpenTeamCompetitions 0 results");
				return [];
			}
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp loadOpenTeamCompetitions catch " + errorMsg);
			return [];
        } );
}

export async function getOpenCompetitions2() {
    return wixData.query("lstClubComp")
        .eq("maintainedBy", MAINTAINED.AUTO)
		.ne("status", COMPETITION.CLOSED)
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					return {
						label: item.title,
						value: item.compRef
					}
                })
                return dlist;
            } else {
                console.log("/public/objects/clubComp getOpenCompetitions 0 results");
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getOpenCompetitions catch " + errorMsg);
			return false;
        } );
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getCompetitionStages
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getCompetitionStages2(pCompRef) {
    return wixData.query("lstClubCompStages")
        .eq("compRef", pCompRef)
		.ascending("stage")
		.distinct("stage")
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					return {
						label: String(item),
						value: String(item)
					}
                })
                return dlist;
            } else {
                console.log("/public/objects/clubComp getCompetitionStages 0 results ", pCompRef);
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getCompetitionStages catch " + errorMsg);
			return false;
        } );
}

export function getCompStages(pYear, pCompRef) {
    return wixData.query("lstClubCompStages")
        .eq("compRef", pCompRef)
		.eq("compYear", pYear)
		.ascending("stage")
		.ascending("div")
		.find()
		.then(results => {
            if(results.items.length > 0) {
        	   return results.items;
            } else {
                console.log("/public/objects/clubComp getCompStages 0 results ", pYear, pCompRef);
				return false;
            }
		})
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getCompetitionStages catch " + errorMsg);
			return false;
        });
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	getCompetitionUniqueDivisions
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getCompetitionUniqueDivisions2(pCompRef, pStage) {

    return wixData.query("lstClubCompStages")
        .eq("compRef", pCompRef)
		.eq("stage", pStage)
		.ascending("div")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
					return {
						label: item.division,
						value: String(item.div)
					}
                })
                return dlist;
            } else {
                console.log("/public/objects/clubComp getCompetitionUniqueDivisions 0 results for ", pCompRef, pStage);
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/clubComp getCompetitionUniqueDivisions catch " + errorMsg);
			return false;
        } );
}

export async function getCompetitionAllDivisions(pStage) {
   	const filteredArray = gStages.filter(item => item.stage === pStage);
    //console.log("getAllDIvs, filteredArray");
	//console.log(filteredArray);
	return filteredArray;

/**	
	return wixData.query("lstClubCompStages")
        .eq("compRef", pCompRef)
		.eq("stage", pStage)
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
				return results.items;
            } else {
                console.log("/public/objects/clubComp getCompetitionAllDivisions 0 results");
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.log("/public/objects/clubComp getCompetitionAllDivisions catch " + errorMsg);
			return false;
        } );
*/
}

//------------------------------------------------------------------------------------------------------
//
//	Function:   getCompetitionDivision
//
//  Inputs:		i1		Object	compRef
//	Output:		o2	    Object  ClubComp
//				false	Boolean	no record found
//
//------------------------------------------------------------------------------------------------------
export async function getCompetitionDivision2(pCompRef, pStage, pDiv) {
    try {
       	const results = await wixData.query("lstClubCompStages")
    		.eq("compRef", pCompRef)
			.eq("stage", pStage)
			.eq("div", pDiv)
    		.ascending("order")
			.find();
		if (results.items.length ===  0) {
			return false;
		} else if (results.items.length > 1) {
			return false;
		} else {
			return results.items[0];
		}
    }
    catch (error) {
	   	console.log("/public/Objects/clubComp getCompetitionDivision TryCatch " + error);
        return false
    }
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getCompetitionStageCompetitors
//
//  Inputs:		none
//	Output:		res{}	Object array	list of Club Competition records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getCompetitionDivisionCompetitors2(pCompRef, pStage, pDiv) {
	let res = await wixData.query('lstClubCompCompetitors')
		.eq("compRef", pCompRef)
		.eq("stage", pStage)
		.eq("div", pDiv)
		.ascending("competitorId")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		return res.items;
	}
}

export async function getCountCompetitionOpenDivs(pCompRef, intStage) {

	const filteredArray = gStages.filter(item => item.stage === intStage)
								.filter(item => item.status !== STAGE.NEW)
								.filter(item => item.status !== STAGE.COMPLETED);
	return filteredArray.length;
}

export async function getCountCompetitionOpenDivs2(pCompRef, intStage) {

	return wixData.query("lstClubCompStages")
		.eq("compRef", pCompRef)
		.eq("stage", intStage)
		.hasSome("status",["S", "A"])
		.count()
		.then( (num) => {
			return num;
		})
		.catch( (err) => {
			console.log("/public/objects/clubComp getCountCompetitionOpenDivs2 catch fail ", err);
			return 0;
		})
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getAllClubComp
//
//  Inputs:		none
//	Output:		res{}	Object array	list of Club Competition records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getAllClubComp(pYear) {
	let res = await wixData.query('lstClubComp')
		.eq("maintainedBy", MAINTAINED.AUTO)
		.eq("status", COMPETITION.CLOSED)
		.eq("compYear",pYear)
		.ascending("title")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		return res.items;
	}
}

export async function loadCompetitors2(pCompRef, pStage, pDiv) {
	///console.log("Loading competitors", pCompRef, pStage, pDiv);
	let wData = await getCompetitionDivisionCompetitors2(pCompRef, pStage, pDiv);
	//console.log(wData);
	if (wData && wData.length > 0){
		return wData;
	}
	return false;
}

export function loadGlobalCompetitors() {
	return gCompetitors;
}

export function loadGlobalBookings() {
	return gBookings;
}


export function loadGlobalStages() {
	return gStages;
}

export function getCompetitorSkipId(pId) {
	const wCompetitors = gCompetitors.filter(item => item._id === pId);
	const wCompetitor = wCompetitors[0];
	return wCompetitor.skipId;
}


export function getTeamCompetitor(pTeamName) {
	const wCompetitors = gCompetitors.filter(item => item.teamName === pTeamName);
	const wCompetitor = wCompetitors[0];
	return wCompetitor;
}

export function loadDivCompetitors(pStage, pDiv) {
	const filteredArray = gCompetitors.filter(item => item.stage === pStage)
									.filter(item => item.div === pDiv);
	return filteredArray;
}

export function loadDivPool(pStage, pDiv) {
	const filteredArray = gPool.filter(item => item.stage === pStage)
									.filter(item => item.div === pDiv);
	return filteredArray;
}
//------------------------------------------------------------------------------------------------------
//
//	Function:	insertClubComp
//
//  Inputs:		pRec	Object	toInsert record
//	Output:		id		String	nidentifier of the inserted record
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function insertClubComp(pRec) {
  	try {
		// eslint-disable-next-line no-unused-vars
		const {selected, ladies, mens, mixed, ...pNewRec } = pRec;
		let results = await wixData.insert("lstClubComp", pNewRec)
  		if	(results) {
			return results._id;
		} else {
			console.log("/public/objects/clubComp insertClubComp Insert failed: Result=", results);
			return false;
		}
	  }
	catch (error) {
		console.log("/public/objects/clubComp insertClubComp TryCatch " + error);
		return false;
	}
}

export async function updateClubComp(pId, pRec) {

	return wixData.get("lstClubComp", pId)
  		.then( (item) => {
			item.status = pRec.status;
			item.winnerNames = pRec.winnerNames;
			item.secondNames = pRec.secondNames;
    	wixData.update("lstClubComp", item);
			gComp.status = pRec.status;
			gComp.winnerNames = pRec.winnerNames;
			gComp.secondNames = pRec.secondNames;
  		return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/clubComp updateClubComp catch err ", err)
			return false;
  		} );
}

export async function updateClubCompStatus(pId, pStatus) {

	return wixData.get("lstClubComp", pId)
  		.then( (item) => {
			item.status = pStatus;
    	wixData.update("lstClubComp", item);
		gComp.status = pStatus;
  		return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/clubComp updateClubCompStatus catch err ", err)
			return false;
  		} );
}

export function updateCompetitionDivisionStatus(pId, pStatus) {

	return wixData.get("lstClubCompStages", pId)
  		.then( (item) => {
			item.status = pStatus;
    		wixData.update("lstClubCompStages", item);
			const x = gStages.findIndex(o => o._id === pId);
			if (x !== -1) {
				gStages[x].status = pStatus;
				return true;
			} else {
				console.log("/public/objects/clubComp updateCompetitionDivisionStatus Couldnt find in target ", pId);
				return false;
			}
		})
  		.catch( (err) => {
			console.log("/public/objects/clubComp updateCompetitionDivisionStatus catch err ", err)
			return false;
  		});
}


export async function updateCompetitionDivisionBracket(pId, pBracket) {
	return wixData.get("lstClubCompStages", pId)
  		.then( (item) => {
			item.bracket = pBracket;
    		wixData.update("lstClubCompStages", item);
			// update global record
			const x = gStages.findIndex(o => o._id === pId);
			if (x !== -1) {
				gStages[x].bracket = pBracket;
			} else {
				console.log("/public/objects/clubComp updateCompetitionDivisionBracket Couldnt find in target ", pId);
				return false;
			}
  			return true;
		})
  		.catch( (err) => {
			console.log("/public/objects/clubComp updateCompetitionDivisionBracket catch err ", err)
			return false;
  		});
}

export async function updateCompetitorStatus(pId, pStatus) {

    return wixData.get("lstClubCompCompetitors", pId)
  		.then( (item) => {
			item.status = pStatus;
    		wixData.update("lstClubCompCompetitors", item);
			// update global record
			const x = gCompetitors.findIndex(o => o._id === pId);
			if (x !== -1) {
				gCompetitors[x].status = pStatus;
			} else {
				console.log("/public/objects/clubComp updateCompetitorStatus Couldnt find in target ", pId);
				return false;
			}
  			return true;
		})
  		.catch( (err) => {
			console.log("/public/objects/clubComp updateCompetitorStatus catch err ", err);
			return false;
  		});
}

export function convertNull (pIn, pSub) {
  	//convert a null or equivalent into the value of pSub, usually null or ""
  	if (pIn === null  || typeof pIn === 'undefined') {
    	pIn = pSub;
  	}
  	return pIn;
}

export function fillRoundOptions(pNo) {

	let wOptions = [];
	for(let i=0; i<pNo;i++){
		wOptions.push({
			'label': String(i+1),
			'value': String(i+1)
		});
	}
	return wOptions;
}

//========================================Booking module replacements ===============
export function getActiveDivisionRoundBookings(pStage, pDiv, pRound) {
	let wMatchKey = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") 
				+ "R" + String(pRound - 1).padStart(2,"0");
	//console.log("GetActiveDivRoundBookings: ", wMatchKey);
	//console.log("gADRB");
	//console.log(gBookings);
	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)		
									.filter(item => item.matchKey.substring(0,9) === wMatchKey)
									.filter(item => item.status !== BOOKING.MOVED)
									.filter(item => item.status !== BOOKING.DELETED);
//									.filter(item => item.status === BOOKING.NEW);
	return filteredArray;
}

export function getAllNewStageBookings( pStage) {
	//console.log("getAllNewStageBookings");
	let wKey = "S" + String(pStage).padStart(2,"0");
	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)
									.filter(item => item.matchKey.substring(0,3) === wKey)
									.filter(item => (item.status === BOOKING.NEW || item.status === BOOKING.READY));
	return filteredArray;
}

export function getAllStageBookings( pStage) {
	//console.log("getAllStageBookings");
	let wKey = "S" + String(pStage).padStart(2,"0");
	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)
									.filter(item => item.matchKey.substring(0,3) === wKey);
	return filteredArray;
}

export function getNewDivisionRoundBookings(pStage, pDiv, pRound) {
	//console.log("getNewDivisionRoundBookings");
	let wKey = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") 
				+ "R" + String(pRound - 1).padStart(2,"0");
	//console.log(wKey);
	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)
									.filter(item => item.matchKey.substring(0,9) === wKey)
									.filter(item => (item.status === BOOKING.NEW || item.status === BOOKING.READY));
	return filteredArray;

}


/**
 * Game Score
 */
export async function updateBookingGameScore(pId, pStatus, pScoreA, pScoreB) {
try {
	//console.log("Booking updateBookingGameScore");
	let item = await wixData.get("lstBookings", pId);
	if (item) {
		item.scoreA = pScoreA;
		item.scoreB = pScoreB;
		item.status = pStatus;
		await wixData.update("lstBookings", item);
		const x = gBookings.findIndex(o => o._id === pId);
		if (x !== -1) {
			gBookings[x].scoreA = pScoreA;
			gBookings[x].scoreB = pScoreB;
			gBookings[x].status = pStatus;
			return true;
		} else {
			console.log("/public/objects/clubComp updateBookingsGameScore Couldnt find in target ", pId);
			return false;
		}
	} else {
		console.log("/public/objects/booking updateBookingGameScore err " + item + "[ " + pId + "]");
		return false;
	}
}
catch ( err ) {
	console.log("pubic/objects/booking updateBookingGameScore try catch ", err);
}}


/**
 * Game Score
 */
export async function getGamesPlayedCount (pStatus, pCompRef, intStage, intDiv) {
	//console.log("getGamesPlayedCount");
	let wFilter = "S" + String(intStage).padStart(2,"0") + "D" + String(intDiv).padStart(2,"0"); 
	const filteredArray = gBookings.filter( item => item.matchKey !== undefined)
									.filter( item => item.matchKey !== null)
									.filter(item => item.matchKey.substring(0,6) === wFilter)
									.filter(item => item.status === pStatus);
	return filteredArray.length;
}

//------------------------------------------------------------------------------------------------------
export async function getNewDivisionAllBookings(pCompRef, pStage, pDiv) {

	let wFilter = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0");
	let allItems = [];
	let results = await wixData.query("lstBookings")
		.eq("status", "N")
		.eq("compRef", pCompRef)
		.startsWith("matchKey", wFilter)	
		.or(
			wixData.query("lstBookings")
			.eq("status", "O")
			.eq("compRef", pCompRef)
			.startsWith("matchKey", wFilter)
		)
		.ascending("matchKey")					//ascending match order
		.find();

	if (results) {
		if (results.totalCount !== 0) {
			allItems = [...results.items];

			while(results.hasNext()) {
				results = await results.next();
				allItems.push(...results.items);
			}
			return allItems;
		} else {
			console.log("/public/objects/clubComp getNewDivisionAllBookings No bookings found");
			return false;
		} 
	} else { 
		console.log("/public/objects/clubComp getNewDivisionAllBookings results false ");
		return false;
	}
}


export function bulkUpdateClubCompBookings(pData) {

	return wixData.bulkUpdate("lstBookings", pData)
  		.then( (results) => {
			// now update the global array
			gBookings = copyArray(pData, gBookings);
			return true;

		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/clubComp bulkUpdateClubCompBookings Catch " + errorMsg);
			return false;
		});
};

export function copyArray (pFrom, pTo) {
	pFrom.forEach( obj => {
		const x = pTo.findIndex(o => o._id === obj._id);
		if (x !== -1) {
			pTo[x] = obj;
		} else {
			console.log("/public/objects/clubComp copyArray Couldnt find in target ", obj._id);
		}
	})
	return pTo;
}

export async function  updateEP5Bookings(pStageCompetitors, pStageRec) {
	for (let i=1; i< pStageRec.noRounds + 1; i++){
		let wBookings = await getNewDivisionRoundBookings(pStageRec.stage, pStageRec.div, i);
		if (wBookings) {
			wBookings.forEach( (item, index) => {
				let wPlayerAKey = pStageRec.bracket[0][index][0];	//[round][match][player]
				let wPlayerBKey = pStageRec.bracket[0][index][1];
				if (wPlayerAKey === null) {
					item.playerAId = pStageCompetitors[wPlayerBKey-1].skipId; 
					item.playerBId = null; 
				}else if (wPlayerBKey === null){
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
					item.playerBId = null; 
				} else {
					item.playerAId = pStageCompetitors[wPlayerAKey-1].skipId; 
					item.playerBId = pStageCompetitors[wPlayerBKey-1].skipId;
				}
			})
			bulkUpdateClubCompBookings(wBookings);
		} else {
			console.log("/public/objects/clubComp updateEP%Bookings Did not find any EP5 bookings");
			return false;
		}
	}
	return true;
}
