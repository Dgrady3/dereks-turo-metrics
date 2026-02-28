import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { scrapeTuroListings, scrapeMarketLeaders } from './services/turoScraper.js';
import { analyzeListings } from './services/analysisEngine.js';
import { generateSummary } from './services/aiSummary.js';
import { getMockListings } from './services/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/search', async (req, res) => {
  try {
    const { make, model, city, purchasePrice } = req.body;

    if (!make || !model || !city) {
      return res.status(400).json({ error: 'make, model, and city are required' });
    }

    // 1. Try scraping Turo, fall back to sample data
    let scrapeResult;
    let dataSource = 'live';
    try {
      scrapeResult = await scrapeTuroListings(make, model, city);
    } catch (scrapeErr) {
      console.error('Scrape failed:', scrapeErr.message);
      scrapeResult = { listings: [], city: '', searchQuery: `${make} ${model}` };
    }

    if (scrapeResult.listings.length === 0) {
      // Try mock data as fallback
      const cityLabel = { charlotte: 'Charlotte, NC', raleigh: 'Raleigh, NC', durham: 'Durham, NC', greensboro: 'Greensboro, NC', wilmington: 'Wilmington, NC', asheville: 'Asheville, NC', fayetteville: 'Fayetteville, NC' }[city] || city;
      const mockResult = getMockListings(make, model, cityLabel);
      if (mockResult) {
        scrapeResult = mockResult;
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

    // Count exact vs similar matches
    const searchMakeLower = make.toLowerCase();
    const searchModelLower = model.toLowerCase();
    const exactMatches = scrapeResult.listings.filter(l => {
      const lMake = (l.make || '').toLowerCase();
      const lModel = (l.model || '').toLowerCase();
      return lMake === searchMakeLower && lModel === searchModelLower;
    }).length;
    const similarMatches = scrapeResult.listings.length - exactMatches;

    // 2. Run analysis engine
    const analysis = analyzeListings(scrapeResult.listings, purchasePrice || null);

    // 3. Generate AI summary
    let aiSummary = '';
    try {
      aiSummary = await generateSummary(
        scrapeResult.searchQuery,
        scrapeResult.city,
        analysis.metrics,
        analysis.rankedByVolume,
        analysis.rankedByProfit
      );
    } catch (aiErr) {
      console.error('AI summary failed:', aiErr.message);
      aiSummary = 'AI analysis unavailable. Review the metrics below.';
    }

    // 4. Return everything
    res.json({
      success: true,
      city: scrapeResult.city,
      searchQuery: scrapeResult.searchQuery,
      scrapedAt: scrapeResult.scrapedAt,
      source: scrapeResult.source,
      dataSource,
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

// Temporary debug endpoint to test proxy
app.get('/api/debug-proxy', async (req, res) => {
  try {
    const https = await import('node:https');
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const user = (process.env.BRIGHT_DATA_USER || '').trim();
    const pass = (process.env.BRIGHT_DATA_PASS || '').trim();
    const host = (process.env.BRIGHT_DATA_HOST || 'brd.superproxy.io').trim();
    const port = (process.env.BRIGHT_DATA_PORT || '33335').trim();
    const proxyUrl = `http://${user}:${pass}@${host}:${port}`;
    const agent = new HttpsProxyAgent(proxyUrl, { rejectUnauthorized: false });

    const data = await new Promise((resolve, reject) => {
      const req = https.request({ hostname: 'lumtest.com', port: 443, path: '/myip.json', method: 'GET', agent, rejectUnauthorized: false }, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => resolve({ status: r.statusCode, body: body.substring(0, 500) }));
      });
      req.on('error', reject);
      req.end();
    });

    res.json({ proxyWorking: true, ...data, proxyUrl: `http://${user}:***@${host}:${port}` });
  } catch (err) {
    res.json({ proxyWorking: false, error: err.message, stack: err.stack?.split('\n').slice(0, 5) });
  }
});

app.post('/api/market-leaders', async (req, res) => {
  try {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: 'city is required' });

    const result = await scrapeMarketLeaders(city);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Market leaders error:', err);
    res.status(500).json({ error: 'Market scan failed. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
