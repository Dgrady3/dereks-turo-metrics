# Derek's Titsy Turo Metrics — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Turo market analysis tool that scrapes NC listings and provides 5 investment metrics + AI analysis so Derek can make data-driven car purchasing decisions.

**Architecture:** React + Vite frontend (Vercel) with Express backend (Railway). Backend uses Puppeteer to scrape Turo search results, runs a 5-metric analysis engine, then calls Claude API for an investment summary. No database — all live queries.

**Tech Stack:** React 18, Vite, TailwindCSS, Node.js, Express, Puppeteer, Anthropic SDK, Vercel, Railway

---

### Task 1: Initialize Backend Project

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `server/index.js`

**Step 1: Initialize the Express server project**

```bash
cd /Users/joegrady/Development/projects/dereks-turo-metrics
mkdir server && cd server
npm init -y
npm install express cors dotenv
```

**Step 2: Create the entry point with health check**

Create `server/index.js`:
```js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 3: Add `"type": "module"` to package.json and a start script**

Ensure `server/package.json` has:
```json
{
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  }
}
```

**Step 4: Create `.env.example`**

```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

**Step 5: Run and verify**

```bash
cd server && npm run dev
# In another terminal:
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: initialize Express backend with health check"
```

---

### Task 2: Build Turo Scraper Service

**Files:**
- Create: `server/services/turoScraper.js`
- Modify: `server/package.json` (add puppeteer)

**Step 1: Install Puppeteer**

```bash
cd server
npm install puppeteer
```

**Step 2: Create the scraper service**

Create `server/services/turoScraper.js`:
```js
import puppeteer from 'puppeteer';

// NC city coordinates for Turo search URLs
const CITY_COORDS = {
  charlotte: { lat: 35.2271, lng: -80.8431, label: 'Charlotte, NC' },
  raleigh: { lat: 35.7796, lng: -78.6382, label: 'Raleigh, NC' },
  durham: { lat: 35.9940, lng: -78.8986, label: 'Durham, NC' },
  greensboro: { lat: 36.0726, lng: -79.7920, label: 'Greensboro, NC' },
  wilmington: { lat: 34.2257, lng: -77.9447, label: 'Wilmington, NC' },
  asheville: { lat: 35.5951, lng: -82.5515, label: 'Asheville, NC' },
  fayetteville: { lat: 35.0527, lng: -78.8784, label: 'Fayetteville, NC' },
};

/**
 * Scrape Turo search results for a given make/model in an NC city.
 * Returns an array of listing objects.
 */
export async function scrapeTuroListings(make, model, cityKey) {
  const city = CITY_COORDS[cityKey];
  if (!city) throw new Error(`Unknown city: ${cityKey}`);

  // Build Turo search URL
  const searchQuery = `${make} ${model}`.trim();
  const startDate = getFutureDate(7);   // 1 week from now
  const endDate = getFutureDate(10);    // 10 days from now
  const searchUrl = `https://turo.com/us/en/search?country=US&latitude=${city.lat}&longitude=${city.lng}&locationType=CITY&pickupType=ALL&startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(searchQuery)}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Intercept network requests to capture Turo's API responses
    const apiResponses = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/search') || url.includes('/api/listing')) {
        try {
          const json = await response.json();
          apiResponses.push(json);
        } catch (e) {
          // Not JSON, skip
        }
      }
    });

    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for listings to render
    await page.waitForSelector('[data-testid="vehicle-card"], .searchResult-card, .vehicle-card', { timeout: 15000 }).catch(() => {});

    // Scrape visible listing data from the DOM
    const listings = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="vehicle-card"], .searchResult-card, .vehicle-card, [class*="vehicleCard"]');
      const results = [];

      cards.forEach((card) => {
        const getText = (selectors) => {
          for (const sel of selectors) {
            const el = card.querySelector(sel);
            if (el) return el.textContent.trim();
          }
          return null;
        };

        const title = getText(['[data-testid="vehicle-name"]', '.vehicle-card-title', '[class*="vehicleName"]', 'h2', 'h3']) || '';
        const priceText = getText(['[data-testid="vehicle-price"]', '.vehicle-card-price', '[class*="dailyPrice"]', '[class*="price"]']) || '';
        const tripsText = getText(['[data-testid="vehicle-trips"]', '.vehicle-card-trips', '[class*="tripCount"]', '[class*="trips"]']) || '';
        const ratingText = getText(['[data-testid="vehicle-rating"]', '.vehicle-card-rating', '[class*="rating"]']) || '';

        // Parse price: "$42/day" → 42
        const priceMatch = priceText.match(/\$(\d+)/);
        const dailyPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

        // Parse trips: "127 trips" → 127
        const tripsMatch = tripsText.match(/(\d+)\s*trip/i);
        const trips = tripsMatch ? parseInt(tripsMatch[1], 10) : null;

        // Parse rating: "4.9" → 4.9
        const ratingMatch = ratingText.match(/([\d.]+)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        if (title && dailyPrice !== null) {
          results.push({ title, dailyPrice, trips, rating });
        }
      });

      return results;
    });

    // Also try to extract data from intercepted API responses
    let apiListings = [];
    for (const resp of apiResponses) {
      if (resp?.searchResults || resp?.data || resp?.vehicles) {
        const items = resp.searchResults || resp.data || resp.vehicles || [];
        if (Array.isArray(items)) {
          apiListings = items.map((item) => ({
            title: item.vehicle?.name || item.name || item.vehicleName || `${item.vehicle?.make} ${item.vehicle?.model}` || '',
            dailyPrice: item.dailyPrice || item.rate?.daily || item.defaultPrice || null,
            trips: item.renterTripsTaken || item.tripCount || item.trips || null,
            rating: item.rating || item.averageRating || null,
            year: item.vehicle?.year || item.year || null,
            make: item.vehicle?.make || item.make || null,
            model: item.vehicle?.model || item.model || null,
          })).filter(l => l.dailyPrice !== null);
        }
      }
    }

    // Prefer API data if available, fall back to DOM scrape
    const finalListings = apiListings.length > 0 ? apiListings : listings;

    return {
      listings: finalListings,
      city: city.label,
      searchQuery,
      scrapedAt: new Date().toISOString(),
      source: apiListings.length > 0 ? 'api_intercept' : 'dom_scrape',
    };
  } finally {
    await browser.close();
  }
}

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
}
```

**Step 3: Test the scraper manually**

Add a temporary test script at the bottom of `turoScraper.js`:
```js
// Uncomment to test:
// scrapeTuroListings('Toyota', 'Camry', 'charlotte').then(r => console.log(JSON.stringify(r, null, 2)));
```

Run: `node services/turoScraper.js`
Verify it returns listing data.

**Step 4: Commit**

```bash
git add server/
git commit -m "feat: add Puppeteer-based Turo scraper service"
```

---

### Task 3: Build Analysis Engine (5 Metrics)

**Files:**
- Create: `server/services/analysisEngine.js`

**Step 1: Create the analysis engine**

Create `server/services/analysisEngine.js`:
```js
// Default monthly cost estimates
const DEFAULTS = {
  turoCommission: 0.25,      // 25% of revenue
  monthlyInsurance: 150,      // Commercial rental coverage
  monthlyDepreciation: 200,   // ~$2,400/yr on ~$20k vehicle
  monthlyMaintenance: 75,     // Oil, tires, cleaning, wear
};

/**
 * Run all 5 X-factor metrics on scraped Turo listings.
 *
 * @param {Array} listings - scraped listing objects
 * @param {number|null} purchasePrice - optional purchase price for ROI calc
 * @returns {Object} metrics + enriched listings
 */
export function analyzeListings(listings, purchasePrice = null) {
  if (!listings || listings.length === 0) {
    return { error: 'No listings found', metrics: null, rankedByVolume: [], rankedByProfit: [] };
  }

  const fixedMonthlyCosts = DEFAULTS.monthlyInsurance + DEFAULTS.monthlyDepreciation + DEFAULTS.monthlyMaintenance;

  // Enrich each listing with calculated fields
  const enriched = listings.map((l) => {
    const grossRevenue = (l.dailyPrice || 0) * (l.trips || 0);
    const monthlyGrossEst = l.trips ? (l.dailyPrice * (l.trips / estimateMonthsListed(l.trips))) : 0;
    const monthlyNetEst = (monthlyGrossEst * (1 - DEFAULTS.turoCommission)) - fixedMonthlyCosts;

    return {
      ...l,
      grossRevenue,
      monthlyGrossEst: Math.round(monthlyGrossEst),
      monthlyNetEst: Math.round(Math.max(monthlyNetEst, 0)),
    };
  });

  // ── Metric 1: ROI Calculator ──
  const avgMonthlyNet = average(enriched.map(l => l.monthlyNetEst));
  const roi = purchasePrice ? {
    purchasePrice,
    avgMonthlyProfit: Math.round(avgMonthlyNet),
    monthsToBreakeven: avgMonthlyNet > 0 ? Math.ceil(purchasePrice / avgMonthlyNet) : null,
    annualROI: avgMonthlyNet > 0 ? Math.round((avgMonthlyNet * 12 / purchasePrice) * 100) : 0,
  } : null;

  // ── Metric 2: Supply/Demand Score ──
  const totalListings = enriched.length;
  const avgTrips = average(enriched.map(l => l.trips || 0));
  const supplyDemandScore = totalListings > 0 ? Math.round((avgTrips / totalListings) * 100) / 100 : 0;

  // ── Metric 3: Revenue per Listing (Aggregated) ──
  const revenues = enriched.map(l => l.monthlyGrossEst).sort((a, b) => a - b);
  const revenuePerListing = {
    average: Math.round(average(revenues)),
    median: Math.round(median(revenues)),
    top25: Math.round(percentile(revenues, 75)),
    bottom25: Math.round(percentile(revenues, 25)),
  };

  // ── Metric 4: Competitive Density ──
  const avgPrice = average(enriched.map(l => l.dailyPrice || 0));
  const medianPrice = median(enriched.map(l => l.dailyPrice || 0).sort((a, b) => a - b));
  const competitiveDensity = {
    totalListings,
    avgDailyPrice: Math.round(avgPrice),
    medianDailyPrice: Math.round(medianPrice),
    priceRange: {
      min: Math.min(...enriched.map(l => l.dailyPrice || 999)),
      max: Math.max(...enriched.map(l => l.dailyPrice || 0)),
    },
    saturation: totalListings > 30 ? 'HIGH' : totalListings > 15 ? 'MODERATE' : 'LOW',
  };

  // ── Metric 5: Cost-Adjusted Profit Ranking ──
  const rankedByVolume = [...enriched].sort((a, b) => (b.trips || 0) - (a.trips || 0)).slice(0, 10);
  const rankedByProfit = [...enriched].sort((a, b) => b.monthlyNetEst - a.monthlyNetEst).slice(0, 10);

  return {
    metrics: {
      roi,
      supplyDemand: { totalListings, avgTripsPerListing: Math.round(avgTrips), score: supplyDemandScore },
      revenuePerListing,
      competitiveDensity,
    },
    rankedByVolume,
    rankedByProfit,
    totalListings: enriched.length,
  };
}

// ── Helpers ──

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

/**
 * Estimate how many months a car has been listed based on trip count.
 * Assumes avg ~12-15 trips/month for active listings.
 * Clamps to at least 1 month.
 */
function estimateMonthsListed(trips) {
  return Math.max(1, Math.round(trips / 13));
}
```

**Step 2: Write a quick smoke test**

```bash
node -e "
import { analyzeListings } from './services/analysisEngine.js';
const mock = [
  { title: 'Camry SE 2019', dailyPrice: 42, trips: 127, rating: 4.9 },
  { title: 'Camry LE 2020', dailyPrice: 45, trips: 98, rating: 4.7 },
  { title: 'Camry XSE 2021', dailyPrice: 52, trips: 84, rating: 4.8 },
];
const result = analyzeListings(mock, 17000);
console.log(JSON.stringify(result, null, 2));
"
```

Verify: ROI, supply/demand, revenue per listing, competitive density all populated.

**Step 3: Commit**

```bash
git add server/services/analysisEngine.js
git commit -m "feat: add 5-metric analysis engine"
```

---

### Task 4: Build Claude AI Summary Service

**Files:**
- Create: `server/services/aiSummary.js`
- Modify: `server/package.json` (add @anthropic-ai/sdk)

**Step 1: Install Anthropic SDK**

```bash
cd server
npm install @anthropic-ai/sdk
```

**Step 2: Create the AI summary service**

Create `server/services/aiSummary.js`:
```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

/**
 * Generate an investment-grade AI summary using Claude.
 */
export async function generateSummary(searchQuery, city, metrics, rankedByVolume, rankedByProfit) {
  const prompt = `You are a Turo car rental market analyst. Derek is considering buying a car to rent on Turo in ${city}. He searched for "${searchQuery}".

Here is the market data:

## Listings Found: ${metrics.competitiveDensity.totalListings}

## Supply/Demand
- Total listings: ${metrics.supplyDemand.totalListings}
- Avg trips per listing: ${metrics.supplyDemand.avgTripsPerListing}
- Supply/Demand score: ${metrics.supplyDemand.score} (higher = less saturated)

## Revenue Per Listing
- Average monthly gross: $${metrics.revenuePerListing.average}
- Median monthly gross: $${metrics.revenuePerListing.median}
- Top 25%: $${metrics.revenuePerListing.top25}
- Bottom 25%: $${metrics.revenuePerListing.bottom25}

## Competitive Density
- Saturation: ${metrics.competitiveDensity.saturation}
- Avg daily price: $${metrics.competitiveDensity.avgDailyPrice}
- Price range: $${metrics.competitiveDensity.priceRange.min} - $${metrics.competitiveDensity.priceRange.max}

${metrics.roi ? `## ROI (at $${metrics.roi.purchasePrice} purchase price)
- Est. monthly net profit: $${metrics.roi.avgMonthlyProfit}
- Months to breakeven: ${metrics.roi.monthsToBreakeven || 'N/A'}
- Annual ROI: ${metrics.roi.annualROI}%` : '## ROI: No purchase price provided'}

## Top Cars by Volume
${rankedByVolume.slice(0, 5).map((l, i) => `${i + 1}. ${l.title} — ${l.trips} trips, $${l.dailyPrice}/day, ~$${l.monthlyNetEst}/mo net`).join('\n')}

## Top Cars by Net Profit
${rankedByProfit.slice(0, 5).map((l, i) => `${i + 1}. ${l.title} — $${l.monthlyNetEst}/mo net, ${l.trips} trips, $${l.dailyPrice}/day`).join('\n')}

Based on this data, provide a concise investment analysis (3-5 sentences). Include:
1. A clear BUY or PASS recommendation
2. The best specific year/trim to target and why
3. Expected monthly profit range
4. Key risk or opportunity (saturation, pricing, competition)

Be direct and actionable. Derek is a car guy, not a finance guy. Talk like a knowledgeable friend, not a textbook.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}
```

**Step 3: Commit**

```bash
git add server/services/aiSummary.js server/package.json server/package-lock.json
git commit -m "feat: add Claude AI investment summary service"
```

---

### Task 5: Wire Up the Search API Endpoint

**Files:**
- Modify: `server/index.js`

**Step 1: Add the `/api/search` POST endpoint**

Update `server/index.js` to import services and add the route:
```js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { scrapeTuroListings } from './services/turoScraper.js';
import { analyzeListings } from './services/analysisEngine.js';
import { generateSummary } from './services/aiSummary.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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

    // 1. Scrape Turo
    const scrapeResult = await scrapeTuroListings(make, model, city);

    if (scrapeResult.listings.length === 0) {
      return res.json({
        success: false,
        error: 'No listings found. Try a different car or city.',
        city: scrapeResult.city,
        searchQuery: scrapeResult.searchQuery,
      });
    }

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
      totalListings: analysis.totalListings,
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

**Step 2: Test end-to-end with curl**

```bash
# Start server with your API key
ANTHROPIC_API_KEY=your_key npm run dev

# Test search
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota","model":"Camry","city":"charlotte","purchasePrice":17000}'
```

Verify: response contains metrics, rankedByVolume, rankedByProfit, aiSummary.

**Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: wire up /api/search endpoint with scraper + analysis + AI"
```

---

### Task 6: Initialize React Frontend

**Files:**
- Create: `client/` (Vite project)

**Step 1: Scaffold Vite + React project**

```bash
cd /Users/joegrady/Development/projects/dereks-turo-metrics
npm create vite@latest client -- --template react
cd client
npm install
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2: Configure Tailwind with Vite**

Update `client/vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

Replace `client/src/index.css` with:
```css
@import "tailwindcss";
```

**Step 3: Add Google Fonts to `client/index.html`**

Add in `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet">
```

**Step 4: Verify it runs**

```bash
cd client && npm run dev
# Should open on http://localhost:5173
```

**Step 5: Commit**

```bash
git add client/
git commit -m "feat: scaffold React + Vite + Tailwind frontend"
```

---

### Task 7: Build Frontend Components — Search Panel

**Files:**
- Create: `client/src/components/SearchPanel.jsx`
- Create: `client/src/data/cars.js`
- Create: `client/src/components/CarDropdown.jsx`

**Step 1: Create car data file**

Move the car list from the mockup `index.html` into `client/src/data/cars.js` (the same CARS object with 20+ makes and models).

**Step 2: Build CarDropdown component**

Port the searchable dropdown logic from the mockup into a React component with:
- Type-to-filter
- Grouped by make
- Arrow key navigation
- Blur validation (clears invalid input)

**Step 3: Build SearchPanel component**

Contains:
- `CarDropdown` for make/model
- City `<select>` dropdown (NC cities)
- Purchase price input (optional, number, placeholder "$17,000")
- Sort toggle (Volume / Profit)
- Analyze button (calls parent `onSearch` callback)

**Step 4: Verify in browser**

The search panel should render with all inputs functional.

**Step 5: Commit**

```bash
git add client/src/
git commit -m "feat: add SearchPanel with searchable car dropdown"
```

---

### Task 8: Build Frontend Components — Results Display

**Files:**
- Create: `client/src/components/AISummary.jsx`
- Create: `client/src/components/MetricCards.jsx`
- Create: `client/src/components/DataTable.jsx`
- Create: `client/src/components/LoadingState.jsx`

**Step 1: Build LoadingState component**

Port the spinning gears SVG animation from the mockup. Accept `city` and `searchQuery` props for the loading message.

**Step 2: Build AISummary component**

The green-bordered card with AI badge. Accept `summary` string prop. Render markdown-like text.

**Step 3: Build MetricCards component**

A row of 4 cards showing:
- ROI (breakeven months + annual ROI %)
- Supply/Demand Score
- Avg Monthly Revenue
- Market Saturation level

Accept `metrics` prop. Use the neon green / dark card styling from mockup.

**Step 4: Build DataTable component**

Reusable table component. Props: `title`, `data`, `columns`, `icon`.
Used twice: once for Volume ranking, once for Profit ranking.

**Step 5: Commit**

```bash
git add client/src/components/
git commit -m "feat: add results display components (AI summary, metrics, tables)"
```

---

### Task 9: Wire Up App.jsx — Connect Frontend to Backend

**Files:**
- Modify: `client/src/App.jsx`

**Step 1: Build the main App component**

Wire together:
1. SearchPanel → calls `POST /api/search` on Analyze click
2. Show LoadingState while fetching (expect 5-15 sec)
3. On response, show AISummary + MetricCards + DataTables
4. Handle errors gracefully

**Step 2: Apply dark theme styling**

Port CSS variables and dark theme from mockup:
- Background: `#0a0a0a`
- Neon green: `#00ff6a`
- Checkered racing stripes (top + bottom)
- Background gear SVGs
- Noise texture overlay

**Step 3: Test full flow**

```bash
# Terminal 1: backend
cd server && ANTHROPIC_API_KEY=your_key npm run dev

# Terminal 2: frontend
cd client && npm run dev
```

Select a car, city, enter a price, click Analyze. Verify full flow works.

**Step 4: Commit**

```bash
git add client/src/
git commit -m "feat: connect frontend to backend, full search flow working"
```

---

### Task 10: Mobile Responsiveness

**Files:**
- Modify: `client/src/App.jsx` and component files

**Step 1: Add responsive breakpoints**

- Stack search fields vertically on mobile
- Full-width sort toggle and Analyze button
- Stack data tables vertically (no side-by-side)
- Scale down fonts and padding
- Hide $/Day column on very small screens (< 400px)
- Thinner checkered stripes on mobile

**Step 2: Test on mobile viewport**

Use Chrome DevTools responsive mode. Test iPhone SE, iPhone 14, and a mid-range Android width.

**Step 3: Commit**

```bash
git add client/src/
git commit -m "feat: add mobile responsive design"
```

---

### Task 11: Deploy

**Files:**
- Create: `client/vercel.json` (if needed)
- Create: `server/Procfile` (for Railway)

**Step 1: Deploy backend to Railway**

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login and deploy
cd server
railway login
railway init
railway up
```

Set environment variable `ANTHROPIC_API_KEY` in Railway dashboard.
Note the deployed URL (e.g. `https://titsy-turo-metrics-production.up.railway.app`).

**Step 2: Update frontend API URL**

In `client/vite.config.js` or via environment variable, point production API calls to the Railway URL.

**Step 3: Deploy frontend to Vercel**

```bash
cd client
npx vercel --prod
```

Note the deployed URL (e.g. `https://dereks-titsy-turo-metrics.vercel.app`).

**Step 4: Update backend CORS**

Add the Vercel URL to the CORS allowed origins in `server/index.js`.

**Step 5: Test production**

Visit the Vercel URL, run a search, verify everything works end-to-end.

**Step 6: Commit any deploy config**

```bash
git add .
git commit -m "feat: add deployment config for Vercel + Railway"
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Initialize Express backend | Quick |
| 2 | Turo Puppeteer scraper | Core |
| 3 | 5-metric analysis engine | Core |
| 4 | Claude AI summary service | Quick |
| 5 | Wire up /api/search endpoint | Quick |
| 6 | Scaffold React + Vite frontend | Quick |
| 7 | Search panel + car dropdown | UI |
| 8 | Results display components | UI |
| 9 | Connect frontend to backend | Integration |
| 10 | Mobile responsiveness | Polish |
| 11 | Deploy to Vercel + Railway | Deploy |
