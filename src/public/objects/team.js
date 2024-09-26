//------------------------------------------------------------------------------------------------------
//
//	TEAM OBJECT
//
//  Desc:   The "lstTeams" table holds a record for each.......getteam
//------------------------------------------------------------------------------------------------------
import wixData from 'wix-data';

import _ 									from 	'lodash';

import { loadTableData as loadEventsTable }	from	'public/fixtures';
import { findLstMember }					from	'public/objects/member';
import { ROLES } 							from	'public/objects/member';
import { findTeamByKey } 					from 	'backend/backTeam.jsw';


/**
 * Enum for Team Player object status values
 * @readonly
 * @enum {String}
 */
export const TEAMPLAYER = Object.freeze({
	NOTAVAILABLE:	"N",
	AVAILABLE:		"A",
	UNKNOWN:		"U",
	PLAYED:			"P",
	CONFIRMED:		"C"
});


export let gTeamPlayers;
let gTeam;
export let gRole = "";
export let gUser;
export let gGender = "M";
export let gUserId;
export let gMatch;

//------------------------------------------------------------------------------------------------------
//
//	Function:	addTeam
//
//  Inputs:		pTeam	Object	Team details
//	Output:		title	String	unique key given to team record
//				false	Boolean	insert failed
//  
//	TODO: Change algorithim for unique key to allow deletions to occur in table
//
//------------------------------------------------------------------------------------------------------
export async function addTeam(pTeam) {
  	try {
    	// create an item
		let wCount = 0;
		let wTeam = pTeam;
		let wData = [];
		var toInsert = {
			"recId": "",
			"title": "",
			"place": 0,
			"member": ""
	  	}
		
		let results = await wixData.query("lstTeams").distinct("title");
		if (results.items.length ===  0) {
			wCount = 1;
		} else {
			wCount = results.items.length + 1;
		}
		toInsert.title = "T" + wCount.toString();
		var i;
		for (i = 0; i < wTeam.length; i++) {
			toInsert.place = i+1;
			toInsert.recId = toInsert.title + "P" + toInsert.place.toString();
			toInsert.member = pTeam[i].member;
			//console.log(toInsert.recId, toInsert.title, toInsert.place, toInsert.member);
			wData[wData.length] = 	{"recId": toInsert.recId, "title": toInsert.title, "place": toInsert.place, "member": toInsert.member};
		}
		let result = await wixData.bulkInsert("lstTeams", wData);
			if (result) {
				return toInsert.title;
			} else {
				return false;
			}
	}
	catch (error) {
		console.log("/public/objects/team addTeam Try Catch " + error);
		return false;
	}
}
export function setRole(pRole){
	gRole = pRole;
}
export function setGTeam(pTeam){
	gTeam = pTeam;
}
export function getGTeam(){
	return gTeam;
}
//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function getTeamsByCaptain(pId) {
	// this returns an array of teams where captain = pId. Allows for case where 1 member is captain many teams
		//console.log("GetTeamsByCaptain " + pId);
	const results = await wixData.query("lstLeagueTeams")
		.eq("managerId", pId)
		.ascending("league")
		.ascending("division")
		.ascending("teamKey")
		.find();
		return results.items;
	//	console.log("Type = " + wRole);
}

export async function getTeamsByGender(pGender) {
	// this returns an array of teams where captain = pId. Allows for case where 1 member is captain many teams
		//console.log("GetTeamsByGender " + pId);
	const results = await wixData.query("lstLeagueTeams")
		.eq("gender", pGender)
		.ascending("league")
		.ascending("division")
		.ascending("teamKey")
		.find();
		return results.items;
	//	console.log("Type = " + wRole);
}

export async function getTeamSquadsByMember(pId) {
	// this returns an array of teams where the member is in the Squad
		//console.log("GetTeamsByMember " + pId);
       	const results = await wixData.query("lstTeamSquad")
    		.eq("memberId", pId)
			.ascending("teamKey")
			.limit(300)
			.find();
		//console.log(results);
		if (results.items.length ===  0) {
			return [];
		} else {
			return results.items;
		//	console.log("Type = " + wRole);
		}
} 


export async function getTeam(pId) {
		//console.log("getTeam" + pId);
       	const results = await wixData.query("lstTeams")
    		.eq("title", pId)
    		.ascending("place")
			.find();
		//console.log(results);
		if (results.items.length ===  0) {
			return false;
		} else {
			return results.items;
		//	console.log("Type = " + wRole);
		}
}

export function getLeagueTeams(pGender) {
    return wixData.query("lstLeagueTeams")
        .eq("gender", pGender)
		.ascending("league")
		.ascending("division")
		.find()
        .then( (results) => {
            if(results.items.length > 0) {
        	   	let dlist = results.items.map(item => {
					if (item.division === 0) {
						return {
							label: item.league,
							value: item._id
						}
					} else {
						return {
							label: item.league + " Div " + String(item.division) + " Team " + item.teamName,
							value: item._id
						}
					}
				})
                return dlist;
            } else {
                console.log("/public/objects/team getLeagueTeams 0 results");
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/team getLeagueTeams catch " + errorMsg);
			return false;
        } );
}

export function getLeagueTeam(pId) {
	return wixData.get("lstLeagueTeams", pId)
		.then( (item) => {
			if (item) {
				return item;
			} else {
				return false;
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team getLeagueTeam catch " + error);
			return false;
        });
}

//DEPRECATED - COPY OF WHATS IN BACKTEAMS
export function getLeagueTeamByTeamKey(pTeamKey) {

    return wixData.query("lstLeagueTeams")
		.eq("teamKey", pTeamKey)
		.find()
        .then( (results) => {
            if(results.items.length === 1) {
        	   	return results.items[0];
            } else {
                console.log("/public/objects/team getLeagueTeamByTeamKey " + results.items.length + " results for ", pTeamKey);
				return false;
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            console.log("/public/objects/team getLeagueTeamByTeamKey  catch " + errorMsg);
			return false;
        } );
}

export function getTeamSquad(pId) {
	return wixData.query("lstTeamSquad")
		.eq("teamId", pId)
		.ascending("name")
		.limit(500)
		.find()
		.then( (results) => {
			if (results.totalCount > 0) {
				return results.items;
			} else {
				return [];
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team getTeamSquad catch " + error);
			return false;
        });
}

export function getDayCaptain(pEventId) {
	return wixData.query("lstTeamDayCaptain")
		.eq("eventId", pEventId)
		.find()
		.then( (results) => {
			if (results.items.length ===  0) {
				return false;
			} else if (results.items.length > 1) {
				return false;
			} else {
				return results.items[0];
			//	console.log("Type = " + wRole);
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team getDayCaptain catch " + error);
			return false;
        });
}

export async function insertDayCaptain(pRec) {
	try {
		// create an item
	const wRec = {
		"eventId": pRec.eventId,
		"memberId": pRec.memberId,
		"teamKey": pRec.teamKey,
		"name": pRec.name,
		"email": pRec.email,
		"mobile": pRec.mobile,
		"phone": pRec.phone
	}
		let results = await wixData.insert("lstTeamDayCaptain", wRec);
		if (results) {
			let item = results;
			return item._id;
		} else {
			return false;
		}
	
	} catch (error) {
		console.log("/public/obkects/team Insert Day Captain TryCatch " + error);
		return false;
	}
}

export function updateDayCaptain(pRecId, pDayCaptain) {
	//TODO cos of change email -> contactEmail, check all these uses of email
    return wixData.get("lstTeamDayCaptain", pRecId)
  		.then( (item) => {
			item.eventId = pDayCaptain.eventid;
			item.memberId = pDayCaptain.memberId;
			item.teamKey = pDayCaptain.teamKey;
			item.name = pDayCaptain.name;
			item.email = pDayCaptain.email;
			item.mobile = pDayCaptain.mobile;
			item.phone = pDayCaptain.phone;
    		wixData.update("lstTeamDayCaptain", item);
  			return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/teams updateTeam catch err ", err)
			return false;
  		} );
}

export function deleteDayCaptain(pRecId) {
	console.log("Deleting Day Captain", pRecId);
	return wixData.remove("lstTeamDayCaptain", pRecId)
  		.then( (item) => {
			return true;
		})
  		.catch( (err) => {
			console.log("/Public/objects/team deleteDayCaptain catch fail ", err);
			return false;
  		} );
}

export function listTeamsForDayCaptain(pMemberId) {
	return wixData.query("lstTeamDayCaptain")
		.eq("memberId", pMemberId)
		.find()
		.then( (results) => {
			if (results.items.length ===  0) {
				return [];
			} else {
				return results.items;
			//	console.log("Type = " + wRole);
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team listTeamsForDayCaptain catch " + error);
			return [];
        });
}

export async  function getTeamSquadDetail(pteamId, pMemberId) {
	return wixData.query("lstTeamSquad")
		.eq("teamId", pteamId)
		.eq("memberId", pMemberId)
		.ascending("name")
		.find()
		.then( (results) => {
			if (results.totalCount === 0) {
				return false;
			} else if(results.totalCount > 1) {
				return false;
			} else {
				return results.items[0];
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team getTeamSquadDetail catch " + error);
			return false;
        });
}

export function loadEventTeamPlayerByTeamKey(pTeamKey) {
	return wixData.query("lstTeamPlayer")
		.eq("teamKey", pTeamKey)
		.limit(500)
		.find()
		.then( (results) => {
			if (results.totalCount === 0) {
				return [];
			} else  if (results.totalCount > 0) {
				return results.items;
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team lodEventTeamPlayers` catch " + error);
			return false;
        });

}

export function loadTeamPlayerByTeamKeyByMemberId(pTeamKey, pMemberId) {
	return wixData.query("lstTeamPlayer")
		.eq("teamKey", pTeamKey)
		.eq("memberId", pMemberId)
		.find()
		.then( (results) => {
			if (results.totalCount === 0) {
				return [];
			} else  if (results.totalCount > 0) {
				return results.items;
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team lodEventTeamPlayers` catch " + error);
			return false;
        });

}

export async function getTeamPlayer(pEventId, pMemberId) {
	return wixData.query("lstTeamPlayer")
		.eq("eventId", pEventId)
		.eq("playerId", pMemberId)
		.find()
		.then( (results) => {
			if (results.totalCount === 0) {
				return false;
			} else  if (results.totalCount > 1) {
				return false;
			} else { 
				return results.items[0];
			}
		})
        .catch( (error) => {
            console.log("/public/objects/team getTeamPlayer` catch " + error);
			return false;
        });

}

export function bulkSaveTeamSquad(pData) {

	return wixData.bulkSave("lstTeamSquad", pData)
  		.then( (results) => {
			return results;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/booking bulkSaveTeamSquad Catch " + errorMsg);
			return false;
		});
};


export function bulkDeleteTeamSquad(pIds) {

	return wixData.bulkRemove("lstTeamSquad", pIds)
  		.then( (results) => {
			return results;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/booking bulkDeleteTeamSquad Catch " + errorMsg);
			return false;
		});
};

export function bulkDeleteTeams(pIds) {

	return wixData.bulkRemove("lstLeagueTeams", pIds)
  		.then( (results) => {
			return results;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/booking bulkDeleteTeams Catch " + errorMsg);
			return false;
		});
};

export async function insertTeam(pRec) {
	try {
		// create an item
	const wRec = {
		"teamKey": pRec.teamKey,
		"gender": pRec.gender,
		"league": pRec.league,
		"division": parseInt(pRec.division,10),
		"teamName": pRec.teamName,
		"noMatches": parseInt(pRec.noMatches,10),
		"gameType": pRec.gameType,
		"managerId": pRec.managerId,
		"dayCaptainId": pRec.dayCaptainId,
		"useType": pRec.useType,
		"dress": pRec.dress,
		"duration":  parseFloat(pRec.duration),
		"startTime": pRec.startTime
	}
		let results = await wixData.insert("lstLeagueTeams", wRec);
		if (results) {
			let item = results;
			return item._id;
		} else {
			return false;
		}
	
	} catch (error) {
		console.log("/public/obkects/team Insert TEam TryCatch " + error);
		return false;
	}
}

export function updateTeam(pId, pTeam) {
    return wixData.get("lstLeagueTeams", pId)
  		.then( (item) => {
			item.teamKey = pTeam.teamKey;
			item.gender = pTeam.gender;
			item.league = pTeam.league;
			item.division = parseInt(pTeam.division,10);
			item.teamName = pTeam.teamName;
			item.noMatches = parseInt(pTeam.noMatches,10);
			item.gameType = pTeam.gameType;
			item.managerId = pTeam.managerId;
			item.dayCaptainId = pTeam.dayCaptainId;
			item.useType = pTeam.useType;
			item.dress = pTeam.dress;
			item.duration = parseFloat(pTeam.duration);
			item.startTime = pTeam.startTime;
    		wixData.update("lstLeagueTeams", item);
  			return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/teams updateTeam catch err ", err)
			return false;
  		} );
}

export function updateLstTeamSquad(pId, pSquad) {

    return wixData.get("lstTeamSquad", pId)
  		.then( (item) => {
			item.Squad = pSquad;
    	wixData.update("lstTeamSquad", item);
  		return true;
		} )
  		.catch( (err) => {
			console.log("/public/objects/teams updateLstTeamSquad catch err ", err)
			return false;
  		} );
}

export function deleteTeam(pId) {
	console.log("Deleting team", pId);
	return wixData.remove("lstLeagueTeams", pId)
  		.then( (item) => {
			return true;
		})
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("/public/objects/team deleteTeam fail ", errorMsg);
			return false;
  		} );
}

//===================================================== COMMON UI ROUTINES==============================================
//
export async function loadTeamDropbox(pSource, pTeams) {
	$w('#boxGeneral').expand();
	//console.log("LoadTeamDropbox, pTeams");
	//console.log(pTeams);
	if (pTeams.length === 0) {
		//console.log("LoadTeamDropbox, 0 length");
		if (pSource === "M") { 
			closeExit(2);
		} else { 
			$w('#drpTeams').options = []; 
			$w('#boxdrpTeams').collapse();
			$w('#boxNoTeam').expand();
		}
	} else if (pTeams.length === 1) { 
		//console.log("LoadTeamDropbox, length = 1 ");
		let wSurname = "";			//@@
		let wFirstName = "";		//@@
		let wTeam = pTeams[0];
		let wTeamName = wTeam.teamName.trim();
		let wLeague = wTeam.league.trim();
		let wFunction = 4;
		switch (gRole) { 
			case ROLES.ADMIN:
			case ROLES.MANAGER:
				wFunction = 4;
				break;
			case ROLES.CAPTAIN:
				wFunction = 1;
				break;
			case ROLES.DAY_CAPTAIN:
				//@@
				[wSurname, wFirstName, wTeam.dayCaptainName, wTeam.dayCaptainEmail, wTeam.dayCaptainPhone] = await getName(gUserId);
				wTeam.dayCaptainId = gUserId;
				wFunction = 5;
				break;
			case ROLES.MEMBER:
				wFunction = 2;
				break;
			default:
				wFunction = 4;
				break;
		}
		showTeamMemberBox(pSource, wFunction, wLeague, wTeamName);
		//@@
		[wSurname, wFirstName, wTeam.managerName, wTeam.managerEmail, wTeam.managerPhone] = await getName(wTeam.managerId);
		gTeam = wTeam;
		//console.log("LoadTeamDropBox gTeam");
		//console.log(gTeam);

	
		switch (pSource) { 
			case "S":	//from TeamSquad page 
				await loadTeamSquadRepeaters();
				break;
			case "P":	//from TeamPlayers page
				await loadTeamPlayerRepeaters();
				break;
			case "M":	//from TeamMember page
				await loadTeamMemberRepeaters();
				break;
		}
	} else {
		//console.log("LoadTeamDropbox, length = ", pTeams.length);
		$w('#boxdrpTeams').expand();
		$w('#boxNoTeam').collapse();
		let wOptions = [];
		for (let wItem of pTeams){ 
			let wOption = await formDrpEntry(pSource, wItem);
			if (wOption) { wOptions.push(wOption) };	
		}
		//console.log(", wOptions, drpoptions");
		//console.log(wOptions);
		let wDrpOptions = drpTeamOptions(wOptions, $w('#rgpGender').value);
		//console.log(wDrpOptions);
		let wLine = "";
		switch (gRole) { 
			case ROLES.CAPTAIN:
				wLine = `You are the captain of a number of squads.`;
				break;
			case ROLES.DAY_CAPTAIN:
				wLine = `You are the day captain of a number of squads.`;
				break;
			case ROLES.MEMBER:
				wLine = `There are a number of team squads.`;
				break;
			default:
				wLine = `There are a number of team squads.`;
				break;
		}
		$w('#lblGeneralMsg').text = wLine  + `\nPlease select the team you wish to use:`;
		if (wDrpOptions.length > 0) { 
			$w('#drpTeams').options = []; 
			$w('#drpTeams').options = wDrpOptions;
			$w('#drpTeams').value = wDrpOptions[0].value;////
			$w('#boxdrpTeams').show();
			$w('#boxNoTeam').collapse();
			$w('#boxdrpTeams').expand();
		} else { 
			$w('#drpTeams').options = [];
			$w('#boxNoTeam').expand();
			$w('#boxdrpTeams').collapse();
		}
	}
}

function showTeamMemberBox(pSource, pKey, pLeague, pTeam){
	let wGender = "";
	const wFirstName = $w('#lblFirstName').text;

	switch (gGender) { 
		case "L":
			wGender = "Ladies";
			break;
		case "M":
			wGender = "Men's";
			break;
		default:
			wGender = "Mixed";
	}

	const msg = [
		`${wFirstName}, you are the captain of the ${wGender} ${pTeam} team in the ${pLeague} league`,
		`${wFirstName}, you are a member of the ${wGender} ${pTeam} team in the ${pLeague} league`,
		`This facility is only for use by Managers or Team Captains`,
		`You are working on the ${wGender} ${pTeam} team in the ${pLeague} league`,
		`${wFirstName}, you are a day captain of the ${wGender} ${pTeam} team`
	]
	$w('#lblTeamMemberMsg').text = msg[pKey - 1];
	
	if (pSource === "M") { 
		$w('#btnChangeTeam').hide();
	} else { 
		$w('#btnChangeTeam').show();
	}
	$w('#boxTeamMember').expand();
	$w('#boxGeneral').collapse();
	$w('#cstrpButtons').collapse();
}


async function formDrpEntry(pSource, pItem) { 
	let wRec = await findTeamByKey(pItem.teamKey);
	//console.log("formDrpEntry, ggender, rec", gGender);
	//console.log(wRec);
	if (pSource !== "M") { 
		if (wRec.gender !== gGender ) { return false };
	}
	let wLeague = wRec.leagueKey;
	let wDiv = wRec.division;
	let wTeam = wRec.teamName;
	let wEntry = "";
	if (parseInt(wDiv,10) === 0) { 
		wEntry = `${wLeague} - ${wTeam}`;
	} else { 
		wEntry = `${wLeague} Div ${wDiv} - ${wTeam}`;
	}
	return {"label": wEntry, "value": wRec.teamKey, "gender": wRec.gender}
}

function drpTeamOptions(pOptions, pValue) {
	//console.log("drpTeamOptions", pValue)
	let wTemp;
	if (pValue === "A") {
		wTemp = pOptions
	} else { 
		wTemp = pOptions.filter( item => item.gender === pValue);
	}
	return wTemp;
}

export function closeExit( pKey) { 
	const msg = [
		"I'm sorry, but you must be signed on to access this information",
		"You have not yet been registered with a team. Please contact a team captain to ask to join that team."
	]
	$w('#cstrpSelect').collapse();
	$w('#lblCloseMsg').text = msg[pKey - 1];
	$w('#cstrpNotSignedOn').expand();
	$w('#cstrpButtons').expand();
}

export async function loadTeamSquadRepeaters() {
	$w('#imgWait').show();
	$w('#cstrpSquad').expand();
	await loadTeamSquad();
	$w('#imgWait').hide();

}

export async function loadTeamMemberRepeaters() {
	$w('#imgWait').show();
	let p1 = loadTeamPlayers();
	let p2 = loadTeamMatches();
	Promise.all([p1,p2]).then(async function(values) {
		let wMatches = values[1];
		if (wMatches.length > 0) { 
			let wEventId = (wMatches.length > 0) ? wMatches[1]._id : null;	//first entry is rptr hdr
			$w('#txtEventId').text = (wEventId === null) ? "" : wEventId;
			updateTeamMatches("M");
			let wTeamPlayers = await updateTeamPlayers("M");
			//.then ( wTeamPlayers => { 
			gTeamPlayers = wTeamPlayers;
			refreshTeamPlayers($w('#txtEventId').text);
			$w('#txtLastEventId').text  = $w('#txtEventId').text;
			$w('#cstrpMatches').expand();
			closeWaitImages("LTMR1");
			//})
		} else { 
			closeWaitImages("LTMR2");
		}
	})
}

export async function loadTeamPlayerRepeaters(){
	//console.log("LoadTEamPlayersRepeaters");
	$w('#imgWait').show();
	let p1 = loadTeamPlayers();
	let p2 = loadTeamMatches();
	let p3 = loadTeamSquad();
	Promise.all([p1, p2, p3]).then(function(values) {
		let wMatches = values[1];
		$w('#cstrpMatches').expand();
		if (wMatches.length > 0) { 
			let wEventId = (wMatches.length > 0) ? wMatches[1]._id : null;	//first entry is rptr hdr
			$w('#txtEventId').text = (wEventId === null) ? "" : wEventId;

			updateTeamMatches("P");
			updateTeamSquad($w('#rptSquad').data)
			.then( wTeamSquad => {
				refreshRptSquad(wTeamSquad);
			})
			updateTeamPlayers("P")
			.then ( wTeamPlayers => { 
				gTeamPlayers = wTeamPlayers;
				refreshTeamPlayers($w('#txtEventId').text);
 				$w('#txtLastEventId').text  = $w('#txtEventId').text;
				closeWaitImages("LTPR1");
			})
		} else {
			closeWaitImages("LTPR2");
		}
	})
}

export function getAvailableState(pStatus){
	let wState = "";
	switch (pStatus){ 
		case "Not available":
		case TEAMPLAYER.NOTAVAILABLE:
			wState = "Not available";
			break;
		case "Available":
		case TEAMPLAYER.AVAILABLE:
			wState = "Available";
			break;
		case "Confirmed":
		case TEAMPLAYER.CONFIRMED:
			wState = "Confirmed";
			break;
		case "Played":
		case TEAMPLAYER.PLAYED:
			wState = "Played";
			break;
		default:
			wState = "Unknown";
			break;
	}
	return wState;
}

export async function updateTeamMatches(pSource){

	//console.log("updateTeamMatches");
	if (pSource === "M") { 
		$w('#rptMatches').forEachItem( ($item, itemData, index) => {
			if (index > 0) { 
				let wStatus = TEAMPLAYER.UNKNOWN;
				let wTeamPlayer = IsTeamPlayer(itemData._id, gUserId);
				if (wTeamPlayer) { 
					wStatus = wTeamPlayer.status;
				}
				$item('#txtAvail').text = getAvailableState(wStatus);
			}
		})
	} else { 
		let wNumUnknown = 0;
		let wNumNotAvailable= 0;
		let wNumAvailable = 0;
		let wNumConfirmed = 0;
		let wNumPlayed = 0;
		$w('#rptMatches').forEachItem(async ($item, itemData, index) => {
			if (index > 0) {
				({wNumUnknown, wNumNotAvailable, wNumAvailable, wNumConfirmed, wNumPlayed} = getTeamPlayerStats(itemData._id));

				$item('#txtNumRequested').text = String(wNumUnknown + wNumNotAvailable + wNumAvailable + wNumConfirmed + wNumPlayed);
				$item('#txtNumAvailable').text = String(wNumAvailable + wNumConfirmed + wNumPlayed);
			}				
		})
	}
	//console.log("updateTeamMatches Done 3");
}

export function refreshRptSquad(pIn){
	let wSquad = pIn;
	
	$w('#rptSquad').forEachItem( ($item, itemData, index) => {
		if (index > 0) {
			let wRec = wSquad[index]
			$item('#txtSquadPos').text = String(index);
			$item('#txtSquadPlayer').text  = wRec.name;
			$item('#txtSquadNumPlayed').text  = String(wRec.numPlayed);
			$item('#txtEmailSent').text = (wRec.emailSent) ? "Yes" : "";
		}
	}); // grid repeat
}

export function refreshTeamPlayers(pEventId){
	const rptPlayersFirst = {"_id": gTeam.teamKey + "0", "name": ""};

	let wMatchTeamPlayers = gTeamPlayers.filter( item => item.eventId === pEventId);
	let wSortedPlayers = _.sortBy(wMatchTeamPlayers, ['surname','firstName']);
	if (wSortedPlayers) { 
		const wPlayersSize = wSortedPlayers.length;
		if (wPlayersSize === 0) { 
			$w('#boxPlayersList').collapse();
			$w('#boxNoPlayers').expand()	
			$w('#rptPlayers').data = [];
		} else { 
			$w('#boxPlayersList').expand();
			$w('#boxNoPlayers').collapse();
			wSortedPlayers.unshift(rptPlayersFirst);
			$w('#rptPlayers').data = wSortedPlayers;
		}
	} else { 
		$w('#boxPlayersList').collapse();
		$w('#boxNoPlayers').expand()	
		$w('#rptPlayers').data = [];
	}
}

function closeWaitImages(pSource) { 
	//$w('#imgAutoWait').hide();
	//$w('#imgCommandWait').hide();
	//console.log("Hidden by = ", pSource);
	$w('#imgMatchWait').hide();
	$w('#imgPlayersWait').hide();
	$w('#imgWait').hide();
}


export async function loadTeamMatches(){

	const rptMatchFirst = {"_id": gTeam.teamKey + "0", "month": ""};
	//console.log("Load Team Matches ", gRole, gTeam.teamKey);
	if (!gTeam) {
		//onsole.log("LoadTeamMatches Done 1");
		return []; 
	};
	let wMatchList = [];
	let wMatches = [];
	//$w('#rptMatches').data = [];
	let wTempList = await loadEventsTable(gTeam.teamKey);	//scending start date order
	if (gRole === ROLES.DAY_CAPTAIN) {
		let wTemp = [];
		for (let wRec of wTempList) { 
			let wDayCaptain = await getDayCaptain(wRec.id);
			if (wDayCaptain.memberId === gUserId) {
				wTemp.push(wRec);
			}
		}
		wMatchList = wTemp;
	} else { 
		wMatchList = wTempList;
	}

	if (wMatchList) {
		const wNoMatches = wMatchList.length;
		if (wNoMatches === 0) { 
			$w('#boxMatchList').collapse();
			$w('#boxDayCaptain').collapse();
			$w('#boxNoMatches').expand();
			//console.log("LoadTeamMatches Done 2");
			return [];
		} else { 
			$w('#boxNoMatches').collapse();

			for (let wMatch of wMatchList) {
				let wRink = wMatch.rink;
				let [wNoPerTeam, wNumRequired] = getNumPlayersRequired(wRink);
				let wStatus = TEAMPLAYER.UNKNOWN;	//this will get updated after Promise All kicks in i.e. gTEamPlayers is defined
				let wRec = { 
					"_id":	wMatch.id,
					"eventId": wMatch.id,
					"month": wMatch.month,
					"date": wMatch.date,
					"day": wMatch.day,
					"subject": wMatch.subject,
					"rink": wMatch.rink,
					"venue": wMatch.venue,
					"numRequired": wNumRequired,
					"numRequest": 0,
					"numAvail": 0,
					"avail": wStatus			
				}
				wMatches.push(wRec);
			}
			wMatches.unshift(rptMatchFirst);
			$w('#rptMatches').data = wMatches;
			$w('#boxMatchList').expand();
			$w('#boxDayCaptain').collapse();
			//console.log("wMatc+hes");
			//console.log(wMatches);
			//console.log("LoadTeamMatches Done 3");
			return wMatches;
		}
	} else { 
		$w('#boxMatchList').collapse();
		$w('#boxDayCaptain').collapse();
		$w('#boxNoMatches').expand();
		//console.log("LoadTeamMatches Done 4");
		return [];
	}
}

export async function displayDayCaptain(pCount, pTeam) {
	let wSurname = "";			//@@
	let wFirstName = "";		//@@
	if (pCount  === 1) {
		let wEventId = $w('#txtEventId').text;
		let wDayCaptain = await getDayCaptain(wEventId);
		if (wDayCaptain) {
			//@@
			[wSurname, wFirstName, pTeam.dayCaptainName, pTeam.dayCaptainEmail, pTeam.dayCaptainPhone] = await getName(wDayCaptain.memberId);
			$w('#lblDayCaptain').text = "The Day Caption for this match is " + wDayCaptain.name;
			$w('#btnDayCaptainClear').expand();
			$w('#btnSetDayCaptain').collapse();
		} else {
			//@@
			[wSurname, wFirstName, pTeam.dayCaptainName, pTeam.dayCaptainEmail, pTeam.dayCaptainPhone] = await getName("");
			$w('#lblDayCaptain').text = "A day captain has not been selected";
			$w('#btnDayCaptainClear').collapse();
			$w('#btnSetDayCaptain').expand();
		}
		$w('#boxDayCaptain').expand();
	} else { 
		//@@
		[wSurname, wFirstName, pTeam.dayCaptainName, pTeam.dayCaptainEmail, pTeam.dayCaptainPhone] = await getName("");
		$w('#btnDayCaptainClear').collapse();
		$w('#boxDayCaptain').collapse();
		$w('#btnSetDayCaptain').collapse();
	}
}

export async function getName (pId){
	if (pId === "" || pId === null || pId === undefined) { return [null,null,null,null,null]};
	let wName = null;
	let wEmail = null;
	let wPhone = null;
	let wMember = await findLstMember(pId);
	if (wMember) { 
		wName =  wMember.firstName.trim() + " " + wMember.surname.trim();
		wEmail = wMember.email || null;
		if (wMember.mobilePhone){ 
			wPhone = wMember.mobilePhone || null;
		} else if (wMember.homePhone) {
			wPhone = wMember.homePhone || null;
		}
	}
	//@@
	return [wMember.surname, wMember.firstName, wName, wEmail, wPhone];
}


export function countMatchSelectedItems() {
	let count = 0;
	$w('#rptMatches').forEachItem( ($item) =>  { 
		if ($item('#chkMatchItem').checked) { count++}
	})
	return count;
}

export function getNumPlayersRequired(pRink) {
	let wRinks = parseInt(pRink[0],10);
	let wGameType = pRink.slice(-1);
	let wNumPerTeam = 0;
	switch (wGameType){
		case "S":
			wNumPerTeam = 1;
			break;
		case "D":
		case "P":
			wNumPerTeam = 2;
			break;
		case "T":
			wNumPerTeam = 3;
			break;
		case "X":
		case "R":
		case "F":
			wNumPerTeam = 4;
			break;
	}
	let wNumPlayers = wNumPerTeam * wRinks;
	return [wNumPerTeam, wNumPlayers];
}


export function getTeamPlayerStats(pEventId){
	const countUnknown = (accumulator, item) => {
		if (item.status === TEAMPLAYER.UNKNOWN) {
			accumulator++; 
		}
		return accumulator++; 
	};
	const countNotAvailable = (accumulator, item) => {
		if (item.status === TEAMPLAYER.NOTAVAILABLE) {
			accumulator++; 
		}
		return accumulator++; 
	};
	const countAvailable = (accumulator, item) => {
		if (item.status === TEAMPLAYER.AVAILABLE) {
			accumulator++; 
		}
		return accumulator++; 
	};
	
	const countConfirmed = (accumulator, item) => {
		if (item.status === TEAMPLAYER.CONFIRMED) {
			accumulator++; 
		}
		return accumulator++; 
	};

	const countPlayed = (accumulator, item) => {
		if (item.status === TEAMPLAYER.PLAYED) {
			accumulator++; 
		}
		return accumulator++; 
	};
	let wNumAvailable = 0;
	let wNumNotAvailable = 0;
	let wNumUnknown = 0;
	let wNumConfirmed = 0;
	let wNumPlayed = 0;
	let wPlayersOnly = gTeamPlayers.filter ( item => !item._id.includes(gTeam.teamKey));	//removes headings item
	if (wPlayersOnly.length > 0) {
		let wPlayersForEvent = wPlayersOnly.filter ( item => item.eventId === pEventId);
		if (wPlayersForEvent.length > 0) { 
			wNumUnknown = wPlayersForEvent.reduce(countUnknown, 0);
			wNumNotAvailable = wPlayersForEvent.reduce(countNotAvailable, 0);
			wNumAvailable = wPlayersForEvent.reduce(countAvailable, 0);
			wNumConfirmed = wPlayersForEvent.reduce(countConfirmed, 0);
			wNumPlayed = wPlayersForEvent.reduce(countPlayed, 0);
		}
	}
	return {wNumUnknown, wNumNotAvailable, wNumAvailable, wNumConfirmed, wNumPlayed};

}
export async function loadTeamSquad() {
	//console.log(gTeam);
	const rptSquadFirst = {"_id": gTeam.teamKey + "0", "name": ""};

	if (!gTeam) { return [] }
	//console.log("LoadTEamSquad, wSquadList");
	let wSquadList = [];
	let wSquad = [];
	wSquadList = await getTeamSquad(gTeam._id);	//this is in name ascending order
	//console.log(wSquadList);
	if (wSquadList) {
		const wSquadSize = wSquadList.length;
		if (wSquadSize === 0) { 
			$w('#rptSquad').collapse();
			$w('#boxSquadList').collapse();
			$w('#boxNoSquad').expand()	
			$w('#rptSquad').data = [];
		} else { 
			$w('#rptSquad').expand();
			$w('#boxSquadList').expand();
			$w('#boxNoSquad').collapse();
			for (let wSquadMember of wSquadList) { 
				//let hasM = pTeamPlayers.some( member => member.memberId === wSquadMember.memberId && member.eventId === wEventId); //remove players already added to TeamPlayers
				let wSurname = "";
				let wFirstName = "";
				[wFirstName, wSurname] = splitName(wSquadMember.name);
				let wRec = { 
					"_id": wSquadMember._id,
					"teamId": wSquadMember.teamId,
					"memberId": wSquadMember.memberId,
					"teamKey": wSquadMember.teamKey,
					"name": wSquadMember.name,
					"surname":	wSurname,				//@@
					"firstName": wFirstName,			//@@
					"numPlayed": wSquadMember.numPlayed,
					"emailSent": false,
					"comPref": wSquadMember.comPref,
					"emailAddress": wSquadMember.emailAddress,
					"mobilePhone": wSquadMember.mobilePhone,
					"homePhone": wSquadMember.homePhone
				}
				//console.log("LoadTeamSquad, wSquadMember, hasM", wSquadMember.memberId, hasM);
				//console.log(wSquadMember);
				wSquad.push(wRec);
			}
			let wSortedPlayers = _.sortBy(wSquad, ['surname', 'firstName']);	// ['surname','firstName']

			wSortedPlayers.unshift(rptSquadFirst);
			$w('#rptSquad').data = wSortedPlayers;
		}
	}
	//console.log("LoadTeamSquad Done");
}
//@@
function splitName(pFullName){
	let wFirstName = "";
	let wSurname = "";
	let wBits = pFullName.split(" ");
	wFirstName = wBits[0];
	wSurname = wBits[wBits.length - 1];
	return [wFirstName, wSurname];
}
export async function updateTeamSquad(pTeamSquad){

	let wTeamSquad = pTeamSquad;
	const wFirstRow = wTeamSquad.shift();
	let wEventId = $w('#txtEventId').text;
	const wTeamPlayersPerEvent = gTeamPlayers.filter (item => item.eventId === wEventId);

	for (let wPlayer of wTeamSquad){
		let hasM = wTeamPlayersPerEvent.some( member => (member.memberId === wPlayer.memberId)); //remove players already added to TeamPlayers
		wPlayer.emailSent = hasM;
	}
	wTeamSquad.unshift(wFirstRow);
	return wTeamSquad;
}

export async function loadTeamPlayers() {

	if (!gTeam) { return []};

	//console.log("LoadTEamPlayers ", gTeam.teamKey);
	const rptPlayersFirst = {"_id": gTeam.teamKey + "0", "name": ""};

	let wTeamPlayers = [];
	let wPlayers = await loadEventTeamPlayerByTeamKey(gTeam.teamKey);
	//let wPlayers = await loadTeamPlayerByTeamKeyByMemberId(pTeamKey, pMemberId);
	
	if (wPlayers) { 
		const wPlayersSize = wPlayers.length;
		if (wPlayersSize === 0) { 
			//$w('#boxPlayersList').collapse();
			//$w('#boxNoPlayers').expand()	
			$w('#rptPlayers').data = [];
			wTeamPlayers = [];
		} else { 
			//$w('#boxPlayersList').expand();
			//$w('#boxNoPlayers').collapse();
			let wAvailable = [];
			for (let wPlayer of wPlayers) { 
				//console.log("LoadTEamPlayers, wPlayer");
				//console.log(wPlayer);
				//let wTeamSquadDetail = await getTeamSquadDetail(pTeam._id, wPlayer.playerId);
				//console.log(wTeamSquadDetail);
				let wRec = { 
					_id: wPlayer._id,
					eventId: wPlayer.eventId,
					teamId: gTeam._id,
					memberId: wPlayer.playerId,
					teamKey: gTeam.teamKey,
					//name: wTeamSquadtail.name,
					name: "",
					surname: "",					//@@
					firstName: "",					//@@
					game: wPlayer.game,
					role: wPlayer.role,
					//numPlayed: wTeamSquadDetail.numPlayed,
					numPlayed: 0,
					status: wPlayer.status
				}
				wAvailable.push(wRec);
			}
			wTeamPlayers = [...wAvailable];
			
			//let wEventId = pEventId;
			//if (pEventId === null) { 
			//	wEventId = wTeamPlayers[0].eventId;
		//	}
			//console.log("Update text field, ", wEventId);
			//$w('#txtEventId').text = "";
			
			//let wMatchTeamPlayers = wAvailable.filter( item => item.eventId === wEventId);
			//wMatchTeamPlayers.unshift(rptPlayersFirst);

			//$w('#rptPlayers').data = wMatchTeamPlayers;
		};
	}
	//console.log("LoadTeamPlayers Done");
	gTeamPlayers = wTeamPlayers;
}


export function IsTeamPlayer (pEventId, pMemberId) {
	let wPlayersPerEvent = gTeamPlayers.filter( item => item.eventId === pEventId);
	let wRec = false;
	if (wPlayersPerEvent) {
		if (wPlayersPerEvent.length > 0) {
			let wPlayerPerEvent = wPlayersPerEvent.filter ( item => item.memberId === pMemberId);
			if (wPlayerPerEvent) { 
				if (wPlayerPerEvent.length > 0) {	
					wRec = wPlayerPerEvent[0];
				}
			}
		}
	}
	return wRec;
}

export async function updateTeamPlayers(pSource){

	let wTeamPlayers = gTeamPlayers;
	if (pSource === "M") { 
		for (let wPlayer of wTeamPlayers){
			let [wSurname, wFirstName, wName, wEmail, wPhone] = await getName(wPlayer.memberId);	//@@
			wPlayer.name = wName;
			wPlayer.surname = wSurname;						//@@
			wPlayer.firstName = wFirstName;					//@@
		}
	} else { 
		let wTeamSquad = $w('#rptSquad').data;
		wTeamSquad.shift();

		for (let wPlayer of wTeamPlayers){
			let wSurname = "";			//@@
			let wFirstName = "";		//@@
			let wPlayerInSquads = wTeamSquad.filter( item => item.memberId === wPlayer.memberId);
			let wPlayerInSquad = wPlayerInSquads[0];
			if (wPlayerInSquad) { 
				let [wFirstName, wSurname] = splitName(wPlayerInSquad.name);	//@@
				wPlayer.name = wPlayerInSquad.name;
				wPlayer.surname = wSurname;			//@@
				wPlayer.firstName = wFirstName;		//@@
				wPlayer.numPlayed = wPlayerInSquad.numPlayed;
			} else {
				console.log("/public/objects/team updateTeamPlayers Cant find in squad", wPlayer.memberId);
			}
		}
	}
	return wTeamPlayers;
}
