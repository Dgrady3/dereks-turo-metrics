import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { CITY_COORDS, categorizeMarketData } from './services/turoScraper.js';
import { analyzeListings } from './services/analysisEngine.js';
import { generateSummary } from './services/aiSummary.js';
import { getMockListings } from './services/mockData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

// Read cached data for a city
function getCachedData(cityKey) {
  const filePath = path.join(DATA_DIR, `${cityKey}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

app.get('/api/health', (req, res) => {
  const cities = Object.keys(CITY_COORDS);
  const cached = cities.filter(c => fs.existsSync(path.join(DATA_DIR, `${c}.json`)));
  res.json({ status: 'ok', timestamp: new Date().toISOString(), cachedCities: cached.length, totalCities: cities.length });
});

// Ingest endpoint — receives scraped data from local cron job
app.post('/api/ingest', (req, res) => {
  const key = (req.query.key || '').trim();
  if (!process.env.INGEST_API_KEY || key !== process.env.INGEST_API_KEY.trim()) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  const { city, cityLabel, vehicles, scrapedAt } = req.body;
  if (!city || !vehicles || !Array.isArray(vehicles)) {
    return res.status(400).json({ error: 'city and vehicles[] are required' });
  }

  const filePath = path.join(DATA_DIR, `${city}.json`);
  const data = { city, cityLabel, vehicles, scrapedAt: scrapedAt || new Date().toISOString() };

  try {
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log(`Ingested ${vehicles.length} vehicles for ${cityLabel || city}`);
    res.json({ success: true, city: cityLabel || city, vehicleCount: vehicles.length });
  } catch (err) {
    console.error('Ingest write error:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { make, model, city, purchasePrice } = req.body;
    if (!make || !model || !city) {
      return res.status(400).json({ error: 'make, model, and city are required' });
    }

    const cityLabel = CITY_COORDS[city]?.label || city;
    let listings = [];
    let dataSource = 'live';
    let lastUpdated = null;

    // Try cached data first
    const cached = getCachedData(city);
    if (cached && cached.vehicles && cached.vehicles.length > 0) {
      const searchMakeLower = make.toLowerCase();
      const searchModelLower = model.toLowerCase();

      // Exact matches
      const exactMatches = cached.vehicles.filter(v =>
        (v.make || '').toLowerCase() === searchMakeLower &&
        (v.model || '').toLowerCase() === searchModelLower
      );

      // Same-make matches for context
      const sameMakeMatches = cached.vehicles.filter(v =>
        (v.make || '').toLowerCase() === searchMakeLower &&
        (v.model || '').toLowerCase() !== searchModelLower
      );

      listings = [...exactMatches, ...sameMakeMatches];
      lastUpdated = cached.scrapedAt;
      dataSource = 'live';
    }

    // Fall back to mock data
    if (listings.length === 0) {
      const mockResult = getMockListings(make, model, cityLabel);
      if (mockResult) {
        listings = mockResult.listings;
        dataSource = 'sample';
      } else {
        return res.json({
          success: false,
          error: `No data found for ${make} ${model} in ${cityLabel}. Try a different car or city.`,
          city: cityLabel,
          searchQuery: `${make} ${model}`,
        });
      }
    }

    const searchMakeLower = make.toLowerCase();
    const searchModelLower = model.toLowerCase();
    const exactMatches = listings.filter(l =>
      (l.make || '').toLowerCase() === searchMakeLower &&
      (l.model || '').toLowerCase() === searchModelLower
    ).length;
    const similarMatches = listings.length - exactMatches;

    const analysis = analyzeListings(listings, purchasePrice || null);

    let aiSummary = '';
    try {
      aiSummary = await generateSummary(
        `${make} ${model}`,
        cityLabel,
        analysis.metrics,
        analysis.rankedByVolume,
        analysis.rankedByProfit
      );
    } catch (aiErr) {
      console.error('AI summary failed:', aiErr.message);
      aiSummary = 'AI analysis unavailable. Review the metrics below.';
    }

    res.json({
      success: true,
      city: cityLabel,
      searchQuery: `${make} ${model}`,
      scrapedAt: lastUpdated || new Date().toISOString(),
      source: 'turo_api',
      dataSource,
      lastUpdated,
      totalListings: analysis.totalListings,
      exactMatches,
      similarMatches,
      metrics: analysis.metrics,
      rankedByVolume: analysis.rankedByVolume,
      rankedByProfit: analysis.rankedByProfit,
      aiSummary,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

app.post('/api/market-leaders', (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: 'city is required' });

    const cached = getCachedData(city);
    if (!cached || !cached.vehicles || cached.vehicles.length === 0) {
      return res.status(404).json({ error: `No cached data for ${CITY_COORDS[city]?.label || city}. Run the scraper first.` });
    }

    const result = categorizeMarketData(cached.vehicles, cached.cityLabel);
    res.json({
      success: true,
      ...result,
      lastUpdated: cached.scrapedAt,
      scrapedAt: cached.scrapedAt,
    });
  } catch (err) {
    console.error('Market leaders error:', err);
    res.status(500).json({ error: 'Market scan failed. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const cached = Object.keys(CITY_COORDS).filter(c => fs.existsSync(path.join(DATA_DIR, `${c}.json`)));
  console.log(`Cached data: ${cached.length}/${Object.keys(CITY_COORDS).length} cities`);
});

export default app;
