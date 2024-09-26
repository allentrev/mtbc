
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
 * Summary:	Sends a message to a person or job based on provided parameters.
 * 
 * Description:	Sends a message (An email, a WhatsApp msg, or SMS) to a person or jobholder
 * 
 * @function
 * @param {string} pType - Type of message to send.
 * @param {string|null} pJobKey - Key identifying the job (if applicable).
 * @param {string|null} pFromName - Name of the sender (if applicable).
 * @param {string|null} pToMemberId - Member ID of the recipient (if applicable).
 * @param {boolean} pUrgent - Indicates if the message is urgent.
 * @param {string} pTarget - Target of the message. This is the message name
 * @param {object} pParams - Additional parameters for the message.
 * @returns {Promise<{status: boolean, error: string|null}>} Returns a Promise that resolves to an object
 * with status indicating success or failure and an optional error message.
 */
export const sendMsgToJob = webMethod(
  Permissions.Anyone,
  async (pType, pJobKey, pFromName, pUrgent, pTarget, pParams) => {
  console.log("function sendMsgToJob, type ",pType, "Job ",pJobKey, "From ",pFromName, "Urgent ",pUrgent, "Target ",pTarget, "P ",pParams);

    let wParams = {...pParams};
    let wResult={};
    let wToList = [];

    if (pJobKey !== null) {
      wResult = await findOfficer(pJobKey);
      if (wResult && wResult.status){
        wToList.push(wResult.officer._id);
      } else {
        console.warn(`/backend/backMsg  sendMsgToJob couldn't find Officer, `,pJobKey);
        return {"status": false, "error": wResult.error || "Result undefined"};
      }
    } else {
        console.warn(`/backend/backMsg  sendMsgToJob Job not set `, pJobKey);
        return {"status": false, "error":"Job not set`"};
    }
    wResult = await sendMsg(pType, wToList, pFromName, pUrgent, pTarget, wParams);
    if (wResult && wResult.status){
      console.warn(`/backend/backMsg  sendMsgToJob sendMsg sent OK, msgType, JobKey `, pTarget, pJobKey);

      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendMsgToJob sendMsg fail, msgType, JobKey `, pTarget, pJobKey);
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }
    return wResult;
  } // async function
)

export const sendMsg = webMethod(
  Permissions.Anyone,
  async (pType, pToList, pFromName, pUrgent, pTarget, pParams) => {
  console.log("function sendMsg, type ",pType, "To ",pToList, "From ",pFromName, "Urgent ",pUrgent, "Target ",pTarget, "P ",pParams);

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
  
    let wResult={};

    for (let wMemberId of pToList){
      console.log("Member id = " ,wMemberId);
      wResult = await findLstMember(wMemberId);
      if (wResult && wResult.status){
        wControl.id = wResult.member._id;
        let wContactPref = wResult.member.contactpref;
        let wContactEmail = wResult.member.contactEmail;
        let wMobilePhone = wResult.member.mobilePhone;
        let wToName = wResult.member.firstName + " " + wResult.member.surname;
        let wToEmailEntry = `${wToName}<${wContactEmail}>`;
        console.log(wToEmailEntry,pType, wContactPref);
        //let wToEmailEntry = [];
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
    let wEmailControl = {...wControl};
    let wSMSControl = {...wControl};
    let wWhatsAppControl = {...wControl};
    wEmailControl.toList =[...wToEmailList];
    wSMSControl.toList = [...wToSMSList];
    wWhatsAppControl.toList = [...wToWhatsAppList];
    
    wControl.urgent = pUrgent;
    wControl.senderName = pFromName;

    wResult = await sendEmail(pTarget, wEmailControl, wParams);
    if (wResult && wResult.status){
      console.warn(`/backend/backMsg  sendMsg sendEmail sent OK, msgType, JobKey `, pTarget);

      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendMsg sendEmail fail, msgType, JobKey `, pTarget);
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }

    wResult = await sendSMS(pTarget, wSMSControl, wParams);
    if (wResult && wResult.status){
      console.warn(`/backend/backMsg  sendMsg sendSMS sent OK, msgType, JobKey `, pTarget);

      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendMsg sendSMS fail, msgType, JobKey `, pTarget);
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }

    wResult = await sendWhatsApp(pTarget, wWhatsAppControl, wParams);
    if (wResult && wResult.status){
      console.warn(`/backend/backMsg  sendMsg sendWhatsApp sent OK, msgType, JobKey `, pTarget);

      wResult = {"status": true, "error": null};
    } else {
      console.warn(`/backend/backMsg  sendMsg sendWhatsApp fail, msgType, JobKey `, pTarget);
      wResult = {"status": false, "error": wResult.error || "Result undefined"};
    }

    return wResult;
  } // async function
)

//----------------------------------------------------------------------------------------------------------------------------

async function sendEmail (pTarget, pControl, pParams) {
  console.log("function sendEmail",pControl, pParams);
  const wTo = pControl.toList;
  if (wTo.length === 0) { return {"status": true, "error": null} }
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

async function sendSMS (pTarget, pControl, pParams) {
  console.log("function sendSMS",pControl,  pParams);
  const wTo = pControl.toList;
  if (wTo.length === 0) { return {"status": true, "error": null} }
  let wResult = {};
  //if (wTo.startsWith("+")) {}
  //wTo = "+6593210160";
  wResult = createSMS(pTarget, pControl, pParams);
  if (wResult && wResult.status){
    const wSubject = wResult.sms.subject;
    const wMessage = wResult.sms.body;
    //wResult = await transmitSMS(wTo, wSubject + "\n" + wMessage);  
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

async function sendWhatsApp (pTarget, pControl, pParams) {
  console.log("function sendWhatsApp",pControl,  pParams);
  const wTo = pControl.toList;
  if (wTo.length === 0) { return {"status": true, "error": null} }
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
  console.log("function createEmail", pControl, pParams);
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
  console.log("function createSMS", pControl, pParams);
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
  console.log("function transmitEmail",pToList, pSubject, pMsg);

	const apiKey = await getSecret("sendGrid3");

	sgMail.setApiKey(apiKey);
	//console.log(pTo);
  //console.log(pSubject);
  //console.log(pMsg);
	const msg = {
    //to: ['juliaallen3@hotmail.com', 'allentrev88@gmail.com'],
    to: pToList.toString(),
    from: 'maidenheadtownbc@gmail.com', // Change to your verified sender
    subject: pSubject,
  	//text: 'Hello plain world!',
  	//html: '<p>Hello HTML world!</p>',
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
		  console.log("/backend/backMsg transmitEmail send OK" );
      console.log(msg);
      return {"status": true, "error": null}
  	})
  	.catch((error) => {
		  console.error("/backend/backMsg transmitEmail catch error, err" );
    	console.error(error || "Error undefined");
      console.log(msg);
      return {"status": false, "error": error || "Error undefined"}
    })
}

export async function transmitSMS( pTo, pMsg) {
  console.log("function transmitSMS",pTo, pMsg);
  let wTo = pTo;
  let fromPhone = await getSecret('fromPhone');
  //let fromPhone = "MTBC";
	const accountSID = await getSecret('accountSID');
	const authToken = await getSecret('authToken');
  if (!pTo.startsWith("+")) {
    let wNo = pTo.slice(1);
    wTo = "+44"+ wNo;
  }
  //let wTo = "+65" + pTo.slice(1);
  const client = twilio(accountSID, authToken);
  //client.region = 'IE1';
  //client.edge = 'dublin';
    
    //fromPhone = 'whatsapp:+14155238886';
    //toPhone = 'whatsapp:+6593210160';
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
  console.log(pParameters);
  const wToName = pParameters.toName;
  const wMember = pParameters.member;
  console.log(wToName, wMember);
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
	Date: ${pParameters.dateRequired}
	Slot: ${pParameters.slot}
	Rink: ${pParameters.rink}
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

//==============================================OBSOLETE ROUTINES for COMPARISON ======================= 

// OLD STYLE NOT USED HERE
export async function sendConfirmationEmail(pEmail) {
	const toEmail = {
		"bookingRef": "",
		"dateRequired": "",
		"rink": 0,
		"slot": "",
		"noPlayers": 0,
		"bookerId": "",
		"booker": "",
    "usage": "",
		"playerAId": "",
		"playerA": "",
		"playerBId": "",
		"playerB": "",
		"dateBooked": ""
	}
	let w_booker_email = "";
	let w_playerA_email = "";
	let w_playerB_email = "";
	let w_first_name = pEmail.booker.toString().split()[0];
	if (pEmail.bookerId) {
		if (pEmail.bookerId === ".") {
			w_booker_email = await getEmailAddress(pEmail.playerAId);
		} else { 
			w_booker_email = await getEmailAddress(pEmail.bookerId);
		}
	}
	//console.log("Backend email address for ", pEmail.bookerId);
	//console.log(w_booker_email);
	if (pEmail.playerAId) {
		if (pEmail.playerAId === pEmail.bookerId){
			w_playerA_email = w_booker_email;
		} else {
			//w_playerA_email = await getEmailAddress(pEmail.playerAId);
		}
	}
	if (pEmail.playerBId) {
		//w_playerB_email = await getEmailAddress(pEmail.playerBId);
		//console.log(w_playerB_email);
	}
	let players_message = "";
	if (pEmail.noPlayers > 0) {
		players_message = String(pEmail.noPlayers);
	} else {
		players_message = "Not specified";
	}
	const subject = `Booking Confirmation`;

	const body = 
  `Dear ${w_first_name},\n
	This is to confirm that you booked a rink at the club. The details of the booking made are:\n
	Booked on Date: ${pEmail.dateBooked}\n
	Booking reference: ${pEmail.bookingRef}\n\n
	Date required: ${pEmail.dateRequired}\n
	Time slot: ${pEmail.slot}\n
	Nominal rink: ${pEmail.rink}\n
	Number of players: ${players_message}\n\n
  Usage: ${pEmail.usage}\n\n
	Player A: ${pEmail.playerA}\n
	Player B: ${pEmail.playerB}\n\n
	If you have not booked this event, then please contact the club immediately.\n
	You may go to the website to delete or edit this booking up to the date of the booking.\n\n
	The committee reserves the right to cancel this booking and to re-allocate this rink for another use, should a priority need arise.\n
	Thank you for using the booking system\n
	Regards,\n
	The Secretary,\n
	Maidenhead Town Bowls Club
  	`
  	const recipient = w_booker_email;

  	let response = await sendEmailWithRecipient(subject, body, recipient);

	return true;
}	


export async function sendRegisterRequest(pName, pEmail) {

	let wTo = pEmail;
	const wTitle = `New Member Registration Request`;
	const wText = `
  <p>Dear ${pName},</p>
	Thank you for your request to become a member of the Maidenhead Town Bowls Club.<br><br>
	A member of the club will contact you shortly by email to explain the process to become a member.
	<br><br>
	Regards,<br>
	The Secretary,<br>
	Maidenhead Town Bowls Club<br>
  `
  	//To = "allentrev88@gmail.com";
	let response = await testV4(wTo, wTitle, wText);

	return true;
}	

/********************************************************************************************************************************************
.web.js file
import { multiply } from 'backend/new-module.web';

import { Permissions, webMethod } from "wix-web-module";

export const multiply = webMethod(
  Permissions.Anyone, 
  (factor1, factor2) => { 
    return factor1 * factor2 
  }
);

export const multiply2 = webMethod(
  Permissions.Anyone,
  function (a,b) {
    return a * b 
  }
)

export const multiply3 = webMethod(
  Permissions.Anyone, 
  async function(factor1, factor2) { 
    const result = await someAsyncFunction(factor1, factor2);
    return result;
  }
);

async function someAsyncFunction (x,y) {
  return x+y;
}
*/