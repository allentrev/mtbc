import wixWindow				from 'wix-window';
import wixWindowFrontend		from 'wix-window-frontend';

import { sendRegisterRequest } from 'backend/email.jsw';

$w.onReady(function () {

   	$w('#btnClose').onClick(() => doClose());
    $w('#btnRegister').onClick(() => doRegister());
    $w('#btnLogin').onClick(() => doLogin());

})

export function doClose(){
	wixWindow.lightbox.close();
}

export function doLogin(){
	//console.log("Do login");
	wixWindowFrontend.openLightbox("lbxLogin1");
	//ixWindowFrontend.lightbox.close();
}

export async function doRegister(){

	if ($w('#inpName').valid) {
		if ($w('#inpEmail').valid) {
			let wStatus = await sendRegisterRequest($w('#inpName').value, $w('#inpEmail').value);
			showError("Register", 4, 3);
			wixWindowFrontend.lightbox.close();
		} else {
			showError("Register", 4, 2);
		}
	} else {
		showError("Register", 4, 1);
	}
}


export function showError(pTarget, pSecs, pMsg) {
    let wMsg = ["Must enter a name",
        "Must enter a valid email",
        "Email request sent",
        "",
        "", //5
        "",
        "",
        "",
        "",
        "", // 10
        "",
        "Last Message"
    ];
    let pTime = pSecs * 1000;
    if (pMsg > 0) {
        $w(`#txt${pTarget}ErrMsg`).text = wMsg[pMsg - 1];
    }
    $w(`#txt${pTarget}ErrMsg`).expand();
    setTimeout(() => {
        $w(`#txt${pTarget}ErrMsg`).collapse();
    }, pTime);
    return;
}