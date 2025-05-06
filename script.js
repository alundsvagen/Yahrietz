// script.js for yahrzeits-calculator.html

// DOM Elements
const monthInput = document.getElementById('death-month');
const dayInput = document.getElementById('death-day');
const yearInput = document.getElementById('death-year');
const zipcodeInput = document.getElementById('zipcode');
const countrySelect = document.getElementById('country');

const hebrewDateDiv = document.getElementById('hebrew-date');
const hebrewEnglishDiv = document.getElementById('hebrew-english');
const gregorianDateDiv = document.getElementById('gregorian-this-year');
const sunsetTimeDiv = document.getElementById('sunset-time');
const candleLightTimeDiv = document.getElementById('candle-light-time');

// Prevent form submission from reloading the page
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', (e) => e.preventDefault());
});

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const hebrewMonths = {
  'Nisan': 'Nisan',
  'Iyyar': 'Iyar',
  'Sivan': 'Sivan',
  'Tamuz': 'Tammuz',
  'Av': 'Av',
  'Elul': 'Elul',
  'Tishrei': 'Tishrei',
  'Cheshvan': 'Cheshvan',
  'Kislev': 'Kislev',
  'Tevet': 'Tevet',
  'Shevat': 'Shevat',
  'Adar': 'Adar',
  'Adar I': 'Adar I',
  'Adar II': 'Adar II'
};

async function updateHebrewDate() {
  const gm = monthInput.value;
  const gd = dayInput.value;
  const gy = yearInput.value;

  if (!gm || !gd || !gy) return;

  try {
    const hebcalURL = `https://www.hebcal.com/converter?cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`;
    const hebcalRes = await fetch(hebcalURL);
    const hebcalData = await hebcalRes.json();

    const hebrewDate = `${hebcalData.hebrew}`;
    hebrewDateDiv.textContent = hebrewDate;

    const day = hebcalData.hd;
    const month = hebcalData.hm;
    const year = hebcalData.hy;
    const spelledOut = `${ordinal(day)} ${hebrewMonths[month] || month} ${year}`;
    hebrewEnglishDiv.textContent = spelledOut;

    const { hm, hd } = hebcalData;
    const hebrewToGregURL = `https://www.hebcal.com/converter?cfg=json&hy=5785&hm=${hm}&hd=${hd}&h2g=1`;
    const gregRes = await fetch(hebrewToGregURL);
    const gregData = await gregRes.json();

    const gregorianDate2025 = `${gregData.gy}-${String(gregData.gm).padStart(2, '0')}-${String(gregData.gd).padStart(2, '0')}`;
    gregorianDateDiv.textContent = gregorianDate2025;
  } catch (err) {
    console.error('Error fetching Hebrew date:', err);
    hebrewDateDiv.textContent = 'Error';
    hebrewEnglishDiv.textContent = 'Error';
    gregorianDateDiv.textContent = 'Error';
  }
}

[monthInput, dayInput, yearInput].forEach(input => {
  input?.addEventListener('change', updateHebrewDate);
});

zipcodeInput?.addEventListener('change', async () => {
  const gregDate = gregorianDateDiv.textContent;
  const zip = zipcodeInput.value;
  const country = countrySelect.value;
  if (!gregDate || !zip || !country) return;

  try {
    // Step 1: Get lat/lng from ZIP and country
    const zipURL = `https://api.zippopotam.us/${country}/${zip}`;
    const zipRes = await fetch(zipURL);
    const zipData = await zipRes.json();

    const lat = parseFloat(zipData.places[0].latitude);
    const lng = parseFloat(zipData.places[0].longitude);

    // Step 2: Get sunset time from Sunrise-Sunset API
    const sunsetURL = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${gregDate}&formatted=0`;
    const sunsetRes = await fetch(sunsetURL);
    const sunsetData = await sunsetRes.json();

    const sunsetUTC = sunsetData.results.sunset;
    const sunsetDate = new Date(sunsetUTC); // correctly parsed as UTC

    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    sunsetTimeDiv.textContent = sunsetDate.toLocaleTimeString([], options);

    // Candle lighting = 18 minutes before sunset
    const candleTime = new Date(sunsetDate.getTime() - 18 * 60 * 1000);
    candleLightTimeDiv.textContent = candleTime.toLocaleTimeString([], options);

  } catch (err) {
    sunsetTimeDiv.textContent = 'Error';
    candleLightTimeDiv.textContent = 'Error';
    console.error('Sunset or candle lighting calculation failed:', err);
  }
});
