import {session} 					from 'wix-storage-frontend';
import wixLocationFrontend			from 'wix-location-frontend';
import wixLocation 					from 'wix-location';
import { updateMTBCMemberToken }	from "backend/backMember.jsw";
import { doHash }	                from "public/objects/member";

import { sendForgotUsernameEmail }      from "backend/backMember.jsw";

let gLstMemberId = "";
let gRequestType = "";

$w.onReady(function () {

    let wQuery = wixLocation.query;
	gLstMemberId = wQuery.lstId || null;
    //gRequestType = wQuery.type || "Refresh";
    gRequestType = wQuery.type || "Credentials";
    //gLstMemberId = "07e75e90-fa0c-444c-b1d0-4797616d4aa3"; //Heen
    //gRequestType = "Refresh";
    console.log("/page/Refresh onready, query, requesttype, lstId");
    console.log(gRequestType, gLstMemberId);
    let pageHistory = "";
    let historyArray = [];
    let wNewPage = "";

    switch (gRequestType) {
        case "Password":
        case "'Password'":
        case 'Password':
            //console.log("Password");
            $w('#secRefresh').collapse();
            $w('#secChangePassword').expand();
            $w('#secForgotCredentials').collapse();
            break;
        case "Credentials":
        case "'Credentials'":
        case 'Credentials':
            //console.log("Cred");
            $w('#secRefresh').collapse();
            $w('#secChangePassword').collapse();
            $w('#secForgotCredentials').expand();
            break;
        default:    //"Refresh"
            //console.log("Refresh");
            $w('#secRefresh').expand();
            $w('#secChangePassword').collapse();
            $w('#secForgotCredentials').collapse();

            pageHistory = session.getItem("pageHistory");
            historyArray = pageHistory.split(",");
            //console.log("History Array");
            //console.log(historyArray);
            wNewPage = historyArray[1].trim();
            if (wNewPage.includes("undefined") || wNewPage === undefined || wNewPage === null) {
                wNewPage = "/";
            }
            setTimeout(() => {
                wixLocationFrontend.to(wNewPage);
            },  1500);
            break;
    }

    $w('#btnSubmit').onClick(() => doChangePassword()); 
	$w('#btnSubmitRequest').onClick(() => doSubmitCredentialRequest()); 
    $w('#ibnShowPassword1').onMouseIn(() => doMouseIn("1")); 
    $w('#ibnShowPassword2').onMouseIn(() => doMouseIn("2")); 
    $w('#ibnShowPassword1').onMouseOut(() => doMouseOut("1")); 
    $w('#ibnShowPassword2').onMouseOut(() => doMouseOut("2")); 

});

async function doSubmitCredentialRequest(){
    let sendForgotUsernameEmailStatus = false;
    let sendForgotUsernameEmailResult;

    if (!$w('#inpFirstName').valid) {
        showError("Credentials", 4, 13);
        $w('#inpFirstName').updateValidityIndication();
        $w('#inpFirstName').focus();
        $w('#inpFirstName').value = "";
        return
    }
    if (!$w('#inpSurname').valid) {
        showError("Credentials", 4, 14);
        $w('#inpSurname').updateValidityIndication();
        $w('#inpSurname').focus();
        $w('#inpSurname').value = "";
        return
    }

    $w('#btnSubmitRequest').disable();
    $w('#imgCredentialsWait').show();
    let wFirstName = $w('#inpFirstName').value.trim();
    let wSurname = $w('#inpSurname').value.trim();
    console.log(wFirstName, wSurname);
    [sendForgotUsernameEmailStatus, sendForgotUsernameEmailResult] = await sendForgotUsernameEmail(wFirstName, wSurname);

    showError("Credentials", 5, 15);
    setTimeout(() => {
        $w('#imgCredentialsWait').hide();
        wixLocation.to("/");
    },5000);

}

async function doChangePassword() {
    try {
        let wNewPlainPassword = $w('#inpPassword1').value;
        if ( wNewPlainPassword.length < 6){
            showError("Login", 4, 13);
            $w('#inpPassword1').focus();
            $w('#inpPassword1').value = "";
            $w('#inpPassword2').value = "";
            wNewPlainPassword = "";
            return false;  
        }
  
        if ( wNewPlainPassword !== $w('#inpPassword2').value){
            showError("ChangePassword", 4, 10);
            $w('#inpPassword1').focus();
            wNewPlainPassword = "";
            return false;  
        }
        let wNewHashedPassword = await doHash(wNewPlainPassword);
 
        // encrypt new password so clear password is not sent over network
        let updateMTBCMemberTokenStatus = await updateMTBCMemberToken(gLstMemberId, wNewHashedPassword);
        if (updateMTBCMemberTokenStatus) {
            console.log('/page/Refresh doCHangePassword Lst Password reset for member ', gLstMemberId);
	     	$w('#txtChangePasswordErrMsg').text = "Your password has been updated. In a few seconds, you will be re-directed to the home page";

            showError("ChangePassword", 5, 6);
			setTimeout(() => {
				wixLocation.to("/");
			},5000);
        } else {
            console.log("/page/Refresh doCHangePassword  Failed to send reset lst password, err");
            showError("ChangePassword", 5, 8);
            return false;
        }
    }
    catch (err) {
        console.log("/page/Refresh doCHangePassword Try catch, err ");
        console.log(err);
        return false;
    }
}

function doMouseIn(pControl){
    let wPassword  = $w(`#inpPassword${pControl}`).value;
    $w(`#txtShowPassword${pControl}`).text = wPassword;
    $w(`#inpPassword${pControl}`).hide();
    $w(`#txtShowPassword${pControl}`).show();
}

function doMouseOut(pControl){
    $w(`#inpPassword${pControl}`).show();
    $w(`#txtShowPassword${pControl}`).hide();
}

export function showError(pTarget, pSecs, pMsg) {
    let wMsg = ["Must enter either a username or a login Email address",
        "Minimum username length is 3 characters",
        "Cannot find a member with this username/email address",
        "Only Full or Social Members are allowed to log in",
        "Incorrect password", //5
        "Password Reset Completed OK",
        "Failed to update member record",
        "FAiled to send reest email",
        "Login failed",
        "Passwords dont match", // 10
        "Logged In Successfully",
        "Password must be at leaset 6 characters",
        "Please enter first name",
        "Please enter surname",
        "Email has been sent",      //15
        "Last message"
    ];
    let pTime = pSecs * 1000;
    if (pMsg > 0) {
        $w(`#txt${pTarget}ErrMsg`).text = wMsg[pMsg - 1];
    }
    $w(`#txt${pTarget}ErrMsg`).expand();
    setTimeout(() => {
        $w(`#txt${pTarget}ErrMsg`).collapse();
    }, pTime);
}

