import wixData from "wix-data";
import { Permissions, webMethod } from "wix-web-module";

import { getSecret } from "wix-secrets-backend";
//import { created } from "wix-http-functions";
import { fetch, getJSON } from "wix-fetch";

//----------------------------------------------Template------------------------------------------------
/**
export const name1 = webMethod(Permissions.Anyone, async (pUserId) => {
    try {
        return { status: true, notices: null, error: null };
    } catch (err) {
        console.log(`/backend/backNotices name1 by ${pUserId} Try-catch, err`);
        console.log(err);
        return { status: false, notices: null, error: err };
    }
});
*/
//-------------------------------- test data -----------------------------------
// 88f9e943-ae7d-4039-9026-ccdf26676a2b	Me
// ab308621-7664-4e93-a7aa-a255a9ee6867	Sarah
// 51e6946d-6ef8-4da6-acf3-8896a1b3db6e Tom Brash
// 6e5b5de1-214f-4b03-badf-4ae9a6918f77 Tim
// 5c759fef-91f6-4ca9-ac83-f1fe2ff2f9b9 Tony

// 0b331007-0dde-43b5-a06e-16794fd291c0 Julia
// 15909692-9e75-4e26-a277-5506c3dda84d	betty

export const summariseText = webMethod(
    Permissions.Anyone,
    async (pText, pNoSentences) => {
        try {
            console.log("Inside", pText, pNoSentences);
            const apiKey = await getSecret("APIVerve");

            let url = "https://api.apiverve.com/v1/textsummarizer?=";

            let wEntry = pText.trim();
            console.log(wEntry);

            let body = { text: wEntry, sentences: 2 };
            let bodyJson = JSON.stringify(body);

            let options = {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: bodyJson,
            };

            return fetch(url, options)
                .then((response) => {
                    return response.json();
                })
                .then((json) => {
                    return {
                        status: true,
                        summary: json.data.summary,
                        error: null,
                    };
                })
                .catch((error) => {
                    console.log(
                        "backend/backNotices summariseText Catch error, error",
                    );
                    console.log(error);
                    return { status: true, summary: null, error: error };
                });
        } catch (err) {
            console.log(`/backend/backNotices summariseText Try-catch, err`);
            console.log(err);
            return { status: false, summary: null, error: err };
        }
    },
);

//====== Notices----------------------------------------------------------------------
//
export const getAllNotices = webMethod(Permissions.Anyone, async (pYear) => {
    try {
        let wThisYear = new Date(pYear, 0, 1, 10, 0, 0);
        const results = await wixData
            .query("lstNotices")
            .ge("_createdDate", wThisYear)
            .descending("_createdDate")
            .find();
        return { status: true, notices: results.items, error: null };
    } catch (err) {
        console.log(`/backend/backNotices getAllNotices Try-catch, err`);
        console.log(err);
        return { status: false, notices: null, error: err };
    }
});

export const updateNoticeStatus = webMethod(
    Permissions.Anyone,
    async (pUserId, pNoticeId, pStatus) => {
        try {
            return wixData
                .get("lstNotices", pNoticeId)
                .then((item) => {
                    item.status = pStatus;
                    return wixData.update("lstNotices", item);
                })
                .then((result) => {
                    return { status: true, notice: result, error: null };
                })
                .catch((err) => {
                    return { status: false, notice: null, error: err };
                });
        } catch (err) {
            console.log(
                `/backend/backNotices updateNoticeStatus by ${pUserId} Try-catch, err`,
            );
            console.log(err);
            return { status: false, notice: null, error: err };
        }
    },
);
export const bulkDeleteRecords = webMethod(Permissions.Anyone, async (pSrc, pUserId, pDataset, pIds) => {
    try {
        return wixData.bulkRemove(pDataset, pIds)
        .then( (results) => {
            console.log(
                `/backend/backNotices BulkDeleteRecords from ${pSrc} by user ${pUserId} bulk delete ok;
                 dataset ${pDataset} ${results.removed} deleted, ${results.skipped} skipped, ${results.errors.length} errors`
            );                      
            return true;
        })
        .catch( (error) => {
            console.log("/backend/backNotices bulkDeleteRecords Catch, error ");
            console.log(error);
            return false;
        });
    } catch (err) {
        console.log(`/backend/backNotices bulkDeleteRecords Try-catch, err`);
        console.log(err);
        return false;
    }
});

//====== Labels--------------------------------------------------------------------------------------
export const getAllLabels = webMethod(Permissions.Anyone, async () => {
    try {
        const results = await wixData
            .query("lstLabels")
            .ascending("title")
            .find();
        return { status: true, labels: results.items, error: null };
    } catch (err) {
        console.log(`/backend/backNotices getAllLabels Try-catch, err`);
        console.log(err);
        return { status: false, labels: null, error: err };
    }
});

export const getLabelObjects = webMethod(Permissions.Anyone, async (pKey) => {
    try {
        const results = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .ascending("title")
            .ascending("name")
            .find();
        return { status: true, objects: results.items, error: null };
    } catch (err) {
        console.log(`/backend/backNotices getAllLabels Try-catch, err`);
        console.log(err);
        return { status: false, objects: null, error: err };
    }
});

export const getNoticeTableContent = webMethod(Permissions.Anyone, async (pKey) => {
    // used to populat ethe Notice Content table
    // needs _id, name, email
    try {
        let wLabelTableRows = [];
        const wResults = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .ascending("title")
            .ascending("name")
            .find();
        if (wResults && wResults.items.length > 0) {
            let wObjectList = wResults.items;
            for (let wMember of wObjectList) {
                wLabelTableRows.push(wMember.memberId);
            }
            return { status: true, rows: wLabelTableRows, error: null };
        } else {
            console.log(
                `/backend/backNotices getLabelTableRows no list objects found for ${pKey}`,
            );
            return {
                status: false,
                rows: null,
                error: "No list objects found",
            };
        }
    } catch (err) {
        console.log(
            `/backend/backNotices getLabelTableRows Try-catch for ${pKey}, err`,
        );
        console.log(err);
        return { status: false, rows: null, error: err };
    }
});

export const getLabelTableRows = webMethod(Permissions.Anyone, async (pKey) => {
    try {
        let wLabelTableRows = [];
        const wResults = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .ascending("title")
            .ascending("name")
            .find();
        if (wResults && wResults.items.length > 0) {
            let wObjectList = wResults.items;
            for (let wMember of wObjectList) {
                wLabelTableRows.push(wMember.memberId);
            }
            return { status: true, rows: wLabelTableRows, error: null };
        } else {
            console.log(
                `/backend/backNotices getLabelTableRows no list objects found for ${pKey}`,
            );
            return {
                status: false,
                rows: null,
                error: "No list objects found",
            };
        }
    } catch (err) {
        console.log(
            `/backend/backNotices getLabelTableRows Try-catch for ${pKey}, err`,
        );
        console.log(err);
        return { status: false, rows: null, error: err };
    }
});

export const getLabelMembersSet = webMethod(
    Permissions.Anyone,
    async (pLabelId) => {
        try {
            let wLabelMembers = [];
            const results = await wixData
                .query("lstLabelMember")
                .eq("labelId", pLabelId)
                .find();
            if (results && results.items.length > 0) {
                wLabelMembers = results.items;
                return { status: true, labelMembers: wLabelMembers, error: null };
            } else {
                return { status: true, labelMembers: [], error: null };
            }
        } catch (err) {
            console.log(
                `/backend/backNotices getLabelMembersSet Try-catch, err`,
            );
            console.log(err);
            return { status: false, members: [], error: err };
        }
    },
);

export const getMemberLabelsSet = webMethod(
    Permissions.Anyone,
    async (pMemberId) => {
        try {
            let wMemberLabels = [];
            const results = await wixData
                .query("lstLabelMember")
                .eq("memberId", pMemberId)
                .find();
            if (results && results.items.length > 0) {
                wMemberLabels = results.items;
                return { status: true, memberLabels: wMemberLabels, error: null };
            } else {
                return { status: true, memberLabels: [], error: null };
            }
        } catch (err) {
            console.log(
                `/backend/backNotices getMemberLabelsSet Try-catch, err`,
            );
            console.log(err);
            return { status: false, memberLabels: [], error: err };
        }
    },
);
/**
                $w("#tblLabelEditObjects").rows = wTableRows;
                let wDBUpdate = wTableRows.map((item) => {
                    return {
                        _id: item._id,
                        title: item.title,
                        memberId:
                            item && item.memberId && item.memberId.length > 0 ?
                                item.memberId
                            :   null,
                        name:
                            item && item.name && item.name.length > 0 ?
                                item.name
                            :   null,
                        email:
                            item && item.email && item.email.length > 0 ?
                                item.email
                            :   null,
                    };
                });
                let wResult = await bulkSaveRecords("lstLabels", wDBUpdate);
                if (wResult && wResult.status) {
                    updateLabelList(parseInt(wResult.results.inserted, 10));
                    console.log(
                        "MaintainNotice btnLabelPrimeAdd bulk save ok, ",
                        wResult.results
                    );
                }

  */


export const initialiseReferenceLabels = webMethod(Permissions.Anyone, async () => {
    try {
        let wList = [];
        const wReservedList = ["All", "Ladies", "Men", "None", "SMS"];

        for (let wItem of wReservedList ){
            let wResult = await findLabelByKey(wItem);
            let wLabel = wResult.label;
            wList.push(wLabel._id);
        }
        return { "status": true, "list": wList, "error": null};

    } catch (err) {
        console.log(`/backend/backNotices initialiseReferenceLabels Try-catch, err`);
        console.log(err);
        return { "status": false, "list": [] , "error": err };
    }
});

export const findLabelByKey = webMethod(Permissions.Anyone, async (pKey) => {
    try {
        const results = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .find();
        const wRecords = results.items;
        if (wRecords && wRecords.length === 0) {
            return {"status": false, "label": [], "error": "No records found"};
        } else if (wRecords && wRecords.length === 1){
            return {"status": true, "label": wRecords[0], "error": ""};
        } else {
            return { status: false, "label": wRecords[0], error: "Multiple records found" };
        }
    } catch (err) {
        console.log(`/backend/backNotices isLabelUnique Try-catch, err`);
        console.log(err);
        return { "status": false, "label": null , "error": "Try catch error: See log" };
    }
});

export const isLabelUnique = webMethod(Permissions.Anyone, async (pKey) => {
    try {
        const results = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .find();
        const wRecords = results.items;
        if (wRecords && wRecords.length > 0) {
            return false;
        } else {
            return true;
        }
    } catch (err) {
        console.log(`/backend/backNotices isLabelUnique Try-catch, err`);
        console.log(err);
        return false;
    }
});

export const doesLabelExist = webMethod(Permissions.Anyone, async (pKey) => {
    try {

        const results = await wixData
            .query("lstLabels")
            .eq("title", pKey)
            .find();
        const wRecords = results.items;

        if (wRecords && wRecords.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.log(`/backend/backNotices doesLabelExist Try-catch, err`);
        console.log(err);
        return false;
    }
});