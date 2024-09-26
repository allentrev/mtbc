//------------------------------------------------------------------------------------------------------
//
//	The pupose of this page is to provide the visitor with information and processes to allow them to
//	make contact with the club.
//
//------------------------------------------------------------------------------------------------------
import wixLocation 				from 'wix-location';
import _ from 'lodash';

import { loadStandingData } from 'backend/backSystem.jsw';
import { buildMemberCache, getMember}from 'public/objects/member';
import { loadOfficers } from 'backend/backOfficers.jsw';

//---------------for testing------------------------------------------------------------------------
let gTest = false;
const gYear = new Date().getFullYear();
//--------------------------------------------------------------------------------------------------


$w.onReady(async function () {
	//TODO: This is manually maintained in code. Need a new members area facility to maintain this data 
	//		in the database

	const myTableData = [
  		{"contact": "Maidenhead Town", "phone": "01628-675-911"},
 	];
/**
  		{"contact": "Jeff Beale (Secretary)", "phone": "07899 813 015"},
  		{"contact": "Kim Eales (Ladies Captain)", "phone": "07887 848 447"},
  		{"contact": "Tim Eales (Men's Captain) ", "phone": "07766 130 664"}
* 
 */
    try {
 		let wOfficers =[];
		let wResult;
		let wName = "";
		let wPhone = "";
		let wTemp = await loadStandingData("Contact Us");
		//console.log("wTemp");
		//console.log(wTemp);
		let wTemp2 = wTemp[0];
		//console.log("wTemp2");
		//console.log(wTemp2);
		let wJobKeys = wTemp2.split(",");
		//console.log("wJobKeys");
		//console.log(wJobKeys);
		await buildMemberCache();
		wResult  = await loadOfficers();
		if (wResult.status) {
			wOfficers = wResult.officers;
		}
		for (let wJobKey of wJobKeys){
		//console.log("wJobKey");
		//console.log(wJobKey);
			let wJob = wOfficers.find( item => item.refKey === wJobKey.trim());
		//console.log("wJob");
		//console.log(wJob);
			let wPosition = wJob.position;
			if (wJob.holderId) {
				let wResult = await getMember(wJob.holderId);
				if (wResult.status) {
					let wMember = wResult.member;
					wName = wMember.fullName;
					wPhone = hyphenatePhoneNumber(wMember.mobilePhone);
				} else {
					wName = "Vacant";
					wPhone = "";
				}
			} else {
				wName = "Vacant";
				wPhone = "";
			}
			let wContact = `${wName} (${wPosition})`;
			let wRow = {
				"contact": wContact,
				"phone": wPhone
			}
			myTableData.push(wRow);
		}
		$w("#tblContacts").rows = myTableData;

    }
    catch (err) {
		console.log("/page/Contact Us onReady Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")};
	}
});

function hyphenatePhoneNumber(pPhoneNumber) {
    let wDisplayNumber = "";
    if (pPhoneNumber === null || pPhoneNumber === undefined) return "";
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
			wDisplayNumber = "";
        }
        break;
    case 6:
        wGroup1 = wModifiedNumber.substring(0, 3);
        wGroup2 = wModifiedNumber.substring(3);
        wDisplayNumber = wGroup1 + "-" + wGroup2;
        break;
    case 0:
        wDisplayNumber = "";
        break;
    default:
        wDisplayNumber = "";
        break;
    }
    return wDisplayNumber;
}
