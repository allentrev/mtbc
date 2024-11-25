// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import wixLocation 						from 'wix-location';	
import { authentication }   from 'wix-members-frontend';
import _ 									from 	'lodash';

import { retrieveSessionMemberDetails } from 'public/objects/member';
import { isRequiredRole } 		from 'public/objects/member';

import { getAllBookingsWithPerson }		from 'public/objects/booking';
import { getAllCompBookingsWithPerson }	from 'public/objects/booking';
import { formatDateString }				from 'public/fixtures';
import { loadOpenTeamCompetitions } 	from 'public/objects/clubComp';
import { getAllTeams } 					from 'public/objects/clubComp';
import { buildMemberCache }		from 'public/objects/member';
import { getFullNameLocally }		from 'public/objects/member';

let w_time_slots = [
	{"_id": "0", "txt": "10:00\nto\n11:30"},
	{"_id": "1", "txt": "11:30\nto\n13:00"},
	{"_id": "2", "txt": "14:00\nto\n15:30"},
	{"_id": "3", "txt": "15:30\nto\n17:00"},
	{"_id": "4", "txt": "18:00\nto\n21:00"},
];

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = false;
// ------------------	------------------------------------------------------------------------
const isLoggedIn = (gTest) ? true : authentication.loggedIn();

$w.onReady(async function () {

	let status;

    // for testing ------	------------------------------------------------------------------------
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
    
    [status, loggedInMember, loggedInMemberRoles] = await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases

    if (isLoggedIn) {
        let wRoles = loggedInMemberRoles.toString();
        console.log("/membersArea/ClubBooking onReady/ Roles = <" + wRoles + ">", loggedInMember.name, loggedInMember.lstId);
    } else {
        console.log("/membersArea/clubBooking onReady Not signed in");
    }
	
	await buildMemberCache();

	let wMyBookings = await loadClubBookings(loggedInMember.lstId);
	let wTeamBookings = await loadTeamBookings(loggedInMember.lstId);
	let wAllBookings = [];
	if (wMyBookings && wTeamBookings) {
		wAllBookings = [...wTeamBookings, ...wMyBookings];
	} else { 
		if (wMyBookings) { 
			wAllBookings = [...wMyBookings];
		} else { 
			wAllBookings = [...wTeamBookings];
		}
	}
	//sort the object by a property (ascending)
	//sorting parses each item to Date type
	let wBookings = wAllBookings.filter( item => item.isBye !== "Y")
								.filter( item => item.parentId === "");

	let wSortedBookings  = _.sortBy(wBookings, ['requiredJDate', 'slotId']);
	//console.log(wSortedBookings);
	displayBookings(wSortedBookings);

	$w("#repeater1").onItemReady(async ($item, itemData, index) => {
		await loadRepeater($item, itemData, index);
	});
});

async function loadTeamBookings(pUserId) {
	//console.log("LoadTeamB");
	let wComps = await loadOpenTeamCompetitions();
	let wTeams = await getAllTeams(wComps);
	let wSkips = [];
	for (let wTeam of wTeams){
		if (wTeam.skipId !== pUserId) {	//pass if you are the skip in this game, as loadClubBookings catches these 
			if (wTeam.teamIds.includes(pUserId)) { 
				wSkips.push(wTeam.teamIds[0])
			}
		}
	}
	//console.log("Team Comps");
	//console.log(wComps);
	//console.log("Skips");
	//console.log(wSkips);
	if (wSkips) { 
		let wBookings = [];
		for (let i=0; i<wSkips.length; i++) {
			const wSkip = wSkips[i];
			//console.log("Skip = ", wSkip);
			for (let wComp of wComps) {
				let wSkipBookings = await getAllCompBookingsWithPerson(wComp, wSkip);
				if (wSkipBookings) {
					//console.log("Comp bookings", wComp, wSkip);
					//console.log(wSkipBookings);
					wBookings.push(...wSkipBookings);
				}
			} 
		}
		return wBookings;
	}
	return [];
}

export async function loadClubBookings(pUserId) {

	return await getAllBookingsWithPerson(pUserId);

}

export async function displayBookings(pData) {

	if (pData && pData.length > 0) {
		$w("#repeater1").expand();
		$w('#lblNoRecordsFound').collapse();
		$w("#repeater1").data = pData;
	} else {
		$w("#repeater1").collapse();
		$w('#lblNoRecordsFound').expand();
	}
}

async function loadRepeater($item, itemData, index) {
	await loadLine($item, itemData, index);
}

async function loadLine($item, itemData, index) {
	$item("#txtDateRequired").text = formatDateString(itemData.dateRequired, "Short");
	//$item("#txtBooker").text = await getMemberName(itemData.bookerId);
	if (itemData.slotId === 0) { 
		$item("#txtTime").text = "x";
		$item('#txtRink').text = "x";
	} else { 
		$item("#txtTime").text = w_time_slots[String(itemData.slotId - 1)].txt.substring(0, 6);
		$item('#txtRink').text = String(itemData.rink);
	}
	[,$item("#txtPlayerA").text] = await getFullNameLocally(itemData.playerAId);
	if (itemData.playerBId === null || itemData.playerBId === undefined) {
		$item("#txtPlayerB").text = "";
	} else {
		[,$item("#txtPlayerB").text] = await getFullNameLocally(itemData.playerBId);
	}
}

/**
 *	Adds an event handler that runs when the element is double-clicked.
 *	 @param {$w.MouseEvent} event
 */
export function container2_dblClick(event) {
	///console.log("Dbl clk");
	let wItemId = event.context.itemId;
	let wDate = new Date();
	$w('#repeater1').forItems( [wItemId], ($item, itemData) => { 
		wDate = itemData.dateRequired;
	})
	let wYear = wDate.getFullYear();
	let wMonth = wDate.getMonth();
	let wDay = wDate.getDate();
	let wURL = `/booking?requiredYear=${wYear}&requiredMonth=${wMonth}&requiredDay=${wDay}`;
	wixLocation.to(wURL);

}
