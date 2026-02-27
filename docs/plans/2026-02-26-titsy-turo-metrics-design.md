# Derek's Titsy Turo Metrics — Design Doc

## Purpose

A single-user web app for Derek to analyze the Turo car rental market in North Carolina. He searches by make/model and NC city, and gets ranked results plus an AI-generated investment recommendation. The X factor over Turo's own site: aggregated market intelligence, ROI projections, supply/demand analysis, and cost-adjusted profitability — things Turo doesn't surface.

## Architecture

```
React + Vite (Vercel)  →  Express API (Railway)  →  Turo search (Puppeteer scrape)
                                                 →  Claude API (AI investment analysis)
```

- **Frontend:** React 18 + Vite, TailwindCSS, deployed on Vercel (free)
- **Backend:** Node.js + Express, deployed on Railway (free tier)
- **Scraping:** Puppeteer headless browser scraping Turo search results
- **AI:** Anthropic Claude API (Haiku for cost efficiency)
- **No database** — all queries are live, no stored data

## Data Flow

1. Derek selects a car (searchable dropdown), NC city, and optionally enters a purchase price
2. Frontend calls `POST /api/search` with `{ make, model, city, purchasePrice? }`
3. Backend launches Puppeteer, navigates to Turo search for that make/model in the NC city
4. Backend scrapes all matching listings: daily price, trips completed, ratings, vehicle year/trim
5. Backend runs the analysis engine (5 metrics below)
6. Backend sends metrics + raw data to Claude API for investment-grade analysis
7. Frontend displays: AI investment summary + metric cards + ranked tables

## The 5 X-Factor Metrics

### 1. ROI Calculator
- Input: Derek's potential purchase price (e.g. $17,000)
- Output: months to breakeven, annual ROI %, projected monthly net profit
- Formula: monthly_profit = (avg_daily_rate × avg_monthly_trips × 0.75) - insurance - depreciation - maintenance
- Breakeven = purchase_price / monthly_profit

### 2. Supply/Demand Score
- Count total listings for this make/model in the market
- Calculate avg trips per listing
- Score = avg_trips_per_listing / total_listings (higher = less saturated, more demand)
- Show: "8 Tesla Model 3s averaging 22 trips each vs 47 Camrys averaging 11 trips each"

### 3. Revenue per Listing (Aggregated)
- Average and median revenue across ALL similar listings (not cherry-picked)
- Show distribution: top 25%, median, bottom 25%
- Revenue = daily_price × trips_completed

### 4. Competitive Density
- Total count of same make/model in the market area
- Average price across competitors
- Price positioning advice: "Price at $X to be competitive" or "Market is undersaturated, premium pricing viable"

### 5. Cost-Adjusted Profit Ranking
- Deductions: Turo's 25% cut, insurance (~$150/mo), depreciation (~$200/mo), maintenance (~$75/mo)
- Rank all searched cars by NET profit, not gross revenue
- A $42/day car with 20 trips beats a $58/day car with 10 trips after costs

## Cost Estimation Defaults

| Cost | Monthly Estimate | Notes |
|------|-----------------|-------|
| Turo cut | 25% of revenue | Standard host plan |
| Insurance | $150 | Commercial rental coverage |
| Depreciation | $200 | ~$2,400/yr on $20k vehicle |
| Maintenance | $75 | Oil, tires, cleaning, wear |
| **Total fixed costs** | **$425/mo** | Before Turo's cut |

## UI Design

- Dark theme: black background (#0a0a0a), neon green accents (#00ff6a)
- Racing/mechanic aesthetic: checkered stripes, rotating gear SVGs, Orbitron font
- Mobile-responsive: stacked layout on phones
- Components:
  - Search panel: car dropdown, city dropdown, optional purchase price input, analyze button
  - Loading state: spinning gears animation
  - AI Investment Summary card: Claude's analysis with buy/pass recommendation
  - Metric cards row: ROI, Supply/Demand Score, Avg Revenue, Competitive Density
  - Ranked tables: Top by Volume, Top by Net Profit

## Hosting & Costs

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel (free tier) | React frontend | $0/mo |
| Railway (free tier) | Express backend | $0/mo |
| Claude API (Haiku) | AI analysis | ~$1-3/mo |

**Total: ~$1-3/month** (Claude API only)

## Constraints

- Single user (Derek) — no auth needed, just a deployed URL
- Turo has no public API — scraping with Puppeteer (maintenance risk if site changes)
- On-demand scraping means 5-15 sec response times
- Free tier timeout limits on Railway (should be fine for single user)
- Cost estimation defaults are approximations — user can adjust purchase price
