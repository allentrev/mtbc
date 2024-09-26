//------------------------------------------------------------------------------------------------------
//
//	NOTICE OBJECT
//
//  Desc:   The "" table holds a record for each
//
//  Usage:  1) Noticeboard page
//          2) Maintain Notices page
//          3) Update Noticepage
//          4) Close Notice page
//          5) Home page
//          6) lbxNewsFlash
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
export async function getNotices(pUrgent, pStatus) {

       	const results = await wixData.query("lstNotices")
    		.eq("status", pStatus)
    		.eq("urgent", pUrgent)
    		.descending("_createdDate")
			.find();
		if (results.items.length ===  0) {
			return false;
		} else {
			return results.items;
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
export async function getAllNotices() {

		let wThisYear = new Date();
		let wYear = wThisYear.getFullYear();
		wThisYear = new Date(wYear, 0, 1,10,0);
       	const results = await wixData.query("lstNotices")
    		.eq("status", "O")
			.ge("_createdDate", wThisYear)
    		.descending("_createdDate")
			.find();
		if (results.items.length ===  0) {
			return "Not found";
		} else {
			return results.items;
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
		console.log("/public/objects/notice insertNotice TryCatch " + error);
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
export async function updateNoticeStatus(pNoticeId, pStatus) {
	// add the item to the collection
    wixData.get("lstNotices", pNoticeId)
  		.then( (item) => {
    		item.status = pStatus;
    		wixData.update("lstNotices", item);
  			return true;
		})
  		.catch( (err) => {
    		let errorMsg = err;
			return false;
  		} );
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

