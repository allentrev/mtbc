import wixWindow                            from 'wix-window';
import wixLocation			                from 'wix-location';

//	===============================================================================================

import { toJulian }                         from 'public/fixtures';

//	===============================================================================================

import { getSettingsRinkArray }		        from 'public/objects/booking';

import { bulkSaveBookings } 			    from 'public/objects/booking.js';
import { bulkSaveClubCompStages }           from 'public/objects/clubComp';
import { bulkSaveClubCompCompetitors}       from 'public/objects/clubComp';
import { saveClubComp}                      from 'backend/backClubComp.jsw';
import { getClubCompById }                  from 'backend/backClubComp.jsw';

import { COMPETITION, STAGE, COMPETITOR }   from 'public/objects/clubComp';
import { COMPETITOR_TYPE }                  from 'public/objects/clubComp';
import { BOOKING }           			    from 'public/objects/booking.js';
//	===============================================================================================

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

let wIdx;
let wRow;
let wMode = "Man";

const LEAGUE = "LG";
const KNOCKOUT = "KO";
const PLAYOFF = "KO2";
const HYBRID = "HY";

//	===============================================================================================

$w.onReady(async function () {
    //TODO: Add test for being signed on


    let query = wixLocation.query;
    loadParams(query);

    let wRow = [{"_id": "S1", "title": "", "players": 0, "promoted": 0},]
    $w('#rptLGDivs').data = wRow;

    $w('#txtTitle').text = "";
    $w('#boxLG').collapse();
    $w('#boxKO').collapse();
    $w('#inpLGNoParticipants').value = null;
    $w('#inpLGNoLeagues').value = null;
    $w('#tblSchedule').rows = [];
    $w('#txtNoStages').text = "0";
    $w('#lblBoxHeader').scrollTo();

    $w("#rptByes").onItemReady( ($item, itemData, index) => {
        loadByeLine($item);
    });
})


function loadByeLine($item) {
    $item('#inpMatchNo').value = "";
}

//	=============================================  BOX HEADER  ==================================================

async function loadParams(pQuery) {
    /**
    let wItems = [
        {
            "compYear": 2022,
            "_id": "2afb6449-1c0d-4ee1-abaa-9a0a79040b9a",
            "_owner": "88f9e943-ae7d-4039-9026-ccdf26676a2b",
            "_createdDate": "2022-04-06T08:17:50.391Z",
            "_updatedDate": "2022-04-18T08:21:51.616Z",
            "mix": "L",
            "gameType": 1,
            "order": 0,
            "status": "N",
            "bookable": "Y",
            "secondNames": [],
            "shape": "KO",
            "noStages": 0,
            "title": "2 Wood Singles",
            "winnerNames": [],
            "compRef": "TWL",
            "maintainedBy": "A",
            "inTableDisplay": "Y",
            "competitorType": COMPETITOR_TYPE.INDIVIDUAL
        },
        {
            "compYear": 2022,
            "_id": "805b7dfd-7744-4a79-9f00-66a638dbfe20",
            "_owner": "88f9e943-ae7d-4039-9026-ccdf26676a2b",
            "_createdDate": "2022-07-21T00:20:11.588Z",
            "_updatedDate": "2022-07-21T00:22:20.213Z",
            "mix": "L",
            "gameType": 1,
            "order": 0,
            "status": "N",
            "bookable": "Y",
            "secondNames": [],
            "shape": "KO",
            "noStages": 0,
            "title": "First Season Bowler",
            "winnerNames": [],
            "compRef": "FSL",
            "maintainedBy": "A",
            "inTableDisplay": "Y",
            "competitorType": COMPETITOR_TYPE.INDIVIDUAL
        },
        {
            "compYear": 2022,
            "_id": "24df6ca9-57da-4b97-a19e-e8f0047f1610",
            "_owner": "88f9e943-ae7d-4039-9026-ccdf26676a2b",
            "_createdDate": "2022-07-21T00:18:40.674Z",
            "_updatedDate": "2022-07-21T00:22:21.497Z",
            "mix": "M",
            "gameType": 1,
            "order": 0,
            "status": "N",
            "bookable": "Y",
            "secondNames": [],
            "shape": "KO",
            "noStages": 0,
            "title": "First Season Bowler",
            "winnerNames": [],
            "compRef": "FSM",
            "maintainedBy": "A",
            "inTableDisplay": "Y",
            "competitorType": COMPETITOR_TYPE.INDIVIDUAL
        }
    ];
    // */
    console.log(pQuery);
    let wComp = pQuery.comps;
    //for (let wItem of wItems){
    //    l
    //}
    let wItems = wComp.split(",");
    console.log(wItems);
    //if (wItems && wItems.length > 0) {
    //    $w('#tblParams').rows = wItems;
    //    $w('#lblRowIndex').text = "0";

    //} else {
    //    console.log("No competitions");
    //}
}

let gRow;

export function tblParams_rowSelect(event) {
    if ($w('#boxDesign').isVisible) {
        let wIdx = parseInt($w('#lblRowIndex').text,10);
        $w('#tblParams').selectRow(wIdx);
        return;
    }
    gRow = event.rowData;
    $w('#lblRowIndex').text = String(event.rowIndex);
}

export function tblParams_dblClick(event) {
    let wStatus = gRow.status;
    if (wStatus !== "N") {
        showSaveMessage(1);
        $w('#btnPopulate').enable();
        return;
    }
    $w('#boxDesign').expand();
    $w('#btnPopulate').disable();
    $w('#tblSchedule').rows = [];
    let wType = gRow.shape;
    bracket.length = 0;
    byes.length = 0;
    matchNumbers.length = 0;
    fullMatchList.length = 0;
    bracket.push([]);    //wstage 1     bracket.push --> add new stage
    byes.push([]);
    matchNumbers.push([]);
    fullMatchList.push([]);
    $w('#txtTitle').text = gRow.title + " Set Up";
    switch (wType) {
        case "LG":
            $w('#txtNoStages').text = "1";
            $w('#txtLGStage').text = "1";
            $w('#boxLG').expand();
            $w('#boxKO').collapse();
            $w('#boxSchedule').collapse();
            $w('#btnCommit').disable();
            $w('#inpLGNoParticipants').scrollTo()
            .then( () => {
                $w('#inpLGNoParticipants').focus();
            })
            break;
        case "KO":
            $w('#txtNoStages').text = "1";
            $w('#txtKOStage').text = "1";
            $w('#boxLG').collapse();
            $w('#boxKO').expand();
            $w('#boxSchedule').collapse();
            $w('#btnCommit').disable();
            $w('#txtNoStages').text = "1";
            bracket[0].push([]);    //wstage 1     bracket[0].push --> add new div
            byes[0].push([]);
            matchNumbers[0].push([]);
            fullMatchList[0].push([]);
            $w('#inpKONoParticipants').scrollTo()
            .then( () => {
                $w('#inpKONoParticipants').focus();
            })
            break;
        case "HY":
            $w('#txtNoStages').text = "1";
            $w('#txtLGStage').text = "1";
            $w('#txtKOStage').text = "2";
            $w('#boxLG').expand();
            $w('#boxKO').collapse();
            $w('#boxSchedule').collapse();
            $w('#btnCommit').disable();
            $w('#inpLGNoParticipants').scrollTo()
            .then( () => {
                $w('#inpLGNoParticipants').focus();
            })
            break;
       case "AR":
            $w('#txtNoStages').text = "1";
            $w('#boxLG').collapse();
            $w('#boxKO').collapse();
            $w('#boxSchedule').collapse();
            $w('#btnCommit').disable();
            break;
    }
    //$w('#btnSetUp').disable();  //to stop repeated empty stages being added. User neeeds to use Clear btn
}

//	===================================================================LEAGUE SET UP ================================================================
//

export function inpLGNoLeagues_change(event) {
    let wNo = event.target.value;
    initialiseLGDivs(wNo);
}

function initialiseLGDivs (pNo){
    let wLeagues = [];
    let wStage = parseInt($w('#txtLGStage').text,10) - 1;
    let wRow = {"_id": "", "title": "", "players": 0, "promoted": 0}
    for (let i = 0; i < pNo; i++){
        wRow._id = "S" + String(wStage).padStart(2,"0") + "D" + String(i).padStart(2,"0");
        wRow.title= "";
        wRow.players = 0;
        wRow.promoted = 0;
        wLeagues.push(wRow);
        //wRow = {};
        bracket[wStage].push([]);
        byes[wStage].push([]);
        matchNumbers[wStage].push([]);
        fullMatchList[wStage].push([]);
    }
    $w('#rptLGDivs').data = wLeagues;
}


export function inpLGNoPlayers_change(event) {
    let $item = $w.at(event.context);
    let wId = event.context.itemId;
    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wHdr = $w('#tblParams').rows[wIdx];

    let wStage = parseInt(wId.substring(1, 3),10);
    let wDiv = parseInt(wId.substring(4),10);
    let wNo = parseInt(event.target.value,10);
    let wByes;
    let wRounds;
    if (wNo % 2 === 0 ) {
        wByes = 0;
        wRounds = wNo - 1;
    } else {
        wByes = 1;
        wRounds = wNo;
    }
    if (wHdr.ext === "Y") {
        wRounds = wRounds * 2;
    }
    let wMatchesPerRound = Math.floor(wNo / 2);
    let wUpper = (wMatchesPerRound + wByes) * 2; //to make sure wNoMatchesInRoundgets set to wUpper for LG
    
    $item('#txtLGNoRounds').text = String(wRounds);
    $item('#txtLGMatchesPerRound').text = String(wMatchesPerRound);
    $item('#txtLGByesPerRound').text = String(wByes);

    let participants = Array.from({length: wNo}, (v, k) => k + 1) ; // k -> (0,n) v -> (1,n+1)
    let wX = getLeagueBracket(participants);
    bracket[wStage][wDiv] = wX;
    setUpMatchList(wStage, wDiv, wUpper);
}

//	==============================================================KNOCK OUT SET UP ================================================================
//

export function inpKONoParticipants_change(event) {
    let wNo = parseInt(event.target.value,10);
    if (wNo === 3 || wNo < 2){
        $w('#txtMsg').text = "Must be 2, 4 or more teams";
        $w('#txtMsg').show();
        return;
    } else {
        $w('#txtMsg').hide();
    }
    if (wNo === 2) { 
        $w('#rgpKOType').value = "S";
        $w('#rgpFinals').value = "2";
        $w('#rgpKOType').disable();
        $w('#rgpFinals').disable();
    } else if (wNo > 4) { 
        $w('#rgpKOType').value = "M";
        $w('#rgpFinals').value = "2";
        $w('#rgpKOType').disable();
        $w('#rgpFinals').enable();
    } else { 
        $w('#rgpKOType').value = "S";
        $w('#rgpFinals').value = "4";
        $w('#rgpKOType').enable();
        $w('#rgpFinals').enable();
        wNo = 2;
    }
    //calcParameters(wNo);
    [$w('#inpKONoRounds').value, $w('#inpKONoByes').value, $w('#inpKONoMatches').value] = calcParameters(wNo);
    let wNoByes = parseInt($w('#inpKONoByes').value,10);
    if (wNoByes > 0 && $w('#rgpBracket').value === "M") {
        let wData = buildByeDataArray(wNoByes);
        $w('#rptByes').data = wData;
        $w('#rptByes').expand();
    } else {
        $w('#rptByes').data = [];
        $w('#rptByes').collapse();
    }
}

export function rgpBracket_change(event) {
    let wNoByes = parseInt($w('#inpKONoByes').value,10);
    if (wNoByes > 0 && $w('#rgpBracket').value === "M") {
        let wData = buildByeDataArray(wNoByes);
        $w('#rptByes').data = wData;
        $w('#rptByes').expand();
    } else {
        $w('#rptByes').data = [];
        $w('#rptByes').collapse();
    }
}

export function rgpFinals_change(event) {
    let wNo = parseInt($w('#inpKONoParticipants').value,10);
    if (isNaN(wNo)) {return}
    if (wNo === 0) {return}
    let wType = $w('#rgpKOType').value; 
    if (wType === "S"){ 
        if /** final only */ ($w('#rgpFinals').value === "2"){ 
            $w('#inpKONoMatches').value = "1";
        } /** extra match for 3rd place */ else { 
            $w('#inpKONoMatches').value = "2";
        }
    } else { 
        if /** final only */ ($w('#rgpFinals').value === "2"){ 
            $w('#inpKONoMatches').value = String(wNo -1);
        } /** extra match for 3rd place */ else { 
            $w('#inpKONoMatches').value = String(wNo);
        }
    }
}

export function rgpKOType_change(event) {
    let wNo = parseInt($w('#inpKONoParticipants').value,10);
    if (isNaN(wNo)) {return}
    if (wNo === 0) {return}
    let wType = event.target.value;
    if (wType === "S") {
        wNo = 2;
    } else { 
        wNo = 4;
    }
    //calcParameters(wNo);
    [$w('#inpKONoRounds').value, $w('#inpKONoByes').value, $w('#inpKONoMatches').value] = calcParameters(wNo);  
}

export function chkSeeded_change(event) {
	$w('#inpKONoSeeds').show();
    $w('#inpKONoSeeds').focus();
}

//	==============================================================KNOCK OUT SET UP SUPPORT =========================================================


function buildByeDataArray(pNo) {
    let wData = [];
    for (let i=0; i<pNo; i++) {
        let wEntry = {
            "_id": String(i),
            "matchNo": "0"
        }
        wData.push(wEntry);
    }
    return wData;
}

function calcParameters(pNo) {
    let index = 0;
    let wUpper = 0;
    let wNoRounds = "0";
    let wNoByes = "0";
    let wNoMatches = "0";
    while (wUpper < pNo && index < 8) {                        // 2**8 = 256
        index++;
        wUpper = 2**index;
    }
    let wByes = wUpper - pNo;
    console.log($w('#rgpKOType').value);
    if ($w('#rgpKOType').value === "S") { 
        wNoRounds = "1";
    } else {
        wNoRounds = String(index);
    }
    wNoByes = String(wByes);
    console.log($w('#rgpFinals').value);
    if /** final only */ ($w('#rgpFinals').value === "2"){ 
        wNoMatches = String(pNo -1);
    } /** extra match for 3rd place */ else { 
        wNoMatches = String(pNo);
    }
    return [wNoRounds, wNoByes, wNoMatches];
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

function setUpFinalsMatchList(pStage, pDiv, pUpper) {

    let wBracket =
                [//Div
                    [//Round
                        [1,2],			//Match
                        [3,4]			//Match
                    ]
                ];
    let wByes = [//Div
                    [//Round	
                        false,			//Match
                        false			//Match
                    ]
                ];
    let wMatchNumbers =
                [//Top
                    [//Round	
                        1,  			//Match
                        2	    		//Match
                    ]
                ];
    let wFullMatchList =
                [//Top
                    [//Round	
                        1,  			//Match
                        2	    		//Match
                    ]
                ];

    bracket[pStage][0] = wBracket;
    byes[pStage][pDiv] = wByes;
    matchNumbers[pStage][pDiv] = wMatchNumbers;
    fullMatchList[pStage][pDiv] = wFullMatchList;

    matchNumIdx = 0;
    
    wMatchInRound= 0;
    wSelectionIdx= 0;
    wNoMatchesInRound= pUpper / 2;     // represents the number of matches in a round including byes
}

function setUpFinalOnlyMatchList(pStage, pDiv, pUpper) {

    let wBracket =
                [//Div
                    [//Round
                        [1,2]			//Match
                    ]
                ];
    let wByes = [//Div
                    [//Round	
                        false			//Match
                    ]
                ];
    let wMatchNumbers =
                [//Top
                    [//Round	
                        1   			//Match
                    ]
                ];
    let wFullMatchList =
                [//Top
                    [//Round	
                        1    			//Match
                    ]
                ];

    bracket[pStage][0] = wBracket;
    byes[pStage][pDiv] = wByes;
    matchNumbers[pStage][pDiv] = wMatchNumbers;
    fullMatchList[pStage][pDiv] = wFullMatchList;

    matchNumIdx = 0;
    
    wMatchInRound= 0;
    wSelectionIdx= 0;
    wNoMatchesInRound= pUpper / 2;     // represents the number of matches in a round including byes
}

//	==============================================================SCHEDULE SET UP ROUTINES  ======================================
//

export function btnLGAdd_click(event) {
    /** save what we got for this stage  */
    let wThisStage = parseInt($w('#txtLGStage').text,10) - 1;
    let wDiv = -1;
    $w('#boxSchedule').expand();
    $w('#rptLGDivs').forEachItem( ($item) => {
        wDiv = wDiv + 1;
        let wDivision = $item('#inpLGDivision').value;
        let wNoTeams = parseInt($item('#inpLGNoPlayers').value, 10);
        let wNoPromoted = parseInt($item('#inpLGNoPromoted').value, 10);
        let wNoByes = parseInt($item('#txtLGByesPerRound').text, 10);
        let wRounds = parseInt($item('#txtLGNoRounds').text,10);
        let wMatchesPerRound = parseInt($item('#txtLGMatchesPerRound').text,10);
        $w('#tblSchedule').rows = AddLeagueToTable(wThisStage, wDiv, LEAGUE, wDivision, wRounds,
         wNoPromoted, wNoTeams, wMatchesPerRound, wNoByes);
    })
    /**
     * AND HERE WE ADD NEXT STAGE LOGIC
     */
    let wNextStep = $w('#rgpNextType').value;
    let wNextStage = wThisStage + 1;            // wThisStage is zero based, hence add 1 to display first entry as 1
    if (wNextStep === LEAGUE) {
        $w('#rptLGDivs').data = [];
        $w('#txtLGStage').text = String(wNextStage + 1);
        $w('#txtNoStages').text = String(wNextStage + 1);
        //$w('#rgpCompType').value = HYBRID;

        $w('#inpLGNoParticipants').focus();
        $w('#inpLGNoParticipants').value = null;
        $w('#inpLGNoLeagues').value = null;
        bracket.push([]);
        byes.push([]);
        matchNumbers.push([]);
        fullMatchList.push([]);
    } else if (wNextStep === KNOCKOUT) {
        $w('#txtKOStage').text = String(wNextStage + 1);
        $w('#txtNoStages').text = String(wNextStage + 1);
        //$w('#rgpCompType').value = HYBRID;
        $w('#boxKO').expand();
        $w('#inpKONoParticipants').scrollTo().then( () => { 
            $w('#inpKONoParticipants').focus();
        });
        bracket.push([[]]);
        byes.push([[]]);
        matchNumbers.push([[]]);
        fullMatchList.push([[]]);
    } else if (wNextStep === PLAYOFF) {
        //$w('#txt1234Stage').text = String(wNextStage + 1);
        $w('#txtNoStages').text = String(wNextStage + 1);
        //$w('#rgpCompType').value = HYBRID;
        //$w('#box1234').expand();
        bracket.push([[]]);
        byes.push([[]]);
        matchNumbers.push([[]]);    
        fullMatchList.push([[]]);
    } else {/** do nothing */}
}

export function btnKOAdd_click(event) {
    let wThisStage = parseInt($w('#txtKOStage').text,10) -1;
    $w('#boxSchedule').expand();
    let wDivision = "Knock Out";

    let wType = $w('#rgpKOType').value; 
    let wNo = 0;
    if (wType === "S"){ 
        if /** final only */ ($w('#rgpFinals').value === "2"){ 
            setUpFinalOnlyMatchList(wThisStage, 0, 2);
        } /** extra match for 3rd place */ else { 
            setUpFinalsMatchList(wThisStage, 0, 4);
        }
    } else {
        wNo = parseInt($w('#inpKONoParticipants').value,10);
        let wUpper = wNo + parseInt($w('#inpKONoByes').value,10)
        let wStage = parseInt($w('#txtKOStage').text,10) - 1;
        let wBracketStyle = $w('#rgpBracket').value;

        var participants = Array.from({length: wNo}, (v, k) => k + 1) ;
        let wX = getKOBracket(participants, wBracketStyle);
        bracket[wStage][0] = wX;
        setUpMatchList(wStage, 0, wUpper);
        
    }

    let wTeams = parseInt($w('#inpKONoParticipants').value, 10);
    let wNoOfRounds = parseInt($w('#inpKONoRounds').value, 10);
    let wNoOfByes = parseInt($w('#inpKONoByes').value,10);
    $w('#tblSchedule').rows = AddKOToTable(wThisStage, 0, KNOCKOUT, wDivision, wTeams, wNoOfRounds, wNoOfByes);
    $w('#tblSchedule').scrollTo();
    /**
     * KNOCK OUT IS ALWAYS LAST STAGE IN COMP
     */
}

export function btn1234Add_click(event) {
    let wBracket =
                [//Div
                    [//Round
                        [1,2],			//Match
                        [3,4]			//Match
                    ]
                ];
    let wByes = [//Div
                    [//Round	
                        false,			//Match
                        false			//Match
                    ]
                ];
    let wMatchNumbers =
                [//Top
                    [//Round	
                        1,  			//Match
                        2	    		//Match
                    ]
                ];
    let wFullMatchList =
                [//Top
                    [//Round	
                        1,  			//Match
                        2	    		//Match
                    ]
                ];

    //let wStage = parseInt($w('#txt1234Stage').text,10) -1;
    let wStage = 1;
    $w('#boxSchedule').expand();
    let wDivision = "Finals";
    let wTeams = 4;
    let wNoOfRounds = 1;
    let wNoOfByes = 0;

    $w('#tblSchedule').rows = AddKOToTable(wStage, 0, PLAYOFF, wDivision, wTeams, wNoOfRounds, wNoOfByes);

    bracket[wStage][0] = wBracket;
    byes[wStage][0] = wByes;
    matchNumbers[wStage][0] = wMatchNumbers;
    fullMatchList[wStage][0] = wFullMatchList;
}

//	==============================================================SCHEDULE SET UP SUPPORT ROUTINES  ================================
//

function AddKOToTable (pStage, pDiv, pType, pDivision, pNoTeams, pNoRounds, pNoByes) {
    console.log("AddKOToTable:", "Stage = " + pStage, "Div = " + pDiv, "Type = " + pType, "Division = " + pDivision, 
                                "Teams = " + pNoTeams, "Rounds = " + pNoRounds, "Byes = " + pNoByes);
    let wTable = $w('#tblSchedule').rows;

    let wRounds = 0;
    let wId = "";
    let wMatchesPerRound = pNoTeams /2;
    let wNoPromote = parseInt($w('#rgpFinals').value,10);
    let wDivision = pDivision;
    for (let i=0; i < pNoRounds; i++) {
        if (i===0 && pNoByes > 0) {
            //OLDlet x = (pNoTeams - pNoByes) / 2;
            let x = (pNoTeams + pNoByes) / 2;
            //wRounds = String(i+1);
            wId = String(pStage).padStart(2,"0") + "/" + String(pDiv).padStart(2,"0") + "/" + String(i).padStart(2,"0");
            let wItem = {"id": wId,"stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": wDivision,
                     "rinks": String(x), "bookingDate": "", "jDate": ""};
            wTable.push(wItem);
            //let wItem2= {"id": wId, "stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": "KO Byes",
            //         "rinks": String(pNoByes), "bookingDate": "", "jDate": ""};
            //wTable.push(wItem2);
            wMatchesPerRound = x  / 2;
        } else {
            //wRounds = String(i+1);
            let wGames = wMatchesPerRound;
            if (i === pNoRounds - 1) { 
                wDivision = "Finals";
                if (pNoTeams === 4){
                    if ($w('#rgpFinals').value === "4") { 
                        wGames = 2;
                    } else if ($w('#rgpKOType').value  === "S") { 
                        wGames = 1;
                    } 
                } /** !== 4 */ else { 
                    if ($w('#rgpFinals').value === "4") {
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

function AddLeagueToTable (pStage, pDiv, pType, pDivision, pNoRounds, pNoPromoted, pNoTeams, pNoMatches, pNoByes) {
    let wTable = $w('#tblSchedule').rows;
    let wId = "";
    for (let i=0; i<pNoRounds;i++){
        wId = String(pStage).padStart(2,"0") + "/" + String(pDiv).padStart(2,"0") + "/" + String(i).padStart(2,"0");
        let wItem = {"id": wId, "stage": String(pStage+1), "div": String(pDiv+1), "type": pType, "round": String(i+1), "division": pDivision,
                 "rinks": String(pNoMatches), "bookingDate": "", "jDate": ""};
        wTable.push(wItem);
    }
    addClubCompStage(pStage, pDiv, pDivision, pType, bracket, pNoTeams, pNoPromoted, pNoRounds, pNoByes);
    for (let i=0; i< pNoTeams+1; i++) {
       addClubCompCompetitor(pStage, pDiv, pDivision, i);
    }
    wTable.sort(tableSortA);
    return wTable;
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


//	==============================================================BOX SCHEDULE ====================================================
//

export function tblSchedule_rowSelect(event) {
    wRow = event.rowData;
    wIdx = event.rowIndex;
}

export function dpkrRequiredDate_change(event) {

	let wDate = $w('#dpkrRequiredDate').value;
	wDate.setHours(10,0,0,0);
    if (wRow) {
        wRow.requiredBy = wDate;
        $w('#tblSchedule').updateRow(wIdx, wRow);
        if (wIdx === $w('#tblSchedule').rows.length-1) { 
            $w('#btnCommit').enable();
        }
    }
}

export function btnClear_click(event) {
    resetSchedule();
}

function showSaveMessage(pMsg) {
    let wMsg = ["Competition already configured",
        "Records updated OK ",
        "Please correct input errors",
        "The database record was not saved",
        "Cannot read new day. Try again",
        "Must be a manager to make or edit Competition booking"
    ];

    $w('#txtSaveMessage').text = wMsg[pMsg - 1];
    $w('#txtSaveMessage').show();
    setTimeout(() => {
    	$w('#txtSaveMessage').hide();
        return;
        //Promise.resolve("OK");
    }, 5000);
}

//	================================================ Box Commands  =====================================================================
//

export function btnPopulate_click(event) {
    
    wixLocation.to("/maintain-competitors");

}

export function btnMaintain_click(event) {
    wixLocation.to("/maintain-club-competitions");
}

/**
 * @TODO: check validity
*/
export function btnCommit_click(event) {
  
    if (wMode === "Man") { 
        processScheduleTable();
    }
    $w('#btnCommit').disable();
    /**
    console.log("Commit, wbooklist, stages, competitors");
    console.log(wBookList);
    console.log(wStages);
    console.log(wStageCompetitors);
    console.log(byes);
    console.log(bracket);
    */
    //const p2 = bulkSaveClubCompStages(wStages);
    //const p3 = bulkSaveClubCompCompetitors(wStageCompetitors);
    //const p4 = bulkSaveBookings(wBookList);

    /* Promise.all([
        p2.catch(error => { console.log("P2 error", error); return error; }),
        p3.catch(error => { console.log("P3 error", error); return error; }),
        p4.catch(error => { console.log("P4 error", error); return error; }),
    ]).then(values => {
    */
    
    Promise.all([
        bulkSaveClubCompStages(wStages),
        bulkSaveClubCompCompetitors(wStageCompetitors),
        bulkSaveBookings(wBookList),
        updateClubComp(),
    ]).then(values => {
        showSaveMessage(2);
        resetPage();
    })
    .catch( (err) => {
		console.log("Error");
		console.log(err);
		return false;
	})
    
    //resetPage();
}

function resetPage() {
    $w('#boxDesign').collapse();
    $w('#lblBoxHeader').scrollTo();
    $w('#boxLG').collapse();
    $w('#rptLGDivs').data = [];
    $w('#inpLGNoParticipants').value = "";
    $w('#inpLGNoParticipants').focus;
    $w('#inpLGNoLeagues').value = "";
    $w('#boxKO').collapse();
    $w('#txtTitle').text = "";
    $w('#inpKONoParticipants').value = "";
    $w('#inpKONoRounds').value = "";
    $w('#inpKONoByes').value = "";
    $w('#inpKONoMatches').value = "";
    $w('#inpKONoSeeds').value = "0";
    resetSchedule();
    updateParams();
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

function resetSchedule() {
    $w('#tblSchedule').rows = [];
    $w('#boxSchedule').collapse();
    if ($w('#boxKO').isVisible) {
        $w('#boxKO').scrollTo();
    } else {
        $w('#boxLG').scrollTo();
    }
}
function updateParams(){
    let wData = $w('#tblParams').rows;
    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wRow = wData[wIdx];
    wRow.status = "S";
    //let wTemp = wData.splice(wIdx,1);
    $w('#tblParams').rows = wData;
    $w('#tblParams').selectRow(wIdx);
    
    //$w('#lblRowIndex').text = "0";
}

function processScheduleTable() {
    
    let wTable = $w('#tblSchedule').rows;
    let wMatchNo = 0;
    //let wLastRound = 0;
    for (let wLine of wTable) {
        let wDateRequired = wLine.requiredBy
        let wStage = parseInt(wLine.stage,10) - 1;
        let wDiv = parseInt(wLine.div,10) - 1;
        let wRound = parseInt(wLine.round,10) - 1;
        let wRinks = parseInt(wLine.rinks,10);
        let wDivision = wLine.division;
        //if (wRound !== wLastRound) {
        //    wLastRound = wRound;
        //console.log("round=  ", wRound, " rinks =", wRinks);
        wMatchNo = 0;
        // }
        let wIsBye = "N";
        if (wLine.type === "KO"){
            let wLastRound = parseInt($w('#inpKONoRounds').value,10) - 1;
            if (wRound === wLastRound) { 
                wMatchNo++;
                storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, "Final", wIsBye);
                if (wRinks > 1 ) {
                    wMatchNo++;
                    storeRecord(wDateRequired, 0, 0, 0, wStage, wDiv, wRound, wMatchNo, "3rd/4th", wIsBye);
                }
            } else if (wRound === 0) {
                for (let i=0; i<wRinks; i++) {
                    let wHome = bracket[0][0][0][i][0];
                    let wAway = bracket[0][0][0][i][1];
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

function storeRecord(pDateRequired, pSlotId, pSlot, pRink, pStage, pDiv, pRound, pMatchNo, pUse, pIsBye) { 
    let toInsert = {
        "dateRequired": null,
        "requiredYear": 0,
        "requiredMonth": 0,
        "requiredJDate": null,
        "resourceKey": "",
        "title": "",
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
    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wHdr = $w('#tblParams').rows[wIdx];
    
    let wToday = new Date();
    wToday.setHours(10,0,0,0);

    let wJDate = toJulian(pDateRequired);
    let wJD = parseInt(wJDate.substr(-3),10);

    let wRequiredYear = pDateRequired.getFullYear();
    let wRequiredMonth = pDateRequired.getMonth();
    let wNoPlayers = parseInt(wHdr.gameType,10) * 2;

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
    toInsert.compRef = wHdr.compRef;
    //toInsert.compRef = "TWM"
    toInsert.compTitle = wHdr.title;
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
    wBookList.push(toInsert);
    //console.log("selection stored");
}

async function updateClubComp() {

    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wHdr = $w('#tblParams').rows[wIdx];
    let wCompId = wHdr._id;
    let wCompRec = await getClubCompById(wCompId);

    wCompRec.noStages = parseInt($w('#txtNoStages').text,10);
    wCompRec.status = "S";
    //TODO: we may need to update status also

    let res = await saveClubComp(wCompRec);
    if (!res) {
        console.log("updateClubComp failed");
        return Promise.reject("Update failed");
    }
    return Promise.resolve("Club Comp Updated");
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
    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wHdr = $w('#tblParams').rows[wIdx];
    toInsert.title = null;
    toInsert.compRef = wHdr.compRef;
    toInsert.compYear = wHdr.compYear;
    toInsert.stage = parseInt(pStage,10);
    toInsert.div = parseInt(pDiv, 10);
    toInsert.division = pDivision;
    toInsert.status = STAGE.NEW;
    toInsert.shape = pShape;
    toInsert.bracket = pBracket[toInsert.stage][toInsert.div];
    toInsert.handicapped = $w('#chkKOHandicapped').checked;
    toInsert.seeds = parseInt($w('#inpKONoSeeds').value, 10);
    toInsert.noTeams = parseInt(pNoTeams,10);
    toInsert.noPromote = parseInt(pNoPromote,10);
    toInsert.noRounds = parseInt(pNoRounds,10);
    toInsert.noByes = parseInt(pNoByes,10);
    wStages.push(toInsert);
    return true;
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
    let wIdx = parseInt($w('#lblRowIndex').text,10);
    let wHdr = $w('#tblParams').rows[wIdx];
    toInsert.title = null;
    toInsert.compRef = wHdr.compRef;
    toInsert.compYear = wHdr.compYear;
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

function getLeagueBracket(pParticipants) {

    if (pParticipants.length % 2 === 1) {
        pParticipants.push(null);
    }

    const wPlayerCount = pParticipants.length;
    const wNoRounds = wPlayerCount - 1;
    const wHalfWayPoint = wPlayerCount / 2;

    const wTournamentPairings = [];

    //const playerIndexes = players.map((_, i) => i).slice(1);
    let wPlayerIndexes = pParticipants.map((p,i) => i);
    wPlayerIndexes.shift();

    //let playerIndexes = ["1","2","3","4","8","7","6","5"];
    let away= false;
    for (let round = 0; round < wNoRounds; round++) {
        const wRoundPairings = [];

        const wNewPlayerIndexes = [0].concat(wPlayerIndexes);

        const wFirstHalf = wNewPlayerIndexes.slice(0, wHalfWayPoint);
        const wSecondHalf = wNewPlayerIndexes.slice(wHalfWayPoint, wPlayerCount).reverse();
        away = !away;
        for (let i = 0; i < wFirstHalf.length; i++) {
            if (away){
                wRoundPairings.push( [pParticipants[wFirstHalf[i]], pParticipants[wSecondHalf[i] ] ] );
            } else {
                wRoundPairings.push( [pParticipants[wSecondHalf[i]], pParticipants[wFirstHalf[i]]]);
            }
        }

        // rotating the array
        wPlayerIndexes.push(wPlayerIndexes.shift());
        wTournamentPairings.push(wRoundPairings);
    }

    return wTournamentPairings;

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

