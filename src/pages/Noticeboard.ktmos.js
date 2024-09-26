//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to show a visitor a list of all the open notices.
//
//------------------------------------------------------------------------------------------------------
import wixWindow		from 'wix-window';

import {getAllNotices}	from 'public/objects/notice.js';
import {formatDate}		from 'public/fixtures';

let wData = [];

$w.onReady(function () {
	//TODO: write your page related code here...

	loadNotices();

	$w('#videoPlayer1').src = "wix:video://v1/88f9e9_bc0f3e01a65241a9a9bca4ea15e1525c/_#posterUri=88f9e9_bc0f3e01a65241a9a9bca4ea15e1525cf000.jpg&posterWidth=320&posterHeight=568";
    
 	$w("#repeater1").onItemReady( ($item, itemData, index) => {
    	//console.log("On ready =" + itemData.toSource());
		loadRepeater($item, itemData);
    	//$item("#profilePic").src = itemData.profilePic;
	 });
});

export async function loadNotices() {
	wData = await getAllNotices();		// all open notices
	$w("#repeater1").data = wData;
	if (wData.length === 0 ){
		console.log("/page Noticeboard loadNotices No notices");
	}
}

async function loadRepeater($item, itemData) {

		let wSrc = itemData.source;
		if (wSrc) {
			$item('#vplyr1').expand();
			$item('#vplyr1').src = wSrc;
		} else {
			$item('#vplyr1').collapse();
		}
		// item holds: title, picture, message, createdDate
		let wPositionKey = itemData.positionKey;
		$item("#txtTitle").text = itemData.title;
		////let wDateTime = itemData._createdDate;
		//let wDate2 = wDateTime.toDateString();
		////-let wHours = wDateTime.getHours();
		////if (wHours < 10 ){
		////	wHours = "0" + wHours;
		////}
		////let wMinutes = wDateTime.getMinutes();
		////if (wMinutes < 10 ){
		////	wMinutes = "0" + wMinutes;
		////}
    	////let wDate = formatDate(wDateTime);
		$item("#txtMessage").text = itemData.message;
		$item("#imgPicture").src = itemData.picture;
}