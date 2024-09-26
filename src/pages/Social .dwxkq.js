import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';
import wixLocation 				from 'wix-location';
import wixSiteFrontend from 'wix-site-frontend';
import _ from 'lodash';

import { loadStandingData } from 'backend/backSystem.jsw';


//---------------for testing------------------------------------------------------------------------
let gTest = false;
const gYear = new Date().getFullYear();

//--------------------------------------------------------------------------------------------------
$w.onReady(async function () {
    try {

		let [wRollUpDay, wRollUpArrive, wRollUpStart,
			wMayDay, wMayArrive, wMayCost,
			wTomLDay, wClubNightDay, wTomLCost, wTomLArrive] = await loadStandingData("Social");

		let wLine1 = `
			Roll Ups (${wRollUpDay})
		`;
		let wLine2 = 
		`We have two organised roll-up sessions during the week on ${wRollUpDay}.` + 
		`Plan to arrive by ${wRollUpArrive} for a start at ${wRollUpStart}. The number of rinks used and the type of game will be decided on the day and` +
		`is dependent on the number of people who turn up for a game.\n\n` +
		`You are free to roll-up at any time convenient to yourself providing that there is a spare rink.` 
		;
		let wLine3 = `
			May's Days (${wMayDay})
		`;
		let wLine4 = `
		May’s Day was started back in the ‘70’s by May Blick and her name has been perpetuated every week during
		the summer season ever since.  Members wishing to play need to arrive before ${wMayArrive} and will be organised
		into teams, the cost is £${wMayCost}, which includes tea and biscuits afterwards and also contributes towards
		the end of season prize money.\n
		It is a game for bowlers of all abilities from beginners to the more experienced who feel they want some practice.
		`;
		let wLine5 = `
		Tom Linscott (${wTomLDay})
		`;
		let wLine6 = `
		Club Night (${wClubNightDay})
		`;
		let wLine7 = `
		The weekly event takes place on ${wClubNightDay}, starting with the Tom Linscott bowls session costing just £${wTomLCost}
		Club members wishing to take part should arrive before ${wTomLArrive}
		`;

		$w('#lblLine1').text = wLine1;
		$w('#lblLine2').text = wLine2;
		$w('#lblLine3').text = wLine3;
		$w('#lblLine4').text = wLine4;
		$w('#lblLine5').text = wLine5;
		$w('#lblLine6').text = wLine6;
		$w('#lblLine7').text = wLine7;
    
	}
    catch (err) {
	console.log("/page Social onReady Try-catch, err");
	console.log(err);
        if (!gTest) { wixLocation.to("/syserror")};
	}
});