import puppeteer from 'puppeteer';

const CITY_COORDS = {
  charlotte: { lat: 35.2271, lng: -80.8431, label: 'Charlotte, NC' },
  raleigh: { lat: 35.7796, lng: -78.6382, label: 'Raleigh, NC' },
  durham: { lat: 35.9940, lng: -78.8986, label: 'Durham, NC' },
  greensboro: { lat: 36.0726, lng: -79.7920, label: 'Greensboro, NC' },
  wilmington: { lat: 34.2257, lng: -77.9447, label: 'Wilmington, NC' },
  asheville: { lat: 35.5951, lng: -82.5515, label: 'Asheville, NC' },
  fayetteville: { lat: 35.0527, lng: -78.8784, label: 'Fayetteville, NC' },
};

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

export { CITY_COORDS };

async function createTuroSession(cityKey) {
  const city = CITY_COORDS[cityKey];
  if (!city) throw new Error(`Unknown city: ${cityKey}`);

  const launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  await page.goto(`https://turo.com/us/en/search?country=US&latitude=${city.lat}&longitude=${city.lng}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 2000));

  return { browser, page, city };
}

function mapVehicle(v, cityLabel) {
  const trips = v.completedTrips || 0;
  const rating = v.rating || null;
  const isNew = v.isNewListing || false;
  const isAllStar = v.isAllStarHost || false;

  // Demand signal: Hot (proven high demand), Warm (moderate), Cold (unproven)
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

  // Estimate avg monthly trips (Turo doesn't give listing age, estimate ~13 trips/mo for active)
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
    city: v.location?.city || cityLabel.split(',')[0],
    distance: v.location?.distance?.value ? Math.round(v.location.distance.value * 10) / 10 : null,
    isNewListing: isNew,
    isAllStarHost: isAllStar,
    demandSignal,
    demandReason,
  };
}

export async function scrapeMarketLeaders(cityKey) {
  const { browser, page, city } = await createTuroSession(cityKey);

  try {
    const startDate = getFutureDate(7);
    const endDate = getFutureDate(10);

    console.log(`Querying Turo API for ALL vehicles in ${city.label}...`);
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
      return res.json();
    }, city.lat, city.lng, startDate, endDate);

    const rawVehicles = apiResult.vehicles || [];
    const vehicles = rawVehicles
      .map(v => mapVehicle(v, city.label))
      .filter(l => l.dailyPrice > 0);

    console.log(`Market scan: ${vehicles.length} vehicles in ${city.label}`);

    // Group by make+model, compute averages
    const grouped = {};
    for (const v of vehicles) {
      const key = `${v.make} ${v.model}`;
      if (!grouped[key]) grouped[key] = { make: v.make, model: v.model, type: v.type, listings: [] };
      grouped[key].listings.push(v);
    }

    const summary = Object.values(grouped).map(g => {
      const prices = g.listings.map(l => l.dailyPrice);
      const trips = g.listings.map(l => l.trips);
      const ratings = g.listings.filter(l => l.rating).map(l => l.rating);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const avgTrips = Math.round(trips.reduce((a, b) => a + b, 0) / trips.length);
      const monthlyTripsArr = g.listings.map(l => l.monthlyTrips);
      const avgMonthlyTrips = Math.round(monthlyTripsArr.reduce((a, b) => a + b, 0) / monthlyTripsArr.length * 10) / 10;
      const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 100) / 100 : null;

      // Demand-weighted occupancy: use avg trips as a demand signal
      // 0 trips = 20% occupancy (unproven), 50+ trips = 70% (proven demand)
      const demandOccupancy = Math.min(0.70, 0.20 + (avgTrips / 50) * 0.50);
      const estimatedMonthly = Math.round(avgPrice * 30 * demandOccupancy * 0.75 - 425);

      // Profit score combines price AND demand (not just price alone)
      // High price + low trips = low score, moderate price + high trips = high score
      const profitScore = estimatedMonthly * (0.4 + 0.6 * Math.min(avgTrips / 50, 1));

      // Aggregate demand signal: use the best signal from listings, pick reason from top listing
      const demandCounts = { hot: 0, warm: 0, cold: 0 };
      g.listings.forEach(l => demandCounts[l.demandSignal]++);
      const groupDemand = demandCounts.hot > 0 ? 'hot' : demandCounts.warm > 0 ? 'warm' : 'cold';
      const topByTrips = [...g.listings].sort((a, b) => b.trips - a.trips)[0];
      // Build group-level reason
      let groupDemandReason;
      if (g.listings.length === 1) {
        groupDemandReason = topByTrips.demandReason;
      } else {
        const totalTrips = trips.reduce((a, b) => a + b, 0);
        const newCount = g.listings.filter(l => l.isNewListing).length;
        groupDemandReason = `${avgTrips} avg trips across ${g.listings.length} listings (${totalTrips} total)`;
        if (newCount > 0) groupDemandReason += ` · ${newCount} new listing${newCount > 1 ? 's' : ''}`;
      }

      return {
        make: g.make,
        model: g.model,
        type: g.type,
        count: g.listings.length,
        avgDailyPrice: avgPrice,
        avgTrips,
        avgMonthlyTrips,
        avgRating,
        occupancyEstimate: Math.round(demandOccupancy * 100),
        estimatedMonthly: Math.max(0, estimatedMonthly),
        profitScore: Math.max(0, Math.round(profitScore)),
        demandSignal: groupDemand,
        demandReason: groupDemandReason,
        topListing: topByTrips,
      };
    });

    // Categorize — Top Profit sorts by profitScore (price × demand), not just raw estimated monthly
    const categories = {
      bestProfit: [...summary].sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
      bestVolume: [...summary].sort((a, b) => b.avgTrips - a.avgTrips).slice(0, 10),
      bestBudget: [...summary].filter(s => s.avgDailyPrice <= 60).sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
      bestPremium: [...summary].filter(s => s.avgDailyPrice >= 100).sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
      leastCompetition: [...summary].sort((a, b) => a.count - b.count).slice(0, 10),
    };

    return {
      city: city.label,
      totalVehicles: vehicles.length,
      totalModels: summary.length,
      categories,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    await browser.close();
  }
}

export async function scrapeTuroListings(make, model, cityKey) {
  const { browser, page, city } = await createTuroSession(cityKey);

  try {
    const searchQuery = `${make} ${model}`.trim();
    const startDate = getFutureDate(7);
    const endDate = getFutureDate(10);

    console.log(`Querying Turo API for ${make} ${model} in ${city.label}...`);

    // First try with make/model filters
    const apiResult = await page.evaluate(async (make, model, lat, lng, startDate, endDate) => {
      const res = await fetch('/api/v2/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            age: 30,
            dates: { end: `${endDate}T10:00`, start: `${startDate}T10:00` },
            engines: [],
            features: [],
            location: { country: 'US', type: 'area', point: { lat, lng } },
            makes: [make],
            models: [model],
            tmvTiers: [],
            types: [],
          },
          flexibleType: 'NOT_FLEXIBLE',
          searchDurationType: 'DAILY',
          sorts: { direction: 'ASC', type: 'RELEVANCE' },
        }),
      });
      return res.json();
    }, make, model, city.lat, city.lng, startDate, endDate);

    let vehicles = apiResult.vehicles || [];
    console.log(`Turo API returned ${vehicles.length} ${make} ${model} listings (${apiResult.totalHits} total hits)`);

    // If filtered search returns few results, fall back to unfiltered search
    // and match by make/model ourselves (Turo's filter names may not match)
    if (vehicles.length < 3) {
      console.log(`Few results with filters — falling back to unfiltered search and manual matching...`);
      const unfilteredResult = await page.evaluate(async (lat, lng, startDate, endDate) => {
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
        return res.json();
      }, city.lat, city.lng, startDate, endDate);

      const allVehicles = unfilteredResult.vehicles || [];
      const makeLower = make.toLowerCase();
      const modelLower = model.toLowerCase();

      // Find exact matches from the full list
      const exactMatches = allVehicles.filter(v =>
        (v.make || '').toLowerCase() === makeLower &&
        (v.model || '').toLowerCase() === modelLower
      );

      // Also find similar make matches for context
      const sameMarkMatches = allVehicles.filter(v =>
        (v.make || '').toLowerCase() === makeLower &&
        (v.model || '').toLowerCase() !== modelLower
      );

      if (exactMatches.length > 0 || sameMarkMatches.length > 0) {
        vehicles = [...exactMatches, ...sameMarkMatches];
        console.log(`Fallback found ${exactMatches.length} exact + ${sameMarkMatches.length} same-make matches`);
      }
    }

    const listings = vehicles.map(v => mapVehicle(v, city.label)).filter(l => l.dailyPrice > 0);

    return {
      listings,
      city: city.label,
      searchQuery,
      scrapedAt: new Date().toISOString(),
      source: 'turo_api',
      totalHits: apiResult.totalHits || 0,
    };
  } finally {
    await browser.close();
  }
}
