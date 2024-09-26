import wixLocation from 'wix-location';
import { getNewLeagueForTeam } from 'backend/backTeam.jsw';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(async function () {

	//let wTeam = "KLA";
	let path = wixLocationFrontend.path;
	let wTeam = path[0].toUpperCase();
	$w('#btnLink').collapse();
	if (wTeam === "RSA"){
		$w('#secRSA').expand();
		$w('#secGeneral').collapse();
	} else {
		$w('#secRSA').collapse();
		$w('#secGeneral').expand();
	}
	if (wTeam === "TVA" || wTeam === "TVB") {
		$w('#btnLink').expand();
	}
	let wResult = await getNewLeagueForTeam(wTeam);
	if (wResult.status){
		let wLeague = wResult.league;
		let wUrlResult = wLeague.urlResult;
		let wUrlLink = wLeague.urlLink;
        $w('#html1').src = wUrlResult;
		$w('#btnLink').onClick( (event) => { doLink(wUrlLink)});
	} else {
		console.log(`/dynamicPage/lstTeams/TeamResult ${wTeam} onReady fail, err`);
		console.log(wResult.error);
	}
});

export function doLink(pUrl) {
	wixLocation.to(`${pUrl}`);
}