"use strict"

//------------------------------------------------------------------------------------------------------
//
//	The pupose of this lightbox is give a visitor the means to sign onto the site as a MEMBER.
//
//  It also provides access to the usual associated sign on processes: Register, Lost Password
//
//  TODO: If a membership system is to be fully used, then this Member Design needs to be re-evaluated.
//        For details see associated site notes document.
//
//------------------------------------------------------------------------------------------------------
import { authentication }       from 'wix-members-frontend';
import wixWindow                from 'wix-window';
import wixLocationFrontend      from 'wix-location-frontend';
import wixWindowFrontend        from 'wix-window-frontend';
import {session}                from 'wix-storage-frontend';
//import { bcrypt }               from 'bcrypt';

import { findLstMemberByLoginEmail }    from "backend/backMember.jsw";
import { findLstMemberByUsername }      from "backend/backMember.jsw";
import { sendSetWixPasswordEmail }      from "backend/backMember.jsw";
import { sendSetLstPasswordEmail }      from "backend/backMember.jsw";
import { updateLstMember }              from "backend/backMember.jsw";
import { updateLstMemberStatus }        from "backend/backMember.jsw";
import { updateMTBCMemberToken }        from "backend/backMember.jsw";
import { getLoginToken }                from "backend/backMember.jsw";
import { doMTBCAuthenticate }           from "backend/backMember.jsw";
import { doHash }	                    from "public/objects/member";



import { TYPE }                 from "public/objects/member";
import { STATUS }               from "public/objects/member";

let gLstMember = {};
let gUsernameType = "E";
let gMTBCSignIn = false;
let gPending = false;
let gChangeMode = null;

const USERNAME_LENGTH = 3;
const PASSWORD_LENGTH = 6;

$w.onReady(function () {

    $w('#btnContinue').onClick(() => doContinue());
    $w('#btnReset').onClick(() => doReset());
    $w('#btnRegister').onClick(() => doRegister());
    $w('#btnForgotPassword').onClick(() => doForgotPassword());
    $w('#btnForgotUsername').onClick(() => doForgotUsername());
    $w('#btnChangePassword').onClick(() => doChangePassword());
    $w('#btnChangeUsername').onClick(() => doChangeUsername());
    $w('#btnConfirm').onClick(() => doConfirmChange());
    $w('#btnLogin').onClick(() => doLogin());
    $w('#btnClose').onClick(() => wixWindow.lightbox.close(true));
    $w('#ibnShowPassword1').onMouseIn(() => doMouseIn("1")); 
    $w('#ibnShowPassword2').onMouseIn(() => doMouseIn("2")); 
    $w('#ibnShowPassword1').onMouseOut(() => doMouseOut("1")); 
    $w('#ibnShowPassword2').onMouseOut(() => doMouseOut("2")); 

    //$w('#boxReset').hide();
    //$w('#boxPassword').show();
    //$w('#boxNewPassword').hide();
    //$w('#boxNewUsername').hide();
    showHideBoxes("H", "H", "H", "H");
    
    //$w('#btnReset').hide();
    //$w('#btnContinue').show();
    //$w('#btnConfirm').hide();
    //$w('#btnLogin').hide();
    showHideButtons("H", "S", "H", "H");

    //$w('#btnChangePassword').hide();
    //$w('#btnForgotPassword').hide();
    //$w('#btnChangeUsername').hide();
    //$w('#btnForgotUsername').show();
    showHideControls("H", "H", "H", "S");
    $w('#txtLoginErrMsg').hide();
});

function showHideBoxes(p1,p2,p3,p4){
    //console.log("Box", p1, p2, p3, p4);
    if (wixWindow.formFactor === "Mobile") {
        (p1 === "S") ? $w('#boxReset').expand() : $w('#boxReset').collapse();
        (p2 === "S") ? $w('#boxPassword').expand() : $w('#boxPassword').collapse();
        (p3 === "S") ? $w('#boxNewPassword').expand() : $w('#boxNewPassword').collapse();
        (p4 === "S") ? $w('#boxNewUsername').expand() : $w('#boxNewUsername').collapse();
    } else {
        (p1 === "S") ? $w('#boxReset').show() : $w('#boxReset').hide();
        (p2 === "S") ? $w('#boxPassword').show() : $w('#boxPassword').hide();
        (p3 === "S") ? $w('#boxNewPassword').show() : $w('#boxNewPassword').hide();
        (p4 === "S") ? $w('#boxNewUsername').show() : $w('#boxNewUsername').hide();
    }
}

function showHideButtons(p1,p2,p3,p4){
    (p1 === "S") ? $w('#btnReset').show() : $w('#btnReset').hide();
    (p2 === "S") ? $w('#btnContinue').show() : $w('#btnContinue').hide();
    (p3 === "S") ? $w('#btnConfirm').show() : $w('#btnConfirm').hide();
    (p4 === "S") ? $w('#btnLogin').show() : $w('#btnLogin').hide();
}

function showHideControls(p1, p2, p3, p4){
    if (wixWindow.formFactor === "Mobile") {
        (p1 === "S") ? $w('#btnChangePassword').expand() : $w('#btnChangePassword').collapse();
        (p2 === "S") ? $w('#btnForgotPassword').expand() : $w('#btnForgotPassword').collapse();
        (p3 === "S") ? $w('#btnChangeUsername').expand() : $w('#btnChangeUsername').collapse();
        (p4 === "S") ? $w('#btnForgotUsername').expand() : $w('#btnForgotUsername').collapse();
    } else {
        (p1 === "S") ? $w('#btnChangePassword').show() : $w('#btnChangePassword').hide();
        (p2 === "S") ? $w('#btnForgotPassword').show() : $w('#btnForgotPassword').hide();
        (p3 === "S") ? $w('#btnChangeUsername').show() : $w('#btnChangeUsername').hide();
        (p4 === "S") ? $w('#btnForgotUsername').show() : $w('#btnForgotUsername').hide();
    }
}

function doRegister() {

    wixWindowFrontend.openLightbox("lbxRegister1");
    wixWindow.lightbox.close();
}

async function doContinue() {
    let status;
    let wUsername = $w('#txtUsername').value;
    //  Determine type of user
    //
    if (wUsername.includes("@")) {
        gUsernameType = "E";
    } else if (wUsername.length === 0) {
        gUsernameType = "X";
        showError("Login", 3, 1);
    } else if (wUsername.length < USERNAME_LENGTH) {
        showError("Login", 3, 2);
        gUsernameType = "X";
    } else {
        gUsernameType = "U";
    }
    if (gUsernameType === "X") { return }
    $w('#imgLogin').show();
    //  Get LST MEmber record
    //
    if (gUsernameType === "E") {
        [status, gLstMember] = await findLstMemberByLoginEmail(wUsername);
        gMTBCSignIn = false;
    } else {
        [status, gLstMember] = await findLstMemberByUsername(wUsername);
        gMTBCSignIn = true;
    }
    $w('#imgLogin').hide();
    gPending = false;
    if (gLstMember) {
        $w('#boxRegister').hide();
        //$w('#btnForgotUsername').hide();
        if (gLstMember.status === STATUS.PENDING) {
            gPending = true;
            // do first time password change
            //$w('#boxReset').show();
            //$w('#boxPassword').hide();
            //$w('#boxNewPassword').hide();
            //$w('#boxNewUsername').hide();
            showHideBoxes("S", "H", "H", "H");

            //$w('#btnReset').show();
            //$w('#btnContinue').hide();
            //$w('#btnConfirm').hide();
            //$w('#btnLogin').hide();
            showHideButtons("S", "H", "H", "H");

            //$w('#btnChangePassword').hide();
            //$w('#btnForgotPassword').hide();
            //$w('#btnChangeUsername').hide();
            showHideControls("H", "H", "H", "H");

        } else if (gLstMember.type !== TYPE.FULL && gLstMember.type !== TYPE.SOCIAL && gLstMember.type !== TYPE.TEST) {
            showError("Login", 3, 4);
            $w('#txtUsername').updateValidityIndication();
        } else {
            //$w('#boxReset').hide();
            //$w('#boxPassword').show();
            //$w('#boxNewPassword').hide();
            //$w('#boxNewUsername').hide();
            showHideBoxes("H", "S", "H", "H");

            //$w('#btnReset').hide();
            //$w('#btnContinue').hide();
            //$w('#btnConfirm').hide();
            //$w('#btnLogin').show();
            showHideButtons("H", "H", "H", "S");
            
            //$w('#btnChangePassword').show();
            //$w('#btnForgotPassword').show();
            //$w('#btnChangeUsername').show();
            if (gUsernameType ===  "E"){
                //AT THIS TIME< DONT ALLOW WIX USERS TO CHANGE USERNAME
                showHideControls("H", "S", "H", "H");
            } else {
                showHideControls("S", "S", "S", "H");
            }
        }
    } else {
        showError("Login", 3, 3);
        $w('#txtUsername').updateValidityIndication();
    }
}

function doForgotUsername(){
    wixLocationFrontend.to("/refresh?type='Credentials'");
    wixWindow.lightbox.close();
}

async function doReset() {
    if ($w('#txtUsername').valid){
        if (gMTBCSignIn){
            if (gPending) {
                if /** first btnReset Press */ ($w('#boxNewPassword').hidden){  
                    //$w('#boxReset').hide();
                    //$w('#boxPassword').hide();
                    //$w('#boxNewPassword').show();
                    showHideBoxes("H", "H", "S", "H");
                } /** second btnReset Press */ else {
                    $w('#imgLogin').show();
                    await doMTBCPasswordReset(true);
                    $w('#imgLogin').hide();
                }
            } else {
                let wHashedPassword = await doHash($w('#txtPassword').value);
                let wIsAuthenticated = await doMTBCAuthenticate(gLstMember._id, wHashedPassword);
                if (!wIsAuthenticated ){
                    showError("Login", 3, 5);
                    $w('#txtPassword').value = "";
                    $w('#txtPassword').updateValidityIndication();
                    $w('#txtPassword').focus();
                    return;
                }
            }
        } else {
            await doPasswordReset("Wix", true);
        } 
    } else {
        showError("Login",3,1);
        $w('#txtUsername').updateValidityIndication();
        $w('#txtUsername').focus();
        return;
    }
}

export async function doMTBCPasswordReset(pPending){
    try {
        let wNewPlainPassword = $w('#inpPassword1').value;
        if ( wNewPlainPassword.length < PASSWORD_LENGTH){
            showError("Login", 4, 13);
            $w('#inpPassword1').focus();
            $w('#inpPassword1').value = "";
            $w('#inpPassword2').value = "";
            wNewPlainPassword = "";
            return false;  
        }
        if ( wNewPlainPassword !== $w('#inpPassword2').value){
            showError("Login", 4, 10);
            $w('#inpPassword1').focus();
            wNewPlainPassword = "";
            return false;  
        }
        let wNewHashedPassword = await doHash(wNewPlainPassword);
        let updateMTBCMemberTokenStatus = await updateMTBCMemberToken(gLstMember._id, wNewHashedPassword);
        if (updateMTBCMemberTokenStatus) {
            console.log('/lightbox/lbxLogin1 doMTBCPasswordRese Lst Password reset for member ', gLstMember.loginEmail, gLstMember._id, pPending);

            //$w('#boxReset').show();
            //$w('#boxPassword').hide();
            //$w('#boxNewPassword').hide();
            //$w('#boxNewUsername').hide();
            showHideBoxes("S", "H", "H", "H");

            //$w('#btnReset').hide();
            //$w('#btnContinue').hide();
            //$w('#btnConfirm').hide();
            //$w('#btnLogin').hide();
            showHideButtons("H", "H", "H", "H");
            
            //$w('#btnChangePassword').hide();
            //$w('#btnForgotPassword').hide();
            //$w('#btnChangeUsername').hide();
            showHideControls("H", "H", "H", "H");

            $w('#lblResetMsg').text = `Your password has been reset. Please Close this dialogue and try to sign on again`;
            if (pPending) {
                let res = await updateLstMemberStatus(gLstMember._id, STATUS.ACTIVE);
                if(!res) {
                    showError("Login", 5, 7);
                    return false;
                }
            }
            showError("Login", 5, 6);
            return true;
        } else {
            console.log("/lightbox/lbxLogin1 doMTBCPasswordReset Failed to send reset lst password, err");
            showError("Login", 5, 8);
            return false;
        }
    }
    catch (err) {
        console.log("/lightbox/lbxLogin1 doMTBCPasswordReset Try catch, err ");
        console.log(err);
        return false;
    }
}

export async function doPasswordReset(pType, pPending){
    try {
        $w('#imgLogin').show();

        //$w('#boxReset').hide();
        //$w('#boxPassword').hide();
        //$w('#boxNewPassword').hide();
        //$w('#boxNewUsername').hide();
        showHideBoxes("H", "H", "H", "H");

        //$w('#btnReset').hide();
        //$w('#btnContinue').hide();
        //$w('#btnConfirm').hide();
        //$w('#btnLogin').hide();
        showHideButtons("S", "H", "H", "H");
        
        //$w('#btnChangePassword').hide();
        //$w/('#btnForgotPassword').hide();
        //$w('#btnChangeUsername').hide();
        showHideControls("H", "H", "H", "H");

        let sendSetPasswordEmailStatus = false;
        let sendSetPasswordResetEmailResult;

        if (pType === "Wix") {
            console.log("/lightbox/lbxLogin1 doPasswordRest Do Wix send reset email");
            [sendSetPasswordEmailStatus, sendSetPasswordResetEmailResult] = await sendSetWixPasswordEmail(gLstMember.loginEmail);
        } else if(pType === "MTBC"){
            console.log("/lightbox/lbxLogin1 doPasswordRest Do MTBC send reset email");
            let wName = gLstMember.firstName + " " + gLstMember.surname;
            [sendSetPasswordEmailStatus, sendSetPasswordResetEmailResult] = await sendSetLstPasswordEmail(wName, gLstMember._id, gLstMember.contactEmail);
        } else {
            console.log("/lightbox/lbxLogin1 doPasswordRest unknown ptype [" + pType + "]");
            $w('#imgLogin').hide();
            sendSetPasswordEmailStatus = false;
            return false;
        }

        if (sendSetPasswordEmailStatus) {
            showHideBoxes("S","H","H","H");

            console.log('/lightbox/lbxLogin1  doPasswordRest  Reset Email sent for member ', gLstMember.loginEmail, gLstMember._id);
            $w('#lblResetMsg').text = `An email has been sent to the login address that you
                                    specified on your application form. It contains a link
                                    to reset your password. Please click on this link and then
                                    follow the instructions shown. When ready, close this 
                                    window and try to sign on again later when the reset is completed.`;

            $w('#btnReset').hide();

            if (pPending) {
                let res = await updateLstMemberStatus(gLstMember._id, STATUS.ACTIVE);
                if(!res) {
                    showError("Login", 5, 7);
                    $w('#imgLogin').hide();
                    return false;
                }
            }
            showError("Login", 5, 6);
            $w('#imgLogin').hide();
            return true;
        } else {
            console.log("/lightbox/lbxLogin1 doPasswordReset Failed to send reset email, err");
            console.log(sendSetPasswordResetEmailResult);
            showError("Login", 5, 8);
            $w('#imgLogin').hide();
            return false;
        }
    }
    catch (err) {
        console.log("/lightbox/lbxLogin1 doPasswordReset Try catch, type, err ", pType);
        console.log(err);
        $w('#imgLogin').hide();
        return false;
    }
}

export async function doChangePassword() {

    //$w('#boxReset').hide();
    //$w('#boxPassword').show();
    //$w('#boxNewPassword').show();
    //$w('#boxNewUsername').hide();
    showHideBoxes("H", "S", "S", "H");

    //$w('#btnReset').hide();
    //$w('#btnContinue').hide();
    //$w('#btnConfirm').show();    
    //$w('#btnLogin').hide();    
    showHideButtons("H", "H", "S", "H");

    //$w('#btnChangePassword').hide();    
    //$w('#btnForgotPassword').hide();    
    //$w('#btnChangeUsername').hide();
    showHideControls("H", "H", "H", "H");

    $w('#txtPassword').focus();
    $w('#txtPassword').value = "";
    gChangeMode = "Password";    
}

export async function doChangeUsername() {
 
    //$w('#boxReset').hide();
    //$w('#boxPassword').show();
    //$w('#boxNewPassword').hide();
    //$w('#boxNewUsername').show();
    showHideBoxes("H", "S", "H", "S");

    //$w('#btnReset').hide();
    //$w('#btnContinue').hide();
    //$w('#btnConfirm').show();    
    //$w('#btnLogin').hide();    
    showHideButtons("H", "H", "S", "H");

    //$w('#btnChangePassword').hide();    
    //$w('#btnForgotPassword').hide();    
    //$w('#btnChangeUsername').hide();
    showHideControls("H", "H", "H", "H");

    $w('#inpNewUsername').value = "";
    $w('#inpNewUsername').focus();
    gChangeMode = "Username";    
}

export async function doConfirmChange() {

    $w('#imgLogin').show();
    let wPlainPassword = $w("#txtPassword").value;
    if ( wPlainPassword.length < PASSWORD_LENGTH){
        showError("Login", 4, 13);
        $w('#inpPassword1').focus();
        $w('#inpPassword1').value = "";
        $w('#inpPassword2').value = "";
        wPlainPassword = "";
        return false;  
    }

    let wHashedPassword = await doHash(wPlainPassword);
    let wIsAuthenticated = await doMTBCAuthenticate(gLstMember._id, wHashedPassword);
    if (wIsAuthenticated ){
        let wStatus = true;
        if (gChangeMode === "Password"){
            wStatus = await doMTBCPasswordReset(false);
        } else if (gChangeMode === "Username"){
            wStatus = await doMTBCUsernameReset();
        } else {
            console.log("/lightbox/lbxLogin1 doMTBCUsernameReset doConfirmCHange Invalid change mode", gChangeMode);
            $w('#imgLogin').hide();
            return false;
        }
        if (wStatus) {
            $w('#btnConfirm').hide();
            $w('#imgLogin').hide(); 
        } else {
            console.log("/lightbox/lbxLogin1 doMTBCUsernameReset doConfirmCHange Update action failed");
            $w('#imgLogin').hide(); 
        }
    } else {
        showError("Login", 3, 5);
        $w('#txtPassword').value = "";
        $w('#txtPassword').updateValidityIndication();
        $w('#txtPassword').focus();
        $w('#imgLogin').hide();
        return false;
    }
}

export async function doMTBCUsernameReset(){
    try {

        let wNewUsername = $w('#inpNewUsername').value;
        let wErrorCode = await validateUsername(wNewUsername);
        if (wErrorCode > 0) {
            showError("Login", 5, wErrorCode);
            $w('#inpNewUsername').value = "";
            $w('#inpNewUsername').updateValidityIndication();
            $w('#inpNewUsername').focus();
            $w('#imgLogin').hide();
            return false;
        }

        gLstMember.username = wNewUsername;
        let   updateMTBCMemberStatus = await updateLstMember(gLstMember);
        //let updateMTBCMemberStatus = true;
        if (updateMTBCMemberStatus) {

            //$w('#boxReset').show();
            //$w('#boxPassword').hide();
            //$w('#boxNewPassword').hide();
            //$w('#boxNewUsername').hide();
            showHideBoxes("S", "H", "H", "H");

            //$w('#btnReset').hide();
            //$w('#btnContinue').hide();
            //$w('#btnConfirm').hide();
            //$w('#btnLogin').hide();
            showHideButtons("H", "H", "H", "H");
            
            //$w('#btnChangePassword').hide();
            //$w('#btnForgotPassword').hide();
            //$w('#btnChangeUsername').hide();
            showHideControls("H", "H", "H", "H");

            $w('#lblResetMsg').text = `Your username has been reset. Please Close this dialogue and try to sign on again`;
            showError("Login", 5, 6);
            return true;
        } else {
            console.log("/lightbox/lbxLogin1 doMTBCUsernameReset Failed to update gLstMember, err");
            showError("Login", 5, 8);
            return false;
        }
    }
    catch (err) {
        console.log("/lightbox/lbxLogin1 doMTBCUsernameReset Try catch, err ");
        console.log(err);
        showError("Login", 5, 8);
        return false;
    }
}

export async function validateUsername(pUsername){
	let wUsername = String(pUsername).trim();
    if /** too short */(wUsername.length < USERNAME_LENGTH ) { return 2};
    let wStatus = await findLstMemberByUsername(wUsername);
    if /** already exists */ (wStatus) { return 12};
    return 0;
}

export function doLogin() {
    if ($w('#txtUsername').valid){
        if (!gLstMember) {
            showError("Login", 3, 1);
            $w('#txtUsername').updateValidityIndication();
            $w('#txtUsername').focus();
            return;
        }
        
        let wPlainPassword = $w("#txtPassword").value;
        $w('#imgLogin').show();
        if (gMTBCSignIn){
            try {
                doHash(wPlainPassword)
                .then((wHashedPassword) => {
                    return getLoginToken(gLstMember, wHashedPassword);
                })
                .then((result) => {
                    if (result.approved) {
                        authentication.applySessionToken(result.sessionToken);
                        showError("Login", 3, 11);
                        wixLocationFrontend.to("/refresh?type='Refresh'");
                    } else{
                        console.log("/lightbox/lbxLogin1 getLoginToken then Authenticate failed, result");
                        console.log(result);
                        showError("Login", 4, 5);
                        $w('#txtPassword').value = "";
                        $w('#txtPassword').updateValidityIndication();
                        $w('#txtPassword').focus();
                    }
                    $w('#imgLogin').hide();
                })
    
                .catch( (err) => {
                    console.log("/lightbox/lbxLogin1 doLogin getLoginToken catch error, err");
                    console.log(err);
                    $w('#imgLogin').hide();
                })
            }
            catch (err) {
                console.log("/lightbox/lbxLogin1 doLogin client Try catch, err");
                console.log(err);
                $w('#imgLogin').hide();
            }
        } /** Normal Wix Log In process */ else {
            try {
                let wUsername = gLstMember.loginEmail;

                authentication.login(wUsername, wPlainPassword)
                .then(() => {
                    $w('#imgLogin').hide();
                    showError("Login", 3, 11);
                    wixLocationFrontend.to("/refresh?type='Refresh'");
                })
                .catch((error) => {
                    console.log("/lightbox/lbxLogin1 doLogin  btnLogIn catch :err = ");
                    console.log(error);
                    if (error.message.includes("wrong password")) {
                        showError("Login", 4, 5);
                        $w('#txtPassword').value = "";
                        $w('#txtPassword').updateValidityIndication();
                        $w('#txtPassword').focus();
                    } else {
                        showError("Login", 4, 6);
                        console.log("/lightbox/lbxLogin1 doLogin error.message");
                    }
                    $w('#imgLogin').hide();
                })
            }
            catch (err) {
                console.log("/lightbox/lbxLogin1 doLogin authentication login try catch err");
                console.log(err);
                $w('#imgLogin').hide();
            }
        }
    } else {
        showError("Login",3,1);
        $w('#txtUsername').updateValidityIndication();
        $w('#txtUsername').focus();
        return;
    }
}

export async function doForgotPassword(){
    if ($w('#txtUsername').valid){
        if (gMTBCSignIn){

            //$w('#boxReset').hide();
            //$w('#boxPassword').show();
            //$w('#boxNewPassword').show();
            //$w('#boxNewUsername').hide();
            showHideBoxes("H", "S", "S", "H");

            //$w('#btnReset').hide();
            //$w('#btnContinue').hide();
            //$w('#btnConfirm').show();    
            //$w('#btnLogin').hide();    
            showHideButtons("H", "H", "S", "H");

            //$w('#btnChangePassword').hide();    
            //$w('#btnForgotPassword').hide();
            //$w('#btnChangeUsername').hide();
            showHideControls("H", "H", "H", "H");

            await doPasswordReset("MTBC", false);

        } else {
            await doPasswordReset("Wix", false);
        } 
    } else {
        showError("Login",3,1);
        $w('#txtUsername').updateValidityIndication();
        $w('#txtUsername').focus();
        return;
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
        "Username already exists",
        "Password must be at leaset 6 characters",
        "Last Message"
    ];
    let pTime = pSecs * 1000;
    if (pMsg > 0) {
        $w(`#txt${pTarget}ErrMsg`).text = wMsg[pMsg - 1];
    }
    $w(`#txt${pTarget}ErrMsg`).show();
    setTimeout(() => {
        $w(`#txt${pTarget}ErrMsg`).hide();
    }, pTime);
}

