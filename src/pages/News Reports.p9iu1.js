// For full API documentation, including code examples, visit https://wix.to/94BuAAs
import {formatDate} from "public/fixtures";

$w.onReady(function () {
	$w("#dstNewsReport").onReady( () => {
  		let count = $w("#dstNewsReport").getTotalCount();
		$w('#dstNewsReport').setCurrentItemIndex(count)
		.then( () => {
			processCurrentItem();
		}) 
		if (count === 0) {
			$w('#cstrpNews').collapse();
			$w('#cstrpBanner').expand();
		} else {
			$w('#cstrpNews').expand;
			$w('#cstrpBanner').collapse();
		}
	});
	
	$w("#dstNewsReport").onCurrentIndexChanged( (index) => {
		processCurrentItem();
	});
});

export function processCurrentItem() {
		if ($w("#dstNewsReport").hasNext()) {
			$w('#ibtnNext').show();
		} else {
			$w('#ibtnNext').hide();
		}
		if ($w("#dstNewsReport").hasPrevious()) {
			$w('#ibtnPrevious').show();
		} else {
			$w('#ibtnPrevious').hide();
		}
		let wDate = formatDate($w('#dstNewsReport').getCurrentItem().week);
		$w('#txtWeek').text = wDate.day + ", " + wDate.dayN + wDate.cardinal + " " + wDate.month + " " + wDate.year;
}