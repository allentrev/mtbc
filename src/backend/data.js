import wixData from 'wix-data';


export async function updateTeamPlayerStatus(pTeamPlayerId, pStatus) {
	// add the item to the collection
	let options = {
	  "suppressAuth": true,
	  "suppressHooks": true
	};

	return wixData.get("lstTeamPlayer", pTeamPlayerId)
		.then((item) => {
			item.status = pStatus;
			wixData.update("lstTeamPlayer", item, options);
			console.log("/backend/data updateTeamPlayerSTatus rec updated");
			return true;
		})
		.catch((err) => {
			console.log("/backend/data updateTeamPlayerSTatus catch error ", err);
			return false;
		});
}

export async function lstBookings_beforeInsert(item, context) {
	// Calls routine to check if value already exists in the collection.
	// If value not found, then save record.
	// Else, if value is found, then reject this insert to prevent duplicate values.
	// Note: concurrent inserts may result in duplicates.
	// Pass context to searchForDuplicates to use for multiple collections.
	let wUserId = context.userId;
	return searchForDuplicates(context.collectionName, "resourceKey", item).then((res) => {
		if(res > 0) {
		    console.log("/backend/data lstBookings_beforeInsert duplicate by user", wUserId);
			return Promise.reject('backend/data lstBookings_beforeInsert: This item already exists');
    	}
	    console.log("/backend/data lstBookings_beforeInsert OK by user", wUserId);
		return item;
	});
}


export async function searchForDuplicates(collection, field, item) {
	// info contains the hook context
	// use the collectionName property to use function for multiple collections	
    return wixData.query(collection)
        .hasSome("status", ["O", "P"])
		.eq(field, item[field])
        .find()
        .then((results) => {
			if (results.items.length === 0){return 0}
			let wKey = item[field];
			if (typeof wKey === "string") {
				if (wKey.substring(7) === "S00R00") {console.log("/backend/data searchForDuplicates Not scheduled"); return 0}
			}
			return 1;
        })
        .catch((err) => {
            console.log("/backend/data searchFor|Duplicates catch Error = ", err);
			return 0;
        });
}

export function noDuplicatesDB_beforeInsert(item, context) {
	// Calls routine to check if value already exists in the collection.
	// If value not found, then save record.
	// Else, if value is found, then reject this insert to prevent duplicate values.
	// Note: concurrent inserts may result in duplicates.
	// Pass context to searchForDuplicates to use for multiple collections. 
    return searchForDuplicates(context.collectionName, "names", item).then((res) => {
        if(res > 0) {  
            return Promise.reject('From noDuplicates: This item already exists');
        }
        return item;
    });
}
