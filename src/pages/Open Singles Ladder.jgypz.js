import wixWindow					from 'wix-window';

import { loadOpenSinglesTable }		from 'public/objects/openSingles.js';

let wPlayed = "Played";

$w.onReady(function () {

	$w('#cstrpFinal').show();

	if (wixWindow.formFactor === "Mobile") {
		wPlayed = "#";
	}

	loadData();

    
 	$w("#rptFinal").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterFinal($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });

 	$w("#rptR2AGroup").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterR2A($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });

 	$w("#rptR2BGroup").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterR2B($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });

 	$w("#rptGroupA").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterA($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });

 	$w("#rptGroupB").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeaterB($item, itemData, index);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
});

export async function loadData() {
	//$w('#rptFinal').data = wData;
	loadOpenSinglesTable("OS01", "Ladder A")
	.then( (wDataA) => {
		transform(wDataA)
		$w('#rptGroupA').data = wDataA;
	})
	.catch( (err) => {
		console.log("No Ladder A games found")
	});

	loadOpenSinglesTable("OS01", "Ladder B")
	.then( (wDataB) => {
		transform(wDataB);
		$w('#rptGroupB').data = wDataB;
	})
	.catch( (err) => {
		console.log("No Ladder B games found")
	});

	loadOpenSinglesTable("OS01", "Ladder R2A")
	.then( (wDataR2A) => {
		transform(wDataR2A);
		$w('#rptR2AGroup').data = wDataR2A;
	})
	.catch( (err) => {
		console.log("No Ladder R2A games found")
	});

	loadOpenSinglesTable("OS01", "Ladder R2B")
	.then( (wDataR2B) => {
		transform(wDataR2B);
		$w('#rptR2BGroup').data = wDataR2B;
	})
	.catch( (err) => {
		console.log("No Laddeer R2B games found")
	});

	loadOpenSinglesTable("OS01", "Ladder Final")
	.then( (wDataF) => {
		transform(wDataF)
		$w('#rptFinal').data = wDataF;
	})
	.catch( (err) => {
		console.log("No Ladder Final games found")
	});


}

function transform(pIn){
	let first = {"_id": "1", "name": "Player", "hcp": "Hcp", "played": wPlayed, "pointsAgainst": "Against", "pointsFor": "For"};
	let wArray = pIn;
	return wArray.unshift(first);
}

async function loadRepeaterA($item, itemData, index) {
		// item holds: title, picture, message, createdDate
		if (index === 0 ) {
			$item('#boxA').style.backgroundColor = "#DEB887";
			$item("#txtAPos").text = "Pos";
			$item("#txtAPlayer").text = itemData.name;
			$item("#txtAHandicap").text = itemData.hcp;
			$item("#txtAGamesPlayed").text = itemData.played;
			$item("#txtAShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtAShotsFor").text = itemData.pointsFor;
		} else {
			if (index < 5){
				$item('#boxA').style.backgroundColor = "rgba(255,255,51,0.8)";
			}
			$item("#txtAPos").text = String(index);
			$item("#txtAPlayer").text = itemData.name;
			$item("#txtAHandicap").text = String(itemData.hcp);
			$item("#txtAGamesPlayed").text = String(itemData.played);
			$item("#txtAShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtAShotsFor").text = String(itemData.pointsFor);
		}
	}

	async function loadRepeaterB($item, itemData, index) {
		// item holds: title, picture, message, createdDate
		if (index === 0 ) {
			$item('#boxB').style.backgroundColor = "#DEB887";
			$item("#txtBPos").text = "Pos";
			$item("#txtBPlayer").text = itemData.name;
			$item("#txtBHandicap").text = itemData.hcp;
			$item("#txtBGamesPlayed").text = itemData.played;
			$item("#txtBShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtBShotsFor").text = itemData.pointsFor;
		} else {
			if (index < 5){
				$item('#boxB').style.backgroundColor = "rgba(255,255,51,0.8)";
			}
			$item("#txtBPos").text = String(index);
			$item("#txtBPlayer").text = itemData.name;
			$item("#txtBHandicap").text = String(itemData.hcp);
			$item("#txtBGamesPlayed").text = String(itemData.played);
			$item("#txtBShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtBShotsFor").text = String(itemData.pointsFor);
		}
	}

async function loadRepeaterR2A($item, itemData, index) {
		// item holds: title, picture, message, createdDate
		if (index === 0 ) {
			$item('#boxR2A').style.backgroundColor = "#DEB887";
			$item("#txtR2APos").text = "Pos";
			$item("#txR2APlayer").text = itemData.name;
			$item("#txtR2AHandicap").text = itemData.hcp;
			$item("#txtR2AGamesPlayed").text = itemData.played;
			$item("#txtR2AShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtR2AShotsFor").text = itemData.pointsFor;
		} else {
			$item("#txtR2APos").text = String(index);
			$item("#txtR2APlayer").text = itemData.name;
			$item("#txtR2AHandicap").text = String(itemData.hcp);
			$item("#txtR2AGamesPlayed").text = String(itemData.played);
			$item("#txtR2AShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtR2AShotsFor").text = String(itemData.pointsFor);
		}
	}


async function loadRepeaterR2B($item, itemData, index) {
		// item holds: title, picture, message, createdDate
		if (index === 0 ) {
			$item('#boxR2B').style.backgroundColor = "#DEB887";
			$item("#txtR2BPos").text = "Pos";
			$item("#txtR2BPlayer").text = itemData.name;
			$item("#txtR2BHandicap").text = itemData.hcp;
			$item("#txtR2BGamesPlayed").text = itemData.played;
			$item("#txtR2BShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtR2BShotsFor").text = itemData.pointsFor;
		} else {
			$item("#txtR2BPos").text = String(index);
			$item("#txtR2BPlayer").text = itemData.name;
			$item("#txtR2BHandicap").text = String(itemData.hcp);
			$item("#txtR2BGamesPlayed").text = String(itemData.played);
			$item("#txtR2BShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtR2BShotsFor").text = String(itemData.pointsFor);
		}
	}

	async function loadRepeaterFinal($item, itemData, index) {
		// item holds: title, picture, message, createdDate
		if (index === 0 ) {
			$item('#boxFinal').style.backgroundColor = "#DEB887";
			$item("#txtFinalPos").text = "Pos";
			$item("#txtFinalPlayer").text = itemData.name;
			$item("#txtFinalHandicap").text = itemData.hcp;
			$item("#txtFinalGamesPlayed").text = itemData.played;
			$item("#txtFinalShotsAgainst").text = itemData.pointsAgainst;
			$item("#txtFinalShotsFor").text = itemData.pointsFor;
		} else {
			//$w('#boxFinal').style.backgroundColor = "#FFFFFF";
			$item("#txtFinalPos").text = String(index);
			$item("#txtFinalPlayer").text = itemData.name;
			$item("#txtFinalHandicap").text = String(itemData.hcp);
			$item("#txtFinalGamesPlayed").text = String(itemData.played);
			$item("#txtFinalShotsAgainst").text = String(itemData.pointsAgainst);
			$item("#txtFinalShotsFor").text = String(itemData.pointsFor);
		}
	}
