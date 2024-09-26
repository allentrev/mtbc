import { authentication } from 'wix-members-frontend';

import { saveRecord } from 'backend/backEvents.jsw';

import wixWindow    from 'wix-window';
import { findLstMemberByLoginEmail } from 'backend/backMember.jsw';
import { getLoginToken } from 'backend/backMember.jsw';
import {session} from 'wix-storage-frontend';
import wixLocationFrontend from 'wix-location-frontend';
import { doHash }	                from "public/objects/member";
// ...

// In Site tab


let previousPageURL;
let previousPage;

$w.onReady(function () {
	previousPageURL = session.getItem("url");
  	previousPage = session.getItem("page");
      	console.log(wixLocationFrontend.path[0]);
	console.log(wixLocationFrontend.url);

    //wixLocationFrontend.to("/booking");
})
    
export async function btnRegister_click(event) {
    console.log("Register");

    let wEmail = $w('#loginEmail').value.trim();
    if (await isAlreadyRegistered(wEmail)) {
        console.log("Already registered ", wEmail);
    } else {
        let wLstId = await createLstMember();
        //let wLstId = "ABCDEFGHIJKLMNOP";
        let wPassword = wLstId.substring(0,6);
        console.log(wLstId, wPassword);
    }
}

export async function bntnLogIn_click(event) {

    const wToken = "JWS.eyJraWQiOiJQSXpvZGJiQiIsImFsZyI6IkhTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcImNhMTdiMjE4LTM4MGUtNGQ1NS05ZTNiLTUyNmI4MWJjMmViZFwiLFwiY29sbGVjdGlvbklkXCI6XCJlNWZlMWJjZS02MmZhLTQ0NWYtODBhMi03ZTZiY2NlMzZjZWRcIixcIm1ldGFTaXRlSWRcIjpcImQ1MjY5YWM3LTMwYTctNGZkYS04NzZjLTA0NjAyMWViMjk2ZlwiLFwib3duZXJcIjpmYWxzZSxcImNyZWF0aW9uVGltZVwiOjE3MDE0MTE5NjE4MTgsXCJleHBpcmVzSW5cIjoxMjA5NjAwMDAwLFwiZXhwaXJhdGlvblRpbWVcIjoxNzAxNDEyMDIxODE4LFwibGFzdFJlZnJlc2hlZFwiOjAsXCJhZG1pblwiOmZhbHNlfSIsImlhdCI6MTcwMTQxMTk2MX0.v2MBMUCgvgB9KXO_RZqS5fRMuH2RyQw6o2DCnK58RFQ";

    let email = $w("#email").value;
    let password = $w("#password").value;
    try {
        getLoginToken(email, password)
        .then((result) => {
            if (result.approved) {
                authentication.applySessionToken(result.sessionToken);
            } else{
                console.log("Authenticate failed, result");
                console.log(result);
            }
        })
        .catch( (err) => {
            console.log("Catch error, err");
            console.log(err);
        })
    }
    catch (err) {
        console.log("Try catch, err");
        console.log(err);
    }
    /** OLD METHOD
    authentication.login(email, password)
    .then (() => {
        console.log("btnLogIn then : User is logged in ", email);
    })
    .catch( (error) => {
        console.log("btnLogIn catch :err = ");
        console.log(error);
        console.log(error.message);
    })
    */


}
export function btnLogOut_click(event) {
    //authentication.logout();
    console.log("btnLogOut User logged out");    
    console.log(event);
}

export function btnReset_click(event) {

    let email = $w("#email").value;
    let password = $w("#password").value;
    let options = {
        hideIgnoreMessage: true
    }

    authentication.sendSetPasswordEmail(email, options)
    .then((status) => {
        console.log("btnReset then");
        console.log(status);
        if (status === true) {
           console.log('Email sent!');
        }
        return status;    
    })
    .catch((error) => {
        console.log("btnReset catch")
        console.log(error);
        console.log(error.message);
    });
}

export async function btnForgot_click(event) {
    let wString = $w('#password').value;
    console.log("String ", wString);
    //var cry = new Crypto();
    let wHash = await doHash(wString);
    console.log(wHash);

    /**
     
    authentication.promptForgotPassword()
    .then((o2) => {
        console.log('btnForgot then Sending "forgot password" email');
        console.log(o2);
    })
    .then ((obj) => {
        console.log("Next then");
        console.log(obj);
    })
    .catch((error) => {
        console.log('btnForgot catch');
        console.log(error);
        console.log(error.message);
    });
    */
}

//--------------------------------------------------------------------
async function isAlreadyRegistered(pLoginEmail) {
    let [status, res] = await findLstMemberByLoginEmail(pLoginEmail);
    console.log(res);
    return res;
}

export async function createLstMember () {

    let wMember = {
        "_id": "",
        "username": "",
        "loginEmail": $w('#loginEmail').value,
        "firstName": $w('#firstName').value,
        "surname": $w('#surname').value,
        "gender": "M",
        "type": $w('#drpStatus').value,
        //"dateLeft": null,
        "contactpref": "E",
        "allowshare": "Y",
        "contactEmail": $w('#loginEmail').value,
        "altEmail": "",
        "mobilePhone": "",
        "homePhone": "",
        "locker": [],
        "addrLine1": "",
        "addrLine2": "",
        "town": "",
        "postCode": "",
        "wixId": "",
        "photo": ""
    }

    wMember.dateLeft = undefined;
    wMember._id = undefined;

    let res = await saveRecord("lstMembers", wMember);
    let wMembers = [];
    //let res = false;
    if (res) {
            wMember._id = res._id;
    }
    return res._id;
}

export function ibnShowPassword1_click(event) {
    let wPassword  = $w('#password').value;
    if ($w('#txtShowPassword').hidden) {;
        $w('#txtShowPassword').text = wPassword;
        $w('#password').hide();
        $w('#txtShowPassword').show();
    } else {
        $w('#password').show();
        $w('#txtShowPassword').hide();
    }
}

export function ibnShowPassword1_mouseIn(event) {
        let wPassword  = $w('#password').value;
        $w('#txtShowPassword').text = wPassword;
        $w('#password').hide();
        $w('#txtShowPassword').show();
}

export function ibnShowPassword1_mouseOut(event) {
        $w('#password').show();
        $w('#txtShowPassword').hide();
}