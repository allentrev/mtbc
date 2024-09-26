//------------------------------------------------------------------------------------------------------
//
//	CALENDAR OBJECT
//
//  Desc:   The "" table holds a record for each
//
//  Usage:  1)  Maintain Leagues & Calendars page
//          2)  Maintain Evemt page
//          3)  Upload Calendar Events page
//          4)  fixtures.js
//          5)  createEvent.jsw
//------------------------------------------------------------------------------------------------------
import wixData from 'wix-data';

//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function loadCalendars() {
	let res = await wixData.query('lstCalendars')
		.eq("year", 2023)
		.ascending("abr")
		.find();
		return res.items;
}

//--------------------------------------------Find Calendar Id-------------------------------------------------------//
export async function getCalendarId(pCalendarKey) {
    let wCalendarId;
		const results = await wixData.query("lstCalendars")
    		.eq("abr", pCalendarKey)
    		.find();
		if (results.items.length ===  0) {
			return "Not found";
		} else {
			wCalendarId = results.items[0].calendarId;
			return wCalendarId;
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
export function updateCalendarList(pId, pAbr, pName, pUrl, pCalendarId) {
  	try {
    	// create an item
        const toUpdate = {
        	"_id": pId,
			"abr": pAbr,
            "name": pName,
			"url": pUrl,
			"calendarId": pCalendarId
    	};
        // add the item to the collection
        wixData.update("lstCalendars", toUpdate)
  		/*	.then( (results) => {
				return true;
			})
			.catch( (err) => {
				console.log("updateCalendarList update fail = " + err);
				return false;
			});
			*/
	}
	catch (error) {
		console.log("/public/objects/calendar updateCalendarList catch fail = " + error);
		return false;
	}
}

