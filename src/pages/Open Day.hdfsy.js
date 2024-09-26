import { loadStandingData } from 'backend/backSystem.jsw';

$w.onReady(async function () {

	let [wDate, wStartTime, wEndTime] = await loadStandingData("OpenDay");

	$w('#txtDateTime').text = `on ${wDate} - ${wStartTime} to ${wEndTime}. `;

});