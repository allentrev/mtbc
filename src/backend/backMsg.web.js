
import { Permissions, webMethod } from "wix-web-module";
import { getSecret }			from 'wix-secrets-backend';

import twilio from 'twilio';
import  sgMail 					from '@sendgrid/mail';
import _ from 'lodash';

import { findOfficer }    from 'backend/backOfficers.jsw';
import { findLstMember }  from 'backend/backMember.jsw';
import { getAllActiveMembersContact } from 'backend/backMember.jsw';
import { getLabelObjects } from 'backend/backNotices.web';

export const testEmail2 = webMethod(
  Permissions.Anyone,
  async (pSubject) => {
    console.log("testEmail",pSubject);
	  const apiKey = await getSecret("sendGrid3");
  	sgMail.setApiKey(apiKey);
    const msg = {
      //to: ['juliaallen3@hotmail.com', 'allentrev88@gmail.com'],
      to: ['Trevor1 <allentrev88@gmail.com>','Trevor2 <allentrev88@outlook.com>'],
      from: 'maidenheadtownbc@gmail.com', // Change to your verified sender
      subject: pSubject,
      content: [
          {
              type: "text/html",
              value: "Hello world "
          }
      ],
    }//const
    console.log("msg");
    console.log(msg);
    return sgMail
    // @ts-ignore
    .send(msg, true)
    // eslint-disable-next-line no-unused-vars
    .then((res) => {
		  console.log("/backend/backMsg TESTEmail send OK" );
     })
    .catch( (error) => {
		  console.error("/backend/backMsg TESTEmail catch error, err" );
    	console.error(error)
      return {"status": false, "error": error}
    })
  }//async
)//webmethodvvv

/**
 * @typedef {Object} gControl
 * @property {string} id - The unique identifier for the recipient.
 * @property {string} contactpref - The contact preference of the recipient (e.g., 'E' for Email, 'S' for SMS).
 * @property {string} contactEmail - The email address of the recipient.
 * @property {string} mobilePhone - The mobile phone number of the recipient.
 * @property {string} toName - The full name of the recipient.
 * @property {string} urgent - Indicates whether the message is urgent ('Y' for yes, 'N' for no).
 * @property {string} senderName - The name of the sender.
 * @property {Array.<string>} toList - List of contact details for the message recipients.
 */

/**
 * 
 * @description Sends a message (An email, a WhatsApp msg, or SMS) to a person or jobholder
 * 
 * @function sendMsgToJob
 * @param {string} pType - Type of message to send E=Email, S=SMS, W=WhatsApp, U=User defined
 * @param {string[]} pJobKeys - An array of jobkeys identifying the jobs to be contacted
 * @param {string|null} pFromName - Name of the sender (if applicable).
 * @param {boolean} pUrgent - Indicates if the message is urgent.
 * @param {string} pTarget - Target of the message. This is the message name
 * @param {object} pParams - Additional parameters for the message.
 * @returns {Promise<{status: boolean, error: string|null}>} Returns a Promise that resolves to an object
 * with status indicating success or failure and an optional error message.
 */
export const sendMsgToJob = webMethod(
  Permissions.Anyone,
  async (pType, pJobKeys, pFromName, pUrgent, pTarget, pParams) => {
    console.log(
      "sendMsgToJob, pType, JobKeys, From, Urgent, Target, Params",
      pType,
      pJobKeys,
      pFromName,
      pUrgent,
      pTarget,
      pParams
    );
    let wParams = {...pParams};
    let wResult={"status": false, "error": "Done nothing"};
    let wToList = [];
    for (let wJobKey of pJobKeys){
      if (wJobKey !== null) {
        wResult = await findOfficer(wJobKey);
        if (wResult && wResult.status){
          wToList.push(wResult.officer._id);
        } else {
          console.warn(`/backend/backMsg  sendMsgToJob couldn't find Officer, `,wJobKey);
          wResult = {"status": false, "error": wResult.error || "Result undefined"};
        }
      } else {
          console.warn(`/backend/backMsg  sendMsgToJob Job not set `, wJobKey);
          wResult = {"status": false, "error":"Job not set`"};
      }
    }
    
    if (wToList && wToList.length > 0) {
      wResult = await sendMsg(pType, wToList, pFromName, pUrgent, pTarget, wParams);
      if (wResult && wResult.status){
        console.warn(`/backend/backMsg  sendMsgToJob sendMsg sent OK, msgType, JobKey `, pTarget, pJobKeys);

        wResult = {"status": true, "error": null};
      } else {
        console.warn(`/backend/backMsg  sendMsgToJob sendMsg fail, msgType, JobKey `, pTarget, pJobKeys);
        wResult = {"status": false, "error": wResult.error || "Result undefined"};
      }
    }
    return wResult;
  } // async function
)

let gControl = {
  "id": "",
  "contactpref": "",
  "contactEmail": "",
  "mobilePhone": "",
  "toName": "",
  "urgent": "N",
  "senderName": "",
  "toList": [],
};
let gToEmailList = [];
let gToSMSList = [];
let gToWhatsAppList = [];

/**
 * Summary:	Sends a message to a person or job based on provided parameters.
 * 
 * Description:	Sends a message (An email, a WhatsApp msg, or SMS) to a person or jobholder
 * 
 * @function
 * @param {string} pType - Type of message to send E=Email, S=SMS, W=WhatsApp, U=User defined
 * @param {Array.<string>} pToList - An array of member Ids or email addresses identifying the members to be contacted
 * @param {string|null} pFromName - Name of the sender (if applicable).
 * @param {boolean} pUrgent - Indicates if the message is urgent.
 * @param {string} pTarget - Target of the message. This is the message name
 * @param {object} pParams - Additional parameters for the message.
 * @returns {Promise<{status: boolean, error: string|null}>} Returns a Promise that resolves to an object
 * with status indicating success or failure and an optional error message.
 */
export const sendMsg = webMethod(
  Permissions.Anyone,
  async (pType, pToList, pFromName, pUrgent, pTarget, pParams) => {

    const wParams = { ...pParams };
    const wTarget = pTarget;
    
    console.log("sendMsg, pType, ToList, From, Urgent, Target, Params",
      pType, pToList, pFromName, pUrgent, wTarget);
    console.log(wParams);
    
    //console.log("sendMsg", wParams);
    gToEmailList = [];
    gToSMSList = [];
    gToWhatsAppList = [];
  
    let wMsgType = "";
    let wContactPref = "";

    gControl.senderName = pFromName;

    for (let wElement of pToList){
      console.log("sendMsg FOr Loop iteration");
      if (wElement === "<All>") {
        // do all club members
        await processAllList();
        break;
      } else if (wElement.includes("@")) {
        //do email element
        [wMsgType, wContactPref] = await processEmailElement(pType, pUrgent, pFromName, wElement);
      } else if (wElement.includes("<")) {
        // do label 
        await processLabelList(pType, pUrgent, pFromName, wElement);
        break;
      } else {
        // do send list  
        [wMsgType, wContactPref] = await processMemberElement(pType, pUrgent, pFromName, wElement);
      }
      await doMsgSortingOffice(wMsgType,wContactPref);
    }

    const wResult1 = await doSendEmail(wTarget, wParams);
    const wResult2 = await doSendSMS(wTarget, wParams);
    const wResult3 = await doSendWhatsApp(wTarget, wParams);
    console.log("Results");
    console.log(wResult1);
    console.log(wResult2);
    console.log(wResult3);
  
    return { "status": true, "error": null };
  } // async function
)

/**
 * Processes all active members and updates global contact lists for email, SMS, and WhatsApp.
 *
 * @async
 * @function
 * @returns {Promise<void>} A promise that resolves when all contact lists have been updated.
 *
 * @description
 * - Calls `getAllActiveMembersContact` to retrieve lists of active members' contact details.
 * - Merges the retrieved email, SMS, and WhatsApp contact lists with existing global lists using `_.union` to avoid duplicates.
 * - Updates the global variables `wToEmailList`, `wToSMSList`, and `wToWhatsAppList` with the merged lists.
 */
export async function processAllList(){
  console.log(
    "processAllList");
  
  let [wEmailMembers, wSMSMembers, wWhatsAppMembers, wNoneMembers ] = await getAllActiveMembersContact();
  gToEmailList = _.union(gToEmailList, wEmailMembers);
  gToSMSList = _.union(gToSMSList, wSMSMembers);
  gToWhatsAppList = _.union(gToWhatsAppList, wWhatsAppMembers);
  
  return true;

}

/**
 * Processes a string containing labels to extract and format email entries.
 *
 * @async
 * @function
 * @param {string} pElement - A string containing labels enclosed in `<` and `>`.
 * @returns {Promise<boolean>} A promise that resolves to `true` once the processing is complete.
 *
 * @description
 * - Extracts substrings enclosed in `<` and `>` from the input string.
 * - Fetches label objects for each extracted label using the `getLabelObjects` function.
 * - Formats the fetched objects into email entries (`name<email>`) and removes duplicates.
 * - Stores the unique email entries in the global `wToEmailList` variable.
 * - Logs the resulting list of email entries.
 */
export async function processLabelList(pType, pUrgent, pFromName, pElement) {
  console.log(
    "processLabelList, Element",
    pElement);

  let wMatches = pElement.match(/<([^>]+)>/g);
  let wToAddList = [];
  if (wMatches) {
    let wMatchesText = wMatches.map(match => match.slice(1, -1));
    for (let wMatch of wMatchesText){
      let wResult = await getLabelObjects(wMatch);
      if (wResult && wResult.objects.length > 0){
        let wObjectList = wResult.objects;
        console.log("ObjectList", wObjectList);
        for (let wMember of wObjectList) {
          let [ wMsgType, wContactPref] = await processMemberElement(pType, pUrgent, pFromName, wMember.memberId);
          await doMsgSortingOffice(wMsgType, wContactPref);
        }
      }
    }
    console.log("processLabelList, wToEMailList, sms, WA");
    console.log(gToEmailList);
    console.log(gToSMSList);
    console.log(gToWhatsAppList);
  }
  return true;
}
export function expandLabelObject(){
  
}

export async function processMemberElement(pType, pUrgent, pFromName, pMemberId){
  console.log(
    "processMemberElement, Type, Urgent, FromName, MemberID",
    pType, pUrgent, pFromName, pMemberId);
  
    let wResult = await findLstMember(pMemberId);
  let wMsgType = "";
  let wContactPref = "";
  if (wResult && wResult.status) {
    //let wContactPref = wResult.member.contactpref;
    let wContactEmail = wResult.member.contactEmail;
    let wMobilePhone = wResult.member.mobilePhone;
    let wToName = wResult.member.firstName + " " + wResult.member.surname;

    [wMsgType, wContactPref] = await validateMsgTypeAndContactPref(pType, wResult.member);
    gControl.id = wResult.member._id;
    gControl.contactpref = wContactPref;
    gControl.contactEmail = wContactEmail;
    gControl.mobilePhone = wMobilePhone;
    gControl.toName = wToName;
    gControl.urgent = pUrgent;
    gControl.senderName = pFromName;
  } else {
    console.warn(`/backend/backMsg  processMemberElement couldn't find member, `, pMemberId);
  }
  return [wMsgType, wContactPref];
}

export async function processEmailElement(pType, pUrgent, pFromName, pEmail){
  // should never get here from Maintain Notice as S type converts to a list of memberIds
  console.log(
    "processEmailElement, Type, Urgent, FromName, MemberID",
    pType, pUrgent, pFromName, pMemberId);

  let wMsgType = "S";
  let wContactPref = "E";
  gControl.toName = "Trevor Allen";
  console.log("backend/backMsg processEmailElement flow control issue ", pEmail);
  gControl.contactEmail = "allentrev88@gmail.com";
  return [wMsgType, wContactPref];
}

export async function doMsgSortingOffice(pMsgType, pContactPref){
  console.log(
    "doMsgSortingOffice, MsgType, ContactPref",
    pMsgType, pContactPref);

  let wToEmailEntry = `${gControl.toName}<${gControl.contactEmail}>`;
  let wToSMSEntry = { "name": gControl.toName, "mobile": gControl.mobilePhone };
  let wToWhatsAppEntry = { "name": gControl.toName, "mobile": gControl.mobilePhone };

  switch (pMsgType) {
    case "E":
      gToEmailList.push(wToEmailEntry);
      break;
    case "S":
      gToSMSList.push(wToSMSEntry);
      break;
    case "U":
      switch (pContactPref) {
        case "E":
          gToEmailList.push(wToEmailEntry);
          break;
        case "S":
          gToSMSList.push(wToSMSEntry);
          break;
        case "W":
          gToWhatsAppList.push(wToWhatsAppEntry);
          break;
        case "B":
          gToEmailList.push(wToEmailEntry);
          gToSMSList.push(wToSMSEntry);
          break;
        case "N":
          // Do nothing
          break;
        default:
          console.warn(`/backend/backMsg  sendMsg fail, invalid contactpref`, pContactPref);
          break;
      } // contactpref switch
      break;
    default:
      console.warn(`/backend/backMsg  sendMsg fail, invalid type [${pMsgType}]`);
      break;
  } // type switch
  return true;
}

export async function validateMsgTypeAndContactPref(pType, pMember){
  console.log(
    "validateMsgTypeAndContactPref, Type, Member",
    pType, pMember);
  let wMsgType = "U";
  let wContactPref = "N";
  const wContactEmail = pMember.contactEmail;
  const wMobilePhone = pMember.mobilePhone;
  const isValidEmail = (wContactEmail === "" || wContactEmail === null || wContactEmail === undefined) ? false : true;
  const isValidMobile = (wMobilePhone === "" || wMobilePhone === null || wMobilePhone === undefined ) ? false : true;
  if (isValidEmail || isValidMobile){
    wContactPref = pMember.contactpref;
    wMsgType =pType;
  }
  return [wMsgType, wContactPref];
}

/**
 * Sends an email to a specified target using the provided parameters.
 *
 * @async
 * @function
 * @param { string } pTarget - The target type of the email(e.g., a specific email template or category).
 * @param { object } pParams - The parameters for the email content and additional configurations.
 * @returns {Promise<object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the email was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 */
async function doSendEmail(pTarget, pParams){
  console.log(
    "doSendEmail, pTarget, Params, length",
    pTarget, pParams, gToEmailList.length);
  
  let wEmailResult = {};

  if (gToEmailList && gToEmailList.length > 0) {
    let wEmailControl = { ...gControl };
    wEmailControl.toList = [...gToEmailList];
    if (gToEmailList.length > 1){
      wEmailControl.toName = "All"
    }

    const wResult = await sendEmail(pTarget, wEmailControl, pParams);
    if (wResult && wResult.status) {
      console.warn(`/backend/backMsg  sendMsg sendEmail sent OK, msgType, JobKey `, pTarget);
      wEmailResult = { "status": true, "error": null };
    } else {
      console.warn(`/backend/backMsg  sendMsg sendEmail fail, msgType, JobKey `, pTarget);
      wEmailResult = { "status": false, "error": wEmailResult.error || "Result undefined" };
    }
  } else {
    wEmailResult = { "status": true, "error": "Nothing to process" };
  }
  return wEmailResult;
}

async function doSendSMS(pTarget, pParams) {
  console.log(
    "doSendSMS, pTarget, Params, length",
    pTarget, pParams, gToSMSList.length);
  
  let wSMSResult = {};
  
  if (gToSMSList && gToSMSList.length > 0) {
    let wSMSControl = { ...gControl };
    wSMSControl.toList = [...gToSMSList];
    const wResult = await sendSMS(pTarget, wSMSControl, pParams);
    if (wResult && wResult.status) {
      console.warn(`/backend/backMsg  sendMsg sendSMS sent OK, msgType, JobKey `, pTarget);
      wSMSResult = { "status": true, "error": null };
    } else {
      console.warn(`/backend/backMsg  sendMsg sendSMS fail, msgType, JobKey `, pTarget);
      wSMSResult = { "status": false, "error": wSMSResult.error || "Result undefined" };
    }
  } else {
    wSMSResult = { "status": true, "error": "Nothing to process" };
  }
  return wSMSResult;
}

async function doSendWhatsApp(pTarget, pParams) {
  console.log(
    "doSendWhatsApp, pTarget, Params, length",
    pTarget, pParams, gToWhatsAppList.length);
  
  let wWhatsAppResult = {};
  
  if (gToWhatsAppList && gToWhatsAppList.length > 0) {
    let wWhatsAppControl = { ...gControl };
    wWhatsAppControl.toList = [...gToWhatsAppList];
    const wResult = await sendWhatsApp(pTarget, wWhatsAppControl, pParams);
    if (wResult && wResult.status) {
      console.warn(`/backend/backMsg  sendMsg sendWhatsApp sent OK, msgType, JobKey `, pTarget);
      wWhatsAppResult = { "status": true, "error": null };
    } else {
      console.warn(`/backend/backMsg  sendMsg sendWhatsApp fail, msgType, JobKey `, pTarget);
      wWhatsAppResult = { "status": false, "error": wWhatsAppResult.error || "Result undefined" };
    }
  } else {
    wWhatsAppResult = { "status": true, "error": "Nothing to process" };
  }
  return wWhatsAppResult;
}

//----------------------------------------------------------------------------------------------------------------------------
/**
 * Sends an email to a list of recipients based on the provided control parameters.
 * 
 * @async
 * @function sendEmail
 * @param {string} pTarget - The target identifier for the email.
 * @param {object} pControl - Control parameters for sending the email.
 * @param {string[]} pControl.toList - The list of email recipients.
 * @param {object} pParams - Additional parameters for the email.
 * 
 * @returns {Promise<object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the email was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendEmail (pTarget, pControl, pParams) {

    console.log(
      "sendEmail, pTarget, Control, Params",
      pTarget, pControl, pParams );
  
      const wTo = pControl.toList;
  
  let wResult = {};

  const wResult1 = await createEmail(pTarget, pControl, pParams);
  if (wResult1 && wResult1.status){
    console.log("after create email");
    console.log(wResult1);
    const wSubject = wResult1.email.subject;
    const wBody = wResult1.email.body;
    const wResult2 = await transmitEmail(wTo, wSubject, wBody);  
    if (wResult2 && wResult2.status){
      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendEmail transmitEmail failed, error`);
      console.log(wResult.error || "Result undefined");
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }
  } else {
    console.warn(`/backend/backMsg  sendEmail createEmail failed, error`);
    console.log(wResult.error || "Result undefined");
    wResult = {"status": false, "error": wResult.error || "Result undefined"};
  }
  
  return wResult;
}
/**
 * Sends an SMS message to a list of recipients based on the provided control parameters.
 * 
 * @async
 * @function sendSMS
 * @param {string} pTarget - The target identifier for the SMS.
 * @param {Object} pControl - Control parameters for sending the SMS.
 * @param {Object[]} pControl.toList - The list of SMS recipients.
 * @param {Object} pParams - Additional parameters for the SMS.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the SMS was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendSMS (pTarget, pControl, pParams) {

  console.log(
    "sendSMS, pTarget, Control, Params",
    pTarget, pControl, pParams);

  
  const wToList = pControl.toList;  // in the form {name, phone number}
  const wTo = wToList.map( item => item.mobile);
  
  let wResult = {};
  //if (wTo.startsWith("+")) {}
  //wTo = "+6593210160";

  const wResult1 = await createSMS(pTarget, pControl, pParams);
  if (wResult1 && wResult1.status){
    console.log("After create SMS");
    console.log(wResult1);
    const wSubject = wResult1.sms.subject;
    const wMessage = wResult1.sms.body;
    const wResult2 = await transmitSMS(wTo, wSubject + "\n" + wMessage);  
    if (wResult2 && wResult2.status){
      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendSMS transmitSMS failed, error`);
      console.log(wResult.error || "Result undefined");
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }
  } else {
    console.warn(`/backend/backMsg  sendSMS createSMS failed, error`);
    console.log(wResult.error || "Result undefined");
    wResult = {"status": false, "error": wResult.error || "Result undefined"};
  }
  return wResult;
}
/**
 * Sends a WhatsApp message to a list of recipients based on the provided control parameters.
 * 
 * @async
 * @function sendWhatsApp
 * @param {string} pTarget - The target identifier for the WhatsApp.
 * @param {Object} pControl - Control parameters for sending the WhatsApp.
 * @param {Object[]} pControl.toList - The list of WhatsApp recipients.
 * @param {Object} pParams - Additional parameters for the WhatsApp.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the WhatsApp was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendWhatsApp (pTarget, pControl, pParams) {

  const wToList = pControl.toList;  // in the form {name, phone number}
  // eslint-disable-next-line no-unused-vars
  const wTo = wToList.map( item => item.mobile);
  
  let wResult = {};

  //if (wTo.startsWith("+")) {}
  //wTo = "+6593210160";
  const wResult1 = await createSMS(pTarget, pControl, pParams);
  if (wResult1 && wResult1.status){
    // eslint-disable-next-line no-unused-vars
    const wSubject = wResult1.sms.subject;
    // eslint-disable-next-line no-unused-vars
    const wMessage = wResult1.sms.body;
    const wResult2 = await transmitWhatsApp(wTo, wSubject + "\n" + wMessage);  
    if (wResult2 && wResult2.status){
      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendWhatsApp transmitWhatsAppSMS failed, error`);
      console.log(wResult.error || "Result undefined");
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }
  } else {
    console.warn(`/backend/backMsg  sendWhatsApp createWhatsAppSMS failed, error`);
    console.log(wResult.error || "Result undefined");
    wResult = {"status": false, "error": wResult.error || "Result undefined"};
  }
  return wResult;
}

//----------------------------------------------------------------------------------------------------------------------------
/**
 * Creates an email object based on the specified target type and parameters.
 *
 * @param {string} pTarget - The target name of the email.
 * @param {object} pControl - An object containing paramters to control the generation of the email.
 * @param {object} pParams - An object containing paramters that format the email.
 * @returns {object} An object representing the email, containing:
 *                   - `status` (string): The status of the function.
 *                   - `email` (object): An object containg the email subject and body.
 *                   - `error` (string): An error message or null.
 */
async function createEmail(pTarget, pControl, pParams){
  
    console.log(
      "createEmail, pTarget, Control, Params",
      pTarget, pControl, pParams );

  let wError = null;
  let wEmail = {};
  let wParameters = {};
  let wBody = "";
  let wStatus = false;
  
  switch (pTarget) {
    case "Blank_1":
      wStatus = true;
      wParameters.subject = pParams.subject;
      wParameters.toName = pControl.toName;
      wParameters.body = pParams.body;
      wEmail = await Blank1_Email(wParameters);
      wError = null;
      break;
    case "Profile_1":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.member = pParams.memberFullName;
      wParameters.changeList = pParams.changeList;
      wEmail = await Profile1_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    case "MemberRegistrationConfirmation":
      wStatus = true;
      wParameters.firstName = pParams.firstName;
      wParameters.isAudit = pParams.isAudit;
      wParameters.loginEmail = pParams.loginEmail;
      wParameters.username = pParams.username;
      wParameters.method = pParams.loginMethod;
      wEmail = MemberRegistrationConfirmation_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    case "OffLineRegistrationConfirmation":
      wStatus = true;
      wParameters.firstName = pControl.toName;
      wParameters.targetName = pParams.targetName;
      wParameters.username = pParams.username;
      wEmail = OffLineRegistrationConfirmation_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    case "BookingConfirmation":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.firstName = pParams.firstName;
      wParameters.dateBooked = pParams.dateBooked;
      wParameters.bookingRef = pParams.bookingRef;
      wParameters.dateRequired = pParams.dateRequired;
      wParameters.slot = pParams.slot;
      wParameters.rink = pParams.rink;
      wParameters.playersMessage = pParams.playersMessage;
      wParameters.usage = pParams.usage;
      wParameters.playerA = pParams.playerA;
      wParameters.playerB = pParams.playerB;
      wEmail = BookingConfirmation_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    case "MemberAmendFieldValues":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.changeList = pParams.changeList;
      wEmail = MemberAmendFieldValues_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    case "MemberAmendImportName":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.oldName = pParams.oldName;
      wParameters.newName = pParams.newName;
      wEmail = MemberAmendImportName_Email(wParameters); //{sunject, body}
      wError = null;
      break;
    default:
      console.warn(
        `/backend/backMsg  createEmail invalid Email Target`,
        pTarget
      );
      wStatus = false;
      wError = "Invalid email target";
      break;
  }
  const wSubject = (pControl.urgent === "Y") ? "URGENT [MTBC] " + wEmail.subject : "[MTBC] " + wEmail.subject;
 
  if (pControl.senderName) {
    wBody = `
    ${wEmail.body}
    <br><br>
    Regards,<br>
    ${pControl.senderName},<br>
    Maidenhead Town Bowls Club<br>
    `
  } else {
    wBody =`
    ${wEmail.body}
    <br><br>
    Regards,<br>
    The Secretary,<br>
    Maidenhead Town Bowls Club<br>
    `
  }
  wEmail.subject = wSubject;
  wEmail.body = wBody;
  return {"status": wStatus, "email": wEmail, "error": wError }
}

async function createSMS(pTarget, pControl, pParams){

  console.log(
    "createSMS, pTarget, Control, Params",
    pTarget, pControl, pParams);

  let wError = null;
  let wSMS = {};
  let wParameters = {};
  let wStatus = false;
  
  switch (pTarget) {
    case "Blank_1":
      wStatus = true;
      wParameters.subject = pParams.subject;
      wParameters.body = pParams.body;
      wParameters.summary = pParams.summary;
      wSMS = await Blank1_SMS(wParameters);
      wError = null;
      break;
    case "Profile_1":
      wStatus = true;
      wSMS = await Profile1_SMS(pParams.memberFullName);   //{sunject, body}
      wError = null;
      break;
    case "MemberRegistrationConfirmation":
      wStatus = true;
      wSMS = MemberRegistrationConfirmation_SMS(pParams.username);   //{sunject, body}
      wError = null;
      break;
    case "BookingConfirmation":
      wStatus = true;
      wSMS = BookingConfirmation_SMS(pParams);   //{sunject, body}
      wError = null;
      break;
    case "MemberAmendFieldValues":
      wStatus = true;
      wSMS = MemberAmendFieldValues_SMS();   //{sunject, body}
      wError = null;
      break;
    case "MemberAmendImportName":
      wStatus = true;
      wSMS = MemberAmendImportName_SMS(pParams);   //{sunject, body}
      wError = null;
      break;
    default:
      console.warn(`/backend/backMsg  creatSMS invalid Email Target`, pTarget);
      wStatus = false;
      wError = "Invalid SMS target";
     break;
  }
  return {"status": wStatus, "sms": wSMS, "error": wError }
}

//--------------------------------- Messages -----------------------------------------------------------------------------------------
/**
 * Generates an email object with a formatted subject and HTML body.
 *
 * @param {Object} pParameters - The parameters for creating the email.
 * @param {string} pParameters.subject - The subject of the email.
 * @param {string} pParameters.toName - The recipient's name to be included in the email body.
 * @param {string} pParameters.body - The main content of the email body.
 * @returns {object} An object representing the email, containing:
 *                   - `subject` (string): The subject of the email.
 *                   - `body` (string): The HTML-formatted email body.
 */
async function Blank1_Email(pParameters) {
  console.log(
    "Blank1_Email, Parameters",
    pParameters);

  const wSubject = pParameters.subject;
  const wToName = pParameters.toName;
  const wText = pParameters.body;
  const wBody = `
  <p>Dear ${wToName},</p>
	${wText}<br>
  `
  const wEmail = { "subject": wSubject, "body": wBody };

  return wEmail;
}

async function Blank1_SMS(pParameters) {
  console.log(
    "Blank1_SMS, Parameters",
    pParameters);

  const wSubject = pParameters.subject;
  const wBody = pParameters.body;
  const wSummary = pParameters.summary;
  let wOutput = (wSummary && wSummary.length > 0)? wSummary : wBody;
  const wSMS = { "subject": wSubject, "body": wOutput };
  return wSMS;
}

function Profile1_Email(pParameters) {
  const wSubject = "Profile Update Notification";
  const wToName = pParameters.toName;
  const wMember = pParameters.member;
  const wChangeList = pParameters.changeList;
  const wBody = `
  <p>Dear ${wToName},</p>
	This is to inform you that ${wMember} has modified their personal profile. <br><br>
	The following changes were made:<br><br>
  ${wChangeList}<br>
  Please reconcile any changes with the membership spreadsheet.
  `
  const wEmail = {"subject": wSubject,"body": wBody};

  return wEmail;
}

function Profile1_SMS(pMember) {
  const wSubject = "Profile Update Notification";
  const wBody = `${pMember} has modified their personal profile.Please reconcile any changes with the membership spreadsheet.`
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
}

function MemberAmendImportName_Email(pParameters) {
  const wSubject = "Maintain Member: Name Update";
  const wToName = pParameters.toName;
  const wOldName = pParameters.oldName;
  const wNewName = pParameters.newName;
  const wBody = `
  <p>Dear ${wToName},</p>
	The following member's name needs to be updated in the Membership spreadsheet:<br>
  From ${wOldName} to ${wNewName}<br>
  `
  const wEmail = {"subject": wSubject,"body": wBody};

  return wEmail;
}

function MemberAmendImportName_SMS(pMember) {
  const wSubject = "Name Update";
  const wBody = `Change name from ${pMember} to ${pMember}`
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
}

function MemberAmendFieldValues_Email(pParameters) {
  const wSubject = "Maintain Member: Field Value Update";
  const wToName = pParameters.toName;
  const wChangeList = pParameters.changeList;
  let wLines = "";
  for (let wEntry of wChangeList){
    wLines = wLines + wEntry + "<br>";
  }
  let wInsert = wLines.replace(/\n/g, '<br>');

  const wBody = `
  <p>Dear ${wToName},</p>
	The following changes were made while synchronising Lst with Imported values;<br><br>
  ${wInsert}
  `
  const wEmail = {"subject": wSubject,"body": wBody};

  return wEmail;
}

function MemberAmendFieldValues_SMS() {
  const wSubject = "Field Value Update";
  const wBody = `Please see log for changes`
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
}

function MemberRegistrationConfirmation_Email(pParameters) {
  console.log("MeberRegistrationConfirmation_Email, Params", pParameters );
  const wSubject = "Registration Confirmation";
  const pIsAudit = pParameters.isAudit;
  let wLogInMethod = "Login Email Address";
  let wLogInItem = pParameters.loginEmail;
  let wFirstLine = (pIsAudit)? "As part of the annual membership audit, it has been necessary to replace your existing web account with a new one.\n"
                              : "";
  if (pParameters.method === "U") {
		wLogInMethod = "Username";
		wLogInItem = pParameters.username;
	}
  const wBody = `
  <P>Dear ${pParameters.firstName},</p>
	${wFirstLine}
	This is to confirm that you have been registered with the club's web site.<br>
	To log in to the site please use your ${wLogInMethod} of "${wLogInItem}".<br>
	The first time you try to log in, you will be asked to reset the temporary password that has been assigned to you.<br>
	Simply follow the instructions that will be displayed on your screen.<br>
	Once you have changed your password, you will be a fully registered member and you should then be able to sign onto the site as per normal<br>
	When you are fully registered, you may also change your Username using Log In and selecting "Change Username" instead of "Log In".<br><br>
`
  const wEmail = {"subject": wSubject,"body": wBody};

  return wEmail;
}

function MemberRegistrationConfirmation_SMS(pParameters) {
  const wSubject = "Registration Confirmation\n";
  const wBody = `Username is ${pParameters.username}\n
  Please login to complete registration\n
  `
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
}

function OffLineRegistrationConfirmation_Email(pParameters) {
  console.log("OfflineRegistrationConfirmation_Email, Params", pParameters);
  const wSubject = "Offline Registration Confirmation";

  const wBody = `
  <P>Dear ${pParameters.firstName},</p>
	The new member ${pParameters.targetName} has been registered but cannot receive any confirmation.<br>
	Can you please arrange for them to be informed that they need to use their username of "${pParameters.username}".<br>
	Remind them that the first time they try to log in, they will be asked to reset the temporary password that has been assigned to them.<br>
	They then simply need to follow the instructions that will be displayed on their screen.<br> 
	Once the password has been set, they will be a fully registered member and should then be able to sign onto the site as per normal<br><br>
	`
  const wEmail = { subject: wSubject, body: wBody };

  return wEmail;
}

function BookingConfirmation_Email(pParameters) {
  //console.log("BookingConfirmationEmail", pParameters);
  const wSubject = "Booking Confirmation";
  const wBody = `
  <P>Dear ${pParameters.firstName},</p>
	This is to confirm that you booked a rink at the club. The details of the booking made are:<br><br>
	Booked on Date: ${pParameters.dateBooked},<br>
	Booking reference: ${pParameters.bookingRef}<br><br>
	Date required: ${pParameters.dateRequired}<br>
	Time slot: ${pParameters.slot}<br>
	Nominal rink: ${pParameters.rink}<br>
	Number of players: ${pParameters.playersMessage}<br><br>
  Usage: ${pParameters.usage}<br><br>
	Player A: ${pParameters.playerA}<br>
	Player B: ${pParameters.playerB}<br><br>
	If you have not booked this event, then please contact the club immediately.<br>
	You may go to the website to delete or edit this booking up to the date of the booking.<br><br><br>
	The committee reserves the right to cancel this booking and to re-allocate this rink for another use, should a priority need arise.<br><br>
	Thank you for using the booking system
  `
  const wEmail = {"subject": wSubject,"body": wBody};
  return wEmail;
}


function BookingConfirmation_SMS(pParameters) {
  //console.log("BookingConfirmation_SMS", pParameters);
  const wSubject = "Booking Confirmation";
  const wBody = `
	Date: ${pParameters.dateRequired}\n
	Slot: ${pParameters.slot}\n
	Rink: ${pParameters.rink}\n
	If you have not booked this event, then please contact the club immediately.\n
  `
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
}

//====================================================================================================================================
export async function transmitEmail(pToList, pSubject, pMsg) {

  console.log(
      "transmitEmail, pToList, Subject, Msg",
      pToList, pSubject, pMsg );
  
  //let wX = ['Jane Allen<allentrev88@gmail.com>', 'Julia Allen<allentrev88@outlook.com>', 'Trevor Allen<juliayeo3@gmail.com>'];
	//console.log(wX);
  //console.log(pToList.toString());
  let wToList = [];
  for (let x of pToList){
    wToList.push(String(x));
  }
  //console.log(wToList);
  
  // If there are more than 12 addresses in the to list, then set the isMultiple flag so that rewcipients do not see the whole To
  // list on their email
  const apiKey = await getSecret("sendGrid3");
  const wIsMultiple = (wToList.length > 12) ? true : false;

	await sgMail.setApiKey(apiKey);
	const msg = {
    //to: pToList,
    to: wToList,
    cc: 'maidenheadtownbc@gmail.com',
    from: 'maidenheadtownbc@gmail.com', // Change to your verified sender
    subject: pSubject,
    isMultiple: wIsMultiple,
		content: [
    		{
      			type: "text/html",
      			value: pMsg
	  		}
  	],
	}
	return (
    sgMail
      // @ts-ignore
      .send(msg)
      .then(() => {
        return { "status": true, "error": null };
      })
      .catch((error) => {
        console.error("/backend/backMsg transmitEmail catch error, err, msg");
        console.error(error || "Error undefined");
        console.log(msg);
        return { "status": false, "error": error || "Error undefined" };
      })
  );
}

export async function transmitSMS( pTo, pMsg) {
  console.log(
    "transmitSMS, pTo, Msg",
    pTo, pMsg);
  
  let wTo = String(pTo[0]);
  let fromPhone = await getSecret('fromPhone');
  //let fromPhone = "MTBC";
	const accountSID = await getSecret('accountSID');
	const authToken = await getSecret('authToken');
  if (wTo && !wTo.startsWith("+")) {
    let wNo = wTo.slice(1);
    wTo = "+44" + wNo;
  }
  const client = twilio(accountSID, authToken);
  //client.region = 'IE1';
  //client.edge = 'dublin';
    
	try {
      await client.messages.create({
            body: pMsg,
            from: fromPhone,
            to: wTo
      });
      return {"status": true, "error": null}
  }
	catch (error) {
    	console.log( `/backend/backMSg transmitSMS Failed to send SMS , error`);
      console.log(error);
      return {"status": false, "error": error}
  }
}

