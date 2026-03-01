import 'dotenv/config';
import puppeteer from 'puppeteer';

const API_URL = (process.env.API_URL || '').trim();
const INGEST_API_KEY = (process.env.INGEST_API_KEY || '').trim();

if (!API_URL || !INGEST_API_KEY) {
  console.error('Missing API_URL or INGEST_API_KEY in .env');
  process.exit(1);
}

const CITY_COORDS = {
  charlotte: { lat: 35.2271, lng: -80.8431, label: 'Charlotte, NC' },
  raleigh: { lat: 35.7796, lng: -78.6382, label: 'Raleigh, NC' },
  greensboro: { lat: 36.0726, lng: -79.7920, label: 'Greensboro, NC' },
};

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

function mapVehicle(v, cityLabel) {
  const trips = v.completedTrips || 0;
  const rating = v.rating || null;
  const isNew = v.isNewListing || false;
  const isAllStar = v.isAllStarHost || false;

  let demandSignal, demandReason;
  if (trips >= 50) {
    demandSignal = 'hot';
    demandReason = `${trips} lifetime trips — proven high demand`;
  } else if (isNew && trips >= 5) {
    demandSignal = 'hot';
    demandReason = `New listing already has ${trips} trips — strong early traction`;
  } else if (trips >= 10) {
    demandSignal = 'warm';
    demandReason = `${trips} lifetime trips — moderate demand`;
  } else if (isNew && trips >= 1) {
    demandSignal = 'warm';
    demandReason = `New listing with ${trips} trip${trips > 1 ? 's' : ''} — early interest`;
  } else if (trips >= 5 && rating >= 4.5) {
    demandSignal = 'warm';
    demandReason = `${trips} trips with ${rating}★ rating — quality indicator`;
  } else if (trips === 0) {
    demandSignal = 'cold';
    demandReason = 'No completed trips yet — unproven demand';
  } else {
    demandSignal = 'cold';
    demandReason = `Only ${trips} trip${trips > 1 ? 's' : ''} — low demand signal`;
  }

  const estimatedMonths = Math.max(1, Math.round(trips / 13));
  const monthlyTrips = trips > 0 ? Math.round((trips / estimatedMonths) * 10) / 10 : 0;

  return {
    title: `${v.year} ${v.make} ${v.model}`,
    dailyPrice: Math.round(v.avgDailyPrice?.amount || 0),
    trips,
    monthlyTrips,
    rating,
    year: v.year,
    make: v.make,
    model: v.model,
    type: v.type || null,
    image: v.images?.[0]?.resizeableUrlTemplate?.replace('{width}', '400').replace('{height}', '250') || null,
    vehicleId: v.id,
    seoCategory: (v.seoCategory || v.type || 'car').toLowerCase(),
    city: v.location?.city || cityLabel.split(',')[0],
    distance: v.location?.distance?.value ? Math.round(v.location.distance.value * 10) / 10 : null,
    isNewListing: isNew,
    isAllStarHost: isAllStar,
    demandSignal,
    demandReason,
  };
}

async function scrapeCity(cityKey) {
  const city = CITY_COORDS[cityKey];
  console.log(`\n🔍 Scraping ${city.label}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(`https://turo.com/us/en/search?country=US&latitude=${city.lat}&longitude=${city.lng}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 3000));

    const startDate = getFutureDate(7);
    const endDate = getFutureDate(10);

    const apiResult = await page.evaluate(async (lat, lng, startDate, endDate) => {
      const res = await fetch('/api/v2/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            age: 30,
            dates: { end: `${endDate}T10:00`, start: `${startDate}T10:00` },
            engines: [], features: [],
            location: { country: 'US', type: 'area', point: { lat, lng } },
            makes: [], models: [],
            tmvTiers: [], types: [],
          },
          flexibleType: 'NOT_FLEXIBLE',
          searchDurationType: 'DAILY',
          sorts: { direction: 'ASC', type: 'RELEVANCE' },
        }),
      });
      const text = await res.text();
      try { return JSON.parse(text); } catch { return { error: 'blocked', raw: text.substring(0, 200) }; }
    }, city.lat, city.lng, startDate, endDate);

    if (apiResult.error === 'blocked') {
      console.error(`  ❌ Turo blocked request for ${city.label}`);
      return null;
    }

    const rawVehicles = apiResult.vehicles || [];
    const vehicles = rawVehicles
      .map(v => mapVehicle(v, city.label))
      .filter(l => l.dailyPrice > 0);

    console.log(`  ✅ Found ${vehicles.length} vehicles (${apiResult.totalHits || 0} total hits)`);
    return { city: cityKey, cityLabel: city.label, vehicles, scrapedAt: new Date().toISOString() };
  } finally {
    await browser.close();
  }
}

async function pushToServer(data) {
  const url = `${API_URL}/api/ingest?key=${encodeURIComponent(INGEST_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!result.success) throw new Error(result.error || 'Ingest failed');
  return result;
}

async function main() {
  console.log('=== Derek\'s Turo Metrics — Daily Scrape ===');
  console.log(`Target: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const cityKeys = Object.keys(CITY_COORDS);
  let successCount = 0;
  let totalVehicles = 0;

  for (const cityKey of cityKeys) {
    try {
      const data = await scrapeCity(cityKey);
      if (!data) continue;

      console.log(`  📤 Pushing ${data.vehicles.length} vehicles to server...`);
      const result = await pushToServer(data);
      console.log(`  ✅ Server accepted: ${result.vehicleCount} vehicles for ${result.city}`);

      successCount++;
      totalVehicles += data.vehicles.length;
    } catch (err) {
      console.error(`  ❌ Failed for ${cityKey}:`, err.message);
    }

    // Delay between cities to avoid rate limiting
    if (cityKey !== cityKeys[cityKeys.length - 1]) {
      console.log('  ⏳ Waiting 5 seconds...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\n=== Done! ${successCount}/${cityKeys.length} cities scraped, ${totalVehicles} total vehicles ===`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
