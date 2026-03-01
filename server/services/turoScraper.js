// Market data utilities — no longer scrapes, just processes cached data

export const CITY_COORDS = {
  charlotte: { lat: 35.2271, lng: -80.8431, label: 'Charlotte, NC' },
  raleigh: { lat: 35.7796, lng: -78.6382, label: 'Raleigh, NC' },
  greensboro: { lat: 36.0726, lng: -79.7920, label: 'Greensboro, NC' },
};

// Takes an array of already-mapped vehicles and groups/categorizes them for market leaders view
export function categorizeMarketData(vehicles, cityLabel) {
  const filtered = vehicles.filter(l => l.dailyPrice > 0);

  // Group by make+model, compute averages
  const grouped = {};
  for (const v of filtered) {
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

    const demandOccupancy = Math.min(0.70, 0.20 + (avgTrips / 50) * 0.50);
    const estimatedMonthly = Math.round(avgPrice * 30 * demandOccupancy * 0.75 - 425);
    const profitScore = estimatedMonthly * (0.4 + 0.6 * Math.min(avgTrips / 50, 1));

    const demandCounts = { hot: 0, warm: 0, cold: 0 };
    g.listings.forEach(l => demandCounts[l.demandSignal]++);
    const groupDemand = demandCounts.hot > 0 ? 'hot' : demandCounts.warm > 0 ? 'warm' : 'cold';
    const topByTrips = [...g.listings].sort((a, b) => b.trips - a.trips)[0];

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
      sampleVehicleId: topByTrips?.vehicleId || null,
    };
  });

  const categories = {
    bestProfit: [...summary].sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
    bestVolume: [...summary].sort((a, b) => b.avgTrips - a.avgTrips).slice(0, 10),
    bestBudget: [...summary].filter(s => s.avgDailyPrice <= 60).sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
    bestPremium: [...summary].filter(s => s.avgDailyPrice >= 100).sort((a, b) => b.profitScore - a.profitScore).slice(0, 10),
    leastCompetition: [...summary].sort((a, b) => a.count - b.count).slice(0, 10),
  };

  return {
    city: cityLabel,
    totalVehicles: filtered.length,
    totalModels: summary.length,
    categories,
  };
}
