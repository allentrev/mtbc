import { authentication }   from 'wix-members-frontend';
import  wixLocation  from 'wix-location';
import { members } from "wix-members.v2";

import { sendMsg } from 'backend/backMsg.web';
import { retrieveSessionMemberDetails } from 'public/objects/member';
import { findLstMember } 		        from 'backend/backMember.jsw';
import { showError } from 'public/objects/entity';
import { saveRecord } from 'backend/backEvents.jsw';
import { formPhoneString } from 'backend/backMember.jsw';

const capitalize = s => s && s[0].toUpperCase() + s.slice(1);

let loggedInMember;
let loggedInMemberRoles;
let gMember = {};
let gOldMember = {};

let gManOutline = "wix:image://v1/88f9e9_cf010bd242a247d897c0d82796abf866~mv2.jpg/man_outline.jpg#originWidth=570&originHeight=561";
let gWomanOutline = "wix:image://v1/88f9e9_7c906da184a746b1add8536f47c445c6~mv2.jpg/woman_outline.jpg#originWidth=549&originHeight=531";

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// ------------------	------------------------------------------------------------------------
const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {
try {
		//let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
		let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
		//let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
		/**
		Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
		Sarah Allen		91eab866-e480-4ddc-9512-d27bbbed2f10	ab308621-7664-4e93-a7aa-a255a9ee6867
		Trevor Allen	7e864e0b-e8b1-4150-8962-0191b2c1245e	88f9e943-ae7d-4039-9026-ccdf26676a2b
		Tony Stuart		28f0e772-9cd9-4d2e-9c6d-2aae23118552	5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9
		John Mitchell	40a77121-3265-4f0c-9c30-779a05366aa9	5132409b-6d6a-41c4-beb7-660b2360054e
		Tony Roberts	4d520a1b-1793-489e-9511-ef1ad3665be2	af7b851d-c5e5-49a6-adc9-e91736530794
		Cliff Jenkins	d81b1e42-6e92-43d0-bc1e-a5985a25487a	c287a94e-d333-40aa-aea6-11691501571e
		Tim Eales		2292e639-7c69-459b-a609-81c63202b1ac	6e5b5de1-214f-4b03-badf-4ae9a6918f77
		Yoneko Stuart	93daeee8-3d4b-40cc-a016-c88e93af1559	957faf19-39cd-47ca-9b81-5a0c2863bb87
		*/

		// end of esting fudge---------------
		
		let status;
		

		[status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

		if (isLoggedIn) {
			let wRoles = loggedInMemberRoles.toString();
			console.log("/membersArea/profile onready Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
			let wResult = await findLstMember(loggedInMember.lstId);
            if (wResult && wResult.status){
                gMember = {...wResult.member};
                gOldMember = { ...wResult.member};
			    populateEdit("Member");
            } else {
    			console.log("/membersArea/profile onReady/ couldnt find member, id", loggedInMember.lstId);
            }
		} else {
			console.log("/membersArea/profile onReady/ Not signed in");
		}
		//
		// Member Section event handlers
		$w('#btnMemberEditMoreDisplay').onClick((event) => btnMemberEditMoreDIsplayClick());
		$w('#btnMemberASave').onClick((event) => btnMemberASave_click(event));
		$w('#btnEditProfile').onClick((event) => btnEditProfile_click());
		$w('#btnMemberCancel').onClick((event) => btnMemberCancel_click());
			
			
		//-------------------------- Custom Validation -----------------------------------------		

		$w('#inpMemberEditPostCode').onCustomValidation((value, reject) => {
			let regExp = new RegExp(`^(([A-Z][0-9]{1,2})|(([A-Z][A-HJ-Y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-HJ-Y][0-9]?[A-Z])))) [0-9][A-Z]{2}$`);
			if (!regExp.test(value)) {
				reject(`PostCode format invalid`);
			}
		});
		
	}
	catch (err) {
			console.log("/membersArea/profile onReady Try-catch, err");
			console.log(err);
			//if (!gTest) { wixLocation.to("/syserror")};
	}

});


export function btnEditProfile_click() {

    $w('#about1').collapse();
    $w('#btnEditProfile').collapse();
    $w('#boxMemberEdit').expand();
}

export function btnMemberCancel_click() {

    $w('#about1').expand();
    $w('#btnEditProfile').expand();
    $w('#boxMemberEdit').collapse();
}

function populateEdit(pTarget) {

    let wSelected = gMember;

    let wStatusPendingOptions = [{"label": "Pending", "value": "Pending"},
                                {"label": "Active", "value": "Active"},
                                {"label": "Past", "value": "Past"}];
    let wStatusActiveOptions = [{"label": "Active", "value": "Active"},
                                {"label": "Wait", "value": "Wait"},
                                {"label": "Past", "value": "Past"},
                                {"label": "Pending", "value": "Pending"}];
    let wStatusWaitOptions = [{"label": "Wait", "value": "Wait"},
                                {"label": "Actiive", "value": "Active"},
                                {"label": "Past", "value": "Past"}];
    let wStatusPastOptions = [{"label": "Past", "value": "Past"},
                                {"label": "Actiive", "value": "Active"}];

    //console.log(pSelected);
    let wPhotoSrc = (wSelected.gender === "M") ? gManOutline : gWomanOutline;
    switch (pTarget) {
    case "Member":
        $w('#inpMemberEditLoginEmail').enable();
        if /* already registered with Wix, then cannoot change login email */ (wSelected.wixId) {
            if (wSelected.wixId.length > 0) {
                $w('#inpMemberEditLoginEmail').disable();
            }
        }
        let wMobilePhone = wSelected.mobilePhone === "no phone #" ? "" : hyphenatePhoneNumber(wSelected.mobilePhone);
        let wHomePhone = wSelected.homePhone === "no phone #" ? "" : hyphenatePhoneNumber(wSelected.homePhone);
        $w('#inpMemberEditUsername').value = wSelected.username || "";
        $w('#inpMemberEditLoginEmail').value = wSelected.loginEmail || "";
        $w('#inpMemberEditFirstName').value = wSelected.firstName || "";
        $w('#inpMemberEditSurname').value = wSelected.surname;
        $w('#inpMemberEditMix').value = wSelected.gender;
        $w('#drpMemberEditType').value = wSelected.type;
        ////$w('#lblMemberEditStartType').text = pSelected.type;
        $w('#rgpMemberEditContactPref').value = wSelected.contactpref;
        $w('#rgpMemberEditAllowShare').value = wSelected.allowshare;
        $w('#inpMemberEditContactEmail').value = wSelected.contactEmail;
        $w('#inpMemberEditAltEmail').value = wSelected.altEmail;

        $w('#inpMemberEditMobilePhone').value = wMobilePhone;
        $w('#inpMemberEditHomePhone').value = wHomePhone;
        $w('#inpMemberEditLocker').value = wSelected.locker.join(",");
        $w('#inpMemberEditAddrLine1').value = wSelected.addrLine1 || "";
        $w('#inpMemberEditAddrLine2').value = wSelected.addrLine2 || "";
        $w('#inpMemberEditTown').value = wSelected.town || "";
        $w('#inpMemberEditPostCode').value = wSelected.postCode || "";
        $w('#imgMemberEditPhoto').src = wSelected.photo || wPhotoSrc;
        break;
    default:
        console.log("/membersArea/profile populateEdit Invalid switch key", pTarget)
        break;
    }
}


export async function btnMemberASave_click(event) {
    try{
        showWait("Member");
        //-------------------------------------VALIDATIONS-----------------------------------
        if (!$w('#inpMemberEditLoginEmail').valid) {
            $w(`#txtMemberErrMsg`).text = $w('#inpMemberEditLoginEmail').validationMessage;
            showError("Member", 22);
            hideWait("Member");
            $w('#inpMemberEditLoginEmail').focus();
            return
        }
        if (!$w('#inpMemberEditContactEmail').valid) {
            $w(`#txtMemberErrMsg`).text = $w('#inpMemberEditContactEmail').validationMessage;
            showError("Member", 22);
            hideWait("Member");
            $w('#inpMemberEditContactEmail').focus();
            return
        }
        let wContactPref = $w('#rgpMemberEditContactPref').value;
        if (wContactPref === "E" || wContactPref === "B") {
            if ($w('#inpMemberEditContactEmail').value === "") {
                showError('Member',36);
                hideWait('Member');
            $w('#inpMemberEditContactEmail').focus();
            return
            }
        }
        let wMobile = $w('#inpMemberEditMobilePhone').value;
        if (wContactPref === "S" || wContactPref === "B") {
            if (wMobile === "" || wMobile === "no phone #") {
                showError('Member',37);
                hideWait('Member');
            $w('#inpMemberEditMobilePhone').focus();
            return
            }
        }
        //-------------------------------------Main section----------------------------------
        let wMember = {
            "_id": gMember._id,
            "username": $w('#inpMemberEditUsername').value,
            "loginEmail": $w('#inpMemberEditLoginEmail').value,
            "firstName": capitalize($w('#inpMemberEditFirstName').value),
            "surname": capitalize($w('#inpMemberEditSurname').value),
            "gender": $w('#inpMemberEditMix').value,
            "type": $w('#drpMemberEditType').value,
            "status": gMember.status,
            "contactpref": $w('#rgpMemberEditContactPref').value,
            "allowshare": $w('#rgpMemberEditAllowShare').value,
            "contactEmail": $w('#inpMemberEditContactEmail').value,
            "altEmail": $w('#inpMemberEditAltEmail').value,
            "mobilePhone": await formPhoneString("mobile", $w('#inpMemberEditMobilePhone').value),
            "homePhone": await formPhoneString("home", $w('#inpMemberEditHomePhone').value),
            "locker": [],
            "addrLine1": $w('#inpMemberEditAddrLine1').value,
            "addrLine2": $w('#inpMemberEditAddrLine2').value,
            "town": $w('#inpMemberEditTown').value,
            "postCode": $w('#inpMemberEditPostCode').value,
            "wixId": gMember.wixId,
            "photo": $w("#imgMemberEditPhoto").src || ""
        }

        wMember.locker = ($w('#inpMemberEditLocker').value).split(",").map(Number) || [];
        let wPhoto = $w("#imgMemberEditPhoto").src;
        if (wPhoto === "") {
            wPhoto = ($w('#inpMemberEditMix').value === "M") ? gManOutline : gWomanOutline;
        }
        let res;
        let wResult;
        wResult = {"Status": true, "savedRecord": {}, "error": ""}
		//console.log("New meber");
		//console.log(wMember);
		wResult = await saveRecord("lstMembers", wMember);

        // Save record performed in switch code blocks above;
        if (wResult  && wResult.status){
            let wSavedRecord = wResult.savedRecord;
            console.log("/membersArea/profile  btnMemberASave_click saveRecord OK for ", gMember._id);
			showError("Member",7);
            //
            // Join Community
            //
            const member = await members.joinCommunity();
            //  INform Membership secretary of changes
            let wChangeList = compareNewToOld(wMember);
            if (wChangeList !== "") {
                let wParams = {    
                            "memberFullName": wMember.firstName + " " + wMember.surname,
                            "changeList": wChangeList
                }

                wResult = await sendMsg("E", "WEB", null, null, false, "Profile_1", wParams);
                //let wResult.status = true;
                if (wResult && wResult.status){
                    console.log("/membersArea/profile  btnMemberASave_click saveRecord sendMsgToJob OK for ", gMember._id);
                } else {
                    console.log("/membersArea/profile  btnMemberASave_click saverecord sendMsgToJob failed, error");
                    console.log(wResult.error);
                }
            }
        } else {
            if (wResult && wResult.savedRecord){
                console.log("/membersArea/profile  btnMemberASave_click saveRecord failed, savedRecord, error");
                console.log(wResult.savedRecord);
                console.log(wResult.error);
            } else if(wResult){
                console.log("/membersArea/profile  btnMemberASave_click saverecord failed, error");
                console.log(wResult.error);
            } else {
                console.log("/membersArea/profile  btnMemberASave_click wResult undefined")
                console.log(wResult.error);
            }
        }
        $w('#btnMemberASave').enable();
        hideWait("Member");
    }
	catch (err) {
		console.log("/membersArea/profile  btnMemberASave_click Try-catch, err");
		console.log(err);
		//if (!gTest) { wixLocation.to("/syserror") };
	}
}

function compareNewToOld(pMember){
    let wChange = "";
    let wChangeList = ``;
    if (gOldMember.firstName.trim() !== pMember.firstName.trim()){ 
        wChangeList = wChangeList + `Firstname changed from ${gOldMember.firstName} to ${pMember.firstName}<br>`;
    }
    if (gOldMember.surname.trim() !== pMember.surname.trim()){ 
        wChangeList = wChangeList + `Surname changed from ${gOldMember.surname} to ${pMember.surname}<br>`;
    }
    if (gOldMember.gender !== pMember.gender){ 
        wChangeList = wChangeList + `Gender changed from ${gOldMember.gender} to ${pMember.gender}<br>`;
    }
    if (gOldMember.contactEmail.trim() !== pMember.contactEmail.trim()){ 
        wChangeList = wChangeList + `Contact email changed from ${gOldMember.contactEmail} to ${pMember.contactEmail}<br>`;
    }
    if (gOldMember.mobilePhone.trim() !== pMember.mobilePhone.trim()){ 
        wChangeList = wChangeList + `Mobile phone changed from ${gOldMember.mobilePhone} to ${pMember.mobilePhone}<br>`;
    }
    if (gOldMember.homePhone.trim() !== pMember.homePhone.trim()){ 
        wChangeList = wChangeList + `Home phone changed from ${gOldMember.homePhone} to ${pMember.homePhone}<br>`;
    }
    if (gOldMember.addrLine1.trim() !== pMember.addrLine1.trim()){ 
        wChangeList = wChangeList + `Address Line 1 changed from ${gOldMember.addrLine1} to ${pMember.addrLine1}<br>`;
    }
    if (gOldMember.addrLine2.trim() !== pMember.addrLine2.trim()){ 
        wChangeList = wChangeList + `Address line 2 changed from ${gOldMember.addrLine2} to ${pMember.addrLine2}<br>`;
    }
    if (gOldMember.town.trim() !== pMember.town.trim()){ 
        wChangeList = wChangeList + `Town changed from ${gOldMember.town} to ${pMember.town}<br>`;
    }
    if (gOldMember.postCode.trim() !== pMember.postCode.trim()){ 
        wChangeList = wChangeList + `Postcode changed from ${gOldMember.postCode} to ${pMember.postCode}<br>`;
    }
    return wChangeList
}

export function btnMemberEditClearPhoto_click(event) {
    let wGender = $w('#inpMemberEditMix').value || "L";
    let wPhoto = (wGender === "L") ?  gWomanOutline:  gManOutline;
    $w("#imgMemberEditPhoto").src = wPhoto;
}

export function upbMemberEditPhoto_change(event) {
    showWait("Member");
    $w("#txtMemberErrMsg").show();
    if ($w("#upbMemberEditPhoto").value.length > 0) {
        $w("#txtMemberErrMsg").text = "Uploading " + $w("#upbMemberEditPhoto").value[0].name;
        $w("#upbMemberEditPhoto").uploadFiles()
            .then((uploadedFiles) => {
                $w("#txtMemberErrMsg").text = "Upload successful";
                $w("#imgMemberEditPhoto").src = uploadedFiles[0].fileUrl;
                setTimeout(() => {
                    $w('#btnMemberASave').enable();
                    $w("#txtMemberErrMsg").hide();
                    hideWait("Member");
                }, 3500);
            })
            .catch((uploadError) => {
                $w("#txtMemberErrMsg").text = "File upload error";
                console.log("/membersArea/profile  File upload error: " + uploadError.errorCode);
                console.log("/membersArea/profile  ", uploadError.errorDescription);
                setTimeout(() => {
                    $w('#btnMemberASave').enable();
                    $w("#txtMemberErrMsg").hide();
                    hideWait("Member");
                }, 2500);
            });
    } else {
        $w("#txtMemberErrMsg").text = "Please choose a file to upload.";
        setTimeout(() => {
            $w('#btnMemberASave').enable();
            $w("#txtMemberErrMsg").hide();
            hideWait("Member");
        }, 2500);
    }
}

export function inpPhone_change(event) {
    let wControl = event.target;
    let wNumberInput = event.target.value;
    let wNumber = hyphenatePhoneNumber(wNumberInput);
    if (wNumber === "-1") {
        showError("Member", 4, 11);
        wControl.focus();
    } else {
        wControl.value = wNumber;
        wControl.resetValidityIndication();
    }
}


export function btnMemberEditMoreDIsplayClick() {
    let wButton = $w('#btnMemberEditMoreDisplay').label;
    let wBits = wButton.split(" ");
    let wState = wBits[0];
    if (wState === "Show") {
        $w('#boxMemberEditMore').expand();
        $w('#btnMemberEditMoreDisplay').label = "Hide ^";
    } else {
        $w('#boxMemberEditMore').collapse();
        $w('#btnMemberEditMoreDisplay').label = "Show V";
    }
}



function hyphenatePhoneNumber(pPhoneNumber) {
    let wDisplayNumber = "";
    if (pPhoneNumber === null || pPhoneNumber === "" || pPhoneNumber === undefined) return "";
    let wNumber = pPhoneNumber.trim();
    let wNumberNoSpaces = wNumber.replace(/\s/g, "");
    let wModifiedNumber = wNumberNoSpaces.replaceAll("-", "");
    let wInputLength = wModifiedNumber.length;
    let wAreaCode = "";
    let wGroup1 = "";
    let wGroup2 = "";
    switch (wInputLength) {
    case 11:
        wAreaCode = wModifiedNumber.substring(0, 5);
        wGroup1 = wModifiedNumber.substring(5, 8);
        wGroup2 = wModifiedNumber.substring(8);
        wDisplayNumber = wAreaCode + "-" + wGroup1 + "-" + wGroup2;
        break;
    case 10:
        if (parseInt(wModifiedNumber[0], 10) !== 0) {
            wModifiedNumber = "0" + wModifiedNumber;
            wAreaCode = wModifiedNumber.substring(0, 5);
            wGroup1 = wModifiedNumber.substring(5, 8);
            wGroup2 = wModifiedNumber.substring(8);
            wDisplayNumber = wAreaCode + "-" + wGroup1 + "-" + wGroup2;
        } else {
            wDisplayNumber = "-1";
        }
        break;
    case 6:
        wGroup1 = wModifiedNumber.substring(0, 3);
        wGroup2 = wModifiedNumber.substring(3);
        wDisplayNumber = wGroup1 + "-" + wGroup2;
        break;
    case 0:
        wDisplayNumber = "-1";
        break;
    default:
        wDisplayNumber = "-1";
        break;
    }
    return wDisplayNumber;
}


export function showWait(pTarget) {
    try {
        $w(`#img${pTarget}Wait`).show();
        $w(`#btn${pTarget}ASave`).disable();
    }
    catch(err) {
        console.log(`/membersArea/profile showWait Try-catch err for `, pTarget);
        console.log(err);
    }
}

export function hideWait(pTarget) {
    try {
        $w(`#img${pTarget}Wait`).hide();
        $w(`#btn${pTarget}ASave`).enable();
    }
    catch(err) {
        console.log(`/membersArea/profile hideWait Try-catch err for `, pTarget);
        console.log(err);
    }
}
