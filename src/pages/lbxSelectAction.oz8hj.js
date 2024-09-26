// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow	from 'wix-window';

let wData = {};

$w.onReady(function () {
	wData = wixWindow.lightbox.getContext();

	$w('#lblFullName').text = wData.fullName;
	$w('#txtField').text = wData.fieldName;
	$w('#txtWixValue').text = wData.wixValue;
	$w('#txtLstValue').text = wData.lstValue;
});

export function btnMTBC_click(event) {
	wixWindow.lightbox.close("M");
}

export function btnWix_click(event) {
	wixWindow.lightbox.close("W");
}

export function btnSkip_click(event) {
	wixWindow.lightbox.close("S");
}