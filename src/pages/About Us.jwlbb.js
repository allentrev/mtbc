import wixLocation 				from 'wix-location';
import wixWindow from 'wix-window';

import { loadStandingData } from 'backend/backSystem.jsw';

//---------------for testing------------------------------------------------------------------------
let gTest = false;
const gYear = new Date().getUTCFullYear() 
//--------------------------------------------------------------------------------------------------

$w.onReady(async function () {
    try {
    	let [wFullFee, wJoiningFee, wSocialFee, wRollUpFee, wCompFee, wMatchFee] = await loadStandingData("About Us");

		let wLine1 = `
        Our Full Membership Fee for ${gYear} is £${wFullFee} with ${wJoiningFee}, the Social Membership fee for ${gYear} is £${wSocialFee}\n
        Use of the green for Roll Ups and Club Competitions is ${wRollUpFee}.\n
        There is a fee of £${wCompFee} for each Club Competition entered.\n
        There is a match fee of £${wMatchFee} for interclub matches to cover the cost of the snack provided at the end of the game. If a meal is provided the charge may be higher.
        `;
    
    	$w('#lblLine1').text = wLine1;

    }
    catch (err) {
		console.log("/page AboutUs onReady Try-catch, err");
		console.log(err);
        	if (!gTest) { wixLocation.to("/syserror")};
	}
});

