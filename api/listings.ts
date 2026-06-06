// Vercel Serverless Function - fetches real listings from Qasa
// Deployed automatically by Vercel when placed in /api/ directory

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
          uploads { url }
        }
      }
    }
  }
`;

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Parse filter params from query string
    const minPrice = parseInt(req.query?.minPrice || '0');
    const maxPrice = parseInt(req.query?.maxPrice || '20000');
    const minRooms = parseInt(req.query?.minRooms || '1');
    const maxRooms = parseInt(req.query?.maxRooms || '5');
    const furnished = req.query?.furnished === 'true';
    const petFriendly = req.query?.petFriendly === 'true';

    const variables = {
      limit: 100,
      offset: 0,
      order: { direction: 'descending', orderBy: 'published_or_bumped_at' },
      params: {
        currency: 'SEK',
        areaIdentifier: ['se/lund'],
        markets: ['sweden'],
        ...(minPrice > 0 ? { minRent: minPrice } : {}),
        ...(maxPrice < 20000 ? { maxRent: maxPrice } : {}),
        ...(furnished ? { furnished: true } : {}),
      },
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

    if (!qasaRes.ok) {
      throw new Error(`Qasa HTTP ${qasaRes.status}`);
    }

    const data = await qasaRes.json();
    const nodes = data?.data?.homeIndexSearch?.documents?.nodes || [];

    // Filter and map listings
    const listings = nodes
      .filter((node: any) => {
        const rent = node.rent || 0;
        const rooms = node.roomCount || 0;
        if (rent < minPrice || rent > maxPrice) return false;
        if (rooms > 0 && (rooms < minRooms || rooms > maxRooms)) return false;
        if (petFriendly && !node.petsAllowed) return false;
        return true;
      })
      .map((node: any) => ({
        id: node.id,
        title: node.title || 'Bostad i Lund',
        price: node.rent || 0,
        rooms: node.roomCount,
        area: node.squareMeters,
        furnished: node.furnished,
        petFriendly: node.petsAllowed,
        imageUrl: node.uploads?.[0]?.url,
        url: `https://qasa.com/se/sv/home/${node.id}`,
        listedAt: node.publishedAt,
        source: 'qasa',
      }));

    res.status(200).json({ listings, total: listings.length });
  } catch (err: any) {
    console.error('Listings API error:', err);
    res.status(500).json({ error: err.message, listings: [] });
  }
}
