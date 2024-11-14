//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor a list of all the open notices.
//
//------------------------------------------------------------------------------------------------------
import wixWindow		from 'wix-window';

import {getAllNotices}	from 'backend/backNotices.web';

let wData = [];
const gYear = new Date().getFullYear();

$w.onReady(function () {

	loadNotices();

	$w('#videoPlayer1').src = "wix:video://v1/88f9e9_bc0f3e01a65241a9a9bca4ea15e1525c/_#posterUri=88f9e9_bc0f3e01a65241a9a9bca4ea15e1525cf000.jpg&posterWidth=320&posterHeight=568";
    
 	$w("#repeater1").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeater($item, itemData);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
});

export async function loadNotices() {
	let wResult = await getAllNotices(gYear);
	let wAllNotices = wResult.notices;
	if (wAllNotices && wAllNotices.length > 0){
		wData = wAllNotices.filter(item => item.status === "O")
		$w("#repeater1").data = wData;
	} else {
		console.log("Noticeboard loadNotices No notices");
	}
}

async function loadRepeater($item, itemData) {

		let wText = itemData.message;
		if (wText.includes("<p") || wText.includes("</p>")) {
			$item("#txtMessage").html = itemData.message;
		} else {
			$item("#txtMessage").text = itemData.message;
		}
		$item("#txtTitle").text = itemData.title;
		$item("#imgPicture").src = itemData.picture;
}