//------------------------------------------------------------------------------------------------------
//
//	CLUBCOMPGAME OBJECT
//
//	THIS COLLECTION AND CLASS IS DEPRECATED LOOK AT CLUBCOMP instead
//
//
//  Desc:   The "" table holds a record for each
//
//  Usage:  1)  Maintain CLub Competition Game page
//          2)  Update Club Competition Winner
//          3)  Club CHampionship Winners page
//          4)  lbxClubComp lightbox
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
export async function getClubCompGames(pMix) {
       	const results = await wixData.query("lstClubCompGames")
    		.eq("mix", pMix)
    		.ascending("order")
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
//	Function:	getOpenSingless
//
//  Inputs:		none
//	Output:		res{}	Object array	list of OpenSingless records
//				false	boolean			none found
//
//------------------------------------------------------------------------------------------------------
export async function getDistinctClubGames() {
    return wixData.query("lstClubCompGames")
		.ascending("title")
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
                console.log("getDistinctClubGames 0 results");
            }
        })
        .catch( (error) => {
            let errorMsg = error.message;
            let code = error.code;
            console.log("getDistinctClubGames catch " + errorMsg);
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
export function insertClubCompGame(pMix, pTitle, pCompType, pType, pWinner, pSecond) {
  	try {
    	// create an item
		let wCount = 0;
		wixData.query("lstClubCompGames")
			.eq("mix", pMix)
  			.count()
  			.then( (num) => {
    			wCount = num;
        		const toInsert = {
            		"title": pTitle,
					"mix": pMix,
					"type": pType,
					"compType": pCompType,
					"winner": pWinner,
					"second": pSecond,
					"order": wCount+1
    			};
				// add the item to the collection
        		wixData.insert("lstClubCompGames", toInsert)
			  } )
  			.catch( (error) => {
    			let errorMsg = error.message;
    			let code = error.code;
  		} );
	}
	catch (error) {
		console.log("Insert Club Comp Game TryCatch " + error);
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
export async function updateClubCompGame(pId, pWinner, pSecond) {
	// add the item to the collection
    wixData.get("lstClubCompGames", pId)
  		.then( (item) => {
    		item.winner = pWinner;
			item.second = pSecond
    	wixData.update("lstClubCompGames", item);
  		return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			return false;
  		} );
}



