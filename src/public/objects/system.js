import wixData from 'wix-data';
//------------------------------------------------------------------------------------------------------
//
//	SYSTEM OBJECT
//
//  Desc:   Equivalent of a Settings FIle. Used to hold info that governs the look and feel of the site
//
//  Usage:  1) Maintain Time Slots
//          2) Maintain Rinks
//          3) 
//          4) 
//          5) 
//          6) 
//------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function loadNotices() {
	let res = await wixData.query('lstNotices')
    	.eq("status", "O")
    	.descending("_createdDate")
		.find();
	let dlist = res.items.map(item => {
		return {
			label: item.title,
			value: item._id
		}});
	return dlist;
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getNotice	
//
//  Inputs:		pNoticeId	strng	ID of the required Notice
//	Output:		item		object	Notice record
//				false		Boolean	not found
//
//------------------------------------------------------------------------------------------------------
export async function getNotice(pNoticeId) {

       	const results = await wixData.query("lstNotices")
    		.eq("_id", pNoticeId)
			.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			return results.items[0];
		//	console.log("Type = " + wRole);
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

/**
 * Moved to public/objects/booking
 * 
export async function getSettingsRinkArray () {
  	try {
		const results = await wixData.query("lstSettings")
    		.eq("title", "1")
    		.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			let item = results.items[0];
			return item.rinkArray;
		}
	}
	catch (error) {
		console.log("/backBookings getSettingRinkArray TryCatch " + error);
		return false;
	}
}

*/

//------------------------------------------------------------------------------------------------------
//
//	Function:	
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function insertNotice(pTitle, pUrgent, pPicture, pMessage, pStatus) {
  	try {
    	// create an item
        const toInsert = {
            "title": pTitle,
			"urgent": pUrgent,
			"picture": pPicture,
			"message": pMessage,
			"status": pStatus
    	};
        // add the item to the collection
        wixData.insert("lstNotices", toInsert)
        //	.catch( (err) => {
        //    	console.log("Insert = " + err.message);
        //     } );
	  	//console.log("inside after data query ");
	}
	catch (error) {
		console.log("/public/objects/system insertNotice TryCatch " + error);
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

export async function updateSettings (pRinks, pSlots) {
  	try {
		const results = await wixData.query("lstSettings")
    		.eq("title", "RS1")
    		.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			let item = results.items[0];
			item.rinkArray = pRinks;
			item.slotArray = pSlots;
			let res = await wixData.update("lstSettings", item)
			
			if (res) {
				return true;
			} else {
				console.log("/public/objects/system UpdateSettins: Update failed")
				return false;
			}
		}
	}
	catch (error) {
		console.log("/public/objects/system updateSettings TryCatch " + error);
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
export function updateNotice(pNoticeId, pTitle, pUrgent, pMessage, pPicture) {
    wixData.get("lstNotices", pNoticeId)
  		.then( (item) => {
			item.title = pTitle;
            item.urgent = pUrgent;
			item.message = pMessage;
			item.status = "O";
			item.picture = pPicture;
    	wixData.update("lstNotices", item);
		return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			return false;
  		} );
}

