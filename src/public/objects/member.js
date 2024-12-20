//------------------------------------------------------------------------------------------------------
//
//	MEMBERS JS MODULE
//
//  Desc:   ......................
//
//  Usage:  x page
//------------------------------------------------------------------------------------------------------
import { authentication } from "wix-members-frontend";
import { currentMember } from "wix-members-frontend";
import { session } from "wix-storage-frontend";

import { collateMemberDetails } from "backend/backMember.jsw";
import { getAllMembers } from "backend/backMember.jsw";

export const STATUS = Object.freeze({
    PENDING: "Pending",
    ACTIVE: "Active",
    WAIT: "Wait",
    PAST: "Past",
});

export const TYPE = Object.freeze({
    FULL: "Full",
    SOCIAL: "Social",
    LIFE: "Life",
    TEST: "Test",
    GUEST: "Guest",
});

export const ROLES = Object.freeze({
    ADMIN: "Admin",
    MANAGER: "Manager",
    CAPTAIN: "Captain",
    DAY_CAPTAIN: "Day_Captain",
    COMPETITION: "Competition",
    PRESS: "Press",
    COACH: "Coach",
    MEMBER: "Member",
    VISITOR: "Visitor",
});

let gLocalNameCache = []; // each record just contains {"_id", "fullName"}

/**
 * Summary:	Checks if the user has the required role(s).
 *
 * @function
 * @param {string|string[]} pRoleNeeded - The role or an array of roles required.
 * @param {string[]} pUserRoles - The roles assigned to the user.
 * @returns {boolean} Returns true if the user has at least one of the required roles, otherwise false.
 *
 * @example
 * const requiredRoles = ['admin', 'editor'];
 * const userRoles = ['user', 'editor'];
 * const hasRequiredRole = isRequiredRole(requiredRoles, userRoles);
 *
 * if (hasRequiredRole) {
 *   console.log("User has the required role(s).");
 * } else {
 *   console.log("User does not have the required role(s).");
 * }
 */
export function isRequiredRole(pRoleNeeded, pUserRoles) {
    const setA = new Set(pRoleNeeded);

    return pUserRoles.some((entry) => setA.has(entry));
}

export async function buildMemberCache() {
    let wMembers = await getAllMembers();
    gLocalNameCache = wMembers.map((item) => {
        return {
            id: item._id,
            fullName: item.fullName,
        };
    });
    return true;
}

export function getFullNameLocally(pId) {
    let wMember = gLocalNameCache.find((item) => item.id === pId);
    if (wMember) {
        return [true, wMember.fullName];
    } else {
        return [false, "Temporary Holder"];
    }
}

/**
 * Summary      This function returns the session member object and associated roles for the logged inn user
 *
 * Descriptiion	This function returns the session storage for either the user signed in or a test user if a test run.
 * 				The session storage holds the details of the member logged in, and a list of their roles. The function uses this
 * 				stored information to return to the calling client. Hoever, if this is the first page viewed by the logged in user
 * 				then there will not be these details set in the session storage. In this case, this function creates those details
 * 				and returns them as per normal. If no one is signed in, then it simply returms a false status and dummy Member and
 * 				Roles objects/array.
 *
 *              This must run in the client as it uses session storage
 *
 *
 * @param {boolean} pTest		Indicates whether this is a test run or a production call
 * @param {object}  pTestUser	The psuedo user to use for a test run
 *
 * @return (Promise<[boolean, object, array]> || Promise <[boolean, object, []]> || Promise<[boolean, null,[]]>}
 *
 *  */
export async function retrieveSessionMemberDetails(pTest, pTestUser) {
    let loggedInMember = "";
    let loggedInMemberRoles = "";
    let wMember = {};
    let wRoles = [];
    let status = false;

    if (!pTest) {
        loggedInMember = session.getItem("member");
        loggedInMemberRoles = session.getItem("roles");
        if (loggedInMember) {
            wMember = JSON.parse(loggedInMember);
            status = true;
        } else {
            /** Closing a session will clear down the session storage, but will leave the user
             * logged on. Therefore, next time that user opens the browser, Wix will consider them
             * signed on, but will have an empty session storage. Hence, this hook to restore
             * session storage with the Current Member's details.
             */
            if (authentication.loggedIn()) {
                //console.warn("/public/objects/member retrieveSessionMemberDetails - no session member data found for logged on user.");
                const loggedInWixMember = await currentMember.getMember(); // returns current member object if logged in, else is undefined
                [status, loggedInMember, loggedInMemberRoles] =
                    await storeSessionMemberDetails(false, loggedInWixMember);
                wMember = JSON.parse(loggedInMember);
                status = true;
            } else {
                //console.warn("/public/objects/member retrieveSessionMemberDetails - no session member data found - login status");
                //console.warn("/public/objects/member retrieveSessionMemberDetails Is Logged In = ", authentication.loggedIn());
                wMember = {
                    name: "not found",
                    lstId: "null",
                };
                loggedInMemberRoles = "";
            }
        }
    } /** is a test run */ else {
        [status, loggedInMember, loggedInMemberRoles] =
            await storeSessionMemberDetails(true, pTestUser);
        if (loggedInMember) {
            wMember = JSON.parse(loggedInMember);
            status = true;
        } else {
            wMember = {
                name: "not found",
                lstId: "null",
            };
            loggedInMemberRoles = "";
            status = false;
        }
    }
    if (loggedInMemberRoles) {
        wRoles = loggedInMemberRoles.split(",");
    }
    return [status, wMember, wRoles];
}

/**
 * Summary      This function sets up the session member object and their associated roles for the logged inn user
 *
 * Descriptiion	This Session Member details are a combination of information held in the Wix member database and the MTBC member database,
 * 				and their roles are adminsinstered by a Manager, or higher role, using the Site Members facilities in the Wix Dashboard.
 * 				This function calls the backend to retrieve these datasets and forms the Member objects and Role Array to place in
 * 				the Session storage.
 *
 *
 * @param {boolean} pTest		Indicates whether this is a test run or a production call
 * @param {object}  pWixMember	If a test run, the psuedo user to use or, the CurrentMember record of the logged in user.
 *
 * @return {Promise<[boolean, string, string]>}  The return status, the new Session member object plus an array containing the roles associated with that member
 * *
 *  */

export async function storeSessionMemberDetails(pTest, pWixMember) {
    let loggedInMember = "";
    let loggedInMemberRoles = "";
    let status = false;
    let wMember = {};
    let wRoles = [];
    try {
        [status, wMember, wRoles] = await collateMemberDetails(
            pTest,
            pWixMember
        );
        //.catch ( (err) => {
        //	console.warn("public/objects/member storeSessionMemberDetails collateMemberDetails catch, err");
        //	console.log(err);
        //	status = false;
        //	return [false, "", ""];
        //})
        if (status) {
            loggedInMember = JSON.stringify(wMember);
            if (wRoles.length > 0) {
                loggedInMemberRoles = wRoles.toString();
            }
        } else {
            console.warn(
                "public/objects/member storeSessionMemberDetails collateMemberDetails status fail"
            );
            status = false;
            return [false, "", ""];
        }

        session.setItem("member", loggedInMember);
        session.setItem("roles", loggedInMemberRoles);

        return [true, loggedInMember, loggedInMemberRoles];
    } catch (err) {
        console.warn(
            "public/objects/member storeSessionMemberDetails collateMemberDetails try catch, err"
        );
        console.log(err);
        status = false;
        return [false, loggedInMember, loggedInMemberRoles];
    }
}

export async function doHash(pPlainPassword) {
    //let wHashedPassword = await deConfuseString(pPlainPassword);
    let wHashedPassword = await digestMessage(pPlainPassword);
    return wHashedPassword;
}
/** DEPRECATED> THESE WERE USED IN THE FEW CASES BEFORE HASH WA INTRODUCED
async function confuseString(str) {
    let n = Math.floor(str.length / 3);
    let wString = str.split("").reverse().join("");
    let front_part = wString.substring(0, n);
    let back_part = wString.substring(n, wString.length);
    return back_part + front_part;
}

async function deConfuseString(str) {
    let n = Math.floor(str.length / 3);
    let front_part = str.substring(0, str.length - n);
	let front_part_2 = front_part.split("").reverse().join("");
	let back_part = str.substring(str.length - n, str.length);
	let back_part_2 = back_part.split("").reverse().join("");
    return front_part_2 + back_part_2;
}
*/

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""); // convert bytes to hex string
    return hashHex;
}

//====== Maintain Member local global functions ------------------------------------------------------
//
