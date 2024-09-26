import wixData 						from 'wix-data';

import { toJulian } 				from 'public/fixtures';
//import { DateToOrdinal }			from 'backend/backEvents.jsw';
import { parseDateTimeFromInput }	from 'public/fixtures';
import { EVENT_TYPE, LEAGUE, MIX }	from 'public/objects/event.js';
import { PLAYED_AT, EVENT_GAME_TYPE }		from 'public/objects/event.js';
import { USE_TYPE }							from 'public/objects/event.js';
import { findTeamByKey }			from 'backend/backTeam.jsw';
import { getNewLeagueForTeam }			from 'backend/backTeam.jsw';
import { getLeagueTeamByTeamKey }	from 'backend/backTeam.jsw';
import { durationToString }	from 'backend/backBookings.jsw';

//------------------------------------------------------------------------------------------------------
//
//  BOOKING OBJECT
//
//  Desc:   The "lstBookings" table holds a record for each booking
//
//  Usage:  1) page
//          2) page
//          3) page
//          4) page
//          5) page
//          6) 
//------------------------------------------------------------------------------------------------------

/**
 * Enum for Booking object status values
 * @readonly
 * @enum {String}
 */

export const BOOKING = Object.freeze({
  NEW:		"N",
  READY:	"R",
  OPEN:		"O",
  COMPLETED:"P",
  MOVED:	"M",
  DELETED:	"D"
});

export const PLAYER = Object.freeze({
  PLAYERA:	"A",
  PLAYERB:	"B"
});


//================================================= Bookings ============================================================
//


export async function loadBookings () {
	let res = await wixData.query('lstBookings')
		.hasSome("status", ["O"])
		.descending("_createdDate")
		.find();
	let dlist = res.items.map(item => {
		return {
			label: item.a,
			value: item.a
		}
	});
	return dlist;
}

/**
 * Add Club Comp
 */
export function bulkSaveBookings(pData) {

	let options = {
  		"consistentRead": true
	};

	return wixData.bulkSave("lstBookings", pData, options)
  		.then( (results) => {
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/booking bulkSaveBookings Catch " + errorMsg);
			return false;
		});
}

export function bulkInsertBookings(pData) {

	let options = {
  		"consistentRead": true
	};

	return wixData.bulkInsert("lstBookings", pData, options)
  		.then( (results) => {
			return [true, results];
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/booking bulkInsertBookings Catch " + errorMsg);
			return [false, null];
		});
}
/**
 * deprecated
 */
export function bulkUpdateClubCompBookings(pData) {

	return wixData.bulkUpdate("lstBookings", pData)
  		.then( (results) => {
			//console.log("Bookings result");
			//console.log(results);
			return true;
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("/public/objects/booking bulkUpdateClubCompBookings Catch " + errorMsg);
			return false;
		});
};


//------------------------------------------------------------------------------------------------------
//
//	Function:	getBooking	
//
//  Inputs:		pBookingId	strng	ID of the required Booking
//	Output:		item		object	Booking record
//				false		Boolean	not found
//
//------------------------------------------------------------------------------------------------------
export async function getBooking(pBookingId) {

	const results = await wixData.query("lstBookings")
		.eq("_id", pBookingId)
		.eq("status", "O")
		.find();
	if (results.items.length === 0) {
		return false;
	} else {
		return results.items[0];
		//	console.log("Type = " + wRole);
	}
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	getBooking	
//
//  Inputs:		pBookingId	strng	ID of the required Booking
//	Output:		item		object	Booking record
//				false		Boolean	not found
//
//------------------------------------------------------------------------------------------------------
export async function getBookingsByKey(pKey) {
	const results = await wixData.query("lstBookings")
		.eq("resourceKey", pKey)
		.eq("status", "O")
		.find();
	if (results.items.length === 0) {
		return false;
	} else {
		return results.items;
	}
}

export async function getBookingsForEvent(pEventId) {
	const results = await wixData.query("lstBookings")
		.eq("eventId", pEventId)
		.find();
	if (results.items.length === 0) {
		return [];
	} else {
		return results.items;
	}
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
export async function getAllBookingsWithPerson(pId) {

	let today = new Date();
	today.setDate(today.getDate() - 1);
	today.setHours(-1, 59, 59);

	const results = await wixData.query("lstBookings") //TODO add or to include playerAId and playerBId
		.hasSome("status", ["N", "R", "O"])
		.ge("dateRequired", today)
		.eq("playerAId", pId)
		.or(
			wixData.query("lstBookings")
			.hasSome("status", ["N", "R", "O"])
			.ge("dateRequired", today)
			.eq("playerBId", pId)
		)
		.ascending("dateRequired")
		.find();
	if (results.items.length !== 0) {
		return results.items;
	} else {
		return false;
	}
}

export async function getAllCompBookingsWithPerson(pCompRef , pUserId) {

	let today = new Date();
	today.setDate(today.getDate() - 1);
	today.setHours(-1, 59, 59);

	const results = await wixData.query("lstBookings") //TODO add or to include playerAId and playerBId
		.eq("compRef", pCompRef)
		.hasSome("status", ["N", "R", "O"])
		.ge("dateRequired", today)
		.eq("playerAId", pUserId)
		.or(
			wixData.query("lstBookings")
			.eq("compRef", pCompRef)
			.hasSome("status", ["N", "R", "O"])
			.ge("dateRequired", today)
			.eq("playerBId", pUserId)
		)
		.ascending("dateRequired")
		.ascending("matchey")
		.find();
	if (results.items.length !== 0) {
		return results.items;
	} else {
		return false;
	}
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
export function getClubCompBookingByCompKey(pCompRef, pDivision, pMatchKey) {

	return wixData.query("lstBookings")
		.eq("compRef", pCompRef)
		.eq("usage", pDivision)
		.eq("status", BOOKING.OPEN)
		.eq("matchKey", pMatchKey)
		.ascending("dateRequired")
		.find()
		.then ( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items[0];
			}
		})
		.catch ( (err) => {
			console.log("/public/objects/booking getClubCompBookingByCompKey catch ", err);
		});
}
//catch ( err ) {
//	console.log("pubic/objects/booking getClubCompBookingByCompKey try catch ", err);
//}}

export function getCompBookings(pYear, pCompRef) {

	return wixData.query("lstBookings")
		.eq("compRef", pCompRef)
		.eq("requiredYear", pYear)
		.hasSome("status", [BOOKING.NEW, BOOKING.READY, BOOKING.OPEN, BOOKING.COMPLETED])
		.limit(1000)
		.ascending("dateRequired")
		.ascending("matchKey")
		.find()
		.then ( (results) => {
			if (results.items.length === 0) {
				return false;
			} else {
				return results.items;
			}
		})
		.catch ( (err) => {
			console.log("/public/objects/booking getCompBookings catch ", err);
		});
}


export async function getClubCompBookingsForPerson(pComp, pDivision, pStatus, pId) {

	const results = await wixData.query("lstBookings")
		.eq("compRef", pComp)
		.eq("usage", pDivision)
		.eq("status", pStatus)
		.eq("playerAId", pId)
		.or(
			wixData.query("lstBookings")
				.eq("compRef", pComp)
				.eq("usage", pDivision)
				.eq("status", pStatus)
				.eq("playerBId", pId)
		)
		.ascending("dateRequired")
		.find();
	if (results.items.length === 0) {
		return false;
	} else {
		return results.items;
		//	console.log("Type = " + wRole);
	}
}

//THIS IS NOT USED ANYWHERE> DEPRECATED TO CLUBCOMP>JS
//------------------------------------------------------------------------------------------------------
export async function getNewDivisionRoundBookings(pCompRef, pStage, pDiv, pRound) {

	let wFilter = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") 
				+ "R" + String(pRound - 1).padStart(2,"0");
	//console.log(wFilter);
	return wixData.query("lstBookings")		//TODO think about status M & newKey
		.eq("status", "N")
		.eq("compRef", pCompRef)
		.startsWith("matchKey", wFilter)	
		//.or(
		//	wixData.query("lstBookings")
		//	.eq("status", "O")
		//	.eq("compRef", pCompRef)
	//		.startsWith("matchKey", wFilter)
	//	)
		.ascending("matchKey")					//ascending match order
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return  results.items;
			} else {
				console.log("/public/objects/booking no new division round bookings, compref,stage,div,round ", pCompRef, pStage, pDiv, pRound);
				return false;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getNewDivisionRoundBookings catch ", err);
			return false;
		})
}


/**
 * depecated
 */
//------------------------------------------------------------------------------------------------------
export async function getActiveDivisionRoundBookings2(pCompRef, pStage, pDiv, pRound) {
	let wMatchKey = "S" + String(pStage).padStart(2,"0") + "D" + String(pDiv).padStart(2,"0") 
				+ "R" + String(pRound - 1).padStart(2,"0");
	//console.log("GetActiveDivRoundBookings: ", wFilter);
	return wixData.query("lstBookings")		//TODO think about status M & newKey
		.eq("status", "O")
		.eq("compRef", pCompRef)
		.startsWith("matchKey", wMatchKey)	
		.or(
			wixData.query("lstBookings")
				.eq("status", "P")
				.eq("compRef", pCompRef)
				.startsWith("matchKey", wMatchKey)	
		)
		.ascending("matchKey")					//ascending match order
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return  results.items;
			} else {
				return false;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getActiveDivisionRoundBookings catch ", err);
			return false;
		})
}

export async function getAllNewStageBookings2(pCompRef, pStage) {

	let wKey = "S" + String(pStage-1).padStart(2,"0");
	return wixData.query("lstBookings")	
		.eq("status", "N")
		.eq("compRef", pCompRef)
		.startsWith("matchKey", wKey)	
		//.or(
		//	wixData.query("lstBookings")
		//		.eq("status", "V")
		//		.eq("compRef", pCompRef)
		//		.startsWith("matchKey", wKey)	
		//)
		.ascending("matchKey")
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return results.items;
			} else {
				return false;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getAllNewStageBookings catch ", err);
			return false;
		})
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
export async function getAllActiveDivisionBookings(pComp, pDivision) {

	return wixData.query("lstBookings")		//TODO think about status M & newKey
		.eq("status", "O")
		.eq("compRef", pComp)
		.eq("usage", pDivision)	
		.or(
			wixData.query("lstBookings")
				.eq("status", "P")
				.eq("compRef", pComp)
				.eq("usage", pDivision)	
		)
		.ascending("dateRequired")
		.limit(300)
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return results.items;
			} else {
				return false;
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getAllActiveDivisionBookings catch ", err);
			return false;
		})
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
export async function getBookingsForDate(pDate) {
	let endDate = new Date(pDate);
	endDate.setDate(pDate.getDate() + 1);
	pDate.setHours(-1, 59, 59);
	endDate.setHours(-1, 59, 59);

	return wixData.query("lstBookings")
		.eq("status", "O")
		.ge("dateRequired", pDate)
		.lt("dateRequired", endDate)
		.or (
			wixData.query("lstBookings")
				.eq("status", "P")
				.ge("dateRequired", pDate)
				.lt("dateRequired", endDate)
		)
		.ascending("rink")
		.ascending("slotId")				//TODO consider effect of limit(1)
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return results.items;
			} else {
				return [];
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getBookingsForDate catch fail ", err);
			return [];
		})
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
export async function getBookingsForJulianDate(pYear, pJDate) {

	try {
		return wixData.query("lstBookings")
			.hasSome("status",["N","O","P", "R"])
			.eq("requiredYear", pYear)
			.eq("requiredJDate", pJDate)
			.limit(1000)
			.ascending("slotId")				//TODO consider effect of limit(1)
			.ascending("rink")
			.find()
			.then( (results) => {
				if (results.items.length !== 0) {
					return results.items;
				} else {
					return [];
				}
			})
			.catch( (err) => {
				console.log("/public/objects/booking getBookingsForJulianDate catch fail ", err);
				return [];
			})
	}
	catch (error) {
		console.log("/public/objects/booking getBookingsForJulianDate try catch fail ", error);
		return [];
	}
}


export async function getAllBookingsForJulianDate(pYear, pJDate) {

	return wixData.query("lstBookings")
		.hasSome("status",["N","O","P","R"])
		.eq("requiredYear", pYear)
		.eq("requiredJDate", pJDate)
		.ascending("rink")
		.ascending("slotId")			
		.find()
		.then( (results) => {
			if (results.items.length !== 0) {
				return results.items;
			} else {
				return [];
			}
		})
		.catch( (err) => {
			console.log("/public/objects/booking getAllBookingsForJulianDate catch fail ", err);
			return [];
		})
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
export async function getBookingsCountForDate (pJDate) {

	return wixData.query("lstBookings")
		.eq("status", "O")
		.startsWith("resourceKey", pJDate)
		.or (
			wixData.query("lstBookings")
				.eq("status", "P")
				.startsWith("resourceKey", pJDate)
		)
		.count()
		.then( (num) => {
			return num;
		})
		.catch( (err) => {
			console.log("/public/objects/booking getBookingsCountForDate catch fail ", err);
			return 0;
		})
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
export async function getBookingsCount() {

	const filter1 = wixData.filter().hasSome("status",["N","O","P"]);
	const filter2 = wixData.filter().eq("isBye","N");
	const filter = filter1.and(filter2);

	return wixData.aggregate("lstBookings")
		.limit(400)
		.filter(filter)
		.ascending("requiredYear", "requiredJDate")
		.group("requiredYear", "requiredJDate")
		.count()
		.run()
		.then ( (results) => {
			return results.items;
		})
}

/**
 * Summary      This function writes a booking record to the database
 *
 * @function
 * @async
 * @param {Object} pRec - The booking record to be inserted.
 * @param {Date} pRec.dateRequired - The required date for the booking.
 * @param {string} pRec.timeRequired - The required time for the booking.
 * @param {string} pRec.duration - The requiredduration of the booking.
 * @param {number} pRec.rink - The rink number for the booking.
 * @param {number} pRec.rangeId - The range ID for the booking.
 * @param {number} pRec.slotId - The slot ID for the booking.
 * @param {string} pRec.compRef - The competition reference for the booking.
 * @param {string} pRec.compTitle - The competition title for the booking.
 * @param {string} pRec.status - The status of the booking.
 * @param {string} pRec.usage - The usage type for the booking.
 * @param {number} pRec.noPlayers - The number of players for the booking.
 * @param {string} pRec.bookerId - The ID of the person making the booking.
 * @param {string} pRec.playerAId - The ID of player A.
 * @param {string} pRec.playerBId - The ID of player B.
 * @param {Date} pRec.dateBooked - The date when the booking was made.
 * @param {string} pRec.matchKey - The key associated with the match.
 * @param {number} pRec.round - The round number for the booking.
 * @param {string} pRec.hasChildren - A marker to indicate whether this booking has any children. May be Y or N
 * @param {string} pRec.parentId - The id of the booking that owns this child booking.
 * 
 * @returns {Promise<[boolean, { id: string, resourceKey: string }]>} A Promise that resolves to an array.
 *   - The first element is a boolean indicating if the operation was successful.
 *   - The second element is an object with details about the inserted booking.
 *     - `id` (string): The ID of the inserted booking.
 *     - `resourceKey` (string): The resource key generated for the booking.
 * 
 * @throws {Error} If an error occurs during the insertion process.
 *
 // */

export async function insertBooking(pRec) {
	const wResult = {
		"id": "",
		"resourceKey": ""
	}

	try {
		// create an item
		const toInsert = {
			"dateRequired": pRec.dateRequired,
			"timeRequired": pRec.timeRequired,
			"duration": pRec.duration,
			"requiredYear": 0,
			"requiredMonth": 0,
			"requiredJDate": 0,
			"resourceKey": "",
			"rink": pRec.rink,
			"rangeId": pRec.rangeId,
			"slotId": pRec.slotId,
			"compRef": pRec.compRef,
			"compTitle": pRec.compTitle,
			"status": pRec.status,
			"isBye": "N",
			"usage": pRec.usage,
			"noPlayers": parseInt(pRec.noPlayers,10),
			"bookerId": pRec.bookerId,
			"playerAId": pRec.playerAId,
			"playerBId": pRec.playerBId,
			"dateBooked": pRec.dateBooked,
			"matchKey": pRec.matchKey,
			"scoreA": 0,
			"scoreB": 0,
			"round": pRec.round,
			"newKey": null,
			"eventId": null,
			"hasChildren": "N",
			"parentId": ""
		};
		//form resourceKey;
		let w_key = toJulian(pRec.dateRequired) + "S" + String(pRec.slotId).padStart(2,"0")
					 + "R" + String(pRec.rink).padStart(2,"0");
		// add the item to the collection
		toInsert.requiredYear = pRec.dateRequired.getFullYear();
		toInsert.requiredMonth = pRec.dateRequired.getMonth();
		toInsert.requiredJDate = DateToOrdinal(pRec.dateRequired);
		toInsert.resourceKey = w_key;
		wResult.resourceKey = w_key;
		let results = await wixData.insert("lstBookings", toInsert);
		if (results) {
			let item = results;
			wResult.id = item._id;
			return [true, wResult];
		} else {
			return [false, null];
		}
	
	} catch (error) {
		console.log("/public/objects/booking insertBooking TryCatch " + error);
		return [false, null];
	}
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
export async function updateBookingStatus(pBookingId, pStatus, pNewKey) {
	// add the item to the collection
	return wixData.get("lstBookings", pBookingId)
		.then((item) => {
			item.status = pStatus;
			item.newKey = pNewKey;
			wixData.update("lstBookings", item);
			return true;
		})
		.catch((err) => {
			let errorMsg = err;
			return false;
		});
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
export async function updateBooking(p_id, pRec) {
	//console.log("updateBookings");
	//console.log(p_dateRequired, p_timeRequired);
	return wixData.get("lstBookings", p_id)
		.then((item) => {
			item.dateRequired = p_dateRequired;
			item.timeRequired = p_timeRequired;
			item.duration = p_duration;
			item.noPlayers = parseInt(p_noPlayers,10);
			item.usage = p_usage;
			item.round = p_round;
			item.bookerId = p_bookerId;
			item.playerAId = p_playerAId;
			item.playerBId = p_playerBId;
			wixData.update("lstBookings", item);
			return true;
		})
		.catch((err) => {
			let errorMsg = err;
			console.log("/public/objects/booking Update Booking err " + errorMsg + "[ " + p_id);
			return false;
		});
}

export async function updateCompBooking(pId, pBookerId,  pDateRequired, pTimeRequired, pDuration, pSlotId, pRangeId, pRink) {
	//form resourceKey;
	let wResourceKey = toJulian(pDateRequired) + "S" + String(pSlotId).padStart(2,"0")
					+ "R" + String(pRink).padStart(2,"0");
	// add the item to the collection
	let wRequiredYear = pDateRequired.getFullYear();
	let wRequiredMonth = pDateRequired.getMonth();
	let wRequiredJDate = DateToOrdinal(pDateRequired);

	return wixData.get("lstBookings", pId)
		.then((item) => {
			item.bookerId = pBookerId;
			item.dateRequired = pDateRequired;
			item.timeRequired = pTimeRequired;
			item.duration = pDuration;
			item.requiredYear = wRequiredYear;
			item.requiredMonth = wRequiredMonth;
			item.requiredJDate = wRequiredJDate;
			item.resourceKey = wResourceKey;
			item.rink = pRink;
			item.rangeId = pRangeId;
			item.slotId = pSlotId;
			item.status = BOOKING.OPEN;
			wixData.update("lstBookings", item);
			return true;
		})
		.catch((err) => {
			let errorMsg = err;
			console.log("/public/objects/booking Update CompBooking err " + errorMsg + "[ " + pId);
			return false;
		});
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
export async function updateBookingPlayer(pId, pAorB, pPlayerId) {
	try {
		//console.log("Booking updateBookingPlayer", pAorB, pPlayerId);
		let item = await wixData.get("lstBookings", pId);
		if (item) {
			let wA = item.playerAId;
			let wB = item.playerBId;
			if (pAorB === PLAYER.PLAYERA){
				//console.log(pId, "Update player A", pPlayerId);
				item.playerAId = pPlayerId;
				item.playerBId = wB;
			} else {
				//console.log(pId, "Update player B", pPlayerId);
				item.playerAId = wA;
				item.playerBId = pPlayerId;
			}
			await wixData.update("lstBookings", item);
			return true;
		} else {
			console.log("/public/objects/booking UpdateBookingPlayer catch " + item + "[ " + pId + "]");
			return false;
		}
	}
	catch ( err ) {
		console.log("/pubic/objects/booking updateBookingPlayer try catch ", err);
	}
}


export async function updateBookingPlayer_old(p_id, p_A_or_B, p_player) {

	return wixData.get("lstBookings", p_id)
		.then((item) => {
			if (p_A_or_B === PLAYER.PLAYERA){
				item.playerAId = p_player;
			} else {
				item.playerBId = p_player;
			}
			wixData.update("lstBookings", item);
			return true;
		})
		.catch((err) => {
			let errorMsg = err;
			console.log("/public/objects/booking Update Booking Player  err " + errorMsg + "[ " + p_id);
			return false;
		});
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
export async function updateBookingResourceKey(p_id, pKey) {

	return wixData.get("lstBookings", p_id)
		.then((item) => {
			item.resourceKey = pKey;
			wixData.update("lstBookings", item);
			return true;
		})
		.catch((err) => {
			let errorMsg = err;
			console.log("/public/objects/booking Update Booking err " + errorMsg);
			return false;
		});
}

//================================================= Time Slots and Rinks===========================================================
//
/**
 * Summary:	Get Rinks and Slots details for a specified day
 * 
 * Description:	Retrieves available rinks, start time, time slots range, and start/end slots for a given date, start time, and duration.
 * 
 * @async
 * @function
 * @param {Date} pDate - The date for which to retrieve rinks and slots.
 * @param {string} pStart - The start time in format 'HH:mm' (24-hour format).
 * @param {number | string} pDuration - The duration of the booking either in form "hh:mm" or as a number.
 * @returns {Promise<Array>} A promise that resolves to an array containing the following elements:
 * - {number} wRinksFree - The number of available rinks.
 * - {number} wNoSlots - The number of slots availablethat day
 * - {string} wStartRink - The starting rink for the booking.
 * - {number} wSlotRange - An array representing the range of time slots available.
 * - {string} wFromSlot - The starting time slot index.
 * - {string} wToSlot - The ending time slot index.
 */
export async function getRinksAndSlots(pDate, pStart, pDuration) {
    let wYear = pDate.getFullYear();
    let wJDate = DateToOrdinal(pDate);
    let [wSlotRange, wNoSlots] = await getSlotsForDay(wJDate);
    let wFromSlot = String(await getStartSlot(pStart) + 1);
    let wRes = await parseDateTimeFromInput(pDate, pStart, pDuration);
    let wEndTime = wRes.end.strTime;
    let wStartTime = pStart.substr(0, 5);
    let wToSlot = String(await getEndSlot(wEndTime) + 1);
    let wStartSlot = parseInt(wFromSlot, 10);
    let [wRinksFree, wStartRink] = await getNoFreeRinks(wYear, wJDate, wSlotRange, wStartSlot); // this takes current bookings into account
    return [wRinksFree, wNoSlots, wStartRink, wSlotRange, wFromSlot, wToSlot];
}

export let w_time_slots = [
	{"_id": "0", "start": "10:00", "end": "11:30", "txt": "10:00\nto\n11:30"},
	{"_id": "1", "start": "11:30", "end": "13:00", "txt": "11:30\nto\n13:00"},
	{"_id": "2", "start": "14:00", "end": "15:30", "txt": "14:00\nto\n15:30"},
	{"_id": "3", "start": "15:30", "end": "17:00", "txt": "15:30\nto\n17:00"},
	{"_id": "4", "start": "18:00", "end": "21:00", "txt": "18:00\nto\n21:00"},
];

export let w_slot_range = 1;
export let no_slots = 5;
export let no_rinks = 3;
export let gRinksArray = [];

export async function initialiseRinksArray() {
	let res = await getSettingsRinkArray();
	if (res) {
		gRinksArray = res;
		return true;
	} else {
		gRinksArray = [];
		return false;
	}
}

export async function getCurrentTimeSlots() {

    const results = await wixData.query("lstSlotRanges")
        .eq("status", "O")
        .find();
    if (results.items.length ===  0) {
        return [];
    }
    let wData = results.items[0];
    let w_range_id = wData['rangeId']
    const res = await wixData.query("lstSlots")
        .eq("rangeId", w_range_id)
        .ascending("slotId")
        .find();
    if (res.items.length ===  0) {
        return [];
    } else {
		let dlist = res.items.map(item => {
			return {
				_id: item._id,
                slotId: item.slotId,
				timeFrom: item.timeFrom,
                timeTo: item.timeTo
			}});
		return dlist;
    }
}
export async function getSettingsRinkArray () {
  	try {
		const results = await wixData.query("lstSettings")
    		.eq("title", "RS1")
    		.find();
		if (results.items.length ===  0) {
			console.log("/public/objects/booking getSettingRinkArray Zero length");
			console.log(results);
			return false;
		} else {
			let item = results.items[0];
			return item.rinkArray;
		}
	}
	catch (error) {
		console.log("/public/objects/booking getSettingRinkArray TryCatch " + error);
		return false;
	}
}

export async function getSettingsSlotArray () {
  	try {
		const results = await wixData.query("lstSettings")
    		.eq("title", "RS1")
    		.find();
		if (results.items.length ===  0) {
			console.log("/public/objects/boooking getSettingSlotArray zero length");
			return false;
		} else {
			let item = results.items[0];
			return item.slotArray;
		}
	}
	catch (error) {
		console.log("/public/objects/boooking getSettingSlotArray TryCatch " + error);
		return false;
	}
}

export function getRinksForDay(pJDate){
	if (gRinksArray.length === 0){
		console.log("/public/objects/boooking getRinksForDay zero length gRinksArray for day " + String(pJDate));
		return 0;
	} else {
		let wNoRinks = gRinksArray[pJDate -1];
		//console.log("GetRinksForDay: Day, rinks", pJDate, wNoRinks);
		return wNoRinks;
	}
}

export function getSlotsForDay(pYear, pJDate){

let w_time_slots_1 = [
	{"_id": "0", "start": "10:00", "end": "11:30", "txt": "10:00\nto\n11:30"},
	{"_id": "1", "start": "11:30", "end": "13:00", "txt": "11:30\nto\n13:00"},
	{"_id": "2", "start": "14:00", "end": "15:30", "txt": "14:00\nto\n15:30"},
	{"_id": "3", "start": "15:30", "end": "17:00", "txt": "15:30\nto\n17:00"},
	{"_id": "4", "start": "18:00", "end": "21:00", "txt": "18:00\nto\n21:00"},
];

let w_time_slots_2 = [
	{"_id": "0", "start": "10:00", "end": "11:30", "txt": "10:00\nto\n11:30"},
	{"_id": "1", "start": "11:30", "end": "13:00", "txt": "11:30\nto\n13:00"},
	{"_id": "2", "start": "14:15", "end": "14:45", "txt": "14:15\nto\n14:45"},
	{"_id": "3", "start": "14:45", "end": "15:15", "txt": "14:45\nto\n15:15"},
	{"_id": "4", "start": "15:30", "end": "16:00", "txt": "15:30\nto\n16:00"},
	{"_id": "5", "start": "16:00", "end": "16:30", "txt": "16:00\nto\n16:30"},
	{"_id": "6", "start": "16:45", "end": "17:15", "txt": "16:45\nto\n17:15"},
	{"_id": "7", "start": "18:00", "end": "21:00", "txt": "18:00\nto\n21:00"},
];

	if (pYear === 2021) {
		if (pJDate === 128 || pJDate === 142) { 
			w_time_slots = w_time_slots_2;
			w_slot_range = 2;
			return [2, 8];
		}
	}
	w_time_slots = w_time_slots_1;
	w_slot_range = 1;
	return [1, 5];
}

export function getSlotString(pIn, pFormat = false) {
	if (pIn < 0 || pIn > no_slots -1) {return "Error"};
	let wSlotString = w_time_slots[String(pIn)].txt;
	if (pFormat) {
		return wSlotString.replace(/\n/g, " ");
	}
	return wSlotString;
}

export function getTimeSlotStart(pSlot){
	let wSlotStart = w_time_slots[String(pSlot-1)].start;
	let wSlotEnd = w_time_slots[String(pSlot-1)].end;
	let wStartBits = wSlotStart.split(":");
	let wHours = parseInt(wStartBits[0],10);
	let wMins = parseInt(wStartBits[1],10);
	return [wHours,wMins, wSlotStart, wSlotEnd];
}

export function getStartSlot(pStartTime){
	let idx = 0;
	while (idx < no_slots) {
		let wSlot = w_time_slots[idx];
		let wSlotEnd = wSlot.end;
		if (pStartTime < wSlotEnd) {
			return idx;
		}
		idx++;
	}
	return idx - 1;
}

export function getEndSlot(pEndTime){
	let idx = 0;
	let wEndTime = pEndTime.substring(0,5);
	while (idx < no_slots -1) {
		let wSlot = w_time_slots[idx];
		let wSlotEnd = wSlot.end;
		//console.log("idx, wEndTime, slotEnd", idx, wEndTime, wSlotEnd), wEndTime <= wSlotEnd;
		if (wEndTime <= wSlotEnd) {
			//console.log("return 1 ", idx);
			return idx;
		} else {
			let wSlotStart = w_time_slots[idx+1].start;
			//console.log("idx, wEndTime, slotEnd", idx, wEndTime, wSlotStart, pEndTime <= wSlotStart);
			if (wEndTime <= wSlotStart) {
			//	console.log("return 2 ", idx);
				return idx;
			}
		}
		idx++;
	};
	//console.log("end loop ", idx);
	return idx;
}

/**
 * Summary	Retrieves the number of rinks that are free for a given slot/rangeId on a specified day.
 * 
 * @function
 * @param {number} pYear - The year.
 * @param {number} pJDate - The Julian date.
 * @param {number} pRangeId - The range ID.
 * @param {number} pSlot - The slot.
 * 
 * @returns {Promise<[number, number]>} A promise resolving to an array containing
 * 	- {number} - noRinks - no of rinks free
 *	- {number} - startRink - the first availablerink number.
 */
export async function getNoFreeRinks(pYear, pJDate, pRangeId, pSlot){
//	console.log("GetNoFreeRinks for slot", pYear, pJDate, pRangeId, pSlot);
	
	let max_rinks = await getRinksForDay(pJDate);
	let wNumbers = new Array(max_rinks).fill(true);
	let wData = await getBookingsForJulianDate(pYear, pJDate);
	let wSlotGames = wData.filter ( item => item.slotId === pSlot && item.rangeId === pRangeId);
	for (let wBooking of wSlotGames){
		let wRnk = parseInt(wBooking.rink,10);
		wNumbers[wRnk -1] = false;
	}
	const wNoRinks = wNumbers.reduce((counter, item ) => item === true ? counter += 1 : counter, 0); // 6
	const wStartRink = wNumbers.findIndex( item => item === true);
	if (wNoRinks === 0){
		return [0,0];
	} else {
		return [wNoRinks, wStartRink+1];
	}
}

//================================================= Shared Booking Functions ================================================
//
//DEPRRECATED
export async function processEvent(pEvent, pYear, pJDay, pStartRink, pRinksNeeded){
	console.log("/public/objects/booking processEvent This should be deprecated - note how got here");
	let wRecs = [];
	
	let wStartSlot = 0;
	let wRange = 1;
	//let wRink = 1;
	let nSlots = 2;
	//let nRinks = 3;

	let wHrs = pEvent.startDate.getHours();
	//let wMins = pEvent.startDate.getMinutes();
	
	if (wHrs >= 17) {
		wStartSlot = 5;
	} else if (wHrs > 12) {
		wStartSlot = 3
	} else {
		wStartSlot = 1
	}

	//console.log(pEvent.eventType, wHrs, wSlot, nRinks)
	let wParams = await processEventType(pEvent);
	let wSlotsNeeded = wParams.slots;
	/** Generate Bookings Records */
	for (var i = 0; i < pRinksNeeded; i++) {
		for (var j = 0; j < wSlotsNeeded; j++) {
			//console.log("/public/objects/booking Rink = ", String(pStartRink + i), "Slot = ", String(wStartSlot + j));
			let wRec = await storeSelection(pEvent, wRange, wStartSlot + j, pStartRink + i, wParams);
			//console.log(wRec);
			wRecs.push(wRec);
		}
	}

	return wRecs;
}



export async function processEventType(pEvent) {
	//console.log("Obj Booking Process Event Type");
	//console.log(pEvent);

	let wSource = "E";	//represents from an event
	let wTitle = "";
	let wUse = "";
	let wField2 ="";
	let wField3 = "";
	let wField5 = "";

	let wGender = "Mixed";
	let wGameType = "";

	switch (pEvent.gameType) {
		case EVENT_GAME_TYPE.TYPE_X:
		case EVENT_GAME_TYPE.TYPE_R:
		case EVENT_GAME_TYPE.FOURS:
			wGameType = "Fours";
			wField2 = "8";
			break;
		case EVENT_GAME_TYPE.TRIPLES:
			wGameType = "Triples";
			wField2 = "6";
			break;
		case EVENT_GAME_TYPE.PAIRS:
		case EVENT_GAME_TYPE.DOUBLES:
			wGameType = "Pairs";
			wField2 = "4";
			break;
		case EVENT_GAME_TYPE.SINGLES:
			wGameType = "Singles";
			wField2 = "2";
			break;
		case EVENT_GAME_TYPE.DOUBLE_FOURS:
			wGameType = "Double Fours";
			wField2 = "8";
			break;
		case EVENT_GAME_TYPE.MIXED_DOUBLE_FOURS:
			wGameType = "Mixed Double Fours";
			wField2 = "8";
			break;
		case EVENT_GAME_TYPE.TOP_CLUB_TRIPLES:
			wGameType = "Top CLub Triples";
			wField2 = "6";
			break;
		case EVENT_GAME_TYPE.CLUB_CHAMP_TRIPLES:
			wGameType = "Club Champ Triples";
			wField2 = "6";
			break;
		case EVENT_GAME_TYPE.MIXED_PAIRS:
			wGameType = "Mixed Pairs";
			wField2 = "4";
			break;
		default:
			console.log("public/objects/booking processEventType invalid Game Type", pEvent.gameType);
			wGameType =  "";
			wField2 ="0";
			break;
	}
	
	switch (pEvent.mix) {
		case MIX.LADIES:
			wGender  = "Ladies'";
			break;
		case MIX.MENS:
			wGender  = "Men's";
			break;
		case MIX.MIXED:
			wGender  = "Mixed";
			break;
		default:
			console.log("public/objects/booking processEventType invalid Mix", pEvent.mix);
			wGender  = "";
			break;
	}

	let wDesc = "";
	switch (pEvent.eventType) {
		case EVENT_TYPE.FRIENDLY_GAME:		// friendly games
			wTitle = "Friendly";
			wUse = wGender + " " + wGameType;
			wField3 = "Maidenhead Town";
			wField5 = pEvent.subject;
			break;
		case EVENT_TYPE.CLUB_GAME:		// club games eg Mhd Tournament, club finals, intra club games
			wTitle = pEvent.subject;
			wField3 = "";
			wField5 = "";
			switch (pEvent.useType) {
				case "F":
					wDesc = "Friendly";
					break;
				case "N":
					wDesc = "National";
					break;
				case "B":
					wDesc = "County";
					break;
				case "C":
					wDesc = "Competition";
					break;
				case "T":
					wDesc = "Tournament";
					break;
				case "L":
					wDesc = "League";
					break;
				case "H":
					wDesc = "Loan";
					break;
				default:
					wDesc = "Unknown";
					break;
			}
			wUse = wGender + " " + wDesc;
			break;
		case EVENT_TYPE.NATIONAL_GAME:		// club games eg Mhd Tournament, club finals, intra club games
			wTitle = wGender + " National Game";
			wUse = wGameType;
			wField3 = " v ";
			wField5 = pEvent.subject;
			break;
		case EVENT_TYPE.COUNTY_GAME:		// club games eg Mhd Tournament, club finals, intra club games
			wTitle = wGender + " County Game";
			wUse = "County Game";
			wField3 = " v ";
			wField5 = pEvent.subject;
			break;
		case EVENT_TYPE.INTER_CLUB_GAME:		// inter - club games eg Maidenhead Mini League
		/** this is hard coded for league = MLG1 for now */
			const wEGTeam = "Maidenhead Town " + pEvent.team.trim();
			switch (pEvent.league) {
				case LEAGUE.MINI_LEAGUE_1:
					wTitle = "Mini League / " + pEvent.summary.trim();
					wUse = wGender + " " + wGameType;
					if (pEvent.homeAway === PLAYED_AT.HOME) { 
						wField3 = wEGTeam;
						wField5 = pEvent.subject;
					} else {
						wField3 = pEvent.subject;;
						wField5 = wEGTeam
					}
					break;
				default:
					wTitle = "Unknown";
					wUse = pEvent.league;
					wField3 = "";
					wField5 = pEvent.subject;
					break;
			}
			break;
		case EVENT_TYPE.LEAGUE_GAME:		// league games ie from an import: equiv to a booking
			const wTeam = "Maidenhead Town " + pEvent.team.substring(pEvent.team.length - 1, pEvent.team.length);
			// was let wLeagueTeam = await getLeagueTeamByTeamKey(pEvent.team);
			let wResult = await getNewLeagueForTeam(pEvent.team);
			let wDivision = 0;
			let wLeagueName = "";
			if (wResult.status){
				let wLeague = wResult.league;
				wLeagueName = wLeague.leagueName;
				wDivision = parseInt(wLeague.division,10) || 0;
			}
			if (wDivision === 0 ){
				wTitle = wLeagueName;
			}else {
				wTitle = wLeagueName + " Div " + String(wDivision);
			}
			wUse = wGender;
			wField3 = wTeam;
			wField5 = pEvent.subject;
			break;
		case EVENT_TYPE.CLUB_EVENT:		// club events eg open days
			wTitle = pEvent.subject;
			break;
		case EVENT_TYPE.LOAN_GAME:		// loan games
			wTitle = "Loan";
			wUse = wGender + " " + wGameType;
			const y = pEvent.subject.indexOf(" v ");
			if  (y) {
				if (y > 0) {
					const wParts = pEvent.subject.split(" v ");
					wField3 = wParts[0];
					wField5 = wParts[1];
				} else {
					wField3 = pEvent.subject;
					wField5 = "";
				}
			} else {
				wField3 = pEvent.subject;
				wField5 = "";
			}
			break;
		default:
			console.log("public/objects/booking processEventType invalid Event Type", pEvent.eventType);

			break;
	}
	return {"source": wSource, "title": wTitle, "use": wUse, "f2": wField2, "f3": wField3, "f5": wField5};
}

//DEPRRECATED
export async function storeSelection(pEvent, pRange, pSlot, pRink, pParams) {

	let toInsert = {
        "dateRequired": null,
		"timeRequired": null,
		"duration": "01:30",
        "requiredYear": 0,
        "requiredMonth": 0,
        "requiredJDate": 0,
        "resourceKey": "",
        "title": "",
        "rink": 0,
        "rangeId": 0,
        "slotId": 0,
        "compRef": null,
		"compTitle": null,
        "usage": "",
        "status": BOOKING.OPEN,
        "isBye": "N",
        "noPlayers": 0,
        "bookerId": null,
        "playerAId": null,
        "playerBId": null,
        "dateBooked": null,
        "matchKey": "",
        "scoreA": 0,
        "scoreB": 0,
        "round": 0,
        "newKey": null,
		"eventId": null,
		"pId": null
    };
    let wToday = new Date();
    wToday.setHours(10,0,0,0);

	let wCompRef = "EVENT/" + pEvent.eventType.toUpperCase();

    
    let wTempPlayer = "ffc88a4a-3cb2-4228-9068-54e3c92d24bd"; 	// id of "Temporary Holder"
    let wBookerId = $w('#txtLstId').text;
    let wJDate = String(pEvent.requiredYear) + String(pEvent.requiredJDate).padStart(3,"0");
    let wRequiredMonth = pEvent.startDate.getMonth();

    let wResourceKey = wJDate + "S" + String(pSlot).padStart(2,"0") + "R" + String(pRink).padStart(2,"0");
	
    toInsert.dateRequired = pEvent.startDate;
	toInsert.timeRequired = pEvent.startTime;
	toInsert.duration = durationToString(pEvent.duration);
    toInsert.requiredYear = pEvent.requiredYear;
    toInsert.requiredMonth = parseInt(wRequiredMonth,10);
    toInsert.requiredJDate =pEvent.requiredJDate;
    toInsert.resourceKey = wResourceKey;
    toInsert.rink = pRink;
    toInsert.rangeId = pRange;
    toInsert.slotId = pSlot; 
    toInsert.compRef = wCompRef;
	toInsert.compTitle = pParams.title;
    toInsert.usage = pParams.use;
    toInsert.status = BOOKING.OPEN;
    toInsert.isBye = "N";
    toInsert.noPlayers = parseInt(pParams.f2,10);
    toInsert.bookerId = wBookerId;
    toInsert.playerAId = pParams.f3;
    toInsert.playerBId = pParams.f5;
    toInsert.dateBooked = wToday;
    toInsert.matchKey = "";
    toInsert.scoreA = 0;
    toInsert.scoreB = 0;
    toInsert.round = 0;
    toInsert.newKey = null;
	toInsert.eventId = pEvent._id;
	toInsert.pId = pEvent._id;
	return toInsert;
    //console.log("selection stored");
}


/**
 * Summary:	Convert Date to Ordinal Day
 * 
 * Description: Converts the given date string to an ordinal date.	
 * NOTE:	This function is duplicated here as it needs to be addrerssed in the same block as its called from
 * 			to avoid it returning a Promise unstead of a synchronous value
 * 
 * @function
 * @param { Date} pDate - The Date object to convert.
 * 
 * @returns {number} The ordinal date (day of the year), or -1 if the input is invalid.
 */
export function DateToOrdinal(pDate){
	try {
		const dayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (typeof pDate === "string"){ return -1}
		const dte = new Date(pDate);
		//initialize date variable
		const yy = dte.getFullYear()
		let julianDate = 0;
		//add days for previous months
		for (let i = 0; i < dte.getMonth(); i++) {
			julianDate = julianDate + dayCount[i];
		}
		//add days of the current month
		julianDate = julianDate + dte.getDate();
		//check for leap year
		if (dte.getFullYear() % 4 == 0 && dte.getMonth() > 1) {
			julianDate++;
		}

		return parseInt(julianDate,10);
	}
	catch (err) {
		console.log("/public/objects/booking DateToOrdinal Try-catch, err");
		console.log(err);
		return -1;
	}
}
