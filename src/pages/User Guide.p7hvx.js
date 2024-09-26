// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {

	let wContents = [
		{"_id": 1, "subject": "Introduction"},
		{"_id": 2, "subject": "Users and Roles"},
		{"_id": 3, "subject": "Know Your Way Around the Web Site"},
		{"_id": 4, "subject": "How to get started on the web site"},
		{"_id": 5, "subject": "Members Area"},
		{"_id": 6, "subject": "How to Manage Photos"},
		{"_id": 7, "subject": "Standard Maintenance Page"},
		{"_id": 8, "subject": "New Season Process"},
		{"_id": 9, "subject": "End of Season Process"},
		{"_id": 10, "subject": "Events and Booking management"},
		{"_id": 11, "subject": "News management"},
		{"_id": 12, "subject": "Inter-Club Team management"},
		{"_id": 13, "subject": "Intra-Club Competition management"},
		{"_id": 14, "subject": "Remaining Pages"},
		{"_id": 15, "subject": "WIX Infrastructure"}
	]

	$w('#tblContents').rows = wContents;

	$w("#tblContents").onRowSelect( (event) => { loadItem(event)} );
	$w("#btn1Close").onClick( (event) => { closeBox()} );
	$w("#btn2Close").onClick( (event) => { closeBox()} );
	$w("#btn3Close").onClick( (event) => { closeBox()} );
	$w("#btn4Close").onClick( (event) => { closeBox()} );
	$w("#btn5Close").onClick( (event) => { closeBox()} );
	$w("#btn6Close").onClick( (event) => { closeBox()} );
	$w("#btn7Close").onClick( (event) => { closeBox()} );
	$w("#btn8Close").onClick( (event) => { closeBox()} );
	$w("#btn9Close").onClick( (event) => { closeBox()} );
	$w("#btn10Close").onClick( (event) => { closeBox()} );
	$w("#btn11Close").onClick( (event) => { closeBox()} );
	$w("#btn12Close").onClick( (event) => { closeBox()} );
	$w("#btn13Close").onClick( (event) => { closeBox()} );
	$w("#btn14Close").onClick( (event) => { closeBox()} );
	$w("#btn15Close").onClick( (event) => { closeBox()} );

});

export function loadItem(pEvent) {
	let rowIndex = parseInt(pEvent.rowIndex,10);
	
	let secName = `#sec${String(rowIndex+1)}`;
	$w('#secContents').collapse();
	$w(secName).expand();
}

export function closeBox() {

	$w('#secContents').expand();
	clearSections();

}

function clearSections(){
	$w('#sec1').collapse();
	$w('#sec2').collapse();
	$w('#sec3').collapse();
	$w('#sec4').collapse();
	$w('#sec5').collapse();
	$w('#sec6').collapse();
	$w('#sec7').collapse();
	$w('#sec8').collapse();
	$w('#sec9').collapse();
	$w('#sec10').collapse();
	$w('#sec11').collapse();
	$w('#sec12').collapse();
	$w('#sec13').collapse();
	$w('#sec14').collapse();
	$w('#sec15').collapse();

}

