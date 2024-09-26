import wixWindow 				from	'wix-window';
import wixData					from 'wix-data';
import wixWindowFrontend        from 'wix-window-frontend';

import { authentication }   from 'wix-members-frontend';

import { retrieveSessionMemberDetails } from 'public/objects/member';

let loggedInMember;
let loggedInMemberRoles;

let status;

const HL_COLOR = "rgba(190,190,250)";
const REG_COLOR = "rgba(222,222,222)";

let listSize;
let currIndex = -1;

/**
class objMember  {
  constructor(id, firstName, surname) {
    this.id = id;
	this.firstName = firstName;
	this.surname = surname;
	this.fullName = firstName + " " + surname;
  }
}
*/

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {
	// for testing ------	------------------------------------------------------------------------
	//let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
	let wUser = {"_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{"title": "Manager"}]}; //Me
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
    
    [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

    if (isLoggedIn) {
		$w('#ctrSelect').expand();
		$w('#ctrNotSignedOn').collapse();
		$w('#inpFirst').value = "";
		$w('#inpName').value = "";
	} else {
		$w('#ctrSelect').collapse();
		$w('#ctrNotSignedOn').expand();
	}

	$w('#btnSignOn').onClick( (event) => { doLoadPage("lbxLogin1")});
	$w('#btnRegister').onClick( (event) => { doLoadPage("lbxRegister1")});
	$w('#btnCopyToClipboard').onClick( (event) => { doCopyToClipboard() });
	$w('#btnClear').onClick( (event) => { doClear() });
	$w('#cntMatchingNameList').onClick( (event) => { doSelectFromMatchingNameList(event)});
	

	$w('#inpFirst').onKeyPress( (event) => {inpFirst_keyPress(event)});
	$w('#inpName').onKeyPress( (event) => {inpName_keyPress(event)});

	$w('#rptMatchingNameList').onItemReady(($item, itemData, index) => {
		loadMatchingNameList($item, itemData, index);
	});
});

function doLoadPage(pPage){
    wixWindowFrontend.openLightbox(pPage);
    wixWindow.lightbox.close();

}

export function inpFirst_keyPress(event) {
	$w('#inpName').disable();
	setTimeout(() => {
		if ($w('#inpFirst').value.length === 0) {
			currIndex = -1;
			$w("#rptMatchingNameList").collapse()
				.then(() => {
					//console.log("Done with collapse a1");
				});
		} else {
			currIndex = -1;
			//wixData.query("memberProfile")
			wixData.query("lstMembers")
				.startsWith("firstName", $w('#inpFirst').value)
				.ne("type", "Past")
				.ne("type", "Test")
				.ascending("surname")
				.ascending("firstName")
				.limit(12)
				.find()
				.then((res) => {
					//console.log("found " + res.items.toSource());
					$w('#rptMatchingNameList').data = [];
					let nameList = [];
					nameList = res.items.map(item => {
						return {
							_id: item._id,
							firstName: item.firstName,
							surname: item.surname,
							allowshare: item.allowshare,
							fullName: item.firstName + " " + item.surname,
							email: item.contactEmail || "No email address",
							mobilePhone: item.mobilePhone || "No number available",
							homePhone: item.homePhone || "No number available"
					}});
					$w('#rptMatchingNameList').data = nameList;
					listSize = res.items.length;
					$w('#rptMatchingNameList').expand();
				});
		}
	}, 50)
}

export function inpName_keyPress(event) {
	$w('#inpFirst').disable();
	setTimeout(() => {
		if ($w('#inpName').value.length === 0) {
			currIndex = -1;
			$w("#rptMatchingNameList").collapse()
				.then(() => {
					//console.log("Done with collapse a1");
				});
		} else {
			currIndex = -1;
			//wixData.query("memberProfile")
			wixData.query("lstMembers")
				.startsWith("surname", $w('#inpName').value)
				.ne("type", "Past")
				.ne("type", "Test")
				.ascending("surname")
				.ascending("firstName")
				.limit(12)
				.find()
				.then((res) => {
					//console.log("found " + res.items.toSource());
					$w('#rptMatchingNameList').data = [];
					let nameList = [];
					nameList = res.items.map(item => {
						return {
							_id: item._id,
							firstName: item.firstName,
							surname: item.surname,
							fullName: item.firstName + " " + item.surname,
							allowshare: item.allowshare,
							email: item.contactEmail || "No email address",
							mobilePhone: item.mobilePhone || "No number available",
							homePhone: item.homePhone || "No number available"
					}});
					$w('#rptMatchingNameList').data = nameList;
					listSize = res.items.length;
					$w('#rptMatchingNameList').expand();
				});
		}
	}, 50)
}

export function doSelectFromMatchingNameList(event) {
    const data = $w("#rptMatchingNameList").data;
    let itemData = data.find(item => item._id === event.context.itemId);
	$w('#inpName').value = itemData.surname;
	$w('#inpFirst').value=itemData.firstName;
	if (itemData.allowshare === "N") {
		$w('#boxDetails').collapse();
		$w('#boxNoShare').expand();
	} else {
		$w('#lblEmail').text = itemData.email || "No Email address";
		$w('#lblMobilePhone').text = hyphenatePhoneNumber(itemData.mobilePhone) || "No number available";
		$w('#lblHomePhone').text = hyphenatePhoneNumber(itemData.homePhone) || "No number available";
		$w('#boxDetails').expand();
		$w('#boxNoShare').collapse();
	}
	$w('#rptMatchingNameList').collapse();
}


export function doClear() {
	$w('#inpFirst').value = "";
	$w('#inpName').value = "";
	$w('#lblEmail').text = "";
	$w('#lblMobilePhone').text = "";
	$w('#lblHomePhone').text = "";
	$w('#boxDetails').collapse();
	$w('#boxNoShare').collapse();
	$w('#inpFirst').enable();
	$w('#inpName').enable();
	$w('#inpFirst').focus();
}

export function loadMatchingNameList($item, itemData, index) {
	//Add your code for this event here:
	//console.log("Index = ", index, itemData.fullName);
	$item('#txtName').text = itemData.fullName;
	//$item('#txtId').text = itemData._id;

	if (index === currIndex) {
		$item("#rptBox").style.backgroundColor = HL_COLOR;
	} else {
		$item("#rptBox").style.backgroundColor = REG_COLOR;
	}
}

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

export function doCopyToClipboard() {
	wixWindow.copyToClipboard($w('#lblEmail').text)
		.then( () => {
			//console.log("Copied to clipboard");    // handle case where an error occurred
  		})
		.catch( (err) => {
			//console.log("Copy to clipboard failed");    // handle case where an error occurred
  		});
}