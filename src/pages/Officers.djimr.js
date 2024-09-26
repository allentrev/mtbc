//------------------------------------------------------------------------------------------------------
//
//	The main pupose of this page is to show a visitor who in the club holds what committee job.
//
//	It has a secondary purpose to allow a club member to use a lightbox to update those allocations. 
//	Since this is a member only function, then the page also contains a link to allow a visitor to sign onto
//	the site as a club Member. The visitor must be registered as a club member. Once logged on, the user's name is displayed
//	and a link made availble to access the member's area home panel.
//
//------------------------------------------------------------------------------------------------------
import wixLocation 				from 'wix-location';
import wixWindow 				from 'wix-window';

import	_						from 'lodash';

import {loadCommittee}			from 'backend/backOfficers.jsw';
import {findCommitteeId}		from 'backend/backOfficers.jsw';
import { loadOfficers }			from 'backend/backOfficers.jsw';
import { getAllLeagueTeams }	from 'backend/backTeam.jsw';
import { buildMemberCache }		from 'public/objects/member';
import { getMember }			from 'public/objects/member';
import { authentication }		from 'wix-members';
import { getNewLeague }			from 'backend/backTeam.jsw';

let wData = [];
let gTeams= [];

//---------------for testing------------------------------------------------------------------------
let gTest = false;
//--------------------------------------------------------------------------------------------------

const isLoggedIn = authentication.loggedIn();

let gOfficers = [];

$w.onReady(async function () {

    try {

		let status;

		if (isLoggedIn) {
			$w("#txtIntro").text = ` As a member, you can double click on a person's name to load that person's contact details`;
		} else {
			$w("#txtIntro").text = `As a visitor to this site, simply select from the dropdown the committee that you want to see the members of.`;
		}

		await buildMemberCache();
		await loadListData();
		await loadDropDownData();
		
		$w('#secMain').expand();
		$w('#secPerson').collapse();

		let wResult = await getAllLeagueTeams();
		if (wResult.status){ 
			let wAllTeams = wResult.teams;
			gTeams = _.sortBy(wAllTeams, ['gender','teamKey']);
		}
		
		if (!gTeams) {
			showError(1);
			return;
		}

		$w('#lblListName').onDblClick( (event) => doLblListMemberClick(event));
		$w('#lblListTCName').onDblClick( (event) => doLblListMemberClick(event));
		$w('#btnContactCardClose').onClick( (event) => doBtnContactCardCloseClick(event));
		$w('#btnCopyToClipboard').onClick( (event) => doBtnCopyToClipboardClick());


		$w("#rptJobs").onItemReady( ($item, itemData, index) => {
			loadRptJobs($item, itemData);
		});

		$w("#rptTeamCaptains").onItemReady( ($item, itemData, index) => {
			loadRptTeamCaptains($item, itemData);
		});
	}	
	catch (err) {
		console.log("/page Officers onReady Try-catch, err");
		console.log(err);
        if (!gTest) { wixLocation.to("/syserror")}
	}
});

async function loadDropDownData() {
	let wResult = await loadCommittee();
	if (wResult.status){
		let wCommitteeList = wResult.committees; 
		if (wCommitteeList){ 
			$w('#drpCommittee').options = wCommitteeList;
			$w('#drpCommittee').selectedIndex = 0;
			let wKey = $w('#drpCommittee').value;
			await committeeChange(wKey);
		}
	} else {
		console.log("/page Officers loadDropDownData error reading committee list");
	}
}

async function loadRptJobs($item, itemData) {
		// item holds: holderId, positionId, commKey, _id
		$item("#lblListId").text = itemData._id;
    	$item("#lblListPosition").text = itemData.position;
		$item('#lblListName').text = itemData.fullName;
		$item('#lblListHolderId').text = itemData.holderId;
		$item('#lblListAllowShare').text  = itemData.allowShare || "N";
		$item('#lblListContactEmail').text  = itemData.contactEmail;
		$item('#lblListMobilePhone').text  = itemData.mobilePhone || "No mobile#";
		$item('#lblListHomePhone').text  = itemData.homePhone || "No home#";
}

async function loadRptTeamCaptains($item, itemData) {

	$item('#lblListTCPosition').text = itemData.position;
	$item('#lblListTCName').text = itemData.fullName;
	$item('#lblListTCHolderId').text = itemData.holderId;
	$item('#lblListTCAllowShare').text  = itemData.allowShare || "N";
	$item('#lblListTCContactEmail').text  = itemData.contactEmail;
	$item('#lblListTCMobilePhone').text  = itemData.mobilePhone || "No mobile#";
	$item('#lblListTCHomePhone').text  = itemData.homePhone || "No home#";
}

export async function drpCommittee_change(event) {
	let wKey = event.target.value;
	committeeChange(wKey);
}

function doLblListMemberClick(event){
		let wName = "";
		let wHolderId = "";
		let wAllowShare = "N";
		let wContactEmail = "";
		let wMobilephone = "";
		let wHomePhone = "";
	let wControl = $w.at(event.context);
    let wControlName = event.target.id;
	if (wControlName === "lblListName"){
		wName = wControl(`#lblListName`).text;
		wHolderId = wControl(`#lblListHolderId`).text;
		wAllowShare = wControl(`#lblListAllowShare`).text || "N";
		wContactEmail = wControl(`#lblListContactEmail`).text || "";
		wMobilephone = wControl(`#lblListMobilePhone`).text  || "No mobile#";
		wHomePhone = wControl(`#lblListHomePhone`).text || "No home#";
	} else {
		wName = wControl(`#lblListTCName`).text;
		wHolderId = wControl(`#lblListTCHolderId`).text;
		wAllowShare = wControl(`#lblListTCAllowShare`).text || "N";
		wContactEmail = wControl(`#lblListTCContactEmail`).text || "";
		wMobilephone = wControl(`#lblListTCMobilePhone`).text  || "No mobile#";
		wHomePhone = wControl(`#lblListTCHomePhone`).text  || "No home#";
	}
	if (wHolderId === "") { return }
	$w('#secMain').collapse();
	$w('#secPerson').expand();
	$w('#lblFullName').text = wName;
	if (wAllowShare === "N") {
		$w('#boxContactCard').collapse();
		$w('#boxNoShare').expand();
	} else { 
		$w('#boxContactCard').expand();
		$w('#boxNoShare').collapse();
		$w('#lblEmail').text = wContactEmail;
		$w('#lblMobilePhone').text = hyphenatePhoneNumber(wMobilephone) || "No moile#"  ;
		$w('#lblHomePhone').text = hyphenatePhoneNumber(wHomePhone) || "No home#";
	}
}

export function doBtnContactCardCloseClick(event){
	$w('#secMain').expand();
	$w('#secPerson').collapse();
}

export function doBtnCopyToClipboardClick (){
	wixWindow.copyToClipboard($w('#lblEmail').text)
		.then( () => {
			//console.log("Copied to clipboard");    // handle case where an error occurred
  		})
		.catch( (err) => {
			//console.log("Copy to clipboard failed");    // handle case where an error occurred
  		});
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

async function committeeChangeA(pKey,){
	$w('#imgWait').show();
	let wTeamsByGender = [];
	//Add your code for this event here:
	$w('#txtMessage').hide();
	$w('#boxTeamCaptains').collapse();
	$w('#rptJobs').data = [];
	wData = await findCommitteeId($w('#drpCommittee').value);
	await loadJobs(wData);
	switch (pKey){
		case "MB":
		case "AC":
			$w('#boxTeamCaptains').collapse();
			break;
		case "MC":
			wTeamsByGender = gTeams.filter (item => item.gender == "M");
			await loadTeamCaptains(wTeamsByGender);
			break;
		case "LC":
			wTeamsByGender = gTeams.filter (item => item.gender == "L");
			await loadTeamCaptains(wTeamsByGender);
			break;
		default:
			$w('#boxTeamCaptains').collapse();
	}
	$w('#imgWait').hide();
}

async function committeeChange(pKey,){
	$w('#imgWait').show();
	let wTeamsByGender = [];
	//Add your code for this event here:
	$w('#txtMessage').hide();
	$w('#boxTeamCaptains').collapse();
	$w('#rptJobs').data = [];
	wData = gOfficers.filter( item => item.committee === pKey);
	
	await loadJobs(wData);
	switch (pKey){
		case "MB":
		case "AC":
			$w('#boxTeamCaptains').collapse();
			break;
		case "MC":
			wTeamsByGender = gTeams.filter (item => item.gender == "M");
			await loadTeamCaptains(wTeamsByGender);
			break;
		case "LC":
			wTeamsByGender = gTeams.filter (item => item.gender == "L");
			await loadTeamCaptains(wTeamsByGender);
			break;
		default:
			$w('#boxTeamCaptains').collapse();
	}
	$w('#imgWait').hide();
}

export async function loadListData () {
	try {
		let wResult =  await loadOfficers();
        let wOfficers = wResult.officers;
		gOfficers = [...wOfficers];
	}
	catch (err) {
		console.log("/page Officers loadListData Try catch, err");
		console.log(err);
	}
}


async function loadJobs(pJobs){
	let wJobs = [];
	let wName = "";
	let wMember = {};
	let wStatus;

	for (let wJob of pJobs) {

		let wEntry = {
			"_id": "",
			"position": "",
			"holderId": "",
			"fullName": "",
			"allowShare": "N",
			"contactEmail": "",
			"mobilePhone": "",
			"homePhone": ""
		}

		if (wJob.holderId) {
			let wResult = await getMember(wJob.holderId);
			if (wResult.status){
				wMember = wResult.member;
				wName = wMember.firstName + " " + wMember.surname;
				wEntry.holderId = wMember._id;
				wEntry.allowShare = wMember.allowshare || "N";
				wEntry.contactEmail = wMember.contactEmail;
				wEntry.mobilePhone = wMember.mobilePhone || "No mobile#";
				wEntry.homePhone = wMember.homePhone || "No home#";

			} else {
				console.log("/page Officers loadJobs couldnt find member, id", wJob.holderId);
				return;
			}
		} else {
			wName = "Vacant";
			wEntry.holderId = "";
			wEntry.allowShare = "N";
			wEntry.contactEmail = "";
			wEntry.mobilePhone = "";
			wEntry.homePhone = "";
		}

		wEntry._id = wJob._id;
		wEntry.position = wJob.position;
		wEntry.fullName = wName;

		wJobs.push(wEntry);
	}
	if (wJobs) {
		$w('#rptJobs').data = wJobs;
	} else {
		$w('#rptJobs').data = [];
	}
}

async function loadTeamCaptains(pTeams){

	let wCaptains = [];
	let wPosition = "";
	let wName = "";
	for (let wTeam of pTeams) {
		let wEntry = {
			"_id": "",
			"position": "",
			"fullName": "",
			"holderId": "",
			"allowShare": "N",
			"contactEmail": "",
			"mobilePhone": "",
			"homePhone": ""
		}
		if (wTeam.teamKey === "FGL" || wTeam.teamKey === "FGM" || wTeam.teamKey === "FGX") {
			wPosition = "Friendlies";
		} else {
			if (wTeam.gender === "M") {
				let wTeamCode = wTeam.teamKey.slice(-1);
				wPosition = await showLeagueName(wTeam.leagueKey, wTeam.division) + " " + wTeamCode;
			} else {
				let wLeagueName = await showLeagueName(wTeam.leagueKey, wTeam.division);
				wPosition = wLeagueName + wTeam.teamName;
				let wTeamNameBits = wTeam.teamName.split(" ");
				if (wTeamNameBits.length > 2) {
					let wTeamCode = wTeamNameBits[wTeamNameBits.length -1];
					wPosition = wLeagueName + " " + wTeamCode;
				} else {
					wPosition = wLeagueName;;
				}
			}	
		}
		
		let wFullName = "";
		let wMember = {};
		let status;
		if (wTeam.managerId) {
			let wResult = await getMember(wTeam.managerId);
			if (wResult.status){
				wMember = wResult.member;
				wName = wMember.firstName + " " + wMember.surname;
				wEntry.holderId = wMember._id;
				wEntry.allowShare = wMember.allowshare || "N";
				wEntry.contactEmail = wMember.contactEmail || "";
				wEntry.mobilePhone = wMember.mobilePhone	|| "No mobile#";
				wEntry.homePhone = wMember.homePhone || "No home#";

			} else {
				console.log("/page Officers loadJobs couldnt find captain, id", wTeam.managerId);
				return;
			}
		} else {
			wName = "Vacant";
			wEntry.holderId = "";
			wEntry.allowShare = "N";
			wEntry.contactEmail = "";
			wEntry.mobilePhone = "";
			wEntry.homePhone = "";
		}
		wEntry._id = wTeam._id;
		wEntry.position = wPosition;
		wEntry.fullName = wName;

		wCaptains.push(wEntry);
	}
	if (wCaptains) {
		$w('#rptTeamCaptains').data = wCaptains;
		$w('#boxTeamCaptains').expand();
	} else {
		$w('#rptTeamCaptains').data = [];
		$w('#boxTeamCaptains').collapse();
	}
}

async function showLeagueName(pLeagueKey, pDivision) {
	let wResult = await getNewLeague(pLeagueKey, pDivision);
	if (wResult.status){
		let wLeague = wResult.league;
		return wLeague.leagueName;
	}
	return ""
}

function showError(pErr) {
	let wMsg = ["There are no inter-club teams defined",
				"You need to sign on to make or edit a booking",
				"Cannot move or edit a completed game"
	];

	$w('#txtMessage').text = wMsg[pErr-1];
	$w('#txtMessage').expand();
	$w('#txtMessage').show();
	setTimeout(() => {
		$w('#txtMessage').hide();
		$w('#txtMessage').collapse();
	}, 8000);
	return
}
