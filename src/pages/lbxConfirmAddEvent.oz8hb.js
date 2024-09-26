// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow	from 'wix-window';

let wData = {};

$w.onReady(function () {
	wData = wixWindow.lightbox.getContext();
	if (wData.saveAllowed){
		$w('#txtHeading').text = "Confirm Calendar Entry";
		$w('#btnSave').show();
	} else {
		$w('#txtHeading').text = "Event Summary";
		$w('#btnSave').hide();
	}
	let wDesc =  wData.desc1 + wData.desc2 + wData.desc3 + wData.desc4 + "\n"
	$w('#txtTitle').text = wData.summary;
	$w('#txtStartDate').text = wData.startDateTime + " - " + wData.endTime;
	$w('#txtDesc').text = wDesc; 
	
});

export function btnSave_click(event) {
  wixWindow.lightbox.close(true);
}

export function btnCancel_click(event) {
  wixWindow.lightbox.close(false);
}