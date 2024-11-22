/* eslint-disable no-undef */ 
import wixWindow from "wix-window";
import { authentication } from "wix-members";
import wixLocation from "wix-location";

import { retrieveSessionMemberDetails } from "public/objects/member";
import _ from "lodash";

import { sendMsg } from "backend/backMsg.web.js";
import { getAllNotices } from "backend/backNotices.web.js";
import { summariseText } from "backend/backNotices.web.js";
import { getAllLabels } from "backend/backNotices.web.js";
import { getLabelObjects } from "backend/backNotices.web.js";
import { getLabelSet } from "backend/backNotices.web.js";
import { isLabelUnique } from "backend/backNotices.web.js";

import { saveRecord } from "backend/backEvents.jsw";
import { bulkSaveRecords } from "backend/backEvents.jsw";
import { deleteRecord } from "backend/backEvents.jsw";

//------------------------------------------ Entity Imports ---------------------------------------
import { setEntity, getEntity } from "public/objects/entity";
import { MODE } from "public/objects/entity";
import { 
  btnCreate_click,
  btnUpdate_click,
  btnDelete_click,
  btnCancel_click,
  btnCancellation_click,
} from "public/objects/entity";
import {
  chkSelect_click,
  chkSelectAll_click,
  btnTop_click,
  doPgnListClick,
} from "public/objects/entity";
import { doInpListNoPerPageChange } from "public/objects/entity";
import {
  resetCommands,
  resetSection,
  getSelectStackId,
} from "public/objects/entity";
import { resetPagination, updatePagination } from "public/objects/entity";
import {
  showError,
  updateGlobalDataStore,
} from "public/objects/entity";
import {
  getTarget,
  getTargetItem,
  configureScreen,
} from "public/objects/entity";
import { showWait, hideWait, getMode, setMode } from "public/objects/entity";
import { getSelectStack, getSelectedItem } from "public/objects/entity";
import {
  showGoToButtons,
  hideGoToButtons,
  populateEdit,
} from "public/objects/entity";

//import { } from 'public/objects/entity';

//let gFirstOption = [{
//    "label": "",
//    "value": "X"
//}]

const COLOUR = Object.freeze({
  FREE: "rgba(207,207,155,0.5)",
  SELECTED: "rgba(173,43,12,0.4)",
  NOT_IN_USE: "rgba(180,180,180, 0.3)",
  BOOKED: "#F2BF5E",
});

//====== -----------------------------------------------------------------------------------------------------

let loggedInMember;
let loggedInMemberRoles;

// for testing ------	------------------------------------------------------------------------
let gTest = true;
const gYear = new Date().getFullYear();
// for testing ------	------------------------------------------------------------------------

const isLoggedIn = gTest ? true : authentication.loggedIn();

$w.onReady(async function () {
  try {
    let status;
    console.log("Hi", gYear);

    //sgMail.setApiKey(apiKey);


    //$w('#lblHdr1').text = `The following table summarises something....${gYear} season`;
    // for testing ------	------------------------------------------------------------------------
    //let wUser = {"_id": "ab308621-7664-4e93-a7aa-a255a9ee6867", "loggedIn": true, "roles": [{"title": "Full"}]};	//
    //let wUser = { "_id": "88f9e943-ae7d-4039-9026-ccdf26676a2b", "loggedIn": true, "roles": [{ "title": "Manager" }] }; //Me
    let wUser = {
      _id: "612f172a-1591-4aec-a770-af673bbc207b",
      loggedIn: true,
      roles: [{ title: "Captain" }],
    }; //Sarah
    //let wUser = {"_id": "af7b851d-c5e5-49a6-adc9-e91736530794", "loggedIn": true, "roles": [{"title": "Coach"}]}; //Tony Roberts
    /**
        Mike Watson		bc6a53f1-f9b8-41aa-b4bc-cca8c6946630 
        Julia Allen		16b77976-37d1-41df-a328-4433d2d40cbc	612f172a-1591-4aec-a770-af673bbc207b
        Trevor Allen	7e864e0b-e8b1-4150-8962-0191b2c1245e	88f9e943-ae7d-4039-9026-ccdf26676a2b
        Tony Stuart		28f0e772-9cd9-4d2e-9c6d-2aae23118552	5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9
        John Mitchell	40a77121-3265-4f0c-9c30-779a05366aa9	5132409b-6d6a-41c4-beb7-660b2360054e
        Tony Roberts	4d520a1b-1793-489e-9511-ef1ad3665be2	af7b851d-c5e5-49a6-adc9-e91736530794
        Cliff Jenkins	d81b1e42-6e92-43d0-bc1e-a5985a25487a	c287a94e-d333-40aa-aea6-11691501571e
        Tim Eales		2292e639-7c69-459b-a609-81c63202b1ac	6e5b5de1-214f-4b03-badf-4ae9a6918f77
        Yoneko Stuart	93daeee8-3d4b-40cc-a016-c88e93af1559	957faf19-39cd-47ca-9b81-5a0c2863bb87
        */

    // end of esting fudge---------------
    // eslint-disable-next-line no-unused-vars
    [status, loggedInMember, loggedInMemberRoles] =
      await retrieveSessionMemberDetails(gTest, wUser); // wUser only used in test cases
    if (isLoggedIn) {
      let wRoles = loggedInMemberRoles.toString();
      console.log(
        "/page/MaintainNotice onReady  Roles = <" + wRoles + ">",
        loggedInMember.name,
        loggedInMember.lstId
      );
    } else {
      console.log("/page/MaintainNotice onReady Not signed in");
      
      showError("Notice", 28);
      setTimeout(() => {
        wixLocation.to("/");
      }, 2000);
    }

    if (wixWindow.formFactor === "Mobile") {
      $w("#strDesktop").collapse();
      $w("#strMobile").expand();
    } else {
      $w("#strMobile").collapse();
      $w("#strDesktop").expand();
      await loadNoticesDropDown();
      await populateNoticeEditDropDowns();
      $w("#drpNoticeChoice").value = "A";
      $w("#inpNoticeListNoPerPage").value = "15";
      $w("#inpLabelListNoPerPage").value = "15";

      await loadListData();
      await loadLabelData();
      await loadNoticeEditLabel();
}

    // Notice Section Notice handlers
    //$w("#strNotice").onViewportEnter((event) => strNotice_viewportEnter(event));
    $w("#btnNoticeACreate").onClick((event) => doBtnCreateClick(event));
    $w("#btnNoticeAUpdate").onClick((event) => doBtnUpdateClick(event));
    $w("#btnNoticeADelete").onClick((event) => btnDelete_click(loggedInMember.lstId, event));
    $w("#btnNoticeASave").onClick((event) => btnNoticeASave_click(event));
    $w("#btnNoticeACancel").onClick((event) => btnCancel_click(event));
    $w("#btnNoticeAToLabel").onClick(() => btnNoticeAToLabel_click());
    $w("#btnNoticeACancellation").onClick((event) => doBtnCancellationClick(event));

    //$w('#btnEventAPrime').onClick((event) => btnEventAPrime_click(event));
    $w("#chkNoticeListSelect").onClick((event) => chkSelect_click(event));
    $w("#chkNoticeListSelectAll").onClick((event) => chkSelectAll_click(event));
    $w("#btnNoticeListTop").onClick((event) => btnTop_click(event));
    $w("#drpNoticeChoice").onChange((event) => drpNoticeChoiceChange(event));
    $w("#pgnNoticeList").onClick((event) => doPgnListClick(event));
    $w("#inpNoticeListNoPerPage").onChange((event) => doInpListNoPerPageChange(event));

    $w("#inpNoticeEditMessage").onChange((event) => doInpNoticeEditMessageChange(event));
    $w("#btnNoticeEditSummary").onClick(() => btnNoticeEditSummary_click());
    $w("#drpNoticeEditTargetType").onChange((event) => doDrpNoticeEditTargetTypeChange(event));
    $w('#btnNoticeEditPhotoAdd').onClick( () => btnNoticeEditPhotoAdd_click());
    $w('#btnNoticeEditPhotoClose').onClick( () => btnNoticeEditPhotoClose_click());
    $w('#drpNoticeEditLabel').onClick((event) => drpNoticeEditLabel_click(event));
    $w("#btnNoticeEditSelectAdd").onClick(() => btnNoticeEditSelectAdd_click());
    $w("#btnNoticeEditSelectRemove").onClick(() => btnNoticeEditSelectRemove_click());
    //$w('#drpNoticeEditHomeAway').onChange((event) => doDrpNoticeEditRinksChange(event));
    //$w('#tpkNoticeEditStartTime').onChange((event) => doDrpNoticeEditRinksChange(event));
    //$w('#tpkNoticeEditDuration').onChange((event) => doDrpNoticeEditRinksChange(event));
    //$w('#dpkNoticeEditStartDate').onChange((event) => doDrpNoticeEditRinksChange(event));
    
    // Label Section event handlers
    //
    $w('#btnLabelACreate').onClick((event) => doBtnLabelCreateClick(event));
    $w('#btnLabelAUpdate').onClick((event) => doBtnLabelUpdateClick(event));
    $w('#btnLabelADelete').onClick((event) => btnDelete_click(loggedInMember.lstId, event));
    //$w('#btnLabelASave').onClick((event) => btnLabelASave_click(event));
    $w('#btnLabelACancel').onClick((event) => btnCancel_click(event));
    $w("#btnLabelAToNotice").onClick(() =>  btnLabelAToNotice_click());
  
    $w('#chkLabelListSelect').onClick((event) => chkSelect_click(event));
    $w('#chkLabelListSelectAll').onClick((event) => chkSelectAll_click(event));
    $w('#btnLabelListTop').onClick((event) => btnTop_click(event));
    //$w('#drpLabelChoice').onChange((event) => drpLabelChoiceChange(event));
    $w('#pgnLabelList').onClick((event) => doPgnListClick(event));
    $w('#inpLabelListNoPerPage').onChange((event) => doInpListNoPerPageChange(event));

    $w("#inpLabelEditTitle").onChange((event) => inpLabelEditTitle_change(event));
    $w("#tblLabelEditObjects").onRowSelect((event) => btnLabelEditObjects_onRowSelect(event));
    $w("#btnLabelPrimeAdd").onClick(() => btnLabelPrimeAdd_click());
    $w("#btnLabelPrimeRemove").onClick(() => btnLabelPrimeRemove_click());
    //----------------------------Repeaters section-------------------------------------------
    $w("#rptNoticeList").onItemReady(($item, itemData, index) => {
      loadRptNoticeList($item, itemData, index);
    });
    
    $w('#rptLabelList').onItemReady(($item, itemData, index) => {
        loadRptLabelList($item, itemData, index);
    })
    //-------------------------- Custom Validation -----------------------------------------

    //  None
  } catch (err) {
    console.log("/page/MaintainNotice onReady Try-catch, err");
    console.log(err);
    if (!gTest) {
      wixLocation.to("/syserror");
    }
  }
});

// ------------------------------------------------ Load Data --------------------------------------------------------
//
export async function loadListData() {
  try {
    let wResult = await getAllNotices(gYear);
    if (wResult && wResult.status) {
      let wNotices = wResult.notices;
      setEntity("Notice", [...wNotices]);
      $w("#strNotice").expand();
      if (wNotices && wNotices.length > 0) {
        $w("#boxNoticeChoice").expand();
        $w("#boxNoticeList").expand();
        $w("#boxNoticeNone").collapse();
        $w("#boxNoticeEdit").collapse();
        $w("#boxNoticePrime").collapse();
        await doNoticeView("");
        resetPagination("Notice");
      } else {
        $w("#boxLabelList").collapse();
        $w("#boxLabelNone").expand();
        $w("#boxLabelEdit").collapse();
        $w("#boxLabelPrime").collapse();
      }
    } else {
      console.log("/page/MaintainNotice loadListData Error return, err");
      console.log(wResult.error);
    }
  } catch (err) {
    console.log("/page/MaintainNotice loadListData Try-catch, err");
    console.log(err);
  }
}

export async function loadLabelData() {
  try {
    let wResult = await getLabelSet();
    if (wResult && wResult.status) {
      let wLabels = wResult.labels;
     setEntity("Label", [...wLabels]);
      $w("#strLabel").expand();
      if (wLabels && wLabels.length > 0) {
        //gItemsToDisplay = [...gCompetitions];
        $w("#boxLabelList").expand();
        $w("#boxLabelNone").collapse();
        $w("#boxLabelEdit").collapse();
        $w("#boxLabelPrime").collapse();
        await doLabelView("");
        resetPagination("Label");
      } else {
        //gItemsToDisplay = [...gReferences];
        $w("#boxLabelList").collapse();
        $w("#boxLabelNone").expand();
        $w("#boxLabelEdit").collapse();
        $w("#boxLabelPrime").collapse();
      }
    } else {
      console.log("/page/MaintainNotice loadLabelData Error return, err");
      console.log(wResult.error);
    }
  }
  catch (err) {
    console.log("/page/MaintainNotice loadLabelData Try-catch, err");
    console.log(err)
  }
}
// ------------------------------------------------ Load Repeaters ----------------------------------------------------------
//

function loadRptNoticeList($item, itemData, index) {
  let wTargetType = "A";
  let wTarget = "";
  switch (itemData.targetType) {
    case "A":
      wTargetType = "<All>";
      break;
    case "L":
      wTargetType = "L";
      wTarget = itemData.target.toString() || "";
      break;
    case "S":
      wTargetType = "S";
      if (itemData.target && itemData.target.length > 0){
        wTarget = String(itemData.target.length);
      } else {
        wTarget = "";
      }break;
    default:
      wTargetType = "All";
      break;
  }

  if (index === 0) {
    $item("#lblNoticeListTargetType").text = "Type";
    $item("#lblNoticeListTarget").text = "Target";
    $item("#lblNoticeListTitle").text = "Title";
    $item("#chkNoticeListSelect").hide();
  } else {
    $item("#chkNoticeListSelect").show();
    $item("#lblNoticeListTargetType").text = wTargetType;
    $item("#lblNoticeListTarget").text = wTarget;
    $item("#lblNoticeListTitle").text = itemData.title.trim();
    $item("#chkNoticeListSelect").checked = false;
  }
}

function loadRptLabelList($item, itemData, index) {
  if (index === 0) {
    $item("#lblLabelListTitle").text = "Label";
    $item("#lblLabelListPopulation").text = "No of Entries";
    $item('#chkLabelListSelect').hide();
  } else {
    $item('#chkLabelListSelect').show();
    $item("#lblLabelListTitle").text = itemData.title;
    $item("#lblLabelListPopulation").text = String(itemData.count);
  }
}

// ------------------------------------------------ Load Dropdowns-----------------------------------------------
//

async function loadNoticeEditLabel(){
    const wResults = await getLabelSet();
    if (wResults && wResults.status) {
        let wLabels = wResults.labels;
        let wOptions = wLabels.map( item => {
          return {
            "label": item.title + " (" + String(item.count) + ")",
            "value": item.title
          }
        })
        if (wOptions.length > 0 ){
            $w('#drpNoticeEditLabel').options = wOptions;
            //$w('#drpNoticeEditLabel').setindex = 0;
        }
    }
}

export async function loadNoticesDropDown() {
  let wOptions = [
    { label: "All Members", value: "A" },
    { label: "Test 1", value: "1" },
    { label: "Test 2", value: "2" },
    { label: "Test 3", value: "3" },
  ];

  $w("#drpNoticeChoice").options = wOptions;
  $w("#drpNoticeChoice").value = "A";
  drpNoticeChoiceChange();
}

async function populateNoticeEditDropDowns() {
  let wNoticeEditOptions = [
    { label: "Club Members", value: "A" },
    { label: "Label", value: "L" },
    { label: "Select", value: "S" },
  ];

  $w("#drpNoticeEditTargetType").options = wNoticeEditOptions;
  $w("#drpNoticeEditTargetType").value = "A";
}


//====== Notice Events ================================================
//
export async function doBtnCreateClick(event) {
  btnCreate_click(event);
  await clearNoticeEdit();
}
export async function doBtnUpdateClick(event) {
  btnUpdate_click(event);
  await populateNoticeEdit();
}
export async function doBtnCancellationClick(event) {
  btnCancellation_click(event);
  await populateNoticeEdit();
}

export function btnNoticeAToLabel_click() {
  $w("#secNotice").collapse();
  //$w("#secSync").collapse();
  $w("#secLabel").expand();
  //loadLabels();
}
export async function drpNoticeFilterType_change(event) {
  showWait("Notice");
  let wType = event.target.value;
  //let wStatus = $w('#drpMemberFilterChoice').value;
  //displayMemberTableData(wType, wStatus);
  hideWait("Notice");
}

function doDrpNoticeEditTargetTypeChange(event) {
  let wTargetType = event.target.value;
  configureBoxes(wTargetType);
}

async function btnNoticeEditSummary_click() {
  showWait("Notice");
  $w('#btnNoticeEditSummary').disable();
  let wText = $w('#inpNoticeEditMessage').value;
  let wNoSentences = (wText.length > 100) ? Math.round(wText.length / 100) : 1;
  console.log("Length =", wText.length, "Sentenaces = ", wNoSentences); 
  let wResult = await summariseText(wText, wNoSentences);
  console.log(wResult);
  if (wResult && wResult.status) {
    console.log("IN mainm result");
    $w('#inpNoticeEditSummary').value = wResult.summary;
    $w('#grpNoticeEditSummary').expand();
    $w('#btnNoticeEditSummary').enable();
  } else {
    console.log("MaintainNotice btnNoticeEditSummary summarise error, err");
    console.log(wResult.error);
    $w('#inpNoticeEditSummary').value = "";
    $w('#grpNoticeEditSummary').collapse();
    $w('#btnNoticeEditSummary').enable();
  }
  hideWait("Notice");
}

function doInpNoticeEditMessageChange(event){
  let wText = event.target.value;
  console.log(wText, wText.length);
  if (wText.length > 160) {
    $w('#btnNoticeEditSummary').expand();
  } else {
    $w('#btnNoticeEditSummary').collapse();
    $w('#grpNoticeEditSummary').collapse();
  }
}

function btnNoticeEditPhotoAdd_click() {
  $w('#boxNoticeEditPhoto').expand();
  $w('#btnNoticeEditPhotoAdd').collapse();
  $w('#btnNoticeEditPhotoClose').expand();
}


function btnNoticeEditPhotoClose_click() {
  $w('#boxNoticeEditPhoto').collapse();
  $w('#btnNoticeEditPhotoAdd').expand();
  $w('#btnNoticeEditPhotoClose').collapse();
}

export function doNoticeViewChange(event) {
  let wView = event.target.value;
  doNoticeView(wView);
}
export function btnNoticeAToB_click(event) {
  //$w('#strEvent').collapse();
  //$w('#cstrpKennetTeams').expand();
}

export async function btnNoticeASave_click(event) {
  try {
    showWait("Notice");
    $w("#btnNoticeASave").disable();
    //-------------------------------------VALIDATIONS-----------------------------------
    const wPublish = $w("#rgpNoticeEditPublish").value === "N" ? false : true;
    const wTransmit = $w("#rgpNoticeEditTransmit").value === "N" ? false : true;
    if (!$w("#inpNoticeEditTitle").valid) {
      showError("Notice", 22);
      hideWait("Notice");
      $w("#inpNoticeEditTitle").focus();
      return;
    }
    if (!wPublish && !wTransmit) {
      showError("Notice", 22);
      hideWait("Notice");
      $w("#rgpNoticeEditPublish").focus();
      return;
    }
    //-------------------------------------Main section----------------------------------
    let wNotice = {
      _id: "",
      title: $w("#inpNoticeEditTitle").value,
      targetType: $w("#drpNoticeEditTargetType").value,
      target: [],
      urgent: $w("#rgpNoticeEditUrgent").value,
      picture: $w("#imgNoticeEditPicture").src,
      message: $w("#inpNoticeEditMessage").value.trim(),
      status: "O",
      web: $w("#rgpNoticeEditPublish").value,
      send: $w("#rgpNoticeEditTransmit").value
    };

    let wResult;
    wResult = { status: true, savedRecord: {}, error: "" };
    switch (wNotice.targetType) {
      case "A":
        wNotice.target = ["ALL"];
        break;
      case "L":
        wNotice.target = [`<${$w("#drpNoticeEditLabel").value}>`];
        break;
      case "S":
        let wSelectTableData = $w('#tblNoticeEditSelect').rows;
        wNotice.target = formTransmitToList();
        break;
      default:
        console.log(
          "/page/MaintainNotice btnNoticeSave invalid targetType = [" +
            wNotice.targetType +
            "]"
        );
        break;
    }
    switch (getMode()) {
      case MODE.CREATE:
        wNotice._id = undefined;
        break;
      //console.log(wMember);
      case MODE.UPDATE:
        wNotice._id = getSelectStackId();
        break;
      default:
        console.log(
          "/page/MaintainNotice btnNoticeSave invalid mode = [" +
            getMode() +
            "]"
        );
    }
    // Save record performed in switch code blocks above;
    //wResult = await saveRecord("lstNotices", wNotice);
    wResult.status = true;
    if (wResult && wResult.status) {
      let wSavedRecord = wResult.savedRecord;
      switch (getMode()) {
        case MODE.CREATE:
          wNotice._id = wSavedRecord._id;
          wNotice._createdDate = wSavedRecord._createdDate;
          showError("Notice", 8);
          break;
        case MODE.UPDATE:
          showError("Notice", 7);
          break;
        default:
          console.log(
            "/page/MaintainNotice btnNoticeASave invalid mode = [" +
              getMode() +
              "]"
          );
      }
      updateGlobalDataStore(wSavedRecord, "Notice");
      updatePagination("Notice");
      resetCommands("Notice");
    } else {
      if (wResult && wResult.savedRecord) {
        console.log(
          "/page/MaintainNotice btnNoticeASave_click saveRecord failed, savedRecord, error"
        );
        console.log(wResult.savedRecord);
        console.log(wResult.error);
      } else if (wResult) {
        console.log(
          "/page/MaintainNotice btnNoticeASave_click saverecord failed, error"
        );
        console.log(wResult.error);
      } else {
        console.log(
          "/page/MaintainNotice btnNoticeASave_click wResult undefined"
        );
        console.log(wResult.error);
      }
    }
    if (wTransmit) {
      console.log("Transmit msg 1");
      //let wTo = populateToList(wNotice.targetType, wNotice.target);
      let wUrgent = $w('#rgpNoticeEditUrgent').value;

      let wParams = {
        "subject": $w('#inpNoticeEditTitle').value,
        "body": $w('#inpNoticeEditMessage').value
      }
      let wResult = await sendMsg("U", wNotice.target, wUrgent, "Blank_1", wParams);
      console.log("Send msg result");
      console.log(wResult);
      //let wResult = {"status": true};
      if (wResult && wResult.status) {
        console.log("/membersArea/profile  btnMemberASave_click saveRecord sendMsgToJob OK for ", gMember._id);
      } else {
        console.log("/membersArea/profile  btnMemberASave_click saverecord sendMsgToJob failed, error");
        console.log(wResult.error);
      }

      //send message
    }
    resetSection("Notice");
    $w("#btnNoticeASave").enable();
    hideWait("Notice");
    setMode(MODE.CLEAR);
  } catch (err) {
    console.log("/page/MaintainNotice btnNoticeASave_click Try-catch, err");
    console.log(err);
    if (!gTest) {
      wixLocation.to("/syserror");
    }
  }
}


function formTransmitToList(){
  let wTableData = $w("#tblNoticeEditSelect").rows;
  let wList = wTableData.map (item => {
    return (
//      `${item.name}<${item.email}>,`
      item.memberId
)
  });
  return wList;
}

async function populateToList(pTargetType, pTarget){
  console.log("populateToList", pTargetType);
  console.log(pTarget);
  let wTo = [];
  switch (pTargetType) {
    case "All":
      // get all contact emails from the club      
      break;
    case "L":
      // get the emails with the Label
      break;
    case "S":
      // use the list given
      break;
    default:
      //send error msg unknown target type  
    break;
  }  
  return wTo;
}

export async function drpNoticeChoiceChange(event) {
  showWait("Notice");
  updatePagination("Notice");
  hideWait("Notice");
}

// Note that the following variables are also used in the Label section
let wSelectedRow = 0;
let wTableRows = [];

export function tblNoticeEditSelect_onRowSelect(event) {
  wSelectedRow = event.rowIndex; // 2  console.log("Row select, id", wId);
  wTableRows = $w('#tblNoticeEditSelect').rows;
}

export async function drpNoticeEditLabel_click(event){
  let wValue = event.target.value;
  console.log(wValue);
} 

export async function btnNoticeEditSelectAdd_click() {
  let wParams = {
    "seeds": "N",
    "mix": "X",
    "type": 1,
    "noTeams": 12
  }
  wTableRows = $w('#tblNoticeEditSelect').rows;

  let wMembers = await wixWindow.openLightbox("lbxSelectManyMembers", wParams);
  try {
    if (wMembers) {
      if (wMembers.length > 0) {
        for (let wMember of wMembers) {
          let wTableEntry = { "_id": undefined, "memberId": wMember._id, "name": wMember.player, "email": wMember.contactEmail }
          wTableRows.push(wTableEntry);
        }
        tblNoticeEditSelectExpand();
        $w('#tblNoticeEditSelect').rows = wTableRows;
      }
    }
  } catch (err) {
    console.log("MaintainNotice btnNoticeEditSelectAdd try-catch, err");
    console.log(err);
  }
}

export async function btnNoticeEditSelectRemove_click() {
  try {
    wTableRows = $w('#tblNoticeEditSelect').rows;

    let wSelectedRowData = wTableRows[wSelectedRow];
    console.log("Table length = ", wTableRows.length);
    let wId = wSelectedRowData._id;
    wTableRows.splice(wSelectedRow, 1);

    if (wTableRows.length === 0) {
      tblNoticeEditSelectCollapse();
    } else {
      tblNoticeEditSelectExpand();
      $w('#tblNoticeEditSelect').rows = wTableRows;
    }
    wSelectedRow = 0;
  }
  catch (err) {
    console.log("MaintainNotice btnNoticeEditSelectRemove try-catch, err");
    console.log(err);
  }
}

export async function cstrpNotice_viewportEnter(event) {
  //await displayEventTableData(gEvents);
}
//////////////////////////////
export function doNoticeView(pTarget) {
  if (pTarget === "P") {
    $w("#chkNoticeListSelectAll").collapse();
    $w("#btnNoticeListTop").collapse();
    $w("#rptNoticeList").collapse();
  } else {
    $w("#chkNoticeListSelectAll").expand();
    $w("#btnNoticeListTop").expand();
    $w("#rptNoticeList").expand();
  }
}

export function strNotice_viewportEnter(event) {
  console.log("Viewport");
  console.log(event);
  //displayMemberTableData($w('#drpMemberListTypeChoice').value, $w('#drpMemberListStatusChoice').value);
}
// ================================================= Notice Supporting Functions =================================================
//
export async function clearNoticeEdit() {
  $w("#drpNoticeEditTargetType").value = "A";
  configureBoxes("A");

  $w("#inpNoticeEditTitle").value = "";
  $w("#rgpNoticeEditUrgent").value = "N";
  $w("#rgpNoticeEditPublish").value = "Y";
  $w("#rgpNoticeEditTransmit").value = "Y";
  $w('#drpNoticeEditTargetType').value = "All";
  $w("#drpNoticeEditLabel").selectedIndex = 0;
  $w("#imgNoticeEditPicture").src = null;
  $w('#tblNoticeEditSelect').rows = [];
  $w('#tblNoticeEditSelect').collapse();
  $w('#lblNoticeEditNone').expand();

  $w("#inpNoticeEditMessage").value = "";
  $w("#inpNoticeEditTitle").focus();
}

function configureBoxes(pTargetType) {
  switch (pTargetType) {
    case "A":
      $w("#boxNoticeEditPublish").expand();
      $w("#boxNoticeEditLabel").collapse();
      $w("#boxNoticeEditSelect").collapse();
      $w('#rgpNoticeEditPublish').value = "Y";
      $w('#rgpNoticeEditTransmit').value = "N";
      break;
    case "L":
      $w("#boxNoticeEditPublish").collapse();
      $w("#boxNoticeEditLabel").expand();
      $w("#boxNoticeEditSelect").collapse();
      $w('#rgpNoticeEditPublish').value = "N";
      $w('#rgpNoticeEditTransmit').value = "Y";
      break;
    case "S":
      $w("#boxNoticeEditPublish").collapse();
      $w("#boxNoticeEditLabel").collapse();
      $w("#boxNoticeEditSelect").expand();
      tblNoticeEditSelectCollapse();
      $w('#rgpNoticeEditPublish').value = "N";
      $w('#rgpNoticeEditTransmit').value = "Y";
      break;
    default:
      $w("#boxNoticeEditPublish").expand();
      $w("#boxNoticeEditLabel").collapse();
      $w("#boxNoticeEditSelect").collapse();
      $w('#rgpNoticeEditPublish').value = "Y";
      $w('#rgpNoticeEditTransmit').value = "N";
      console.log(
        "pages/MaintainNotice drpNoticeEditTargetTypeChange Invalid Target Type, ",
        pTargetType
      );
      break;
  }
}

function tblNoticeEditSelectExpand() {
  $w('#tblNoticeEditSelect').expand();
  //$w('#tblNoticeEditSelect').rows = [];
  $w('#lblNoticeEditNone').collapse();
}

function tblNoticeEditSelectCollapse(){
  $w('#tblNoticeEditSelect').collapse();
  $w('#tblNoticeEditSelect').rows = [];
  $w('#lblNoticeEditNone').expand();
}

export async function populateNoticeEdit() {
  let wSelectedRecord = getSelectedItem("Notice");
  configureBoxes(wSelectedRecord.targetType);

  $w('#drpNoticeEeditStatus').value = wSelectedRecord.status;
  $w('#drpNoticeEditTargetType').value = wSelectedRecord.targetType;
  //$w('#tblNoticeEditSelect').rows = wTableData;
  loadNoticeEditSelectFromDB(wSelectedRecord);

  $w('#grpNoticeEditSummary').collapse();
  $w('#btnNoticeEditSummary').collapse();
  $w('#inpNoticeEditSummary').value = "";

  $w("#inpNoticeEditTitle").value = wSelectedRecord.title;
  $w("#rgpNoticeEditUrgent").value = wSelectedRecord.urgent;
  $w("#rgpNoticeEditPublish").value = wSelectedRecord.web;
  $w("#rgpNoticeEditTransmit").value = wSelectedRecord.send;
  $w("#inpNoticeEditMessage").value = wSelectedRecord.message;
  $w("#imgNoticeEditPicture").src = wSelectedRecord.src;

  $w("#inpNoticeEditTitle").focus();
}

function loadNoticeEditSelectFromDB(pRec){
  let wTableData = [];
  let name = "";
  let email = "";
  let wTo = pRec.target;
  let wTargetType = pRec.targetType;
  if (wTo && wTo.length > 0){
    wTableData = wTo.map( item => {
      const start = item.indexOf('<');
      const end = item.indexOf('>');
      if (start !== -1 && end !== -1) {
        name = item.slice(0, start).trim();           // "Julia Allen"
        email = item.slice(start + 1, end).trim();
      }   
      return {
        "name": name,
        "email": email
      }
    })
  }
  $w('#drpNoticeEditLabel').value = wTo;
  if (wTableData && wTableData.length > 0){
    if (pRec.targetType === "S") {
      $w('#tblNoticeEditSelect').expand();
      $w('#lblNoticeEditNone').collapse();
      $w('#tblNoticeEditSelect').rows = wTableData;
    } /** type = L */else {
      $w('#drpNoticeEditLabel').value = wTableData[0].email;
    }
  } else {
    if (pRec.targetType === "S") {
      $w('#tblNoticeEditSelect').collapse();
      $w('#lblNoticeEditNone').expand();
    } /** type = L */else {
      console.log("SHould not get there");
      console.log("dd");
    }
  }
}

async function processRecord(pTarget, pItem) {
  //console.log("Process Record pItem");
  //console.log(pItem);

  let wReturn = {
    NoticeUpdate: {},
    NoticeBookings: [],
  };
  let wNoticeUpdate = {};
  let wSavedRec = {};

  let wTownTeamsInLeague = {};
  let wNoticeBookings = [];
  let wId = "";
  let wBookingsToSave = [];
  let res;
  let wResult;
  let wResult2;
  //let wLeagueKey = "";
  //let wLeagueDivision = 0;
  switch (pTarget) {
    case "Notice":
      wReturn = await processNoticeRecord(pItem);
      wNoticeUpdate = wReturn.NoticeUpdate;
      wNoticeBookings = wReturn.NoticeBookings;
      //console.log("case Notice - Notice Update + bookings returned");
      //console.log(wNoticeUpdate);
      //console.log(wNoticeBookings);
      wResult = await saveRecord("lstNotices", wNoticeUpdate);
      if (wResult.status) {
        wSavedRec = wResult.savedRecord;
        //console.log("wId = ", wId);
        if (wNoticeBookings) {
          if (wNoticeBookings.length > 0) {
            /** 
                    wBookingsToSave = wNoticeBookings.map(item => {
                        let wItem = { ...item };
                        wItem.NoticeId = wSavedRec._id;
                        return wItem;
                    })
                    */
            let wResult = await processNoticeBookings(
              wSavedRec._id,
              wNoticeBookings
            );
          }
        }
      } else {
        if (wResult.savedRecord) {
          console.log(
            "/page/MaintainNotice ProcessRecord, save failed, savedRecord",
            wResult.savedRecord
          );
        } else {
          console.log(
            "/page/MaintainNotice ProcessRecord, save failed, error",
            wResult.error
          );
        }
      }
      //console.log("Res of builk booking");
      //console.log(res);
      break;
  }
  return wSavedRec;
}

export function btnUpload_click(event) {
  $w("#txtNoticeErrMsg").hide();
  if ($w("#uplNoticeEditPhoto").value.length > 0) {
    $w("#txtNoticeErrMsg").text = `Uploading ${
      $w("#uplNoticeEditPhoto").value[0].name
    }`;
    $w("#uplNoticeEditPhoto")
      .startUpload()
      .then((uploadedFile) => {
        $w("#txtNoticeErrMsg").text = "Upload successful";
        $w("#imgNoticeEditPicture").src = uploadedFile.url;
        $w("#btnNoticeASave").show();
      })
      .catch((uploadError) => {
        $w("#txtNoticeErrMsg").text = "File upload error";
        console.log(
          `/page/UpdateNotice btnUpload Page Update Notice: Error: ${uploadError.errorCode}`
        );
        console.log(uploadError.errorDescription);
      });
  } else {
    $w("#txtNoticeErrMsg").text = "Please choose a file to upload.";
  }
}

export function btnClear_click(event) {
  $w("#txtNoticeErrMsg").hide();
  $w("#btnNoticeASave").show();
  $w("#imgNoticeEditPicture").src = null;
}

//====== Label Section============================================================
//
export async function doBtnLabelCreateClick(event) {
  btnCreate_click(event);
  await clearLabelEdit();
}
export async function doBtnLabelUpdateClick(event) {
  btnUpdate_click(event);
  await populateLabelEdit();
}
export async function inpLabelEditTitle_change(event) {
  
  if (getMode() !== MODE.CREATE) { return}
  let wKey = event.target.value;
  console.log(`Key = [${wKey}]`);
  let wTest = await isLabelUnique(wKey);
  if (getMode() === MODE.CREATE && wTest) {
    $w('#btnLabelPrimeAdd').enable();
  } else {
    showError("Label", 43);
    $w('#inpLabelEditTitle').focus();
  }
}

/** never used. CHanges to Label list are immediate and dont need to be Saved
export async function btnLabelASave_click(event) {
  try {
    showWait("Label");
    $w("#btnLabelASave").disable();
    //-------------------------------------VALIDATIONS-----------------------------------
    if (!$w("#inpNoticeEditTitle").valid) {
      showError("Notice", 22);
      hideWait("Notice");
      $w("#inpNoticeEditTitle").focus();
      return;
    }
    //-------------------------------------Main section----------------------------------
    let wLabel = {
      _id: "",
      title: $w("#inpNoticeEditTitle").value,
      name: $w("#drpNoticeEditTargetType").value,
      email: $w("#rgpNoticeEditUrgent").value
    };

    let wResult;
    wResult = { status: true, savedRecord: {}, error: "" };
    switch (getMode()) {
      case MODE.CREATE:
        wLabel._id = undefined;
        break;
      //console.log(wMember);
      case MODE.UPDATE:
        wLabel._id = getSelectStackId();
        break;
      default:
        console.log(
          "/page/MaintainNotice btnLabelASave invalid mode = [" +
          getMode() +
          "]"
        );
    }
    // Save record performed in switch code blocks above;
    wResult = await saveRecord("lstLabels", wLabel);
    if (wResult && wResult.status) {
      let wSavedRecord = wResult.savedRecord;
      switch (getMode()) {
        case MODE.CREATE:
          wLabel._id = wSavedRecord._id;
          wLabel._createdDate = wSavedRecord._createdDate;
          showError("Label", 8);
          break;
        case MODE.UPDATE:
          showError("Label", 7);
          break;
        default:
          console.log(
            "/page/MaintainNotice btnLabelASave invalid mode = [" +
            getMode() +
            "]"
          );
      }
      updateGlobalDataStore(wSavedRecord, "Label");
      updatePagination("Label");
      resetCommands("Label");
    } else {
        console.log(
          "/page/MaintainNotice btnLabelASave_click saveRecord failed, savedRecord, error"
        );
        console.log(wResult.savedRecord);
        console.log(wResult.error);
    }
    
    resetSection("Label");
    $w("#btnLabelASave").enable();
    hideWait("Label");
    setMode(MODE.CLEAR);
  } catch (err) {
    console.log("/page/MaintainNotice btnLabelASave_click Try-catch, err");
    console.log(err);
    if (!gTest) {
      wixLocation.to("/syserror");
    }
  }
}

*/
export async function doBtnLabelCancellationClick(event) {
  btnCancellation_click(event);
}

export async function btnLabelAToNotice_click() {
  await loadNoticeEditLabel();
  $w("#secNotice").expand();
  //$w("#secSync").collapse();
  $w("#secLabel").collapse();
}

export function btnLabelEditObjects_onRowSelect(event) {
  let rowData = event.rowData; // {"fName": "John", "lName": "Doe"}
  wSelectedRow = event.rowIndex; // 2  console.log("Row select, id", wId);
  wTableRows = $w('#tblLabelEditObjects').rows;
}

export async function btnLabelPrimeAdd_click() {
  let wParams = {
    "seeds": "N",
    "mix": "X",
    "type": 1,
    "noTeams": 12
  }
  wTableRows = $w('#tblLabelEditObjects').rows;
  const wKey = $w('#inpLabelEditTitle').value;

  if ((getMode() === MODE.CREATE) && !isLabelUnique(wKey)) {
    showError("Label", 43);
    $w('#inpLabelEditTitle').focus();
    return;
  }

  let wMembers = await wixWindow.openLightbox("lbxSelectManyMembers", wParams);
  try {
    if (wMembers) {
      if (wMembers.length > 0) {
        for (let wMember of wMembers) {
          let wTableEntry = { "_id": undefined, "title": wKey, "memberId": wMember._id, "name": wMember.player, "email": wMember.contactEmail }
          wTableRows.push(wTableEntry);
        }
        $w('#tblLabelEditObjects').rows = wTableRows;
        let wDBUpdate = wTableRows.map( item => {
          return {
            "_id": item._id,
            "title": item.title,
            "memberId": (item && item.memberId && item.memberId.length > 0) ? item.memberId : null,
            "name": (item && item.name && item.name.length > 0) ? item.name : null,
            "email": (item && item.email && item.email.length > 0) ? item.email : null 
          }
        })
        let wResult = await bulkSaveRecords("lstLabels", wDBUpdate);
        if (wResult && wResult.status){
          updateLabelList(parseInt(wResult.results.inserted,10));
          console.log("MaintainNotice btnLabelPrimeAdd bulk save ok, ", wResult.results);
        }
      }
    }
  } catch (err) {
    console.log("MaintainNotice btnLabelPrimeAdd try-catch, err");
    console.log(err);
  }
}

export async function btnLabelPrimeRemove_click() {
  try {
    wTableRows = $w('#tblLabelEditObjects').rows;

    let wSelectedRowData = wTableRows[wSelectedRow];
    //console.log("Table length = ", wTableRows.length);
    let wId = wSelectedRowData._id;
    if/** allow if > 1 entry */ (wTableRows.length > 1) {
      wTableRows.splice(wSelectedRow,1);

      let wResult = await deleteRecord("lstLabels", wId);
      if (wResult){
        if (wTableRows.length === 0) {
          $w('#tblLabelEditObjects').collapse();
          $w('#lblLabelEditNone').expand();
        } else {
          $w('#lblLabelEditNone').collapse();
          $w('#tblLabelEditObjects').rows = wTableRows;
        }
        wSelectedRow = 0;
        updateLabelList(-1);
      } else {
        console.log("MaintainNotice btnLabelPrimeRemove delete record failed");
      }
    } else {
      showError("Label", 42);
    }
  } catch (err) {
      console.log("MaintainNotice btnLabelPrimeRemove try-catch, err");
      console.log(err);
    }
}

/**
export async function drpLabelChoiceChange(event) {
  showWait("Label");
  updatePagination("Label");
  hideWait("Label");
}
*/
export function doLabelViewChange(event) {
  let wView = event.target.value;
  doLabelView(wView);
}

//====== Label Supporting Functions ========================================================
//

async function loadLabels(){
    const wResult = await getAllLabels();
    if (wResult && wResult.status){
        const wLabels = wResult.labels;
        if (wLabels.length > 0) {
            $w("#boxLabelList").expand();
            $w("#boxLabelNone").collapse();
            $w('#rptLabelList').data = wLabels;
        } else {
            $w('#boxLabelList').collapse();
            $w('#boxLabelNone').expand();
        }
    }
}

export function doLabelView(pTarget) {
  if (pTarget === "P") {
    $w('#chkLabelListSelectAll').collapse();
    $w('#btnLabelListTop').collapse();
    $w('#rptLabelList').collapse();
  } else {
    $w('#chkLabelListSelectAll').expand();
    $w('#btnLabelListTop').expand();
    $w('#rptLabelList').expand();
  }
}

export async function clearLabelEdit() {

  $w('#inpLabelEditTitle').value = "";
  $w('#inpLabelEditTitle').enable();
  $w(`#tblLabelEditObjects`).rows = [];
  $w('#tblLabelEditObjects').collapse();
  $w('#lblLabelEditNone').expand();
  $w('#boxLabelPrime').expand();
  $w('#inpLabelEditTitle').focus();
  $w('#btnLabelPrimeAdd').disable();
  $w('#btnLabelPrimeRemove').disable();
  $w('#btnLabelPrimeRemove').disable();

}

export async function populateLabelEdit() {

  let wSelectedRecord = getSelectedItem("Label");

  const wKey = wSelectedRecord.title;
  $w('#inpLabelEditTitle').disable();
  $w('#inpLabelEditTitle').value = wKey;
  let wResult = await getLabelObjects(wKey);
  if (wResult && wResult.status){
    if (wResult.objects.length > 0) {
      $w('#tblLabelEditObjects').rows = wResult.objects.map( item => {
        return {
          "_id": item._id,
          "title": item.title,
          "name": item.name,
          "email": item.email || "",
          "memberId": item.memberId
        }
      });
      $w('#tblLabelEditObjects').expand();
      $w('#lblLabelEditNone').collapse();
      $w('#boxLabelPrime').expand();
      $w('#btnLabelPrimeRemove').enable();
    } else {
      $w('#tblLabelEditObjects').collapse();
      $w('#lblLabelEditNone').expand();
    }
  } else {
    $w('#tblLabelEditObjects').collapse();
    $w('#lblLabelEditNone').expand();
  }
}


function updateLabelList(pDelta){
  let wLabel = {
    _id: "",
    title: "",
    count: 0
  }
  try {
    if (getMode() === MODE.CREATE){
      const wKey = $w('#inpLabelEditTitle').value;
      const wKeyNoSpaces = wKey.replace(/\s/g,'');
      wLabel._id = wKeyNoSpaces;
      wLabel.title = wKey;
      wLabel.count = pDelta;
      $w('#tblLabelEditObjects').rows = wTableRows;
      $w('#tblLabelEditObjects').expand();
      $w('#lblLabelEditNone').collapse();    
    } else {
      let wRec = getSelectedItem("Label");
      wLabel._id = wRec._id;
      wLabel.title = wRec.title;
      wLabel.count = wRec.count + pDelta
    }
    updateGlobalDataStore(wLabel, "Label");
    updatePagination("Label");
  }
  catch (err) {
    console.log("MaintainNotice btnLabelPrimeRemove try-catch, err");
    console.log(err);
  }
}