import {BookingCell}    from 'public/classes/bookingCell.js';

// Filename: public/classes/bookingGrid.js 
//
/**
 * Enum for Competition object status values
 * @readonly
 * @enum {String}
 */
export const CELL = Object.freeze({
  BOOKED:		"B",
  OPEN:	    	"O",
  CLOSED:	    "C"
});

const BOOKING_STATUS = Object.freeze({
  NEW:			"N",
  READY:		"R",
  OPEN:			"O",
  COMPLETED:	"P",
  MOVED:		"M",
  DELETED:		"D"
});

/**
 * Note that MAX-RINKS is a physical limit and is the actual number of rinks run by the club.
 * It is not subject to change from day to day like nO-Of_rinks is. It is used to Initialise the
 * Grid so as to include both Not Used and Open units.
 * TODO: It should be a paramter in Settings and able it to be part of customisation process for a club
 */
let MAX_SLOTS = 6;
const MAX_RINKS = 7;

export class BookingGrid {
	constructor(pSlots, pRinks) {
        let wSlots = parseInt(pSlots,10);
        let wRinks = parseInt(pRinks,10);   
		this._no_of_rinks = wRinks;
        this._no_of_slots = wSlots;    
		this._cells = [];

        // bind all methods
        this.getCell = this.getCell.bind(this);
        this.getCol = this.getCol.bind(this);
        this.getRow = this.getRow.bind(this);
        this.refresh = this.refresh.bind(this);
        this.initialiseGrid = this.initialiseGrid.bind(this);
        this.printGrid = this.printGrid.bind(this);
        this.moveCell = this.moveCell.bind(this);
        this.clearCell = this.clearCell.bind(this);
        this.getExtraSlots = this.getExtraSlots.bind(this);
        this.getParentCell = this.getParentCell.bind(this);
        this.getNoChildren = this.getNoChildren.bind(this);
        
    }
    

	get noOfRinks () {
		return this._no_of_rinks;
	}
	set noOfRinks (pNum) {
        //console.log("Set ", String(pNum));
		this._no_of_rinks = parseInt(pNum,10);
	}

	get noOfSlots () {
		return this._no_of_slots;
	}
	set noOfSlots (pNum) {
        MAX_SLOTS = pNum + 1;
		this._no_of_slots = parseInt(pNum,10);
	}

    get cells() {
        return this._cells;
    }

    getData() {
        //let x = this.noOfSlots+1;
        let wDataOut = [];
        for ( let j= 1; j < MAX_SLOTS; j++) {
            for (let i = 0; i < MAX_RINKS ; i++){
                //console.log("Grid GetData j,i", j, i);
                let wCell = this.getCell(j, i)
                let wDisplayCell = wCell.getRepeaterItem();
                wDataOut.push(wDisplayCell);
            }
        }
        return wDataOut;        // this doesnt include the header row, but does include header column
    }
    
    getParentCell(pId, pParentId){
        //console.log("Grid: getParentCell", pId, pParentId);
        let wSlot = parseInt(pId[0],10) - 1;
        let wRink = parseInt(pId[1],10);
        let wCell = {};
        for (let i = 0; i < wSlot; i++) {
            let index = wSlot - i;
            wCell = this.getCell(index, wRink);
            //console.log("NExt Cell", index, wRink);
            //console.log(wCell);
            if (wCell.hasChildren === "Y" || (wCell.hasChildren === "N" && wCell.parentId === "")) {
                return wCell;
            }         
        }
        return wCell;
    }

    getRow(pSlot) {
        let wDataOut = [];
        let wSlot = parseInt(pSlot,10);
        for (let i = 0; i < MAX_RINKS -1 ; i++){
            let wCell = this.getCell(wSlot, i+1);
            let wCellDisplay = wCell.getRepeaterItem();
            wDataOut.push(wCellDisplay);
        }
        return wDataOut;
    }
    
    getCol(pRink) {
        let wDataOut = [];
        let wCol = parseInt(pRink,10);
        for (let i = 1; i < MAX_SLOTS ; i++){
            let wCell = this.getCell(i, pRink);
            let wCellDisplay = wCell.getRepeaterItem();
            wDataOut.push(wCellDisplay);
        }
        return wDataOut;
    }

    getCell(pSlot, pRink) {
        let wSlot = parseInt(pSlot,10);
        let wRink = parseInt(pRink,10);
        let wKey = String(wSlot) + String(wRink);
        for (let wX of this._cells){
            if (wX.id === wKey) {
                return wX;
            }            
        }
        return null;
    }

    getNoChildren(pSlot, pRink){
        let wSlot = parseInt(pSlot,10);
        let wRink = parseInt(pRink,10);
        let wCount = 0;
        for (let index = wSlot +1; index <= this._no_of_slots; index++) {
            const wCell = this.getCell(index, wRink);
            //console.log("GES slot, rink, cell", index, pRink);
            //console.log(wCell);
            if (wCell.parentId) {
                wCount++;
            }
        }
            //console.log("return count = ", wCount);
        return wCount;
    }

    getExtraSlots(pSlot,pRink){
        let wCount = 0;
        let wSlot = parseInt(pSlot,10);
        let wRink = parseInt(pRink,10);
        //console.log("GES pSlot rink, no_slots", wSlot, wRink,  this._no_of_slots);
        for (let index = wSlot +1; index <= this._no_of_slots; index++) {
            const wCell = this.getCell(index, wRink);
            //console.log("GES slot, rink, cell", index, wRink);
            //console.log(wCell);
            if (wCell.cellStatus === CELL.BOOKED || wCell.cellStatus === CELL.CLOSED) {
                break;
            }
            wCount++;
        }
            //console.log("return count = ", wCount);
        return wCount;
    }
    
    clearCell(pSlot, pRink) {
        //console.log("In clearCell, cell", pSlot, pRink);
        let wCell = this.getCell(pSlot, pRink);
        let wHasChildren = wCell.hasChildren;
        let wNoChildren = this.getNoChildren(pSlot, pRink);
        if (wCell) {
            //console.log("Cell before", wHasChildren, wNoChildren);
            //console.log(wCell);
            wCell.doClear(String(pSlot) + String(pRink));
            //console.log("Cell after");
            //console.log(wCell);
        } else {
            console.log("/Public/classes/bookingGrid cleasrCell, cant find cell, cell", pSlot, pRink);
        }
        if (wHasChildren){
            for (let i = 1; i < wNoChildren + 1; i++){
                let wChild = this.getCell(pSlot+i, pRink);
                if (wChild) {
                    //console.log("Child before", wChild.id, wChild.slot, wChild.rink);
                    //console.log(wChild);
                    wChild.doClear(wChild.id);
                    //console.log("Child after");
                    //console.log(wChild);
                } else {
                    console.log("/Public/classes/bookingGrid cleasrCell, cant find child, child", String(i), pRink);
                }
            }
        }
    }

    moveCell (pFromId, pToId, pRef, pStartTime, pHasChildren, pNoChildren, pParentId) {
        let wFromCell = this.getCell(String(pFromId)[0], String(pFromId)[1]);
        let wToCell = this.getCell(String(pToId)[0], String(pToId)[1]);
        wToCell.startTime = pStartTime;
        wToCell.duration = wFromCell.duration;
        wToCell.cellStatus = wFromCell.cellStatus;
        wToCell.bookingStatus = wFromCell.bookingStatus;
        wToCell.bookerId = wFromCell.bookerId;
        wToCell.booker = wFromCell.booker;
        wToCell.header = wFromCell.header;
        wToCell.noPlayers = wFromCell.noPlayers;
        wToCell.playerAId = wFromCell.playerAId;
        wToCell.playerA= wFromCell.playerA;
        wToCell.playerBId = wFromCell.playerBId;
        wToCell.playerB = wFromCell.playerB;
        wToCell.compRef = wFromCell.compRef;
        wToCell.compTitle = wFromCell.compTitle;
        wToCell.matchKey = wFromCell.matchKey;
        wToCell.usage = wFromCell.usage;
        wToCell.round = wFromCell.round;
        wToCell.bookingRef = pRef;
        wToCell.hasChildren = pHasChildren;
        wToCell.noChildren = pNoChildren;
        wToCell.parentId = pParentId;
        wToCell.rangeId = wFromCell.rangeId;
        wToCell.dateBooked = wFromCell.dateBooked;
        wToCell.isBye = wFromCell.isBye;
        //wToCell.resourceKey = pResourceKey;
        wToCell.eventId = wFromCell.eventId;
        wToCell.V = wFromCell.V;
        wToCell.backgroundColour = wFromCell.backgroundColour;
        //if (wSameDay){ 
        wFromCell.doClear(wFromCell.id);
        //}
    }

    refresh(pData) {
        //console.log("Booking Grid refresh (data length) ", pData.length);
        //console.log(pData);
        let wJDate = 0;
        if (pData.length > 0) {
            wJDate = parseInt(pData[0].resourceKey.substring(4,7),10)
        }
        //this.initialiseGrid(wJDate);
        for (let i = 0; i < pData.length; i++) {
            let item = pData[i];
            let wCell = this.getCell(item.slotId, item.rink);
            if (wCell) {
                let wCompRef = item.compRef;
                if (wCompRef.toUpperCase().includes("EVENT")) {
                    this.processEvent(item, wCell, wJDate);
                } else {
                    this.processBooking(item, wCell,wJDate);
                }
            }   // skip if cell is outside defined range
        }
        //return Promise.resolve(true);
        return true;
    }

    
    //update cell with data from pRec to refrsh grid
    processEvent( pRec, pCell, pJDate) {
        //console.log("Cell ", pCell.slot, pCell.rink, pRec.compRef);
        let wCompRef = pRec.compRef;
        let wBits = wCompRef.toUpperCase().split("/");
        let wEventType = wBits[1];
        let wCompTitle = pRec.compTitle;
        pCell.JDate = pJDate;
        pCell.requiredYear = pRec.requiredYear;
        pCell.requiredMonth = pRec.requiredMonth;
        let wStartTime = pRec.startTime;
        if (wStartTime === "" || wStartTime === null || wStartTime === undefined ){ 
            wStartTime = this.extractTime(pRec.dateRequired);
        }
        pCell.startTime = wStartTime;
        pCell.duration = pRec.duration;
        pCell.usage = String(pRec.usage);
        pCell.compRef = pRec.compRef;
        pCell.compTitle = wCompTitle;
        pCell.matchKey = pRec.matchKey;
        pCell.round = pRec.round;
        pCell.playerAId = pRec.playerAId;
        pCell.playerBId = pRec.playerBId;
        pCell.bookerId = pRec.bookerId;
        pCell.booker = pRec.booker;
        pCell.bookingRef = pRec._id;
        pCell.bookingStatus = pRec.status;
        pCell.scoreA = pRec.scoreA;
        pCell.scoreB = pRec.scoreB;
        pCell.hasChildren = pRec.hasChildren;
        pCell.noChildren = pRec.noChildren;
        //pCell.noChildren = pRec.noChildren;
        pCell.parentId = pRec.parentId;
        pCell.rangeId = pRec.rangeId;
        pCell.dateBooked = pRec.dateBooked;
        pCell.isBye = pRec.isBye;
        //pCell.resourceKey = pRec.resourceKey;
        pCell.eventId = pRec.eventId;
        pCell.cellStatus = CELL.BOOKED;                     //Note this is the cell status and not the booking status
        switch (wEventType) {
            case "CE":
            case "CG":
                let wWords = wCompTitle.split(" ");
                pCell.header = wWords[0];;
                pCell.noPlayers = ((wWords.length > 1) ? wWords[1] : "-");
                pCell.playerA  = ((wWords.length > 2) ? wWords[2] : "-");
                pCell.V = ((wWords.length > 3) ? wWords[3] : "-");
                pCell.playerB = ((wWords.length > 4) ? wWords[4] : "-");
                break;
            case "CN":
            case "CC":
                pCell.header = (wEventType === "CN") ? "National Game" : "County Game";
                pCell.noPlayers = pRec.compTitle;
                pCell.playerA  = pRec.usage;
                pCell.V = "v";
                pCell.playerB = pRec.playerBId;;
                break;
            case "FG":
            case "HG":
            case "EG":
            case "LG":
                pCell.header = pRec.compTitle;
                pCell.noPlayers = pRec.usage;
                pCell.playerA  = pRec.playerAId;
                pCell.V = "v";
                pCell.playerB = pRec.playerBId;;
                break;
            default:
                console.log("Process Record, event type default", "[" + wEventType + "]");
                pCell.header = pRec.compTitle;
                pCell.noPlayers = pRec.usage;
                pCell.playerA  = pRec.playerAId;
                pCell.V = "v";
                pCell.playerB = pRec.playerBId;;
                break;
        }
    }

    processBooking( pRec, pCell, pJDate) {
        pCell.usage = String(pRec.usage);
        let wCompTitle = pRec.compTitle;
        let wUse = String(pRec.usage);
        let wRound = pRec.round;
        if (wUse.includes("Ladder")) {               
            wUse = wUse + " / Day " + String(wRound);
        }
        pCell.compTitle = wCompTitle;
        pCell.matchKey = pRec.matchKey;
        pCell.round = wRound;
        pCell.JDate = pJDate;
        pCell.requiredYear = pRec.requiredYear;
        pCell.requiredMonth = pRec.requiredMonth;
        let wStartTime = pRec.startTime;
        if (wStartTime === "" || wStartTime === null || wStartTime === undefined ){ 
            wStartTime = this.extractTime(pRec.dateRequired);
        }
        pCell.startTime = wStartTime;
        pCell.duration = pRec.duration;
        pCell.playerAId = pRec.playerAId;
        pCell.playerBId = pRec.playerBId;
        pCell.bookerId = pRec.bookerId;
        pCell.booker = pRec.booker;
        pCell.bookingRef = pRec._id; 
        pCell.bookingStatus = pRec.status;
        pCell.scoreA = pRec.scoreA;
        pCell.scoreB = pRec.scoreB;
        pCell.hasChildren = pRec.hasChildren;
        //pCell.noChildren = pRec.noChildren;
        pCell.parentId = pRec.parentId;
        pCell.rangeId = pRec.rangeId;
        pCell.dateBooked = pRec.dateBooked;
        pCell.isBye = pRec.isBye;
        //pCell.resourceKey = pRec.resourceKey;
        pCell.eventId = pRec.eventId;
        pCell.cellStatus = CELL.BOOKED;                     //Note this is the cell status and not the booking status

        pCell.compRef = pRec.compRef;
        if (pCell.compRef === "MANUAL" || pCell.compRef === "" ||
             pCell.compRef === null || pCell.compRef === undefined){
            /** field 1 */ pCell.header = wUse;
            /** field 2 */ pCell.noPlayers = this.formatNoPlayersString(pRec.noPlayers);
            /** field 3 */ pCell.playerA = pRec.playerA;
            /** field 5 */ pCell.playerB = pRec.playerB;
        } else {
            switch (pCell.compRef) {
                case "OS01":
                    /** field 1 */ pCell.header = "Open Singles";
                    break;
                case "OP01":
                    /** field 1 */ pCell.header = "Open Pairs";
                    break;
                default:
                    /** field 1 */ pCell.header = pRec.compTitle;
                    break;
            }
            /** field 2 */ pCell.noPlayers = wUse;
            /** field 3 */ pCell.playerA = pRec.playerA;
            /** field 5 */ pCell.playerB = pRec.playerB;
        }
    }

    initialiseGrid(pJDate) {
        // NOte that these x & y values can vary depending on (Year)/JDate
        //
        // Cell Ids go from 00 -> 06 : 10 -> 16: ....; 50 -> 56
        //
        let x = this.noOfSlots+1;
        let y = this.noOfRinks+1;
        this._cells = [];
        //console.log("initialisegrid", MAX_SLOTS,MAX_RINKS, x, y);
        for ( let j= 0; j < MAX_SLOTS; j++) {
            if (j < x) {
                for (let i = 0; i < MAX_RINKS ; i++){
                    if (i < y){
                        let wCell = new BookingCell(pJDate,String(j) + String(i), CELL.OPEN);
                        this._cells.push(wCell);
                    } else {
                        let wCell = new BookingCell(pJDate,String(j) + String(i), CELL.CLOSED);
                        this._cells.push(wCell);
                    }
                }
            } else {
                for (let i = 0; i < MAX_RINKS ; i++){
                    let wCell = new BookingCell(pJDate,String(j) + String(i), CELL.CLOSED);
                    this._cells.push(wCell);
                }
            }
        }
    }

    extractTime(pDate){
        let wHours = pDate.getHours();
        let wMins = pDate.getMinutes();
        let wTime = String(wHours).padStart(2,"0") + ":" + String(wMins).padStart(2,"0");
        return wTime;
    }

    formatNoPlayersString(pIn) {
        let count = parseInt(pIn,10);
        let wOut = "";
        let num = "";
        if (count > 1) {
            num = "Players";
        } else {
            if (count === 1) {
                num = "Player";
            } else {
                num = ""
                count = "n/a";
            }
        }
        wOut = `${count} ${num}`;
        return wOut;
    }

    printGrid(){
        //console.log(this._cells);
        console.log("printGrid");
        let wCells = this._cells;
        for (let cell of wCells){
            //console.log(cell);
            console.log("Cell [" + cell.JDate + " / " + cell.id + " / " + cell.cellStatus + " / " + cell.header + " / " + cell.bookingRef + "]");
        }
        console.log("printGrid end");

    }

}   // End of Class

