import type { ScrapedListing } from './blocket.js';

const QASA_GQL = 'https://api.qasa.com/graphql';

// Exact query format captured from Qasa's browser app
const HOME_SEARCH_QUERY = `
  query HomeSearch($order: HomeIndexSearchOrderInput, $offset: Int, $limit: Int, $params: HomeSearchParamsInput) {
    homeIndexSearch(order: $order, params: $params) {
      documents(offset: $offset, limit: $limit) {
        hasNextPage
        nodes {
          id
          title
          rent
          currency
          roomCount
          squareMeters
          description
          furnished
          petsAllowed
          homeType
          publishedAt
          uploads { url }
        }
      }
    }
  }
`;

interface QasaNode {
  id: string;
  title?: string;
  rent?: number;
  currency?: string;
  roomCount?: number;
  squareMeters?: number;
  description?: string;
  furnished?: boolean;
  petsAllowed?: boolean;
  homeType?: string;
  publishedAt?: string;
  uploads?: { url: string }[];
}

export async function scrapeQasa(): Promise<ScrapedListing[]> {
  const variables = {
    limit: 50,
    offset: 0,
    order: { direction: 'descending', orderBy: 'published_or_bumped_at' },
    params: {
      currency: 'SEK',
      areaIdentifier: ['se/lund'],
      markets: ['sweden', 'norway', 'finland'],
    },
  };

  const res = await fetch(QASA_GQL, {
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

  if (!res.ok) throw new Error(`Qasa HTTP ${res.status}`);

  const data = await res.json();

  if (data.errors?.length) {
    console.warn('[qasa] GraphQL errors:', data.errors[0]?.message);
  }

  const nodes: QasaNode[] = data?.data?.homeIndexSearch?.documents?.nodes || [];
  console.log(`[qasa] API returned ${nodes.length} listings`);

  console.log(`[qasa] ${nodes.length} Lund listings (filtered by se/lund area)`);

  return nodes.map((node): ScrapedListing => {
    const address = node.title || `Bostad i Lund (${node.id})`;

    return {
      externalId: `qasa-${node.id}`,
      source: 'qasa',
      title: node.title || `Qasa bostad`,
      description: node.description,
      price: node.rent || 0,
      rooms: node.roomCount,
      area: node.squareMeters,
      address: `${address}, Lund`,
      imageUrl: node.uploads?.[0]?.url,
      url: `https://qasa.com/se/sv/home/${node.id}`,
      landlordType: 'private',
      petFriendly: node.petsAllowed || false,
      hasFurnished: node.furnished || false,
      hasBalcony: false,
      listedAt: node.publishedAt ? new Date(node.publishedAt) : new Date(),
    };
  }).filter((l) => l.price > 0);
}
