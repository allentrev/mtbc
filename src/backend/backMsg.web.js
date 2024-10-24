
import { Permissions, webMethod } from "wix-web-module";
import { getSecret }			from 'wix-secrets-backend';

import twilio from 'twilio';
import  sgMail 					from '@sendgrid/mail';

import { findOfficer }			from 'backend/backOfficers.jsw';
import { findLstMember }			from 'backend/backMember.jsw';

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
    .send(msg, true)
    .then((res) => {
		  console.log("/backend/backMsg TESTEmail send OK" );
     })
    .catch( (error) => {
		  console.error("/backend/backMsg TESTEmail catch error, err" );
    	console.error(error)
      return {"status": false, "error": error}
    })
  }//async
)//webmethod

/**
 * @typedef {Object} wControl
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


/**
 * Summary:	Sends a message to a person or job based on provided parameters.
 * 
 * Description:	Sends a message (An email, a WhatsApp msg, or SMS) to a person or jobholder
 * 
 * @function
 * @param {string} pType - Type of message to send E=Email, S=SMS, W=WhatsApp, U=User defined
 * @param {Array.<string>} pToList - An array of member Ids identifying the members to be contacted
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

    let wParams = {...pParams};
    //console.log("sendMsg", wParams);
    let wControl = {
      "id": "",
      "contactpref": "",
      "contactEmail": "",
      "mobilePhone": "",
      "toName": "",
      "urgent": "N",
      "senderName": "",
      "toList": [],
    };
    let wToEmailList = [];
    let wToSMSList = [];
    let wToWhatsAppList = [];
  
    let wResult = {"status": true, "error": null};
    let wEmailResult = {"status": true, "error": null};
    let wSMSResult = {"status": true, "error": null};
    let wWhatsAppResult = {"status": true, "error": null};

    for (let wMemberId of pToList){
      wResult = await findLstMember(wMemberId);
      if (wResult && wResult.status){
        
        let wContactPref = wResult.member.contactpref;
        let wContactEmail = wResult.member.contactEmail;
        let wMobilePhone = wResult.member.mobilePhone;
        let wToName = wResult.member.firstName + " " + wResult.member.surname;

        wControl.id = wResult.member._id;
        wControl.contactpref = wContactPref;
        wControl.contactEmail = wContactEmail;
        wControl.mobilePhone = wMobilePhone;
        wControl.toName = wToName;
        wControl.urgent = pUrgent;
        wControl.senderName = pFromName;
    
        let wToEmailEntry = `${wToName}<${wContactEmail}>`;
        let wToSMSEntry = {"name": wToName, "mobile": wMobilePhone};
        let wToWhatsAppEntry = {"name": wToName, "mobile": wMobilePhone};
        switch (pType) {
          case "E":
            wToEmailList.push(wToEmailEntry);
            break;
          case "S":
            wToSMSList.push(wToSMSEntry);
            break;
          case "U":
            switch (wContactPref) {
              case "E":
                wToEmailList.push(wToEmailEntry);
                break;
              case "S":
                wToSMSList.push(wToSMSEntry);
                break;
              case "W":
                wToWhatsAppList.push(wToWhatsAppEntry);
                break;
              case "B":
                wToEmailList.push(wToEmailEntry);
                wToSMSList.push(wToSMSEntry);
                break;
              case "N":
                wResult = {"status": true, "error": null};
                break;
              default:
                console.warn(`/backend/backMsg  sendMsg fail, invalid contactpref`, wContactPref);
                wResult = {"status": false, "error": "Invalid contactpref"};
                break;
            } // contactpref switch
            break;
          default:
            console.warn(`/backend/backMsg  sendMsg fail, invalid type [${pType}]`);
            wResult = {"status": false, "error": "Invalid Type"};
            break;
        } // type switch
      } else {
        console.warn(`/backend/backMsg  sendMsg couldn't find member, `,wMemberId);
      }
    } // For

    if (wToEmailList && wToEmailList.length > 0) {
      let wEmailControl = {...wControl};
      wEmailControl.toList =[...wToEmailList];
    
      wEmailResult = await sendEmail(pTarget, wEmailControl, wParams);
      if (wEmailResult && wEmailResult.status){
        console.warn(`/backend/backMsg  sendMsg sendEmail sent OK, msgType, JobKey `, pTarget);
        wEmailResult = {"status": true, "error": null};
      } else {
        console.warn(`/backend/backMsg  sendMsg sendEmail fail, msgType, JobKey `, pTarget);
        wEmailResult = {"status": false, "error": wEmailResult.error || "Result undefined"};
      }
    }

    if (wToSMSList && wToSMSList.length > 0) {
      let wSMSControl = {...wControl};
      wSMSControl.toList = [...wToSMSList];
      wSMSResult = await sendSMS(pTarget, wSMSControl, wParams);
      if (wSMSResult && wSMSResult.status){
        console.warn(`/backend/backMsg  sendMsg sendSMS sent OK, msgType, JobKey `, pTarget);

        wSMSResult = {"status": true, "error": null};
      } else {
        console.warn(`/backend/backMsg  sendMsg sendSMS fail, msgType, JobKey `, pTarget);
        wSMSResult = {"status": false, "error": wSMSResult.error || "Result undefined"};
      }
    }

    if (wToWhatsAppList && wToWhatsAppList.length > 0) {
      let wWhatsAppControl = {...wControl};
      wWhatsAppControl.toList = [...wToWhatsAppList];
      wWhatsAppResult = await sendWhatsApp(pTarget, wWhatsAppControl, wParams);
      if (wWhatsAppResult && wWhatsAppResult.status){
        console.warn(`/backend/backMsg  sendMsg sendWhatsApp sent OK, msgType, JobKey `, pTarget);
        wWhatsAppResult = {"status": true, "error": null};
      } else {
        console.warn(`/backend/backMsg  sendMsg sendWhatsApp fail, msgType, JobKey `, pTarget);
        wWhatsAppResult = {"status": false, "error": wWhatsAppResult.error || "Result undefined"};
      }
    }

    if (!wEmailResult.status || !wSMSResult.status || !wWhatsAppResult.status) {
      wResult.status =false;
      wResult.error = "A failure occurred. Please check logs";
    }

    return wResult;
  } // async function
)

//----------------------------------------------------------------------------------------------------------------------------
/**
 * Sends an email to a list of recipients based on the provided control parameters.
 * 
 * @async
 * @function sendEmail
 * @param {string} pTarget - The target identifier for the email.
 * @param {Object} pControl - Control parameters for sending the email.
 * @param {Array.<string>} pControl.toList - The list of email recipients.
 * @param {Object} pParams - Additional parameters for the email.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the email was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendEmail (pTarget, pControl, pParams) {

  const wTo = pControl.toList;
  let wResult = {};

  wResult = createEmail(pTarget, pControl, pParams);
  if (wResult && wResult.status){
    const wSubject = wResult.email.subject;
    const wBody = wResult.email.body;
    wResult = await transmitEmail(wTo, wSubject, wBody);  
    if (wResult && wResult.status){
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
 * @param {Array.<string>} pControl.toList - The list of SMS recipients.
 * @param {Object} pParams - Additional parameters for the SMS.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the SMS was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendSMS (pTarget, pControl, pParams) {

  const wTo = pControl.toList;
  let wResult = {};
  //if (wTo.startsWith("+")) {}
  //wTo = "+6593210160";

  wResult = createSMS(pTarget, pControl, pParams);
  if (wResult && wResult.status){
    const wSubject = wResult.sms.subject;
    const wMessage = wResult.sms.body;
    wResult = await transmitSMS(wTo, wSubject + "\n" + wMessage);  
    if (wResult && wResult.status){
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
 * @param {Array.<string>} pControl.toList - The list of WhatsApp recipients.
 * @param {Object} pParams - Additional parameters for the WhatsApp.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *                              - {boolean} status - Indicates if the WhatsApp was sent successfully.
 *                              - {string|null} error - Error message if the sending failed, otherwise null.
 * 
 */
async function sendWhatsApp (pTarget, pControl, pParams) {

  const wTo = pControl.toList;
  let wResult = {};

  //if (wTo.startsWith("+")) {}
  //wTo = "+6593210160";
  wResult = createSMS(pTarget, pControl, pParams);
  if (wResult && wResult.status){
    const wSubject = wResult.sms.subject;
    const wMessage = wResult.sms.body;
    //wResult = await transmitWhatsApp(wTo, wSubject + "\n" + wMessage);  
    if (wResult && wResult.status){
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

function createEmail(pTarget, pControl, pParams){
  
  let wError = null;
  let wEmail = {};
  let wParameters = {}
  let wBody = "";
  let wStatus = false;
  
  switch (pTarget) {
    case "Profile_1":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.member = pParams.memberFullName;
      wParameters.changeList = pParams.changeList;
      wEmail = Profile1_Email(wParameters);   //{sunject, body}
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
      wEmail = BookingConfirmation_Email(wParameters);   //{sunject, body}
      wError = null;
      break;
    case "MemberAmendFieldValues":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.changeList = pParams.changeList;
      wEmail = MemberAmendFieldValues_Email(wParameters);   //{sunject, body}
      wError = null;
      break;
    case "MemberAmendImportName":
      wStatus = true;
      wParameters.toName = pControl.toName;
      wParameters.oldName = pParams.oldName;
      wParameters.newName = pParams.newName;
      wEmail = MemberAmendImportName_Email(wParameters);   //{sunject, body}
      wError = null;
      break;
    case "Message":
      wStatus = true;
      wParameters.title = pParams.title;
      wParameters.text = pParams.text;
      wEmail = Message_Email(wParameters);   //{sunject, body}
      wError = null;
      break;  
    default:
      console.warn(`/backend/backMsg  createEmail invalid Email Target`, pTarget);
      wStatus = false;
      wError = "Invalid email target";
     break;
  }
  const wSubject = (pControl.urgent) ? "URGENT: " + wEmail.subject : wEmail.subject;
 
  if (pControl.sender) {
    wBody = `
    ${wEmail.body}
    <br><br>
    Regards,<br>
    ${pControl.sender},<br>
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

function createSMS(pTarget, pControl, pParams){

  let wError = null;
  let wSMS = {};
  let wStatus = false;
  
  switch (pTarget) {
    case "Profile_1":
      wStatus = true;
      wSMS = Profile1_SMS(pParams.memberFullName);   //{sunject, body}
      wError = null;
      break;
    case "BookingConfirmation":
      wStatus = true;
      wSMS = BookingConfirmation_SMS(pParams);   //{sunject, body}
      wError = null;
      break;
    case "MemberAmendFieldValues":
      wStatus = true;
      wSMS = MemberAmendFieldValues_SMS(pParams);   //{sunject, body}
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

//----------------------------------------------------------------------------------------------------------------------------

export async function transmitEmail(pToList, pSubject, pMsg) {

	const apiKey = await getSecret("sendGrid3");

	sgMail.setApiKey(apiKey);
	const msg = {
    to: pToList.toString(),
    from: 'maidenheadtownbc@gmail.com', // Change to your verified sender
    subject: pSubject,
		content: [
    		{
      			type: "text/html",
      			value: pMsg
	  		}
  	],
	}

	return sgMail
  	.send(msg)
  	.then(() => {
      return {"status": true, "error": null}
  	})
  	.catch((error) => {
		  console.error("/backend/backMsg transmitEmail catch error, err, msg" );
    	console.error(error || "Error undefined");
      console.log(msg);
      return {"status": false, "error": error || "Error undefined"}
    })
}

export async function transmitSMS( pTo, pMsg) {
  let wTo = pTo;
  let fromPhone = await getSecret('fromPhone');
  //let fromPhone = "MTBC";
	const accountSID = await getSecret('accountSID');
	const authToken = await getSecret('authToken');
  if (!pTo.startsWith("+")) {
    let wNo = pTo.slice(1);
    wTo = "+44"+ wNo;
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

//--------------------------------- Messages -----------------------------------------------------------------------------------------
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

function MemberAmendFieldValues_SMS(pMember) {
  const wSubject = "Field Value Update";
  const wBody = `Please see log for changes`
  const wSMS = {"subject": wSubject,"body": wBody};
  return wSMS;
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


function Message_Email(pParameters) {
  console.log("MessageEmail", pParameters);
  const wSubject = `${pParameters.title}`;
  const wBody = `
  <p>Dear All,</p>
	${pParameters.text}
  `
  const wEmail = {"subject": wSubject,"body": wBody};
  return wEmail;
}
