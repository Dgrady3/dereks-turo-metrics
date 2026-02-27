// Realistic mock data based on actual Turo NC market
// Used as fallback when scraping fails

const MOCK_DATA = {
  'Tesla': {
    'Model 3': { avgPrice: 85, listings: generateListings('Tesla', 'Model 3', 85, 12) },
    'Model Y': { avgPrice: 95, listings: generateListings('Tesla', 'Model Y', 95, 15) },
    'Model S': { avgPrice: 130, listings: generateListings('Tesla', 'Model S', 130, 6) },
    'Model X': { avgPrice: 145, listings: generateListings('Tesla', 'Model X', 145, 4) },
  },
  'Toyota': {
    'Camry': { avgPrice: 45, listings: generateListings('Toyota', 'Camry', 45, 18) },
    'Corolla': { avgPrice: 38, listings: generateListings('Toyota', 'Corolla', 38, 14) },
    'RAV4': { avgPrice: 55, listings: generateListings('Toyota', 'RAV4', 55, 16) },
    'Highlander': { avgPrice: 65, listings: generateListings('Toyota', 'Highlander', 65, 8) },
    'Tacoma': { avgPrice: 70, listings: generateListings('Toyota', 'Tacoma', 70, 10) },
    '4Runner': { avgPrice: 80, listings: generateListings('Toyota', '4Runner', 80, 7) },
  },
  'Honda': {
    'Civic': { avgPrice: 42, listings: generateListings('Honda', 'Civic', 42, 16) },
    'Accord': { avgPrice: 48, listings: generateListings('Honda', 'Accord', 48, 12) },
    'CR-V': { avgPrice: 55, listings: generateListings('Honda', 'CR-V', 55, 14) },
  },
  'BMW': {
    '3 Series': { avgPrice: 90, listings: generateListings('BMW', '3 Series', 90, 8) },
    '5 Series': { avgPrice: 110, listings: generateListings('BMW', '5 Series', 110, 5) },
    'X3': { avgPrice: 85, listings: generateListings('BMW', 'X3', 85, 6) },
    'X5': { avgPrice: 120, listings: generateListings('BMW', 'X5', 120, 4) },
  },
  'Ford': {
    'Mustang': { avgPrice: 75, listings: generateListings('Ford', 'Mustang', 75, 10) },
    'F-150': { avgPrice: 85, listings: generateListings('Ford', 'F-150', 85, 12) },
    'Explorer': { avgPrice: 60, listings: generateListings('Ford', 'Explorer', 60, 9) },
    'Bronco': { avgPrice: 95, listings: generateListings('Ford', 'Bronco', 95, 7) },
  },
  'Jeep': {
    'Wrangler': { avgPrice: 90, listings: generateListings('Jeep', 'Wrangler', 90, 11) },
    'Grand Cherokee': { avgPrice: 70, listings: generateListings('Jeep', 'Grand Cherokee', 70, 8) },
  },
  'Chevrolet': {
    'Camaro': { avgPrice: 80, listings: generateListings('Chevrolet', 'Camaro', 80, 6) },
    'Corvette': { avgPrice: 180, listings: generateListings('Chevrolet', 'Corvette', 180, 4) },
    'Tahoe': { avgPrice: 95, listings: generateListings('Chevrolet', 'Tahoe', 95, 5) },
  },
  'Dodge': {
    'Charger': { avgPrice: 75, listings: generateListings('Dodge', 'Charger', 75, 9) },
    'Challenger': { avgPrice: 85, listings: generateListings('Dodge', 'Challenger', 85, 7) },
  },
  'Porsche': {
    '911': { avgPrice: 250, listings: generateListings('Porsche', '911', 250, 3) },
    'Cayenne': { avgPrice: 130, listings: generateListings('Porsche', 'Cayenne', 130, 4) },
  },
};

function generateListings(make, model, avgPrice, count) {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const listings = [];

  for (let i = 0; i < count; i++) {
    const priceVariance = Math.round((Math.random() - 0.5) * avgPrice * 0.4);
    const year = years[Math.floor(Math.random() * years.length)];
    const trips = Math.floor(Math.random() * 150) + 5;
    const rating = Math.round((4.2 + Math.random() * 0.8) * 100) / 100;

    listings.push({
      title: `${year} ${make} ${model}`,
      dailyPrice: avgPrice + priceVariance,
      trips,
      rating,
      year,
      make,
      model,
    });
  }

  return listings;
}

export function getMockListings(make, model, cityLabel) {
  const makeData = MOCK_DATA[make];
  if (!makeData) return null;
  const modelData = makeData[model];
  if (!modelData) return null;

  return {
    listings: modelData.listings,
    city: cityLabel,
    searchQuery: `${make} ${model}`,
    scrapedAt: new Date().toISOString(),
    source: 'sample_data',
  };
}
