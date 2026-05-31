import type { ScrapedListing } from './blocket.js';

const API_URL = 'https://afbostader.se/DiremoApi/redimo/rest/vacantproducts?lang=sv_SE&type=1';

interface AFProduct {
  productId: string;
  type: string;
  shortDescription?: string;
  description?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  floor?: string;
  sqrMtrs?: string;
  rent?: string;
  moveInDate?: string;
  rooms?: string;
  shower?: string;
  balkony?: string;
  citchen?: string;
  elevator?: string;
  furniture?: string;
  priority?: string;
  objectnumber?: string;
  blueprint?: string;
}

export async function scrapeAFBostader(): Promise<ScrapedListing[]> {
  // AF Bostäder has a self-signed/intermediate cert issue – use https module with rejectUnauthorized: false
  const data = await new Promise<any>((resolve, reject) => {
    const https = require('https');
    https.get(API_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.afbostader.se/lediga-bostader',
        'Accept': 'application/json',
      },
      rejectUnauthorized: false,
    }, (res: any) => {
      if (res.statusCode !== 200) return reject(new Error(`AF Bostäder API HTTP ${res.statusCode}`));
      let d = ''; res.on('data', (c: any) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });

  const products: AFProduct[] = data?.product || [];

  // Only apartments in Lund (exclude corridors/storage etc if wanted)
  const apartments = products.filter(p =>
    (p.city || '').toUpperCase().includes('LUND') &&
    p.type !== 'Förråd' &&
    p.rent && parseInt(p.rent, 10) > 0
  );

  console.log(`[afbostader] ${products.length} total products, ${apartments.length} apartments in Lund`);

  return apartments.map((p): ScrapedListing => {
    const address = [p.address, p.city ? `${p.zipcode?.trim()} ${p.city}` : '']
      .filter(Boolean).join(', ');

    const isStudentRoom = p.type === 'Korridorrum' || p.shortDescription === 'Korridorrum';
    const title = `AF Bostäder – ${p.address || 'Lund'}${isStudentRoom ? ' (studentrum)' : ''}`;

    return {
      externalId: `afbostader-${p.productId}`,
      source: 'afbostader',
      title,
      description: p.description || undefined,
      price: parseInt(p.rent || '0', 10),
      rooms: p.rooms ? parseInt(p.rooms, 10) : (isStudentRoom ? 1 : undefined),
      area: p.sqrMtrs ? parseFloat(p.sqrMtrs) : undefined,
      address,
      imageUrl: p.blueprint || undefined,
      url: `https://www.afbostader.se/lediga-bostader/bostad/?id=${p.productId}&type=1`,
      landlordType: 'company',
      petFriendly: false,
      hasFurnished: p.furniture === 'true' || p.furniture === '1',
      hasBalcony: p.balkony === 'true' || p.balkony === '1',
      listedAt: p.moveInDate ? new Date(p.moveInDate) : new Date(),
    };
  });
}
