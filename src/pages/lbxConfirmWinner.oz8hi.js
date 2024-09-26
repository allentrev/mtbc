// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixWindow	from 'wix-window';

let wData = {};

$w.onReady(function () {
	wData = wixWindow.lightbox.getContext();
	$w('#txtPlayerA').text = wData.playerA;
	$w('#txtPlayerB').text = wData.playerB;
	
});

export function btnA_click(event) {
	wixWindow.lightbox.close("A");
}

export function btnB_click(event) {
	wixWindow.lightbox.close("B");
}