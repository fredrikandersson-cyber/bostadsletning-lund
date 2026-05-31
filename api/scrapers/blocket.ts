import { chromium } from 'playwright';
import type { Browser } from 'playwright';

export interface ScrapedListing {
  externalId: string;
  source: string;
  title: string;
  description?: string;
  price: number;
  rooms?: number;
  area?: number;
  address: string;
  imageUrl?: string;
  url: string;
  landlordType: 'private' | 'company';
  petFriendly: boolean;
  hasFurnished: boolean;
  hasBalcony: boolean;
  listedAt: Date;
}

const BLOCKET_URL = 'https://www.blocket.se/bostad/uthyres/lagenheter?area=skane&q=lund&sortby=date';

export async function scrapeBlocket(browser?: Browser): Promise<ScrapedListing[]> {
  const ownBrowser = !browser;
  const b = browser ?? await chromium.launch({ headless: true });

  try {
    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      locale: 'sv-SE',
    });
    const page = await context.newPage();

    // Block unnecessary resources to speed up scraping
    await page.route('**/*.{png,jpg,jpeg,gif,webp,woff,woff2,ttf,svg}', r => r.abort());
    await page.route('**/analytics**', r => r.abort());
    await page.route('**/tracking**', r => r.abort());

    await page.goto(BLOCKET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for listing cards to appear
    await page.waitForSelector('article, [data-testid*="list"], [class*="ListItem"]', {
      timeout: 15000,
    }).catch(() => null);

    const listings = await page.evaluate(() => {
      const results: any[] = [];

      // Try to extract from __NEXT_DATA__ first
      const nextDataEl = document.getElementById('__NEXT_DATA__');
      if (nextDataEl) {
        try {
          const data = JSON.parse(nextDataEl.textContent || '{}');
          const items =
            data?.props?.pageProps?.listings ||
            data?.props?.pageProps?.initialData?.listings ||
            data?.props?.pageProps?.searchResult?.listings ||
            [];
          if (items.length > 0) return items;
        } catch {}
      }

      // Fallback: scrape DOM
      const cards = document.querySelectorAll('article, [data-testid*="list-item"], [class*="ArticleCard"], [class*="ListItemCard"]');
      cards.forEach((card) => {
        const link = card.querySelector('a[href*="/annons/"]') as HTMLAnchorElement;
        if (!link) return;

        const href = link.href;
        const id = href.split('/').pop()?.split('?')[0] || '';
        const title = card.querySelector('h2, h3, [class*="Title"]')?.textContent?.trim() || '';
        const priceEl = card.querySelector('[class*="Price"], [class*="price"]');
        const priceText = priceEl?.textContent || '';
        const price = parseInt(priceText.replace(/\D/g, ''), 10);
        if (!price || price < 3000 || price > 50000) return;

        const addressEl = card.querySelector('[class*="Location"], [class*="location"], [class*="area"]');
        const img = card.querySelector('img')?.src;

        results.push({
          id, href, title, priceText, price,
          address: addressEl?.textContent?.trim() || 'Lund',
          imageUrl: img,
        });
      });

      return results;
    });

    await context.close();

    // If we got raw DOM-scraped items, map them to ScrapedListing
    if (listings.length > 0 && listings[0].id !== undefined && !listings[0].ad_id) {
      return listings
        .filter((l: any) => l.price > 0)
        .map((l: any): ScrapedListing => ({
          externalId: `blocket-${l.id}`,
          source: 'blocket',
          title: l.title || 'Annons på Blocket',
          price: l.price,
          address: l.address,
          imageUrl: l.imageUrl,
          url: l.href,
          landlordType: 'private',
          petFriendly: false,
          hasFurnished: l.title?.toLowerCase().includes('möbl') || false,
          hasBalcony: l.title?.toLowerCase().includes('balkong') || false,
          listedAt: new Date(),
        }));
    }

    // Map from __NEXT_DATA__ format
    return listings
      .filter((item: any) => {
        const price = parseInt(String(item.price?.value || item.price || 0).replace(/\D/g, ''), 10);
        return price > 3000 && price < 50000;
      })
      .map((item: any): ScrapedListing => {
        const price = parseInt(String(item.price?.value || item.price || 0).replace(/\D/g, ''), 10);
        const id = String(item.ad_id || item.id || '');
        const loc = item.location;
        const address = typeof loc === 'string' ? loc
          : [loc?.street, loc?.area, loc?.city].filter(Boolean).join(', ') || 'Lund';

        return {
          externalId: `blocket-${id}`,
          source: 'blocket',
          title: item.subject || item.title || 'Annons på Blocket',
          description: item.body,
          price,
          rooms: extractNumber(item.rooms?.value),
          area: extractArea(item.size?.value),
          address,
          imageUrl: item.images?.[0]?.url || item.thumbnail_url,
          url: `https://www.blocket.se/${id}`,
          landlordType: item.store ? 'company' : 'private',
          petFriendly: false,
          hasFurnished: false,
          hasBalcony: false,
          listedAt: new Date(item.list_time || item.date || Date.now()),
        };
      });
  } finally {
    if (ownBrowser) await b.close();
  }
}

function extractNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(String(raw).replace(/\D/g, ''), 10);
  return isNaN(n) ? undefined : n;
}

function extractArea(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const m = String(raw).match(/([\d,.]+)/);
  return m ? parseFloat(m[1].replace(',', '.')) : undefined;
}
