//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is give a Press Officer the means to create a new News Report.
//
//------------------------------------------------------------------------------------------------------
import wixLocation 			from 'wix-location';
import { currentMember } 	from 'wix-members';

import {insertNewsReport}	from 'public/objects/newsReport.js';
import {getNewsReport}		from 'public/objects/newsReport.js';

$w.onReady(function () {
	//$w('#btnSave').disable();
	let xDate = new Date();
	let xDay = xDate.getDay() - 1;;
	let xNewDate = new Date();
	xNewDate.setDate(xDate.getDate() - xDay);
	xNewDate.setHours(10,0,0,0);
	$w('#dpkWeek').value = xNewDate;
});

export function btnClear_click(event) {
	clearFields();
}

export function clearFields() {
	$w('#rtbNewsReport').value= "";
	$w('#txtOK').hide();
	$w('#txtDpkError').hide();
}

export async function btnSave_click(event) {
	let wWeek = $w('#dpkWeek').value;
	wWeek.setHours(10,0,0,0);
	let wItem = await getNewsReport(wWeek);
	if (wItem) {
		$w('#txtDpkError').text = "A News Report for this week already exists";
		$w('#txtDpkError').show();
		$w('#txtOK').text = "See message above";
		$w('#txtOK').show();
		console.log("/page/CreateNewsReport: Cant update existing report");
		//$w('#btnSave').disable();
		return;
	} else {
		$w('#txtDpkError').hide();
	}

	if (!$w('#rtbNewsReport').valid) {
		$w('#txtDpkError').text = "News Report not valid.";
		$w('#rtbNewsReport').focus();
		$w('#txtDpkError').show();
		console.log("/page/CreateNewsReport: rtNewsReport not valid");
	} else {
		let wItem = await insertNewsReport(wWeek,$w('#rtbNewsReport').value);
		if (wItem) { 
			$w('#txtOK').text = "Report Saved";
			console.log("/page/CreateNewsReport: Report Saved");
		} else  {
			$w('#txtOK').text = "Save failed";
			console.log("/page/CreateNewsReport: Save failed");
		}
		$w('#txtOK').show();
	}
	//$w('#btnSave').disable();
	
}

	// This function was added from the Properties & Events panel. To learn more, visit http://wix.to/UcBnC-4
	// Add your code for this event here: 

export async function dpkWeek_click(event) {
	$w('#txtDpkError').text = "A News Report for this week already exists";
	$w('#txtDpkError').hide();
	$w('#txtOK').hide();
	$w('#rtbNewsReport').value = "";
	let wWeek = $w('#dpkWeek').value;
	wWeek.setHours(10,0,0);
	let wItem = await getNewsReport(wWeek);
	if (wItem) {
		$w('#txtDpkError').show();
		//$w('#btnSave').disable();
	} else {
		$w('#txtDpkError').hide();
		//w('#btnSave').enable();
	}
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
*	Adds an event handler that runs when the cursor is inside the
 input element and a key is pressed.
	[Read more](https://www.wix.com/corvid/reference/$w.TextInputMixin.html#onKeyPress)
*	 @param {$w.KeyboardEvent} event
*/
export function rtbNewsReport_keyPress(event) {
	$w('#txtOK').hide();
	$w('#btnSave').enable();
}

/**
*	Adds an event handler that runs when an input element's value
 is changed.
	[Read more](https://www.wix.com/corvid/reference/$w.ValueMixin.html#onChange)
*	 @param {$w.Event} event
*/
export function rtbNewsReport_change(event) {
	$w('#txtOK').hide();
	$w('#btnSave').enable();
}

/**
*	Adds an event handler that runs when the element is clicked.
	[Read more](https://www.wix.com/corvid/reference/$w.ClickableMixin.html#onClick)
*	 @param {$w.MouseEvent} event
*/
