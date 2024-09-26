//------------------------------------------------------------------------------------------------------
//
//	The pupose of this lightbox is give the user the means to select a memberof the club and pass that 
//  member's details to the calling facility.
//
//------------------------------------------------------------------------------------------------------
import wixData		from 'wix-data';
import wixWindow	from 'wix-window';

const HL_COLOR = "rgba(190,190,250)";
const REG_COLOR = "rgba(222,222,222)";

let listSize;
let currIndex = -1;

class objMember  {
  constructor(id, firstName, surname) {
    this.id = id;
	this.firstName = firstName;
	this.surname = surname;
	this.fullName = firstName + " " + surname;
  }
}

$w.onReady(function () {

	$w('#inpName').onKeyPress((event) => {
		setTimeout(() => {
			if ($w('#inpName').value.length === 0) {
				currIndex = -1;
				$w("#rptDropdown").collapse()
					.then(() => {
						//console.log("Done with collapse a1");
					});
			} else {

				switch (event.key) {
				case "Enter":
					$w('#inpName').value = $w('#rptDropdown').data[currIndex].surname;
					$w("#rptDropdown").collapse()
						.then(() => {
							//console.log("Done with collapse a2");
						});
					break;
				case "ArrowLeft":
				case "ArrowRight":
					break;
				case "ArrowUp":
					if (currIndex > 0) {
						currIndex -= 1;
						refresh_repeater();
					}
					break;
				case "ArrowDown":
					if (currIndex < listSize - 1) {
						currIndex += 1;
						refresh_repeater();
					}
					break;
				case "Escape":
					$w('#inpName').value = '';
					currIndex = -1;
					$w("#rptDropdown").collapse()
						.then(() => {
							//console.log("Done with collapse a3");
						});
					break;
				default:
					currIndex = -1;
					//wixData.query("memberProfile")
					wixData.query("lstMembers")
						.startsWith("surname", $w('#inpName').value)
						.startsWith("firstName", $w('#inpFirst').value)
						.ne("type", "Past")
						.ascending("surname")
						.limit(10)
						.find()
						.then((res) => {
							//console.log("found " + res.items.toSource());
              				$w('#rptDropdown').data = [];
			 	 			let nameList = [];
              				nameList = res.items.map(item => {
		            			return {
                  					_id: item._id,
									firstName: item.firstName,
									surname: item.surname,
				  					fullName: item.firstName + " " + item.surname
		          			}});
              				$w('#rptDropdown').data = nameList;
							listSize = res.items.length;
							$w('#rptDropdown').expand();
							//refresh_repeater();
						});
					break;
				}
			}
		}, 50)
	});

	$w('#inpFirst').onKeyPress((event) => {
		setTimeout(() => {
			if ($w('#inpFirst').value.length === 0) {
				currIndex = -1;
				$w("#rptDropdown").collapse()
					.then(() => {
						//console.log("Done with collapse b1");
					});
			} else {
				switch (event.key) {
				case "Enter":
					$w('#inpFirst').value = $w('#rptDropdown').data[currIndex].firstName;
					$w("#rptDropdown").collapse()
						.then(() => {
							//console.log("Done with collapse b2");
						});
					break;
				case "ArrowLeft":
				case "ArrowRight":
					break;
				case "ArrowUp":
					if (currIndex > 0) {
						currIndex -= 1;
						refresh_repeater();
					}
					break;
				case "ArrowDown":
					if (currIndex < listSize - 1) {
						currIndex += 1;
						refresh_repeater();
					}
					break;
				case "Escape":
					$w('#inpFirst').value = '';
					currIndex = -1;
					$w("#rptDropdown").collapse()
						.then(() => {
							//console.log("Done with collapse b3");
						});
					break;
				default:
					currIndex = -1;
					//wixData.query("memberProfile")
					wixData.query("lstMembers")
						.startsWith("surname", $w('#inpName').value)
						.startsWith("firstName",$w('#inpFirst').value)
						.ne("type", "Past")
						.ascending("surname")
						.limit(10)
						.find()
						.then((res) => {
							//console.log("found " + res.items.toSource());
              				$w('#rptDropdown').data = [];
			 	 			let nameList = [];
              				nameList = res.items.map(item => {
		            			return {
                  					_id: item._id,
									firstName: item.firstName,
									surname: item.surname,
				  					fullName: item.firstName + " " + item.surname
		          			}});
              				$w('#rptDropdown').data = nameList;
							listSize = res.items.length;
							$w('#rptDropdown').expand();
							//refresh_repeater();
						});
					break;
				}
			}
		}, 50)
	});
	
	$w('#rptDropdown').onItemReady(($item, itemData, index) => {
		loadDropdown($item, itemData, index);
	});

});

function refresh_repeater() {
	$w("#rptDropdown").forEachItem(($item, itemData, index) => {
		//console.log("Item = " + itemData.toSource());
		$item('#txtName').text = itemData.fullName;

		if (index === currIndex) {
			$item("#rptBox").style.backgroundColor = HL_COLOR;
		} else {
			$item("#rptBox").style.backgroundColor = REG_COLOR;
		}

		$item('#container3').onClick(() => {
			$w('#inpName').value = itemData.surname;
			$w('#inpFirst').value=itemData.firstName;
			$w('#rptDropdown').collapse();
		});
	});
}

export function loadDropdown($item, itemData, index) {
	//Add your code for this event here:
	//console.log("Index = ", index, itemData.fullName);
	$item('#txtName').text = itemData.fullName;
	//$item('#txtId').text = itemData._id;

	if (index === currIndex) {
		$item("#rptBox").style.backgroundColor = HL_COLOR;
	} else {
		$item("#rptBox").style.backgroundColor = REG_COLOR;
	}

	$item('#container3').onClick(() => {
		$w('#inpName').value = itemData.surname;
		$w('#inpFirst').value = itemData.firstName;
		$w('#txtId').text = itemData._id;
		$w('#rptDropdown').collapse();
	});
}

export function btnAccept_click(event) {
	//Add your code for this event here: 
    var m = new objMember($w('#txtId').text,$w('#inpFirst').value, $w('#inpName').value);

	wixWindow.lightbox.close(m);

}

export function btnClose_click(event) {
	//Add your code for this event here: 
	wixWindow.lightbox.close(false);
}
