//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is give a MEMBER the means to close an open notice.
//
//------------------------------------------------------------------------------------------------------
import wixLocation 			from 'wix-location';

import {getAllNotices}		from 'public/objects/notice.js';
import {updateNoticeStatus}	from 'public/objects/notice.js';

let wData = [];

$w.onReady(function () {

	$w('#btnUpdate').hide();
	
	loadNotices();
    
 	$w("#repeater1").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeater($item, itemData);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
});

export async function loadNotices() {
	wData = await getAllNotices();		// all open notices
	//console.log(wData);
	$w("#repeater1").data = wData;
	if (wData && wData.length === 0 ){
		console.log("/page/CloseNotice loadNotices : No notices");
	}
}

async function loadRepeater($item, itemData) {
		// item holds: title, picture, message, createdDate
		let wPositionKey = itemData.positionKey;
		$item("#txtTitle").text = itemData.title;
		$item("#txtId").text = itemData._id;
}

export function btnUpdate_click(event) {
	$w("#repeater1").forEachItem( ($item, itemData, index) => {
		if ($item('#chkUpdated').checked) { 
			let wNoticeId = $item("#txtId").text;
			updateRecord(wNoticeId);
			//console.log("Update record" + $item('#txtMember').text + "/" + wPositionId + "/" + wMemberId);
			$item("#chkUpdated").checked = false;
		}
	});
	$w("#txtMessage").show();
	$w('#btnUpdate').hide("")
	 .then( () => {
	});
}

export async function updateRecord (pNoticeId ){
		const res = await updateNoticeStatus(pNoticeId, "C");
}

export function chkUpdated_change(event) {
	$w('#btnUpdate').show();
}