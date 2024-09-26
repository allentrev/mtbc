//------------------------------------------------------------------------------------------------------
//
//	CoachingSections OBJECT
//
//  Desc:   The "lstCoachingSections" table holds a record for each
//
//  Usage:  1)  Officers page
//------------------------------------------------------------------------------------------------------

import wixData from 'wix-data';

//------------------------------------------------------------------------------------------------------
//
//	Function:	loadCoachingSections
//
//  Inputs:		none
//	Output:		res{}	Object array	list of CoachingSections records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadCoachingSectionsTop() {
	let res = await wixData.query('lstCoachingSections')
		.eq('level', 0)
        .ascending("ref")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		let dlist = res.items.map(item => {
			return {
				label: item.header,
				value: item.ref
			}});
		return dlist;
	}
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	loadCoachingSections
//
//  Inputs:		none
//	Output:		res{}	Object array	list of CoachingSections records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadFullCoachingSectionsTop() {
	let res = await wixData.query('lstCoachingSections')
		.eq('level', 0)
        .ascending("ref")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		return res.items;
	}
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	loadCoachingSections
//
//  Inputs:		none
//	Output:		res{}	Object array	list of CoachingSections records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadCoachingSectionsMiddle(pRef) {
	let res = await wixData.query('lstCoachingSections')
		.eq('level', 1)
        .eq('parent', pRef)
        .ascending("ref")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		let dlist = res.items.map(item => {
			return {				label: item.header,
				value: item.ref
			}});
		return dlist;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	getCoachingSections
//
//  Inputs:		none
//	Output:		res{}	Object array	list of CoachingSections records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getCoachingSectionsMiddle(pRef) {
	let res = await wixData.query('lstCoachingSections')
		.eq('level', 1)
        .eq('parent', pRef)
        .ascending("ref")
		.find();
	if (res.items.length ===  0) {
		return false;
	} else {
		return res.items;
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
export async function getCoachingSectionByKey(pIn){

    const results = await wixData.query("lstCoachingSections")
        .eq("ref", pIn)
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
export async function insertCoachingSection(pRec) {
  	try {
    	// create an item
        // add the item to the collection
        let results = await wixData.insert("lstCoachingSections", pRec)
  		if	(results) {
			let item = results; 
			return item._id;
		} else {
			console.log("InsertCoachingSection insert fail");
			return false;
		}
	  }
	catch (error) {
		console.log("InsertCoachingSection TryCatch " + error);
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
export function updateCoachingSection(pId, pRec) {
	console.log("Updating ", pId);
	return wixData.get("lstCoachingSections", pId)
  		.then( (item) => {
			console.log(item);
			item.header = pRec.header;
            item.shortDesc = pRec.shortDesc;
			item.sectionImage = pRec.sectionImage;
			item.longDesc = pRec.longDesc;
			item.srcType = pRec.srcType;
            item.bodyText = pRec.bodyText;
            item. bodyImage = pRec.bodyImage;
            item.srcLink = pRec.srcLink;
    	wixData.update("lstCoachingSections", item);
		return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("UpdateCoachingSection update ", errorMsg);
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
export function deleteCoachingSection(pId) {
	console.log("deleting ", pId);
	return wixData.remove("lstCoachingSections", pId)
  		.then( (item) => {
			return true;
		})
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("Dedeting CoachingSection fail ", errorMsg);
			return false;
  		} );
}
