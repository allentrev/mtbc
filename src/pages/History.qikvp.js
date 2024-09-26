import wixWindow from 'wix-window';
import wixLocation 				from 'wix-location';

import { loadStandingData } from 'backend/backSystem.jsw';

//---------------for testing------------------------------------------------------------------------
let gTest = false;
const gYear = new Date().getFullYear();
//--------------------------------------------------------------------------------------------------

$w.onReady(async function () {
    try {
		let [wNoExtensions, wNoMen, wNoLadies, wEBAPresidents, wCountyPresidents,
		 wCountySecs,wNoLadiesCountyPresidents, wLadiesCountyPresidentsList ] = await loadStandingData("History");

		let wLine1 = `
		The Club has grown from strength to strength and the Pavilion has been replaced four times
		 and has had ${wNoExtensions} big extensions over the years. Current membership (${gYear}) numbers
		  ${wNoMen} Men and ${wNoLadies} Ladies who compete in all the county and national competitions as can be seen
		   from the club honours board.
		`;

		let wLine2 = `
		The Club has supplied ${wEBAPresidents}; ${wCountyPresidents} as well as ${wCountySecs}.\n
		Also in the club's history, there have been ${wNoLadiesCountyPresidents} Ladies who have been Ladies County Presidents - ${wLadiesCountyPresidentsList}.
		`;
		$w('#lblLine1').text = wLine1;
		$w('#lblLine2').text = wLine2;

    }
	catch (err) {
		console.log("/page History onReady Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")};
	}
});