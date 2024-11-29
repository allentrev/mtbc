//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor a list of all the open notices.
//
//------------------------------------------------------------------------------------------------------
import wixWindow		from 'wix-window';

import {getAllNotices}	from 'backend/backNotices.web';

const gYear = new Date().getFullYear();

$w.onReady(function () {

	loadNotices();

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
		let wWebNotices = wAllNotices.filter( item => item.web === "Y")
									.filter(item => item.status === "O");
		$w("#repeater1").data = wWebNotices;
	} else {
		console.log("Noticeboard loadNotices No notices");
	}
}

async function loadRepeater($item, itemData) {
		let wPicture = itemData.picture;
		if (wPicture && wPicture.length > 0){
			$item('#imgPicture').show()
			$item("#imgPicture").src = itemData.picture;
		} else {
			$item('#imgPicture').hide();
			$item("#imgPicture").src = "";
		}
		let wText = itemData.message;
		if (wText.includes("<p") || wText.includes("</p>")) {
			$item("#txtMessage").html = itemData.message;
		} else {
			$item("#txtMessage").text = itemData.message;
		}
		$item("#txtTitle").text = itemData.title;
}