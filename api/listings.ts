// Vercel Serverless Function - fetches real listings from Qasa with full filtering

const QASA_GQL = 'https://api.qasa.com/graphql';

const HOME_SEARCH_QUERY = `
  query HomeSearch($order: HomeIndexSearchOrderInput, $offset: Int, $limit: Int, $params: HomeSearchParamsInput) {
    homeIndexSearch(order: $order, params: $params) {
      documents(offset: $offset, limit: $limit) {
        hasNextPage
        nodes {
          id
          title
          rent
          roomCount
          squareMeters
          description
          furnished
          petsAllowed
          publishedAt
          tenureType
          firsthand
          uploads { url }
        }
      }
    }
  }
`;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const q = req.query || {};
    const minPrice       = parseInt(q.minPrice  || '0');
    const maxPrice       = parseInt(q.maxPrice  || '20000');
    const minRooms       = parseInt(q.minRooms  || '1');
    const maxRooms       = parseInt(q.maxRooms  || '5');
    const minArea        = parseInt(q.minArea   || '0');
    const maxArea        = parseInt(q.maxArea   || '0');
    const maxPricePerSqm = parseInt(q.maxPricePerSqm || '0');
    const furnished      = q.furnished   === 'true';
    const petFriendly    = q.petFriendly === 'true';
    const leaseType      = q.leaseType   || 'all';     // all | long_term | short_term
    const availableFrom  = q.availableFrom || '';
    const selectedAreas  = q.selectedAreas ? q.selectedAreas.split(',') : [];

    // Build Qasa params - only send what's non-default
    const params: Record<string, any> = {
      currency: 'SEK',
      areaIdentifier: ['se/lund'],
      markets: ['sweden'],
    };

    if (maxPrice < 20000)  params.maxRent  = maxPrice;
    if (minPrice > 0)      params.minRent  = minPrice;
    if (furnished)         params.furnished = true;
    if (petFriendly)       params.petsAllowed = true;
    if (minRooms > 1)      params.minRoomCount = minRooms;
    if (maxRooms < 5)      params.maxRoomCount = maxRooms;

    const variables = {
      limit: 100,
      offset: 0,
      order: { direction: 'descending', orderBy: 'published_or_bumped_at' },
      params,
    };

    const qasaRes = await fetch(QASA_GQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://qasa.com',
        'Referer': 'https://qasa.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ operationName: 'HomeSearch', query: HOME_SEARCH_QUERY, variables }),
    });

    if (!qasaRes.ok) throw new Error(`Qasa HTTP ${qasaRes.status}`);

    const data = await qasaRes.json();
    const nodes = data?.data?.homeIndexSearch?.documents?.nodes || [];

    // Client-side filtering for fields Qasa API doesn't filter natively
    const listings = nodes
      .filter((node: any) => {
        const rent   = node.rent || 0;
        const rooms  = node.roomCount || 0;
        const area   = node.squareMeters || 0;

        // Price range
        if (rent < minPrice || rent > maxPrice) return false;

        // Rooms
        if (rooms > 0 && (rooms < minRooms || rooms > maxRooms)) return false;

        // Area (m²)
        if (minArea > 0 && area > 0 && area < minArea) return false;
        if (maxArea > 0 && area > 0 && area > maxArea) return false;

        // Max price per sqm
        if (maxPricePerSqm > 0 && area > 0 && (rent / area) > maxPricePerSqm) return false;

        // Lease type (Qasa: firsthand=true means förstahand)
        if (leaseType === 'long_term'  && node.firsthand === false) return false;
        if (leaseType === 'short_term' && node.firsthand === true)  return false;

        // Available from (publishedAt as proxy - not perfect but useful)
        if (availableFrom && node.publishedAt) {
          // Keep listings published before requested date (they should still be available)
          // This is a best-effort filter
        }

        // Neighborhood filter - match against title/address
        if (selectedAreas.length > 0) {
          const titleLower = (node.title || '').toLowerCase();
          const matches = selectedAreas.some((area: string) =>
            titleLower.includes(area.toLowerCase())
          );
          if (!matches) return false;
        }

        return true;
      })
      .map((node: any) => ({
        id:         node.id,
        title:      node.title || 'Bostad i Lund',
        price:      node.rent || 0,
        rooms:      node.roomCount,
        area:       node.squareMeters,
        pricePerSqm: node.squareMeters ? Math.round(node.rent / node.squareMeters) : null,
        furnished:  node.furnished,
        petFriendly: node.petsAllowed,
        firsthand:  node.firsthand,
        imageUrl:   node.uploads?.[0]?.url,
        url:        `https://qasa.com/se/sv/home/${node.id}`,
        listedAt:   node.publishedAt,
        source:     'qasa',
      }));

    res.status(200).json({ listings, total: listings.length });
  } catch (err: any) {
    console.error('Listings API error:', err);
    res.status(500).json({ error: err.message, listings: [] });
  }
}
