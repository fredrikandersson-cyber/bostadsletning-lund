// Vercel Serverless Function - uses Claude API to analyze and prioritize listings

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { listings, filters } = req.body;

    if (!listings || !Array.isArray(listings)) {
      return res.status(400).json({ error: 'Invalid listings provided' });
    }

    if (listings.length === 0) {
      return res.status(200).json({
        listings: [],
        summary: 'Inga bostäder hittades med dina sökkriterier.'
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      // Fallback: return listings with basic priority if API key missing
      return res.status(200).json({
        listings: listings.map((l, idx) => ({
          ...l,
          priority: listings.length - idx,
          reason: 'Sorterad efter nyaste först',
          highlights: buildHighlights(l)
        })),
        summary: `Hittade ${listings.length} bostäder. Sorterade efter datum.`
      });
    }

    // Import Anthropic SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });

    // Build context for Claude
    const filterSummary = buildFilterSummary(filters);
    const listingsText = listings
      .slice(0, 30) // Limit to top 30 to avoid token overload
      .map((l, i) =>
        `${i + 1}. ${l.title}\n   Hyra: ${l.price} kr/mån | ${l.rooms} rum | ${l.area} m² | ${l.pricePerSqm} kr/m²\n   Möblerad: ${l.furnished ? 'Ja' : 'Nej'} | Husdjur: ${l.petFriendly ? 'Ja' : 'Nej'}\n   URL: ${l.url}`
      )
      .join('\n\n');

    const prompt = `Du är en expert på bostadssökning i Lund. Här är användarens sökkriterier och en lista över matchande bostäder.

SÖKKRITERIER:
${filterSummary}

HITTADE BOSTÄDER:
${listingsText}

Din uppgift:
1. Analysera vilka bostäder som bäst matchar användarens kriterier
2. Prioritera dem (1 = högsta prioritet)
3. För varje bostäd, ge 2-3 korta höjdpunkter/varningar på svenska
4. Skriv en kort sammanfattning (2-3 meningar) av det övergripande erbjudandet
5. Identifiera den bästa rekommendationen om det finns en överlägsen match

Svara i JSON-format:
{
  "analyses": [
    {
      "id": "listing_id",
      "priority": 1,
      "reason": "Kort förklaring varför denna prioriteras",
      "highlights": ["Höjdpunkt 1", "Höjdpunkt 2", "Möjlig varning"]
    }
  ],
  "summary": "Övergripande sammanfattning av erbjudandet",
  "topRecommendation": "Kort rekommendation av den bästa annonsen eller null"
}`;

    const message = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse Claude response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Merge analysis results back with full listing data (using index-based matching)
    const enhancedListings = listings.map((listing, idx) => {
      const analysis_item = analysis.analyses?.[idx];
      return {
        ...listing,
        priority: analysis_item?.priority || idx + 1,
        reason: analysis_item?.reason || 'AI-analys ej tillgänglig',
        highlights: analysis_item?.highlights || buildHighlights(listing)
      };
    });

    // Sort by priority
    enhancedListings.sort((a, b) => a.priority - b.priority);

    res.status(200).json({
      listings: enhancedListings,
      summary: analysis.summary || `Hittade ${listings.length} matchande bostäder`,
      topRecommendation: analysis.topRecommendation
    });

  } catch (err) {
    console.error('Analysis API error:', err);
    // Graceful fallback - return listings with basic analysis
    const { listings } = req.body;
    if (listings && Array.isArray(listings)) {
      return res.status(200).json({
        listings: listings.map((l, idx) => ({
          ...l,
          priority: listings.length - idx,
          reason: 'Sorterad efter nyaste först',
          highlights: buildHighlights(l)
        })),
        summary: `Hittade ${listings.length} bostäder. (AI-analys ej tillgänglig)`
      });
    }
    res.status(500).json({ error: 'Analysis failed', listings: [] });
  }
}

function buildFilterSummary(filters) {
  const parts = [];

  if (filters.minPrice > 0 || filters.maxPrice < 20000) {
    parts.push(`Hyra: ${filters.minPrice}-${filters.maxPrice} kr/mån`);
  }
  if (filters.minRooms > 1 || filters.maxRooms < 5) {
    parts.push(`Rum: ${filters.minRooms}-${filters.maxRooms}`);
  }
  if (filters.minArea > 0 || filters.maxArea < 150) {
    parts.push(`Storlek: ${filters.minArea}-${filters.maxArea} m²`);
  }
  if (filters.maxPricePerSqm) {
    parts.push(`Max hyra/m²: ${filters.maxPricePerSqm} kr`);
  }
  if (filters.furnished) {
    parts.push('Möblerad: Ja');
  }
  if (filters.petFriendly) {
    parts.push('Husdjur: Tillåtet');
  }
  if (filters.selectedAreas && filters.selectedAreas.length > 0) {
    parts.push(`Stadsdelar: ${filters.selectedAreas.join(', ')}`);
  }
  if (filters.leaseType && filters.leaseType !== 'all') {
    const leaseTypeLabel = filters.leaseType === 'long_term' ? 'Förstahand' : 'Andrahand';
    parts.push(`Kontraktstyp: ${leaseTypeLabel}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'Alla bostäder';
}

function buildHighlights(listing) {
  const highlights = [];

  // Price insight
  if (listing.pricePerSqm) {
    if (listing.pricePerSqm < 150) {
      highlights.push('💰 Bra pris per m²');
    } else if (listing.pricePerSqm > 250) {
      highlights.push('⚠️ Högt pris per m²');
    }
  }

  // Size insight
  if (listing.area && listing.area > 80) {
    highlights.push('📐 Större lägenhet');
  }

  // Special features
  if (listing.furnished) {
    highlights.push('✓ Möblerad');
  }
  if (listing.petFriendly) {
    highlights.push('🐾 Husdjur OK');
  }

  if (highlights.length === 0) {
    highlights.push('Standard lägenhet');
  }

  return highlights;
}
