import { chromium } from 'playwright';
import type { Browser } from 'playwright';
import type { ScrapedListing } from './blocket.js';

const LKF_URL = 'https://www.lkf.se/ledigt/lagenhet';

export async function scrapeLKF(browser?: Browser): Promise<ScrapedListing[]> {
  const ownBrowser = !browser;
  const b = browser ?? await chromium.launch({ headless: true });

  try {
    const context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      locale: 'sv-SE',
    });
    const page = await context.newPage();

    await page.route('**/*.{png,jpg,jpeg,gif,webp,woff,woff2,ttf}', r => r.abort());
    await page.route('**/analytics**', r => r.abort());

    await page.goto(LKF_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Vue to finish rendering
    await page.waitForTimeout(2000);

    // Wait for the object list to appear (Vue-rendered)
    await page.waitForSelector(
      '.object-preview-headline-cc, [class*="object-preview"], .objectlist-cc article',
      { timeout: 10000 }
    ).catch(() => null);

    const listings = await page.evaluate(() => {
      const results: any[] = [];

      // LKF uses Vitec Arena Vue components - rendered as articles/cards
      const selectors = [
        '.objectlist-cc article',
        '.object-preview-cc',
        '[class*="object-preview"]',
        'article',
      ];

      let cards: NodeListOf<Element> | null = null;
      for (const sel of selectors) {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) {
          cards = found;
          break;
        }
      }

      if (!cards) return results;

      cards.forEach((card) => {
        try {
          // Address from headline
          const headline = card.querySelector('.object-preview-headline-cc h2, h2')?.textContent?.trim() || '';
          if (!headline) return;

          // Details link
          const link = card.querySelector('a[href*="/objekt/"], a[href*="/lagenhet/"], a.button-primary') as HTMLAnchorElement;
          const href = link?.href || '';

          // Price - look for kr/mån pattern
          const allText = card.textContent || '';
          const priceMatch = allText.match(/(\d[\d\s]+)\s*kr\s*\/\s*mån/i) ||
                             allText.match(/Hyra[:\s]+(\d[\d\s]+)\s*kr/i);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 0;

          // Area and rooms from description text
          const roomsMatch = allText.match(/(\d+)\s*(?:rum|r)\b/i);
          const areaMatch = allText.match(/([\d,.]+)\s*m²/i);

          // Extract unique ID from URL or headline
          const id = href.split('/').filter(Boolean).pop() ||
                     headline.replace(/[^a-zA-Z0-9åäö]/g, '-').toLowerCase();

          results.push({
            id,
            headline,
            href: href || LKF_URL,
            price,
            rooms: roomsMatch ? parseInt(roomsMatch[1], 10) : undefined,
            area: areaMatch ? parseFloat(areaMatch[1].replace(',', '.')) : undefined,
          });
        } catch {}
      });

      return results;
    });

    await context.close();

    return listings
      .filter((l: any) => l.price >= 4000 && l.price <= 25000)
      .map((l: any): ScrapedListing => ({
        externalId: `lkf-${l.id}`,
        source: 'lkf',
        title: `LKF – ${l.headline}`,
        price: l.price,
        rooms: l.rooms,
        area: l.area,
        address: `${l.headline}, Lund`,
        url: l.href.startsWith('http') ? l.href : `https://www.lkf.se${l.href}`,
        landlordType: 'company',
        petFriendly: false,
        hasFurnished: false,
        hasBalcony: false,
        listedAt: new Date(),
      }));
  } finally {
    if (ownBrowser) await b.close();
  }
}
