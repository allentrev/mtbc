//------------------------------------------------------------------------------------------------------
//
//	OpenSingless OBJECT
//
//  Desc:   The "lstOpenSingless" table holds a record for each
//
//  Usage:  1)  Officers page
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
export function addGameScore(pComp, pDivision, pId, pFor, pAgainst) {
	console.log("In addGameScore for  ", pId);
	return wixData.query("lstOpenSingles")
		.eq("compRef", pComp)
		.eq("division", pDivision)
		.eq("competitor", pId)
		.find()
  	    .then( (results) => {
      		if(results.items.length > 0) {
        		let item = results.items[0];
        		item.played = item.played +1;
				item.pointsFor = item.pointsFor + pFor;
				item.pointsAgainst = item.pointsAgainst + pAgainst;
        		wixData.update("lstOpenSingles", item);
				return true;
      		} else {
        		console.log("addGameScore " + pId + " competitor not found");
				console.log(results);
				return false;
      		}
    	})
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("addGameScore catch ", errorMsg);
			return false;
  		} );
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	loadOpenSingless
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadOpenSinglesTable(pComp, pDivision) {
	return wixData.query('lstOpenSingles')
		.eq('compRef', pComp)
		.eq('division', pDivision)
        .descending('pointsFor')
		.ascending('pointsAgainst')
		.ascending("hcp")
		.find()
		.then( (results) => {
			if (results.items.length === 0) {
				let AorB = [{"_id": "Dummy1", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""},
							 {"_id": "Dummy2", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""},
							 {"_id": "Dummy3", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""},
							 {"_id": "Dummy4", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""}
				];
				let final = [{"_id": "Dummy1", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""},
							 {"_id": "Dummy4", "name": "", "hcp": "", "played": "", "pointsAgainst": "", "pointsFor": ""}
				];
				if (pDivision === "Ladder Final"){
					return final;
				} else {
					return AorB;
				}
			} else {
				return results.items;
			}
		})
		.catch( (err) => {
			console.log("loadOpenSinglesTable catch " + err)
			return false;
		})
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	loadOpenSingless NOT USED
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadFullOpenSinglessTop() {
	let res = await wixData.query('lstOpenSingless')
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
//	Function:	loadOpenSingless NOT USED
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function loadOpenSinglessMiddle(pRef) {
	let res = await wixData.query('lstOpenSingless')
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
//	Function:	getOpenSingless
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getOpenSinglesTitles() {
    return wixData.query("lstOpenSingles")
        .distinct("title")
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
		        return {
			        label: item,
			        value: item
		        }
                })
                return dlist;
            } else {
                console.log("getOpenSingles 0 results");
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.log("getOpenSingles catch " + errorMsg);
        } );
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	getOpenSingless
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getOpenSinglesDivisions(pTitle) {
    return wixData.query("lstOpenSingles")
        .eq("title", pTitle)
		.distinct("division")
        .then( (results) => {
            if(results.items.length > 0) {
            	let dlist = results.items.map(item => {
		        return {
			        label: item,
			        value: item
		        }
                })
                return dlist;
            } else {
                console.log("getOpenSinglesDivisions 0 results");
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.log("getOpenSinglesDivisions catch " + errorMsg);
        } );
}


//------------------------------------------------------------------------------------------------------
//
//	Function:	getOpenSingless
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getOpenSinglesCompetitors(pComp, pDivision) {
    return wixData.query("lstOpenSingles")
        .eq("compRef", pComp)
		.eq("division", pDivision)
		.descending('pointsFor')
		.ascending('pointsAgainst')
		.ascending("hcp")
		.find()
        .then( (results) => {
            if(results.items.length === 0) {
                console.log("getOpenSinglesCompetitors 0 results");
				return false;
            } else {
				return results.items;
			}
        })
        .catch( (error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.log("getOpenSinglesCompetitors catch " + errorMsg);
			return false;
        } );
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	NOt USED
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function getOpenSinglesByKey(pIn){

    const results = await wixData.query("lstOpenSingless")
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
//	Function:	NOT USED
//
//  Inputs:		i1		Object	note
//	Output:		o2		String	note
//				false	Boolean	insert failed
//
export async function insertOpenSingles(pRec) {
  	try {
    	// create an item
        // add the item to the collection
        let results = await wixData.insert("lstOpenSingless", pRec)
  		if	(results) {
			let item = results; 
			return item._id;
		} else {
			console.log("InsertOpenSingles insert fail");
			return false;
		}
	  }
	catch (error) {
		console.log("InsertOpenSingles TryCatch " + error);
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
export async function bulkSaveOpenSingles(pData) {

	return wixData.bulkSave("lstOpenSingles", pData)
  		.then( (results) => {
			console.log(results);
			let inserted = results.inserted; // 2
			let insertedIds = results.insertedItemIds; // see below
			let updated = results.updated; // 0
			let skipped = results.skipped; // 0
			let errors = results.errors; // []
		})
		.catch( (err) => {
			let errorMsg = err;
			console.log("bulkSave Catch " + errorMsg);
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
export function updateOpenSingles(pId, pRec) {
	console.log("Updating ", pId);
	return wixData.get("lstOpenSingles", pId)
  		.then( (item) => {
			item.title = "Open Singles";
            item.compType = pRec.compType;
            item.division = pRec.division;
			item.competitor = pRec.competitor;
			item.hcp = pRec.hcp;
			item.played = pRec.played;
            item.pointsAgainst = pRec.pointsAgainst;
            item.pointsFor = pRec.pointsFor;
    	wixData.update("lstOpenSingles", item);
		return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("UpdateOpenSingles update ", errorMsg);
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
export function updateOpenSinglesCompetitor(pId, pCompetitor, pName, pHcp) {
	return wixData.get("lstOpenSingles", pId)
  		.then( (item) => {
			item.competitor = pCompetitor;
			item.name = pName;
			item.hcp = pHcp;
			//item.played = pRec.played;					//TODO review what to do with points if needed
            //item.pointsAgainst = pRec.pointsAgainst;
            //item.pointsFor = pRec.pointsFor;
    	wixData.update("lstOpenSingles", item);
		return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("UpdateOpenSinglesCompetitor update ", errorMsg);
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
export function updatePlayerScore(pTitle, pDivision, pId, pDeltaFor, pDeltaAgainst) {
	console.log("In updatePlayerScore for  ", pId);
	return wixData.query("lstOpenSingles", pId)
		.eq("title", pTitle)
		.eq("division", pDivision)
		.eq("competitor", pId)
		.find()
  	    .then( (results) => {
      		if(results.items.length > 0) {
        		let item = results.items[0];
				item.pointsFor = item.pointsFor + pDeltaFor;
				item.pointsAgainst = item.pointsAgainst + pDeltaAgainst;
        		wixData.update("lstOpenSingles", item);
				return true;
      		} else {
        		console.log("updatePlayerScore " + pId + " competitor not found");
				console.log(results);
				return false;
      		}
    	})
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("updatePlayerScore catch ", errorMsg);
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
export function deleteOpenSingles(pId) {
	console.log("deleting ", pId);
	return wixData.remove("lstOpenSingles", pId)
  		.then( (item) => {
			return true;
		})
  		.catch( (err) => {
    		let errorMsg = err;
			console.log("Deleting OpenSingles fail ", errorMsg);
			return false;
  		} );
}
