// Filename: public/utility.js 
//
// Code written in public files is shared by your site's
// Backend, page code, and site code environments.
//
// Use public files to hold utility functions that can 
// be called from multiple locations in your site's code.

import { getAllMembers }		from 'public/objects/member.js';

let gMembers = [];

export async function initialiseMembers() {
    if (typeof gMembers === "undefined" || gMembers.length === 0) {
	    let [status, gMembers] = await getAllMembers();
      if (gMembers) {
        return [true, gMembers];
      } else {
        gMembers = [];
        return [false, []];
      }
    }
    return [true, gMembers];
}

export function convertNulls (pIn) {
  	//convert a null or equivalent into a X so that the dropdown displays blank
  	if (pIn === null  || typeof pIn === 'undefined') {
    	pIn = " ";
  	}
  	return pIn;
}
