import { authentication } 				from 'wix-members-frontend';
import {session} 						from 'wix-storage-frontend';
import wixLocationFrontend				from 'wix-location-frontend';
import { retrieveSessionMemberDetails }	from 'public/objects/member';
import { storeSessionMemberDetails }	from 'public/objects/member';

//let gManagers = ["88f9e943-ae7d-4039-9026-ccdf26676a2b", "5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9", "5132409b-6d6a-41c4-beb7-660b2360054e"];


$w.onReady( async function () {
/**
 * 	Runs when every page is loaded and records that pages name in pageHistory. (Note that this does not include ;lightboxes).
 * 
 *	This is used by the log in routine to refresh the page from which the login lightbox was called, otherwise that page will 
 *	not detect that a user has signed on e.g. Booking page
 */

	let wPage = wixLocationFrontend.path[0];
	if (!wPage) {
		wPage = "";
	}
	let pageHistory = session.getItem("pageHistory");
	let newPageHistory = "/";
	if (pageHistory) {
		newPageHistory = "/" + wPage + ", " + pageHistory;
	}
	session.setItem("pageHistory", newPageHistory);


//========================================================== sign on / off clean up =========================================================
	authentication.onLogin( async (wWixMember) => {

  		const loggedInWixMember = await wWixMember.getMember();	// returns current member object if logged in, else is undefined
		let [status, loggedInMember, loggedInMemberRoles] = await storeSessionMemberDetails(false, loggedInWixMember);
		const wMember = JSON.parse(loggedInMember);

		/**
		console.log("onLogin Member"); 
		console.log(wMember); 
		console.log("onLogin Roles"); 
		console.log(loggedInMemberRoles);
		// */

		console.log("/page/masterPage onLogin [" + wMember.name + " as " + wMember.lstId + " in roles <" + loggedInMemberRoles + ">]");
	})

	authentication.onLogout(async () => {
		let [status, wMember, wRoles] = await retrieveSessionMemberDetails(false, {});
		/**
		console.log("onLogout Member"); 
		console.log(wMember); 
		console.log("onLogout Roles"); 
		console.log(wRoles); 
		// */
		if (status){
			console.log("/page/masterPage onLogOut [" + wMember.name + " as " + wMember.lstId + " in roles <" + wRoles + ">]");
		} else {
			console.log("/page/mastyerPage onLogOut with no member retrieved from the session");
		}
		session.setItem("member", "");
		session.setItem("roles", "");
		session.setItem("pageHistory", "/");

		setTimeout(() => {
			wixLocationFrontend.to("/")
		}, 500);
	});
});

