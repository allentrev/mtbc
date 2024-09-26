import wixLocation 				from 'wix-location';
import { currentMember } 		from 'wix-members';

import {getNewsReport} 			from 'public/objects/newsReport.js';
import {updateNewsReport}		from 'public/objects/newsReport.js';
import {updateNewsReportStatus}	from 'public/objects/newsReport.js';

$w.onReady(function () {

	$w('#btnSave').disable();
	$w('#btnDelete').hide();
	let xDate = new Date();
	xDate.setHours(10,0,0);
	$w('#dpkWeek').value = xDate;
});

export async function dpkWeek_click(event) {
	$w('#txtDpkError').hide();
	$w('#txtOK').hide();
	$w('#rtbReport').value = "";
	$w('#txtId').text = "";
	let wWeek = $w('#dpkWeek').value;
	wWeek.setHours(10,0,0);
	//console.log("Weeke = ", wWeek);
	let wItem = await getNewsReport(wWeek);
	//console.log(wItem);
	if (wItem) {
		$w('#rtbReport').value = wItem.report;
		$w('#txtId').text = wItem._id;
		$w('#btnSave').enable();
		$w('#btnDelete').show();
	} else {
		$w('#txtDpkError').show();
		$w('#btnSave').disable();
		$w('#btnDelete').hide();
	}
}

export async function btnSave_click(event) {
	//Add your code for this event here: 
	const res = await updateNewsReport($w('#txtId').text, $w('#rtbReport').value);
	if (res) {
		$w('#txtOK').text = "Change saved";
		console.log("/page/MaintainNewsReport btnSave : change saved");
	} else {
		$w('#txtOK').text = "Change failed";
		console.log("/page/MaintainNewsReport btnSave  : change failed", res);
	}
	$w('#txtOK').show();

	$w('#btnSave').disable();
	$w('#btnDelete').hide();
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export async function btnDelete_click(event) {
	const res = await updateNewsReportStatus($w('#txtId').text, "D");
	$w('#btnSave').disable();
	$w('#txtOK').hide();
	$w('#btnDelete').hide();
	$w('#txtDpkError').show();
	$w('#rtbReport').value = "";
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
export async function btnClose_click(event) {
	let wMember = await currentMember.getMember();
	let wSlug = wMember.profile.slug;
	wixLocation.to(`/profile/${wSlug}/membersMenu`);

}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
