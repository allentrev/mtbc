//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is give a MEMBER the means to update an open notice.
//
//------------------------------------------------------------------------------------------------------
import wixLocation		from 'wix-location';

import {getNotice}		from 'public/objects/notice.js';
import {loadNotices}	from 'public/objects/notice.js';
import {updateNotice}	from 'public/objects/notice.js';

let wData = [];
let wNoticeId;

$w.onReady(function () {

	$w('#btnUpdate').hide();
	
	loadData();
    
});

export async function loadData() {
	wData = await loadNotices();		// all open notices
	$w('#drpNotices').options = wData;
	$w('#drpNotices').selectedIndex=0;
	drpNotices_change();
}

export function btnUpdate_click(event) {
	updateRecord(wNoticeId);
	$w("#txtMessage").show();
	$w('#btnUpdate').hide("")
	 .then( () => {
	});
}

export async function updateRecord (pNoticeId ){
		let wTitle = $w('#inpTitle').value;
		let wUrgent = "N";
		if ($w('#rgpUrgent').selectedIndex === 0){
			wUrgent = "Y";
		}
		let wMessage = $w('#inpMessage').value;
		let wPicture = $w('#imgPicture').src;
		const res = await updateNotice(pNoticeId, wTitle, wUrgent, wMessage,wPicture);
}

export async function drpNotices_change(event) {
	$w('#txtMessage').hide();
	wNoticeId = $w('#drpNotices').value;
	let wNotice = await getNotice(wNoticeId);
	$w('#inpTitle').value=wNotice.title;
	if (wNotice.urgent === "Y") {
		$w('#rgpUrgent').selectedIndex=0;
	} else {
		$w('#rgpUrgent').selectedIndex=1;
	}
	$w('#inpMessage').value = wNotice.message;
	$w('#imgPicture').src=wNotice.picture;
}

export function inpTitle_change(event) {
		$w('#txtMessage').hide();
		$w('#btnUpdate').show();
}

export function rgpUrgent_change(event) {
		$w('#txtMessage').hide();
		$w('#btnUpdate').show();
}

export function inpMessage_change(event) {
		$w('#txtMessage').hide();
		$w('#btnUpdate').show();
}

export function btnUpload_click(event) {
	$w('#txtMessage').hide();
	if($w("#uplPhoto").value.length > 0) {
    $w("#txtMsg").text = `Uploading ${$w("#uplPhoto").value[0].name}`;
    $w("#uplPhoto").startUpload()
      .then( (uploadedFile) => {
        $w("#txtMsg").text = "Upload successful";
        $w("#imgPicture").src = uploadedFile.url;
		$w('#btnUpdate').show();
      })
      .catch( (uploadError) => {
        $w("#txtMsg").text = "File upload error";
        console.log(`/page/UpdateNotice btnUpload Page Update Notice: Error: ${uploadError.errorCode}`);
        console.log(uploadError.errorDescription);
      });
  	} else {
    	$w("#txtMsg").text = "Please choose a file to upload.";
  	}
}

export function btnClear_click(event) {
	$w('#txtMessage').hide();
	$w('#btnUpdate').show();
	$w('#imgPicture').src = null;
}
