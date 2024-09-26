//------------------------------------------------------------------------------------------------------
//
//	NEWSREPORT OBJECT
//
//  Desc:   The "" table holds a record for each
//
//  Usage:  1) Create News Report page
//          2) Update News Report page
//------------------------------------------------------------------------------------------------------
import wixData from 'wix-data';

//------------------------------------------------------------------------------------------------------
//
//	Function:	getNewsReport	
//
//  Inputs:		pWeek		date	week beginning date
//	Output:		item		object	News Report
//				false		Boolean	not found
//
//------------------------------------------------------------------------------------------------------

const NEWS_REPORT_STATUS = Object.freeze({
  CLOSED:	"C",
  OPEN:		"O"
});


export async function getNewsReport(pWeek) {
       	const results = await wixData.query("lstNewsReports")
    		.eq("week", pWeek)
			.eq("status", "O")
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
//	Function:	getAllNewsReports
//
//  Inputs:		-
//	Output:		iTems	Obj List	List of news reports
//				false	Boolean		None found
//
//------------------------------------------------------------------------------------------------------
export async function getAllNewsReports() {

       	const results = await wixData.query("lstNewsReports")
    		.eq("status", "O")
    		.ascending("week")
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
//	Function:	insertNewsReport	
//
//  Inputs:		pItem	Date	week beginning date of news report
//				pReport	richtxt	news report
//	Output:		id		text	identifier of inserted news report
//				false	Boolean	insert failed
//
//------------------------------------------------------------------------------------------------------
export async function insertNewsReport(pWeek, pReport) {
  	try {
    	// create an item
        const toInsert = {
            "week": pWeek,
			"report": pReport,
			"status": "O"
    	};
        // add the item to the collection
        let results = await wixData.insert("lstNewsReports", toInsert)
  		if	(results) {
			let item = results;
			return item._id;
		} else {
			console.log("/public/objects/newReport insertNewsReport Insert Fail else");
			return false;
		}
	}
	catch (error) {
		console.log("/public/objects/newsReport insertNewsReport TryCatch " + error);
		return false;
	}
}

//------------------------------------------------------------------------------------------------------
//
//	Function:	updateNewsReprt	
//
//  Inputs:		pId		String	identifier of News Report
//				pReport	RichTxt	updated News Report
//	Output:		true	Boolean	update success
//				false	Boolean	update failed
//
//------------------------------------------------------------------------------------------------------
export function updateNewsReport(pReportId, pReport) {
    return wixData.get("lstNewsReports", pReportId)
  		.then( (item) => {
			item.report = pReport;
			item.status = "O";
    		wixData.update("lstNewsReports", item);
			return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			return false;
  		} );
}

export function updateNewsReportStatus(pReportId, pStatus) {
    return wixData.get("lstNewsReports", pReportId)
  		.then( (item) => {
			item.status = pStatus;
    		wixData.update("lstNewsReports", item);
			return true;
		} )
  		.catch( (err) => {
    		let errorMsg = err;
			return false;
  		} );
}
