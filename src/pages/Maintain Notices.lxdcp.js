//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is give a MEMBER the means to create a new notice.
//
//------------------------------------------------------------------------------------------------------

import {insertNotice} from 'public/objects/notice.js';

$w.onReady(function () {
	//TODO: write your page related code here...
	$w('#inpOpen').value = "O";
});


export function btnClear_click(event) {
	clearFields();
}

export function clearFields() {
	$w('#inpTitle').value=null;
	$w('#rgpUrgent').selectedIndex=1;
	$w('#txtMessage').value=null;
	$w('#imgPicture').src= undefined;
	$w('#uplPhoto').reset();
	$w('#txtMsg').text=undefined;
	$w('#txtOK').hide();
	$w('#txtFail').hide();
}

export function btnUpload_click(event) {
	if($w("#uplPhoto").value.length > 0) {
    $w("#txtMsg").text = `Uploading ${$w("#uplPhoto").value[0].name}`;
    $w("#uplPhoto").startUpload()
      .then( (uploadedFile) => {
        $w("#txtMsg").text = "Upload successful";
        $w("#imgPicture").src = uploadedFile.url;
        //console.log(uploadedFile.url);
      })
      .catch( (uploadError) => {
        $w("#txtMsg").text = "File upload error";
        console.log(`/page/MaintainNotice btnUpload Error: ${uploadError.errorCode}`);
        console.log(uploadError.errorDescription);
      });
  	} else {
    	$w("#txtMsg").text = "Please choose a file to upload.";
  	}
}

export function btnSubmit_click(event) {
	let wTitle = $w('#inpTitle').value;
	let wUrgent = $w('#rgpUrgent').value;
	let wPicture = $w('#imgPicture').src;
	let wMessage = $w('#txtMessage').value;
	let wStatus = "O";
	//console.log(wTitle + "/" + wUrgent + "/"  + wPicture + "/"  + wMessage + "/"  + wStatus);
	insertNotice(wTitle,wUrgent,wPicture,wMessage,wStatus);
	clearFields();
	$w('#txtOK').show();
}

export function inpTitle_change(event) {
	$w('#txtOK').hide();
}

export function btnClearImage_click(event) {
	$w('#imgPicture').src = null;
}