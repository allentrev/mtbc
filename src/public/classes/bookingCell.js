const COLOUR = Object.freeze({
	FREE:		"#CFCF9B",
	SELECTED:	"#FFA500",
	NOT_IN_USE:	"rgba(180,180,180, 0.3)",
	BOOKED:		"#F2BF5E"
});


const CELL_STATUS = Object.freeze({
  CLOSED:	"C",
  BOOKED:	"B",
  OPEN:		"O"
});

const BOOKING_STATUS = Object.freeze({
  NEW:			"N",
  READY:		"R",
  OPEN:			"O",
  COMPLETED:	"P",
  MOVED:		"M",
  DELETED:		"D"
});

const gYear = new Date().getFullYear();

/** A booking cell represents the resource that a player can book. It represents a time slot
 * on a rink.
 */
export class BookingCell {
	/**
   * @param {string} pId The identifier of the cell in the form nm n = slot (0,noSlots), m= rink (0,noRinks)
   * 						Thus, cells have an id from 00 --> 06
   * 													10 --> 16
   * 													  -''-
   * 													40 --> 46
   * 						This includes the header row and row descriptors, so the bookable resources run from
   * 						11 --> 16
   * 							-''-
   * 						41 --> 46  ie cell(slot, rink)
   * @param {string} pCellStatus The status of the cell. Can take values:
   *  - C(losed, ie not in use)
   *  - B(ooked ie the cell contains a booking)
   *  - O(pen  ie the cell is available for a booking)
   *  - 
   */
	constructor(pJDate, pId, pCellStatus) {   
		this.doClear(pId);
		/** 
		this._JDate = pJDate;
		this._requiredYear = 0;
		this._requiredMonth = 0;
		this._startTime = "";
		this._duration = "01:30";
		this._id = pId;
		this._slot = parseInt(String(pId)[0],10);
		this._rink = parseInt(String(pId)[1],10);
		this._rangeId = 0;
		this._resourceKey = "";
		this._cellStatus = pCellStatus;
		this._dateBooked = new Date();
		this._bookerId = "";
		this._booker = "";
		this._header = "";
        this._noPlayers = "";
        this._playerAId = "";
        this._playerA = "";
        this._playerBId = "";
        this._playerB = "";
		this._compRef = "";
		this._compTitle = "";
		this._matchKey = "";
        this._usage = "";
		this._round = 0;
        this._bookingRef = "";
		this._bookingStatus = BOOKING_STATUS.OPEN;
		this._scoreA = 0;
		this._scoreB = 0;
		this._isBye = "N";
		this._hasChildren = "N";
		this._noChildren = 0;
		this._parentId = "";
		this._eventId = "";
        this._V = "";
        */
		this._JDate = pJDate;
		this._id = pId;
		this._slot = parseInt(String(pId)[0],10);
		this._rink = parseInt(String(pId)[1],10);
		this._cellStatus = pCellStatus;
		this._dateBooked = new Date();
		this._resourceKey = String(gYear).padStart(4,"0") + String(this._JDate).padStart(3,"0")
				+"S" + String(this._slot).padStart(2,"0") + "R" + String(this._rink).padStart(2,"0");

        if (pCellStatus === CELL_STATUS.CLOSED) {
            this._backgroundColour = COLOUR.NOT_IN_USE;
            this._header = "Rink";
            this._noPlayers = "is";
            this._playerA = "not";
			this._V = "in";
			this._playerB = "use";
        } else if (pCellStatus === CELL_STATUS.BOOKED) {
            this._backgroundColour = COLOUR.BOOKED;
			this._header = "";
            this._noPlayers = "";
            this._playerA = "";
			this._V = "";
			this._playerB = "";
        } else {
            this._backgroundColour = COLOUR.FREE;
			this._header = "";
            this._noPlayers = "";
            this._playerA = "";
			this._V = "";
			this._playerB = "";
		}
        // bind all methods
        this.getRepeaterItem = this.getRepeaterItem.bind(this);
        this.doClear = this.doClear.bind(this);
        //this.isEmpty = this.isEmpty.bind(this);

	}

    //  ======================================================= Getters & Setters ===============================================
    //
	
	get JDate() {                 
		return this._JDate;
	}
	set JDate(pNum) {
		this._JDate = pNum;
		this._resourceKey = String(this._requiredYear).padStart(4,"0") + String(this._JDate).padStart(3,"0")
				+"S" + String(this._slot).padStart(2,"0") + "R" + String(this._rink).padStart(2,"0");
	}

	get requiredYear() {                 
		return this._requiredYear;
	}
	set requiredYear(pNum) {
		this._requiredYear = pNum;
		this._resourceKey = String(this._requiredYear).padStart(4,"0") + String(this._JDate).padStart(3,"0")
				+"S" + String(this._slot).padStart(2,"0") + "R" + String(this._rink).padStart(2,"0");

	}
	get requiredMonth() {                 
		return this._requiredMonth;
	}
	set requiredMonth(pNum) {
		this._requiredMonth = pNum;
	}
	
	get startTime() {                 
		return this._startTime;
	}
	set startTime(pTime) {
		this._startTime = pTime;
	}
		
	get duration() {                 
		return this._duration;
	}
	set duration (pDuration) {
		this._duration = pDuration;
	}
	
	get id() {
		return this._id;
	}
	set id(pId) {
		//TODO Do we really wan to allow this to change - yes, cos its used to copy cells 
		this._id = pId;
		this._slot = parseInt(String(pId)[0],10);
		this._rink = parseInt(String(pId)[1],10);
		this._resourceKey = String(this._requiredYear).padStart(4,"0") + String(this._JDate).padStart(3,"0")
							+"S" + String(this._slot).padStart(2,"0") + "R" + String(this._rink).padStart(2,"0");
	}
	
	get slot() {
		return this._slot;
	}

	get rink() {
		return this._rink;
	}

	get header() {
		return this._header;
	}
	set header(pTxt) {
		this._header = pTxt;
	}
	
	get parentId() {
		return this._parentId;
	}
	set parentId(pId) {
		this._parentId = pId;
	}
	get hasChildren() {
		return this._hasChildren;
	}
	set hasChildren(pHasChildren) {
		this._hasChildren = pHasChildren;
	}
	
	get noChildren() {
		return this._noChildren;
	}
	set noChildren(pNum) {
		this._noChildren = pNum;
	}

	get V() {
		if (this._V === "" || this._V === null || this._V === undefined) {
			return " ";
		} else {
			if (this._bookingStatus === BOOKING_STATUS.COMPLETED) {
				if (Number.isInteger(this._scoreA) && Number.isInteger(this._scoreB)) {
					let wS = String(this._scoreA) + " v " + String(this._scoreB);
					return wS;
				}
			}
		}
		return this._V;
	}
	set V(pTxt) {
		this._V = pTxt;
	}

	get cellStatus() {
		return this._cellStatus;
	}
	set cellStatus(pIn) {
        if (pIn === CELL_STATUS.CLOSED) {
            this._header = "Rink";
            this._noPlayers = "is";
            this._playerA = "not";
            this._V = "in";
            this._playerB = "use";

            this._backgroundColour = COLOUR.NOT_IN_USE;
        } else if (pIn === CELL_STATUS.BOOKED) {
            this._backgroundColour = COLOUR.BOOKED;
        }
		 else {
            this._backgroundColour = COLOUR.FREE;
		}

		this._cellStatus = pIn;
	}
	
	get bookerId() {
		return this._bookerId;
	}
	set  bookerId(pId) {
		this._bookerId = pId;
	}
	
	get booker() {
		return this._booker;
	}
    set booker(pTxt){
		this._booker = pTxt;
	}
	
    get noPlayers() {
        return this._noPlayers;
    }
    set noPlayers(pNum) {
		this._noPlayers = pNum;
	}

	get playerAId() {
		return this._playerAId;
	}
	set playerAId(pId) {
		if (pId === "" || pId === " " || pId === null || pId === undefined) {
            this._playerAId = null
            this._playerA = " ";
            this._V = " ";
        } else {
			this._playerAId = pId;
		}
	}

	get playerA() {
		return this._playerA;
	}
    set playerA(pTxt){
		this._playerA = pTxt;
	}

	get playerBId() {
		return this._playerBId;
	}
	set playerBId(pId) {
		if (pId === "" || pId === " " || pId === null || pId === undefined) {
            this._playerBId = null
            this._playerB = " ";
            this._V = "*";
        } else {
			this._V="v";
			this._playerBId = pId;
		};
    }

   	get playerB() {
		if (this._playerB === "" || this._playerB === null || this._playerB === undefined) {
			return " ";
		} else {
			return this._playerB;
		}
	}
    set playerB(pTxt){
		this._playerB = pTxt;
	}

	get compRef() {
		return this._compRef;
	}
	set  compRef(pIn) {
		this._compRef = pIn;
	}

	get compTitle() {
		return this._compTitle;
	}
	set  compTitle(pIn) {
		this._compTitle = pIn;
	}

	get matchKey() {
		return this._matchKey;
	}
	set  matchKey(pIn) {
		this._matchKey = pIn;
	}

	get usage() {
		return this._usage;
	}
	set  usage(pIn) {
		//this._header = pIn;
		this._usage = pIn;
	}

	get round() {
		return this._round;
	}
	set round(pNum) {
		this._round = pNum;
	}

	get bookingRef() {
		return this._bookingRef;
	}
	set  bookingRef(pIn) {
		this._bookingRef = pIn;
	}

	get bookingStatus() {
		return this._bookingStatus;
	}
	set  bookingStatus(pIn) {
		this._bookingStatus = pIn;
	}
	
	get scoreA() {
		return this._scoreA;
	}
	set scoreA(pNum) {
		this._scoreA = pNum;
	}

	get scoreB() {
		return this._scoreB;
	}
	set scoreB(pNum) {
		this._scoreB = pNum;
	}

    get backgroundColour() {
        return this._backgroundColour;
    }
    set backgroundColour(pColour) {
		this._backgroundColour = pColour;
	}

	get rangeId() {
		return this._rangeId;
	}
    set rangeId(pId){
		this._rangeId = pId;
	}
	get dateBooked() {
		return this._dateBooked;
	}
    set dateBooked(pDate){
		this._dateBooked = pDate;
	}
	get isBye() {
		return this._isBye;
	}
    set isBye(pMkr){
		this._isBye = pMkr;
	}
	get resourceKey() {
		return this._resourceKey;
	}
    //set resourceKey(pKey){
	//	this._resourceKey = pKey;
	//}

	get eventId() {
		return this._eventId;
	}
    set eventId(pId){
		this._eventId = pId;
	}
    //  ======================================================= Methods ===============================================
    //

    getRepeaterItem() {
		const wOut = {
			"_id": this._id,
			"cellStatus": this._cellStatus,
			"backgroundColour": this._backgroundColour,
			"header": this._header,
			"noPlayers": this._noPlayers,
			"playerA": this._playerA,
			"V": this._V,
			"playerB": this._playerB
		}
        return wOut;
    }

	//DEPRECATED
	/**
	isEmpty() {
	 (this._id === "00" || this._id === "01" || this._id === "03") {
			return true;
		}
		return false;
	}
	*/

	doClear(pId) {
		this._id = pId;    
		this._JDate = 0;
		this._requiredYear = 0;
		this._requiredMonth = 0;
		this._startTime = "";
		this._duration = "01:30";
		this._cellStatus = CELL_STATUS.OPEN;
		this._resourceKey = "";
		this._dateBooked = new Date();
		this._bookerId = "";
		this._booker = "";
		this._header = "";
        this._noPlayers = "";
        this._playerAId = "";
        this._playerA = "";
        this._playerBId = "";
        this._playerB = "";
		this._compRef = "";
		this._compTitle = "";
		this._matchKey = ""
        this._usage = "";
		this._round = 0;
        this._bookingRef = "";
        this._bookingStatus = BOOKING_STATUS.OPEN;
		this._scoreA = 0;
		this._scoreB = 0;
		this._hasChildren = "N";
		this._noChildren = 0;
		this._parentId = "";
		this._eventId = "";
        this._V = "";
        this._backgroundColour = COLOUR.FREE;
		return true;
	}
}	// End of Class
