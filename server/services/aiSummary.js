import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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

## Our Data-Driven Verdict: ${metrics.verdict.verdict} (Score: ${metrics.verdict.score}/100)
- Score breakdown: 65+ = BUY, 40-64 = MAYBE, below 40 = PASS
- This verdict is calculated from profit potential, demand (trips), competition level, and pricing.

IMPORTANT: Your recommendation MUST match our verdict of "${metrics.verdict.verdict}". Do not contradict the data-driven verdict. If the verdict is PASS, explain why the numbers don't support it. If BUY, explain why it's a good opportunity. If MAYBE, explain the trade-offs.

Based on this data, provide a concise investment analysis (3-5 sentences). Include:
1. Start with "RECOMMENDATION: ${metrics.verdict.verdict}" and explain why the data supports this
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
