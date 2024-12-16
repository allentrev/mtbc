import wixWindow from "wix-window";
import wixLocation from "wix-location";
import { authentication } from "wix-members-frontend";

import { retrieveSessionMemberDetails } from "public/objects/member";

let loggedInMember;
let loggedInMemberRoles;

// for testing -----------------------------------------------------------------------------
let gTest = false;

const isLoggedIn = gTest ? true : authentication.loggedIn();

$w.onReady(async function () {
    let status;

    // for testing ------	------------------------------------------------------------------------
    //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
    let wUser = {
        _id: "88f9e943-ae7d-4039-9026-ccdf26676a2b",
        loggedIn: true,
        roles: [{ title: "Manager" }],
    }; //Me
    //let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"},{"title": "Press"}]}; //Tony Roberts
    //let wUser = {"_id": "612f172a-1591-4aec-a770-af673bbc207b", "loggedIn": true, "roles": [{"title": "Member"},{"title": "Captain"}]}; //Tony Roberts
    /**
    Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
	Julia Allen		16b77976-37d1-41df-a328-4433d2d40cbc	612f172a-1591-4aec-a770-af673bbc207b
    Trevor Allen	7e864e0b-e8b1-4150-8962-0191b2c1245e	88f9e943-ae7d-4039-9026-ccdf26676a2b
    Tony Stuart		28f0e772-9cd9-4d2e-9c6d-2aae23118552	5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9
    John Mitchell	40a77121-3265-4f0c-9c30-779a05366aa9	5132409b-6d6a-41c4-beb7-660b2360054e
    Tony Roberts	4d520a1b-1793-489e-9511-ef1ad3665be2	af7b851d-c5e5-49a6-adc9-e91736530794
    Cliff Jenkins	d81b1e42-6e92-43d0-bc1e-a5985a25487a	c287a94e-d333-40aa-aea6-11691501571e
    Tim Eales		2292e639-7c69-459b-a609-81c63202b1ac	6e5b5de1-214f-4b03-badf-4ae9a6918f77
    Yoneko Stuart	93daeee8-3d4b-40cc-a016-c88e93af1559	957faf19-39cd-47ca-9b81-5a0c2863bb87
    */

    [status, loggedInMember, loggedInMemberRoles] =
        await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
    //console.log(loggedInMember);
    //console.log(loggedInMemberRoles);
    if (isLoggedIn) {
        configurePage();
    } else {
        console.log("/membersArea/MembersMenu onready isloggenIn fail");
    }
    //====== Event Handlers ----------------------------------------------------------------------------------------------
    //
    $w("#lblManagerSystemMaintainMember").onClick(() =>
        dolblClick("maintain-member")
    );
});
/**
export const ROLES = Object.freeze({
	ADMIN:			"Admin",
	MANAGER:		"Manager",j
	CAPTAIN:		"Captain",j
	DAY_CAPTAIN:	"Day_Captain",
	COMPETITION:	"Competition",j
	PRESS:			"Press",j
	COACH:			"Coach",j
	MEMBER:			"Member",j
	VISITOR:		"Visitor"
});
*/

function configurePage() {
    let wRoles = convertToString(loggedInMemberRoles);
    $w("#lblFullName").text = loggedInMember.name;
    //console.log(loggedInMemberRoles);
    //console.log(loggedInMemberRoles.includes("Captain"));
    $w("#lblRole").text = wRoles;
    $w("#lblWixId").text = loggedInMember.wixId;
    $w("#lblLstId").text = loggedInMember.lstId;
    loggedInMemberRoles.includes("Admin") ?
        $w("#strAdmin").expand()
    :   $w("#strAdmin").collapse();
    loggedInMemberRoles.includes("Manager") ?
        $w("#strManager").expand()
    :   $w("#strManager").collapse();
    loggedInMemberRoles.includes("Coach") ?
        $w("#strCoach").expand()
    :   $w("#strCoach").collapse();
    loggedInMemberRoles.includes("Press") ?
        $w("#strPressOfficer").expand()
    :   $w("#strPressOfficer").collapse();
    loggedInMemberRoles.includes("Captain") ?
        $w("#strTeamCaptain").expand()
    :   $w("#strTeamCaptain").collapse();
    loggedInMemberRoles.includes("Competition") ?
        $w("#strTeamCaptain").expand()
    :   $w("#strTeamCaptain").collapse();
    $w("#strTeamCaptain").expand();
    switch (wixWindow.formFactor) {
        case "Mobile":
            $w("#txtFormFactor").text = "Mobile";
            break;
        case "Tablet":
            $w("#txtFormFactor").text = "Tablet";
            break;
        case "Desktop":
            $w("#txtFormFactor").text = "Desktop";
            break;
        default:
            $w("#txtFormFactor").text = "Desktop";
            break;
    }
}

export function dolblClick(pPage) {
    $w("Image").show();
    wixLocation.to(`/${pPage}`);
}

export function convertToString(pRoles) {
    let wString = "";
    pRoles.forEach((item) => {
        wString = wString + item + ", ";
    });
    return wString.substring(0, wString.length - 2);
}
