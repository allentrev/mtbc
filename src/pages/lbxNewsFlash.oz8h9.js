// For full API documentation, including code examples, visit https://wix.to/94BuAAs

import {getNotices}	from 'public/objects/notice.js';

let wData = [];						// array to hold any notices

$w.onReady(function () {
	asyncLoad();
	
 	$w("#repeater1").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeater($item, itemData);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
	
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
		$w("#repeater1").data = wData;
	}
}

async function loadRepeater($item, itemData) {
		// populates a repeated item in the repeater
		// item holds: title, _createdDate, Message
		
		$item("#txtTitle").text = itemData.title;
		let wDateTime = itemData._updatedDate;
		let wDate = wDateTime.toDateString();
		let wHours = wDateTime.getHours();
		if (wHours < 10 ){
			wHours = "0" + wHours;
		}
		let wMinutes = wDateTime.getMinutes();
		if (wMinutes < 10 ){
			wMinutes = "0" + wMinutes;
		}
    	$item("#txtDateTime").text =wDate + " " + wHours + ":" + wMinutes;
		$item("#txtMessage").text = itemData.message;
}
