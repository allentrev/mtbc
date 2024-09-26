import wixData from 'wix-data';
import { Permissions, webMethod } from "wix-web-module";

//----------------------------------------------Template------------------------------------------------
//
export const name1 = webMethod(
  Permissions.Anyone, 
  async (pUserId) => {
    try {

      return {"status": true, "notices": null, "error": null};
    }
    catch (err) {
      console.log(`/backend/backNotices name1 by ${pUserId} Try-catch, err`);
      console.log(err);
      return {"status": false, "notices": null, "error": err};
    }
  }
)
//-------------------------------- test data -----------------------------------
// 88f9e943-ae7d-4039-9026-ccdf26676a2b	Me
// ab308621-7664-4e93-a7aa-a255a9ee6867	Sarah
// 51e6946d-6ef8-4da6-acf3-8896a1b3db6e Tom Brash
// 6e5b5de1-214f-4b03-badf-4ae9a6918f77 Tim
// 5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9 Tony

// 0b331007-0dde-43b5-a06e-16794fd291c0 Julia
// 15909692-9e75-4e26-a277-5506c3dda84d	betty

//----------------------------------------------Functions------------------------------------------------
//
export const getAllNotices = webMethod(
  Permissions.Anyone, 
  async (pUserId, pYear) => {
    try {
		  let wThisYear = new Date(pYear, 0, 1,10,0,0);
      const results = await wixData.query("lstNotices")
    	  .eq("status", "O")
			  .ge("_createdDate", wThisYear)
    		.descending("_createdDate")
			  .find();
      return {"status": true, "notices": results.items, "error": null};
    }
    catch (err) {
      console.log(`/backend/backNotices getAllNotices by ${pUserId} Try-catch, err`);
      console.log(err);
      return {"status": false, "notices": null, "error": err};
    }
  }
)
