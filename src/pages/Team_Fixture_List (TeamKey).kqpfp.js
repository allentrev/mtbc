//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor the list of fixtures for the specified team.
//	and a link made availble to access the member's area home panel.
//
//------------------------------------------------------------------------------------------------------
import {loadTableData} from 'public/fixtures';
import { getNewLeagueForTeam } from 'backend/backTeam.jsw';
import wixLocationFrontend from 'wix-location-frontend';

// Premium site: "https://domain.com/"
// Free site: "https://user_name.wixsite.com/zoo/"
const gYear = new Date().getFullYear();

$w.onReady(async function () {
	let path = wixLocationFrontend.path;
	let wTeamKey = path[0].toUpperCase();
	//let wTeamKey = "KLA";
	let wResult = await getNewLeagueForTeam(wTeamKey);
	if (wResult.status){
		$w('#tblEvents').rows = await loadTableData(gYear, wTeamKey);
		let wLeague = wResult.league;
		let wTeam = wResult.team;
		let wLeagueName = wLeague.leagueName;
		let wDivision = parseInt(wLeague.division,10) || 0;
		let wTeamName = wTeam.teamName;
		if (wDivision === 0){
			$w('#txtHdr').text = `${wLeagueName} - ${wTeamName}`;
		} else {
			$w('#txtHdr').text = `${wLeagueName} Division ${wDivision} - ${wTeamName}`;
		}
	} else {
		console.log(`/dynamicPage/lstTeams/TeamFixtureList ${wTeamKey} onReady fail, err`);
		console.log(wResult.error);
	}
});
