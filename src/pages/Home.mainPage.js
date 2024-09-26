//------------------------------------------------------------------------------------------------------
//
//	This is the home page. It is mostly text but does contain a column strip that allows urgent notices
//	to be displayed e.g. Ground closed
//
//------------------------------------------------------------------------------------------------------
import wixWindow				from 'wix-window';
import wixLocation 				from 'wix-location';

import {getNotices}	from 'public/objects/notice.js';
import { loadStandingData } from 'backend/backSystem.jsw';
//---------------for testing------------------------------------------------------------------------
let gTest = false;
//--------------------------------------------------------------------------------------------------
let wData = [];						// array to hold any notices

$w.onReady(async function () {
	try {
		let [wOpeningTime, wOpeningDays, wGreenFees, wOpenDayMkr] = await loadStandingData("Home");

		let wLine1 = `The greens are open from ${wOpeningTime}, ${wOpeningDays}, until dusk, and Members are welcome
					 to come along for a roll-up and use the Green whenever it is available, ${wGreenFees}.`;
		$w('#lblLine1').text = wLine1;
		$w('#lblOpenDayMkr').text = wOpenDayMkr;
		if (wOpenDayMkr === "Y") {
			$w('#btnOpenDay').show();
		} else {
			$w('#btnOpenDay').hide();
		}
		asyncLoad();
	}
	catch (err) {
		console.log("/page Home onReady Try-catch err");
		console.log(err);
		if (!gTest) { wixLocation.to("/syserror")};
	}
});

export async function asyncLoad() {
//	This is a dummy function to allow loadNotices to be called asynchronously
	await loadNotices();
}

export async function loadNotices() {
//	Load any Urgent, Open notices and display the repeater once it is fully loaded.
//	otherwise hide the repeater

	wData = await getNotices("Y", "O");		// all open urgent notices
	if (wData) {
		let wMsg = "";
		wMsg = formMarqueeMsg(wData);
		$w("#htmlMarquee").postMessage(wMsg);
		$w('#htmlMarquee').show();
		$w('#btnNewsFlash').show();
	} else {
		$w('#htmlMarquee').hide();
		$w('#btnNewsFlash').hide();
	}
}

function formMarqueeMsg(pData){
	let wTemp = [
		{"label": "One", "value": "key1"},
		{"label": "two", "value": "key1"},
		{"label": "three", "value": "key1"},
		{"label": "four", "value": "key1"},
	]
	let wMsg = pData.map( function (rec) {
		return rec.title;
	}).join("&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp");

	return wMsg;
}

/**
*	Adds an event handler that runs when the HTML Component
 sends a message.
	[Read more](https://www.wix.com/corvid/reference/$w.HtmlComponent.html#onMessage)
*	 @param {$w.HtmlComponentMessageEvent} event
*/
export function htmlMarquee_message(event) {
    //console.log(`Message received by page code: ${event.data}`);

	wixWindow.openLightbox("lbxNewsFlash");

}