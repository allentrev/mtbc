
import wixWindow					from 'wix-window';
import wixData 						from 'wix-data';
import wixUsers						from 'wix-users';
import wixLocation					from 'wix-location';
import {sendConfirmationEmail2}	 	from 'backend/email.jsw';

export async function sendConfirmationEmail(pRequestedCells, pFullName, pEmail) {
	const toEmail = {
		"paverList": [],
		"fullName": "",
		"email": "",
		"dateBooked": ""
	};

//	Prepare email record
	toEmail.paverList = pRequestedCells;
	toEmail.fullName = pFullName;
	toEmail.email = pEmail;
	toEmail.dateBooked = new Date ();
	let res = await sendConfirmationEmail2(toEmail);
	if (res) {
		console.log("Paver.js, email sent ok (res)", res);
		return true;
	} else {
		console.log("Paver.js, email sent failed (Res)", res);
		return false;
	}	
}
export async function updateDatabase(pRecords) {
	
	let options = {
  		"suppressAuth": true,
  		"suppressHooks": true
	};

	return wixData.bulkUpdate("lstPavers", pRecords, options)
		.then( (results) => {
			let inserted = results.inserted; // 0
			let updated = results.updated; // 2
			let skipped = results.skipped; // 0
			let errors = results.errors; // []
			console.log("Paver (updateDatabase) (I,U,S,E):", inserted, updated, skipped, errors);
			return true;
		} )
		.catch( (err) => {
			let errorMsg = err;
			console.log("Paver (updateDatabase) error:", errorMsg);
			return false;
		} );
}

export async function updateDatabase2(pUserId, pRef) {

    const results = await wixData.query("lstPavers")
		.eq("pRef", pRef)
    	.find();
	let wRec = results.items[0];
	let wId = wRec._id;

	wixData.get("lstPavers", wId)
		.then(async (item) => {
			item.owner = pUserId;
			item.status = "R";
			let wRes = await wixData.update("lstPavers", item);
			if (wRes) {
				console.log("Updated (id, Ref)", wId, pRef);
				return true;
			} else {
				console.log("Update failed (Id, Ref, Res)", wId, pRef, wRes);
				return false;
			}
		})
		.catch((err) => {
			let errorMsg = err;
			console.log("Update Pavers err " + errorMsg + "[ " + wId);
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
export async function getSponsorCells(pUser) {

	return wixData.query("lstPavers")
		.eq("owner", pUser)
		.ascending("pRef")
		.find()
		.then( (result) => {
			return result.items;
		})
		.catch( (err) => {
			console.log("PAver (getSponsorCells) err", pUser, err)
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
export async function getPaver(pId) {

	return wixData.query("lstPavers")
		.eq("_id", pId)
		.find()
		.then( (result) => {
			return result.items[0];
		})
		.catch( (err) => {
			console.log("PAver (getPaver) err", pId, err)
			return false;
		})
}