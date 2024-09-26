//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor the list of winners and runners up in the Club 
//	competitions held at the end of the previous season.
//
//	At the moment, the year of the season is manually adjusted. 
//	TODO: Put current season year in a Settings file and maintain it from a new members facility
//
//	Again, there is a differnet layout here for mobile devices from that for tablets and desktops.
//
//------------------------------------------------------------------------------------------------------
import wixWindow				from 'wix-window';
import wixLocation from 'wix-location';

import { getAllClubComp }		from 'backend/backClubComp.jsw';
import { loadDropSeason }		from 'backend/backClubComp.jsw';


	// this is just test data
	let wResults = [
		{"_id": "a1", "comp":"Men's Competition", "winner": "Winner", "second":"Runners-Up"},
		{"_id": "a2", "comp":"Championship", "winner": "Tim Eales", "second":"Ian Wright"},
		{"_id": "a3", "comp":"Pairs", "winner": "Tim Eales\nPaul Hibbitt", "second":"Cliff Jenkins\nRichard Smith"},
		{"_id": "a4", "comp":"", "winner": "Paul Hibbitt", "second":"Richard Smith"},
	];

// this is temp data
	let w2020Results = [
		{"_id": "a1", "comp": "Competition", "winner": "Winner", "second":"Runners-Up"},
		{"_id": "a2", "comp":"Open Singles", "winner": "Elizabeth Wilkins", "second": "Tony Ruffell"},
		{"_id": "a3", "comp":"Open Pairs", "winner": "Mick Oliver\nEddie Cutche", "second":"Paul Stanley\nJohn Wiliams"},
	];

const COLOUR = Object.freeze({
	HEADER:	"rgba(180, 180, 180, 1.0)",
	BODY:	"rgba(207, 207, 155, 1.0)",
	YELLOW:	"rgba(255, 255, 0, 1.0)",
	RED:	"rgba(255, 0, 0, 1.0)"
	//BODY:	"rgba(0, 0, 0, 1.0)"
});
// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const gYear = new Date().getFullYear();

$w.onReady(async function () {
	
	try {
		let [wOptions, wYear, wIdx] = await loadDropSeason();
		//console.log(wOptions);
		//console.log(wYear, wIdx);
		$w('#drpSeason').options = wOptions;
		$w('#drpSeason').selectedIndex = wIdx;

		$w('#rptResults').expand(); ////
		$w('#rgpMix').value = "L";
		await loadDesktopRepeater (wYear, "L");

		if(wixWindow.formFactor === "Mobile"){
			$w('#cstrpResults').collapse();
			$w('#cstrpMobile').expand();
		} else {
			$w('#cstrpResults').expand();
			$w('#cstrpMobile').collapse();
		}
	}
	catch (err) {
		console.log("/page ClubChampoionshipResults onReady Catch error");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror")};
	}

	$w("#rptGames").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadMobileRepeater($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	});


 	$w("#rptResults").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRptResults($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	});
});

async function loadDesktopRepeater(pYear, pMix) {
	//console.log("LDRptr", pYear, "[" + pMix + "]")
	let wMix = "";
	switch (pMix) {
		case "L":
			wMix = "Ladies";
			break;
		case "M":
			wMix = "Mens";
			break;
		case "X":
			wMix = "Mixed";
			break;
	} 
	let wTitle = {"_id": "Header", "title": "Club Competition", "gameType": 1, "winnerNames": ["Winners"], "secondNames": ["Runners-Up"]}
	let wYearSet = await getResults(pYear);
	let wYearSetByMix = wYearSet.filter( item => item.mix === pMix).filter( item => item.status === "C");
	if (wYearSetByMix.length > 0) {
		$w('#lblHeader').text = `These are the ${wMix} competitions that were held in the ${pYear} season.`;
		wYearSetByMix.unshift(wTitle);
		//console.log(wYearSetByMix);
		$w('#rptResults').data = wYearSetByMix;
		$w('#rptGames').data = wYearSetByMix;
		$w('#rptResults').expand();
		$w('#rptGames').expand();
	} else {
		$w('#lblHeader').text = `The ${wMix} competitions for the ${pYear} season have not been completed yet.`;
		$w('#rptResults').collapse();
		$w('#rptGames').collapse();
	}
}

//
//===============================================New  Way ================================================
//
async function getResults(pYear) {
	let status;
	let wSet = [];
	let wResult = await getAllClubComp(pYear);
	status =wResult.status;
	wSet = [...wResult.competitions];
	if (wSet) {
		let wReturnSet = wSet.filter ( item => item.inTableDisplay === "Y");
		if (wReturnSet.length > 0){
			return wReturnSet;
		} else {
			console.log("/page ClubChampionshipResults getResults: No displayable competitions found");
			return false;
		}
	} else {
		console.log("/page ClubChampionshipResults getResults: No competitions found");
		return false;
		
	}
}

async function loadMobileRepeater($item, itemData, index) {
	// item holds: title, picture, message, createdDate
	if (index === 0){ 
		$item('#txtMTitle').text = itemData.title;
		$item('#txtMWinner').text = itemData.winnerNames[0];
		$item('#txtMSecond').text = itemData.secondNames[0];
		$item('#boxMBackground').style.backgroundColor = COLOUR.HEADER;
	} else { 
		$item('#boxMBackground').style.backgroundColor = COLOUR.BODY;
		let wGameType = itemData.gameType;

		switch (wGameType) {
			case 1:
				$item("#txtMWinner").text = removeNulls(itemData.winnerNames[0]);
				$item("#txtMSecond").text = removeNulls(itemData.secondNames[0]);
				break;
			case 2:
				$item("#txtMWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1]);
				$item("#txtMSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1]);
				break;
			case 3:
				$item("#txtMWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1])
				 + "\n" + removeNulls(itemData.winnerNames[2]);
				$item("#txtMSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1])
				 + "\n" + removeNulls(itemData.secondNames[2]);
				break;
			case 4:
				$item("#txtMWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1])
				 + "\n" + removeNulls(itemData.winnerNames[2]) + "\n" + removeNulls(itemData.winnerNames[3]);
				$item("#txtMSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1])
				 + "\n" + removeNulls(itemData.secondNames[2]) + "\n" + removeNulls(itemData.secondNames[3]);
				break;
			default:
				$item("#txtMWinner").text = removeNulls(itemData.winnerNames[0]);
				$item("#txtMSecond").text = removeNulls(itemData.secondNames[0]);
				break;
		}
		$item("#txtMTitle").text = itemData.title;
	}
}

async function loadRptResults($item, itemData, index) {
		// item holds: title, picture, message, createdDate
	$item("#txtCompTitle").text = itemData.title;
	if (index === 0){ 
		$item('#boxBackground').style.backgroundColor = COLOUR.HEADER;
		$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]);
		$item("#txtSecond").text = removeNulls(itemData.secondNames[0]);
	} else {
		$item('#boxBackground').style.backgroundColor = COLOUR.BODY;
		let wGameType = itemData.gameType;
		switch (wGameType) {
			case 1:
				$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]);
				$item("#txtSecond").text = removeNulls(itemData.secondNames[0]);
				break;
			case 2:
				$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1]);
				$item("#txtSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1]);
				break;
			case 3:
				$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1])
				 + "\n" + removeNulls(itemData.winnerNames[2]);
				$item("#txtSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1])
				 + "\n" + removeNulls(itemData.secondNames[2]);
				break;
			case 4:
				$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]) + "\n" + removeNulls(itemData.winnerNames[1])
				 + "\n" + removeNulls(itemData.winnerNames[2]) + "\n" + removeNulls(itemData.winnerNames[3]);
				$item("#txtSecond").text = removeNulls(itemData.secondNames[0]) + "\n" + removeNulls(itemData.secondNames[1])
				 + "\n" + removeNulls(itemData.secondNames[2]) + "\n" + removeNulls(itemData.secondNames[3]);
				break;
			default:
				$item("#txtWinner").text = removeNulls(itemData.winnerNames[0]);
				$item("#txtSecond").text = removeNulls(itemData.secondNames[0]);
				break;
		}
	}
}
//
//=============================================== Selector Strip ================================================
//

export async function drpSeason_change(event) {
	let wMix = $w('#rgpMix').value;
	let wYear = $w('#drpSeason').value;
	let nYear = parseInt(wYear,10);
	await loadDesktopRepeater(nYear, wMix);
}
export async function rgpMix_change(event) {
	let wMix = $w('#rgpMix').value;
	let wYear = $w('#drpSeason').value;
	let nYear = parseInt(wYear,10);
	$w('#imgWait').show();
	await loadDesktopRepeater(nYear, wMix);
	$w('#imgWait').hide();
}


//
//=============================================== Old  Way ================================================
//
/**	
export async function asyncLoad() {
	// used to call load function asynchronously
	await loadTableData($w('#rgpMix').value);
	wDataOut=[];
}

export async function loadTableData (pType) {
	//TODO: Again, this is repeated code and should be refactored to a single set of code, but also care
	//		needs to be taken to guarantee row sequences using async calls
	wDataIn = await getClubCompGames(pType);
	if (wDataIn) {
		//wDataOut[wDataOut.length] = {"_id": "Ladies", "title": "Ladies' Competition", "winner": "Winners", "second": "Runners-Up"};
		//await wDataIn.forEach(processRow);
		var i;
		for (i = 0; i < wDataIn.length; i++) {
			await processRow(wDataIn[i]);
		}
	}
	/*	
	wDataIn = await getClubCompGames("M");
	if (wDataIn) {
		wDataOut[wDataOut.length] = {"_id": "Mens", "title": "Men's Competition", "winner": "Winners", "second": "Runners-Up"};
		//await wDataIn.forEach(processRow);
		for (i = 0; i < wDataIn.length; i++) {
			await processRow(wDataIn[i]);
		}
	}
	
	wDataIn = await getClubCompGames("X");
	if (wDataIn) {
		wDataOut[wDataOut.length] = {"_id": "Mixed", "title": "Mixed Competitions", "winner": "Winners", "second": "Runners-Up"};
		for (i = 0; i < wDataIn.length; i++) {
			await processRow(wDataIn[i]);
		}
	}
}
	*/
/** 
async function processRow (pEvent, count) {
	toInsert._id ="";
	toInsert.mix ="";
	toInsert.title ="";
	toInsert.type ="";
	toInsert.winner="";
	toInsert.second="";
	if (pEvent.type === "S"){
		await processSingleGame(pEvent);
	} else {
		if (wMobile) {
			await processMobileTeamGame(pEvent);
		} else {
			await processTeamGame(pEvent);
		}
	}
	//console.log("_Id = " + pEvent._id)
	//console.log("Mix = " + pEvent.mix);
	//console.log("Title = " + pEvent.title);
	//console.log("Type = " + pEvent.type);
	//console.log("Winner = " + pEvent.winner);
	//console.log("Second = " + pEvent.second);
	//console.log(wDataOut);
}
	
async function processSingleGame(event){
	//	console.log("Siingle");
	//	console.log(event);
	toInsert._id = event._id;
	toInsert.title = event.title;
	toInsert.winner = removeNulls(event.winner);
	toInsert.second = removeNulls(event.second);
	wDataOut[wDataOut.length] = {"_id": toInsert._id, "title": toInsert.title, "winner": toInsert.winner, "second": toInsert.second};
}

async function processTeamGame(event){
	//console.log("Team");
	//console.log(event);
	toInsert.title = event.title;
	toInsert._id = event._id
	let wWinnerTeam = await getTeam(event.winner);
	if (wWinnerTeam) {
		toInsert.winner = removeNulls(wWinnerTeam[0].member);
	}
	let wSecondTeam = await getTeam(event.second);
	if (wSecondTeam) {
		toInsert.second = removeNulls(wSecondTeam[0].member);
	}
	if (wWinnerTeam || wSecondTeam) {
		wDataOut[wDataOut.length] = {"_id": toInsert._id, "title": toInsert.title, "winner": toInsert.winner, "second": toInsert.second};
		var i;
		for (i = 1; i < wWinnerTeam.length; i++) {
			toInsert.title = "";
			if (wWinnerTeam) {
				toInsert.winner = removeNulls(wWinnerTeam[i].member);
			} else {
				toInsert.winner = "";
			}
			if (wSecondTeam) {
				toInsert.second = removeNulls(wSecondTeam[i].member);
			} else {
				toInsert.second = " ";
			}
			wDataOut[wDataOut.length] = {"_id": toInsert._id + i.toString(), "title": toInsert.title, "winner": toInsert.winner, "second": toInsert.second};
		}
	} else {
		wDataOut[wDataOut.length] = {"_id": toInsert._id + "None", "title": toInsert.title, "winner": "", "second": ""};
	}
}
*/

function removeNulls(pIn){
	if (pIn === null || pIn === undefined ) {
		return " ";
	} else {
		return pIn;
	}
}

//----------------------------------------------------------------MOBILE CODE-------------------------------------------------------------------------------------------

/**
export async function loadMobileData() {
	await loadTableData($w('#rgpMix').value);
	$w('#rptGames').data = wDataOut;
	wDataOut=[];
}

async function processMobileTeamGame(event){
	//console.log("Mobile Team");
	//console.log(event);	
	let strWinner = "";
	let strSecond = "";
	toInsert.title = event.title;
	toInsert._id = event._id;
	
	let wWinnerTeam = await getTeam(event.winner);
	if (wWinnerTeam) {
		var i;
		for (i = 0; i < (wWinnerTeam.length - 1); i++) {
			strWinner = strWinner + removeNulls(wWinnerTeam[i].member)+ "\n";
		}
		strWinner = strWinner + removeNulls(wWinnerTeam[wWinnerTeam.length-1].member);
	}
	let wSecondTeam = await getTeam(event.second);
	if (wSecondTeam) {
		for (i = 0; i < (wSecondTeam.length - 1); i++) {
			strSecond = strSecond + removeNulls(wSecondTeam[i].member) + "\n";
		}
		strSecond = strSecond + removeNulls(wSecondTeam[wSecondTeam.length-1].member)
	}
	if (wWinnerTeam || wSecondTeam) {
		wDataOut[wDataOut.length] = {"_id": toInsert._id, "title": toInsert.title, "winner": strWinner, "second": strSecond};
	} else {
		wDataOut[wDataOut.length] = {"_id": toInsert._id, "title": toInsert.title, "winner": "", "second": ""};
	}
}
*/