//------------------------------------------------------------------------------------------------------
//
//	The pupose of this lightbox is give the user the means to select a memberof the club and pass that 
//  member's details to the calling facility.
//
//------------------------------------------------------------------------------------------------------
import wixData		from 'wix-data';
import wixWindow	from 'wix-window';

const HL_COLOR = "rgba(190,190,250)";
const REG_COLOR = "rgba(222,222,222)";

let listSize;
//let currIndex = -1;

let wCandidates = [];
let wTeam = [];
let wSurname = true;
var wQuery;
let wMix = "X";
let wSeeds = 0;
let wType = 1;
let wNoTeams = 0;

/*
class objMember  {
  constructor(id, firstName, surname) {
    this.id = id;
	this.firstName = firstName;
	this.surname = surname;
	this.player = firstName + " " + surname;
  }
}
*/

$w.onReady(function () {
	let wParams = wixWindow.lightbox.getContext();
	// /*
	wMix = wParams.mix;
	wSeeds = wParams.seeds;
	wType = wParams.type;
	wNoTeams = wParams.noTeams;
	// */
	/*
	wMix = "X";
	wSeeds = 0;
	wType = 2;
	wNoTeams = 3;
	// */
	
	let strMix = "";
	
	$w('#tblCandidates').rows = [];
	$w('#tblTeam').rows = [];

	let wSeedsStr = (wSeeds > 0 ) ? "Seeds" : "Non-seeded";
	switch (wMix) {
		case "L":
			strMix = " female";
			break;
		case "M":
			strMix = " male";
			break;
		case "X":
			strMix = " mixed";
			break;
		default:
			strMix  = " mixed";
			break;
	}
	if (wType === 1){
		$w('#lblIntro').text = "You need " + String(wNoTeams) + strMix + " individual players";
		$w('#boxTeam').collapse();
		$w('#lblSkipsCount').text = String(wCandidates.length) + " / " + String(wNoTeams);
	} else {
		$w('#boxTeam').expand();
		$w('#lblIntro').text = "You need " + String(wNoTeams) + strMix + " teams of " + String(wType) + " players";
		//loadTeamTable(wType);
		//$w('#tblTeam').rows = wTeam;
		$w('#lblSkipsCount').text = String(wCandidates.length) + " / " + String(wNoTeams);
		$w('#lblSideCount').text = String(wTeam.length) + " / " + String(wType);
	}
	
	$w('#inpName').onKeyPress((event) => {
		processKeyPress(event);
	});

});

function processKeyPress(event){
	setTimeout(() => {
		if ($w('#inpName').value.length === 0) {
			//currIndex = -1;
			$w("#rptDropdown").collapse()
				.then(() => {
					//console.log("Done with collapse a1");
				});
		} else {
			if (wMix === "X") {
				if (wSurname) {
					wQuery = wixData.query("lstMembers")
						.startsWith("surname", $w('#inpName').value)
						.ne("type", "Past")
						.ascending("surname")
						.limit(10);
				} else {
					wQuery = wixData.query("lstMembers")
						.startsWith("firstName", $w('#inpName').value)
						.ne("type", "Past")
						.ascending("surname")
						.limit(10);
				}
			} else {
				if (wSurname) {
					wQuery = wixData.query("lstMembers")
						.startsWith("surname", $w('#inpName').value)
						.ne("type", "Past")
						.eq("gender", wMix)
						.ascending("surname")
						.limit(10);
				} else {
					wQuery = wixData.query("lstMembers")
						.startsWith("firstName", $w('#inpName').value)
						.ne("type", "Past")
						.eq("gender", wMix)
						.ascending("surname")
						.limit(10);
				}
			}

			//switch (event.key) {
			/*
			case "Enter":
				console.log("Enter");
				if (wSurname) {
					$w('#inpName').value = $w('#rptDropdown').data[currIndex].surname;
				} else {
					$w('#inpName').value = $w('#rptDropdown').data[currIndex].firstName;
				}
				$w("#rptDropdown").collapse()
					.then(() => {
						//console.log("Done with collapse a2");
					});
				break;
		
			case "ArrowLeft":
			case "ArrowRight":
				break;
			case "ArrowUp":
				if (currIndex > 0) {
					currIndex -= 1;
					refresh_repeater();
				}
				break;
			case "ArrowDown":
				if (currIndex < listSize - 1) {
					currIndex += 1;
					refresh_repeater();
				}
				break;
			case "Escape":
				$w('#inpName').value = '';
				currIndex = -1;
				$w("#rptDropdown").collapse()
					.then(() => {
						//console.log("Done with collapse a3");
					});
				break;
			default:
			*/
				//currIndex = -1;
				//wixData.query("memberProfile")
				$w('#rptDropdown').data = [];
				let nameList = [];
					wQuery.find()
					.then((res) => {
						//console.log("found " + res.items.length);
						nameList = res.items.map(item => {
							return {
								_id: item._id,
								memberId: item._id,
								firstName: item.firstName,
								surname: item.surname,
								player: item.firstName + " " + item.surname,
								contactpref: item.contactpref,
								contactEmail: item.contactEmail,
								mobilePhone: item.mobilePhone,
								homePhone: item.homePhone
						}});
					//console.log(nameList);
					$w('#rptDropdown').data = nameList;
					$w('#rptDropdown').expand();
					});
				/*
				} else {
					wixData.query("lstMembers")
					.startsWith("firstName", $w('#inpName').value)
					.ne("type", "Past")
					.ascending("surname")
					.limit(8)
					.find()
					.then((res) => {
						//console.log("found " + res.items.toSource());
						listSize = res.items.length;
						nameList = res.items.map(item => {
							return {
								_id: item._id,
								firstName: item.firstName,
								surname: item.surname,
								fullName: item.firstName + " " + item.surname
						}});
						//console.log(nameList);
						$w('#rptDropdown').data = nameList;
						$w('#rptDropdown').expand();
					});
				}
				*/	
				//break;
			//}
		}
	}, 50)

}

/*
function refresh_repeater() {
	console.log("refresh rpt");
	$w("#rptDropdown").forEachItem(($item, itemData, index) => {
		//console.log("Item = " + itemData.toSource());
		$item('#txtName').text = itemData.fullName;

		if (index === currIndex) {
			$item("#rptBox").style.backgroundColor = HL_COLOR;
		} else {
			$item("#rptBox").style.backgroundColor = REG_COLOR;
		}

		$item('#container2').onClick(() => {
			console.log("cnt2 click");
			$w('#inpName').value = itemData.surname;
			$w('#rptDropdown').collapse();
		});
	});
}
*/

export function rptDropdown_itemReady_1($item, itemData, index) {
	//Add your code for this event here: 
	$item('#txtName').text = itemData.player;

	//if (index === currIndex) {
	//	$item("#rptBox").style.backgroundColor = HL_COLOR;
	//} else {
	//	$item("#rptBox").style.backgroundColor = REG_COLOR;
	//}

	$item('#container2').onClick((event) => {
		let wIndex;
		if (wType === 1) {
			//TODO: replce wCandidates by a more inclusive array
			wIndex = wCandidates.findIndex(obj => obj._id === itemData._id);
			if (wIndex > -1) { return }							//skip if already in the list
			let wSide = [];
			let wSideIds = [];
			wSide[0]= itemData.player;
			wSideIds[0]= itemData._id;
			addCandidate(itemData, wSide, wSideIds);
		}  else {
			wIndex = wTeam.findIndex(obj => obj._id === itemData._id);
			if (wIndex > -1 ) { return }							//skip if already in the list
			addTeamMember(itemData);
		}
		$w('#inpName').value = "";
		$w('#rptDropdown').collapse();
		$w('#inpName').focus();
	});
}

export function btnAccept_click(event) {
	//Add your code for this event here: 
    //var m = new objMember($w('#txtId').text,$w('#inpFirst').value, $w('#inpName').value);
	wixWindow.lightbox.close(wCandidates);

}

export function btnClose_click(event) {
	//Add your code for this event here: 
	wixWindow.lightbox.close([]);
}

export function rgpSearchOn_change(event) {
	if (event.target.value === "first") {
		wSurname = false
	} else {
		wSurname = true;
	}
}

export function tblCandidates_rowSelect(event) {
	removeCandidate(event.rowIndex);
}

export function tblTeam_rowSelect(event) {
	removeTeamMember(event.rowIndex);
}

export function btnAdd_click(event) {
		//	add to candidatelist
		let wRow = $w('#tblTeam').rows[0];
		let wSide = $w('#tblTeam').rows.map( obj => obj.player);
		let wIds = $w('#tblTeam').rows.map( obj => obj._id);
		addCandidate(wRow, wSide, wIds);
		// clear team list
		wTeam = [];
		$w('#tblTeam').rows = wTeam;
		$w('#lblSideCount').text = String(wTeam.length) + " / " + String(wType);
		$w('#inpName').focus();
		$w('#btnAdd').hide();
		$w('#inpName').enable();
}

function addTeamMember(pItem) {
	let wPerson = { "_id": pItem._id, "firstName": pItem.firstName, "surname": pItem.surname,
					 "player": pItem.player};
	wTeam.push(wPerson);
	$w('#tblTeam').rows = wTeam;
	$w('#lblSideCount').text = String(wTeam.length) + " / " + String(wType);
	if (wTeam.length >= wType ) {
		$w('#inpName').disable();
		showError(2);
		$w('#btnAdd').show();
	} else {
		$w('#btnAdd').hide();
	}
}

function removeTeamMember(pIndex) {
	wTeam.splice(pIndex,1);
	$w('#lblSideCount').text = String(wTeam.length) + " / " + String(wType);
	$w('#tblTeam').rows = wTeam;
	$w('#inpName').enable();
}

function addCandidate(pItem, pTeam, pTeamIds) {
	let wPerson = { "_id": pItem._id, "memberId": pItem._id, "firstName": pItem.firstName, "surname": pItem.surname,
				 "player": pItem.player, "teamNames":pTeam, "teamIds":pTeamIds,
				 "contactpref": pItem.contactpref, "contactEmail": pItem.contactEmail,
				 "mobilePhone": pItem.mobilePhone, "homePhone": pItem.homePhone};
	wCandidates.push(wPerson);
	$w('#tblCandidates').rows = wCandidates;
	$w('#lblSkipsCount').text = String(wCandidates.length) + " / " + String(wNoTeams);
	if (wCandidates.length >= wNoTeams) {
		$w('#inpName').disable();
		showError(1);
	}
}

function removeCandidate(pIndex) {
	wCandidates.splice(pIndex,1);
	$w('#lblSkipsCount').text = String(wCandidates.length) + " / " + String(wNoTeams);
	$w('#tblCandidates').rows = wCandidates
	$w('#inpName').enable();
}

function showError(pErr) {
	let wMsg = ["Number of candidates reached",
				"Team has been filled"
	];

	$w('#txtErrorMsg').text = wMsg[pErr-1];
	$w('#txtErrorMsg').show();
	setTimeout(() => {
		$w('#txtErrorMsg').hide();
	}, 4000);
	return
}
