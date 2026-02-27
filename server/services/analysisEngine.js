const DEFAULTS = {
  turoCommission: 0.25,
  monthlyInsurance: 150,
  monthlyDepreciation: 200,
  monthlyMaintenance: 75,
};

export function analyzeListings(listings, purchasePrice = null) {
  if (!listings || listings.length === 0) {
    return { error: 'No listings found', metrics: null, rankedByVolume: [], rankedByProfit: [] };
  }

  const fixedMonthlyCosts = DEFAULTS.monthlyInsurance + DEFAULTS.monthlyDepreciation + DEFAULTS.monthlyMaintenance;

  const enriched = listings.map((l) => {
    const grossRevenue = (l.dailyPrice || 0) * (l.trips || 0);
    const monthsListed = estimateMonthsListed(l.trips || 0);
    const monthlyGrossEst = l.trips ? (l.dailyPrice * (l.trips / monthsListed)) : 0;
    const monthlyNetEst = (monthlyGrossEst * (1 - DEFAULTS.turoCommission)) - fixedMonthlyCosts;

    return {
      ...l,
      grossRevenue,
      monthlyGrossEst: Math.round(monthlyGrossEst),
      monthlyNetEst: Math.round(Math.max(monthlyNetEst, 0)),
    };
  });

  // Metric 1: ROI Calculator
  const avgMonthlyNet = average(enriched.map(l => l.monthlyNetEst));
  const roi = purchasePrice ? {
    purchasePrice,
    avgMonthlyProfit: Math.round(avgMonthlyNet),
    monthsToBreakeven: avgMonthlyNet > 0 ? Math.ceil(purchasePrice / avgMonthlyNet) : null,
    annualROI: avgMonthlyNet > 0 ? Math.round((avgMonthlyNet * 12 / purchasePrice) * 100) : 0,
  } : null;

  // Metric 2: Supply/Demand Score
  const totalListings = enriched.length;
  const avgTrips = average(enriched.map(l => l.trips || 0));
  const supplyDemandScore = totalListings > 0 ? Math.round((avgTrips / totalListings) * 100) / 100 : 0;

  // Metric 3: Revenue per Listing
  const revenues = enriched.map(l => l.monthlyGrossEst).sort((a, b) => a - b);
  const revenuePerListing = {
    average: Math.round(average(revenues)),
    median: Math.round(median(revenues)),
    top25: Math.round(percentile(revenues, 75)),
    bottom25: Math.round(percentile(revenues, 25)),
  };

  // Metric 4: Competitive Density
  const avgPrice = average(enriched.map(l => l.dailyPrice || 0));
  const prices = enriched.map(l => l.dailyPrice || 0).sort((a, b) => a - b);
  const competitiveDensity = {
    totalListings,
    avgDailyPrice: Math.round(avgPrice),
    medianDailyPrice: Math.round(median(prices)),
    priceRange: {
      min: Math.min(...enriched.map(l => l.dailyPrice || 999)),
      max: Math.max(...enriched.map(l => l.dailyPrice || 0)),
    },
    saturation: totalListings > 15 ? 'HIGH' : totalListings > 8 ? 'MODERATE' : totalListings > 3 ? 'LOW' : 'VERY LOW',
  };

  // Metric 5: Ranked listings
  const rankedByVolume = [...enriched].sort((a, b) => (b.trips || 0) - (a.trips || 0)).slice(0, 10);
  const rankedByProfit = [...enriched].sort((a, b) => b.monthlyNetEst - a.monthlyNetEst).slice(0, 10);

  // Verdict with score — score drives the label
  // Score factors: monthly profit, demand (trips), competition, price consistency
  const profitScore = Math.min(40, Math.max(0, avgMonthlyNet / 12.5)); // 0-40 pts, $500/mo = max
  const demandScore = Math.min(25, Math.max(0, avgTrips / 4));         // 0-25 pts, 100 trips = max
  const competitionScore = totalListings <= 3 ? 20 : totalListings <= 8 ? 15 : totalListings <= 15 ? 8 : 3; // fewer = better
  const priceScore = Math.min(15, Math.max(0, (avgPrice - 30) / 6));   // 0-15 pts, higher price = more upside
  const verdictScore = Math.min(100, Math.max(0, Math.round(profitScore + demandScore + competitionScore + priceScore)));
  const verdictLabel = verdictScore >= 65 ? 'BUY' : verdictScore >= 40 ? 'MAYBE' : 'PASS';
  const verdict = { verdict: verdictLabel, score: verdictScore };

  return {
    metrics: { roi, supplyDemand: { totalListings, avgTripsPerListing: Math.round(avgTrips), score: supplyDemandScore }, revenuePerListing, competitiveDensity, verdict, avgMonthlyProfit: Math.round(avgMonthlyNet) },
    rankedByVolume,
    rankedByProfit,
    totalListings: enriched.length,
  };
}

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(sorted) {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function estimateMonthsListed(trips) {
  return Math.max(1, Math.round(trips / 13));
}
